(function () {
  const API_URL = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec?sheet=data_obat";
  const SESSION_KEY = "nadhira.authSession";
  const META_KEY = "nadhira.obatCacheMeta";
  const HOME_UPLOAD_ACK_KEY = "nadhira.homeUploadNotificationSeenAt";
  const PAGE_SIZE = 10;
  const SHEET_COLUMNS = [
    "kode",
    "nama",
    "kategori",
    "stok",
    "satuan_beli",
    "harga_beli",
    "stok_min",
    "satuan_1",
    "satuan_2",
    "satuan_3",
    "satuan_4",
    "isi_1",
    "isi_2",
    "isi_3",
    "isi_4",
    "harga_jual_1",
    "harga_jual_2",
    "harga_jual_3",
    "harga_jual_4",
    "harga_resep_1",
    "harga_resep_2",
    "harga_resep_3",
    "harga_resep_4",
    "laba_otomatis",
    "suplier",
    "pabrik",
    "expired",
    "indikasi",
    "komposisi",
    "lokasi",
    "no_batch"
  ];

  const state = {
    rows: [],
    filtered: [],
    page: 1,
    uploadedAt: ""
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (document.body.dataset.page !== "home") return;

    bindElements();
    if (!els.tableHead || !els.tableBody) return;

    hydrateProfileName();
    renderTableHead();
    bindEvents();
    fetchDataObat();
  }

  function bindElements() {
    els.searchInput = document.getElementById("dashboardSearchInput");
    els.refreshButton = document.getElementById("dashboardRefreshButton");
    els.tableHead = document.getElementById("dashboardTableHead");
    els.tableBody = document.getElementById("dashboardTableBody");
    els.statusText = document.getElementById("dashboardStatusText");
    els.updatedText = document.getElementById("dashboardUpdatedText");
    els.pageInfo = document.getElementById("dashboardPageInfo");
    els.pageNumber = document.getElementById("dashboardPageNumber");
    els.prevButton = document.getElementById("dashboardPrevButton");
    els.nextButton = document.getElementById("dashboardNextButton");
    els.statTotal = document.getElementById("statTotal");
    els.statActive = document.getElementById("statActive");
    els.statActivePercent = document.getElementById("statActivePercent");
    els.statLowStock = document.getElementById("statLowStock");
    els.statExpired = document.getElementById("statExpired");
    els.profileName = document.getElementById("dashboardProfileName");
    els.notificationButton = document.getElementById("homeNotificationButton");
    els.notificationDot = document.getElementById("homeNotificationDot");
    els.notificationPopover = document.getElementById("homeNotificationPopover");
    els.notificationMessage = document.getElementById("homeNotificationMessage");
    els.notificationCloseButton = document.getElementById("homeNotificationCloseButton");
    els.notificationOkButton = document.getElementById("homeNotificationOkButton");
  }

  function bindEvents() {
    els.searchInput.addEventListener("input", () => {
      state.page = 1;
      applySearch();
    });

    els.refreshButton.addEventListener("click", () => fetchDataObat({ manual: true }));
    els.prevButton.addEventListener("click", () => changePage(-1));
    els.nextButton.addEventListener("click", () => changePage(1));

    if (els.notificationButton) {
      els.notificationButton.addEventListener("click", openNotification);
    }

    [els.notificationCloseButton, els.notificationOkButton].forEach((button) => {
      if (button) button.addEventListener("click", closeNotification);
    });

    if (els.notificationPopover) {
      els.notificationPopover.addEventListener("click", (event) => {
        if (event.target === els.notificationPopover) closeNotification();
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNotification();
    });
  }

  async function fetchDataObat(options = {}) {
    setLoading(true, options.manual ? "Memperbarui data obat..." : "Memuat data obat dari Google Sheet...");

    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.text();
      const parsed = parsePayload(payload);
      state.rows = parsed.rows.map(normalizeSheetRow).filter((row) => hasRowValue(row));
      state.uploadedAt = normalizeTimestamp(
        parsed.meta.uploadedAt ||
        parsed.meta.lastUploadAt ||
        parsed.meta.uploadUpdatedAt ||
        parsed.meta.dataUpdatedAt ||
        parsed.meta.updatedAt ||
        ""
      );

      persistMeta();
      applySearch();
      renderStats();
      renderUploadInfo();
      updateNotificationState();
      setLoading(false, `${state.rows.length} data obat berhasil dimuat.`);
    } catch (error) {
      setLoading(false, `Gagal memuat data obat: ${error.message}`);
      els.statusText.dataset.type = "error";
      state.rows = [];
      applySearch();
      renderStats();
      renderUploadInfo();
      updateNotificationState();
    }
  }

  function parsePayload(payload) {
    const text = String(payload || "").trim();
    if (!text) return { rows: [], meta: {} };

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

    return { rows: [], meta };
  }

  function matrixToObjects(values) {
    if (!Array.isArray(values) || values.length < 2) return [];
    const headers = values[0].map((header) => String(header || "").trim());

    return values.slice(1).map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        if (header) item[header] = row[index];
      });
      return item;
    });
  }

  function normalizeSheetRow(row) {
    return SHEET_COLUMNS.reduce((result, column) => {
      result[column] = pickColumnValue(row, column);
      return result;
    }, {});
  }

  function pickColumnValue(row, column) {
    if (!row || typeof row !== "object") return "";
    const aliases = getColumnAliases(column);

    for (let index = 0; index < aliases.length; index += 1) {
      const key = aliases[index];
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
        return row[key];
      }
    }

    const normalizedColumn = normalizeKey(column);
    const matchedKey = Object.keys(row).find((key) => normalizeKey(key) === normalizedColumn);
    return matchedKey ? row[matchedKey] : "";
  }

  function getColumnAliases(column) {
    const aliases = {
      kode: ["kode", "barcode", "id", "sku"],
      suplier: ["suplier", "supplier"],
      no_batch: ["no_batch", "nobatch", "batch"],
      satuan_beli: ["satuan_beli", "satuanbeli"],
      harga_beli: ["harga_beli", "hargabeli"],
      stok_min: ["stok_min", "stokmin"],
      laba_otomatis: ["laba_otomatis", "labaotomatis"]
    };

    return [column].concat(aliases[column] || []);
  }

  function hasRowValue(row) {
    return SHEET_COLUMNS.some((column) => String(row[column] || "").trim() !== "");
  }

  function applySearch() {
    const query = normalizeSearch(els.searchInput.value);

    state.filtered = query
      ? state.rows.filter((row) => SHEET_COLUMNS.some((column) => normalizeSearch(row[column]).includes(query)))
      : state.rows.slice();

    renderTableBody();
    renderFooter();
  }

  function renderTableHead() {
    els.tableHead.innerHTML = `
      <tr>
        <th>No</th>
        ${SHEET_COLUMNS.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}
      </tr>
    `;
  }

  function renderTableBody() {
    const totalPages = getTotalPages();
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const start = (state.page - 1) * PAGE_SIZE;
    const rows = state.filtered.slice(start, start + PAGE_SIZE);

    if (!rows.length) {
      els.tableBody.innerHTML = `
        <tr>
          <td class="empty-table-cell" colspan="${SHEET_COLUMNS.length + 1}">Data obat tidak ditemukan.</td>
        </tr>
      `;
      return;
    }

    els.tableBody.innerHTML = rows.map((row, index) => `
      <tr>
        <td>${start + index + 1}</td>
        ${SHEET_COLUMNS.map((column) => `<td>${escapeHtml(formatCell(row[column]))}</td>`).join("")}
      </tr>
    `).join("");
  }

  function renderFooter() {
    const start = state.filtered.length ? (state.page - 1) * PAGE_SIZE + 1 : 0;
    const end = Math.min(state.page * PAGE_SIZE, state.filtered.length);
    const totalPages = getTotalPages();

    els.pageInfo.textContent = `Menampilkan ${start} - ${end} dari ${state.filtered.length} data`;
    els.pageNumber.textContent = String(state.page);
    els.prevButton.disabled = state.page <= 1;
    els.nextButton.disabled = state.page >= totalPages;
  }

  function renderStats() {
    const total = state.rows.length;
    const statusValues = state.rows.map((row) => normalizeSearch(row.status)).filter(Boolean);
    const active = statusValues.length
      ? state.rows.filter((row) => !["nonaktif", "inactive", "tidak aktif"].includes(normalizeSearch(row.status))).length
      : total;
    const lowStock = state.rows.filter(isLowStock).length;
    const expired = state.rows.filter(isExpired).length;
    const percent = total ? Math.round((active / total) * 1000) / 10 : 0;

    els.statTotal.textContent = formatNumber(total);
    els.statActive.textContent = formatNumber(active);
    els.statActivePercent.textContent = `${percent}% dari total`;
    els.statLowStock.textContent = formatNumber(lowStock);
    els.statExpired.textContent = formatNumber(expired);
  }

  function renderUploadInfo() {
    els.updatedText.textContent = state.uploadedAt
      ? formatLastUpdated(state.uploadedAt)
      : "Last updated upload Google Sheet belum tersedia";
  }

  function updateNotificationState() {
    if (!els.notificationButton || !els.notificationDot) return;

    const seenAt = normalizeTimestamp(localStorage.getItem(HOME_UPLOAD_ACK_KEY) || "");
    const hasUnread = Boolean(state.uploadedAt && state.uploadedAt !== seenAt);
    const label = state.uploadedAt
      ? `${formatLastUpdated(state.uploadedAt)} berdasarkan upload sheet data_obat terakhir`
      : "Belum ada informasi upload sheet data_obat terakhir";

    els.notificationDot.hidden = !hasUnread;
    els.notificationButton.classList.toggle("has-unread", hasUnread);
    els.notificationButton.title = label;
    els.notificationButton.setAttribute("aria-label", hasUnread ? `Notifikasi baru. ${label}` : label);
  }

  function openNotification() {
    if (state.uploadedAt) {
      localStorage.setItem(HOME_UPLOAD_ACK_KEY, state.uploadedAt);
    }

    updateNotificationState();

    const message = state.uploadedAt
      ? `${formatLastUpdated(state.uploadedAt)}. Waktu ini berdasarkan upload sheet data_obat terakhir, bukan waktu sinkron browser.`
      : "Belum ada informasi waktu upload sheet data_obat terakhir. Upload data Excel baru atau pastikan Apps Script terbaru sudah dipakai.";

    if (els.notificationMessage) els.notificationMessage.textContent = message;
    if (els.notificationPopover) els.notificationPopover.hidden = false;
  }

  function closeNotification() {
    if (els.notificationPopover) els.notificationPopover.hidden = true;
  }

  function persistMeta() {
    const previous = readMeta();
    localStorage.setItem(META_KEY, JSON.stringify({
      ...previous,
      uploadedAt: state.uploadedAt || previous.uploadedAt || "",
      total: state.rows.length,
      source: API_URL
    }));
  }

  function readMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function hydrateProfileName() {
    if (!els.profileName) return;
    const session = readSession();
    const name = String(session?.name || session?.username || session?.email || "Akun").trim() || "Akun";
    els.profileName.textContent = name;
  }

  function readSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function changePage(delta) {
    const totalPages = getTotalPages();
    state.page = Math.min(Math.max(state.page + delta, 1), totalPages);
    renderTableBody();
    renderFooter();
  }

  function getTotalPages() {
    return Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  }

  function setLoading(isLoading, message) {
    els.refreshButton.disabled = isLoading;
    els.refreshButton.classList.toggle("is-loading", isLoading);
    els.statusText.textContent = message;
    els.statusText.dataset.type = isLoading ? "info" : "success";
  }

  function isLowStock(row) {
    const stock = parseNumber(row.stok);
    const minimum = parseNumber(row.stok_min);
    if (minimum > 0) return stock <= minimum;
    return stock > 0 && stock <= 5;
  }

  function isExpired(row) {
    const date = parseDateValue(row.expired);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function parseDateValue(value) {
    const text = String(value || "").trim();
    if (!text || text === "-") return null;

    const numeric = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (numeric) {
      const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
      return new Date(Number(year), Number(numeric[2]) - 1, Number(numeric[1]));
    }

    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }

    const monthMap = {
      jan: 0,
      januari: 0,
      feb: 1,
      februari: 1,
      mar: 2,
      maret: 2,
      apr: 3,
      april: 3,
      mei: 4,
      jun: 5,
      juni: 5,
      jul: 6,
      juli: 6,
      agu: 7,
      agustus: 7,
      sep: 8,
      september: 8,
      okt: 9,
      oktober: 9,
      nov: 10,
      november: 10,
      des: 11,
      desember: 11
    };
    const local = text.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if (local && monthMap[local[2]] !== undefined) {
      return new Date(Number(local[3]), monthMap[local[2]], Number(local[1]));
    }

    return null;
  }

  function parseNumber(value) {
    const text = String(value || "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", ".");
    const numeric = Number(text);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function normalizeTimestamp(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function formatLastUpdated(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Last updated belum tersedia";

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

  function formatCell(value) {
    const text = String(value ?? "").trim();
    return text || "-";
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("id-ID").format(value);
  }

  function normalizeSearch(value) {
    return String(value || "").trim().toLowerCase().replace(/_/g, " ");
  }

  function normalizeKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
