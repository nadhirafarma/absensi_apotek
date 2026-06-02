(function () {
  const API_BASE = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec";
  const API_URL = `${API_BASE}?sheet=data_obat`;
  const SESSION_KEY = "nadhira.authSession";
  const META_KEY = "nadhira.obatCacheMeta";
  const HOME_UPLOAD_ACK_KEY = "nadhira.homeUploadNotificationSeenAt";
  const COLUMN_KEY = "nadhira.dashboardVisibleColumns";
  const EMPLOYEE_KEY = "nadhira.employeeRecords";
  const SUPPLIER_KEY = "nadhira.supplierRecords";
  const USER_KEY = "nadhira.userRecords";
  const PO_KEY = "nadhira.purchaseOrders";
  const SIDEBAR_KEY = "nadhira.sidebarCollapsed";
  const PROFILE_KEY = "nadhira.localProfile";
  const PROFILE_SECURITY_KEY = "nadhira.profileSecurity";
  const PROFILE_ACTIVITY_KEY = "nadhira.profileActivity";
  const PROFILE_PREFS_KEY = "nadhira.profilePreferences";
  const PAGE_SIZE = 10;
  const EXPIRING_DAYS = 90;

  const DATA_COLUMNS = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama" },
    { key: "kategori", label: "Kategori" },
    { key: "stok", label: "Stok", type: "number" },
    { key: "satuan_beli", label: "Satuan Beli" },
    { key: "harga_beli", label: "Harga Beli" },
    { key: "stok_min", label: "Stok Min", type: "number" },
    { key: "satuan_1", label: "Satuan 1" },
    { key: "satuan_2", label: "Satuan 2" },
    { key: "satuan_3", label: "Satuan 3" },
    { key: "satuan_4", label: "Satuan 4" },
    { key: "isi_1", label: "Isi 1" },
    { key: "isi_2", label: "Isi 2" },
    { key: "isi_3", label: "Isi 3" },
    { key: "isi_4", label: "Isi 4" },
    { key: "harga_jual_1", label: "Harga Jual 1" },
    { key: "harga_jual_2", label: "Harga Jual 2" },
    { key: "harga_jual_3", label: "Harga Jual 3" },
    { key: "harga_jual_4", label: "Harga Jual 4" },
    { key: "harga_resep_1", label: "Harga Resep 1" },
    { key: "harga_resep_2", label: "Harga Resep 2" },
    { key: "harga_resep_3", label: "Harga Resep 3" },
    { key: "harga_resep_4", label: "Harga Resep 4" },
    { key: "laba_otomatis", label: "Laba Otomatis" },
    { key: "suplier", label: "Supplier" },
    { key: "pabrik", label: "Pabrik" },
    { key: "expired", label: "Expired" },
    { key: "indikasi", label: "Indikasi" },
    { key: "komposisi", label: "Komposisi" },
    { key: "lokasi", label: "Lokasi" },
    { key: "no_batch", label: "No Batch" }
  ];

  const DEFAULT_VISIBLE_COLUMNS = [
    "kode",
    "nama",
    "kategori",
    "stok",
    "satuan_beli",
    "harga_beli",
    "stok_min",
    "satuan_1",
    "satuan_2",
    "expired",
    "suplier",
    "lokasi",
    "no_batch"
  ];

  const VIEW_TITLES = {
    dashboard: "Dashboard",
    "data-obat": "Data Obat",
    "data-karyawan": "Data Karyawan",
    "data-supplier": "Data Supplier",
    "surat-pesanan": "Surat Pesanan Pembelian",
    "import-data-obat": "Import Data Obat",
    "akun-profil": "Akun & Profil",
    "manajemen-pengguna": "Manajemen Pengguna"
  };

  const ACCESS_MENUS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "absensi_face_id", label: "Absensi Face ID" },
    { key: "cari_data_obat", label: "Cari Data Obat" },
    { key: "data_obat", label: "Data Obat" },
    { key: "edit_obat", label: "Tambah/Edit Obat" },
    { key: "hapus_obat", label: "Hapus Obat" },
    { key: "data_karyawan", label: "Data Karyawan" },
    { key: "data_supplier", label: "Data Supplier" },
    { key: "surat_pesanan", label: "Surat Pesanan Pembelian" },
    { key: "import_data_obat", label: "Import Data Obat" },
    { key: "akun_profil", label: "Akun & Profil" },
    { key: "manajemen_pengguna", label: "Manajemen Pengguna" }
  ];

  const ROLE_ACCESS = {
    administrator: ACCESS_MENUS.map((item) => item.key),
    admin: ACCESS_MENUS.map((item) => item.key),
    apoteker: ["dashboard", "absensi_face_id", "cari_data_obat", "data_obat", "edit_obat", "data_karyawan", "data_supplier", "surat_pesanan", "import_data_obat", "akun_profil"],
    kasir: ["dashboard", "absensi_face_id", "cari_data_obat", "data_obat", "akun_profil"],
    "staf gudang": ["dashboard", "absensi_face_id", "cari_data_obat", "data_obat", "edit_obat", "data_supplier", "surat_pesanan", "import_data_obat", "akun_profil"],
    operator: ["dashboard", "absensi_face_id", "cari_data_obat", "akun_profil"]
  };

  const LOCAL_SCHEMAS = {
    employee: {
      title: "Karyawan",
      storageKey: EMPLOYEE_KEY,
      fields: [
        { key: "name", label: "Nama Lengkap", required: true },
        { key: "phone", label: "No. HP" },
        { key: "address", label: "Alamat", wide: true },
        { key: "job", label: "Jabatan" },
        { key: "email", label: "Email", type: "email" }
      ]
    },
    supplier: {
      title: "Supplier",
      storageKey: SUPPLIER_KEY,
      fields: [
        { key: "name", label: "Nama Supplier", required: true },
        { key: "address", label: "Alamat", wide: true },
        { key: "phone", label: "No HP" },
        { key: "pic", label: "PIC/Sales" }
      ]
    },
    user: {
      title: "Operator",
      storageKey: USER_KEY,
      fields: [
        { key: "name", label: "Nama Operator", required: true },
        { key: "username", label: "Username", required: true },
        { key: "role", label: "Role", type: "select", options: ["Administrator", "Apoteker", "Kasir", "Staf Gudang", "Operator"] },
        { key: "status", label: "Status", type: "select", options: ["Aktif", "Non Aktif"] },
        { key: "email", label: "Email", type: "email" },
        { key: "access", label: "Akses Menu & Fungsi", type: "access", wide: true }
      ]
    }
  };

  const state = {
    rows: [],
    filtered: [],
    page: 1,
    uploadedAt: "",
    visibleColumns: loadVisibleColumns(),
    users: [],
    employees: [],
    suppliers: [],
    purchaseItems: [],
    purchaseOrders: [],
    importHeaders: [],
    importRows: [],
    scannerStream: null,
    scannerDetector: null,
    scannerAnimation: 0,
    activeView: "dashboard",
    medicineMode: "edit",
    editingMedicine: null,
    unitCount: 4,
    recordType: "",
    recordIndex: -1,
    pendingDelete: null
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (document.body.dataset.page !== "home") return;

    bindElements();
    if (!els.tableHead || !els.tableBody) return;

    applySavedSidebarState();
    hydrateProfileName();
    bindEvents();
    renderColumnOptions();
    renderMedicineForm();
    renderTableHead();
    applyProfilePreferences();
    renderProfile();
    renderProfileSecurity();
    renderProfileActivity();
    loadStoredModules();
    fetchDataObat();
    fetchUsers();
  }

  function bindElements() {
    Object.assign(els, {
      sidebarToggle: document.getElementById("sidebarToggle"),
      sidebarScrim: document.getElementById("sidebarScrim"),
      viewTitle: document.getElementById("dashboardViewTitle"),
      viewButtons: Array.from(document.querySelectorAll("[data-view-target]")),
      views: Array.from(document.querySelectorAll(".dashboard-view")),
      searchInput: document.getElementById("dashboardSearchInput"),
      filterButton: document.getElementById("dashboardFilterButton"),
      filterPanel: document.getElementById("dashboardFilterPanel"),
      filterCategory: document.getElementById("filterCategory"),
      filterSupplier: document.getElementById("filterSupplier"),
      filterStockLevel: document.getElementById("filterStockLevel"),
      filterExpiredLevel: document.getElementById("filterExpiredLevel"),
      resetFiltersButton: document.getElementById("resetDashboardFiltersButton"),
      columnOptions: document.getElementById("dashboardColumnOptions"),
      refreshButton: document.getElementById("dashboardRefreshButton"),
      addMedicineButton: document.getElementById("addMedicineButton"),
      barcodeButton: document.getElementById("dashboardBarcodeButton"),
      tableHead: document.getElementById("dashboardTableHead"),
      tableBody: document.getElementById("dashboardTableBody"),
      statusText: document.getElementById("dashboardStatusText"),
      updatedText: document.getElementById("dashboardUpdatedText"),
      pageInfo: document.getElementById("dashboardPageInfo"),
      pageNumber: document.getElementById("dashboardPageNumber"),
      prevButton: document.getElementById("dashboardPrevButton"),
      nextButton: document.getElementById("dashboardNextButton"),
      profileName: document.getElementById("dashboardProfileName"),
      notificationButton: document.getElementById("homeNotificationButton"),
      notificationDot: document.getElementById("homeNotificationDot"),
      notificationPopover: document.getElementById("homeNotificationPopover"),
      notificationMessage: document.getElementById("homeNotificationMessage"),
      notificationCloseButton: document.getElementById("homeNotificationCloseButton"),
      notificationOkButton: document.getElementById("homeNotificationOkButton"),
      medicineModal: document.getElementById("medicineModal"),
      medicineForm: document.getElementById("medicineForm"),
      medicineFormFields: document.getElementById("medicineFormFields"),
      medicineModalTitle: document.getElementById("medicineModalTitle"),
      medicineModalStatus: document.getElementById("medicineModalStatus"),
      closeMedicineModalButton: document.getElementById("closeMedicineModalButton"),
      cancelMedicineButton: document.getElementById("cancelMedicineButton"),
      addUnitButton: document.getElementById("addUnitButton"),
      removeUnitButton: document.getElementById("removeUnitButton"),
      recordModal: document.getElementById("recordModal"),
      recordForm: document.getElementById("recordForm"),
      recordFormFields: document.getElementById("recordFormFields"),
      recordModalTitle: document.getElementById("recordModalTitle"),
      recordModalStatus: document.getElementById("recordModalStatus"),
      closeRecordModalButton: document.getElementById("closeRecordModalButton"),
      cancelRecordButton: document.getElementById("cancelRecordButton"),
      deleteModal: document.getElementById("deleteModal"),
      deleteModalText: document.getElementById("deleteModalText"),
      cancelDeleteButton: document.getElementById("cancelDeleteButton"),
      confirmDeleteButton: document.getElementById("confirmDeleteButton"),
      scannerModal: document.getElementById("dashboardScannerModal"),
      scannerVideo: document.getElementById("dashboardScannerVideo"),
      scannerStatus: document.getElementById("dashboardScannerStatus"),
      closeScannerButton: document.getElementById("closeDashboardScannerButton"),
      stopScannerButton: document.getElementById("stopDashboardScannerButton"),
      manualBarcodeButton: document.getElementById("manualBarcodeButton"),
      employeeTableBody: document.getElementById("employeeTableBody"),
      addEmployeeButton: document.getElementById("addEmployeeButton"),
      supplierTableBody: document.getElementById("supplierTableBody"),
      addSupplierButton: document.getElementById("addSupplierButton"),
      poForm: document.getElementById("purchaseOrderForm"),
      poSupplier: document.getElementById("poSupplier"),
      poDate: document.getElementById("poDate"),
      poMedicine: document.getElementById("poMedicine"),
      poQty: document.getElementById("poQty"),
      poUnit: document.getElementById("poUnit"),
      addPoItemButton: document.getElementById("addPoItemButton"),
      printPoButton: document.getElementById("printPoButton"),
      poItemsList: document.getElementById("poItemsList"),
      poSavedList: document.getElementById("poSavedList"),
      poNumber: document.getElementById("poNumber"),
      importFileInput: document.getElementById("importFileInput"),
      importMode: document.getElementById("importMode"),
      importButton: document.getElementById("importButton"),
      importSummary: document.getElementById("importSummary"),
      importStatus: document.getElementById("importStatus"),
      profileForm: document.getElementById("profileForm"),
      profileLargeAvatar: document.getElementById("profileLargeAvatar"),
      profileDisplayName: document.getElementById("profileDisplayName"),
      profileDisplayRole: document.getElementById("profileDisplayRole"),
      profileUsername: document.getElementById("profileUsername"),
      profileEmail: document.getElementById("profileEmail"),
      profileRole: document.getElementById("profileRole"),
      profileTabButtons: Array.from(document.querySelectorAll("[data-profile-tab]")),
      profilePanels: Array.from(document.querySelectorAll("[data-profile-panel]")),
      profileStatusText: document.getElementById("profileStatusText"),
      profileNameInput: document.getElementById("profileNameInput"),
      profileEmailInput: document.getElementById("profileEmailInput"),
      profilePhoneInput: document.getElementById("profilePhoneInput"),
      profileJobInput: document.getElementById("profileJobInput"),
      profileAddressInput: document.getElementById("profileAddressInput"),
      profilePasswordForm: document.getElementById("profilePasswordForm"),
      profileNewPasswordInput: document.getElementById("profileNewPasswordInput"),
      profileConfirmPasswordInput: document.getElementById("profileConfirmPasswordInput"),
      profileTwoFactorToggle: document.getElementById("profileTwoFactorToggle"),
      profileActivityList: document.getElementById("profileActivityList"),
      clearProfileActivityButton: document.getElementById("clearProfileActivityButton"),
      profileCompactToggle: document.getElementById("profileCompactToggle"),
      profileSidebarCompactToggle: document.getElementById("profileSidebarCompactToggle"),
      userTableBody: document.getElementById("userTableBody"),
      addUserButton: document.getElementById("addUserButton"),
      userSearchInput: document.getElementById("userSearchInput"),
      userRoleFilter: document.getElementById("userRoleFilter"),
      userStatusFilter: document.getElementById("userStatusFilter"),
      reportTotal: document.getElementById("reportTotal"),
      reportActive: document.getElementById("reportActive"),
      reportExpiring: document.getElementById("reportExpiring"),
      reportExpired: document.getElementById("reportExpired"),
      reportEmpty: document.getElementById("reportEmpty"),
      reportLow: document.getElementById("reportLow"),
      reportOut: document.getElementById("reportOut")
    });
  }

  function bindEvents() {
    if (els.sidebarToggle) els.sidebarToggle.addEventListener("click", toggleSidebar);
    if (els.sidebarScrim) els.sidebarScrim.addEventListener("click", () => setSidebarCollapsed(true));

    els.viewButtons.forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.viewTarget));
    });

    if (els.searchInput) {
      els.searchInput.addEventListener("input", () => {
        state.page = 1;
        applyFilters();
      });
    }

    [els.filterCategory, els.filterSupplier, els.filterStockLevel, els.filterExpiredLevel].forEach((control) => {
      if (control) control.addEventListener("change", () => {
        state.page = 1;
        applyFilters();
      });
    });

    if (els.filterButton) {
      els.filterButton.addEventListener("click", () => {
        els.filterPanel.hidden = !els.filterPanel.hidden;
      });
    }

    if (els.resetFiltersButton) els.resetFiltersButton.addEventListener("click", resetDashboardFilters);
    if (els.refreshButton) els.refreshButton.addEventListener("click", () => fetchDataObat({ manual: true }));
    if (els.prevButton) els.prevButton.addEventListener("click", () => changePage(-1));
    if (els.nextButton) els.nextButton.addEventListener("click", () => changePage(1));
    if (els.addMedicineButton) els.addMedicineButton.addEventListener("click", () => openMedicineModal("add"));
    if (els.barcodeButton) els.barcodeButton.addEventListener("click", startDashboardScanner);

    els.tableBody.addEventListener("click", handleTableAction);

    [els.closeMedicineModalButton, els.cancelMedicineButton].forEach((button) => {
      if (button) button.addEventListener("click", closeMedicineModal);
    });

    if (els.addUnitButton) els.addUnitButton.addEventListener("click", () => setUnitCount(state.unitCount + 1));
    if (els.removeUnitButton) els.removeUnitButton.addEventListener("click", () => setUnitCount(state.unitCount - 1));
    if (els.medicineForm) els.medicineForm.addEventListener("submit", saveMedicine);

    [els.closeRecordModalButton, els.cancelRecordButton].forEach((button) => {
      if (button) button.addEventListener("click", closeRecordModal);
    });

    if (els.recordForm) els.recordForm.addEventListener("submit", saveRecord);
    if (els.cancelDeleteButton) els.cancelDeleteButton.addEventListener("click", closeDeleteModal);
    if (els.confirmDeleteButton) els.confirmDeleteButton.addEventListener("click", confirmDelete);
    [els.closeScannerButton, els.stopScannerButton].forEach((button) => {
      if (button) button.addEventListener("click", stopDashboardScanner);
    });
    if (els.manualBarcodeButton) els.manualBarcodeButton.addEventListener("click", useManualBarcodeInput);
    if (els.scannerModal) {
      els.scannerModal.addEventListener("click", (event) => {
        if (event.target === els.scannerModal) stopDashboardScanner();
      });
    }

    if (els.addEmployeeButton) els.addEmployeeButton.addEventListener("click", () => openRecordModal("employee", -1));
    if (els.addSupplierButton) els.addSupplierButton.addEventListener("click", () => openRecordModal("supplier", -1));
    if (els.addUserButton) els.addUserButton.addEventListener("click", () => openRecordModal("user", -1));

    [els.employeeTableBody, els.supplierTableBody, els.userTableBody].forEach((tbody) => {
      if (tbody) tbody.addEventListener("click", handleLocalTableAction);
    });

    [els.userSearchInput, els.userRoleFilter, els.userStatusFilter].forEach((control) => {
      if (control) control.addEventListener("input", renderUsers);
      if (control) control.addEventListener("change", renderUsers);
    });

    if (els.addPoItemButton) els.addPoItemButton.addEventListener("click", addPurchaseItem);
    if (els.poForm) els.poForm.addEventListener("submit", savePurchaseOrder);
    if (els.printPoButton) els.printPoButton.addEventListener("click", () => window.print());
    if (els.importFileInput) els.importFileInput.addEventListener("change", handleImportFileChange);
    if (els.importButton) els.importButton.addEventListener("click", importExcelToGoogleSheet);
    if (els.profileForm) els.profileForm.addEventListener("submit", saveProfile);
    if (els.profilePasswordForm) els.profilePasswordForm.addEventListener("submit", saveProfilePassword);
    if (els.profileTwoFactorToggle) els.profileTwoFactorToggle.addEventListener("change", saveProfileSecurity);
    if (els.clearProfileActivityButton) els.clearProfileActivityButton.addEventListener("click", clearProfileActivity);
    if (els.profileCompactToggle) els.profileCompactToggle.addEventListener("change", saveProfilePreferences);
    if (els.profileSidebarCompactToggle) els.profileSidebarCompactToggle.addEventListener("change", saveProfilePreferences);
    els.profileTabButtons.forEach((button) => {
      button.addEventListener("click", () => switchProfileTab(button.dataset.profileTab));
    });

    if (els.notificationButton) els.notificationButton.addEventListener("click", openNotification);
    [els.notificationCloseButton, els.notificationOkButton].forEach((button) => {
      if (button) button.addEventListener("click", closeNotification);
    });
    if (els.notificationPopover) {
      els.notificationPopover.addEventListener("click", (event) => {
        if (event.target === els.notificationPopover) closeNotification();
      });
    }

    [els.medicineModal, els.recordModal, els.deleteModal].forEach((modal) => {
      if (modal) {
        modal.addEventListener("click", (event) => {
          if (event.target === modal) hideModal(modal);
        });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNotification();
        if (isMobileViewport()) setSidebarCollapsed(true);
        closeMedicineModal();
        closeRecordModal();
        closeDeleteModal();
        stopDashboardScanner();
      }
    });
    window.addEventListener("resize", () => {
      const collapsed = document.body.classList.contains("sidebar-collapsed");
      if (els.sidebarScrim) els.sidebarScrim.hidden = collapsed || !isMobileViewport();
      if (els.notificationPopover && !els.notificationPopover.hidden) positionNotificationPopover();
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
      syncSupplierSeed();
      populateFilterOptions();
      populateMedicineOptions();
      applyFilters();
      renderUploadInfo();
      updateNotificationState();
      renderSuppliers();
      renderReports();
      setLoading(false, `${state.rows.length} data obat berhasil dimuat.`);
    } catch (error) {
      setLoading(false, `Gagal memuat data obat: ${error.message}`);
      if (els.statusText) els.statusText.dataset.type = "error";
      state.rows = [];
      applyFilters();
      renderUploadInfo();
      updateNotificationState();
      renderReports();
    }
  }

  async function fetchUsers() {
    try {
      const payload = await postToApi({ action: "listLoginUsers" });
      if (!payload || payload.success !== true || !Array.isArray(payload.users)) return;

      state.users = payload.users.map((user, index) => ({
        id: `sheet-user-${index}`,
        name: String(user.name || user.username || user.email || "").trim(),
        username: String(user.username || user.name || "").trim(),
        role: String(user.role || "Operator").trim() || "Operator",
        status: String(user.status || "Aktif").trim() || "Aktif",
        email: String(user.email || "").trim(),
        access: getDefaultAccessForRole(user.role || "Operator")
      })).filter((user) => user.name || user.username);

      syncEmployeeSeed();
      syncUserSeed();
      renderEmployees();
      renderUsers();
      renderProfile();
      applyCurrentUserAccess();
    } catch (error) {
      syncEmployeeSeed();
      syncUserSeed();
      renderEmployees();
      renderUsers();
      applyCurrentUserAccess();
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
    const result = DATA_COLUMNS.reduce((acc, column) => {
      acc[column.key] = pickColumnValue(row, column.key);
      return acc;
    }, {});

    result._row = pickColumnValue(row, "_row") || pickColumnValue(row, "row") || pickColumnValue(row, "rowNumber") || "";
    return result;
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
      laba_otomatis: ["laba_otomatis", "labaotomatis"],
      _row: ["_row", "row", "rowNumber", "nomorbaris"]
    };

    return [column].concat(aliases[column] || []);
  }

  function hasRowValue(row) {
    return DATA_COLUMNS.some((column) => String(row[column.key] || "").trim() !== "");
  }

  function populateFilterOptions() {
    setSelectOptions(els.filterCategory, uniqueValues("kategori"), "Semua kategori");
    setSelectOptions(els.filterSupplier, uniqueValues("suplier"), "Semua supplier");
  }

  function populateMedicineOptions() {
    setSelectOptions(els.poSupplier, uniqueValues("suplier"), "Pilih supplier");

    if (els.poMedicine) {
      const options = state.rows
        .map((row, index) => ({
          value: String(index),
          label: [row.kode, row.nama].filter(Boolean).join(" - ") || `Obat ${index + 1}`
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "id", { sensitivity: "base" }));

      els.poMedicine.innerHTML = `<option value="">Pilih obat</option>${options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("")}`;
    }
  }

  function setSelectOptions(select, values, placeholder) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`;
    if (values.includes(current)) select.value = current;
  }

  function uniqueValues(key) {
    return unique(state.rows.map((row) => row[key]).filter((value) => String(value || "").trim()))
      .sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
  }

  function applyFilters() {
    const query = normalizeSearch(els.searchInput ? els.searchInput.value : "");
    const category = normalizeSearch(els.filterCategory ? els.filterCategory.value : "");
    const supplier = normalizeSearch(els.filterSupplier ? els.filterSupplier.value : "");
    const stockLevel = els.filterStockLevel ? els.filterStockLevel.value : "";
    const expiredLevel = els.filterExpiredLevel ? els.filterExpiredLevel.value : "";

    state.filtered = state.rows.filter((row) => {
      const searchMatch = !query || DATA_COLUMNS.some((column) => normalizeSearch(row[column.key]).includes(query));
      const categoryMatch = !category || normalizeSearch(row.kategori) === category;
      const supplierMatch = !supplier || normalizeSearch(row.suplier) === supplier;
      const stockMatch = !stockLevel || getStockStatus(row) === stockLevel;
      const expiredMatch = !expiredLevel || getExpiredStatus(row) === expiredLevel;

      return searchMatch && categoryMatch && supplierMatch && stockMatch && expiredMatch;
    });

    renderTableBody();
    renderFooter();
  }

  function resetDashboardFilters() {
    if (els.searchInput) els.searchInput.value = "";
    [els.filterCategory, els.filterSupplier, els.filterStockLevel, els.filterExpiredLevel].forEach((control) => {
      if (control) control.value = "";
    });
    state.visibleColumns = DEFAULT_VISIBLE_COLUMNS.slice();
    saveVisibleColumns();
    renderColumnOptions();
    renderTableHead();
    applyFilters();
  }

  function renderColumnOptions() {
    if (!els.columnOptions) return;

    els.columnOptions.innerHTML = DATA_COLUMNS.map((column) => `
      <label>
        <input type="checkbox" value="${escapeHtml(column.key)}" ${state.visibleColumns.includes(column.key) ? "checked" : ""}>
        <span>${escapeHtml(column.label)}</span>
      </label>
    `).join("");

    els.columnOptions.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        const checked = Array.from(els.columnOptions.querySelectorAll("input:checked")).map((item) => item.value);
        state.visibleColumns = checked.length ? checked : ["kode", "nama"];
        saveVisibleColumns();
        renderTableHead();
        renderTableBody();
        renderFooter();
      });
    });
  }

  function renderTableHead() {
    const columns = getVisibleColumnDefs();

    els.tableHead.innerHTML = `
      <tr>
        <th class="col-no">No</th>
        ${columns.map((column) => `<th data-column="${escapeHtml(column.key)}">${escapeHtml(column.label)}</th>`).join("")}
        <th class="col-actions">Aksi</th>
      </tr>
    `;
  }

  function renderTableBody() {
    const totalPages = getTotalPages();
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const columns = getVisibleColumnDefs();
    const allowEdit = canAccess("edit_obat");
    const allowDelete = canAccess("hapus_obat");
    const start = (state.page - 1) * PAGE_SIZE;
    const rows = state.filtered.slice(start, start + PAGE_SIZE);

    if (!rows.length) {
      els.tableBody.innerHTML = `
        <tr>
          <td class="empty-table-cell" colspan="${columns.length + 2}">Data obat tidak ditemukan.</td>
        </tr>
      `;
      return;
    }

    els.tableBody.innerHTML = rows.map((row, index) => {
      const rowIndex = state.rows.indexOf(row);
      return `
        <tr>
          <td class="col-no">${start + index + 1}</td>
          ${columns.map((column) => `<td data-column="${escapeHtml(column.key)}">${escapeHtml(formatCell(row[column.key]))}</td>`).join("")}
          <td class="col-actions">
            <div class="row-actions">
              ${allowEdit ? `<button class="table-action table-action-edit" type="button" data-action="edit-medicine" data-index="${rowIndex}" aria-label="Edit ${escapeHtml(row.nama || row.kode || "obat")}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg>
              </button>` : ""}
              ${allowDelete ? `<button class="table-action table-action-delete" type="button" data-action="delete-medicine" data-index="${rowIndex}" aria-label="Hapus ${escapeHtml(row.nama || row.kode || "obat")}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 15H6L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
              </button>` : ""}
              ${!allowEdit && !allowDelete ? `<span class="muted-action">-</span>` : ""}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function getVisibleColumnDefs() {
    return DATA_COLUMNS.filter((column) => state.visibleColumns.includes(column.key));
  }

  function renderFooter() {
    const start = state.filtered.length ? (state.page - 1) * PAGE_SIZE + 1 : 0;
    const end = Math.min(state.page * PAGE_SIZE, state.filtered.length);
    const totalPages = getTotalPages();

    if (els.pageInfo) els.pageInfo.textContent = `Menampilkan ${start} - ${end} dari ${state.filtered.length} data`;
    if (els.pageNumber) els.pageNumber.textContent = String(state.page);
    if (els.prevButton) els.prevButton.disabled = state.page <= 1;
    if (els.nextButton) els.nextButton.disabled = state.page >= totalPages;
  }

  function renderUploadInfo() {
    if (!els.updatedText) return;
    els.updatedText.textContent = state.uploadedAt
      ? formatLastUpdated(state.uploadedAt)
      : "Last updated upload Google Sheet belum tersedia";
  }

  async function startDashboardScanner(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!els.scannerModal || !els.scannerVideo) return;
    showModal(els.scannerModal);
    setScannerStatus("Menyiapkan kamera scanner...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerStatus("Browser belum mendukung akses kamera. Gunakan input manual.");
      return;
    }

    if (!("BarcodeDetector" in window)) {
      setScannerStatus("Browser ini belum mendukung scanner barcode otomatis. Gunakan input manual.");
      return;
    }

    try {
      const formats = ["code_128", "code_39", "code_93", "codabar", "ean_13", "ean_8", "itf", "upc_a", "upc_e", "qr_code"];
      state.scannerDetector = new window.BarcodeDetector({ formats });
      state.scannerStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      els.scannerVideo.srcObject = state.scannerStream;
      await els.scannerVideo.play();
      setScannerStatus("Arahkan kamera ke barcode obat.");
      scanDashboardFrame();
    } catch (error) {
      setScannerStatus(`Scanner belum bisa dibuka: ${error.message}. Gunakan input manual.`);
      stopScannerStreamOnly();
    }
  }

  async function scanDashboardFrame() {
    if (!state.scannerDetector || !els.scannerVideo || els.scannerModal?.hidden) return;

    try {
      const codes = await state.scannerDetector.detect(els.scannerVideo);
      const value = codes && codes[0] ? String(codes[0].rawValue || "").trim() : "";
      if (value) {
        applyScannedBarcode(value);
        return;
      }
    } catch (error) {
      setScannerStatus("Barcode belum terbaca. Coba dekatkan kamera dan pastikan cahaya cukup.");
    }

    state.scannerAnimation = window.requestAnimationFrame(scanDashboardFrame);
  }

  function applyScannedBarcode(value) {
    if (!value) return;
    if (els.searchInput) {
      els.searchInput.value = value;
      state.page = 1;
      applyFilters();
    }
    setScannerStatus(`Barcode terbaca: ${value}`);
    stopDashboardScanner();
  }

  function useManualBarcodeInput() {
    const value = window.prompt("Masukkan barcode obat:");
    if (String(value || "").trim()) applyScannedBarcode(String(value).trim());
  }

  function stopDashboardScanner() {
    if (state.scannerAnimation) {
      window.cancelAnimationFrame(state.scannerAnimation);
      state.scannerAnimation = 0;
    }
    stopScannerStreamOnly();
    hideModal(els.scannerModal);
  }

  function stopScannerStreamOnly() {
    if (state.scannerStream) {
      state.scannerStream.getTracks().forEach((track) => track.stop());
      state.scannerStream = null;
    }
    if (els.scannerVideo) els.scannerVideo.srcObject = null;
  }

  function setScannerStatus(message) {
    if (els.scannerStatus) els.scannerStatus.textContent = message;
  }

  async function handleImportFileChange() {
    const file = els.importFileInput?.files?.[0];
    state.importHeaders = [];
    state.importRows = [];
    if (els.importButton) els.importButton.disabled = true;

    if (!file) {
      if (els.importSummary) els.importSummary.textContent = "Belum ada file";
      setImportStatus("File akan dicek dulu sebelum dikirim ke Google Sheet.", "info");
      return;
    }

    try {
      const parsed = await parseImportFile(file);
      const rows = parsed.rows.filter((row) => Object.values(row).some((value) => String(value || "").trim()));

      if (!rows.length) {
        throw new Error("File tidak memiliki baris data yang bisa diimport.");
      }

      state.importHeaders = parsed.headers;
      state.importRows = rows;
      if (els.importSummary) els.importSummary.textContent = `${formatNumber(rows.length)} data siap import`;
      if (els.importButton) els.importButton.disabled = false;
      setImportStatus(`File ${file.name} berhasil dibaca. Pilih mode import lalu upload ke Google Sheet.`, "success");
      addProfileActivity("File import data obat dibaca", `${rows.length} baris dari ${file.name}`);
    } catch (error) {
      if (els.importSummary) els.importSummary.textContent = "File belum valid";
      setImportStatus(`Import gagal dibaca: ${error.message}`, "error");
    }
  }

  async function parseImportFile(file) {
    const extension = String(file.name || "").split(".").pop().toLowerCase();

    if (extension === "csv") {
      return matrixToImportRows(parseCsvMatrix(await file.text()));
    }

    if (!window.XLSX) {
      throw new Error("Library pembaca Excel belum termuat. Muat ulang halaman lalu coba lagi.");
    }

    const workbook = window.XLSX.read(await file.arrayBuffer(), {
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
        if (char === "\r" && nextChar === "\n") index += 1;
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
    if (!Array.isArray(matrix) || !matrix.length) {
      throw new Error("File kosong.");
    }

    const rawHeaders = matrix[0].map((header) => String(header || "").trim());
    const headers = rawHeaders.filter(Boolean);

    if (!headers.length) {
      throw new Error("Header kolom tidak ditemukan.");
    }

    const normalizedHeaders = rawHeaders.map(normalizeKey);
    const rows = matrix.slice(1).map((row) => {
      const item = {};
      normalizedHeaders.forEach((header, index) => {
        if (header) item[header] = row[index] || "";
      });
      return item;
    });

    return { headers, rows };
  }

  async function importExcelToGoogleSheet() {
    if (!state.importRows.length) {
      setImportStatus("Pilih file Excel terlebih dahulu.", "warning");
      return;
    }

    if (els.importButton) els.importButton.disabled = true;
    setImportStatus("Mengupload data obat ke Google Sheet...", "info");

    try {
      const response = await fetch(getImportApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "import_data_obat",
          sheet: "data_obat",
          mode: els.importMode?.value || "replace",
          headers: state.importHeaders,
          rows: state.importRows
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = parseImportResponse(await response.text());
      if (!result || (result.ok !== true && result.success !== true)) {
        throw new Error(result?.message || result?.error || "API belum mengonfirmasi import data obat.");
      }

      setImportStatus("Upload dikonfirmasi. Memuat ulang data obat terbaru...", "info");
      await fetchDataObat({ manual: true });
      const total = Number(result.total || state.importRows.length || 0);
      setImportStatus(`Import selesai. ${formatNumber(total)} data berhasil dikirim ke Google Sheet.`, "success");
      addProfileActivity("Import data obat berhasil", `${formatNumber(total)} data dikirim ke Google Sheet`);
    } catch (error) {
      setImportStatus(`Upload gagal: ${error.message}.`, "error");
    } finally {
      if (els.importButton) els.importButton.disabled = !state.importRows.length;
    }
  }

  function getImportApiUrl() {
    const url = new URL(API_BASE, window.location.href);
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
      throw new Error("Response API bukan JSON valid. Cek deployment Apps Script.");
    }
  }

  function setImportStatus(message, type) {
    if (!els.importStatus) return;
    els.importStatus.textContent = message || "";
    els.importStatus.dataset.type = type || "info";
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
    if (state.uploadedAt) localStorage.setItem(HOME_UPLOAD_ACK_KEY, state.uploadedAt);
    updateNotificationState();

    const message = state.uploadedAt
      ? `${formatLastUpdated(state.uploadedAt)}. Waktu ini berdasarkan upload sheet data_obat terakhir, bukan waktu sinkron browser.`
      : "Belum ada informasi waktu upload sheet data_obat terakhir. Upload data Excel baru atau pastikan Apps Script terbaru sudah dipakai.";

    if (els.notificationMessage) els.notificationMessage.textContent = message;
    if (els.notificationPopover) {
      positionNotificationPopover();
      els.notificationPopover.hidden = false;
    }
  }

  function closeNotification() {
    if (els.notificationPopover) els.notificationPopover.hidden = true;
  }

  function positionNotificationPopover() {
    if (!els.notificationPopover || !els.notificationButton) return;
    const rect = els.notificationButton.getBoundingClientRect();
    const width = Math.min(380, window.innerWidth - 24);
    const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.right - width));
    els.notificationPopover.style.width = `${width}px`;
    els.notificationPopover.style.left = `${left}px`;
    els.notificationPopover.style.top = `${rect.bottom + 10}px`;
  }

  function handleTableAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const index = Number(button.dataset.index);
    const row = state.rows[index];
    if (!row) return;

    if (button.dataset.action === "edit-medicine" && canAccess("edit_obat")) openMedicineModal("edit", row, index);
    if (button.dataset.action === "delete-medicine" && canAccess("hapus_obat")) openDeleteModal("medicine", index, row.nama || row.kode || "obat ini");
  }

  function renderMedicineForm() {
    if (!els.medicineFormFields) return;

    const categoryOptions = uniqueValues("kategori");
    const supplierOptions = uniqueValues("suplier");
    const unitOptions = unique(
      state.rows.flatMap((row) => [row.satuan_beli, row.satuan_1, row.satuan_2, row.satuan_3, row.satuan_4])
    ).sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));

    els.medicineFormFields.innerHTML = DATA_COLUMNS.map((column) => {
      const wide = ["nama", "indikasi", "komposisi"].includes(column.key);
      const unitMatch = column.key.match(/_(\d)$/);
      const unitIndex = unitMatch ? unitMatch[1] : "";
      const className = [
        wide ? "span-2" : "",
        unitIndex ? "unit-field" : ""
      ].filter(Boolean).join(" ");
      const unitAttr = unitIndex ? ` data-unit-index="${unitIndex}"` : "";

      return `<label class="${className}"${unitAttr}>${escapeHtml(column.label)}${renderMedicineControl(column, categoryOptions, supplierOptions, unitOptions)}</label>`;
    }).join("");

    updateMedicineUnitVisibility();
  }

  function renderMedicineControl(column, categories, suppliers, units) {
    if (column.key === "kategori") return renderSelect(column.key, categories, "Pilih kategori");
    if (column.key === "suplier") return renderSelect(column.key, suppliers, "Pilih supplier");
    if (column.key === "satuan_beli" || /^satuan_[1-4]$/.test(column.key)) return renderSelect(column.key, units, "Pilih satuan");
    if (column.key === "expired") return `<input id="medicine-${column.key}" name="${column.key}" type="date">`;
    if (column.type === "number") return `<input id="medicine-${column.key}" name="${column.key}" inputmode="decimal" type="text">`;
    if (["indikasi", "komposisi"].includes(column.key)) return `<textarea id="medicine-${column.key}" name="${column.key}" rows="3"></textarea>`;
    return `<input id="medicine-${column.key}" name="${column.key}" type="text">`;
  }

  function renderSelect(key, options, placeholder) {
    return `
      <select id="medicine-${key}" name="${key}">
        <option value="">${escapeHtml(placeholder)}</option>
        ${options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}
      </select>
    `;
  }

  function openMedicineModal(mode, row = null, index = -1) {
    state.medicineMode = mode;
    state.editingMedicine = { row, index };
    state.unitCount = getInitialUnitCount(row);

    renderMedicineForm();
    if (els.medicineModalTitle) els.medicineModalTitle.textContent = mode === "add" ? "Tambah Obat" : "Edit Obat";
    setMedicineStatus("Lengkapi data sesuai kolom data_obat.", "info");

    DATA_COLUMNS.forEach((column) => {
      const control = document.getElementById(`medicine-${column.key}`);
      if (!control) return;
      control.value = row ? formatControlValue(column.key, row[column.key]) : "";
    });

    updateMedicineUnitVisibility();
    showModal(els.medicineModal);
  }

  function closeMedicineModal() {
    hideModal(els.medicineModal);
  }

  function setUnitCount(nextCount) {
    state.unitCount = Math.min(4, Math.max(1, Number(nextCount) || 1));
    updateMedicineUnitVisibility();
  }

  function getInitialUnitCount(row) {
    if (!row) return 4;
    for (let index = 4; index >= 1; index -= 1) {
      if (String(row[`satuan_${index}`] || row[`isi_${index}`] || row[`harga_jual_${index}`] || row[`harga_resep_${index}`] || "").trim()) {
        return index;
      }
    }
    return 1;
  }

  function updateMedicineUnitVisibility() {
    if (!els.medicineFormFields) return;
    els.medicineFormFields.querySelectorAll("[data-unit-index]").forEach((field) => {
      const index = Number(field.dataset.unitIndex);
      field.classList.toggle("is-hidden", index > state.unitCount);
    });
  }

  async function saveMedicine(event) {
    event.preventDefault();
    const row = collectMedicineForm();
    const mode = state.medicineMode;

    if (!row.kode || !row.nama) {
      setMedicineStatus("Kode dan nama obat wajib diisi.", "error");
      return;
    }

    if (state.editingMedicine && state.editingMedicine.row) {
      row._row = state.editingMedicine.row._row || "";
    }

    setMedicineStatus("Menyimpan data obat...", "info");

    try {
      const action = mode === "add" ? "add_data_obat" : "update_data_obat";
      const result = await postToApi({ action, row, rowNumber: row._row, kode: row.kode });
      if (!result || result.success !== true) throw new Error(result?.message || "Apps Script belum menerima perubahan data_obat.");

      setMedicineStatus(result.message || "Data obat berhasil disimpan.", "success");
      await fetchDataObat({ manual: true });
      closeMedicineModal();
    } catch (error) {
      setMedicineStatus(`${error.message} Pastikan kode Apps Script terbaru sudah ditempel dan di-deploy.`, "error");
    }
  }

  function collectMedicineForm() {
    return DATA_COLUMNS.reduce((acc, column) => {
      const control = document.getElementById(`medicine-${column.key}`);
      const unitMatch = column.key.match(/_(\d)$/);
      acc[column.key] = unitMatch && Number(unitMatch[1]) > state.unitCount
        ? ""
        : control ? control.value.trim() : "";
      return acc;
    }, {});
  }

  function setMedicineStatus(message, type) {
    if (!els.medicineModalStatus) return;
    els.medicineModalStatus.textContent = message;
    els.medicineModalStatus.dataset.type = type || "info";
  }

  function openDeleteModal(type, index, label) {
    state.pendingDelete = { type, index };
    if (els.deleteModalText) els.deleteModalText.textContent = `Hapus ${label}? Data yang dihapus tidak bisa dikembalikan.`;
    showModal(els.deleteModal);
  }

  function closeDeleteModal() {
    state.pendingDelete = null;
    hideModal(els.deleteModal);
  }

  async function confirmDelete() {
    if (!state.pendingDelete) return;

    const { type, index } = state.pendingDelete;

    if (type === "medicine") {
      const row = state.rows[index];
      try {
        const result = await postToApi({ action: "delete_data_obat", rowNumber: row._row, kode: row.kode });
        if (!result || result.success !== true) throw new Error(result?.message || "Apps Script belum menerima hapus data_obat.");
        closeDeleteModal();
        await fetchDataObat({ manual: true });
      } catch (error) {
        if (els.deleteModalText) els.deleteModalText.textContent = `${error.message} Pastikan kode Apps Script terbaru sudah ditempel dan di-deploy.`;
      }
      return;
    }

    deleteLocalRecord(type, index);
    closeDeleteModal();
  }

  function loadStoredModules() {
    state.employees = readStoredArray(EMPLOYEE_KEY);
    state.suppliers = readStoredArray(SUPPLIER_KEY);
    state.users = readStoredArray(USER_KEY).map(normalizeUserRecord);
    state.purchaseOrders = readStoredArray(PO_KEY);
    renderEmployees();
    renderSuppliers();
    renderUsers();
    renderPurchaseOrders();
    applyCurrentUserAccess();
  }

  function syncEmployeeSeed() {
    const existing = readStoredArray(EMPLOYEE_KEY);
    if (existing.length) {
      state.employees = existing;
      return;
    }

    state.employees = state.users.map((user) => ({
      name: user.name || user.username,
      phone: "",
      address: "",
      job: user.role || "",
      email: user.email || ""
    }));
    writeStoredArray(EMPLOYEE_KEY, state.employees);
  }

  function syncSupplierSeed() {
    const existing = readStoredArray(SUPPLIER_KEY);
    const byName = new Map(existing.map((item) => [normalizeSearch(item.name), item]));

    uniqueValues("suplier").forEach((supplier) => {
      const key = normalizeSearch(supplier);
      if (!byName.has(key)) {
        byName.set(key, { name: supplier, address: "", phone: "", pic: "" });
      }
    });

    state.suppliers = Array.from(byName.values()).sort((a, b) => String(a.name).localeCompare(String(b.name), "id", { sensitivity: "base" }));
    writeStoredArray(SUPPLIER_KEY, state.suppliers);
  }

  function syncUserSeed() {
    const stored = readStoredArray(USER_KEY).map(normalizeUserRecord);
    const byUsername = new Map(stored.map((item) => [normalizeSearch(item.username || item.name), item]));

    state.users.forEach((user) => {
      const key = normalizeSearch(user.username || user.name);
      if (!byUsername.has(key)) byUsername.set(key, normalizeUserRecord(user));
    });

    state.users = Array.from(byUsername.values()).map(normalizeUserRecord);
    writeStoredArray(USER_KEY, state.users);
    renderUserRoleOptions();
  }

  function normalizeUserRecord(user) {
    const role = String(user?.role || "Operator").trim() || "Operator";
    return {
      name: String(user?.name || user?.username || "").trim(),
      username: String(user?.username || user?.name || "").trim(),
      role,
      status: String(user?.status || "Aktif").trim() || "Aktif",
      email: String(user?.email || "").trim(),
      access: normalizeAccessList(user?.access, role)
    };
  }

  function normalizeAccessList(access, role) {
    const allowed = new Set(ACCESS_MENUS.map((item) => item.key));
    const alias = new Map();
    ACCESS_MENUS.forEach((item) => {
      alias.set(normalizeSearch(item.key), item.key);
      alias.set(normalizeSearch(item.label), item.key);
    });
    const values = Array.isArray(access)
      ? access
      : String(access || "").split(/[,;|]/);
    const normalized = values
      .map((item) => alias.get(normalizeSearch(item)) || String(item || "").trim())
      .filter((item) => allowed.has(item));
    return normalized.length ? normalized : getDefaultAccessForRole(role);
  }

  function getDefaultAccessForRole(role) {
    const key = normalizeSearch(role || "operator");
    return (ROLE_ACCESS[key] || ROLE_ACCESS.operator).slice();
  }

  function getCurrentUserRecord() {
    const session = readSession() || {};
    const sessionKey = normalizeSearch(session.username || session.email || session.name || "");
    const found = state.users.find((user) => {
      return [user.username, user.email, user.name].some((value) => normalizeSearch(value) === sessionKey);
    });

    if (!found) {
      return normalizeUserRecord({
        name: session.name || session.username || "Akun",
        username: session.username || "",
        role: session.role || "Operator",
        email: session.email || "",
        access: session.menu || ""
      });
    }

    const sessionRole = String(session.role || "").trim();
    const roleChangedBySession = sessionRole && normalizeSearch(found.role) !== normalizeSearch(sessionRole);
    const sessionMenu = session.menu || "";

    return normalizeUserRecord({
      ...found,
      name: found.name || session.name || session.username || "Akun",
      username: found.username || session.username || "",
      role: roleChangedBySession ? sessionRole : found.role,
      email: found.email || session.email || "",
      access: roleChangedBySession
        ? (sessionMenu || getDefaultAccessForRole(sessionRole))
        : found.access
    });
  }

  function canAccess(key) {
    const user = getCurrentUserRecord();
    if (isAdminUser(user)) return true;
    return user.access.includes(key);
  }

  function applyCurrentUserAccess() {
    const user = getCurrentUserRecord();
    const access = new Set(user.access);
    if (isAdminUser(user)) {
      ACCESS_MENUS.forEach((item) => access.add(item.key));
    }

    document.querySelectorAll("[data-access-key]").forEach((element) => {
      element.hidden = !access.has(element.dataset.accessKey);
    });

    if (els.addMedicineButton) els.addMedicineButton.hidden = !access.has("edit_obat");
    renderTableBody();

    if (state.activeView && !canView(state.activeView, access)) {
      const firstAllowed = ACCESS_MENUS.find((item) => access.has(item.key)) || ACCESS_MENUS[0];
      switchView(access.has("dashboard") ? "dashboard" : accessKeyToView(firstAllowed.key));
    }
  }

  function canView(viewName, access) {
    const map = {
      dashboard: "dashboard",
      "data-obat": "data_obat",
      "data-karyawan": "data_karyawan",
      "data-supplier": "data_supplier",
      "surat-pesanan": "surat_pesanan",
      "import-data-obat": "import_data_obat",
      "akun-profil": "akun_profil",
      "manajemen-pengguna": "manajemen_pengguna"
    };
    return access.has(map[viewName] || viewName);
  }

  function accessKeyToView(key) {
    const map = {
      data_obat: "data-obat",
      data_karyawan: "data-karyawan",
      data_supplier: "data-supplier",
      surat_pesanan: "surat-pesanan",
      import_data_obat: "import-data-obat",
      akun_profil: "akun-profil",
      manajemen_pengguna: "manajemen-pengguna"
    };
    return map[key] || "dashboard";
  }

  function isAdminUser(user) {
    const role = normalizeSearch(user?.role);
    const username = normalizeSearch(user?.username || user?.name || "");
    return role === "admin" || role === "administrator" || username === "admin";
  }

  function renderEmployees() {
    renderSimpleRows(els.employeeTableBody, state.employees, "employee", ["name", "phone", "address", "job", "email"]);
  }

  function renderSuppliers() {
    renderSimpleRows(els.supplierTableBody, state.suppliers, "supplier", ["name", "address", "phone", "pic"]);
  }

  function renderSimpleRows(tbody, rows, type, keys) {
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = `<tr><td class="empty-table-cell" colspan="${keys.length + 1}">Belum ada data.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((row, index) => `
      <tr>
        ${keys.map((key) => `<td>${escapeHtml(formatCell(row[key]))}</td>`).join("")}
        <td>
          <div class="row-actions">
            <button class="table-action table-action-edit" type="button" data-local-action="edit" data-type="${type}" data-index="${index}" aria-label="Edit">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg>
            </button>
            <button class="table-action table-action-delete" type="button" data-local-action="delete" data-type="${type}" data-index="${index}" aria-label="Hapus">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 15H6L5 6"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function renderUsers() {
    if (!els.userTableBody) return;
    const query = normalizeSearch(els.userSearchInput ? els.userSearchInput.value : "");
    const role = normalizeSearch(els.userRoleFilter ? els.userRoleFilter.value : "");
    const status = normalizeSearch(els.userStatusFilter ? els.userStatusFilter.value : "");
    const users = state.users.filter((user) => {
      const searchMatch = !query || normalizeSearch(`${user.name} ${user.username} ${user.email}`).includes(query);
      const roleMatch = !role || normalizeSearch(user.role) === role;
      const statusMatch = !status || normalizeSearch(user.status) === status;
      return searchMatch && roleMatch && statusMatch;
    });

    if (!users.length) {
      els.userTableBody.innerHTML = `<tr><td class="empty-table-cell" colspan="7">Belum ada operator.</td></tr>`;
      return;
    }

    els.userTableBody.innerHTML = users.map((user, displayIndex) => {
      const index = state.users.indexOf(user);
      return `
        <tr>
          <td>${displayIndex + 1}</td>
          <td>${escapeHtml(formatCell(user.name))}</td>
          <td>${escapeHtml(formatCell(user.username))}</td>
          <td><span class="pill-tag">${escapeHtml(formatCell(user.role))}</span></td>
          <td><span class="status-badge ${normalizeSearch(user.status) === "non aktif" || normalizeSearch(user.status) === "nonaktif" ? "is-inactive" : ""}">${escapeHtml(user.status || "Aktif")}</span></td>
          <td><span class="access-summary">${escapeHtml(formatAccessSummary(user))}</span></td>
          <td>
            <div class="row-actions">
              <button class="table-action table-action-edit" type="button" data-local-action="edit" data-type="user" data-index="${index}" aria-label="Edit user">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg>
              </button>
              <button class="table-action table-action-delete" type="button" data-local-action="delete" data-type="user" data-index="${index}" aria-label="Hapus user">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 15H6L5 6"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function formatAccessSummary(user) {
    if (isAdminUser(user)) return "Semua akses";
    const list = normalizeAccessList(user?.access, user?.role || "Operator");
    if (list.length >= ACCESS_MENUS.length) return "Semua akses";
    if (!list.length) return "Tanpa akses";
    return `${list.length} akses: ${list.slice(0, 3).map((key) => ACCESS_MENUS.find((item) => item.key === key)?.label || key).join(", ")}${list.length > 3 ? "..." : ""}`;
  }

  function renderUserRoleOptions() {
    if (!els.userRoleFilter) return;
    const roles = unique(state.users.map((user) => user.role).filter(Boolean)).sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
    const current = els.userRoleFilter.value;
    els.userRoleFilter.innerHTML = `<option value="">Semua role</option>${roles.map((role) => `<option value="${escapeHtml(role)}">${escapeHtml(role)}</option>`).join("")}`;
    if (roles.includes(current)) els.userRoleFilter.value = current;
  }

  function handleLocalTableAction(event) {
    const button = event.target.closest("[data-local-action]");
    if (!button) return;

    const type = button.dataset.type;
    const index = Number(button.dataset.index);
    if (button.dataset.localAction === "edit") openRecordModal(type, index);
    if (button.dataset.localAction === "delete") openDeleteModal(type, index, getLocalRecordLabel(type, index));
  }

  function openRecordModal(type, index) {
    const schema = LOCAL_SCHEMAS[type];
    if (!schema) return;

    state.recordType = type;
    state.recordIndex = index;
    const record = getLocalArray(type)[index] || {};

    els.recordModalTitle.textContent = `${index >= 0 ? "Edit" : "Tambah"} ${schema.title}`;
    els.recordModalStatus.textContent = "Lengkapi field yang tersedia.";
    els.recordModalStatus.dataset.type = "info";
    els.recordFormFields.innerHTML = schema.fields.map((field) => {
      const value = field.type === "access" ? record[field.key] || getDefaultAccessForRole(record.role) : record[field.key] || "";
      if (field.type === "access") {
        return `
          <div class="span-2 record-access-field">
            <span>${escapeHtml(field.label)}</span>
            ${renderRecordControl(field, value)}
          </div>
        `;
      }

      return `
        <label class="${field.wide ? "span-2" : ""}">
          ${escapeHtml(field.label)}
          ${renderRecordControl(field, value)}
        </label>
      `;
    }).join("");

    if (type === "user") {
      const roleSelect = els.recordFormFields.querySelector('select[name="role"]');
      if (roleSelect) {
        roleSelect.addEventListener("change", () => setAccessCheckboxes(getDefaultAccessForRole(roleSelect.value)));
      }
    }

    showModal(els.recordModal);
  }

  function renderRecordControl(field, value) {
    if (field.type === "access") {
      const selected = new Set(normalizeAccessList(value, "Operator"));
      return `
        <div class="access-picker">
          ${ACCESS_MENUS.map((item) => `
            <label>
              <input type="checkbox" name="${escapeHtml(field.key)}" value="${escapeHtml(item.key)}" ${selected.has(item.key) ? "checked" : ""}>
              <span>${escapeHtml(item.label)}</span>
            </label>
          `).join("")}
        </div>
      `;
    }

    if (field.type === "select") {
      return `
        <select name="${escapeHtml(field.key)}" ${field.required ? "required" : ""}>
          ${field.options.map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(value) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
        </select>
      `;
    }

    return `<input name="${escapeHtml(field.key)}" type="${escapeHtml(field.type || "text")}" value="${escapeHtml(value)}" ${field.required ? "required" : ""}>`;
  }

  function setAccessCheckboxes(access) {
    const selected = new Set(normalizeAccessList(access, "Operator"));
    els.recordFormFields.querySelectorAll('input[name="access"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }

  function closeRecordModal() {
    hideModal(els.recordModal);
  }

  function saveRecord(event) {
    event.preventDefault();
    const schema = LOCAL_SCHEMAS[state.recordType];
    if (!schema) return;

    const formData = new FormData(els.recordForm);
    const record = {};
    schema.fields.forEach((field) => {
      if (field.type === "access") {
        record[field.key] = formData.getAll(field.key).map((value) => String(value || "").trim()).filter(Boolean);
        return;
      }
      record[field.key] = String(formData.get(field.key) || "").trim();
    });

    if (state.recordType === "user") {
      Object.assign(record, normalizeUserRecord(record));
    }

    const target = getLocalArray(state.recordType);
    if (state.recordIndex >= 0) {
      target[state.recordIndex] = record;
    } else {
      target.push(record);
    }

    persistLocalArray(state.recordType, target);
    closeRecordModal();
    renderEmployees();
    renderSuppliers();
    renderUserRoleOptions();
    renderUsers();
    applyCurrentUserAccess();
    populateMedicineOptions();
  }

  function deleteLocalRecord(type, index) {
    const target = getLocalArray(type);
    target.splice(index, 1);
    persistLocalArray(type, target);
    renderEmployees();
    renderSuppliers();
    renderUserRoleOptions();
    renderUsers();
    applyCurrentUserAccess();
  }

  function getLocalArray(type) {
    if (type === "employee") return state.employees;
    if (type === "supplier") return state.suppliers;
    if (type === "user") return state.users;
    return [];
  }

  function persistLocalArray(type, value) {
    if (type === "employee") writeStoredArray(EMPLOYEE_KEY, value);
    if (type === "supplier") writeStoredArray(SUPPLIER_KEY, value);
    if (type === "user") writeStoredArray(USER_KEY, value);
  }

  function getLocalRecordLabel(type, index) {
    const record = getLocalArray(type)[index] || {};
    return record.name || record.username || "data ini";
  }

  function addPurchaseItem() {
    const medicineIndex = Number(els.poMedicine ? els.poMedicine.value : -1);
    const medicine = state.rows[medicineIndex];
    const qty = Math.max(1, Number(els.poQty ? els.poQty.value : 1) || 1);
    const unit = String(els.poUnit ? els.poUnit.value : "").trim() || medicine?.satuan_beli || medicine?.satuan_1 || "Pcs";

    if (!medicine) return;

    state.purchaseItems.push({
      kode: medicine.kode,
      nama: medicine.nama,
      qty,
      unit
    });
    renderPurchaseItems();
  }

  function savePurchaseOrder(event) {
    event.preventDefault();
    if (!state.purchaseItems.length) return;

    const order = {
      number: `SP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(state.purchaseOrders.length + 1).padStart(3, "0")}`,
      supplier: els.poSupplier ? els.poSupplier.value : "",
      date: els.poDate ? els.poDate.value : new Date().toISOString().slice(0, 10),
      items: state.purchaseItems.slice()
    };

    state.purchaseOrders.unshift(order);
    state.purchaseItems = [];
    writeStoredArray(PO_KEY, state.purchaseOrders);
    renderPurchaseItems();
    renderPurchaseOrders();
  }

  function renderPurchaseItems() {
    if (!els.poItemsList) return;
    if (!state.purchaseItems.length) {
      els.poItemsList.innerHTML = "<p>Belum ada item pesanan.</p>";
      return;
    }

    els.poItemsList.innerHTML = state.purchaseItems.map((item, index) => `
      <div class="po-item">
        <span><strong>${escapeHtml(item.nama)}</strong><small>${escapeHtml(item.kode)}</small></span>
        <em>${escapeHtml(item.qty)} ${escapeHtml(item.unit)}</em>
        <button type="button" data-remove-po="${index}" aria-label="Hapus item">x</button>
      </div>
    `).join("");

    els.poItemsList.querySelectorAll("[data-remove-po]").forEach((button) => {
      button.addEventListener("click", () => {
        state.purchaseItems.splice(Number(button.dataset.removePo), 1);
        renderPurchaseItems();
      });
    });
  }

  function renderPurchaseOrders() {
    if (!els.poSavedList) return;
    if (els.poDate && !els.poDate.value) els.poDate.value = new Date().toISOString().slice(0, 10);
    if (els.poNumber) els.poNumber.textContent = state.purchaseOrders[0]?.number || "Nomor otomatis akan dibuat saat disimpan.";

    if (!state.purchaseOrders.length) {
      els.poSavedList.innerHTML = "<p>Belum ada surat pesanan tersimpan.</p>";
      return;
    }

    els.poSavedList.innerHTML = state.purchaseOrders.slice(0, 5).map((order) => `
      <article class="po-saved-card">
        <strong>${escapeHtml(order.number)}</strong>
        <span>${escapeHtml(order.date)} - ${escapeHtml(order.supplier || "Supplier belum dipilih")}</span>
        <small>${formatNumber(order.items.length)} item</small>
      </article>
    `).join("");
  }

  function renderProfile() {
    const profile = getProfileData();

    if (els.profileLargeAvatar) els.profileLargeAvatar.textContent = getInitials(profile.name);
    if (els.profileDisplayName) els.profileDisplayName.textContent = profile.name;
    if (els.profileDisplayRole) els.profileDisplayRole.textContent = profile.role;
    if (els.profileUsername) els.profileUsername.textContent = profile.username || "-";
    if (els.profileEmail) els.profileEmail.textContent = profile.email || "-";
    if (els.profileRole) els.profileRole.textContent = profile.role || "-";
    if (els.profileNameInput) els.profileNameInput.value = profile.name || "";
    if (els.profileEmailInput) els.profileEmailInput.value = profile.email || "";
    if (els.profilePhoneInput) els.profilePhoneInput.value = profile.phone || "";
    if (els.profileJobInput) els.profileJobInput.value = profile.job || "";
    if (els.profileAddressInput) els.profileAddressInput.value = profile.address || "";
  }

  function getProfileData() {
    const session = readSession() || {};
    const stored = readObject(PROFILE_KEY);
    return {
      name: stored.name || session.name || session.username || "Akun",
      email: stored.email || session.email || "",
      phone: stored.phone || "",
      job: stored.job || session.role || "Operator",
      address: stored.address || "",
      username: session.username || stored.username || "",
      role: session.role || stored.job || "Operator"
    };
  }

  function saveProfile(event) {
    event.preventDefault();
    const profile = {
      name: els.profileNameInput.value.trim(),
      email: els.profileEmailInput.value.trim(),
      phone: els.profilePhoneInput.value.trim(),
      job: els.profileJobInput.value.trim(),
      address: els.profileAddressInput.value.trim()
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    hydrateProfileName();
    renderProfile();
    setProfileStatus("Profil berhasil disimpan di perangkat ini.", "success");
    addProfileActivity("Profil diperbarui", "Informasi profil lokal disimpan");
  }

  async function saveProfilePassword(event) {
    event.preventDefault();
    const profile = getProfileData();
    const password = String(els.profileNewPasswordInput?.value || "");
    const confirmPassword = String(els.profileConfirmPasswordInput?.value || "");
    const validationError = validateProfilePassword(password, confirmPassword);

    if (!profile.email) {
      setProfileStatus("Email akun belum tersedia, password belum bisa dikirim ke Google Sheet.", "error");
      return;
    }

    if (validationError) {
      setProfileStatus(validationError, "error");
      return;
    }

    setProfileStatus("Menyimpan password baru ke Google Sheet...", "info");

    try {
      const result = await postToApi({
        action: "updatePassword",
        email: profile.email,
        password,
        confirmPassword
      });

      if (!result || (result.success !== true && result.ok !== true)) {
        throw new Error(result?.message || "Password baru gagal disimpan.");
      }

      els.profileNewPasswordInput.value = "";
      els.profileConfirmPasswordInput.value = "";
      setProfileStatus("Password baru berhasil disimpan.", "success");
      addProfileActivity("Password diperbarui", "Password akun berhasil disimpan ke Google Sheet");
    } catch (error) {
      setProfileStatus(`Password gagal disimpan: ${error.message}`, "error");
    }
  }

  function validateProfilePassword(password, confirmPassword) {
    if (!password) return "Password baru wajib diisi.";
    if (password.length < 6) return "Password baru minimal 6 karakter.";
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Password baru wajib kombinasi huruf dan angka.";
    if (password !== confirmPassword) return "Konfirmasi password tidak sama.";
    return "";
  }

  function renderProfileSecurity() {
    const security = readObject(PROFILE_SECURITY_KEY);
    if (els.profileTwoFactorToggle) els.profileTwoFactorToggle.checked = security.twoFactor === true;
  }

  function saveProfileSecurity() {
    const enabled = Boolean(els.profileTwoFactorToggle?.checked);
    localStorage.setItem(PROFILE_SECURITY_KEY, JSON.stringify({ twoFactor: enabled, updatedAt: new Date().toISOString() }));
    setProfileStatus(enabled ? "Verifikasi 2 langkah ditandai aktif di perangkat ini." : "Verifikasi 2 langkah dinonaktifkan di perangkat ini.", "success");
    addProfileActivity(enabled ? "Verifikasi 2 langkah aktif" : "Verifikasi 2 langkah nonaktif", "Preferensi keamanan lokal diperbarui");
  }

  function switchProfileTab(tabName) {
    if (!tabName) return;
    els.profileTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.profileTab === tabName));
    els.profilePanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.profilePanel === tabName));
    setProfileStatus("", "");
  }

  function renderProfileActivity() {
    if (!els.profileActivityList) return;
    const activity = readStoredArray(PROFILE_ACTIVITY_KEY).slice(0, 12);

    if (!activity.length) {
      els.profileActivityList.innerHTML = "<p>Belum ada aktivitas tersimpan di perangkat ini.</p>";
      return;
    }

    els.profileActivityList.innerHTML = activity.map((item) => `
      <article>
        <span><strong>${escapeHtml(item.title || "Aktivitas")}</strong><small>${escapeHtml(item.detail || "")}</small></span>
        <time>${escapeHtml(formatLastUpdated(item.at || new Date().toISOString()).replace("Last updated ", ""))}</time>
      </article>
    `).join("");
  }

  function addProfileActivity(title, detail) {
    const activity = readStoredArray(PROFILE_ACTIVITY_KEY);
    activity.unshift({
      title,
      detail,
      at: new Date().toISOString()
    });
    writeStoredArray(PROFILE_ACTIVITY_KEY, activity.slice(0, 30));
    renderProfileActivity();
  }

  function clearProfileActivity() {
    localStorage.removeItem(PROFILE_ACTIVITY_KEY);
    renderProfileActivity();
    setProfileStatus("Riwayat aktivitas perangkat ini sudah dibersihkan.", "success");
  }

  function applyProfilePreferences() {
    const prefs = readObject(PROFILE_PREFS_KEY);
    document.body.classList.toggle("compact-dashboard", prefs.compact === true);
    if (els.profileCompactToggle) els.profileCompactToggle.checked = prefs.compact === true;
    if (els.profileSidebarCompactToggle) els.profileSidebarCompactToggle.checked = prefs.sidebarCompact === true;
    if (prefs.sidebarCompact === true && !isMobileViewport()) setSidebarCollapsed(true, { persist: false });
  }

  function saveProfilePreferences() {
    const prefs = {
      compact: Boolean(els.profileCompactToggle?.checked),
      sidebarCompact: Boolean(els.profileSidebarCompactToggle?.checked),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(prefs));
    applyProfilePreferences();
    if (prefs.sidebarCompact) setSidebarCollapsed(true);
    setProfileStatus("Preferensi tampilan berhasil disimpan.", "success");
    addProfileActivity("Preferensi tampilan diperbarui", prefs.compact ? "Mode ringkas aktif" : "Mode ringkas nonaktif");
  }

  function setProfileStatus(message, type) {
    if (!els.profileStatusText) return;
    els.profileStatusText.textContent = message || "";
    if (type) els.profileStatusText.dataset.type = type;
    else els.profileStatusText.removeAttribute("data-type");
  }

  function renderReports() {
    if (!els.reportTotal) return;
    const active = state.rows.filter((row) => getStatusValue(row) !== "nonaktif").length;
    const expiring = state.rows.filter(isExpiringSoon).length;
    const expired = state.rows.filter(isExpired).length;
    const empty = state.rows.filter((row) => parseNumber(row.stok) <= 0).length;
    const low = state.rows.filter(isLowStock).length;
    const out = state.rows.filter((row) => parseNumber(row.stok) === 0).length;

    els.reportTotal.textContent = formatNumber(state.rows.length);
    if (els.reportActive) els.reportActive.textContent = formatNumber(active);
    els.reportExpiring.textContent = formatNumber(expiring);
    els.reportExpired.textContent = formatNumber(expired);
    els.reportEmpty.textContent = formatNumber(empty);
    els.reportLow.textContent = formatNumber(low);
    els.reportOut.textContent = formatNumber(out);

  }

  function switchView(viewName) {
    if (!viewName || !VIEW_TITLES[viewName]) return;
    state.activeView = viewName;
    els.views.forEach((view) => view.classList.toggle("is-active", view.dataset.view === viewName));
    els.viewButtons.forEach((button) => {
      const active = button.dataset.viewTarget === viewName;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (els.viewTitle) els.viewTitle.textContent = VIEW_TITLES[viewName];
    if (isMobileViewport()) setSidebarCollapsed(true, { persist: false });
  }

  function applySavedSidebarState() {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    const collapsed = stored == null ? isMobileViewport() : stored === "1";
    setSidebarCollapsed(collapsed, { persist: false });
  }

  function toggleSidebar() {
    const collapsed = !document.body.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(collapsed);
  }

  function setSidebarCollapsed(collapsed, options = {}) {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    document.body.classList.toggle("sidebar-open", !collapsed);
    if (els.sidebarScrim) els.sidebarScrim.hidden = collapsed || !isMobileViewport();
    if (options.persist !== false) localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    if (els.sidebarToggle) els.sidebarToggle.setAttribute("aria-label", collapsed ? "Buka sidebar" : "Tutup sidebar");
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function persistMeta() {
    const previous = readObject(META_KEY);
    localStorage.setItem(META_KEY, JSON.stringify({
      ...previous,
      uploadedAt: state.uploadedAt || previous.uploadedAt || "",
      total: state.rows.length,
      source: API_URL
    }));
  }

  async function postToApi(payload) {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    return text ? JSON.parse(text) : {};
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
    if (els.refreshButton) {
      els.refreshButton.disabled = isLoading;
      els.refreshButton.classList.toggle("is-loading", isLoading);
    }
    if (els.statusText) {
      els.statusText.textContent = message;
      els.statusText.dataset.type = isLoading ? "info" : "success";
    }
  }

  function isLowStock(row) {
    const stock = parseNumber(row.stok);
    const minimum = parseNumber(row.stok_min);
    if (stock <= 0) return false;
    if (minimum > 0) return stock <= minimum;
    return stock <= 5;
  }

  function isExpired(row) {
    const date = parseDateValue(row.expired);
    if (!date) return false;
    const today = startOfToday();
    return date < today;
  }

  function isExpiringSoon(row) {
    const date = parseDateValue(row.expired);
    if (!date || isExpired(row)) return false;
    const today = startOfToday();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + EXPIRING_DAYS);
    return date <= limit;
  }

  function getStockStatus(row) {
    const stock = parseNumber(row.stok);
    if (stock <= 0) return "empty";
    if (isLowStock(row)) return "low";
    return "ready";
  }

  function getExpiredStatus(row) {
    const date = parseDateValue(row.expired);
    if (!date) return "blank";
    if (isExpired(row)) return "expired";
    if (isExpiringSoon(row)) return "soon";
    return "safe";
  }

  function getStatusValue(row) {
    return normalizeSearch(row.status || row.aktif || row.keterangan || "aktif").replace(/\s+/g, "");
  }

  function getReportLabel(row) {
    if (parseNumber(row.stok) <= 0) return "Stok kosong";
    if (isExpired(row)) return "Expired";
    if (isExpiringSoon(row)) return "Akan expired";
    if (isLowStock(row)) return "Stok menipis";
    return "Perlu cek";
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
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
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

  function formatControlValue(key, value) {
    if (key !== "expired") return String(value ?? "");
    const date = parseDateValue(value);
    if (!date) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
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

  function readSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function hydrateProfileName() {
    if (!els.profileName) return;
    const session = readSession();
    const stored = readObject(PROFILE_KEY);
    const name = String(stored.name || session?.name || session?.username || session?.email || "Akun").trim() || "Akun";
    els.profileName.textContent = name;
  }

  function getInitials(value) {
    const text = String(value || "Akun").replace(/@.*$/, "").replace(/[^a-zA-Z0-9\s]+/g, " ").trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] || "AK").slice(0, 2).toUpperCase();
  }

  function readStoredArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function writeStoredArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readObject(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function loadVisibleColumns() {
    const stored = readStoredArray(COLUMN_KEY);
    const valid = stored.filter((key) => DATA_COLUMNS.some((column) => column.key === key));
    return valid.length ? valid : DEFAULT_VISIBLE_COLUMNS.slice();
  }

  function saveVisibleColumns() {
    writeStoredArray(COLUMN_KEY, state.visibleColumns);
  }

  function unique(values) {
    const seen = new Set();
    const result = [];
    values.forEach((value) => {
      const text = String(value || "").trim();
      const key = normalizeSearch(text);
      if (!text || seen.has(key)) return;
      seen.add(key);
      result.push(text);
    });
    return result;
  }

  function showModal(modal) {
    if (modal) modal.hidden = false;
  }

  function hideModal(modal) {
    if (modal) modal.hidden = true;
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
