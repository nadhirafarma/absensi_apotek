(function () {
  const DB_NAME = "nadhira-farma-obat-cache";
  const DB_VERSION = 1;
  const STORE_NAME = "medicines";
  const API_URL_KEY = "nadhira.obatApiUrl";
  const META_KEY = "nadhira.obatCacheMeta";
  const COLUMN_VISIBILITY_KEY = "nadhira.obatVisibleColumns";
  const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec?sheet=data_obat";
  const DEFAULT_VISIBLE_COLUMNS = {
    barcode: true,
    stock: true,
    purchaseUnit: true,
    expired: true,
    supplier: true,
    location: true,
    status: true,
    update: true,
    price1: true,
    price2: true,
    price3: true
  };

  const state = {
    db: null,
    medicines: [],
    visibleColumns: { ...DEFAULT_VISIBLE_COLUMNS },
    isSyncing: false,
    scannerStream: null,
    scannerFrame: null,
    barcodeDetector: null,
    zxingReader: null,
    zxingControls: null,
    torchOn: false
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindElements();
    state.visibleColumns = readVisibleColumns();
    hydrateColumnControls();
    bindEvents();

    els.apiUrlInput.value = normalizeApiUrl(localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL);
    els.searchInput.value = new URLSearchParams(window.location.search).get("q") || "";

    try {
      state.db = await openDatabase();
      state.medicines = sortMedicinesByName(await readAllMedicines());
      populateFilterOptions();
      renderResults();
      updateCacheSummary();
    } catch (error) {
      setStatus(`Cache lokal tidak bisa dibuka: ${error.message}`, "error");
    }

    const apiUrl = getApiUrl();
    const meta = readMeta();
    const lastChecked = meta.lastChecked || meta.lastSync || meta.lastChanged;
    const lastCheckTime = lastChecked ? new Date(lastChecked).getTime() : 0;
    const stale = Date.now() - lastCheckTime > 5 * 60 * 1000;

    if (apiUrl && stale && navigator.onLine) {
      syncMedicines({ silent: true });
    }

    window.addEventListener("focus", () => {
      const latestMeta = readMeta();
      const latestChecked = latestMeta.lastChecked || latestMeta.lastSync || latestMeta.lastChanged;
      const latestSync = latestChecked ? new Date(latestChecked).getTime() : 0;
      const needsRefresh = Date.now() - latestSync > 2 * 60 * 1000;
      if (getApiUrl() && needsRefresh && navigator.onLine) {
        syncMedicines({ silent: true });
      }
    });
  }

  function bindElements() {
    els.searchForm = document.getElementById("searchForm");
    els.searchInput = document.getElementById("searchInput");
    els.scanButton = document.getElementById("scanButton");
    els.filterButton = document.getElementById("filterButton");
    els.syncButton = document.getElementById("syncButton");
    els.syncLabel = els.syncButton.querySelector(".sync-label");
    els.scannerPanel = document.getElementById("scannerPanel");
    els.barcodeVideo = document.getElementById("barcodeVideo");
    els.scannerStatus = document.getElementById("scannerStatus");
    els.closeScannerButton = document.getElementById("closeScannerButton");
    els.flashButton = document.getElementById("flashButton");
    els.filtersPanel = document.getElementById("filtersPanel");
    els.resetFiltersButton = document.getElementById("resetFiltersButton");
    els.filterStock = document.getElementById("filterStock");
    els.filterStatus = document.getElementById("filterStatus");
    els.filterSupplier = document.getElementById("filterSupplier");
    els.filterSatuanBeli = document.getElementById("filterSatuanBeli");
    els.filterExpired = document.getElementById("filterExpired");
    els.statusOptions = document.getElementById("statusOptions");
    els.supplierOptions = document.getElementById("supplierOptions");
    els.satuanBeliOptions = document.getElementById("satuanBeliOptions");
    els.settingsButton = document.getElementById("settingsButton");
    els.settingsPanel = document.getElementById("settingsPanel");
    els.apiUrlInput = document.getElementById("apiUrlInput");
    els.saveApiButton = document.getElementById("saveApiButton");
    els.clearCacheButton = document.getElementById("clearCacheButton");
    els.cacheStatus = document.getElementById("cacheStatus");
    els.medicineCount = document.getElementById("medicineCount");
    els.resultsArea = document.getElementById("resultsArea");
    els.closeResultsButton = document.getElementById("closeResultsButton");
    els.emptyState = document.getElementById("emptyState");
    els.resultsList = document.getElementById("resultsList");
    els.columnToggles = Array.from(document.querySelectorAll("[data-column]"));
  }

  function bindEvents() {
    els.searchForm.addEventListener("submit", (event) => event.preventDefault());
    els.searchInput.addEventListener("input", renderResults);
    els.scanButton.addEventListener("click", startScanner);
    els.filterButton.addEventListener("click", () => {
      els.filtersPanel.hidden = !els.filtersPanel.hidden;
    });
    els.barcodeVideo.addEventListener("click", handleScannerTapFocus);
    els.closeScannerButton.addEventListener("click", stopScanner);
    els.flashButton.addEventListener("click", toggleFlash);
    els.closeResultsButton.addEventListener("click", () => {
      setResultsVisible(false);
    });
    els.resultsArea.addEventListener("click", (event) => {
      if (event.target === els.resultsArea) {
        setResultsVisible(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.resultsArea.hidden) {
        setResultsVisible(false);
      }
    });
    els.syncButton.addEventListener("click", () => syncMedicines());
    window.addEventListener("beforeunload", stopScanner);

    [
      els.filterStock,
      els.filterStatus,
      els.filterSupplier,
      els.filterSatuanBeli,
      els.filterExpired
    ].forEach((control) => control.addEventListener("input", renderResults));

    els.columnToggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        state.visibleColumns[toggle.dataset.column] = toggle.checked;
        localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(state.visibleColumns));
        renderResults();
      });
    });

    els.resetFiltersButton.addEventListener("click", () => {
      els.filterStock.value = "";
      els.filterStatus.value = "";
      els.filterSupplier.value = "";
      els.filterSatuanBeli.value = "";
      els.filterExpired.value = "";
      state.visibleColumns = { ...DEFAULT_VISIBLE_COLUMNS };
      localStorage.removeItem(COLUMN_VISIBILITY_KEY);
      hydrateColumnControls();
      renderResults();
    });

    els.settingsButton.addEventListener("click", () => {
      els.settingsPanel.hidden = !els.settingsPanel.hidden;
      if (!els.settingsPanel.hidden) {
        els.apiUrlInput.focus();
      }
    });

    els.saveApiButton.addEventListener("click", () => {
      const apiUrl = normalizeApiUrl(els.apiUrlInput.value.trim());

      if (apiUrl) {
        localStorage.setItem(API_URL_KEY, apiUrl);
        els.apiUrlInput.value = apiUrl;
        setStatus("URL API tersimpan. Tekan Sinkronkan untuk mengambil data.", "success");
      } else {
        localStorage.removeItem(API_URL_KEY);
        setStatus("URL API dikosongkan.", "warning");
      }
    });

    els.clearCacheButton.addEventListener("click", async () => {
      await clearStore();
      localStorage.removeItem(META_KEY);
      state.medicines = [];
      els.searchInput.value = "";
      renderResults();
      updateCacheSummary();
      setStatus("Cache lokal sudah dikosongkan.", "success");
    });
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("nama", "nama", { unique: false });
          store.createIndex("barcode", "barcode", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function withStore(mode, callback) {
    return new Promise((resolve, reject) => {
      const transaction = state.db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const result = callback(store);

      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  function readAllMedicines() {
    return new Promise((resolve, reject) => {
      const transaction = state.db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async function replaceMedicines(medicines) {
    await withStore("readwrite", (store) => {
      store.clear();
      medicines.forEach((medicine) => store.put(medicine));
    });
  }

  async function clearStore() {
    await withStore("readwrite", (store) => {
      store.clear();
    });
  }

  async function syncMedicines(options = {}) {
    const apiUrl = getApiUrl();

    if (!apiUrl) {
      els.settingsPanel.hidden = false;
      els.apiUrlInput.focus();
      setStatus("Isi URL API Google Sheet terlebih dahulu.", "warning");
      return;
    }

    if (state.isSyncing) return;

    state.isSyncing = true;
    setSyncState(true);

    if (!options.silent) {
      setStatus("Mengambil data obat terbaru...", "info");
    }

    try {
      const response = await fetch(apiUrl, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.text();
      const rows = parsePayload(payload);

      if (looksLikeCredentialRows(rows)) {
        throw new Error("Endpoint ini berisi data akun, bukan data obat.");
      }

      const medicines = sortMedicinesByName(rows
        .map(normalizeMedicine)
        .filter(Boolean));

      if (!medicines.length) {
        throw new Error("Data obat kosong atau format kolom belum sesuai.");
      }

      const previousMeta = readMeta();
      const dataSignature = createMedicineSignature(medicines);
      const previousSignature = previousMeta.dataSignature || createMedicineSignature(state.medicines);
      const dataChanged = dataSignature !== previousSignature;
      const now = new Date().toISOString();

      await replaceMedicines(medicines);

      state.medicines = medicines;
      populateFilterOptions();
      localStorage.setItem(META_KEY, JSON.stringify({
        ...previousMeta,
        lastChecked: now,
        lastChanged: dataChanged ? now : previousMeta.lastChanged,
        dataSignature,
        source: apiUrl,
        total: medicines.length
      }));

      renderResults();
      updateCacheSummary();

      if (!options.silent && !dataChanged) {
        setStatus("Data sudah terbaru. Belum ada perubahan di Google Sheet.", "success");
      }
    } catch (error) {
      setStatus(`Sinkronisasi gagal: ${error.message}`, "error");
    } finally {
      state.isSyncing = false;
      setSyncState(false);
    }
  }

  function parsePayload(payload) {
    const text = payload.trim();

    if (!text) return [];

    if (text.startsWith("{") || text.startsWith("[")) {
      const json = JSON.parse(text);

      if (Array.isArray(json)) return json;
      if (Array.isArray(json.data)) return json.data;
      if (Array.isArray(json.obat)) return json.obat;
      if (Array.isArray(json.records)) return json.records;
      if (Array.isArray(json.values)) return matrixToObjects(json.values);

      const values = Object.values(json);
      if (values.every((value) => value && typeof value === "object" && !Array.isArray(value))) {
        return values;
      }
    }

    return parseCsv(text);
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let insideQuote = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const nextChar = text[index + 1];

      if (char === '"' && nextChar === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === "," && !insideQuote) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !insideQuote) {
        if (char === "\r" && nextChar === "\n") {
          index += 1;
        }
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell);
    rows.push(row);
    return matrixToObjects(rows.filter((item) => item.some(Boolean)));
  }

  function matrixToObjects(matrix) {
    if (!matrix.length) return [];

    const headers = matrix[0].map((header) => normalizeKey(header));
    return matrix.slice(1).map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index] || "";
      });
      return item;
    });
  }

  function normalizeMedicine(row, index) {
    const item = normalizeObjectKeys(row);
    const nama = pick(item, ["nama", "namaobat", "name", "obat", "namabarang", "produk", "item"]);
    const barcode = pick(item, ["barcode", "kodebarcode", "kode", "sku", "idobat", "id"]);

    if (!nama && !barcode) return null;

    const stok = pick(item, ["stok", "stock", "qty", "jumlah", "sisa", "persediaan"]);
    const satuanBeli = pick(item, ["satuanbeli"]);
    const satuan1 = pick(item, ["satuan1", "satuan", "satuanbeli", "unit", "kemasan"]);
    const satuan2 = pick(item, ["satuan2"]);
    const satuan3 = pick(item, ["satuan3"]);
    const harga1 = pick(item, ["harga1", "harga", "price", "hargajual", "jual"]);
    const harga2 = pick(item, ["harga2"]);
    const harga3 = pick(item, ["harga3"]);
    const kategori = pick(item, ["kategori", "category", "golongan", "jenis"]);
    const lokasi = pick(item, ["lokasi", "lokasirak", "rak", "lemari", "posisi"]);
    const expired = pick(item, ["expired", "exp", "kedaluwarsa", "kadaluarsa", "ed"]);
    const updated = pick(item, ["updatedat", "updated", "lastupdate", "tanggalupdate", "terakhirupdate"]);
    const suplier = pick(item, ["suplier", "supplier", "pemasok"]);
    const status = pick(item, ["status"]);
    const noBatch = pick(item, ["nobatch", "batch", "nobat"]);
    const id = String(barcode || slugify(nama) || `obat-${index}`);

    const medicine = {
      id,
      nama: cleanText(nama || barcode),
      barcode: cleanText(barcode),
      stok: cleanText(stok),
      satuanBeli: cleanText(satuanBeli),
      satuan: cleanText(satuan1),
      satuan1: cleanText(satuan1),
      satuan2: cleanText(satuan2),
      satuan3: cleanText(satuan3),
      harga: cleanText(harga1),
      harga1: cleanText(harga1),
      harga2: cleanText(harga2),
      harga3: cleanText(harga3),
      kategori: cleanText(kategori),
      lokasi: cleanText(lokasi),
      expired: cleanText(expired),
      updated: cleanText(updated),
      suplier: cleanText(suplier),
      status: cleanText(status),
      noBatch: cleanText(noBatch)
    };

    medicine.searchable = [
      medicine.nama,
      medicine.barcode,
      medicine.lokasi,
      medicine.suplier,
      medicine.status
    ].join(" ").toLowerCase();

    return medicine;
  }

  function looksLikeCredentialRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return false;

    return rows.slice(0, 5).some((row) => {
      const item = normalizeObjectKeys(row);
      const hasUser = item.username || item.user || item.email;
      const hasCredential = item.password || item.pass || item.role;
      return Boolean(hasUser && hasCredential);
    });
  }

  function normalizeObjectKeys(object) {
    return Object.entries(object || {}).reduce((result, [key, value]) => {
      result[normalizeKey(key)] = value;
      return result;
    }, {});
  }

  function normalizeKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function pick(object, keys) {
    for (const key of keys) {
      if (object[key] !== undefined && object[key] !== null && String(object[key]).trim() !== "") {
        return object[key];
      }
    }
    return "";
  }

  function cleanText(value) {
    return String(value || "").trim();
  }

  function sortMedicinesByName(medicines) {
    return [...medicines].sort((a, b) => {
      const nameCompare = String(a.nama || "").localeCompare(String(b.nama || ""), "id-ID", {
        numeric: true,
        sensitivity: "base"
      });

      if (nameCompare !== 0) return nameCompare;

      return String(a.barcode || "").localeCompare(String(b.barcode || ""), "id-ID", {
        numeric: true,
        sensitivity: "base"
      });
    });
  }

  function readVisibleColumns() {
    try {
      return {
        ...DEFAULT_VISIBLE_COLUMNS,
        ...JSON.parse(localStorage.getItem(COLUMN_VISIBILITY_KEY) || "{}")
      };
    } catch (error) {
      return { ...DEFAULT_VISIBLE_COLUMNS };
    }
  }

  function hydrateColumnControls() {
    if (!els.columnToggles) return;

    els.columnToggles.forEach((toggle) => {
      toggle.checked = state.visibleColumns[toggle.dataset.column] !== false;
    });
  }

  function populateFilterOptions() {
    fillDatalist(els.statusOptions, uniqueValues(state.medicines.map((medicine) => formatDisplayText(medicine.status))));
    fillDatalist(els.supplierOptions, uniqueValues(state.medicines.map((medicine) => formatDisplayText(medicine.suplier))));
    fillDatalist(els.satuanBeliOptions, uniqueValues(state.medicines.map((medicine) => formatDisplayText(medicine.satuanBeli))));
  }

  function uniqueValues(values) {
    return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "id-ID", {
        numeric: true,
        sensitivity: "base"
      }))
      .slice(0, 120);
  }

  function fillDatalist(element, values) {
    if (!element) return;

    element.innerHTML = values
      .map((value) => `<option value="${escapeHtml(value)}"></option>`)
      .join("");
  }

  function applyRowFilters(medicines) {
    const stockFilter = els.filterStock.value;
    const statusFilter = normalizeSearchText(els.filterStatus.value);
    const supplierFilter = normalizeSearchText(els.filterSupplier.value);
    const satuanBeliFilter = normalizeSearchText(els.filterSatuanBeli.value);
    const expiredFilter = els.filterExpired.value;

    return medicines.filter((medicine) => {
      if (stockFilter && getStockState(medicine.stok).className !== stockFilter) return false;
      if (statusFilter && !normalizeSearchText(medicine.status).includes(statusFilter)) return false;
      if (supplierFilter && !normalizeSearchText(medicine.suplier).includes(supplierFilter)) return false;
      if (satuanBeliFilter && !normalizeSearchText(medicine.satuanBeli).includes(satuanBeliFilter)) return false;

      if (expiredFilter) {
        const hasExpired = Boolean(String(medicine.expired || "").trim().replace("-", ""));
        if (expiredFilter === "with" && !hasExpired) return false;
        if (expiredFilter === "without" && hasExpired) return false;
      }

      return true;
    });
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, " ");
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function renderResults() {
    const rawQuery = els.searchInput.value.trim();
    const query = rawQuery.toLowerCase();
    const shouldShowPopup = Boolean(query || hasActiveFilters());
    const searchFiltered = query
      ? state.medicines.filter((medicine) => medicine.searchable.includes(query))
      : state.medicines;
    const filtered = applyRowFilters(searchFiltered);
    const limited = sortMedicinesByName(filtered).slice(0, 60);

    if (!shouldShowPopup) {
      setResultsVisible(false);
      els.resultsList.hidden = true;
      els.resultsList.innerHTML = "";
      els.emptyState.hidden = true;
      els.medicineCount.textContent = `${state.medicines.length} data`;
      return;
    }

    setResultsVisible(true);
    els.resultsList.innerHTML = limited
      .map((medicine, index) => renderMedicineCard(medicine, index, rawQuery))
      .join("");
    els.resultsList.hidden = !limited.length;

    if (!state.medicines.length) {
      showEmpty("Belum ada data obat", "Tekan Sinkronkan untuk mengambil data obat terbaru ke cache lokal pengguna.");
    } else if (!filtered.length) {
      showEmpty("Data tidak ditemukan", "Coba ubah kata pencarian atau filter yang sedang aktif.");
    } else {
      els.emptyState.hidden = true;
    }

    els.medicineCount.textContent = `${filtered.length} dari ${state.medicines.length} data`;
  }

  function setResultsVisible(isVisible) {
    els.resultsArea.hidden = !isVisible;
    document.body.classList.toggle("has-search-popover", isVisible);
  }

  function hasActiveFilters() {
    return Boolean(
      els.filterStock.value ||
      els.filterStatus.value.trim() ||
      els.filterSupplier.value.trim() ||
      els.filterSatuanBeli.value.trim() ||
      els.filterExpired.value
    );
  }

  function renderMedicineCard(medicine, index, query) {
    const stock = getStockState(medicine.stok);
    const tone = getMedicineTone(medicine, index);
    const summary = [
      ["barcode", "Barcode", medicine.barcode],
      ["stock", "Stok", formatStockValue(medicine)],
      ["purchaseUnit", "Satuan Beli", formatDisplayText(medicine.satuanBeli)],
      ["expired", "Expired", formatDateValue(medicine.expired)],
      ["supplier", "Supplier", formatDisplayText(medicine.suplier)],
      ["location", "Lokasi", medicine.lokasi],
      ["status", "Status", formatDisplayText(medicine.status)],
      ["update", "Update", formatDateValue(medicine.updated)]
    ].filter(([key, , value]) => state.visibleColumns[key] !== false && value);
    const priceRows = [
      ["price1", "1", medicine.satuan1, medicine.harga1],
      ["price2", "2", medicine.satuan2, medicine.harga2],
      ["price3", "3", medicine.satuan3, medicine.harga3]
    ].filter(([key, , unit, price]) => state.visibleColumns[key] !== false && (unit || price));
    const priceTable = priceRows.length ? `
          <div class="price-table" aria-label="Satuan dan harga">
            <div class="price-table-head">
              <span>Level</span>
              <span>Satuan</span>
              <span>Harga</span>
            </div>
            ${priceRows.map(([, level, unit, price]) => `
              <div class="price-table-row">
                <span class="price-level">${escapeHtml(level)}</span>
                <strong class="price-unit">${escapeHtml(formatDisplayText(unit) || "-")}</strong>
                <strong class="price-value">${escapeHtml(formatPrice(price) || "-")}</strong>
              </div>
            `).join("")}
          </div>
    ` : "";

    return `
      <article class="medicine-card">
        <div class="medicine-main">
          <div class="medicine-title">
            <h2><span class="medicine-name-chip name-tone-${tone}">${highlightMedicineName(medicine.nama, query)}</span></h2>
            ${medicine.barcode ? `<p>${escapeHtml(medicine.barcode)}</p>` : ""}
          </div>
          <span class="stock-pill ${stock.className}">${escapeHtml(stock.label)}</span>
        </div>
        <div class="medicine-review ${priceRows.length ? "" : "single-column"}">
          <dl class="medicine-summary">
            ${summary.map(([key, label, value]) => `
              <div data-key="${escapeHtml(key)}">
                <dt>${escapeHtml(label)}</dt>
                <dd>${escapeHtml(value)}</dd>
              </div>
            `).join("")}
          </dl>
          ${priceTable}
        </div>
      </article>
    `;
  }

  function getMedicineTone(medicine, index) {
    const seed = String(medicine.nama || medicine.barcode || index);
    let hash = index + 1;

    for (let position = 0; position < seed.length; position += 1) {
      hash = (hash + seed.charCodeAt(position) * (position + 1)) % 997;
    }

    return (hash % 6) + 1;
  }
  function highlightMedicineName(value, query) {
    const text = String(value || "");
    const needle = String(query || "").trim();

    if (!needle) return escapeHtml(text);

    const matchIndex = text.toLowerCase().indexOf(needle.toLowerCase());

    if (matchIndex === -1) return escapeHtml(text);

    return [
      escapeHtml(text.slice(0, matchIndex)),
      `<mark>${escapeHtml(text.slice(matchIndex, matchIndex + needle.length))}</mark>`,
      escapeHtml(text.slice(matchIndex + needle.length))
    ].join("");
  }

  function createMedicineSignature(medicines) {
    return sortMedicinesByName(medicines).map((medicine) => JSON.stringify({
      barcode: medicine.barcode,
      expired: medicine.expired,
      harga1: medicine.harga1,
      harga2: medicine.harga2,
      harga3: medicine.harga3,
      id: medicine.id,
      lokasi: medicine.lokasi,
      nama: medicine.nama,
      satuan1: medicine.satuan1,
      satuan2: medicine.satuan2,
      satuan3: medicine.satuan3,
      satuanBeli: medicine.satuanBeli,
      status: medicine.status,
      stok: medicine.stok,
      suplier: medicine.suplier,
      updated: medicine.updated
    })).join("\n");
  }

  async function startScanner() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerStatus("Kamera tidak tersedia di browser ini.", "error");
      els.scannerPanel.hidden = false;
      return;
    }

    stopScanner({ keepPanelOpen: true });
    els.scannerPanel.hidden = false;
    setScannerStatus("Membuka kamera...", "info");

    try {
      state.scannerStream = await openScannerStream();
      els.barcodeVideo.srcObject = state.scannerStream;
      await els.barcodeVideo.play();
      await tuneScannerTrack();
      window.setTimeout(tuneScannerTrack, 700);
      setupFlashButton();

      if (await startZxingScanner(state.scannerStream)) return;

      if (!("BarcodeDetector" in window)) {
        setScannerStatus("Scanner belum siap. Coba muat ulang halaman saat internet aktif.", "error");
        return;
      }

      const supportedFormats = window.BarcodeDetector.getSupportedFormats
        ? await window.BarcodeDetector.getSupportedFormats()
        : [];
      const wantedFormats = [
        "ean_13",
        "ean_8",
        "code_128",
        "code_39",
        "itf",
        "upc_a",
        "upc_e",
        "qr_code"
      ];
      const formats = supportedFormats.length
        ? wantedFormats.filter((format) => supportedFormats.includes(format))
        : wantedFormats;

      state.barcodeDetector = formats.length
        ? new window.BarcodeDetector({ formats })
        : new window.BarcodeDetector();

      setScannerStatus("Kamera aktif. Ketuk gambar untuk fokus ulang.", "success");
      scanBarcodeFrame();
    } catch (error) {
      stopScanner({ keepPanelOpen: true });
      setScannerStatus(`Scanner gagal: ${error.message}`, "error");
    }
  }

  async function scanBarcodeFrame() {
    if (!state.barcodeDetector || !els.barcodeVideo.srcObject) return;

    try {
      if (els.barcodeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const barcodes = await state.barcodeDetector.detect(els.barcodeVideo);
        const rawValue = barcodes[0]?.rawValue?.trim();

        if (rawValue) {
          els.searchInput.value = rawValue;
          handleScannedBarcode(rawValue);
          stopScanner();
          return;
        }
      }
    } catch (error) {
      setScannerStatus(`Scanner gagal membaca: ${error.message}`, "error");
    }

    state.scannerFrame = window.requestAnimationFrame(scanBarcodeFrame);
  }

  async function startZxingScanner(stream) {
    const Reader = window.ZXingBrowser?.BrowserMultiFormatReader || window.ZXing?.BrowserMultiFormatReader;

    if (!Reader) {
      return false;
    }

    state.zxingReader = new Reader(undefined, {
      delayBetweenScanAttempts: 120,
      delayBetweenScanSuccess: 500,
      tryPlayVideoTimeout: 5000
    });

    const onResult = (result) => {
      const rawValue = (result?.getText ? result.getText() : result?.text || "").trim();
      if (!rawValue) return;
      handleScannedBarcode(rawValue);
      stopScanner();
    };

    const controls = state.zxingReader.decodeFromStream
      ? await state.zxingReader.decodeFromStream(stream, els.barcodeVideo, onResult)
      : await state.zxingReader.decodeFromVideoDevice(undefined, els.barcodeVideo, onResult);
    state.zxingControls = controls || null;
    window.setTimeout(setupFlashButton, 500);
    setScannerStatus("Kamera aktif. Ketuk gambar untuk fokus ulang.", "success");
    return true;
  }

  async function startFallbackScanner() {
    const Reader = window.ZXingBrowser?.BrowserMultiFormatReader || window.ZXing?.BrowserMultiFormatReader;

    if (!Reader) {
      setScannerStatus("Scanner Safari belum siap. Coba muat ulang halaman saat internet aktif.", "error");
      return;
    }

    state.zxingReader = new Reader(undefined, {
      delayBetweenScanAttempts: 120,
      delayBetweenScanSuccess: 500,
      tryPlayVideoTimeout: 5000
    });

    const onResult = (result) => {
      const rawValue = (result?.getText ? result.getText() : result?.text || "").trim();
      if (!rawValue) return;
      handleScannedBarcode(rawValue);
      stopScanner();
    };

    const constraints = {
      audio: false,
      video: buildScannerVideoConstraints()
    };
    const controls = state.zxingReader.decodeFromConstraints
      ? await state.zxingReader.decodeFromConstraints(constraints, els.barcodeVideo, onResult)
      : await state.zxingReader.decodeFromVideoDevice(undefined, els.barcodeVideo, onResult);
    state.zxingControls = controls || null;
    window.setTimeout(setupFlashButton, 500);
    setScannerStatus("Kamera aktif. Ketuk gambar untuk fokus ulang.", "success");
  }

  async function openScannerStream() {
    const initialStream = await getScannerStreamWithFallbacks();
    const selectedTrack = initialStream.getVideoTracks()[0];
    const rearDevice = await findRearCameraDevice(selectedTrack?.label);

    if (!rearDevice || selectedTrack?.label === rearDevice.label) {
      return initialStream;
    }

    initialStream.getTracks().forEach((track) => track.stop());

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: buildScannerVideoConstraints(rearDevice.deviceId)
      });
    } catch (error) {
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: buildScannerVideoConstraints()
      });
    }
  }

  async function getScannerStreamWithFallbacks() {
    const exactBackCamera = {
      audio: false,
      video: buildScannerVideoConstraints(null, true)
    };
    const idealBackCamera = {
      audio: false,
      video: buildScannerVideoConstraints()
    };

    try {
      return await navigator.mediaDevices.getUserMedia(exactBackCamera);
    } catch (error) {
      return navigator.mediaDevices.getUserMedia(idealBackCamera);
    }
  }

  function buildScannerVideoConstraints(deviceId, exactFacingMode = false) {
    return {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      ...(!deviceId ? { facingMode: exactFacingMode ? { exact: "environment" } : { ideal: "environment" } } : {}),
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, max: 30 },
      advanced: [
        { focusMode: "continuous" },
        { exposureMode: "continuous" },
        { whiteBalanceMode: "continuous" }
      ]
    };
  }

  async function findRearCameraDevice(currentLabel) {
    if (!navigator.mediaDevices?.enumerateDevices) return null;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");
      const rearPattern = /(back|rear|environment|belakang|kamera belakang|0)/i;
      const rearDevice = videoInputs.find((device) => rearPattern.test(device.label));

      return rearDevice || videoInputs.find((device) => device.label && device.label !== currentLabel) || null;
    } catch (error) {
      return null;
    }
  }

  function handleScannedBarcode(rawValue) {
    els.searchInput.value = rawValue;
    renderResults();
    setStatus(`Barcode ${rawValue} terbaca.`, "success");
  }

  function stopScanner(options = {}) {
    if (state.scannerFrame) {
      window.cancelAnimationFrame(state.scannerFrame);
      state.scannerFrame = null;
    }

    if (state.scannerStream) {
      state.scannerStream.getTracks().forEach((track) => track.stop());
      state.scannerStream = null;
    }

    if (state.zxingControls?.stop) {
      state.zxingControls.stop();
      state.zxingControls = null;
    }

    if (state.zxingReader?.reset) {
      state.zxingReader.reset();
      state.zxingReader = null;
    }

    state.torchOn = false;
    if (els.flashButton) {
      els.flashButton.hidden = true;
      els.flashButton.classList.remove("is-active");
    }

    if (els.barcodeVideo) {
      els.barcodeVideo.srcObject = null;
    }

    if (!options.keepPanelOpen && els.scannerPanel) {
      els.scannerPanel.hidden = true;
    }
  }

  function setScannerStatus(message, type) {
    els.scannerStatus.textContent = message;
    els.scannerStatus.dataset.type = type;
  }

  async function handleScannerTapFocus(event) {
    if (!els.barcodeVideo.srcObject) return;

    const rect = els.barcodeVideo.getBoundingClientRect();
    const point = {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
    };

    setScannerStatus("Mencoba fokus ulang...", "info");
    await tuneScannerTrack(point);
    setScannerStatus("Kamera aktif. Arahkan garis ke barcode.", "success");
  }

  async function tuneScannerTrack(point) {
    const track = getScannerVideoTrack();
    if (!track?.applyConstraints) return;

    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    const hints = [];

    if (point && "pointsOfInterest" in capabilities) {
      hints.push({ pointsOfInterest: [point] });
    }

    if (Array.isArray(capabilities.focusMode)) {
      if (point && capabilities.focusMode.includes("single-shot")) {
        hints.push({ focusMode: "single-shot" });
      }

      if (capabilities.focusMode.includes("continuous")) {
        hints.push({ focusMode: "continuous" });
      }
    }

    if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes("continuous")) {
      hints.push({ exposureMode: "continuous" });
    }

    if (Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.includes("continuous")) {
      hints.push({ whiteBalanceMode: "continuous" });
    }

    if (capabilities.zoom && typeof capabilities.zoom.min === "number" && typeof capabilities.zoom.max === "number") {
      const targetZoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 1.35));
      hints.push({ zoom: targetZoom });
    }

    for (const hint of hints) {
      try {
        await track.applyConstraints({ advanced: [hint] });
      } catch (error) {
        // Some Android browsers expose a capability but reject it per camera.
      }
    }

    setupFlashButton();
  }

  async function toggleFlash() {
    const track = getScannerVideoTrack();
    const nextTorchState = !state.torchOn;

    if (state.zxingControls?.switchTorch) {
      try {
        await state.zxingControls.switchTorch(nextTorchState);
        state.torchOn = nextTorchState;
        els.flashButton.classList.toggle("is-active", state.torchOn);
        setScannerStatus(state.torchOn ? "Flash aktif." : "Flash mati.", "success");
        return;
      } catch (error) {
        state.torchOn = false;
        els.flashButton.classList.remove("is-active");
      }
    }

    if (state.zxingControls?.streamVideoConstraintsApply) {
      try {
        state.zxingControls.streamVideoConstraintsApply({ advanced: [{ torch: nextTorchState }] });
        state.torchOn = nextTorchState;
        els.flashButton.classList.toggle("is-active", state.torchOn);
        setScannerStatus(state.torchOn ? "Flash aktif." : "Flash mati.", "success");
        return;
      } catch (error) {
        state.torchOn = false;
        els.flashButton.classList.remove("is-active");
      }
    }

    if (!track?.applyConstraints) {
      setScannerStatus("Flash belum bisa dikontrol oleh browser ini.", "warning");
      return;
    }

    try {
      await track.applyConstraints({ advanced: [{ torch: nextTorchState }] });
      state.torchOn = nextTorchState;
      els.flashButton.classList.toggle("is-active", state.torchOn);
      setScannerStatus(state.torchOn ? "Flash aktif." : "Flash mati.", "success");
    } catch (error) {
      state.torchOn = false;
      els.flashButton.classList.remove("is-active");
      setScannerStatus("Flash belum bisa dikontrol oleh browser ini.", "warning");
    }
  }

  function setupFlashButton() {
    const track = getScannerVideoTrack();
    const capabilities = track?.getCapabilities ? track.getCapabilities() : {};
    const hasTorch = Boolean(
      state.zxingControls?.switchTorch ||
      state.zxingControls?.streamVideoConstraintsApply ||
      track ||
      (capabilities && "torch" in capabilities)
    );

    els.flashButton.hidden = !hasTorch;
    els.flashButton.classList.toggle("is-active", state.torchOn);
  }

  function getScannerVideoTrack() {
    const stream = state.scannerStream || els.barcodeVideo?.srcObject;
    if (!stream?.getVideoTracks) return null;
    return stream.getVideoTracks()[0] || null;
  }

  function showEmpty(title, message) {
    els.emptyState.hidden = false;
    els.emptyState.querySelector("h2").textContent = title;
    els.emptyState.querySelector("p").textContent = message;
  }

  function getStockState(value) {
    const raw = String(value || "").trim();

    if (!raw || !/[0-9]/.test(raw)) {
      return { label: "Stok kosong", className: "neutral" };
    }

    const numeric = Number(raw.replace(",", ".").replace(/[^0-9.-]/g, ""));

    if (!Number.isFinite(numeric)) {
      return { label: "Stok kosong", className: "neutral" };
    }

    if (numeric <= 0) {
      return { label: "Habis", className: "danger" };
    }

    if (numeric <= 5) {
      return { label: "Menipis", className: "warning" };
    }

    return { label: "Tersedia", className: "success" };
  }

  function formatDateValue(value) {
    const raw = String(value || "").trim();
    if (!raw || raw === "-") return raw;

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    }).format(date);
  }

  function formatDisplayText(value) {
    const raw = String(value || "").trim().replace(/_/g, " ");
    if (!raw) return "";

    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function formatStockValue(medicine) {
    const stock = String(medicine.stok || "-").trim() || "-";
    const unit = formatDisplayText(medicine.satuanBeli);

    return stock !== "-" && unit ? `${stock} ${unit}` : stock;
  }

  function formatPrice(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const numeric = Number(raw.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(numeric) || numeric <= 0) return raw;

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(numeric);
  }

  function updateCacheSummary() {
    const meta = readMeta();

    if (!state.medicines.length) {
      els.cacheStatus.textContent = "Cache lokal kosong";
      delete els.cacheStatus.dataset.type;
      els.medicineCount.textContent = "0 data";
      return;
    }

    const lastChanged = meta.lastChanged || meta.lastSync;

    if (!lastChanged) {
      els.cacheStatus.textContent = "Data tersedia di cache lokal";
      delete els.cacheStatus.dataset.type;
      return;
    }

    els.cacheStatus.textContent = formatLastUpdated(lastChanged);
    els.cacheStatus.dataset.type = "success";
  }

  function formatLastUpdated(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Last updated belum tersedia";
    }

    const parts = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    }).formatToParts(date).reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

    return `Last updated tanggal ${parts.day}/${parts.month}/${parts.year} Jam. ${parts.hour}.${parts.minute} WIB`;
  }

  function setStatus(message, type) {
    els.cacheStatus.textContent = message;
    els.cacheStatus.dataset.type = type;
  }

  function setSyncState(isSyncing) {
    els.syncButton.disabled = isSyncing;
    els.syncButton.classList.toggle("is-loading", isSyncing);
    els.syncLabel.textContent = isSyncing ? "Menyinkronkan" : "Sinkronkan";
  }

  function getApiUrl() {
    return normalizeApiUrl(els.apiUrlInput.value.trim() || localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL);
  }

  function normalizeApiUrl(url) {
    const value = String(url || "").trim();
    const dataObatEndpoint = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec";

    if (value === dataObatEndpoint) {
      return `${dataObatEndpoint}?sheet=data_obat`;
    }

    return value;
  }

  function readMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
