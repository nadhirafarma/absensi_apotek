(function () {
  const DB_NAME = "nadhira-farma-obat-cache";
  const DB_VERSION = 1;
  const STORE_NAME = "medicines";
  const API_URL_KEY = "nadhira.obatApiUrl";
  const META_KEY = "nadhira.obatCacheMeta";
  const COLUMN_VISIBILITY_KEY = "nadhira.obatVisibleColumns";
  const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec?sheet=data_obat";
  const QUICK_PAGE_SIZE = 10;
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
    scannerTimer: null,
    scannerLocked: false,
    barcodeDetector: null,
    scannerCanvas: null,
    quaggaBusy: false,
    lastQuaggaScanAt: 0,
    zxingReader: null,
    zxingControls: null,
    importHeaders: [],
    importRows: [],
    importMedicines: [],
    torchOn: false,
    quickPage: 1
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
      state.medicines = sortMedicinesByName(dedupeMedicines(await readAllMedicines()));
      populateFilterOptions();
      renderResults();
      updateCacheSummary();
      updateFilterButtonState();
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
    els.importFileInput = document.getElementById("importFileInput");
    els.importMode = document.getElementById("importMode");
    els.importButton = document.getElementById("importButton");
    els.importSummary = document.getElementById("importSummary");
    els.importStatus = document.getElementById("importStatus");
    els.notificationButton = document.getElementById("notificationButton");
    els.notificationDot = document.getElementById("notificationDot");
    els.notificationPopover = document.getElementById("notificationPopover");
    els.notificationMessage = document.getElementById("notificationMessage");
    els.notificationCloseButton = document.getElementById("notificationCloseButton");
    els.notificationOkButton = document.getElementById("notificationOkButton");
    els.cacheStatus = document.getElementById("cacheStatus");
    els.medicineCount = document.getElementById("medicineCount");
    els.resultsArea = document.getElementById("resultsArea");
    els.closeResultsButton = document.getElementById("closeResultsButton");
    els.backButton = document.getElementById("backButton");
    els.resultsCountLabel = document.getElementById("resultsCountLabel");
    els.emptyState = document.getElementById("emptyState");
    els.resultsList = document.getElementById("resultsList");
    els.quickReportTitle = document.getElementById("quickReportTitle");
    els.quickFilterChips = document.getElementById("quickFilterChips");
    els.quickResultsList = document.getElementById("quickResultsList");
    els.quickPagination = document.getElementById("quickPagination");
    els.quickPageInfo = document.getElementById("quickPageInfo");
    els.quickPageControls = document.getElementById("quickPageControls");
    els.quickSearchStatus = document.getElementById("quickSearchStatus");
    els.columnToggles = Array.from(document.querySelectorAll("[data-column]"));
  }

  function bindEvents() {
    els.searchForm.addEventListener("submit", (event) => event.preventDefault());
    els.searchInput.addEventListener("input", () => {
      state.quickPage = 1;
      renderResults();
    });
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
    if (els.backButton) {
      els.backButton.addEventListener("click", () => {
        els.searchInput.value = "";
        resetRowFilters();
        state.quickPage = 1;
        renderResults();
        setResultsVisible(false);
        els.searchInput.focus();
      });
    }
    if (els.quickPageControls) {
      els.quickPageControls.addEventListener("click", handleQuickPaginationClick);
    }
    if (els.quickFilterChips) {
      els.quickFilterChips.addEventListener("click", handleQuickFilterChipClick);
    }
    els.resultsArea.addEventListener("click", (event) => {
      if (event.target === els.resultsArea) {
        setResultsVisible(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.resultsArea.hidden) {
        setResultsVisible(false);
      }
      if (event.key === "Escape" && els.notificationPopover && !els.notificationPopover.hidden) {
        closeNotificationPopup();
      }
    });
    els.syncButton.addEventListener("click", () => syncMedicines());
    if (els.notificationButton) {
      els.notificationButton.addEventListener("click", acknowledgeUploadNotification);
    }
    [els.notificationCloseButton, els.notificationOkButton].forEach((button) => {
      if (button) button.addEventListener("click", closeNotificationPopup);
    });
    if (els.notificationPopover) {
      els.notificationPopover.addEventListener("click", (event) => {
        if (event.target === els.notificationPopover) {
          closeNotificationPopup();
        }
      });
    }
    if (els.importFileInput) els.importFileInput.addEventListener("change", handleImportFileChange);
    if (els.importButton) els.importButton.addEventListener("click", importExcelToGoogleSheet);
    window.addEventListener("beforeunload", stopScanner);
    window.addEventListener("resize", () => {
      if (els.notificationPopover && !els.notificationPopover.hidden) {
        positionNotificationPopup();
      }
    });

    [
      els.filterStock,
      els.filterStatus,
      els.filterSupplier,
      els.filterSatuanBeli,
      els.filterExpired
    ].forEach((control) => {
      control.addEventListener("input", () => {
        state.quickPage = 1;
        renderResults();
      });
      control.addEventListener("change", () => {
        state.quickPage = 1;
        renderResults();
      });
    });

    els.columnToggles.forEach((toggle) => {
      toggle.addEventListener("change", () => {
        state.visibleColumns[toggle.dataset.column] = toggle.checked;
        state.quickPage = 1;
        localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(state.visibleColumns));
        renderResults();
        updateFilterButtonState();
      });
    });

    els.resetFiltersButton.addEventListener("click", () => {
      els.filterStock.value = "";
      els.filterStatus.value = "";
      els.filterSupplier.value = "";
      els.filterSatuanBeli.value = "";
      els.filterExpired.value = "";
      state.visibleColumns = { ...DEFAULT_VISIBLE_COLUMNS };
      state.quickPage = 1;
      localStorage.removeItem(COLUMN_VISIBILITY_KEY);
      hydrateColumnControls();
      renderResults();
      updateFilterButtonState();
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
    const uniqueMedicines = dedupeMedicines(medicines);

    await withStore("readwrite", (store) => {
      store.clear();
      uniqueMedicines.forEach((medicine) => store.put(medicine));
    });

    return uniqueMedicines;
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
      const parsedPayload = parsePayload(payload);
      const rows = parsedPayload.rows;
      const sourceUploadedAt = normalizeTimestamp(
        parsedPayload.meta.uploadedAt ||
        parsedPayload.meta.lastUploadAt ||
        parsedPayload.meta.uploadUpdatedAt ||
        parsedPayload.meta.dataUpdatedAt ||
        parsedPayload.meta.updatedAt ||
        options.uploadedAt ||
        ""
      );

      if (looksLikeCredentialRows(rows)) {
        throw new Error("Endpoint ini berisi data akun, bukan data obat.");
      }

      const medicines = sortMedicinesByName(dedupeMedicines(rows
        .map(normalizeMedicine)
        .filter(Boolean)));

      if (!medicines.length) {
        throw new Error("Data obat kosong atau format kolom belum sesuai.");
      }

      const previousMeta = readMeta();
      const dataSignature = createMedicineSignature(medicines);
      const previousSignature = previousMeta.dataSignature || createMedicineSignature(state.medicines);
      const dataChanged = dataSignature !== previousSignature;
      const previousUploadedAt = normalizeTimestamp(previousMeta.uploadedAt || previousMeta.lastUploadAt || "");
      const uploadChanged = sourceUploadedAt && sourceUploadedAt !== previousUploadedAt;
      const uploadedAt = sourceUploadedAt || previousUploadedAt || "";
      const now = new Date().toISOString();

      const savedMedicines = await replaceMedicines(medicines);

      state.medicines = sortMedicinesByName(savedMedicines);
      populateFilterOptions();
      localStorage.setItem(META_KEY, JSON.stringify({
        ...previousMeta,
        lastChecked: now,
        lastChanged: dataChanged ? (uploadedAt || now) : previousMeta.lastChanged,
        uploadedAt,
        hasUploadNotification: Boolean(previousMeta.hasUploadNotification || dataChanged || uploadChanged || options.forceUploadNotification),
        dataSignature,
        source: apiUrl,
        total: state.medicines.length
      }));

      renderResults();
      updateCacheSummary();
      updateFilterButtonState();

      if (!options.silent && dataChanged) {
        setStatus(`Data obat berhasil disinkronkan. ${state.medicines.length} data terbaru tersimpan.`, "success");
      }

      if (!options.silent && !dataChanged) {
        setStatus("Data sudah terbaru. Belum ada perubahan di Google Sheet.", "success");
      }

      return {
        ok: true,
        dataChanged,
        total: state.medicines.length,
        uploadedAt
      };
    } catch (error) {
      setStatus(`Sinkronisasi gagal: ${error.message}`, "error");
      if (options.throwOnError) {
        throw error;
      }
      return {
        ok: false,
        error
      };
    } finally {
      state.isSyncing = false;
      setSyncState(false);
    }
  }

  async function handleImportFileChange() {
    const file = els.importFileInput.files?.[0];

    state.importHeaders = [];
    state.importRows = [];
    state.importMedicines = [];
    els.importButton.disabled = true;

    if (!file) {
      setImportStatus("File akan dicek dulu sebelum dikirim ke Google Sheet.", "info");
      els.importSummary.textContent = "Belum ada file";
      return;
    }

    try {
      const parsed = await parseImportFile(file);
      const medicines = sortMedicinesByName(dedupeMedicines(parsed.rows
        .map(normalizeMedicine)
        .filter(Boolean)));

      if (!medicines.length) {
        throw new Error("File tidak memiliki kolom nama obat atau barcode.");
      }

      state.importHeaders = parsed.headers;
      state.importRows = parsed.rows;
      state.importMedicines = medicines;
      els.importButton.disabled = false;
      els.importSummary.textContent = `${medicines.length} data siap import`;
      setImportStatus(`File ${file.name} berhasil dibaca. Periksa mode import sebelum upload.`, "success");
    } catch (error) {
      els.importSummary.textContent = "File belum valid";
      setImportStatus(`Import gagal dibaca: ${error.message}`, "error");
    }
  }

  async function parseImportFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "csv") {
      const text = await file.text();
      return matrixToImportRows(parseCsvMatrix(text));
    }

    if (!window.XLSX) {
      throw new Error("Library pembaca Excel belum termuat. Coba muat ulang halaman.");
    }

    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, {
      type: "array",
      cellDates: false
    });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("Workbook tidak memiliki sheet.");
    }

    const matrix = window.XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
      header: 1,
      raw: false,
      defval: ""
    });

    return matrixToImportRows(matrix);
  }

  function parseCsvMatrix(text) {
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
    return rows.filter((item) => item.some((value) => String(value || "").trim()));
  }

  function matrixToImportRows(matrix) {
    if (!matrix.length) {
      throw new Error("File kosong.");
    }

    const headers = matrix[0].map((header) => String(header || "").trim()).filter(Boolean);

    if (!headers.length) {
      throw new Error("Header kolom tidak ditemukan.");
    }

    const normalizedHeaders = matrix[0].map((header) => normalizeKey(header));
    const rows = matrix.slice(1).map((row) => {
      const item = {};
      normalizedHeaders.forEach((header, index) => {
        if (header) {
          item[header] = row[index] || "";
        }
      });
      return item;
    }).filter((item) => Object.values(item).some((value) => String(value || "").trim()));

    return { headers, rows };
  }

  async function importExcelToGoogleSheet() {
    if (!state.importRows.length) {
      setImportStatus("Pilih file Excel terlebih dahulu.", "warning");
      return;
    }

    const apiUrl = getImportApiUrl();

    if (!apiUrl) {
      setImportStatus("URL API Google Sheet belum tersedia.", "error");
      return;
    }

    els.importButton.disabled = true;
    setImportStatus("Mengupload data obat ke Google Sheet...", "info");

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "import_data_obat",
          sheet: "data_obat",
          mode: els.importMode.value,
          headers: state.importHeaders,
          rows: state.importRows
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const result = parseImportResponse(text);

      if (!result || result.ok !== true) {
        throw new Error(result?.error || "API belum mengonfirmasi import data obat.");
      }

      setImportStatus("Upload dikonfirmasi Google Sheet. Mengambil ulang data obat...", "info");

      const syncResult = await syncMedicines({
        silent: true,
        throwOnError: true,
        uploadedAt: result.updatedAt || result.uploadedAt || "",
        forceUploadNotification: true
      });
      const total = Number(result.total || syncResult.total || state.medicines.length || state.importMedicines.length);

      if (els.importMode.value === "replace" && result.total && syncResult.total !== Number(result.total)) {
        throw new Error(`Upload selesai, tetapi API masih membaca ${syncResult.total} data. Pastikan doGet dan doPost memakai spreadsheet data_obat yang sama.`);
      }

      setImportStatus(`Import selesai. ${total} data tersimpan di Google Sheet dan cache sudah diperbarui.`, "success");
    } catch (error) {
      setImportStatus(`Upload gagal: ${error.message}. Pastikan Apps Script sudah mendukung action import_data_obat.`, "error");
    } finally {
      els.importButton.disabled = !state.importRows.length;
    }
  }

  function getImportApiUrl() {
    const apiUrl = getApiUrl();
    if (!apiUrl) return "";

    const url = new URL(apiUrl, window.location.href);
    url.searchParams.set("sheet", "data_obat");
    url.searchParams.set("action", "import_data_obat");
    return url.toString();
  }

  function parseImportResponse(text) {
    const value = String(text || "").trim();
    if (!value) return {};

    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error("Response API bukan JSON valid. Cek URL Web App Apps Script dan akses deployment.");
    }
  }

  function setImportStatus(message, type) {
    els.importStatus.textContent = message;
    els.importStatus.dataset.type = type;
  }

  function parsePayload(payload) {
    const text = payload.trim();

    if (!text) return { rows: [], meta: {} };

    if (text.startsWith("{") || text.startsWith("[")) {
      const json = JSON.parse(text);

      if (Array.isArray(json)) return { rows: json, meta: {} };

      const meta = {
        updatedAt: json.updatedAt || json.meta?.updatedAt || "",
        uploadedAt: json.uploadedAt || json.meta?.uploadedAt || "",
        lastUploadAt: json.lastUploadAt || json.meta?.lastUploadAt || "",
        uploadUpdatedAt: json.uploadUpdatedAt || json.meta?.uploadUpdatedAt || "",
        dataUpdatedAt: json.dataUpdatedAt || json.meta?.dataUpdatedAt || ""
      };

      if (Array.isArray(json.data)) return { rows: json.data, meta };
      if (Array.isArray(json.obat)) return { rows: json.obat, meta };
      if (Array.isArray(json.records)) return { rows: json.records, meta };
      if (Array.isArray(json.values)) return { rows: matrixToObjects(json.values), meta };

      const values = Object.values(json);
      if (values.every((value) => value && typeof value === "object" && !Array.isArray(value))) {
        return { rows: values, meta };
      }
    }

    return { rows: parseCsv(text), meta: {} };
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
    const nama = pick(item, ["nama", "namaobat"]);
    const barcode = pick(item, ["kode", "barcode"]);

    if (!nama && !barcode) return null;

    const stok = pick(item, ["stok"]);
    const satuanBeli = pick(item, ["satuanbeli"]);
    const satuan1 = pick(item, ["satuan1"]);
    const satuan2 = pick(item, ["satuan2"]);
    const satuan3 = pick(item, ["satuan3"]);
    const harga1 = pick(item, ["hargajual1"]);
    const harga2 = pick(item, ["hargajual2"]);
    const harga3 = pick(item, ["hargajual3"]);
    const usesCompactPrice = Boolean(item.hargajual1 || item.hargajual2 || item.hargajual3 || item.hargaresep1 || item.hargaresep2 || item.hargaresep3);
    const kategori = pick(item, ["kategori"]);
    const lokasi = pick(item, ["lokasi"]);
    const expired = pick(item, ["expired"]);
    const updated = pick(item, ["updatedat", "updated", "lastupdate", "tanggalupdate", "terakhirupdate"]);
    const suplier = pick(item, ["suplier", "supplier"]);
    const status = pick(item, ["status"]);
    const noBatch = pick(item, ["nobatch"]);
    const id = String(barcode || slugify(nama) || `obat-${index}`);

    const medicine = {
      id,
      nama: cleanText(nama || barcode),
      barcode: cleanText(barcode),
      stok: normalizeStockValue(stok),
      satuanBeli: cleanText(satuanBeli),
      satuan: cleanText(satuan1),
      satuan1: cleanText(satuan1),
      satuan2: cleanText(satuan2),
      satuan3: cleanText(satuan3),
      harga: normalizePriceValue(harga1, usesCompactPrice),
      harga1: normalizePriceValue(harga1, usesCompactPrice),
      harga2: normalizePriceValue(harga2, usesCompactPrice),
      harga3: normalizePriceValue(harga3, usesCompactPrice),
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

  function normalizeStockValue(value) {
    const raw = cleanText(value);

    if (!raw || raw === "-") return "";

    if (isDateLikeValue(raw)) return "";

    if (isStraySpreadsheetDate(raw)) return "";

    const numericText = raw.replace(",", ".").replace(/[^0-9.-]/g, "");

    if (!/[0-9]/.test(numericText)) return "";

    return raw;
  }

  function isDateLikeValue(value) {
    const raw = String(value || "").trim();

    if (!raw) return false;

    if (/^\d{4}-\d{2}-\d{2}(?:t|\s|$)/i.test(raw)) return true;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i.test(raw)) return true;

    return false;
  }

  function isStraySpreadsheetDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return false;
    // Google Sheets epoch-zero default shown for empty/0 date-formatted cells
    // e.g. 30/12/1899, 30-12-1899, 30.12.1899, 1899-12-30
    if (/(^|\D)1899(\D|$)/.test(raw)) return true;
    if (/^30[/.\-]12[/.\-]1899$/.test(raw)) return true;
    // truncated display like "30.12" or "30,12" coming from a 30/12 date
    if (/^30[.,]12$/.test(raw)) return true;
    return false;
  }

  function normalizePriceValue(value, compactThousands) {
    const raw = cleanText(value);

    if (!raw) return "";

    const numeric = parseNumberValue(raw);

    if (!Number.isFinite(numeric) || numeric <= 0) return raw;

    if (compactThousands && numeric < 1000) {
      return String(Math.round(numeric * 1000));
    }

    return String(Math.round(numeric));
  }

  function parseNumberValue(value) {
    const raw = String(value || "").trim();

    if (!raw) return NaN;

    if (/rp/i.test(raw)) {
      return Number(raw.replace(/[^0-9]/g, ""));
    }

    if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(raw)) {
      return Number(raw.replace(/\./g, "").replace(",", "."));
    }

    if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(raw)) {
      return Number(raw.replace(/,/g, ""));
    }

    return Number(raw.replace(",", ".").replace(/[^0-9.-]/g, ""));
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

  function dedupeMedicines(medicines) {
    const uniqueByIdentity = new Map();

    medicines.forEach((medicine) => {
      const identity = getMedicineIdentity(medicine);
      if (!identity) return;
      uniqueByIdentity.set(identity, medicine);
    });

    return Array.from(uniqueByIdentity.values());
  }

  function getMedicineIdentity(medicine) {
    const barcode = normalizeSearchText(medicine?.barcode);
    if (barcode) return `barcode:${barcode}`;

    const name = normalizeSearchText(medicine?.nama);
    if (name) return `name:${name}`;

    return "";
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
    const shouldShowPopup = Boolean(query || hasActiveFilters() || hasColumnVisibilityChanged());
    const searchFiltered = query
      ? state.medicines.filter((medicine) => medicine.searchable.includes(query))
      : state.medicines;
    const filtered = applyRowFilters(searchFiltered);
    const sorted = sortMedicinesByName(filtered);
    const limited = sorted.slice(0, 60);

    renderQuickResults(sorted, rawQuery, shouldShowPopup);

    if (els.quickResultsList) {
      setResultsVisible(false);
      els.resultsList.hidden = true;
      els.resultsList.innerHTML = "";
      els.emptyState.hidden = true;
      els.medicineCount.textContent = `${filtered.length} dari ${state.medicines.length} data`;
      updateFilterButtonState();
      return;
    }

    if (!shouldShowPopup) {
      setResultsVisible(false);
      els.resultsList.hidden = true;
      els.resultsList.innerHTML = "";
      els.emptyState.hidden = true;
      els.medicineCount.textContent = `${state.medicines.length} data`;
      updateFilterButtonState();
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

    const countText = `${filtered.length} dari ${state.medicines.length} data`;
    els.medicineCount.textContent = countText;
    if (els.resultsCountLabel) {
      els.resultsCountLabel.textContent = query
        ? `${filtered.length} hasil untuk "${rawQuery}"`
        : `${countText} ditampilkan`;
    }
    updateFilterButtonState();
  }

  function renderQuickResults(filtered, rawQuery, shouldShowResults) {
    if (!els.quickResultsList) return;

    const total = filtered.length;
    const hasMedicines = Boolean(state.medicines.length);
    const pageCount = Math.max(1, Math.ceil(total / QUICK_PAGE_SIZE));
    state.quickPage = clampNumber(state.quickPage, 1, pageCount);

    renderQuickFilterChips();

    if (!hasMedicines) {
      setQuickSearchStatus("Cache lokal kosong. Sinkronkan data obat terlebih dahulu.");
      setQuickReport("Belum ada data obat", "Tekan Sinkronkan untuk mengambil data terbaru.");
      renderQuickEmpty("Belum ada data obat", "Tekan tombol Sinkronkan untuk mengambil data obat dari Google Sheet.");
      renderQuickPagination(0, 1, 1, 0, 0, false);
      return;
    }

    if (!shouldShowResults) {
      setQuickSearchStatus(`${state.medicines.length} data siap dicari.`);
      els.quickReportTitle.innerHTML = "";
      els.quickReportTitle.hidden = true;
      renderQuickEmpty("Mulai cari data obat", "Ketik nama obat, barcode, lokasi, supplier, atau gunakan scan barcode.");
      renderQuickPagination(0, 1, 1, 0, 0, false);
      return;
    }

    if (!total) {
      setQuickSearchStatus("Data tidak ditemukan. Coba ubah kata pencarian atau filter.");
      setQuickReport("Data tidak ditemukan", rawQuery ? `Tidak ada hasil untuk “${rawQuery}”.` : "Filter aktif tidak memiliki hasil.");
      renderQuickEmpty("Data tidak ditemukan", "Coba kata kunci lain atau reset filter yang aktif.");
      renderQuickPagination(0, 1, 1, 0, 0, false);
      return;
    }

    const startIndex = (state.quickPage - 1) * QUICK_PAGE_SIZE;
    const pageItems = filtered.slice(startIndex, startIndex + QUICK_PAGE_SIZE);
    const endIndex = startIndex + pageItems.length;
    const queryLabel = rawQuery ? ` untuk “${rawQuery}”` : "";

    setQuickSearchStatus(`${total} data ditemukan${queryLabel}.`);
    setQuickReport(`${total} hasil${queryLabel}`, `Menampilkan ${startIndex + 1}-${endIndex} dari ${total} data.`);
    els.quickResultsList.hidden = false;
    els.quickResultsList.innerHTML = pageItems
      .map((medicine, index) => renderQuickMedicineCard(medicine, startIndex + index, rawQuery))
      .join("");
    renderQuickPagination(total, state.quickPage, pageCount, startIndex + 1, endIndex, true);
  }

  function renderQuickMedicineCard(medicine, index, query) {
    const tone = getMedicineTone(medicine, index);
    const rows = getQuickMedicineRows(medicine);

    return `
      <article class="quick-medicine-card quick-tone-${tone}">
        <div class="quick-medicine-name">
          <span class="quick-name-accent" aria-hidden="true"></span>
          <strong>${highlightMedicineName(medicine.nama, query)}</strong>
          ${state.visibleColumns.barcode !== false && medicine.barcode ? `<small>${escapeHtml(medicine.barcode)}</small>` : ""}
        </div>
        <dl class="quick-medicine-list">
          ${rows.map(([label, value]) => `
            <div>
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>
          `).join("")}
        </dl>
      </article>
    `;
  }

  function getQuickMedicineRows(medicine) {
    const rows = [
      ["stock", "Stok", formatStockValue(medicine)],
      ["purchaseUnit", "Satuan Beli", formatDisplayText(medicine.satuanBeli)],
      ["expired", "Expired", formatDateValue(medicine.expired)],
      ["supplier", "Supplier", formatDisplayText(medicine.suplier)],
      ["location", "Lokasi", medicine.lokasi],
      ["status", "Status", formatDisplayText(medicine.status)],
      ["update", "Update", formatDateValue(medicine.updated)]
    ].filter(([key, , value]) => state.visibleColumns[key] !== false && value);
    const priceRows = [
      ["price1", "Harga 1", medicine.satuan1, medicine.harga1],
      ["price2", "Harga 2", medicine.satuan2, medicine.harga2],
      ["price3", "Harga 3", medicine.satuan3, medicine.harga3]
    ]
      .filter(([key, , unit, price]) => state.visibleColumns[key] !== false && (String(unit || "").trim() || String(price || "").trim()))
      .map(([, label, unit, price]) => [label, formatQuickPrice(unit, price)]);

    return [...rows.map(([, label, value]) => [label, value]), ...priceRows].filter(([, value]) => value);
  }

  function formatQuickPrice(unit, price) {
    const unitText = formatDisplayText(unit);
    const priceText = formatPrice(price);

    if (unitText && priceText) return `${unitText} · ${priceText}`;
    return unitText || priceText || "";
  }

  function renderQuickFilterChips() {
    if (!els.quickFilterChips) return;

    const chips = [];
    const stockLabels = {
      success: "Tersedia",
      warning: "Menipis",
      danger: "Habis",
      neutral: "Stok kosong"
    };

    if (els.filterStock.value) chips.push(["filterStock", `Stok: ${stockLabels[els.filterStock.value] || els.filterStock.value}`]);
    if (els.filterStatus.value.trim()) chips.push(["filterStatus", `Status: ${els.filterStatus.value.trim()}`]);
    if (els.filterSupplier.value.trim()) chips.push(["filterSupplier", `Supplier: ${els.filterSupplier.value.trim()}`]);
    if (els.filterSatuanBeli.value.trim()) chips.push(["filterSatuanBeli", `Satuan: ${els.filterSatuanBeli.value.trim()}`]);
    if (els.filterExpired.value) chips.push(["filterExpired", `Expired: ${els.filterExpired.value === "with" ? "Ada tanggal" : "Tanpa tanggal"}`]);
    if (hasColumnVisibilityChanged()) chips.push(["columns", "Kolom disesuaikan"]);

    els.quickFilterChips.hidden = !chips.length;
    els.quickFilterChips.innerHTML = chips.length
      ? [
        `<span>Filter aktif</span>`,
        ...chips.map(([key, label]) => `<button type="button" data-quick-clear="${escapeHtml(key)}">${escapeHtml(label)} ×</button>`),
        chips.length > 1 ? `<button type="button" data-quick-clear="all">Reset semua</button>` : ""
      ].join("")
      : "";
  }

  function handleQuickFilterChipClick(event) {
    const button = event.target.closest("[data-quick-clear]");
    if (!button) return;

    const target = button.dataset.quickClear;

    if (target === "all") {
      resetRowFilters();
      state.visibleColumns = { ...DEFAULT_VISIBLE_COLUMNS };
      localStorage.removeItem(COLUMN_VISIBILITY_KEY);
      hydrateColumnControls();
    } else if (target === "columns") {
      state.visibleColumns = { ...DEFAULT_VISIBLE_COLUMNS };
      localStorage.removeItem(COLUMN_VISIBILITY_KEY);
      hydrateColumnControls();
    } else if (els[target]) {
      els[target].value = "";
    }

    state.quickPage = 1;
    renderResults();
    updateFilterButtonState();
  }

  function renderQuickPagination(total, page, pageCount, start, end, isVisible) {
    if (!els.quickPagination || !els.quickPageControls || !els.quickPageInfo) return;

    els.quickPageInfo.className = "quick-page-info";
    els.quickPagination.hidden = !isVisible || !total;
    if (!isVisible || !total) {
      els.quickPageInfo.textContent = "";
      els.quickPageControls.innerHTML = "";
      return;
    }

    els.quickPageInfo.textContent = `${start}-${end} / ${total}`;
    els.quickPageControls.innerHTML = [
      `<button type="button" data-quick-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="Halaman sebelumnya">‹</button>`,
      ...getQuickPaginationItems(page, pageCount).map((item) => item === "…"
        ? `<span class="quick-page-ellipsis">…</span>`
        : `<button type="button" data-quick-page="${item}" class="${item === page ? "is-active" : ""}" ${item === page ? `aria-current="page"` : ""}>${item}</button>`),
      `<button type="button" data-quick-page="${page + 1}" ${page >= pageCount ? "disabled" : ""} aria-label="Halaman berikutnya">›</button>`
    ].join("");
  }

  function getQuickPaginationItems(page, pageCount) {
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    const items = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(pageCount - 1, page + 1);

    if (start > 2) items.push("…");
    for (let item = start; item <= end; item += 1) items.push(item);
    if (end < pageCount - 1) items.push("…");
    items.push(pageCount);

    return items;
  }

  function handleQuickPaginationClick(event) {
    const button = event.target.closest("button[data-quick-page]");
    if (!button || button.disabled) return;

    state.quickPage = Number(button.dataset.quickPage) || 1;
    renderResults();
    if (els.quickResultsList) els.quickResultsList.scrollTop = 0;
  }

  function setQuickSearchStatus(message) {
    if (els.quickSearchStatus) els.quickSearchStatus.textContent = message;
  }

  function setQuickReport(title, subtitle) {
    if (!els.quickReportTitle) return;

    els.quickReportTitle.hidden = false;
    els.quickReportTitle.innerHTML = `
      <span>${escapeHtml(title)}</span>
      ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
    `;
  }

  function renderQuickEmpty(title, message) {
    els.quickResultsList.hidden = false;
    els.quickResultsList.innerHTML = `
      <div class="quick-empty-state">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  }

  function clampNumber(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, Math.trunc(numeric)));
  }

  function resetRowFilters() {
    els.filterStock.value = "";
    els.filterStatus.value = "";
    els.filterSupplier.value = "";
    els.filterSatuanBeli.value = "";
    els.filterExpired.value = "";
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

  function hasColumnVisibilityChanged() {
    return Object.keys(DEFAULT_VISIBLE_COLUMNS).some((key) => state.visibleColumns[key] !== DEFAULT_VISIBLE_COLUMNS[key]);
  }

  function updateFilterButtonState() {
    if (!els.filterButton) return;

    els.filterButton.classList.toggle("is-active", hasActiveFilters() || hasColumnVisibilityChanged());
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
    ].filter(([key, , unit, price]) => {
      if (state.visibleColumns[key] === false) return false;
      const hasUnit = Boolean(String(unit || "").trim());
      const hasPrice = Boolean(String(price || "").trim());
      return hasUnit || hasPrice;
    });
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
            ${state.visibleColumns.barcode !== false && medicine.barcode ? `<p>${escapeHtml(medicine.barcode)}</p>` : ""}
          </div>
          ${state.visibleColumns.stock !== false ? `<span class="stock-pill ${stock.className}">${escapeHtml(stock.label)}</span>` : ""}
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
    state.scannerLocked = false;
    els.scannerPanel.hidden = false;
    setScannerStatus("Membuka kamera...", "info");

    try {
      state.scannerStream = await openScannerStream();
      els.barcodeVideo.srcObject = state.scannerStream;
      await els.barcodeVideo.play();
      await tuneScannerTrack();
      window.setTimeout(tuneScannerTrack, 700);
      setupFlashButton();
      await setupNativeBarcodeDetector();
      scanBarcodeFrame();

      if (await startZxingScanner(state.scannerStream)) {
        setScannerStatus("Kamera aktif. Arahkan barcode atau QR ke dalam bingkai.", "success");
        return;
      }

      if (!state.barcodeDetector && !window.jsQR) {
        setScannerStatus("Scanner belum siap. Coba muat ulang halaman saat internet aktif.", "error");
        return;
      }

      setScannerStatus("Kamera aktif. Arahkan barcode atau QR ke dalam bingkai.", "success");
    } catch (error) {
      stopScanner({ keepPanelOpen: true });
      setScannerStatus(`Scanner gagal: ${error.message}`, "error");
    }
  }

  async function setupNativeBarcodeDetector() {
    if (!("BarcodeDetector" in window)) {
      state.barcodeDetector = null;
      return;
    }

    try {
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
    } catch (error) {
      state.barcodeDetector = null;
    }
  }

  async function scanBarcodeFrame() {
    if (state.scannerLocked || !els.barcodeVideo.srcObject) return;

    try {
      if (els.barcodeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const scanCanvas = getScannerCanvas();
        const scanContext = scanCanvas.getContext("2d", { willReadFrequently: true });
        const crop = getScanCrop();

        scanCanvas.width = crop.targetWidth;
        scanCanvas.height = crop.targetHeight;
        scanContext.drawImage(
          els.barcodeVideo,
          crop.sourceX,
          crop.sourceY,
          crop.sourceWidth,
          crop.sourceHeight,
          0,
          0,
          crop.targetWidth,
          crop.targetHeight
        );

        const nativeValue = state.barcodeDetector
          ? await detectWithNativeBarcodeDetector(scanCanvas)
          : "";
        const qrValue = nativeValue || detectWithJsQr(scanContext, scanCanvas.width, scanCanvas.height);
        const quaggaValue = nativeValue || qrValue ? "" : await detectWithQuagga(scanCanvas);
        const rawValue = (nativeValue || qrValue || quaggaValue || "").trim();

        if (rawValue) {
          handleScannedBarcode(rawValue);
          stopScanner();
          return;
        }
      }
    } catch (error) {
      setScannerStatus(`Scanner gagal membaca: ${error.message}`, "error");
    }

    state.scannerTimer = window.setTimeout(scanBarcodeFrame, 260);
  }

  async function detectWithNativeBarcodeDetector(scanCanvas) {
    try {
      const barcodes = await state.barcodeDetector.detect(scanCanvas);

      return barcodes[0]?.rawValue?.trim() || "";
    } catch (error) {
      return "";
    }
  }

  function detectWithJsQr(scanContext, width, height) {
    if (!window.jsQR) return "";

    try {
      const imageData = scanContext.getImageData(0, 0, width, height);
      const result = window.jsQR(imageData.data, width, height, {
        inversionAttempts: "attemptBoth"
      });

      return result?.data?.trim() || "";
    } catch (error) {
      return "";
    }
  }

  function detectWithQuagga(scanCanvas) {
    const quagga = window.Quagga || window.Quagga2;
    const now = Date.now();

    if (!quagga?.decodeSingle || state.quaggaBusy || now - state.lastQuaggaScanAt < 450) {
      return Promise.resolve("");
    }

    state.quaggaBusy = true;
    state.lastQuaggaScanAt = now;

    return new Promise((resolve) => {
      try {
        quagga.decodeSingle({
          src: scanCanvas.toDataURL("image/png"),
          locate: true,
          inputStream: {
            size: 960,
            singleChannel: false
          },
          locator: {
            patchSize: "medium",
            halfSample: false
          },
          decoder: {
            readers: [
              "code_128_reader",
              "code_39_reader",
              "code_93_reader",
              "codabar_reader",
              "ean_reader",
              "ean_8_reader",
              "i2of5_reader",
              "upc_reader",
              "upc_e_reader"
            ],
            multiple: false
          }
        }, (result) => {
          state.quaggaBusy = false;
          resolve(result?.codeResult?.code?.trim() || "");
        });
      } catch (error) {
        state.quaggaBusy = false;
        resolve("");
      }
    });
  }

  function getScannerCanvas() {
    if (!state.scannerCanvas) {
      state.scannerCanvas = document.createElement("canvas");
    }

    return state.scannerCanvas;
  }

  function getScanCrop() {
    const sourceWidth = els.barcodeVideo.videoWidth || 1280;
    const sourceHeight = els.barcodeVideo.videoHeight || 720;
    const cropWidth = Math.round(sourceWidth * 0.84);
    const cropHeight = Math.round(sourceHeight * 0.58);

    return {
      sourceX: Math.round((sourceWidth - cropWidth) / 2),
      sourceY: Math.round((sourceHeight - cropHeight) / 2),
      sourceWidth: cropWidth,
      sourceHeight: cropHeight,
      targetWidth: Math.min(1280, cropWidth),
      targetHeight: Math.min(720, cropHeight)
    };
  }

  async function startZxingScanner(stream) {
    const Reader = window.ZXingBrowser?.BrowserMultiFormatReader || window.ZXing?.BrowserMultiFormatReader;

    if (!Reader) {
      return false;
    }

    state.zxingReader = createZxingReader(Reader);

    if (!state.zxingReader) {
      return false;
    }

    const onResult = (result) => {
      const rawValue = (result?.getText ? result.getText() : result?.text || "").trim();
      if (!rawValue || state.scannerLocked) return;
      handleScannedBarcode(rawValue);
      stopScanner();
    };

    const controls = state.zxingReader.decodeFromStream
      ? await state.zxingReader.decodeFromStream(stream, els.barcodeVideo, onResult)
      : await state.zxingReader.decodeFromVideoDevice(undefined, els.barcodeVideo, onResult);
    state.zxingControls = controls || null;
    window.setTimeout(setupFlashButton, 500);
    return true;
  }

  function createZxingReader(Reader) {
    const formats = getZxingFormats();
    const hints = getZxingHints(formats);

    try {
      return new Reader(hints, {
        delayBetweenScanAttempts: 260,
        delayBetweenScanSuccess: 900,
        tryPlayVideoTimeout: 5000
      });
    } catch (error) {
      return new Reader(undefined, {
        delayBetweenScanAttempts: 260,
        delayBetweenScanSuccess: 900,
        tryPlayVideoTimeout: 5000
      });
    }
  }

  function getZxingFormats() {
    const BarcodeFormat = window.ZXingBrowser?.BarcodeFormat || window.ZXing?.BarcodeFormat;

    if (!BarcodeFormat) return null;

    return [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E
    ].filter((format) => format !== undefined);
  }

  function getZxingHints(formats) {
    const DecodeHintType = window.ZXingBrowser?.DecodeHintType || window.ZXing?.DecodeHintType;

    if (!DecodeHintType) return undefined;

    const hints = new Map();

    if (formats?.length) {
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    }

    if (DecodeHintType.TRY_HARDER !== undefined) {
      hints.set(DecodeHintType.TRY_HARDER, true);
    }

    return hints;
  }

  async function startFallbackScanner() {
    const Reader = window.ZXingBrowser?.BrowserMultiFormatReader || window.ZXing?.BrowserMultiFormatReader;

    if (!Reader) {
      setScannerStatus("Scanner Safari belum siap. Coba muat ulang halaman saat internet aktif.", "error");
      return;
    }

    state.zxingReader = createZxingReader(Reader) || new Reader(undefined, {
      delayBetweenScanAttempts: 120,
      delayBetweenScanSuccess: 500,
      tryPlayVideoTimeout: 5000
    });

    const onResult = (result) => {
      const rawValue = (result?.getText ? result.getText() : result?.text || "").trim();
      if (!rawValue || state.scannerLocked) return;
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
    setScannerStatus("Kamera aktif. Arahkan barcode atau QR ke dalam bingkai.", "success");
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
      width: { ideal: 1280 },
      height: { ideal: 720 },
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
    if (state.scannerLocked) return;

    state.scannerLocked = true;
    els.searchInput.value = rawValue;
    renderResults();
    setStatus(`Barcode ${rawValue} terbaca.`, "success");
  }

  function stopScanner(options = {}) {
    if (state.scannerFrame) {
      window.cancelAnimationFrame(state.scannerFrame);
      state.scannerFrame = null;
    }

    if (state.scannerTimer) {
      window.clearTimeout(state.scannerTimer);
      state.scannerTimer = null;
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
    state.scannerLocked = false;
    state.barcodeDetector = null;
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

    if (point && capabilities.zoom && typeof capabilities.zoom.min === "number" && typeof capabilities.zoom.max === "number") {
      const targetZoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 1.1));
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
        await state.zxingControls.streamVideoConstraintsApply({ advanced: [{ torch: nextTorchState }] });
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
      const changed = await applyTorchToTrack(track, nextTorchState);
      if (!changed) {
        throw new Error("Torch constraint rejected");
      }
      state.torchOn = nextTorchState;
      els.flashButton.classList.toggle("is-active", state.torchOn);
      setScannerStatus(state.torchOn ? "Flash aktif." : "Flash mati.", "success");
    } catch (error) {
      state.torchOn = false;
      els.flashButton.classList.remove("is-active");
      setScannerStatus("Flash belum bisa dikontrol oleh browser ini.", "warning");
    }
  }

  async function applyTorchToTrack(track, nextTorchState) {
    const attempts = [
      { advanced: [{ torch: nextTorchState }] },
      { torch: nextTorchState },
      { advanced: [{ fillLightMode: nextTorchState ? "flash" : "off" }] }
    ];

    for (const constraints of attempts) {
      try {
        await track.applyConstraints(constraints);
        return true;
      } catch (error) {
        // Keep trying: Android Chrome/WebView variants expose torch differently.
      }
    }

    if (window.ImageCapture) {
      try {
        const imageCapture = new window.ImageCapture(track);

        if (imageCapture.setOptions) {
          await imageCapture.setOptions({ fillLightMode: nextTorchState ? "flash" : "off" });
          return true;
        }
      } catch (error) {
        return false;
      }
    }

    return false;
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
    const stock = normalizeStockValue(medicine.stok);

    if (!stock) return "0";

    return stock;
  }

  function formatPrice(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const numeric = parseNumberValue(raw);
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
      updateUploadNotification();
      return;
    }

    const uploadedAt = getCachedUploadTimestamp(meta);

    if (!uploadedAt) {
      els.cacheStatus.textContent = "Last updated upload Google Sheet belum tersedia";
      els.cacheStatus.dataset.type = "warning";
      updateUploadNotification();
      return;
    }

    els.cacheStatus.textContent = formatLastUpdated(uploadedAt);
    els.cacheStatus.dataset.type = "success";
    updateUploadNotification();
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

  function normalizeTimestamp(value) {
    const text = String(value || "").trim();
    if (!text) return "";

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";

    return date.toISOString();
  }

  function updateUploadNotification() {
    if (!els.notificationButton || !els.notificationDot) return;

    const meta = readMeta();
    const uploadedAt = getCachedUploadTimestamp(meta);
    const hasUnread = Boolean(meta.hasUploadNotification && uploadedAt);
    const label = uploadedAt
      ? `Data Google Sheet terakhir diupload ${formatLastUpdated(uploadedAt).replace("Last updated ", "")}`
      : "Belum ada informasi upload data Google Sheet";

    els.notificationButton.classList.toggle("has-unread", hasUnread);
    els.notificationDot.hidden = !hasUnread;
    els.notificationButton.title = label;
    els.notificationButton.setAttribute("aria-label", hasUnread ? `Notifikasi baru. ${label}` : label);
  }

  function acknowledgeUploadNotification() {
    const meta = readMeta();
    const uploadedAt = getCachedUploadTimestamp(meta);

    localStorage.setItem(META_KEY, JSON.stringify({
      ...meta,
      hasUploadNotification: false
    }));

    updateUploadNotification();
    openNotificationPopup(uploadedAt);
  }

  function getCachedUploadTimestamp(meta) {
    return normalizeTimestamp(
      meta.uploadedAt ||
      meta.lastUploadAt ||
      meta.uploadUpdatedAt ||
      meta.sourceUpdatedAt ||
      meta.dataUpdatedAt ||
      ""
    );
  }

  function openNotificationPopup(uploadedAt) {
    const message = uploadedAt
      ? `${formatLastUpdated(uploadedAt)}. Waktu ini berdasarkan upload sheet data_obat terakhir, bukan waktu sinkron browser.`
      : "Belum ada informasi waktu upload sheet data_obat terakhir. Upload data Excel baru atau deploy Apps Script terbaru agar informasi ini tersimpan.";

    if (els.notificationMessage) {
      els.notificationMessage.textContent = message;
    }

    if (els.notificationPopover) {
      positionNotificationPopup();
      els.notificationPopover.hidden = false;
      return;
    }

    setStatus(message, uploadedAt ? "success" : "warning");
  }

  function closeNotificationPopup() {
    if (els.notificationPopover) {
      els.notificationPopover.hidden = true;
    }
  }

  function positionNotificationPopup() {
    if (!els.notificationPopover || !els.notificationButton) return;
    const rect = els.notificationButton.getBoundingClientRect();
    const width = Math.min(380, window.innerWidth - 24);
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width));
    els.notificationPopover.style.width = `${width}px`;
    els.notificationPopover.style.left = `${left}px`;
    els.notificationPopover.style.top = `${rect.bottom + 10}px`;
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
