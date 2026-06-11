(function () {
  const API_BASE = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec";
  const API_URL = `${API_BASE}?sheet=data_obat`;
  const ABSENSI_API_URL = "https://script.google.com/macros/s/AKfycbx7fkoLgH6igHP17przjmxWaP8bQNG_6OcoQ3-Ug79A_vmZxK6_ibCdLC0u-W-JLtw3/exec";
  const SESSION_KEY = "nadhira.authSession";
  const META_KEY = "nadhira.obatCacheMeta";
  const HOME_UPLOAD_ACK_KEY = "nadhira.homeUploadNotificationSeenAt";
  const OWNER_ACTIVITY_ACK_KEY = "nadhira.ownerActivityNotificationSeenAt";
  const COLUMN_KEY = "nadhira.dashboardVisibleColumns";
  const DATA_OBAT_FILTER_KEY = "nadhira.dataObatGlobalFilter";
  const EMPLOYEE_KEY = "nadhira.employeeRecords";
  const SUPPLIER_KEY = "nadhira.supplierRecords";
  const USER_KEY = "nadhira.userRecords";
  const PO_KEY = "nadhira.purchaseOrders";
  const RESTOCK_KEY = "nadhira.restockRequests";
  const RESTOCK_RESET_KEY = "nadhira.restockRequests.resetVersion";
  const RESTOCK_RESET_VERSION = "20260610-empty-online-v1";
  const RESTOCK_PHOTO_MAX_LENGTH = 42000;
  const SIDEBAR_KEY = "nadhira.sidebarCollapsed";
  const PROFILE_KEY = "nadhira.localProfile";
  const PROFILE_SECURITY_KEY = "nadhira.profileSecurity";
  const PROFILE_ACTIVITY_KEY = "nadhira.profileActivity";
  const PROFILE_PREFS_KEY = "nadhira.profilePreferences";
  const PHARMACY_PROFILE_KEY = "nadhira.pharmacyIdentity";
  const ATTENDANCE_SHIFT_RULES_KEY = "nadhira.attendanceShiftRules";
  const NOTIFICATION_DISMISS_KEY = "nadhira.dismissedNotifications";
  const NOTIFICATION_SEEN_KEY = "nadhira.seenNotifications";
  const HOME_PRAYER_REMINDER_KEY = "nadhira.homePrayerReminderShown";
  const HOME_MENU_ORDER_KEY = "nadhira.homeMenuOrder";
  const SALARY_HISTORY_KEY = "nadhira.salarySlipHistory";
  const REPORT_CACHE_KEY = "nadhira.reportCache";
  const PLATFORM_LOGO = "assets/indo-apotek-mark.png";
  const LOADING_LOGO = "assets/indo-apotek-mark-transparent.png";
  const BACKGROUND_SYNC_INTERVAL_MS = 120000;
  const BACKGROUND_SYNC_MIN_GAP_MS = 45000;
  const USER_SYNC_MIN_GAP_MS = 300000;
  const PAGE_SIZE = 10;
  const QUICK_PAGE_SIZE = 20;
  const DEFAULT_MEDICINE_UNIT_COUNT = 3;
  const MAX_MEDICINE_UNIT_COUNT = 4;
  const EXPIRING_DAYS = 90;
  const ATTENDANCE_DAY_LABELS = [
    ["monday", "Senin"],
    ["tuesday", "Selasa"],
    ["wednesday", "Rabu"],
    ["thursday", "Kamis"],
    ["friday", "Jumat"],
    ["saturday", "Sabtu"],
    ["sunday", "Minggu"]
  ];
  const ATTENDANCE_SHIFT_LABELS = [
    ["pagi", "Shift Pagi"],
    ["sore", "Shift Sore"]
  ];
  const DEFAULT_PHARMACY_PROFILE = Object.freeze({
    logo: PLATFORM_LOGO,
    name: "Apotek Anda",
    address: "",
    phone: "",
    email: "",
    website: "",
    latitude: "",
    longitude: "",
    gpsAccuracy: "",
    licenseNumber: "",
    licenseExpiry: "",
    responsiblePharmacist: "",
    sipaNumber: "",
    updatedAt: "",
    updatedBy: ""
  });

  const DATA_COLUMNS = [
    { key: "kode", label: "Kode" },
    { key: "nama", label: "Nama" },
    { key: "kategori", label: "Kategori" },
    { key: "stok", label: "Stok", type: "number" },
    { key: "satuan_beli", label: "Satuan Beli" },
    { key: "harga_beli", label: "Harga Beli" },
    { key: "satuan_1", label: "Satuan 1" },
    { key: "isi_1", label: "Isi 1" },
    { key: "harga_jual_1", label: "Harga Jual 1" },
    { key: "laba_jual_1", label: "Laba Jual 1", type: "number" },
    { key: "satuan_2", label: "Satuan 2" },
    { key: "isi_2", label: "Isi 2" },
    { key: "harga_jual_2", label: "Harga Jual 2" },
    { key: "laba_jual_2", label: "Laba Jual 2", type: "number" },
    { key: "satuan_3", label: "Satuan 3" },
    { key: "isi_3", label: "Isi 3" },
    { key: "harga_jual_3", label: "Harga Jual 3" },
    { key: "laba_jual_3", label: "Laba Jual 3", type: "number" },
    { key: "satuan_4", label: "Satuan 4" },
    { key: "isi_4", label: "Isi 4" },
    { key: "harga_jual_4", label: "Harga Jual 4" },
    { key: "laba_jual_4", label: "Laba Jual 4", type: "number" },
    { key: "stok_min", label: "Stok Min", type: "number" },
    { key: "satuan_stok_min", label: "Satuan Stok Min" },
    { key: "isi_resep_1", label: "Isi Resep 1" },
    { key: "satuan_resep_1", label: "Satuan Resep 1" },
    { key: "harga_resep_1", label: "Harga Resep 1" },
    { key: "laba_resep_1", label: "Laba Resep 1", type: "number" },
    { key: "stok_konversi_1", label: "Stok Konversi 1", type: "number" },
    { key: "satuan_konversi_1", label: "Satuan Konversi 1" },
    { key: "isi_resep_2", label: "Isi Resep 2" },
    { key: "satuan_resep_2", label: "Satuan Resep 2" },
    { key: "harga_resep_2", label: "Harga Resep 2" },
    { key: "laba_resep_2", label: "Laba Resep 2", type: "number" },
    { key: "stok_konversi_2", label: "Stok Konversi 2", type: "number" },
    { key: "satuan_konversi_2", label: "Satuan Konversi 2" },
    { key: "isi_resep_3", label: "Isi Resep 3" },
    { key: "satuan_resep_3", label: "Satuan Resep 3" },
    { key: "harga_resep_3", label: "Harga Resep 3" },
    { key: "laba_resep_3", label: "Laba Resep 3", type: "number" },
    { key: "stok_konversi_3", label: "Stok Konversi 3", type: "number" },
    { key: "satuan_konversi_3", label: "Satuan Konversi 3" },
    { key: "isi_resep_4", label: "Isi Resep 4" },
    { key: "satuan_resep_4", label: "Satuan Resep 4" },
    { key: "harga_resep_4", label: "Harga Resep 4" },
    { key: "laba_resep_4", label: "Laba Resep 4", type: "number" },
    { key: "stok_konversi_4", label: "Stok Konversi 4", type: "number" },
    { key: "satuan_konversi_4", label: "Satuan Konversi 4" },
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
    "satuan_1",
    "isi_1",
    "harga_jual_1",
    "satuan_2",
    "isi_2",
    "harga_jual_2",
    "satuan_3",
    "isi_3",
    "harga_jual_3",
    "stok_min",
    "satuan_stok_min",
    "expired",
    "suplier",
    "lokasi",
    "no_batch"
  ];
  const PRICE_COLUMNS = new Set([
    "harga_beli",
    "harga_jual_1",
    "harga_jual_2",
    "harga_jual_3",
    "harga_jual_4",
    "harga_resep_1",
    "harga_resep_2",
    "harga_resep_3",
    "harga_resep_4"
  ]);
  const QUANTITY_COLUMNS = new Set([
    "stok",
    "stok_min",
    "satuan_stok_min",
    "stok_konversi_1",
    "stok_konversi_2",
    "stok_konversi_3",
    "stok_konversi_4"
  ]);

  const VIEW_TITLES = {
    home: "Home",
    dashboard: "Dashboard",
    presensi: "Presensi / Catatan Kehadiran",
    "cari-data-obat": "Cari Data Obat",
    "data-obat": "Data Obat",
    "data-karyawan": "Data Karyawan",
    "data-supplier": "Data Supplier",
    "restok-obat": "Restok Obat",
    "surat-pesanan": "Surat Pesanan Pembelian",
    "import-data-obat": "Import Data Obat",
    "akun-profil": "Akun & Profil",
    "manajemen-pengguna": "Manajemen Pengguna"
  };

  const ACCESS_MENUS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "absensi_face_id", label: "Absensi Face ID" },
    { key: "presensi", label: "Presensi / Catatan Kehadiran" },
    { key: "cari_data_obat", label: "Cari Data Obat" },
    { key: "data_obat", label: "Data Obat" },
    { key: "filter_data_obat", label: "Filter Data Obat" },
    { key: "edit_obat", label: "Tambah/Edit Obat" },
    { key: "hapus_obat", label: "Hapus Obat" },
    { key: "data_karyawan", label: "Data Karyawan" },
    { key: "data_supplier", label: "Data Supplier" },
    { key: "restok_obat", label: "Restok Obat" },
    { key: "surat_pesanan", label: "Surat Pesanan Pembelian" },
    { key: "import_data_obat", label: "Import Data Obat" },
    { key: "akun_profil", label: "Akun & Profil" },
    { key: "manajemen_pengguna", label: "Manajemen Pengguna" },
    { key: "akses_semua_data", label: "Akses Semua Data (Owner)" }
  ];

  const ROLE_ACCESS = {
    owner: ACCESS_MENUS.map((item) => item.key),
    administrator: ["dashboard", "absensi_face_id", "presensi", "cari_data_obat", "data_obat", "filter_data_obat", "edit_obat", "hapus_obat", "data_karyawan", "data_supplier", "restok_obat", "surat_pesanan", "import_data_obat", "akun_profil", "manajemen_pengguna"],
    admin: ["dashboard", "absensi_face_id", "presensi", "cari_data_obat", "data_obat", "filter_data_obat", "edit_obat", "hapus_obat", "data_karyawan", "data_supplier", "restok_obat", "surat_pesanan", "import_data_obat", "akun_profil", "manajemen_pengguna"],
    apoteker: ["dashboard", "absensi_face_id", "presensi", "cari_data_obat", "data_obat", "filter_data_obat", "edit_obat", "data_karyawan", "data_supplier", "restok_obat", "surat_pesanan", "import_data_obat", "akun_profil"],
    kasir: ["dashboard", "absensi_face_id", "presensi", "cari_data_obat", "data_obat", "restok_obat", "akun_profil"],
    "asisten apoteker": ["dashboard", "absensi_face_id", "presensi", "cari_data_obat", "data_obat", "restok_obat", "akun_profil"],
    "staf gudang": ["dashboard", "absensi_face_id", "presensi", "cari_data_obat", "data_obat", "filter_data_obat", "edit_obat", "data_supplier", "restok_obat", "surat_pesanan", "import_data_obat", "akun_profil"],
    operator: ["dashboard", "absensi_face_id", "presensi", "cari_data_obat", "data_obat", "restok_obat", "akun_profil"]
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
        { key: "role", label: "Role", type: "select", options: ["Owner", "Administrator", "Apoteker", "Kasir", "Asisten Apoteker", "Staf Gudang", "Operator"] },
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
    globalFilterLoaded: false,
    applyingGlobalFilter: false,
    filterSaveTimer: null,
    users: [],
    employees: [],
    suppliers: [],
    purchaseItems: [],
    purchaseOrders: [],
    restockRequests: [],
    restockMineOnly: false,
    restockDetailId: "",
    restockEditingId: "",
    restockSelectionMode: false,
    selectedRestockIds: new Set(),
    restockLongPressTimer: null,
    restockLongPressTarget: "",
    restockDeleteMode: "method",
    restockDeleteSuccessTimer: null,
    restockSelectedMedicineKey: "",
    pendingRestockPhoto: "",
    pendingRestockPhotoName: "",
    pendingRestockPhotoPromise: null,
    importHeaders: [],
    importRows: [],
    scannerStream: null,
    scannerDetector: null,
    scannerAnimation: 0,
    scannerTimer: null,
    scannerCanvas: null,
    scannerLocked: false,
    scannerCandidateValue: "",
    scannerCandidateRaw: "",
    scannerCandidateCount: 0,
    scannerCandidateAt: 0,
    barcodeDetector: null,
    quaggaBusy: false,
    lastQuaggaScanAt: 0,
    zxingReader: null,
    zxingControls: null,
    torchOn: false,
    activeView: "dashboard",
    medicineMode: "edit",
    editingMedicine: null,
    unitCount: DEFAULT_MEDICINE_UNIT_COUNT,
    recordType: "",
    recordIndex: -1,
    pendingDelete: null,
    pendingProfilePhoto: null,
    pendingProfilePhotoName: "",
    ownerActivities: [],
    attendanceRecords: [],
    attendanceGroups: [],
    attendanceDate: "",
    attendanceMonth: "",
    attendanceYear: "",
    editingAttendanceGroup: null,
    payrollEmployees: [],
    payrollEditingIndex: -1,
    payrollEndpointReady: false,
    salarySlipUrl: "",
    salarySlipHistory: [],
    salaryHistoryEndpointReady: false,
    quickFilter: { type: "all", days: EXPIRING_DAYS },
    quickReport: null,
    quickPage: 1,
    previousView: "dashboard",
    viewHistory: [],
    viewForwardStack: [],
    touchStartX: 0,
    touchStartY: 0,
    touchStartAt: 0,
    appLoadingTimer: null,
    appLoadingMaxTimer: null,
    appLoadingShownAt: 0,
    appLoadingToken: 0,
    restockSyncTimer: null,
    pendingPharmacyLogo: null,
    homeMenuLongPressTimer: null,
    homeMenuDragItem: null,
    homeMenuLongPressed: false,
    homeMenuSuppressClickUntil: 0,
    usersFetchPromise: null,
    lastUserSyncAt: 0,
    backgroundSyncPromise: null,
    lastBackgroundSyncAt: 0,
    reportSignature: "",
    appLoadingSuccessTimer: null,
    actionToastTimer: null,
    viewportIsMobile: isHomeMobileViewport()
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (document.body.dataset.page !== "home") return;

    bindElements();
    if (!els.tableHead || !els.tableBody) return;

    applySavedSidebarState();
    hydratePharmacyBrand();
    hydrateProfileName();
    bindEvents();
    setupHomeMenuReorder();
    if (!routeInitialViewFromQuery()) {
      switchView(isHomeMobileViewport() ? "home" : "dashboard", { skipHistory: true });
    }
    renderColumnOptions();
    renderMedicineForm();
    renderTableHead();
    applyProfilePreferences();
    renderProfile();
    renderProfileSecurity();
    renderProfileActivity();
    renderAttendanceShiftSettings();
    loadAttendanceShiftSettingsFromBackend({ silent: true });
    loadStoredModules();
    fetchRestockRequests({ silent: true });
    fetchDataObat();
    fetchUsers();
    fetchPharmacyProfile({ silent: true });
    fetchLocalRecords({ silent: true });
    fetchAttendanceRecords({ silent: true });
    fetchPayrollEmployees({ silent: true });
    fetchSalarySlipHistory({ silent: true });
    fetchOwnerActivityLog();
    bindUserAccessSync();
  }

  function routeInitialViewFromQuery() {
    const params = new URLSearchParams(window.location.search || "");
    const requested = String(params.get("view") || "").trim().replace(/_/g, "-");
    if (!requested || !VIEW_TITLES[requested]) return false;

    switchView(requested, { skipHistory: true });
    return true;
  }

  function bindElements() {
    Object.assign(els, {
      sidebarToggle: document.getElementById("sidebarToggle"),
      sidebarScrim: document.getElementById("sidebarScrim"),
      appLoadingOverlay: document.getElementById("appLoadingOverlay"),
      appLoadingText: document.getElementById("appLoadingText"),
      appLoadingLogo: document.getElementById("appLoadingLogo"),
      actionToast: document.getElementById("actionToast"),
      actionToastMessage: document.getElementById("actionToastMessage"),
      sidebarPharmacyBrand: document.getElementById("sidebarPharmacyBrand"),
      sidebarPharmacyLogo: document.getElementById("sidebarPharmacyLogo"),
      sidebarPharmacyName: document.getElementById("sidebarPharmacyName"),
      sidebarPharmacySubtitle: document.getElementById("sidebarPharmacySubtitle"),
      homeHeaderPharmacyLogo: document.getElementById("homeHeaderPharmacyLogo"),
      homeHeaderPharmacyName: document.getElementById("homeHeaderPharmacyName"),
      homeHeaderPharmacySubtitle: document.getElementById("homeHeaderPharmacySubtitle"),
      mobileHomePharmacyLogo: document.getElementById("mobileHomePharmacyLogo"),
      mobileHomePharmacyName: document.getElementById("mobileHomePharmacyName"),
      mobileHomePharmacySubtitle: document.getElementById("mobileHomePharmacySubtitle"),
      homeThemeToggle: document.getElementById("homeThemeToggle"),
      homeMenuGrid: document.querySelector(".home-menu-grid"),
      homeProfileName: document.getElementById("homeProfileName"),
      homeProfileRole: document.getElementById("homeProfileRole"),
      viewTitle: document.getElementById("dashboardViewTitle"),
      viewButtons: Array.from(document.querySelectorAll("[data-view-target]")),
      views: Array.from(document.querySelectorAll(".dashboard-view")),
      quickSearchInput: document.getElementById("quickSearchInput"),
      quickBarcodeButton: document.getElementById("quickBarcodeButton"),
      quickResultsList: document.getElementById("quickResultsList"),
      quickSearchStatus: document.getElementById("quickSearchStatus"),
      quickFilterChips: document.getElementById("quickFilterChips"),
      quickReportTitle: document.getElementById("quickReportTitle"),
      quickBackButton: document.getElementById("quickBackButton"),
      quickPagination: document.getElementById("quickPagination"),
      quickPageInfo: document.getElementById("quickPageInfo"),
      quickPageControls: document.getElementById("quickPageControls"),
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
      homePrayerReminderModal: document.getElementById("homePrayerReminderModal"),
      homePrayerReminderCloseButton: document.getElementById("homePrayerReminderCloseButton"),
      homePrayerReminderPrimaryButton: document.getElementById("homePrayerReminderPrimaryButton"),
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
      scannerFlashButton: document.getElementById("dashboardScannerFlashButton"),
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
      restockPage: document.querySelector(".restock-page"),
      restockBackButton: document.getElementById("restockBackButton"),
      restockStatusText: document.getElementById("restockStatusText"),
      restockTotalCount: document.getElementById("restockTotalCount"),
      restockPendingCount: document.getElementById("restockPendingCount"),
      restockProcessCount: document.getElementById("restockProcessCount"),
      restockDoneCount: document.getElementById("restockDoneCount"),
      restockAddButton: document.getElementById("restockAddButton"),
      restockDeleteButton: document.getElementById("restockDeleteButton"),
      restockSearchInput: document.getElementById("restockSearchInput"),
      restockMineButton: document.getElementById("restockMineButton"),
      restockStatusFilter: document.getElementById("restockStatusFilter"),
      restockList: document.getElementById("restockList"),
      restockRequestModal: document.getElementById("restockRequestModal"),
      restockRequestForm: document.getElementById("restockRequestForm"),
      restockRequestTitle: document.getElementById("restockRequestTitle"),
      restockRequestStatus: document.getElementById("restockRequestStatus"),
      restockSubmitLabel: document.getElementById("restockSubmitLabel"),
      closeRestockRequestButton: document.getElementById("closeRestockRequestButton"),
      cancelRestockRequestButton: document.getElementById("cancelRestockRequestButton"),
      restockMedicineInput: document.getElementById("restockMedicineInput"),
      restockMedicineList: document.getElementById("restockMedicineList"),
      restockMedicineResults: document.getElementById("restockMedicineResults"),
      restockBarcodeButton: document.getElementById("restockBarcodeButton"),
      restockCurrentStockInput: document.getElementById("restockCurrentStockInput"),
      restockQtyInput: document.getElementById("restockQtyInput"),
      restockUnitSelect: document.getElementById("restockUnitSelect"),
      restockPrioritySelect: document.getElementById("restockPrioritySelect"),
      restockNoteInput: document.getElementById("restockNoteInput"),
      restockPhotoInput: document.getElementById("restockPhotoInput"),
      restockPhotoLabel: document.getElementById("restockPhotoLabel"),
      restockDetailModal: document.getElementById("restockDetailModal"),
      restockDetailTitle: document.getElementById("restockDetailTitle"),
      restockDetailStatus: document.getElementById("restockDetailStatus"),
      restockDetailBody: document.getElementById("restockDetailBody"),
      closeRestockDetailButton: document.getElementById("closeRestockDetailButton"),
      restockDeleteModal: document.getElementById("restockDeleteModal"),
      restockDeleteForm: document.getElementById("restockDeleteForm"),
      restockDeleteTitle: document.getElementById("restockDeleteTitle"),
      restockDeleteStatus: document.getElementById("restockDeleteStatus"),
      restockDeleteScope: document.getElementById("restockDeleteScope"),
      restockDeleteDateFrom: document.getElementById("restockDeleteDateFrom"),
      restockDeleteDateTo: document.getElementById("restockDeleteDateTo"),
      restockDeleteMethodPanel: document.getElementById("restockDeleteMethodPanel"),
      restockDeleteConfirmPanel: document.getElementById("restockDeleteConfirmPanel"),
      restockDeleteDatePanel: document.getElementById("restockDeleteDatePanel"),
      restockDeleteSuccessPanel: document.getElementById("restockDeleteSuccessPanel"),
      restockDeleteSuccessText: document.getElementById("restockDeleteSuccessText"),
      restockDeletePrimaryLabel: document.getElementById("restockDeletePrimaryLabel"),
      restockDeleteBackButton: document.getElementById("backRestockDeleteButton"),
      restockDeleteSelectedMethod: document.getElementById("restockDeleteSelectedMethod"),
      closeRestockDeleteButton: document.getElementById("closeRestockDeleteButton"),
      cancelRestockDeleteButton: document.getElementById("cancelRestockDeleteButton"),
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
      profilePhonePreview: document.getElementById("profilePhonePreview"),
      profileRole: document.getElementById("profileRole"),
      profileTabButtons: Array.from(document.querySelectorAll("[data-profile-tab]")),
      profilePanels: Array.from(document.querySelectorAll("[data-profile-panel]")),
      profilePanelCloseButtons: Array.from(document.querySelectorAll("[data-profile-panel-close]")),
      profileStatusText: document.getElementById("profileStatusText"),
      profileNameInput: document.getElementById("profileNameInput"),
      profileEmailInput: document.getElementById("profileEmailInput"),
      profilePhoneInput: document.getElementById("profilePhoneInput"),
      profileJobInput: document.getElementById("profileJobInput"),
      profileAddressInput: document.getElementById("profileAddressInput"),
      profilePhotoInput: document.getElementById("profilePhotoInput"),
      profilePhotoFileName: document.getElementById("profilePhotoFileName"),
      profileRemovePhotoButton: document.getElementById("profileRemovePhotoButton"),
      profileOverviewSaveButton: document.getElementById("profileOverviewSaveButton"),
      profilePasswordForm: document.getElementById("profilePasswordForm"),
      profileNewPasswordInput: document.getElementById("profileNewPasswordInput"),
      profileConfirmPasswordInput: document.getElementById("profileConfirmPasswordInput"),
      profilePasswordStrengthIcon: document.getElementById("profilePasswordStrengthIcon"),
      profilePasswordMatchIcon: document.getElementById("profilePasswordMatchIcon"),
      profilePasswordToggleButtons: Array.from(document.querySelectorAll("[data-password-target]")),
      profileActivityList: document.getElementById("profileActivityList"),
      clearProfileActivityButton: document.getElementById("clearProfileActivityButton"),
      profileThemeSelect: document.getElementById("profileThemeSelect"),
      profileCompactToggle: document.getElementById("profileCompactToggle"),
      profileStartDashboardToggle: document.getElementById("profileStartDashboardToggle"),
      pharmacyIdentityForm: document.getElementById("pharmacyIdentityForm"),
      pharmacyLogoPreview: document.getElementById("pharmacyLogoPreview"),
      pharmacyLogoInput: document.getElementById("pharmacyLogoInput"),
      pharmacyRemoveLogoButton: document.getElementById("pharmacyRemoveLogoButton"),
      pharmacyNameInput: document.getElementById("pharmacyNameInput"),
      pharmacyPhoneInput: document.getElementById("pharmacyPhoneInput"),
      pharmacyAddressInput: document.getElementById("pharmacyAddressInput"),
      pharmacyGpsButton: document.getElementById("pharmacyGpsButton"),
      pharmacyLatitudeInput: document.getElementById("pharmacyLatitudeInput"),
      pharmacyLongitudeInput: document.getElementById("pharmacyLongitudeInput"),
      pharmacyLicenseInput: document.getElementById("pharmacyLicenseInput"),
      pharmacyLicenseExpiryInput: document.getElementById("pharmacyLicenseExpiryInput"),
      pharmacyResponsibleInput: document.getElementById("pharmacyResponsibleInput"),
      pharmacySipaInput: document.getElementById("pharmacySipaInput"),
      pharmacyEmailInput: document.getElementById("pharmacyEmailInput"),
      pharmacyWebsiteInput: document.getElementById("pharmacyWebsiteInput"),
      shiftRulesForm: document.getElementById("shiftRulesForm"),
      shiftRulesGrid: document.getElementById("shiftRulesGrid"),
      resetShiftRulesButton: document.getElementById("resetShiftRulesButton"),
      attendanceRefreshButton: document.getElementById("attendanceRefreshButton"),
      attendanceDateFilter: document.getElementById("attendanceDateFilter"),
      attendanceMonthFilter: document.getElementById("attendanceMonthFilter"),
      attendanceYearFilter: document.getElementById("attendanceYearFilter"),
      attendanceTotalEmployees: document.getElementById("attendanceTotalEmployees"),
      attendancePresentToday: document.getElementById("attendancePresentToday"),
      attendanceLateToday: document.getElementById("attendanceLateToday"),
      attendanceAbsentToday: document.getElementById("attendanceAbsentToday"),
      attendanceWorkDays: document.getElementById("attendanceWorkDays"),
      attendanceWorkDaysSide: document.getElementById("attendanceWorkDaysSide"),
      attendanceTableBody: document.getElementById("attendanceTableBody"),
      attendanceTableInfo: document.getElementById("attendanceTableInfo"),
      attendanceActionHeader: document.getElementById("attendanceActionHeader"),
      attendanceMonthlyTableBody: document.getElementById("attendanceMonthlyTableBody"),
      attendanceMonthlyInfo: document.getElementById("attendanceMonthlyInfo"),
      attendanceMonthTitle: document.getElementById("attendanceMonthTitle"),
      attendanceShiftPagi: document.getElementById("attendanceShiftPagi"),
      attendanceShiftSore: document.getElementById("attendanceShiftSore"),
      attendanceDetailButton: document.getElementById("attendanceDetailButton"),
      attendanceStatusText: document.getElementById("attendanceStatusText"),
      attendanceEditModal: document.getElementById("attendanceEditModal"),
      attendanceEditForm: document.getElementById("attendanceEditForm"),
      attendanceEditStatus: document.getElementById("attendanceEditStatus"),
      closeAttendanceEditButton: document.getElementById("closeAttendanceEditButton"),
      cancelAttendanceEditButton: document.getElementById("cancelAttendanceEditButton"),
      attendanceEditName: document.getElementById("attendanceEditName"),
      attendanceEditDate: document.getElementById("attendanceEditDate"),
      attendanceEditShift: document.getElementById("attendanceEditShift"),
      attendanceEditDatang: document.getElementById("attendanceEditDatang"),
      attendanceEditPulang: document.getElementById("attendanceEditPulang"),
      attendanceEditWarning: document.getElementById("attendanceEditWarning"),
      payrollEmployeeCard: document.getElementById("payrollEmployeeCard"),
      payrollStatusText: document.getElementById("payrollStatusText"),
      payrollRefreshButton: document.getElementById("payrollRefreshButton"),
      payrollAddButton: document.getElementById("payrollAddButton"),
      payrollTableBody: document.getElementById("payrollTableBody"),
      payrollModal: document.getElementById("payrollModal"),
      payrollForm: document.getElementById("payrollForm"),
      payrollModalTitle: document.getElementById("payrollModalTitle"),
      payrollModalStatus: document.getElementById("payrollModalStatus"),
      closePayrollModalButton: document.getElementById("closePayrollModalButton"),
      cancelPayrollButton: document.getElementById("cancelPayrollButton"),
      payrollNipInput: document.getElementById("payrollNipInput"),
      payrollNameInput: document.getElementById("payrollNameInput"),
      payrollJobInput: document.getElementById("payrollJobInput"),
      payrollBaseSalaryInput: document.getElementById("payrollBaseSalaryInput"),
      payrollBaseSalaryModeSelect: document.getElementById("payrollBaseSalaryModeSelect"),
      payrollMealAllowanceInput: document.getElementById("payrollMealAllowanceInput"),
      payrollMealAllowanceModeSelect: document.getElementById("payrollMealAllowanceModeSelect"),
      payrollOvertimeInput: document.getElementById("payrollOvertimeInput"),
      payrollOvertimeModeSelect: document.getElementById("payrollOvertimeModeSelect"),
      payrollAllowanceInput: document.getElementById("payrollAllowanceInput"),
      payrollAllowanceModeSelect: document.getElementById("payrollAllowanceModeSelect"),
      payrollBonusInput: document.getElementById("payrollBonusInput"),
      payrollLoanInput: document.getElementById("payrollLoanInput"),
      payrollDebtInput: document.getElementById("payrollDebtInput"),
      payrollOtherInput: document.getElementById("payrollOtherInput"),
      salarySlipCard: document.getElementById("salarySlipCard"),
      salarySlipStatusText: document.getElementById("salarySlipStatusText"),
      salarySlipEmployeeSelect: document.getElementById("salarySlipEmployeeSelect"),
      salarySlipMonthSelect: document.getElementById("salarySlipMonthSelect"),
      salarySlipYearSelect: document.getElementById("salarySlipYearSelect"),
      generateSalarySlipButton: document.getElementById("generateSalarySlipButton"),
      openSalarySlipButton: document.getElementById("openSalarySlipButton"),
      salarySlipSummary: document.getElementById("salarySlipSummary"),
      salarySlipHistoryCard: document.getElementById("salarySlipHistoryCard"),
      salarySlipHistoryStatus: document.getElementById("salarySlipHistoryStatus"),
      salarySlipHistoryList: document.getElementById("salarySlipHistoryList"),
      userTableBody: document.getElementById("userTableBody"),
      addUserButton: document.getElementById("addUserButton"),
      userSearchInput: document.getElementById("userSearchInput"),
      userRoleFilter: document.getElementById("userRoleFilter"),
      userStatusFilter: document.getElementById("userStatusFilter"),
      reportTotal: document.getElementById("reportTotal"),
      reportActive: document.getElementById("reportActive"),
      reportInactive: document.getElementById("reportInactive"),
      reportExpiring: document.getElementById("reportExpiring"),
      reportExpired: document.getElementById("reportExpired"),
      reportEmpty: document.getElementById("reportEmpty"),
      reportLow: document.getElementById("reportLow"),
      reportMinus: document.getElementById("reportMinus"),
      reportOut: document.getElementById("reportOut")
    });
  }

  function bindEvents() {
    if (els.sidebarToggle) els.sidebarToggle.addEventListener("click", toggleSidebar);
    if (els.sidebarScrim) els.sidebarScrim.addEventListener("click", () => setSidebarCollapsed(true));
    window.addEventListener("resize", handleViewportRoute);

    els.viewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.viewTarget === "cari-data-obat") resetQuickReportFilter();
        if (!canView(button.dataset.viewTarget)) {
          showActionToast("Menu ini belum diaktifkan untuk akun Anda.", "error");
          return;
        }
        switchView(button.dataset.viewTarget);
      });
    });

    document.addEventListener("click", (event) => {
      const accessElement = event.target.closest("[data-access-key]");
      if (!accessElement || canAccess(accessElement.dataset.accessKey)) return;
      event.preventDefault();
      event.stopPropagation();
      showActionToast("Menu ini belum diaktifkan untuk akun Anda.", "error");
    }, true);

    if (els.searchInput) {
      els.searchInput.addEventListener("input", () => {
        state.page = 1;
        applyFilters();
      });
    }

    if (els.quickSearchInput) {
      els.quickSearchInput.addEventListener("input", () => {
        state.quickPage = 1;
        renderQuickSearchResults();
      });
    }
    if (els.quickFilterChips) els.quickFilterChips.addEventListener("click", handleQuickFilterChipClick);
    if (els.quickPageControls) els.quickPageControls.addEventListener("click", handleQuickPaginationClick);
    if (els.quickBackButton) els.quickBackButton.addEventListener("click", goBackFromQuickSearch);

    document.querySelectorAll("[data-report-filter]").forEach((card) => {
      card.addEventListener("click", () => applyReportQuickFilter(card.dataset.reportFilter));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          applyReportQuickFilter(card.dataset.reportFilter);
        }
      });
    });

    [els.filterCategory, els.filterSupplier, els.filterStockLevel, els.filterExpiredLevel].forEach((control) => {
      if (control) control.addEventListener("change", () => {
        state.page = 1;
        applyFilters();
        scheduleSaveDataObatFilter();
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
    if (els.quickBarcodeButton) els.quickBarcodeButton.addEventListener("click", startDashboardScanner);
    if (els.scannerVideo) els.scannerVideo.addEventListener("click", tuneDashboardScannerTrack);

    els.tableBody.addEventListener("click", handleTableAction);

    [els.closeMedicineModalButton, els.cancelMedicineButton].forEach((button) => {
      if (button) button.addEventListener("click", closeMedicineModal);
    });

    if (els.addUnitButton) els.addUnitButton.addEventListener("click", () => setUnitCount(state.unitCount + 1));
    if (els.removeUnitButton) els.removeUnitButton.addEventListener("click", () => setUnitCount(state.unitCount - 1));
    if (els.medicineForm) els.medicineForm.addEventListener("submit", saveMedicine);
    if (els.medicineFormFields) {
      els.medicineFormFields.addEventListener("click", handleMedicineFormClick);
      els.medicineFormFields.addEventListener("change", handleMedicineFormChange);
      els.medicineFormFields.addEventListener("input", handleMedicineFormInput);
    }

    [els.closeRecordModalButton, els.cancelRecordButton].forEach((button) => {
      if (button) button.addEventListener("click", closeRecordModal);
    });

    if (els.recordForm) els.recordForm.addEventListener("submit", saveRecord);
    if (els.cancelDeleteButton) els.cancelDeleteButton.addEventListener("click", closeDeleteModal);
    if (els.confirmDeleteButton) els.confirmDeleteButton.addEventListener("click", confirmDelete);
    [els.closeScannerButton, els.stopScannerButton].forEach((button) => {
      if (button) button.addEventListener("click", stopDashboardScanner);
    });
    if (els.scannerFlashButton) els.scannerFlashButton.addEventListener("click", toggleDashboardScannerFlash);
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
    if (els.restockBackButton) els.restockBackButton.addEventListener("click", () => switchView(isMobileViewport() ? "home" : "dashboard"));
    if (els.restockAddButton) els.restockAddButton.addEventListener("click", openRestockRequestModal);
    if (els.restockDeleteButton) els.restockDeleteButton.addEventListener("click", openRestockDeleteModal);
    if (els.restockSearchInput) els.restockSearchInput.addEventListener("input", renderRestockPage);
    if (els.restockStatusFilter) els.restockStatusFilter.addEventListener("change", renderRestockPage);
    if (els.restockMineButton) els.restockMineButton.addEventListener("click", toggleRestockMineOnly);
    if (els.restockList) els.restockList.addEventListener("click", handleRestockListAction);
    if (els.restockList) els.restockList.addEventListener("pointerdown", startRestockLongPress);
    if (els.restockList) els.restockList.addEventListener("pointerup", clearRestockLongPress);
    if (els.restockList) els.restockList.addEventListener("pointerleave", clearRestockLongPress);
    if (els.restockList) els.restockList.addEventListener("pointercancel", clearRestockLongPress);
    if (els.restockList) els.restockList.addEventListener("contextmenu", handleRestockListContextMenu);
    if (els.restockRequestForm) els.restockRequestForm.addEventListener("submit", saveRestockRequest);
    if (els.restockMedicineInput) els.restockMedicineInput.addEventListener("input", handleRestockMedicineSearchInput);
    if (els.restockMedicineInput) els.restockMedicineInput.addEventListener("focus", () => renderRestockMedicineResults());
    if (els.restockMedicineResults) els.restockMedicineResults.addEventListener("click", handleRestockMedicineResultClick);
    if (els.restockBarcodeButton) els.restockBarcodeButton.addEventListener("click", startDashboardScanner);
    if (els.restockPhotoInput) els.restockPhotoInput.addEventListener("change", handleRestockPhotoChange);
    [els.closeRestockRequestButton, els.cancelRestockRequestButton].forEach((button) => {
      if (button) button.addEventListener("click", closeRestockRequestModal);
    });
    if (els.closeRestockDetailButton) els.closeRestockDetailButton.addEventListener("click", closeRestockDetailModal);
    if (els.restockDetailBody) els.restockDetailBody.addEventListener("click", handleRestockDetailAction);
    if (els.restockDeleteForm) els.restockDeleteForm.addEventListener("submit", deleteRestockRequests);
    if (els.restockDeleteForm) els.restockDeleteForm.addEventListener("click", handleRestockDeleteModalClick);
    if (els.restockDeleteBackButton) els.restockDeleteBackButton.addEventListener("click", showRestockDeleteMethodPanel);
    [els.closeRestockDeleteButton, els.cancelRestockDeleteButton].forEach((button) => {
      if (button) button.addEventListener("click", closeRestockDeleteModal);
    });
    [els.restockDeleteScope, els.restockDeleteDateFrom, els.restockDeleteDateTo].forEach((control) => {
      if (control) control.addEventListener("change", updateRestockDeletePreview);
      if (control) control.addEventListener("input", updateRestockDeletePreview);
    });
    [els.restockRequestModal, els.restockDetailModal, els.restockDeleteModal].forEach((modal) => {
      if (modal) modal.addEventListener("click", (event) => {
        if (event.target === modal) hideModal(modal);
      });
    });
    if (els.importFileInput) els.importFileInput.addEventListener("change", handleImportFileChange);
    if (els.importButton) els.importButton.addEventListener("click", importExcelToGoogleSheet);
    if (els.profileForm) els.profileForm.addEventListener("submit", saveProfile);
    if (els.profileOverviewSaveButton) {
      els.profileOverviewSaveButton.addEventListener("click", () => els.profileForm?.requestSubmit());
    }
    if (els.profilePhotoInput) els.profilePhotoInput.addEventListener("change", handleProfilePhotoChange);
    if (els.profileRemovePhotoButton) els.profileRemovePhotoButton.addEventListener("click", removeProfilePhoto);
    if (els.profilePasswordForm) els.profilePasswordForm.addEventListener("submit", saveProfilePassword);
    [els.profileNewPasswordInput, els.profileConfirmPasswordInput].forEach((input) => {
      if (input) input.addEventListener("input", updateProfilePasswordIndicators);
    });
    els.profilePasswordToggleButtons.forEach((button) => {
      button.addEventListener("click", togglePasswordVisibility);
    });
    if (els.clearProfileActivityButton) els.clearProfileActivityButton.addEventListener("click", clearProfileActivity);
    if (els.homeThemeToggle) els.homeThemeToggle.addEventListener("click", toggleDashboardTheme);
    if (els.profileThemeSelect) els.profileThemeSelect.addEventListener("change", saveProfilePreferences);
    if (els.profileCompactToggle) els.profileCompactToggle.addEventListener("change", saveProfilePreferences);
    if (els.profileStartDashboardToggle) els.profileStartDashboardToggle.addEventListener("change", saveProfilePreferences);
    if (els.pharmacyIdentityForm) els.pharmacyIdentityForm.addEventListener("submit", savePharmacyIdentity);
    if (els.pharmacyLogoInput) els.pharmacyLogoInput.addEventListener("change", handlePharmacyLogoChange);
    if (els.pharmacyRemoveLogoButton) els.pharmacyRemoveLogoButton.addEventListener("click", removePharmacyLogo);
    if (els.pharmacyGpsButton) els.pharmacyGpsButton.addEventListener("click", detectPharmacyGps);
    if (els.shiftRulesForm) els.shiftRulesForm.addEventListener("submit", saveAttendanceShiftSettings);
    if (els.resetShiftRulesButton) els.resetShiftRulesButton.addEventListener("click", resetAttendanceShiftSettings);
    if (els.attendanceRefreshButton) els.attendanceRefreshButton.addEventListener("click", () => fetchAttendanceRecords({ manual: true }));
    if (els.attendanceDateFilter) els.attendanceDateFilter.addEventListener("change", () => {
      state.attendanceDate = els.attendanceDateFilter.value || getTodayDateKey();
      renderAttendanceDashboard();
    });
    [els.attendanceMonthFilter, els.attendanceYearFilter].forEach((control) => {
      if (!control) return;
      control.addEventListener("change", () => {
        state.attendanceMonth = els.attendanceMonthFilter?.value || getCurrentMonthValue();
        state.attendanceYear = els.attendanceYearFilter?.value || String(new Date().getFullYear());
        renderAttendanceDashboard();
      });
    });
    if (els.attendanceTableBody) els.attendanceTableBody.addEventListener("click", handleAttendanceTableAction);
    if (els.attendanceEditForm) els.attendanceEditForm.addEventListener("submit", saveAttendanceEdit);
    [els.closeAttendanceEditButton, els.cancelAttendanceEditButton].forEach((button) => {
      if (button) button.addEventListener("click", closeAttendanceEditModal);
    });
    if (els.attendanceEditModal) {
      els.attendanceEditModal.addEventListener("click", (event) => {
        if (event.target === els.attendanceEditModal) closeAttendanceEditModal();
      });
    }
    if (els.attendanceDetailButton) {
      els.attendanceDetailButton.addEventListener("click", () => {
        document.querySelector(".attendance-monthly-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    if (els.payrollRefreshButton) els.payrollRefreshButton.addEventListener("click", () => fetchPayrollEmployees({ manual: true }));
    if (els.payrollAddButton) els.payrollAddButton.addEventListener("click", () => openPayrollModal(-1));
    if (els.payrollTableBody) els.payrollTableBody.addEventListener("click", handlePayrollTableAction);
    if (els.payrollForm) els.payrollForm.addEventListener("submit", savePayrollEmployee);
    getPayrollMoneyInputs().forEach((input) => {
      input.addEventListener("input", () => formatPayrollMoneyInput(input));
      input.addEventListener("blur", () => formatPayrollMoneyInput(input));
    });
    [els.closePayrollModalButton, els.cancelPayrollButton].forEach((button) => {
      if (button) button.addEventListener("click", closePayrollModal);
    });
    if (els.payrollModal) {
      els.payrollModal.addEventListener("click", (event) => {
        if (event.target === els.payrollModal) closePayrollModal();
      });
    }
    [els.salarySlipEmployeeSelect, els.salarySlipMonthSelect, els.salarySlipYearSelect].forEach((control) => {
      if (!control) return;
      control.addEventListener("change", () => {
        state.salarySlipUrl = "";
        if (els.openSalarySlipButton) els.openSalarySlipButton.disabled = true;
        renderSalarySlipSummary();
      });
    });
    if (els.generateSalarySlipButton) els.generateSalarySlipButton.addEventListener("click", generateSalarySlipPdf);
    if (els.salarySlipHistoryList) els.salarySlipHistoryList.addEventListener("click", handleSalarySlipHistoryAction);
    if (els.openSalarySlipButton) els.openSalarySlipButton.addEventListener("click", () => {
      if (state.appLoadingToken) endAppLoading(state.appLoadingToken);
      if (state.salarySlipUrl) window.open(state.salarySlipUrl, "_blank", "noopener");
    });
    els.profileTabButtons.forEach((button) => {
      button.addEventListener("click", () => switchProfileTab(button.dataset.profileTab, { openPanel: true }));
    });
    els.profilePanelCloseButtons.forEach((button) => {
      button.addEventListener("click", closeProfilePanel);
    });

    if (els.notificationButton) els.notificationButton.addEventListener("click", openNotification);
    [els.notificationCloseButton, els.notificationOkButton].forEach((button) => {
      if (button) button.addEventListener("click", closeNotification);
    });
    if (els.notificationPopover) {
      els.notificationPopover.addEventListener("click", (event) => {
        if (event.target === els.notificationPopover) closeNotification();
        handleNotificationAction(event);
      });
    }

    if (els.homePrayerReminderCloseButton) {
      els.homePrayerReminderCloseButton.addEventListener("click", closeHomePrayerReminder);
    }
    if (els.homePrayerReminderPrimaryButton) {
      els.homePrayerReminderPrimaryButton.addEventListener("click", goHomeFromPrayerReminder);
    }
    if (els.homePrayerReminderModal) {
      els.homePrayerReminderModal.addEventListener("click", (event) => {
        if (event.target === els.homePrayerReminderModal) closeHomePrayerReminder();
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
        if (state.restockSelectionMode) exitRestockSelectionMode();
        closeNotification();
        setSidebarCollapsed(true);
        closeMedicineModal();
        closeRecordModal();
        closeDeleteModal();
        closeRestockRequestModal();
        closeRestockDetailModal();
        closeRestockDeleteModal();
        stopDashboardScanner();
        closeHomePrayerReminder();
      }
    });
    window.addEventListener("resize", () => {
      const collapsed = document.body.classList.contains("sidebar-collapsed");
      if (els.sidebarScrim) els.sidebarScrim.hidden = collapsed;
      if (els.notificationPopover && !els.notificationPopover.hidden) positionNotificationPopover();
    });
    document.addEventListener("touchstart", handleGlobalTouchStart, { passive: true });
    document.addEventListener("touchend", handleGlobalTouchEnd, { passive: true });
  }

  async function fetchDataObat(options = {}) {
    const loadingToken = options.manual ? startAppLoading("Menyinkronkan data obat...") : 0;
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
      await loadDataObatFilterState();
      populateMedicineOptions();
      populateRestockMedicineOptions();
      applyFilters();
      renderUploadInfo();
      updateNotificationState();
      renderSuppliers();
      renderReports();
      renderRestockPage();
      setLoading(false, `${state.rows.length} data obat berhasil dimuat.`);
    } catch (error) {
      setLoading(false, `Gagal memuat data obat: ${error.message}`);
      if (els.statusText) els.statusText.dataset.type = "error";
      state.rows = [];
      applyFilters();
      renderQuickSearchResults();
      renderUploadInfo();
      updateNotificationState();
      renderReports();
      renderRestockPage();
    } finally {
      endAppLoading(loadingToken);
    }
  }

  function bindUserAccessSync() {
    window.addEventListener("focus", () => syncBackgroundModules());
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) syncBackgroundModules();
    });
    window.setInterval(() => syncBackgroundModules(), BACKGROUND_SYNC_INTERVAL_MS);
  }

  async function syncBackgroundModules(options = {}) {
    const now = Date.now();
    if (document.hidden) return;
    if (state.backgroundSyncPromise) return state.backgroundSyncPromise;
    if (!options.force && now - state.lastBackgroundSyncAt < BACKGROUND_SYNC_MIN_GAP_MS) return;

    state.lastBackgroundSyncAt = now;
    state.backgroundSyncPromise = Promise.allSettled([
      fetchRestockRequests({ silent: true }),
      fetchOwnerActivityLog({ silent: true }),
      fetchAttendanceRecords({ silent: true }),
      fetchSalarySlipHistory({ silent: true }),
      fetchUsers({ silent: true }),
      fetchLocalRecords({ silent: true })
    ]);

    try {
      await state.backgroundSyncPromise;
    } finally {
      state.backgroundSyncPromise = null;
    }
  }

  async function fetchUsers(options = {}) {
    const now = Date.now();
    if (state.usersFetchPromise) return state.usersFetchPromise;
    if (!options.force && state.users.length && now - state.lastUserSyncAt < USER_SYNC_MIN_GAP_MS) return;

    state.usersFetchPromise = (async () => {
      try {
        const payload = await postToApi({ action: "listLoginUsers" });
        if (!payload || payload.success !== true || !Array.isArray(payload.users)) return;

        const nextUsers = payload.users.map((user, index) => ({
          id: `sheet-user-${index}`,
          name: String(user.name || user.username || user.email || "").trim(),
          username: String(user.username || user.name || "").trim(),
          role: String(user.role || "Operator").trim() || "Operator",
          status: String(user.status || "Aktif").trim() || "Aktif",
          email: String(user.email || "").trim(),
          phone: normalizePhoneNumber(user.phone || user.noHp || ""),
          address: String(user.address || user.alamat || "").trim(),
          photo: String(user.profilePhoto || user.photo || "").trim(),
          access: normalizeAccessList(user.access || user.menu, user.role || "Operator"),
          preferences: normalizeProfilePreferences(user.preferences || user.profilePreferences || user.profile_preferences)
        })).filter((user) => user.name || user.username);

        state.lastUserSyncAt = Date.now();
        if (getUserListSignature(nextUsers) === getUserListSignature(state.users)) return;
        state.users = nextUsers;
        writeStoredArray(USER_KEY, state.users);
        syncEmployeeSeed();
        syncUserSeed();
        renderEmployees();
        renderUsers();
        renderProfile();
        applyCurrentUserAccess();
      } catch (error) {
        state.lastUserSyncAt = Date.now();
        if (!options.silent) {
          console.warn("Gagal menyinkronkan data user:", error);
        }
        syncEmployeeSeed();
        syncUserSeed();
        renderEmployees();
        renderUsers();
        applyCurrentUserAccess();
      }
    })();

    try {
      await state.usersFetchPromise;
    } finally {
      state.usersFetchPromise = null;
    }
  }

  function getUserListSignature(users) {
    return JSON.stringify((users || []).map((user) => [
      user.username,
      user.name,
      user.email,
      user.role,
      user.status,
      user.phone,
      user.photo,
      (user.access || []).join(","),
      JSON.stringify(user.preferences || {})
    ]));
  }

  async function fetchLocalRecords(options = {}) {
    try {
      const payload = await postToApi({ action: "listLocalRecords" });
      if (!payload || (payload.success !== true && payload.ok !== true)) return;

      if (Array.isArray(payload.employees)) {
        const employees = payload.employees
          .map(normalizeEmployeeRecord)
          .filter((item) => item.name || item.email || item.phone);

        if (employees.length || !state.employees.length || options.allowEmpty === true) {
          state.employees = employees;
          writeStoredArray(EMPLOYEE_KEY, state.employees);
        }
      }

      if (Array.isArray(payload.suppliers)) {
        const suppliers = payload.suppliers
          .map(normalizeSupplierRecord)
          .filter((item) => item.name || item.phone || item.pic);

        if (suppliers.length || !state.suppliers.length || options.allowEmpty === true) {
          state.suppliers = suppliers;
          writeStoredArray(SUPPLIER_KEY, state.suppliers);
        }
      }

      renderEmployees();
      renderSuppliers();
      populateMedicineOptions();
      renderAttendanceDashboard();
    } catch (error) {
      if (!options.silent) {
        console.warn("Gagal menyinkronkan data karyawan/supplier:", error);
      }
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
      acc[column.key] = normalizeRowValue(column.key, pickColumnValue(row, column.key));
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
      stok_min: ["stok_min", "stokmin", "stokminimum", "stokminimal", "minimumstok", "minstok", "stok_minimum", "stok_minimal"],
      satuan_stok_min: ["satuan_stok_min", "satuanstokmin", "satuan_stok_minimum"],
      laba_otomatis: ["laba_otomatis", "labaotomatis"],
      isi_resep_1: ["isi_resep_1", "isiresep1"],
      satuan_resep_1: ["satuan_resep_1", "satuanresep1"],
      isi_resep_2: ["isi_resep_2", "isiresep2"],
      satuan_resep_2: ["satuan_resep_2", "satuanresep2"],
      isi_resep_3: ["isi_resep_3", "isiresep3"],
      satuan_resep_3: ["satuan_resep_3", "satuanresep3"],
      isi_resep_4: ["isi_resep_4", "isiresep4"],
      satuan_resep_4: ["satuan_resep_4", "satuanresep4"],
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

  async function loadDataObatFilterState() {
    state.globalFilterLoaded = true;

    let filter = readDataObatFilterState();

    try {
      const result = await postToApi({ action: "getDataObatFilter" });
      if (result && result.success === true && result.filter && typeof result.filter === "object") {
        filter = normalizeDataObatFilterState(result.filter);
        localStorage.setItem(DATA_OBAT_FILTER_KEY, JSON.stringify(filter));
      }
    } catch (error) {
      // Keep the last local copy when the deployed Apps Script has not been updated yet.
    }

    applyDataObatFilterState(filter);
  }

  function readDataObatFilterState() {
    return normalizeDataObatFilterState(readObject(DATA_OBAT_FILTER_KEY));
  }

  function normalizeDataObatFilterState(filter) {
    const source = filter && typeof filter === "object" ? filter : {};
    const visibleColumns = Array.isArray(source.visibleColumns)
      ? source.visibleColumns.filter((key) => DATA_COLUMNS.some((column) => column.key === key))
      : [];

    return {
      category: String(source.category || "").trim(),
      supplier: String(source.supplier || "").trim(),
      stockLevel: ["", "empty", "low", "minus", "ready"].includes(source.stockLevel) ? source.stockLevel : "",
      expiredLevel: ["", "expired", "soon", "safe", "blank"].includes(source.expiredLevel) ? source.expiredLevel : "",
      visibleColumns: visibleColumns.length ? visibleColumns : DEFAULT_VISIBLE_COLUMNS.slice(),
      updatedAt: String(source.updatedAt || "").trim(),
      updatedBy: String(source.updatedBy || "").trim()
    };
  }

  function applyDataObatFilterState(filter) {
    state.applyingGlobalFilter = true;
    const normalized = normalizeDataObatFilterState(filter);

    setSelectValueIfExists(els.filterCategory, normalized.category);
    setSelectValueIfExists(els.filterSupplier, normalized.supplier);
    setSelectValueIfExists(els.filterStockLevel, normalized.stockLevel);
    setSelectValueIfExists(els.filterExpiredLevel, normalized.expiredLevel);
    state.visibleColumns = normalized.visibleColumns.length
      ? normalized.visibleColumns.slice()
      : DEFAULT_VISIBLE_COLUMNS.slice();
    saveVisibleColumns();
    renderColumnOptions();
    renderTableHead();

    state.applyingGlobalFilter = false;
  }

  function setSelectValueIfExists(select, value) {
    if (!select) return;
    const text = String(value || "").trim();
    const exists = !text || Array.from(select.options).some((option) => option.value === text);
    select.value = exists ? text : "";
  }

  function scheduleSaveDataObatFilter(options = {}) {
    if (state.applyingGlobalFilter || !canManageDataObatGlobalFilter()) return;
    window.clearTimeout(state.filterSaveTimer);

    if (options.immediate) {
      saveDataObatFilterState();
      return;
    }

    state.filterSaveTimer = window.setTimeout(saveDataObatFilterState, 500);
  }

  async function saveDataObatFilterState() {
    if (!canManageDataObatGlobalFilter()) return;
    const user = getCurrentUserRecord() || {};
    const filter = {
      category: els.filterCategory ? els.filterCategory.value : "",
      supplier: els.filterSupplier ? els.filterSupplier.value : "",
      stockLevel: els.filterStockLevel ? els.filterStockLevel.value : "",
      expiredLevel: els.filterExpiredLevel ? els.filterExpiredLevel.value : "",
      visibleColumns: state.visibleColumns.slice(),
      updatedAt: new Date().toISOString(),
      updatedBy: user.name || user.username || user.email || "Owner/Admin"
    };

    localStorage.setItem(DATA_OBAT_FILTER_KEY, JSON.stringify(filter));

    try {
      await postToApi({
        action: "saveDataObatFilter",
        username: user.username || user.name || "",
        role: user.role || "",
        filter
      });
    } catch (error) {
      // The UI stays usable even before the Apps Script action is deployed.
    }
  }

  function canManageDataObatGlobalFilter() {
    const user = getCurrentUserRecord() || {};
    const role = normalizeSearch(user.role);
    return role === "owner" || role === "admin" || role === "administrator";
  }

  function uniqueValues(key) {
    return unique(state.rows.map((row) => row[key]).filter((value) => String(value || "").trim()))
      .sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
  }

  function applyFilters() {
    const query = normalizeSearch(els.searchInput ? els.searchInput.value : "");
    const filters = getDataObatFilterValues();

    state.filtered = state.rows.filter((row) => matchesDataObatFilters(row, query, filters));

    renderTableBody();
    renderFooter();
    renderQuickSearchResults();
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
    scheduleSaveDataObatFilter({ immediate: true });
  }

  function getDataObatFilterValues() {
    return {
      category: normalizeSearch(els.filterCategory ? els.filterCategory.value : ""),
      supplier: normalizeSearch(els.filterSupplier ? els.filterSupplier.value : ""),
      stockLevel: els.filterStockLevel ? els.filterStockLevel.value : "",
      expiredLevel: els.filterExpiredLevel ? els.filterExpiredLevel.value : ""
    };
  }

  function matchesDataObatFilters(row, query, filters = getDataObatFilterValues()) {
    const searchMatch = !query || DATA_COLUMNS.some((column) => normalizeSearch(row[column.key]).includes(query));
    const categoryMatch = !filters.category || normalizeSearch(row.kategori) === filters.category;
    const supplierMatch = !filters.supplier || normalizeSearch(row.suplier) === filters.supplier;
    const stockMatch = !filters.stockLevel || getStockStatus(row) === filters.stockLevel;
    const expiredMatch = !filters.expiredLevel || getExpiredStatus(row) === filters.expiredLevel;

    return searchMatch && categoryMatch && supplierMatch && stockMatch && expiredMatch;
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
        scheduleSaveDataObatFilter();
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
          ${columns.map((column) => `<td data-column="${escapeHtml(column.key)}">${escapeHtml(formatCell(row[column.key], column.key))}</td>`).join("")}
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

  function renderQuickSearchResults() {
    if (!els.quickResultsList) return;

    const query = normalizeSearch(els.quickSearchInput ? els.quickSearchInput.value : "");
    const filters = getDataObatFilterValues();
    const allRows = state.rows
      .filter((row) => matchesDataObatFilters(row, query, filters))
      .filter((row) => matchesQuickReportFilter(row, state.quickFilter));
    const quickFilterLabel = getQuickFilterLabel(state.quickFilter);
    const reportLabel = getQuickReportLabel(state.quickReport);
    const totalPages = Math.max(1, Math.ceil(allRows.length / QUICK_PAGE_SIZE));
    state.quickPage = Math.min(Math.max(1, Number(state.quickPage) || 1), totalPages);
    const start = allRows.length ? (state.quickPage - 1) * QUICK_PAGE_SIZE : 0;
    const rows = allRows.slice(start, start + QUICK_PAGE_SIZE);
    renderQuickFilterChips();
    renderQuickReportTitle(reportLabel);
    renderQuickPagination(allRows.length, start, rows.length, totalPages);

    if (els.quickSearchStatus) {
      if (!state.rows.length) {
        els.quickSearchStatus.textContent = "Data obat belum termuat.";
      } else if (!rows.length) {
        els.quickSearchStatus.textContent = quickFilterLabel
          ? `Tidak ada obat untuk filter ${quickFilterLabel}.`
          : "Obat tidak ditemukan. Coba kata kunci atau barcode lain.";
      } else {
        els.quickSearchStatus.textContent = `${formatNumber(allRows.length)} hasil ${quickFilterLabel ? `${quickFilterLabel} ` : ""}ditampilkan dari ${formatNumber(state.rows.length)} data obat.`;
      }
    }

    if (!rows.length) {
      els.quickResultsList.innerHTML = `<div class="quick-empty-state">Tidak ada data obat yang cocok.</div>`;
      return;
    }

    els.quickResultsList.innerHTML = rows.map((row, index) => `
      <article class="quick-medicine-card quick-tone-${((start + index) % 4) + 1}">
        <div class="quick-medicine-name">
          <span class="quick-name-accent" aria-hidden="true"></span>
          <strong>${escapeHtml(formatCell(row.nama))}</strong>
        </div>
        <dl class="quick-medicine-list">
          <div><dt>Stok</dt><dd>${escapeHtml(formatCell(row.stok, "stok"))} / ${escapeHtml(formatCell(row.satuan_beli))}</dd></div>
          <div><dt>Harga 1</dt><dd>${escapeHtml(formatQuickPrice(row.harga_jual_1, "harga_jual_1"))} / ${escapeHtml(formatCell(row.satuan_1))}</dd></div>
          <div><dt>Harga 2</dt><dd>${escapeHtml(formatQuickPrice(row.harga_jual_2, "harga_jual_2"))} / ${escapeHtml(formatCell(row.satuan_2))}</dd></div>
          <div><dt>Harga 3</dt><dd>${escapeHtml(formatQuickPrice(row.harga_jual_3, "harga_jual_3"))} / ${escapeHtml(formatCell(row.satuan_3))}</dd></div>
          <div><dt>Expired</dt><dd>${escapeHtml(formatQuickExpiry(row))}</dd></div>
        </dl>
        <span class="quick-card-arrow" aria-hidden="true">›</span>
      </article>
    `).join("");
  }

  function applyReportQuickFilter(type) {
    const previousView = state.activeView && state.activeView !== "cari-data-obat" ? state.activeView : "dashboard";
    clearDataObatFilters();
    state.previousView = previousView;
    state.quickReport = {
      type: type || "all",
      days: type === "expiring" ? EXPIRING_DAYS : null
    };
    state.quickFilter = {
      type: type || "all",
      days: type === "expiring" ? EXPIRING_DAYS : null
    };
    state.quickPage = 1;
    if (els.quickSearchInput) els.quickSearchInput.value = "";
    switchView("cari-data-obat", { previousView });
    renderQuickSearchResults();
  }

  function resetQuickReportFilter() {
    state.quickFilter = { type: "all", days: EXPIRING_DAYS };
    state.quickReport = null;
    state.quickPage = 1;
    renderQuickReportTitle("");
  }

  function clearDataObatFilters() {
    [els.filterCategory, els.filterSupplier, els.filterStockLevel, els.filterExpiredLevel].forEach((control) => {
      if (control) control.value = "";
    });
    state.page = 1;
  }

  function handleQuickFilterChipClick(event) {
    const resetButton = event.target.closest("[data-quick-filter-reset]");
    if (resetButton) {
      state.quickFilter = { type: "all", days: EXPIRING_DAYS };
      state.quickPage = 1;
      renderQuickSearchResults();
      return;
    }

    const reportButton = event.target.closest("[data-quick-report]");
    if (reportButton && state.quickReport) {
      state.quickFilter = {
        type: state.quickReport.type || "all",
        days: state.quickReport.type === "expiring" ? (Number(state.quickReport.days) || EXPIRING_DAYS) : null
      };
      state.quickPage = 1;
      renderQuickSearchResults();
      return;
    }

    const expiryButton = event.target.closest("[data-expiry-days]");
    if (!expiryButton) return;
    state.quickFilter = {
      type: "expiring",
      days: Number(expiryButton.dataset.expiryDays) || EXPIRING_DAYS
    };
    if (state.quickReport?.type === "expiring") {
      state.quickReport.days = state.quickFilter.days;
    }
    state.quickPage = 1;
    renderQuickSearchResults();
  }

  function renderQuickFilterChips() {
    if (!els.quickFilterChips) return;
    const filter = state.quickFilter || {};
    const reportLabel = getQuickReportLabel(state.quickReport);

    if (!reportLabel) {
      els.quickFilterChips.hidden = true;
      els.quickFilterChips.innerHTML = "";
      return;
    }

    const expiryChips = state.quickReport?.type === "expiring"
      ? [30, 60, 90].map((days) => `<button type="button" data-expiry-days="${days}" class="${Number(filter.days) === days ? "is-active" : ""}">&lt; ${days} hari</button>`).join("")
      : "";
    const reportActive = filter.type === state.quickReport.type;
    const allActive = filter.type === "all";

    els.quickFilterChips.hidden = false;
    els.quickFilterChips.innerHTML = `
      <button type="button" data-quick-report class="${reportActive ? "is-active" : ""}">${escapeHtml(reportLabel)}</button>
      ${expiryChips}
      <button type="button" data-quick-filter-reset class="${allActive ? "is-active" : ""}">Semua data</button>
    `;
  }

  function getQuickFilterLabel(filter) {
    const type = filter?.type || "all";
    const days = Number(filter?.days || EXPIRING_DAYS);
    const labels = {
      active: "obat aktif",
      inactive: "obat nonaktif",
      expired: "obat expired",
      empty: "stok habis",
      low: "stok menipis",
      minus: "stok minus",
      out: "stok habis"
    };

    if (type === "expiring") return `akan expired < ${days} hari`;
    return labels[type] || "";
  }

  function getQuickReportLabel(report) {
    if (!report || !report.type || report.type === "all") return "";
    const labels = {
      active: "Obat Aktif",
      inactive: "Obat Nonaktif",
      expired: "Obat Expired",
      empty: "Stok Habis",
      low: "Stok Menipis",
      minus: "Stok Minus",
      out: "Stok Habis",
      expiring: "Akan Expired"
    };

    return labels[report.type] || "";
  }

  function renderQuickReportTitle(label) {
    if (!els.quickReportTitle) return;
    if (!label) {
      els.quickReportTitle.hidden = true;
      els.quickReportTitle.innerHTML = "";
      return;
    }

    const detail = state.quickReport?.type === "expiring"
      ? `Menampilkan obat aktif yang akan expired dalam ${Number(state.quickReport.days || EXPIRING_DAYS)} hari.`
      : "Lampiran data obat sesuai laporan dashboard.";
    els.quickReportTitle.hidden = false;
    els.quickReportTitle.innerHTML = `
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(detail)}</small>
    `;
  }

  function renderQuickPagination(totalRows, start, rowCount, totalPages) {
    if (!els.quickPagination || !els.quickPageControls || !els.quickPageInfo) return;

    if (!totalRows) {
      els.quickPagination.hidden = true;
      els.quickPageControls.innerHTML = "";
      els.quickPageInfo.textContent = "";
      return;
    }

    const end = start + rowCount;
    els.quickPagination.hidden = false;
    els.quickPageInfo.textContent = `Menampilkan ${formatNumber(start + 1)} - ${formatNumber(end)} dari ${formatNumber(totalRows)} data`;
    const pages = getQuickPaginationPages(state.quickPage, totalPages);
    els.quickPageControls.innerHTML = `
      <button type="button" data-quick-page="prev" ${state.quickPage <= 1 ? "disabled" : ""} aria-label="Halaman sebelumnya">&lt;</button>
      ${pages.map((page) => page === "..."
        ? `<span class="quick-page-ellipsis">...</span>`
        : `<button type="button" data-quick-page="${page}" class="${page === state.quickPage ? "is-active" : ""}">${page}</button>`
      ).join("")}
      <button type="button" data-quick-page="next" ${state.quickPage >= totalPages ? "disabled" : ""} aria-label="Halaman berikutnya">&gt;</button>
    `;
  }

  function getQuickPaginationPages(current, total) {
    if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
    const pages = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    if (start > 2) pages.push("...");
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < total - 1) pages.push("...");
    pages.push(total);
    return pages;
  }

  function handleQuickPaginationClick(event) {
    const button = event.target.closest("[data-quick-page]");
    if (!button || button.disabled) return;

    const action = button.dataset.quickPage;
    const total = Math.max(1, Math.ceil(getQuickFilteredRowsCount() / QUICK_PAGE_SIZE));
    if (action === "prev") state.quickPage = Math.max(1, state.quickPage - 1);
    else if (action === "next") state.quickPage = Math.min(total, state.quickPage + 1);
    else state.quickPage = Math.min(total, Math.max(1, Number(action) || 1));
    renderQuickSearchResults();
  }

  function getQuickFilteredRowsCount() {
    const query = normalizeSearch(els.quickSearchInput ? els.quickSearchInput.value : "");
    const filters = getDataObatFilterValues();
    return state.rows
      .filter((row) => matchesDataObatFilters(row, query, filters))
      .filter((row) => matchesQuickReportFilter(row, state.quickFilter))
      .length;
  }

  function goBackFromQuickSearch() {
    const target = state.previousView && VIEW_TITLES[state.previousView] ? state.previousView : (isMobileViewport() ? "home" : "dashboard");
    switchView(target, { fromBack: true });
  }

  function matchesQuickReportFilter(row, filter) {
    const type = filter?.type || "all";
    if (type === "all") return true;
    if (type === "active") return getEffectiveMedicineStatus(row) === "aktif";
    if (type === "inactive") return getEffectiveMedicineStatus(row) === "nonaktif";
    if (type === "expired") return isActiveExpiredMedicine(row);
    if (type === "empty") return parseNumber(row.stok) === 0;
    if (type === "minus") return parseNumber(row.stok) < 0;
    if (type === "out") return parseNumber(row.stok) === 0;
    if (type === "low") return isLowStock(row);
    if (type === "expiring") {
      const daysLeft = getExpiryDaysLeft(row);
      return isActiveMedicineForExpiryReport(row) && daysLeft !== null && daysLeft >= 0 && daysLeft <= (Number(filter.days) || EXPIRING_DAYS);
    }
    return true;
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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showModal(els.scannerModal);
      setScannerStatus("Browser belum mendukung akses kamera. Gunakan input manual.");
      return;
    }

    stopDashboardScanner({ keepModalOpen: true });
    state.scannerLocked = false;
    resetDashboardScanCandidate();
    showModal(els.scannerModal);
    setScannerStatus("Membuka kamera scanner...");

    try {
      state.scannerStream = await openDashboardScannerStream();
      els.scannerVideo.srcObject = state.scannerStream;
      await els.scannerVideo.play();
      await tuneDashboardScannerTrack();
      window.setTimeout(tuneDashboardScannerTrack, 700);
      setupDashboardScannerFlashButton();
      await setupDashboardNativeBarcodeDetector();
      scanDashboardFrame();

      if (await startDashboardZxingScanner(state.scannerStream)) {
        window.setTimeout(setupDashboardScannerFlashButton, 500);
        setScannerStatus("Kamera aktif. Arahkan barcode atau QR ke dalam bingkai.");
        return;
      }

      if (!state.barcodeDetector && !window.jsQR && !(window.Quagga || window.Quagga2)) {
        setScannerStatus("Scanner belum siap. Coba muat ulang halaman saat internet aktif, atau gunakan input manual.");
        return;
      }

      setScannerStatus("Kamera aktif. Arahkan barcode atau QR ke dalam bingkai.");
    } catch (error) {
      setScannerStatus(`Scanner belum bisa dibuka: ${error.message}. Gunakan input manual.`);
      stopDashboardScanner({ keepModalOpen: true });
    }
  }

  async function setupDashboardNativeBarcodeDetector() {
    if (!("BarcodeDetector" in window)) {
      state.barcodeDetector = null;
      return;
    }

    try {
      const supportedFormats = window.BarcodeDetector.getSupportedFormats
        ? await window.BarcodeDetector.getSupportedFormats()
        : [];
      const wantedFormats = ["ean_13", "ean_8", "code_128", "code_39", "code_93", "codabar", "itf", "upc_a", "upc_e", "qr_code"];
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

  async function scanDashboardFrame() {
    if (state.scannerLocked || !els.scannerVideo || els.scannerModal?.hidden || !els.scannerVideo.srcObject) return;

    try {
      if (els.scannerVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const scanCanvas = getDashboardScannerCanvas();
        const scanContext = scanCanvas.getContext("2d", { willReadFrequently: true });
        const crop = getDashboardScanCrop();

        scanCanvas.width = crop.targetWidth;
        scanCanvas.height = crop.targetHeight;
        scanContext.drawImage(
          els.scannerVideo,
          crop.sourceX,
          crop.sourceY,
          crop.sourceWidth,
          crop.sourceHeight,
          0,
          0,
          crop.targetWidth,
          crop.targetHeight
        );

        const nativeValue = state.barcodeDetector ? await detectDashboardNativeBarcode(scanCanvas) : "";
        const qrValue = nativeValue || detectDashboardJsQr(scanContext, scanCanvas.width, scanCanvas.height);
        const quaggaValue = nativeValue || qrValue ? "" : await detectDashboardQuagga(scanCanvas);
        const value = (nativeValue || qrValue || quaggaValue || "").trim();

        if (value && confirmDashboardScanCandidate(value)) {
          return;
        }
      }
    } catch (error) {
      setScannerStatus("Barcode belum terbaca. Coba dekatkan kamera dan pastikan cahaya cukup.");
    }

    if (!state.scannerLocked && !els.scannerModal?.hidden) {
      state.scannerTimer = window.setTimeout(scanDashboardFrame, 180);
    }
  }

  async function detectDashboardNativeBarcode(scanCanvas) {
    try {
      const barcodes = await state.barcodeDetector.detect(scanCanvas);
      return barcodes[0]?.rawValue?.trim() || "";
    } catch (error) {
      return "";
    }
  }

  function detectDashboardJsQr(scanContext, width, height) {
    if (!window.jsQR) return "";

    try {
      const imageData = scanContext.getImageData(0, 0, width, height);
      const result = window.jsQR(imageData.data, width, height, { inversionAttempts: "attemptBoth" });
      return result?.data?.trim() || "";
    } catch (error) {
      return "";
    }
  }

  function detectDashboardQuagga(scanCanvas) {
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

  function getDashboardScannerCanvas() {
    if (!state.scannerCanvas) {
      state.scannerCanvas = document.createElement("canvas");
    }
    return state.scannerCanvas;
  }

  function getDashboardScanCrop() {
    const sourceWidth = els.scannerVideo.videoWidth || 1280;
    const sourceHeight = els.scannerVideo.videoHeight || 720;
    const frameRatio = 2.9;
    const maxWidth = sourceWidth * 0.86;
    const maxHeight = sourceHeight * 0.56;
    let cropWidth = Math.min(maxWidth, maxHeight * frameRatio);
    let cropHeight = cropWidth / frameRatio;

    if (cropHeight > maxHeight) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * frameRatio;
    }

    cropWidth = Math.round(cropWidth);
    cropHeight = Math.round(cropHeight);

    return {
      sourceX: Math.round((sourceWidth - cropWidth) / 2),
      sourceY: Math.round((sourceHeight - cropHeight) / 2),
      sourceWidth: cropWidth,
      sourceHeight: cropHeight,
      targetWidth: Math.min(1280, cropWidth),
      targetHeight: Math.min(720, cropHeight)
    };
  }

  async function startDashboardZxingScanner(stream) {
    const Reader = window.ZXingBrowser?.BrowserMultiFormatReader || window.ZXing?.BrowserMultiFormatReader;
    if (!Reader) return false;

    state.zxingReader = createDashboardZxingReader(Reader);
    if (!state.zxingReader) return false;

    const onResult = (result) => {
      const rawValue = (result?.getText ? result.getText() : result?.text || "").trim();
      if (!rawValue || state.scannerLocked) return;
      confirmDashboardScanCandidate(rawValue);
    };

    const controls = state.zxingReader.decodeFromStream
      ? await state.zxingReader.decodeFromStream(stream, els.scannerVideo, onResult)
      : await state.zxingReader.decodeFromVideoDevice(undefined, els.scannerVideo, onResult);
    state.zxingControls = controls || null;
    return true;
  }

  function createDashboardZxingReader(Reader) {
    const formats = getDashboardZxingFormats();
    const hints = getDashboardZxingHints(formats);

    try {
      return new Reader(hints, {
        delayBetweenScanAttempts: 160,
        delayBetweenScanSuccess: 650,
        tryPlayVideoTimeout: 5000
      });
    } catch (error) {
      return new Reader(undefined, {
        delayBetweenScanAttempts: 160,
        delayBetweenScanSuccess: 650,
        tryPlayVideoTimeout: 5000
      });
    }
  }

  function getDashboardZxingFormats() {
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

  function getDashboardZxingHints(formats) {
    const DecodeHintType = window.ZXingBrowser?.DecodeHintType || window.ZXing?.DecodeHintType;
    if (!DecodeHintType) return undefined;

    const hints = new Map();
    if (formats?.length) hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    if (DecodeHintType.TRY_HARDER !== undefined) hints.set(DecodeHintType.TRY_HARDER, true);
    return hints;
  }

  async function openDashboardScannerStream() {
    const initialStream = await getDashboardScannerStreamWithFallbacks();
    const selectedTrack = initialStream.getVideoTracks()[0];
    const rearDevice = await findDashboardRearCameraDevice(selectedTrack?.label);

    if (!rearDevice || selectedTrack?.label === rearDevice.label) {
      return initialStream;
    }

    initialStream.getTracks().forEach((track) => track.stop());

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: buildDashboardScannerVideoConstraints(rearDevice.deviceId)
      });
    } catch (error) {
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: buildDashboardScannerVideoConstraints()
      });
    }
  }

  async function getDashboardScannerStreamWithFallbacks() {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: buildDashboardScannerVideoConstraints(null, true)
      });
    } catch (error) {
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: buildDashboardScannerVideoConstraints()
      });
    }
  }

  function buildDashboardScannerVideoConstraints(deviceId, exactFacingMode = false) {
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

  async function findDashboardRearCameraDevice(currentLabel) {
    if (!navigator.mediaDevices?.enumerateDevices) return null;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");
      const rearPattern = /(back|rear|environment|belakang|kamera belakang|0)/i;
      return videoInputs.find((device) => rearPattern.test(device.label)) ||
        videoInputs.find((device) => device.label && device.label !== currentLabel) ||
        null;
    } catch (error) {
      return null;
    }
  }

  async function tuneDashboardScannerTrack() {
    const track = getDashboardScannerVideoTrack();
    if (!track?.applyConstraints) return;

    const capabilities = track.getCapabilities ? track.getCapabilities() : {};
    const constraints = {};

    if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes("continuous")) {
      constraints.focusMode = "continuous";
    }
    if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes("continuous")) {
      constraints.exposureMode = "continuous";
    }

    if (Object.keys(constraints).length) {
      try {
        await track.applyConstraints({ advanced: [constraints] });
      } catch (error) {
        // Kamera tetap bisa dipakai meski fokus otomatis tidak didukung.
      }
    }
    setupDashboardScannerFlashButton();
  }

  function confirmDashboardScanCandidate(value) {
    if (state.scannerLocked) return false;

    const rawValue = String(value || "").trim();
    const normalizedValue = rawValue.replace(/\s+/g, "");
    if (normalizedValue.length < 4) return false;

    const now = Date.now();
    const withinWindow = now - state.scannerCandidateAt < 1300;

    if (state.scannerCandidateValue === normalizedValue && withinWindow) {
      state.scannerCandidateCount += 1;
    } else {
      state.scannerCandidateValue = normalizedValue;
      state.scannerCandidateRaw = rawValue;
      state.scannerCandidateCount = 1;
    }

    state.scannerCandidateAt = now;

    const requiredReads = normalizedValue.length >= 8 ? 2 : 3;
    if (state.scannerCandidateCount >= requiredReads) {
      applyScannedBarcode(state.scannerCandidateRaw || rawValue);
      return true;
    }

    setScannerStatus(`Barcode terdeteksi, tahan sebentar... (${state.scannerCandidateCount}/${requiredReads})`);
    return false;
  }

  function resetDashboardScanCandidate() {
    state.scannerCandidateValue = "";
    state.scannerCandidateRaw = "";
    state.scannerCandidateCount = 0;
    state.scannerCandidateAt = 0;
  }

  async function toggleDashboardScannerFlash() {
    const track = getDashboardScannerVideoTrack();
    const nextTorchState = !state.torchOn;

    if (state.zxingControls?.switchTorch) {
      try {
        await state.zxingControls.switchTorch(nextTorchState);
        updateDashboardTorchState(nextTorchState);
        return;
      } catch (error) {
        updateDashboardTorchState(false, true);
      }
    }

    if (state.zxingControls?.streamVideoConstraintsApply) {
      try {
        await state.zxingControls.streamVideoConstraintsApply({ advanced: [{ torch: nextTorchState }] });
        updateDashboardTorchState(nextTorchState);
        return;
      } catch (error) {
        updateDashboardTorchState(false, true);
      }
    }

    if (!track?.applyConstraints) {
      setScannerStatus("Flash belum bisa dikontrol oleh browser ini.");
      return;
    }

    try {
      const changed = await applyDashboardTorchToTrack(track, nextTorchState);
      if (!changed) throw new Error("Torch tidak didukung");
      updateDashboardTorchState(nextTorchState);
    } catch (error) {
      updateDashboardTorchState(false, true);
      setScannerStatus("Flash belum bisa dikontrol oleh browser ini.");
    }
  }

  function updateDashboardTorchState(isOn, silent) {
    state.torchOn = Boolean(isOn);
    if (els.scannerFlashButton) {
      els.scannerFlashButton.classList.toggle("is-active", state.torchOn);
    }
    if (!silent) {
      setScannerStatus(state.torchOn ? "Flash aktif. Arahkan barcode ke dalam bingkai." : "Flash mati. Arahkan barcode ke dalam bingkai.");
    }
  }

  async function applyDashboardTorchToTrack(track, nextTorchState) {
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
        // Android Chrome/WebView expose torch through different constraints.
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

  function setupDashboardScannerFlashButton() {
    if (!els.scannerFlashButton) return;

    const track = getDashboardScannerVideoTrack();
    const capabilities = track?.getCapabilities ? track.getCapabilities() : {};
    const hasTorch = Boolean(
      state.zxingControls?.switchTorch ||
      state.zxingControls?.streamVideoConstraintsApply ||
      track ||
      (capabilities && "torch" in capabilities)
    );

    els.scannerFlashButton.hidden = !hasTorch;
    els.scannerFlashButton.classList.toggle("is-active", state.torchOn);
  }

  function getDashboardScannerVideoTrack() {
    const stream = state.scannerStream || els.scannerVideo?.srcObject;
    if (!stream?.getVideoTracks) return null;
    return stream.getVideoTracks()[0] || null;
  }

  function applyScannedBarcode(value) {
    if (!value) return;
    if (state.scannerLocked) return;
    state.scannerLocked = true;
    resetDashboardScanCandidate();
    const isRestockSearchOpen = els.restockRequestModal && !els.restockRequestModal.hidden && els.restockMedicineInput;
    const targetInput = isRestockSearchOpen
      ? els.restockMedicineInput
      : state.activeView === "cari-data-obat" && els.quickSearchInput
      ? els.quickSearchInput
      : els.searchInput;

    if (targetInput) {
      targetInput.value = value;
      state.page = 1;
      if (targetInput === els.restockMedicineInput) {
        state.restockSelectedMedicineKey = "";
        renderRestockMedicineResults(value, { force: true });
        if (els.restockRequestStatus) els.restockRequestStatus.textContent = "Barcode terbaca. Pilih obat dari hasil pencarian untuk mengisi data restok.";
      } else if (targetInput === els.quickSearchInput) {
        renderQuickSearchResults();
      } else {
        applyFilters();
      }
    }
    setScannerStatus(`Barcode terbaca: ${value}`);
    stopDashboardScanner();
  }

  function useManualBarcodeInput() {
    const value = window.prompt("Masukkan barcode obat:");
    if (String(value || "").trim()) applyScannedBarcode(String(value).trim());
  }

  function stopDashboardScanner(options = {}) {
    if (state.scannerAnimation) {
      window.cancelAnimationFrame(state.scannerAnimation);
      state.scannerAnimation = 0;
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
    state.scannerDetector = null;
    resetDashboardScanCandidate();
    if (els.scannerFlashButton) {
      els.scannerFlashButton.hidden = true;
      els.scannerFlashButton.classList.remove("is-active");
    }
    if (els.scannerVideo) els.scannerVideo.srcObject = null;
    if (!options.keepModalOpen) hideModal(els.scannerModal);
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

    const loadingToken = startAppLoading("Membaca file import...");
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
    } finally {
      endAppLoading(loadingToken);
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
        if (header) item[header] = normalizeImportValue(header, row[index] || "");
      });
      return item;
    });

    return { headers, rows };
  }

  function normalizeImportValue(header, value) {
    if (PRICE_COLUMNS.has(header)) return normalizePriceValue(value, header);
    if (QUANTITY_COLUMNS.has(header)) return normalizeQuantityValue(value);
    return value;
  }

  async function importExcelToGoogleSheet() {
    if (!state.importRows.length) {
      setImportStatus("Pilih file Excel terlebih dahulu.", "warning");
      return;
    }

    if (els.importButton) els.importButton.disabled = true;
    const loadingToken = startAppLoading("Mengupload data obat...");
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
      showActionToast("Import data obat berhasil.");
    } catch (error) {
      setImportStatus(`Upload gagal: ${error.message}.`, "error");
    } finally {
      if (els.importButton) els.importButton.disabled = !state.importRows.length;
      endAppLoading(loadingToken);
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

  async function fetchOwnerActivityLog(options = {}) {
    const user = getCurrentUserRecord() || {};

    try {
      const result = await postToApi({
        action: "listActivityLog",
        limit: isOwnerUser(user) ? 40 : 12,
        role: user.role || "",
        username: user.username || "",
        email: user.email || "",
        actor: user.name || ""
      });
      if (!result || (result.success !== true && result.ok !== true) || !Array.isArray(result.activities)) return;
      state.ownerActivities = result.activities.map(normalizeActivityRecord).filter((item) => item.title || item.detail);
      renderProfileActivity();
      updateNotificationState();
    } catch (error) {
      if (!options.silent) console.warn("Gagal membaca aktivitas owner:", error);
    }
  }

  function normalizeActivityRecord(item) {
    return {
      title: String(item?.title || "Aktivitas").trim(),
      detail: String(item?.detail || "").trim(),
      actor: String(item?.actor || "").trim(),
      role: String(item?.role || "").trim(),
      username: String(item?.username || "").trim(),
      email: String(item?.email || "").trim(),
      scope: String(item?.scope || "").trim(),
      at: String(item?.at || item?.createdAt || new Date().toISOString()).trim()
    };
  }

  function getLatestOwnerActivityAt() {
    const latest = getVisibleActivityNotificationItems()[0] || null;
    return normalizeTimestamp(latest?.at || "");
  }

  function updateNotificationState() {
    if (!els.notificationButton || !els.notificationDot) return;

    const items = getNotificationItems();
    const seen = new Set(readSeenNotificationKeys());
    const count = items.filter((item) => !seen.has(item.key)).length;
    const label = count
      ? `Ada ${count} notifikasi baru`
      : "Tidak ada notifikasi terbaru";

    els.notificationDot.hidden = count < 1;
    els.notificationDot.textContent = count > 0 ? (count > 9 ? "9+" : String(count)) : "";
    els.notificationButton.classList.toggle("has-unread", count > 0);
    els.notificationButton.title = label;
    els.notificationButton.setAttribute("aria-label", label);
  }

  function openNotification() {
    const items = getNotificationItems();
    if (els.notificationMessage) {
      els.notificationMessage.innerHTML = buildNotificationHtml(items);
      bindNotificationSwipeActions();
    }
    if (els.notificationPopover) {
      positionNotificationPopover();
      els.notificationPopover.hidden = false;
      document.body.classList.add("notification-open");
    }
    markNotificationItemsSeen(items);
  }

  function closeNotification() {
    if (els.notificationPopover) els.notificationPopover.hidden = true;
    document.body.classList.remove("notification-open");
  }

  function getOwnerActivityNotificationItems() {
    return getVisibleActivityNotificationItems();
  }

  function getVisibleActivityNotificationItems() {
    const user = getCurrentUserRecord();
    const remoteActivity = state.ownerActivities.length ? state.ownerActivities : [];
    const localActivity = readStoredArray(PROFILE_ACTIVITY_KEY).map(normalizeActivityRecord);
    const source = remoteActivity.concat(localActivity)
      .map(normalizeActivityRecord)
      .filter((item) => item.title || item.detail);
    const visible = isOwnerUser(user)
      ? source
      : source.filter((item) => isOwnAccountActivity(item, user));

    return visible
      .filter((item, index, list) => {
        const key = `${item.at}|${item.title}|${item.actor}|${item.detail}|${item.username}|${item.email}`;
        return list.findIndex((entry) => `${entry.at}|${entry.title}|${entry.actor}|${entry.detail}|${entry.username}|${entry.email}` === key) === index;
      })
      .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
      .slice(0, 30)
      .map(normalizeActivityRecord);
  }

  function isOwnAccountActivity(item, user) {
    if (!item || !user) return false;
    const accountText = normalizeSearch(`${item.title} ${item.detail} ${item.scope}`);
    const isAccountEvent = /akun|profil|foto|password|preferensi|login|logout|email/.test(accountText);
    if (!isAccountEvent) return false;

    const identityText = normalizeSearch(`${item.actor} ${item.username} ${item.email}`);
    const keys = [user.username, user.email, user.name]
      .map(normalizeSearch)
      .filter(Boolean);
    return keys.some((key) => identityText.includes(key));
  }

  function getActivityAckKey() {
    const user = getCurrentUserRecord();
    return `${OWNER_ACTIVITY_ACK_KEY}.${isOwnerUser(user) ? "owner" : getProfileStorageIdentity()}`;
  }

  function getNotificationItems() {
    const dismissed = new Set(readDismissedNotificationKeys());
    const items = [];
    const uploadedAt = normalizeTimestamp(state.uploadedAt || "");

    if (uploadedAt) {
      items.push({
        key: `upload|${uploadedAt}`,
        kind: "upload",
        title: "Update Data Obat",
        detail: "Data obat terbaru tersedia dari upload Google Sheet.",
        actor: "Sistem",
        at: uploadedAt
      });
    }

    getVisibleActivityNotificationItems().forEach((activity) => {
      const item = normalizeActivityRecord(activity);
      items.push({
        ...item,
        key: buildActivityNotificationKey(item),
        kind: "activity",
        title: item.title || "Aktivitas Akun",
        detail: item.detail || "",
        at: item.at || new Date().toISOString()
      });
    });

    getRestockNotificationItems().forEach((item) => items.push(item));

    return items
      .filter((item, index, list) => list.findIndex((entry) => entry.key === item.key) === index)
      .filter((item) => !dismissed.has(item.key))
      .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
      .slice(0, 30);
  }

  function getRestockNotificationItems() {
    return state.restockRequests
      .map((request) => {
        const item = normalizeRestockRequest(request);
        const status = getRestockStatusMeta(item.status);
        const at = item.updatedAt || item.createdAt || new Date().toISOString();
        return {
          key: ["restock", item.id, item.status, at].map((part) => String(part || "").replace(/\|/g, " ")).join("|"),
          kind: "restock",
          restockId: item.id,
          title: status.notification,
          detail: `${item.medicineName || "Obat"} - ${status.label} - ${formatNumber(item.qty)} ${item.unit}`,
          actor: item.reporter || "Restok Obat",
          at
        };
      })
      .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
      .slice(0, 20);
  }

  function buildActivityNotificationKey(item) {
    const normalized = normalizeActivityRecord(item);
    return [
      "activity",
      normalized.at,
      normalized.title,
      normalized.actor,
      normalized.username,
      normalized.email,
      normalized.detail
    ].map((part) => String(part || "").replace(/\|/g, " ")).join("|");
  }

  function getNotificationDismissKey() {
    const user = getCurrentUserRecord();
    const identity = isOwnerUser(user) ? "owner" : getProfileStorageIdentity();
    return `${NOTIFICATION_DISMISS_KEY}.${identity || "guest"}`;
  }

  function readDismissedNotificationKeys() {
    return readStoredArray(getNotificationDismissKey()).map(String);
  }

  function getNotificationSeenKey() {
    const user = getCurrentUserRecord();
    const identity = isOwnerUser(user) ? "owner" : getProfileStorageIdentity();
    return `${NOTIFICATION_SEEN_KEY}.${identity || "guest"}`;
  }

  function readSeenNotificationKeys() {
    return readStoredArray(getNotificationSeenKey()).map(String);
  }

  function markNotificationItemsSeen(items) {
    const keys = (items || []).map((item) => String(item?.key || "")).filter(Boolean);
    if (!keys.length) return;
    const merged = Array.from(new Set(readSeenNotificationKeys().concat(keys))).slice(-300);
    writeStoredArray(getNotificationSeenKey(), merged);
    updateNotificationState();
  }

  function dismissNotificationKey(key) {
    const cleanKey = String(key || "");
    if (!cleanKey) return;
    const list = readDismissedNotificationKeys();
    if (!list.includes(cleanKey)) writeStoredArray(getNotificationDismissKey(), list.concat(cleanKey).slice(-250));
    updateNotificationState();
    if (els.notificationPopover && !els.notificationPopover.hidden) openNotification();
  }

  function dismissAllNotifications() {
    const keys = getNotificationItems().map((item) => item.key).filter(Boolean);
    if (!keys.length) return;
    const current = readDismissedNotificationKeys();
    const merged = Array.from(new Set(current.concat(keys))).slice(-250);
    writeStoredArray(getNotificationDismissKey(), merged);
    updateNotificationState();
    if (els.notificationPopover && !els.notificationPopover.hidden) openNotification();
  }

  function handleNotificationAction(event) {
    const clearButton = event.target.closest("[data-notification-clear]");
    if (clearButton) {
      event.preventDefault();
      dismissAllNotifications();
      return;
    }

    const restockButton = event.target.closest("[data-notification-restock]");
    if (restockButton) {
      event.preventDefault();
      const id = restockButton.dataset.notificationRestock;
      closeNotification();
      if (canView("restok-obat")) {
        if (state.activeView !== "restok-obat") switchView("restok-obat");
        window.setTimeout(() => openRestockDetailModal(id), 0);
      }
      return;
    }

    const deleteButton = event.target.closest("[data-notification-delete]");
    if (!deleteButton) return;
    event.preventDefault();
    dismissNotificationKey(deleteButton.dataset.notificationDelete);
  }

  function bindNotificationSwipeActions() {
    if (!els.notificationMessage) return;
    els.notificationMessage.querySelectorAll("[data-notification-key]").forEach((item) => {
      let startX = 0;
      let startY = 0;

      item.addEventListener("touchstart", (event) => {
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
      }, { passive: true });

      item.addEventListener("touchend", (event) => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        if (deltaX < -55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
          dismissNotificationKey(item.dataset.notificationKey);
        }
      }, { passive: true });
    });
  }

  function buildNotificationHtml(items) {
    if (!items.length) {
      return '<div class="notification-empty">Tidak ada notifikasi tersimpan.</div>';
    }

    return `
      <div class="notification-toolbar">
        <strong>${items.length} notifikasi</strong>
        <button type="button" data-notification-clear>Hapus semua</button>
      </div>
      <ol class="notification-list">${items.map((item, index) => {
          const time = formatLastUpdated(item.at || new Date().toISOString()).replace("Last updated ", "");
          const actor = item.actor ? ` oleh ${item.actor}` : "";
          const detail = item.detail ? `<span class="notification-detail">${escapeHtml(item.detail)}</span>` : "";
          const restockAction = item.kind === "restock" && item.restockId
            ? `<button class="notification-open-restock" type="button" data-notification-restock="${escapeHtml(item.restockId)}">Lihat Detail</button>`
            : "";
          return `<li class="notification-item is-${escapeHtml(item.kind || "activity")}" data-notification-key="${escapeHtml(item.key)}">
            <span class="notification-number">${index + 1}</span>
            <span class="notification-body">
              <strong>${escapeHtml(item.title || "Aktivitas")}</strong>
              <small>${escapeHtml(time + actor)}</small>
              ${detail}
              ${restockAction}
            </span>
            <button class="notification-delete" type="button" data-notification-delete="${escapeHtml(item.key)}" aria-label="Hapus notifikasi">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </li>`;
        }).join("")}</ol>
      <div class="notification-upload-note">Geser laporan ke kiri atau tekan tombol hapus untuk menghapus notifikasi.</div>
    `;
  }

  function buildOwnerActivityNotification() {
    const activities = getOwnerActivityNotificationItems();
    if (!activities.length) return "";
    return activities.map((item) => {
      const time = formatLastUpdated(item.at || new Date().toISOString()).replace("Last updated ", "");
      const actor = item.actor ? ` oleh ${item.actor}` : "";
      return `${time} - ${item.title}${actor}${item.detail ? `: ${item.detail}` : ""}`;
    }).join("\n");
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
      state.rows.flatMap((row) => [
        row.satuan_beli,
        row.satuan_stok_min,
        row.satuan_1,
        row.satuan_2,
        row.satuan_3,
        row.satuan_4,
        row.satuan_resep_1,
        row.satuan_resep_2,
        row.satuan_resep_3,
        row.satuan_resep_4
      ])
    ).sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));

    const columnByKey = DATA_COLUMNS.reduce((map, column) => {
      map.set(column.key, column);
      return map;
    }, new Map());

    const field = (key, options = {}) => {
      const column = columnByKey.get(key);
      if (!column) return "";
      const unitMatch = key.match(/_(\d)$/);
      const unitIndex = unitMatch ? unitMatch[1] : "";
      const className = [
        "medicine-field",
        `medicine-field-${key.replace(/_/g, "-")}`,
        options.className || "",
        options.wide ? "is-wide" : "",
        options.compact ? "is-compact" : "",
        unitIndex ? "unit-field" : ""
      ].filter(Boolean).join(" ");
      const unitAttr = unitIndex ? ` data-unit-index="${unitIndex}"` : "";
      const required = options.required || ["kode", "nama", "satuan_beli", "harga_beli"].includes(key) ? " *" : "";
      const addButton = options.addOption
        ? `<button class="medicine-add-option" type="button" data-add-option="${escapeHtml(key)}" aria-label="Tambah pilihan ${escapeHtml(options.label || column.label)}">+</button>`
        : "";
      const autoBadge = options.autoBadge
        ? '<button class="medicine-auto-badge" type="button" data-generate-medicine-code>AUTO</button>'
        : "";

      return `
        <label class="${className}"${unitAttr}>
          <span class="medicine-field-label">${escapeHtml(options.label || column.label)}${required}</span>
          <span class="medicine-control-wrap">
            ${renderMedicineControl(column, categoryOptions, supplierOptions, unitOptions)}
            ${autoBadge}
            ${addButton}
          </span>
        </label>
      `;
    };

    const saleIndexes = Array.from({ length: MAX_MEDICINE_UNIT_COUNT }, (_, index) => index + 1);
    const deleteSaleButton = (group, index) => `
      <button class="medicine-sale-delete" type="button" data-remove-sale-row="${escapeHtml(group)}" data-unit-index="${index}" aria-label="Hapus baris ${escapeHtml(group === "regular" ? "harga non resep" : "harga resep")} ${index}">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v5"></path>
          <path d="M14 11v5"></path>
        </svg>
      </button>
    `;
    const saleRegularRows = saleIndexes.map((index) => `
      <div class="medicine-sale-row medicine-sale-row-regular" data-unit-index="${index}">
        ${field(`isi_${index}`, { label: `Isi ${index}`, className: "medicine-sale-isi", compact: true })}
        ${field(`satuan_${index}`, { label: `Satuan Jual ${index}`, className: "medicine-sale-unit", addOption: index === 1, compact: true })}
        ${field(`harga_jual_${index}`, { label: `Harga Jual ${index}`, className: "medicine-sale-price", compact: true })}
        ${field(`laba_jual_${index}`, { label: "Laba %", className: "medicine-sale-profit", compact: true })}
        ${deleteSaleButton("regular", index)}
      </div>
    `).join("");
    const salePrescriptionRows = saleIndexes.map((index) => `
      <div class="medicine-sale-row medicine-sale-row-prescription" data-unit-index="${index}">
        ${field(`isi_resep_${index}`, { label: `Isi ${index}`, className: "medicine-sale-isi", compact: true })}
        ${field(`satuan_resep_${index}`, { label: `Satuan Jual ${index}`, className: "medicine-sale-unit", addOption: index === 1, compact: true })}
        ${field(`harga_resep_${index}`, { label: `Harga Jual ${index}`, className: "medicine-sale-prescription", compact: true })}
        ${field(`laba_resep_${index}`, { label: "Laba %", className: "medicine-sale-profit", compact: true })}
        ${deleteSaleButton("prescription", index)}
      </div>
    `).join("");
    const noteTabs = [
      ["indikasi", "Indikasi"],
      ["komposisi", "Komposisi"],
      ["no_batch", "Batch"],
      ["lokasi", "Lokasi"]
    ];
    const tabButtons = noteTabs.map(([key, label], index) => `
      <button class="${index === 0 ? "is-active" : ""}" type="button" data-medicine-tab="${key}">${label}</button>
    `).join("");
    const tabPanels = noteTabs.map(([key, label], index) => `
      <div class="medicine-info-panel ${index === 0 ? "is-active" : ""}" data-medicine-panel="${key}">
        ${field(key, { label, wide: true })}
      </div>
    `).join("");

    els.medicineFormFields.innerHTML = `
      <fieldset class="medicine-section medicine-section-barang">
        <legend><span class="medicine-section-icon" aria-hidden="true">${renderMedicineSectionIcon("barang")}</span>Informasi Barang</legend>
        <div class="medicine-section-grid">
          ${field("kode", { label: "Kode Obat", className: "medicine-code-field", autoBadge: true })}
          ${field("nama", { label: "Nama Obat", wide: true })}
          ${field("kategori", { label: "Kategori", addOption: true })}
        </div>
      </fieldset>
      <fieldset class="medicine-section medicine-section-beli">
        <legend><span class="medicine-section-icon" aria-hidden="true">${renderMedicineSectionIcon("beli")}</span>Informasi Pembelian</legend>
        <div class="medicine-section-grid">
          ${field("satuan_beli", { label: "Satuan Beli", addOption: true })}
          ${field("harga_beli", { label: "Harga Beli" })}
          <div class="medicine-stock-row">
            ${field("stok", { label: "Stok" })}
            <select class="medicine-stock-unit" id="medicine-stock-unit" aria-label="Satuan stok">
              <option value="">Box</option>
              ${unitOptions.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}
            </select>
          </div>
        </div>
      </fieldset>
      <fieldset class="medicine-section medicine-section-keterangan">
        <legend><span class="medicine-section-icon" aria-hidden="true">${renderMedicineSectionIcon("keterangan")}</span>Keterangan</legend>
        <div class="medicine-section-grid">
          ${field("suplier", { label: "Supplier", addOption: true })}
          ${field("pabrik", { label: "Pabrik" })}
          <div class="medicine-min-stock-row">
            ${field("stok_min", { label: "Stok Minimum" })}
            ${field("satuan_stok_min", { label: "Satuan" })}
          </div>
          ${field("expired", { label: "Expired" })}
        </div>
        <div class="medicine-info-tabs">${tabButtons}</div>
        <div class="medicine-info-panels">${tabPanels}</div>
      </fieldset>
      <fieldset class="medicine-section medicine-section-jual">
        <legend><span class="medicine-section-icon" aria-hidden="true">${renderMedicineSectionIcon("jual")}</span>Informasi Penjualan</legend>
        <div class="medicine-sale-block medicine-sale-block-regular">
          <h4>Harga Non Resep</h4>
          <div class="medicine-price-head medicine-price-head-regular" aria-hidden="true">
            <span>Isi</span>
            <span>Satuan Jual</span>
            <span>Harga Jual</span>
            <span>Laba %</span>
            <span></span>
          </div>
          <div class="medicine-sale-grid">${saleRegularRows}</div>
        </div>
        <div class="medicine-sale-block medicine-sale-block-prescription">
          <h4>Harga Resep</h4>
          <div class="medicine-price-head medicine-price-head-prescription" aria-hidden="true">
            <span>Isi</span>
            <span>Satuan Jual</span>
            <span>Harga Jual</span>
            <span>Laba %</span>
            <span></span>
          </div>
          <div class="medicine-sale-grid">${salePrescriptionRows}</div>
        </div>
        <label class="medicine-check-row">
          <input id="medicine-copy-prescription-price" type="checkbox">
          <span>Harga resep = biasa</span>
        </label>
        <div class="medicine-sale-controls">
          <button class="filter-action medicine-add-sale-row" type="button" data-add-sale-row>Tambah Kolom</button>
          <button class="filter-action medicine-remove-sale-row" type="button" data-remove-last-sale-row>Hapus Kolom</button>
        </div>
      </fieldset>
    `;

    updateMedicineUnitVisibility();
    updateMedicineSaleHelpers();
  }

  function renderMedicineControl(column, categories, suppliers, units) {
    if (column.key === "kategori") return renderSelect(column.key, categories, "Pilih kategori", "kategori");
    if (column.key === "suplier") return renderSelect(column.key, suppliers, "Pilih supplier", "suplier");
    if (column.key === "expired") return `<input id="medicine-${column.key}" name="${column.key}" type="date">`;
    if (column.key === "satuan_beli" || column.key === "satuan_stok_min" || /^satuan_[1-4]$/.test(column.key) || /^satuan_resep_[1-4]$/.test(column.key) || /^satuan_konversi_[1-4]$/.test(column.key)) {
      return renderSelect(column.key, units, "Pilih satuan", "unit");
    }
    if (column.type === "number" || PRICE_COLUMNS.has(column.key) || QUANTITY_COLUMNS.has(column.key) || /^isi_[1-4]$/.test(column.key) || /^isi_resep_[1-4]$/.test(column.key)) {
      const placeholder = /^harga_/.test(column.key) ? "" : "";
      return `<input id="medicine-${column.key}" name="${column.key}" inputmode="decimal" type="text" placeholder="${placeholder}">`;
    }
    if (["indikasi", "komposisi"].includes(column.key)) {
      return `<textarea id="medicine-${column.key}" name="${column.key}" rows="4" placeholder="Masukkan ${escapeHtml(column.label.toLowerCase())} obat"></textarea>`;
    }
    return `<input id="medicine-${column.key}" name="${column.key}" type="text" placeholder="Masukkan ${escapeHtml(column.label.toLowerCase())}">`;
  }

  function renderSelect(key, options, placeholder, group = "") {
    return `
      <select id="medicine-${key}" name="${key}"${group ? ` data-option-group="${group}"` : ""}>
        <option value="">${escapeHtml(placeholder)}</option>
        ${options.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}
      </select>
    `;
  }

  function renderMedicineSectionIcon(type) {
    const icons = {
      barang: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7V5a5 5 0 0 1 10 0v2"></path><rect x="5" y="7" width="14" height="14" rx="3"></rect><path d="M9 12h6"></path><path d="M12 9v6"></path></svg>',
      beli: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="20" r="1"></circle><circle cx="17" cy="20" r="1"></circle><path d="M3 4h2l2.3 11.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H7"></path></svg>',
      keterangan: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"></path><path d="M14 2v5h5"></path><path d="M9 13h6"></path><path d="M9 17h4"></path></svg>',
      jual: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17 9 11l4 4 7-7"></path><path d="M14 8h6v6"></path></svg>'
    };
    return icons[type] || icons.barang;
  }

  function handleMedicineFormClick(event) {
    const tabButton = event.target.closest("[data-medicine-tab]");
    if (tabButton) {
      event.preventDefault();
      switchMedicineInfoTab(tabButton.dataset.medicineTab);
      return;
    }

    const optionButton = event.target.closest("[data-add-option]");
    if (optionButton) {
      event.preventDefault();
      addMedicineOption(optionButton.dataset.addOption);
      return;
    }

    const autoCodeButton = event.target.closest("[data-generate-medicine-code]");
    if (autoCodeButton) {
      event.preventDefault();
      fillRandomMedicineCode();
      return;
    }

    const addSaleButton = event.target.closest("[data-add-sale-row]");
    if (addSaleButton) {
      event.preventDefault();
      setUnitCount(state.unitCount + 1);
      return;
    }

    const removeLastSaleButton = event.target.closest("[data-remove-last-sale-row]");
    if (removeLastSaleButton) {
      event.preventDefault();
      clearMedicineSaleRow(state.unitCount, "regular");
      clearMedicineSaleRow(state.unitCount, "prescription");
      setUnitCount(state.unitCount - 1);
      return;
    }

    const removeSaleButton = event.target.closest("[data-remove-sale-row]");
    if (removeSaleButton) {
      event.preventDefault();
      clearMedicineSaleRow(Number(removeSaleButton.dataset.unitIndex), removeSaleButton.dataset.removeSaleRow);
    }
  }

  function handleMedicineFormChange(event) {
    if (event.target && event.target.id === "medicine-copy-prescription-price") {
      syncPrescriptionPrices();
      return;
    }

    if (event.target && event.target.id === "medicine-satuan_beli") {
      const stockUnit = document.getElementById("medicine-stock-unit");
      if (stockUnit && !stockUnit.value) stockUnit.value = event.target.value;
      const minStockUnit = document.getElementById("medicine-satuan_stok_min");
      if (minStockUnit && !minStockUnit.value) minStockUnit.value = event.target.value;
      updateMedicineSaleHelpers();
      return;
    }

    if (event.target && /^medicine-satuan_\d$/.test(event.target.id)) {
      syncPrescriptionPrices();
    }
  }

  function handleMedicineFormInput(event) {
    if (!event.target || !event.target.id) return;
    const profitMatch = event.target.id.match(/^medicine-laba_(jual|resep)_(\d)$/);
    if (profitMatch) {
      updateMedicinePriceFromProfit(profitMatch[1], Number(profitMatch[2]));
      if (profitMatch[1] === "jual") syncPrescriptionPrices();
      return;
    }
    const priceMatch = event.target.id.match(/^medicine-harga_(jual|resep)_(\d)$/);
    if (priceMatch) {
      updateMedicineProfitForType(priceMatch[1], Number(priceMatch[2]));
      if (priceMatch[1] === "jual") syncPrescriptionPrices();
      return;
    }
    if (event.target.id === "medicine-harga_beli" || /^medicine-isi(?:_resep)?_\d$/.test(event.target.id)) {
      updateMedicineSaleHelpers();
      if (/^medicine-isi_\d$/.test(event.target.id)) syncPrescriptionPrices();
    }
  }

  function switchMedicineInfoTab(key) {
    if (!els.medicineFormFields) return;
    els.medicineFormFields.querySelectorAll("[data-medicine-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.medicineTab === key);
    });
    els.medicineFormFields.querySelectorAll("[data-medicine-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.medicinePanel === key);
    });
  }

  function addMedicineOption(key) {
    const select = document.getElementById(`medicine-${key}`);
    if (!select) return;
    const label = select.closest(".medicine-field")?.querySelector(".medicine-field-label")?.textContent?.replace("*", "").trim() || "Pilihan";
    const value = window.prompt(`Masukkan ${label} baru:`);
    const clean = String(value || "").trim();
    if (!clean) return;

    const group = select.dataset.optionGroup || "";
    const targets = group
      ? Array.from(els.medicineFormFields.querySelectorAll(`select[data-option-group="${group}"]`))
      : [select];

    targets.forEach((target) => {
      const exists = Array.from(target.options).some((option) => option.value.toLowerCase() === clean.toLowerCase());
      if (!exists) target.add(new Option(clean, clean));
    });
    select.value = clean;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function clearMedicineSaleRow(index, group) {
    if (!index) return;
    const keys = group === "prescription"
      ? [`isi_resep_${index}`, `satuan_resep_${index}`, `harga_resep_${index}`, `laba_resep_${index}`]
      : [`isi_${index}`, `satuan_${index}`, `harga_jual_${index}`, `laba_jual_${index}`, `stok_konversi_${index}`, `satuan_konversi_${index}`];

    keys.forEach((key) => {
      const control = document.getElementById(`medicine-${key}`);
      if (!control) return;
      control.value = "";
      delete control.dataset.userEdited;
    });

    if (group !== "prescription") syncPrescriptionPrices();
    updateMedicineSaleHelpers();
  }

  function syncPrescriptionPrices() {
    const copy = document.getElementById("medicine-copy-prescription-price");
    if (!copy || !copy.checked) return;
    Array.from({ length: MAX_MEDICINE_UNIT_COUNT }, (_, index) => index + 1).forEach((index) => {
      const saleIsi = document.getElementById(`medicine-isi_${index}`);
      const prescriptionIsi = document.getElementById(`medicine-isi_resep_${index}`);
      const saleUnit = document.getElementById(`medicine-satuan_${index}`);
      const prescriptionUnit = document.getElementById(`medicine-satuan_resep_${index}`);
      const sale = document.getElementById(`medicine-harga_jual_${index}`);
      const prescription = document.getElementById(`medicine-harga_resep_${index}`);
      const saleProfit = document.getElementById(`medicine-laba_jual_${index}`);
      const prescriptionProfit = document.getElementById(`medicine-laba_resep_${index}`);
      if (saleIsi && prescriptionIsi) prescriptionIsi.value = saleIsi.value;
      if (saleUnit && prescriptionUnit) prescriptionUnit.value = saleUnit.value;
      if (sale && prescription) prescription.value = sale.value;
      if (saleProfit && prescriptionProfit) prescriptionProfit.value = saleProfit.value;
    });
    updateMedicineSaleHelpers();
  }

  function updateMedicineSaleHelpers() {
    Array.from({ length: MAX_MEDICINE_UNIT_COUNT }, (_, index) => index + 1).forEach((index) => {
      updateMedicineProfitForType("jual", index);
      updateMedicineProfitForType("resep", index);
    });
  }

  function getMedicineSaleBasePrice(type, index) {
    const buyPrice = parseMedicineNumber(document.getElementById("medicine-harga_beli")?.value);
    if (!buyPrice) return 0;

    const isiKey = type === "resep" ? `isi_resep_${index}` : `isi_${index}`;
    const fallbackIsiKey = `isi_${index}`;
    const isi = parseMedicineNumber(document.getElementById(`medicine-${isiKey}`)?.value) ||
      parseMedicineNumber(document.getElementById(`medicine-${fallbackIsiKey}`)?.value) ||
      1;

    return isi > 0 ? buyPrice / isi : buyPrice;
  }

  function updateMedicineProfitForType(type, index) {
    const priceKey = type === "resep" ? `harga_resep_${index}` : `harga_jual_${index}`;
    const profitKey = type === "resep" ? `laba_resep_${index}` : `laba_jual_${index}`;
    const price = parseMedicineNumber(document.getElementById(`medicine-${priceKey}`)?.value);
    const profit = document.getElementById(`medicine-${profitKey}`);
    const basePrice = getMedicineSaleBasePrice(type, index);

    if (!profit) return;
    if (!basePrice || !price) {
      profit.value = "";
      return;
    }
    profit.value = (((price - basePrice) / basePrice) * 100).toFixed(1);
  }

  function updateMedicinePriceFromProfit(type, index) {
    const priceKey = type === "resep" ? `harga_resep_${index}` : `harga_jual_${index}`;
    const profitKey = type === "resep" ? `laba_resep_${index}` : `laba_jual_${index}`;
    const price = document.getElementById(`medicine-${priceKey}`);
    const profitControl = document.getElementById(`medicine-${profitKey}`);
    const rawProfit = String(profitControl?.value || "").trim();
    const profit = parseMedicineNumber(rawProfit);
    const basePrice = getMedicineSaleBasePrice(type, index);

    if (!price || !basePrice) return;
    price.value = rawProfit
      ? formatIntegerPrice(String(Math.round(basePrice * (1 + (profit / 100)))))
      : "";
  }

  function parseMedicineNumber(value) {
    const text = String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const number = Number(text);
    return Number.isFinite(number) ? number : 0;
  }

  function fillRandomMedicineCode() {
    const codeInput = document.getElementById("medicine-kode");
    if (!codeInput) return;
    codeInput.value = getRandomMedicineCode();
    codeInput.focus();
  }

  function getRandomMedicineCode() {
    const used = new Set(state.rows.map((row) => normalizeSearch(row.kode || row.barcode || "")));
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const number = Math.floor(Math.random() * 10000);
      const code = `OB${String(number).padStart(4, "0")}`;
      if (!used.has(normalizeSearch(code))) return code;
    }
    return `OB${String(Date.now()).slice(-4)}`;
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
      if (/^laba_(jual|resep)_\d$/.test(column.key) && control.value) {
        control.dataset.userEdited = "true";
      }
    });

    const stockUnit = document.getElementById("medicine-stock-unit");
    const buyUnit = document.getElementById("medicine-satuan_beli");
    if (stockUnit && buyUnit) stockUnit.value = buyUnit.value || "";
    const minStockUnit = document.getElementById("medicine-satuan_stok_min");
    if (minStockUnit && buyUnit && !minStockUnit.value) minStockUnit.value = buyUnit.value || "";

    const copyPrescription = document.getElementById("medicine-copy-prescription-price");
    if (copyPrescription) {
      if (!row) {
        copyPrescription.checked = false;
      } else {
        const hasDifferentPrescription = Array.from({ length: MAX_MEDICINE_UNIT_COUNT }, (_, index) => index + 1).some((unitIndex) => {
          const sale = String(row?.[`harga_jual_${unitIndex}`] || "").trim();
          const prescription = String(row?.[`harga_resep_${unitIndex}`] || "").trim();
          const saleIsi = String(row?.[`isi_${unitIndex}`] || "").trim();
          const prescriptionIsi = String(row?.[`isi_resep_${unitIndex}`] || "").trim();
          const saleUnit = String(row?.[`satuan_${unitIndex}`] || "").trim();
          const prescriptionUnit = String(row?.[`satuan_resep_${unitIndex}`] || "").trim();
          return (
            sale && prescription && normalizePriceValue(sale, `harga_jual_${unitIndex}`) !== normalizePriceValue(prescription, `harga_resep_${unitIndex}`)
          ) || (
            prescriptionIsi && saleIsi !== prescriptionIsi
          ) || (
            prescriptionUnit && saleUnit !== prescriptionUnit
          );
        });
        copyPrescription.checked = !hasDifferentPrescription;
      }
    }

    updateMedicineUnitVisibility();
    updateMedicineSaleHelpers();
    showModal(els.medicineModal);
  }

  function closeMedicineModal() {
    hideModal(els.medicineModal);
  }

  function setUnitCount(nextCount) {
    state.unitCount = Math.min(MAX_MEDICINE_UNIT_COUNT, Math.max(1, Number(nextCount) || 1));
    updateMedicineUnitVisibility();
    updateMedicineSaleHelpers();
  }

  function getInitialUnitCount(row) {
    if (!row) return DEFAULT_MEDICINE_UNIT_COUNT;
    for (let index = MAX_MEDICINE_UNIT_COUNT; index >= 1; index -= 1) {
      if (String(row[`satuan_${index}`] || row[`isi_${index}`] || row[`harga_jual_${index}`] || row[`isi_resep_${index}`] || row[`satuan_resep_${index}`] || row[`harga_resep_${index}`] || "").trim()) {
        return index;
      }
    }
    return DEFAULT_MEDICINE_UNIT_COUNT;
  }

  function updateMedicineUnitVisibility() {
    if (!els.medicineFormFields) return;
    els.medicineFormFields.querySelectorAll("[data-unit-index]").forEach((field) => {
      const index = Number(field.dataset.unitIndex);
      field.classList.toggle("is-hidden", index > state.unitCount);
    });
    const addButton = els.medicineFormFields.querySelector("[data-add-sale-row]");
    const removeButton = els.medicineFormFields.querySelector("[data-remove-last-sale-row]");
    if (addButton) {
      addButton.hidden = state.unitCount >= MAX_MEDICINE_UNIT_COUNT;
      addButton.disabled = state.unitCount >= MAX_MEDICINE_UNIT_COUNT;
    }
    if (removeButton) {
      removeButton.hidden = state.unitCount <= 1;
      removeButton.disabled = state.unitCount <= 1;
    }
  }

  async function saveMedicine(event) {
    event.preventDefault();
    syncPrescriptionPrices();
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
      addProfileActivity(mode === "add" ? "Tambah data obat" : "Edit data obat", `${row.kode || "-"} - ${row.nama || "Obat"}`);
      await fetchDataObat({ manual: true });
      closeMedicineModal();
      showActionToast(mode === "add" ? "Data obat berhasil ditambahkan." : "Data obat berhasil diubah.");
    } catch (error) {
      setMedicineStatus(`${error.message} Pastikan kode Apps Script terbaru sudah ditempel dan di-deploy.`, "error");
    }
  }

  function collectMedicineForm() {
    const originalRow = state.editingMedicine?.row || {};
    return DATA_COLUMNS.reduce((acc, column) => {
      const control = document.getElementById(`medicine-${column.key}`);
      const unitMatch = column.key.match(/_(\d)$/);
      if (unitMatch && Number(unitMatch[1]) > MAX_MEDICINE_UNIT_COUNT) {
        acc[column.key] = originalRow[column.key] || "";
        return acc;
      }
      acc[column.key] = unitMatch && Number(unitMatch[1]) > state.unitCount
        ? ""
        : control ? control.value.trim() : (originalRow[column.key] || "");
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
        addProfileActivity("Hapus data obat", `${row.kode || "-"} - ${row.nama || "Obat"}`);
        closeDeleteModal();
        await fetchDataObat({ manual: true });
        showActionToast("Data obat berhasil dihapus.");
      } catch (error) {
        if (els.deleteModalText) els.deleteModalText.textContent = `${error.message} Pastikan kode Apps Script terbaru sudah ditempel dan di-deploy.`;
      }
      return;
    }

    if (type === "user") {
      const record = state.users[index] || {};
      try {
        const result = await postToApi({ action: "deleteLoginUser", username: record.username || record.name, email: record.email || "" });
        if (!result || (result.success !== true && result.ok !== true)) throw new Error(result?.message || "Apps Script belum menerima hapus operator.");
        deleteLocalRecord(type, index);
        closeDeleteModal();
        showActionToast("Data pengguna berhasil dihapus.");
      } catch (error) {
        if (els.deleteModalText) els.deleteModalText.textContent = `${error.message} Pastikan Apps Script terbaru sudah di-deploy.`;
      }
      return;
    }

    if (type === "payroll") {
      const record = state.payrollEmployees[index] || {};
      try {
        if (!state.payrollEndpointReady) throw new Error("Endpoint data gaji belum aktif.");
        const result = await postToAbsensiApi({
          action: "deletePayrollEmployee",
          role: getCurrentUserRecord().role || "",
          username: getCurrentUserRecord().username || "",
          originalNip: record.nip || "",
          originalName: record.name || ""
        });
        if (!result || (result.success !== true && result.ok !== true)) throw new Error(result?.message || "Data gaji belum terhapus online.");
        closeDeleteModal();
        await fetchPayrollEmployees({ manual: true });
        showActionToast("Data gaji berhasil dihapus.");
      } catch (error) {
        if (els.deleteModalText) els.deleteModalText.textContent = `${error.message} Pastikan Apps Script absensi terbaru sudah ditempel dan di-deploy.`;
      }
      return;
    }

    if (isRemoteLocalRecordType(type)) {
      const record = getLocalArray(type)[index] || {};
      try {
        const result = await postToApi({
          action: "deleteLocalRecord",
          type,
          name: record.name || "",
          email: record.email || "",
          phone: record.phone || "",
          pic: record.pic || ""
        });
        if (!result || (result.success !== true && result.ok !== true)) throw new Error(result?.message || "Data belum terhapus online.");
        deleteLocalRecord(type, index);
        closeDeleteModal();
        await fetchLocalRecords({ silent: true });
        showActionToast(`Data ${type === "employee" ? "karyawan" : "supplier"} berhasil dihapus.`);
      } catch (error) {
        if (els.deleteModalText) els.deleteModalText.textContent = `${error.message} Pastikan Apps Script terbaru sudah ditempel dan di-deploy.`;
      }
      return;
    }

    deleteLocalRecord(type, index);
    closeDeleteModal();
  }

  function loadStoredModules() {
    resetLegacyRestockRequests();
    state.employees = readStoredArray(EMPLOYEE_KEY);
    state.suppliers = readStoredArray(SUPPLIER_KEY);
    state.users = readStoredArray(USER_KEY).map(normalizeUserRecord);
    state.purchaseOrders = readStoredArray(PO_KEY);
    state.restockRequests = readStoredArray(RESTOCK_KEY).map(normalizeRestockRequest).filter((item) => item.id);
    renderEmployees();
    renderSuppliers();
    renderUsers();
    renderPurchaseOrders();
    renderRestockPage();
    renderReportsFromCache();
    applyCurrentUserAccess();
  }

  function resetLegacyRestockRequests() {
    const version = localStorage.getItem(RESTOCK_RESET_KEY);
    if (version === RESTOCK_RESET_VERSION) return;
    localStorage.removeItem(RESTOCK_KEY);
    localStorage.setItem(RESTOCK_RESET_KEY, RESTOCK_RESET_VERSION);
  }

  function syncEmployeeSeed() {
    const existing = readStoredArray(EMPLOYEE_KEY).map(normalizeEmployeeRecord);
    const byKey = new Map();

    existing.forEach((employee) => {
      const key = normalizeSearch(employee.email || employee.name || employee.phone);
      if (key) byKey.set(key, employee);
    });

    state.users.forEach((user) => {
      const employee = normalizeEmployeeRecord({
        name: user.name || user.username,
        phone: user.phone,
        address: user.address,
        job: user.role || "",
        email: user.email || ""
      });
      const keys = [employee.email, employee.name, employee.phone].map(normalizeSearch).filter(Boolean);
      const existingKey = keys.find((key) => byKey.has(key));
      const targetKey = existingKey || keys[0];
      if (!targetKey) return;

      byKey.set(targetKey, {
        ...(byKey.get(targetKey) || {}),
        ...employee
      });
    });

    state.employees = Array.from(byKey.values()).filter((item) => item.name || item.email || item.phone);
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
      if (key) byUsername.set(key, normalizeUserRecord(user));
    });

    state.users = Array.from(byUsername.values()).map(normalizeUserRecord);
    writeStoredArray(USER_KEY, state.users);
    renderUserRoleOptions();
  }

  function upsertUserRecord(record, previousRecord = {}) {
    const nextRecord = normalizeUserRecord(record);
    const matchKeys = [
      nextRecord.username,
      nextRecord.email,
      nextRecord.name,
      previousRecord.username,
      previousRecord.email,
      previousRecord.name
    ].map(normalizeSearch).filter(Boolean);
    const targetIndex = state.users.findIndex((user) => {
      return [user.username, user.email, user.name]
        .map(normalizeSearch)
        .filter(Boolean)
        .some((key) => matchKeys.includes(key));
    });

    if (targetIndex >= 0) {
      state.users[targetIndex] = { ...state.users[targetIndex], ...nextRecord };
    } else {
      state.users.push(nextRecord);
    }

    writeStoredArray(USER_KEY, state.users);
    renderUserRoleOptions();

    return nextRecord;
  }

  function normalizeUserRecord(user) {
    const role = isAyuNovaliaUser(user)
      ? "Asisten Apoteker"
      : (String(user?.role || "Operator").trim() || "Operator");
    return {
      name: String(user?.name || user?.username || "").trim(),
      username: String(user?.username || user?.name || "").trim(),
      role,
      status: String(user?.status || "Aktif").trim() || "Aktif",
      email: String(user?.email || "").trim(),
      phone: normalizePhoneNumber(user?.phone || user?.noHp || ""),
      address: String(user?.address || user?.alamat || "").trim(),
      photo: String(user?.photo || user?.profilePhoto || "").trim(),
      access: normalizeAccessList(user?.access || user?.menu, role),
      preferences: normalizeProfilePreferences(user?.preferences || user?.profilePreferences || user?.profile_preferences)
    };
  }

  function normalizeEmployeeRecord(record) {
    return {
      name: String(record?.name || record?.nama || record?.nama_lengkap || "").trim(),
      phone: normalizePhoneNumber(record?.phone || record?.noHp || record?.no_hp || record?.telepon || ""),
      address: String(record?.address || record?.alamat || "").trim(),
      job: String(record?.job || record?.jabatan || record?.role || "").trim(),
      email: String(record?.email || record?.gmail || "").trim()
    };
  }

  function normalizeSupplierRecord(record) {
    return {
      name: String(record?.name || record?.supplier || record?.suplier || record?.nama || record?.nama_supplier || "").trim(),
      address: String(record?.address || record?.alamat || "").trim(),
      phone: normalizePhoneNumber(record?.phone || record?.noHp || record?.no_hp || record?.telepon || ""),
      pic: String(record?.pic || record?.sales || record?.cp || record?.kontak || "").trim()
    };
  }

  function isAyuNovaliaUser(user) {
    const identity = normalizeSearch(`${user?.name || ""} ${user?.username || ""} ${user?.email || ""}`);
    return identity.includes("ayu novalia");
  }

  function normalizeProfilePreferences(value) {
    if (value === undefined || value === null || value === "") return {};
    let prefs = value;
    if (typeof prefs === "string") {
      try {
        prefs = prefs.trim() ? JSON.parse(prefs) : {};
      } catch (error) {
        prefs = {};
      }
    }
    prefs = prefs && typeof prefs === "object" ? prefs : {};
    if (!Object.keys(prefs).length) return {};
    return {
      theme: prefs.theme === "dark" ? "dark" : "light",
      compact: prefs.compact === true || prefs.compact === "true",
      startDashboard: prefs.startDashboard === false || prefs.startDashboard === "false" ? false : true,
      updatedAt: String(prefs.updatedAt || "")
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
    const result = normalized.length ? normalized : getDefaultAccessForRole(role);
    return normalizeSearch(role) === "owner"
      ? result
      : result.filter((item) => item !== "akses_semua_data");
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
        phone: normalizePhoneNumber(session.phone || ""),
        address: session.address || "",
        photo: session.profilePhoto || session.photo || "",
        access: session.menu || ""
      });
    }

    const sessionRole = String(session.role || "").trim();
    const role = found.role || sessionRole || "Operator";
    const sessionMenu = session.menu || "";

    return normalizeUserRecord({
      ...found,
      name: found.name || session.name || session.username || "Akun",
      username: found.username || session.username || "",
      role,
      email: found.email || session.email || "",
      access: found.access && found.access.length
        ? found.access
        : (sessionMenu || getDefaultAccessForRole(role))
    });
  }

  function canAccess(key) {
    const user = getCurrentUserRecord();
    if (isOwnerUser(user)) return true;
    return user.access.includes(key);
  }

  function applyCurrentUserAccess() {
    const user = getCurrentUserRecord();
    const access = new Set(user.access);
    if (isOwnerUser(user)) {
      ACCESS_MENUS.forEach((item) => access.add(item.key));
    }

    document.querySelectorAll("[data-access-key]").forEach((element) => {
      const allowed = access.has(element.dataset.accessKey);
      element.hidden = !allowed;
      element.toggleAttribute("aria-disabled", !allowed);
    });

    if (els.filterButton) {
      els.filterButton.hidden = !access.has("filter_data_obat");
      if (!access.has("filter_data_obat") && els.filterPanel) els.filterPanel.hidden = true;
    }
    if (els.addMedicineButton) els.addMedicineButton.hidden = !access.has("edit_obat");
    renderTableBody();
    renderAttendanceDashboard();
    renderRestockPage();

    if (state.activeView && !canView(state.activeView, access)) {
      const firstAllowed = ACCESS_MENUS.find((item) => access.has(item.key)) || ACCESS_MENUS[0];
      switchView(access.has("dashboard") ? "dashboard" : accessKeyToView(firstAllowed.key));
    }
  }

  function canView(viewName, access) {
    if (viewName === "home") return true;
    if (!access) {
      const user = getCurrentUserRecord();
      access = new Set(user.access || []);
      if (isOwnerUser(user)) ACCESS_MENUS.forEach((item) => access.add(item.key));
    }
    const map = {
      dashboard: "dashboard",
      presensi: "presensi",
      "cari-data-obat": "cari_data_obat",
      "data-obat": "data_obat",
      "data-karyawan": "data_karyawan",
      "data-supplier": "data_supplier",
      "restok-obat": "restok_obat",
      "surat-pesanan": "surat_pesanan",
      "import-data-obat": "import_data_obat",
      "akun-profil": "akun_profil",
      "manajemen-pengguna": "manajemen_pengguna"
    };
    return access.has(map[viewName] || viewName);
  }

  function accessKeyToView(key) {
    const map = {
      presensi: "presensi",
      cari_data_obat: "cari-data-obat",
      data_obat: "data-obat",
      data_karyawan: "data-karyawan",
      data_supplier: "data-supplier",
      restok_obat: "restok-obat",
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
    return role === "admin" || role === "administrator" || role === "owner" || username === "admin" || username === "owner";
  }

  function isOwnerUser(user) {
    const role = normalizeSearch(user?.role);
    const username = normalizeSearch(user?.username || user?.name || "");
    return role === "owner" || username === "owner";
  }

  function canManageAttendanceShift(user) {
    const role = normalizeSearch(user?.role);
    const username = normalizeSearch(user?.username || user?.name || "");
    return role === "owner" || role === "admin" || role === "administrator" || username === "owner" || username === "admin";
  }

  function renderEmployees() {
    renderSimpleRows(els.employeeTableBody, state.employees, "employee", ["name"]);
  }

  function renderSuppliers() {
    renderSimpleRows(els.supplierTableBody, state.suppliers, "supplier", ["name"]);
  }

  function renderSimpleRows(tbody, rows, type, keys) {
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = `<tr><td class="empty-table-cell" colspan="${keys.length + 1}">Belum ada data.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((row, index) => {
      const nameKey = keys[0] || "name";
      const label = formatCell(row[nameKey]);
      return `
      <tr>
        <td>
          <button class="simple-name-button" type="button" data-local-action="edit" data-type="${type}" data-index="${index}">
            ${escapeHtml(label)}
          </button>
        </td>
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
    `;
    }).join("");
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
    if (isOwnerUser(user)) return "Semua akses";
    const list = normalizeAccessList(user?.access, user?.role || "Operator");
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
    const userRole = type === "user" ? String(record.role || "Operator").trim() || "Operator" : "";

    els.recordModalTitle.textContent = `${index >= 0 ? "Edit" : "Tambah"} ${schema.title}`;
    els.recordModalStatus.textContent = "Lengkapi field yang tersedia.";
    els.recordModalStatus.dataset.type = "info";
    els.recordFormFields.innerHTML = schema.fields.map((field) => {
      const value = field.type === "access"
        ? getInitialAccessValue(record, userRole)
        : (field.key === "role" && type === "user" ? userRole : record[field.key] || "");
      if (field.type === "access") {
        return `
          <div class="span-2 record-access-field">
            <span>${escapeHtml(field.label)}</span>
            ${renderRecordControl(field, value, userRole)}
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

  function getInitialAccessValue(record, role) {
    const username = normalizeSearch(record.username || record.name || "");
    const roleKey = normalizeSearch(role);

    if (username === "owner" || roleKey === "owner") {
      return ACCESS_MENUS.map((item) => item.key);
    }

    return Array.isArray(record.access) && record.access.length
      ? record.access
      : getDefaultAccessForRole(role);
  }

  function renderRecordControl(field, value, role = "Operator") {
    if (field.type === "access") {
      const selected = new Set(normalizeAccessList(value, role));
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

    const inputType = field.key === "phone" ? "tel" : (field.type || "text");
    const inputMode = field.key === "phone" ? ' inputmode="tel" autocomplete="tel"' : "";
    return `<input name="${escapeHtml(field.key)}" type="${escapeHtml(inputType)}" value="${escapeHtml(value)}"${inputMode} ${field.required ? "required" : ""}>`;
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

  async function saveRecord(event) {
    event.preventDefault();
    const schema = LOCAL_SCHEMAS[state.recordType];
    if (!schema) return;

    const formData = new FormData(els.recordForm);
    let record = {};
    schema.fields.forEach((field) => {
      if (field.type === "access") {
        record[field.key] = formData.getAll(field.key).map((value) => String(value || "").trim()).filter(Boolean);
        return;
      }
      record[field.key] = field.key === "phone"
        ? normalizePhoneNumber(formData.get(field.key))
        : String(formData.get(field.key) || "").trim();
    });

    if (state.recordType === "user") {
      const roleKey = normalizeSearch(record.role || "");
      record.access = roleKey === "owner"
        ? ACCESS_MENUS.map((item) => item.key)
        : normalizeAccessList(record.access, record.role).filter((key) => key !== "akses_semua_data");
      Object.assign(record, normalizeUserRecord(record));
    }

    const target = getLocalArray(state.recordType);
    const isEdit = state.recordIndex >= 0;
    const previousRecord = isEdit ? target[state.recordIndex] || {} : {};

    if (state.recordType === "user") {
      if (els.recordModalStatus) {
        els.recordModalStatus.textContent = "Menyimpan hak akses...";
        els.recordModalStatus.dataset.type = "info";
      }

      const loadingToken = startAppLoading("Menyimpan akses pengguna...", 0);

      try {
        await delay(50);
        const result = await postToApi({
          action: "saveLoginUser",
          user: record,
          originalUsername: previousRecord.username || "",
          originalEmail: previousRecord.email || ""
        });

        if (!result || (result.success !== true && result.ok !== true)) {
          throw new Error(result?.message || "Hak akses belum tersimpan ke Google Sheet.");
        }

        record = normalizeUserRecord(result.user || record);
        upsertUserRecord(record, previousRecord);
        await fetchUsers({ silent: true, force: true });
      } catch (error) {
        if (els.recordModalStatus) {
          els.recordModalStatus.textContent = `${error.message} Pastikan Apps Script terbaru sudah di-deploy.`;
          els.recordModalStatus.dataset.type = "error";
        }
        return;
      } finally {
        endAppLoading(loadingToken);
      }
    }

    if (isRemoteLocalRecordType(state.recordType)) {
      if (els.recordModalStatus) {
        els.recordModalStatus.textContent = `Menyimpan ${schema.title.toLowerCase()} ke Google Sheet...`;
        els.recordModalStatus.dataset.type = "info";
      }

      const loadingToken = startAppLoading(`Menyimpan ${schema.title.toLowerCase()}...`, 0);

      try {
        record = await saveRemoteLocalRecord(state.recordType, record, previousRecord);
        if (isEdit) {
          target[state.recordIndex] = record;
        } else {
          target.push(record);
        }
        persistLocalArray(state.recordType, target);
        await fetchLocalRecords({ silent: true });
      } catch (error) {
        if (els.recordModalStatus) {
          els.recordModalStatus.textContent = `${error.message} Pastikan Apps Script terbaru sudah ditempel dan di-deploy.`;
          els.recordModalStatus.dataset.type = "error";
        }
        return;
      } finally {
        endAppLoading(loadingToken);
      }
    } else if (state.recordType !== "user") {
      if (isEdit) {
        target[state.recordIndex] = record;
      } else {
        target.push(record);
      }

      persistLocalArray(state.recordType, target);
    }

    addProfileActivity(isEdit ? `Edit ${schema.title}` : `Tambah ${schema.title}`, record.name || record.username || schema.title);
    closeRecordModal();
    renderEmployees();
    renderSuppliers();
    renderUserRoleOptions();
    renderUsers();
    applyCurrentUserAccess();
    populateMedicineOptions();
    showActionToast(`${schema.title} berhasil ${isEdit ? "diubah" : "disimpan"}.`);
  }

  function isRemoteLocalRecordType(type) {
    return type === "employee" || type === "supplier";
  }

  async function saveRemoteLocalRecord(type, record, previousRecord = {}) {
    const result = await postToApi({
      action: "saveLocalRecord",
      type,
      record,
      originalName: previousRecord.name || "",
      originalEmail: previousRecord.email || "",
      originalPhone: previousRecord.phone || ""
    });

    if (!result || (result.success !== true && result.ok !== true)) {
      throw new Error(result?.message || "Data belum tersimpan online.");
    }

    return type === "employee"
      ? normalizeEmployeeRecord(result.record || record)
      : normalizeSupplierRecord(result.record || record);
  }

  function deleteLocalRecord(type, index) {
    const target = getLocalArray(type);
    const deleted = target[index] || {};
    target.splice(index, 1);
    persistLocalArray(type, target);
    const schema = LOCAL_SCHEMAS[type];
    addProfileActivity(`Hapus ${schema?.title || "Data"}`, deleted.name || deleted.username || "Data lokal");
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
    addProfileActivity("Surat pesanan dibuat", `${order.number} - ${formatNumber(order.items.length)} item`);
    renderPurchaseItems();
    renderPurchaseOrders();
    showActionToast("Surat pesanan berhasil disimpan.");
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

  function normalizeRestockRequest(item = {}) {
    const medicine = findMedicineForRestock(item.medicineName || item.nama || item.name || item.kode || item.code);
    const createdAt = normalizeTimestamp(item.createdAt || item.date || new Date().toISOString()) || new Date().toISOString();
    const updatedAt = normalizeTimestamp(item.updatedAt || createdAt) || createdAt;
    const unit = String(item.unit || item.requestUnit || item.satuan || medicine?.satuan_beli || medicine?.satuan_1 || "Pcs").trim() || "Pcs";
    return {
      id: String(item.id || `RST-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
      code: String(item.code || item.kode || medicine?.kode || "").trim(),
      medicineName: String(item.medicineName || item.nama || item.name || medicine?.nama || "").trim(),
      currentStock: String(item.currentStock || item.stok || medicine?.stok || "0").trim(),
      stockUnit: String(item.stockUnit || item.currentStockUnit || item.satuanStok || inferRestockStockUnit(medicine) || unit).trim() || unit,
      unit,
      qty: Math.max(1, Number(item.qty || item.requestQty || item.quantity || item.permintaan || 1) || 1),
      priority: ["urgent", "important", "normal"].includes(item.priority) ? item.priority : "normal",
      status: ["pending", "processing", "done", "rejected"].includes(item.status) ? item.status : "pending",
      reporter: String(item.reporter || item.pelapor || getCurrentUserRecord().name || "Operator").trim(),
      reporterKey: String(item.reporterKey || item.username || getCurrentUserRecord().username || getCurrentUserRecord().email || "").trim(),
      note: String(item.note || item.catatan || "").trim(),
      photo: String(item.photo || item.foto || "").trim(),
      supplier: String(item.supplier || medicine?.suplier || "").trim(),
      createdAt,
      updatedAt,
      history: Array.isArray(item.history) ? item.history : []
    };
  }

  function seedRestockRequestsFromStock() {
    return;
  }

  function persistRestockRequests(options = {}) {
    writeStoredArray(RESTOCK_KEY, state.restockRequests);
    updateNotificationState();
    if (options.remote !== false) scheduleRestockSync();
  }

  function scheduleRestockSync() {
    window.clearTimeout(state.restockSyncTimer);
    state.restockSyncTimer = window.setTimeout(() => {
      saveRestockRequestsToBackend({ silent: true });
    }, 650);
  }

  async function fetchRestockRequests(options = {}) {
    try {
      const payload = await postToApi({ action: "listRestockRequests" });
      if (!payload || (payload.success !== true && payload.ok !== true) || !Array.isArray(payload.requests)) {
        throw new Error(payload?.message || "Endpoint restok online belum aktif.");
      }
      state.restockRequests = payload.requests.map(normalizeRestockRequest).filter((item) => item.id);
      persistRestockRequests({ remote: false });
      renderRestockPage();
    } catch (error) {
      if (!options.silent) setRestockPageMessage(`${error.message} Pastikan Apps Script terbaru sudah di-deploy.`, "error");
    }
  }

  async function saveRestockRequestsToBackend(options = {}) {
    window.clearTimeout(state.restockSyncTimer);
    const user = getCurrentUserRecord();
    try {
      const payload = await postToApi({
        action: "saveRestockRequests",
        requests: state.restockRequests,
        role: user.role || "",
        username: user.username || "",
        email: user.email || ""
      });
      if (!payload || (payload.success !== true && payload.ok !== true)) {
        throw new Error(payload?.message || "Data restok belum tersimpan online.");
      }
      return payload;
    } catch (error) {
      if (!options.silent) setRestockPageMessage(`${error.message} Pastikan Apps Script terbaru sudah di-deploy.`, "error");
      return null;
    }
  }

  function populateRestockMedicineOptions() {
    populateRestockUnitOptions();
    renderRestockMedicineResults();
  }

  function populateRestockUnitOptions(selected = "") {
    if (!els.restockUnitSelect) return;
    const units = unique(state.rows.flatMap((row) => [
      row.satuan_beli,
      row.satuan_1,
      row.satuan_2,
      row.satuan_3,
      row.satuan_stok_min
    ])).filter(Boolean);
    const values = units.length ? units : ["Box", "Strip", "Tablet", "Botol", "Pcs"];
    const current = selected || els.restockUnitSelect.value || values[0] || "Pcs";
    els.restockUnitSelect.innerHTML = values.map((unit) => `<option value="${escapeHtml(unit)}">${escapeHtml(unit)}</option>`).join("");
    els.restockUnitSelect.value = values.includes(current) ? current : values[0];
  }

  function inferRestockUnit(row) {
    return String(row?.satuan_beli || row?.satuan_1 || row?.satuan_stok_min || "Pcs").trim() || "Pcs";
  }

  function inferRestockStockUnit(row) {
    return String(row?.satuan_stok_min || row?.satuan_1 || row?.satuan_beli || "Pcs").trim() || "Pcs";
  }

  function getRestockMedicineKey(row) {
    return normalizeSearch([row?.kode, row?.nama].filter(Boolean).join("|"));
  }

  function findMedicineForRestock(value) {
    const key = normalizeSearch(value);
    if (!key) return null;
    return state.rows.find((row) => {
      return [row.nama, row.kode, `${row.kode} ${row.nama}`].some((item) => normalizeSearch(item) === key);
    }) || state.rows.find((row) => normalizeSearch(row.nama).includes(key) || normalizeSearch(row.kode).includes(key)) || null;
  }

  function getSelectedRestockMedicine() {
    if (!state.restockSelectedMedicineKey) return null;
    return state.rows.find((row) => getRestockMedicineKey(row) === state.restockSelectedMedicineKey) || null;
  }

  function getRestockMedicineSearchResults(query = els.restockMedicineInput?.value || "") {
    const key = normalizeSearch(query);
    if (!key) return [];
    const terms = key.split(/\s+/).filter(Boolean);
    return state.rows
      .filter((row) => {
        const haystack = normalizeSearch(Object.values(row || {}).join(" "));
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => {
        const aName = normalizeSearch(a.nama || a.kode);
        const bName = normalizeSearch(b.nama || b.kode);
        const aExact = aName === key || normalizeSearch(a.kode) === key ? 0 : 1;
        const bExact = bName === key || normalizeSearch(b.kode) === key ? 0 : 1;
        return aExact - bExact || String(a.nama || a.kode).localeCompare(String(b.nama || b.kode), "id", { sensitivity: "base" });
      })
      .slice(0, 8);
  }

  function handleRestockMedicineSearchInput() {
    state.restockSelectedMedicineKey = "";
    if (els.restockCurrentStockInput) els.restockCurrentStockInput.value = "";
    renderRestockMedicineResults();
    if (els.restockRequestStatus) els.restockRequestStatus.textContent = "Pilih obat dari hasil pencarian untuk mengisi data restok.";
  }

  function renderRestockMedicineResults(query = els.restockMedicineInput?.value || "", options = {}) {
    if (!els.restockMedicineResults) return;
    const cleanQuery = String(query || "").trim();
    if (!cleanQuery && !options.force) {
      els.restockMedicineResults.hidden = true;
      els.restockMedicineResults.innerHTML = "";
      return;
    }
    const rows = getRestockMedicineSearchResults(cleanQuery);
    els.restockMedicineResults.hidden = false;
    if (!rows.length) {
      els.restockMedicineResults.innerHTML = `
        <div class="restock-medicine-empty">
          <strong>Obat tidak ditemukan</strong>
          <small>Coba nama, kode produk, atau barcode lain.</small>
        </div>
      `;
      return;
    }
    els.restockMedicineResults.innerHTML = rows.map((row, index) => `
      <button class="restock-medicine-result" type="button" data-restock-medicine-index="${index}">
        <span>
          <strong>${escapeHtml(row.nama || row.kode || "Obat")}</strong>
          <small>${escapeHtml([row.kode, row.suplier].filter(Boolean).join(" - ") || "Data obat")}</small>
        </span>
        <em>${escapeHtml(formatCell(row.stok, "stok"))} ${escapeHtml(inferRestockStockUnit(row))}</em>
      </button>
    `).join("");
    els.restockMedicineResults.dataset.query = cleanQuery;
  }

  function handleRestockMedicineResultClick(event) {
    const button = event.target.closest("[data-restock-medicine-index]");
    if (!button) return;
    const rows = getRestockMedicineSearchResults(els.restockMedicineResults?.dataset.query || els.restockMedicineInput?.value || "");
    const row = rows[Number(button.dataset.restockMedicineIndex)];
    if (row) selectRestockMedicine(row);
  }

  function selectRestockMedicine(row) {
    if (!row) return;
    state.restockSelectedMedicineKey = getRestockMedicineKey(row);
    if (els.restockMedicineInput) els.restockMedicineInput.value = row.nama || row.kode || "";
    if (els.restockCurrentStockInput) els.restockCurrentStockInput.value = `${formatCell(row.stok, "stok")} ${inferRestockStockUnit(row)}`;
    populateRestockUnitOptions(inferRestockUnit(row));
    if (els.restockMedicineResults) {
      els.restockMedicineResults.hidden = true;
      els.restockMedicineResults.innerHTML = "";
    }
    if (els.restockRequestStatus) els.restockRequestStatus.textContent = "Obat dipilih. Lengkapi jumlah dan prioritas restok.";
  }

  function updateRestockMedicinePreview() {
    const row = findMedicineForRestock(els.restockMedicineInput?.value || "");
    if (els.restockCurrentStockInput) {
      els.restockCurrentStockInput.value = row ? `${formatCell(row.stok, "stok")} ${inferRestockStockUnit(row)}` : "0";
    }
    if (row) populateRestockUnitOptions(inferRestockUnit(row));
  }

  function openRestockRequestModal(id = "") {
    const editingItem = id ? state.restockRequests.find((request) => request.id === id) : null;
    if (editingItem && !canEditRestockRequest(editingItem)) {
      setRestockPageMessage("Data restok hanya bisa diedit oleh owner/admin, atau saat status masih pending.", "error");
      return;
    }
    state.restockSelectedMedicineKey = "";
    state.restockEditingId = editingItem ? editingItem.id : "";
    state.pendingRestockPhoto = "";
    state.pendingRestockPhotoName = "";
    state.pendingRestockPhotoPromise = null;
    if (els.restockRequestForm) els.restockRequestForm.reset();
    if (els.restockRequestTitle) els.restockRequestTitle.textContent = editingItem ? "Edit Data Obat Restok" : "Tambah Permintaan Restok";
    if (els.restockSubmitLabel) els.restockSubmitLabel.textContent = editingItem ? "Simpan Perubahan" : "Kirim Laporan";
    if (els.restockRequestStatus) {
      els.restockRequestStatus.textContent = editingItem
        ? "Ubah jumlah, satuan, prioritas, atau catatan restok."
        : "Isi kebutuhan restok obat yang stoknya kosong atau menipis.";
    }
    const row = editingItem ? findMedicineForRestock(editingItem.code || editingItem.medicineName) : null;
    if (row) state.restockSelectedMedicineKey = getRestockMedicineKey(row);
    if (els.restockMedicineInput) {
      els.restockMedicineInput.value = editingItem ? (editingItem.medicineName || row?.nama || "") : "";
    }
    if (els.restockCurrentStockInput) {
      els.restockCurrentStockInput.value = editingItem
        ? `${formatCell(editingItem.currentStock, "stok")} ${editingItem.stockUnit || inferRestockStockUnit(row)}`
        : "";
    }
    if (els.restockQtyInput) els.restockQtyInput.value = editingItem ? String(editingItem.qty || 1) : "1";
    if (els.restockPrioritySelect) els.restockPrioritySelect.value = editingItem ? editingItem.priority || "urgent" : "urgent";
    if (els.restockNoteInput) els.restockNoteInput.value = editingItem ? editingItem.note || "" : "";
    if (els.restockPhotoLabel) els.restockPhotoLabel.textContent = "Upload Foto";
    if (els.restockMedicineResults) {
      els.restockMedicineResults.hidden = true;
      els.restockMedicineResults.innerHTML = "";
    }
    populateRestockUnitOptions(editingItem ? editingItem.unit : "");
    showModal(els.restockRequestModal);
    window.setTimeout(() => els.restockMedicineInput?.focus(), 80);
  }

  function closeRestockRequestModal() {
    state.restockEditingId = "";
    hideModal(els.restockRequestModal);
  }

  function closeRestockDetailModal() {
    state.restockDetailId = "";
    hideModal(els.restockDetailModal);
  }

  function handleRestockPhotoChange() {
    const file = els.restockPhotoInput?.files?.[0];
    state.pendingRestockPhoto = "";
    state.pendingRestockPhotoName = "";
    state.pendingRestockPhotoPromise = null;
    if (!file) {
      if (els.restockPhotoLabel) els.restockPhotoLabel.textContent = "Upload Foto";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      if (els.restockRequestStatus) els.restockRequestStatus.textContent = "Foto maksimal 2MB.";
      if (els.restockPhotoInput) els.restockPhotoInput.value = "";
      return;
    }
    state.pendingRestockPhotoPromise = compressRestockPhoto(file).then((dataUrl) => {
      state.pendingRestockPhoto = dataUrl;
      state.pendingRestockPhotoName = dataUrl ? file.name : "";
      if (els.restockPhotoLabel) els.restockPhotoLabel.textContent = dataUrl ? file.name : "Upload Foto";
      if (!dataUrl && els.restockRequestStatus) {
        els.restockRequestStatus.textContent = "Foto terlalu besar untuk sinkron online. Laporan tetap bisa dikirim tanpa foto.";
      }
      return dataUrl;
    });
  }

  function compressRestockPhoto(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve("");
      reader.onload = () => {
        const raw = String(reader.result || "");
        const image = new Image();
        image.onerror = () => resolve(raw.length <= RESTOCK_PHOTO_MAX_LENGTH ? raw : "");
        image.onload = () => {
          const sizes = [900, 720, 560, 420, 320];
          const qualities = [0.72, 0.62, 0.52, 0.44, 0.36];
          let best = "";

          sizes.some((maxSide) => {
            const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width || 1, image.naturalHeight || image.height || 1));
            const width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * scale));
            const height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * scale));
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d", { alpha: false });
            context.fillStyle = "#fff";
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);

            return qualities.some((quality) => {
              const dataUrl = canvas.toDataURL("image/jpeg", quality);
              if (!best || dataUrl.length < best.length) best = dataUrl;
              if (dataUrl.length <= RESTOCK_PHOTO_MAX_LENGTH) {
                best = dataUrl;
                return true;
              }
              return false;
            });
          });

          resolve(best && best.length <= RESTOCK_PHOTO_MAX_LENGTH ? best : "");
        };
        image.src = raw;
      };
      reader.readAsDataURL(file);
    });
  }

  async function saveRestockRequest(event) {
    event.preventDefault();
    const medicineText = String(els.restockMedicineInput?.value || "").trim();
    const editingItem = state.restockEditingId
      ? state.restockRequests.find((request) => request.id === state.restockEditingId)
      : null;
    const row = getSelectedRestockMedicine() || (editingItem ? findMedicineForRestock(editingItem.code || editingItem.medicineName) : null);
    if (!medicineText) {
      if (els.restockRequestStatus) els.restockRequestStatus.textContent = "Nama obat wajib diisi.";
      return;
    }
    if (!editingItem && !row) {
      if (els.restockRequestStatus) els.restockRequestStatus.textContent = "Pilih obat dari popup hasil pencarian terlebih dahulu.";
      renderRestockMedicineResults(medicineText, { force: true });
      return;
    }
    if (editingItem && !canEditRestockRequest(editingItem)) {
      if (els.restockRequestStatus) els.restockRequestStatus.textContent = "Laporan ini tidak bisa diedit oleh akun ini.";
      return;
    }
    const loadingToken = startAppLoading(editingItem ? "Menyimpan perubahan restok..." : "Mengirim laporan restok obat...", 0);
    const user = getCurrentUserRecord();
    try {
      if (els.restockRequestStatus) els.restockRequestStatus.textContent = editingItem ? "Menyimpan perubahan restok..." : "Mengirim laporan restok...";
      if (state.pendingRestockPhotoPromise) await state.pendingRestockPhotoPromise;
      await delay(450);
      const now = new Date().toISOString();
      if (editingItem) {
        Object.assign(editingItem, normalizeRestockRequest({
          ...editingItem,
          code: row?.kode || editingItem.code || "",
          medicineName: row?.nama || medicineText || editingItem.medicineName,
          currentStock: row?.stok || editingItem.currentStock || "0",
          stockUnit: row ? inferRestockStockUnit(row) : editingItem.stockUnit,
          unit: els.restockUnitSelect?.value || editingItem.unit,
          qty: els.restockQtyInput?.value || editingItem.qty || 1,
          priority: els.restockPrioritySelect?.value || editingItem.priority || "normal",
          note: els.restockNoteInput?.value || "",
          photo: state.pendingRestockPhoto || editingItem.photo || "",
          supplier: row?.suplier || editingItem.supplier || "",
          updatedAt: now,
          history: (editingItem.history || []).concat({ status: "edited", at: now, by: user.name || "Operator" })
        }));
      } else {
        const request = normalizeRestockRequest({
          id: `RST-${Date.now()}`,
          code: row.kode || "",
          medicineName: row.nama || medicineText,
          currentStock: row.stok || els.restockCurrentStockInput?.value || "0",
          stockUnit: inferRestockStockUnit(row),
          unit: els.restockUnitSelect?.value || inferRestockUnit(row),
          qty: els.restockQtyInput?.value || 1,
          priority: els.restockPrioritySelect?.value || "normal",
          status: "pending",
          reporter: user.name || user.username || "Operator",
          reporterKey: user.username || user.email || "",
          note: els.restockNoteInput?.value || "",
          photo: state.pendingRestockPhoto,
          supplier: row.suplier || "",
          createdAt: now,
          updatedAt: now,
          history: [{ status: "pending", at: now, by: user.name || "Operator" }]
        });
        state.restockRequests.unshift(request);
      }
      persistRestockRequests({ remote: false });
      const syncResult = await saveRestockRequestsToBackend({ silent: true });
      addProfileActivity(editingItem ? "Data restok diperbarui" : "Permintaan restok dibuat", `${medicineText} - ${els.restockQtyInput?.value || 1} ${els.restockUnitSelect?.value || ""}`);
      closeRestockRequestModal();
      renderRestockPage();
      setRestockPageMessage(
        syncResult
          ? (editingItem ? "Perubahan data restok berhasil disimpan online." : "Laporan restok berhasil dikirim dan disimpan online.")
          : (editingItem ? "Perubahan data restok berhasil disimpan lokal." : "Laporan restok berhasil disimpan lokal."),
        "success"
      );
      showActionToast(editingItem ? "Data restok berhasil diubah." : "Laporan restok berhasil disimpan.");
    } catch (error) {
      if (els.restockRequestStatus) els.restockRequestStatus.textContent = `Laporan gagal disimpan: ${error.message}`;
    } finally {
      endAppLoading(loadingToken);
    }
  }

  function renderRestockPage() {
    if (!els.restockList) return;
    pruneRestockSelection();
    const rows = getFilteredRestockRequests();
    const total = state.restockRequests.length;
    const pending = state.restockRequests.filter((item) => item.status === "pending").length;
    const processing = state.restockRequests.filter((item) => item.status === "processing").length;
    const done = state.restockRequests.filter((item) => item.status === "done").length;

    setText(els.restockTotalCount, formatNumber(total));
    setText(els.restockPendingCount, formatNumber(pending));
    setText(els.restockProcessCount, formatNumber(processing));
    setText(els.restockDoneCount, formatNumber(done));
    if (els.restockStatusText) {
      els.restockStatusText.removeAttribute("data-type");
      els.restockStatusText.textContent = getRestockSelectionCount()
        ? `${formatNumber(getRestockSelectionCount())} data restok dipilih. Ketuk ikon hapus untuk menghapus data terpilih.`
        : total
          ? `${formatNumber(rows.length)} dari ${formatNumber(total)} laporan restok ditampilkan.`
          : "Belum ada laporan restok. Tambahkan obat habis dari tombol utama.";
    }
    if (els.restockMineButton) els.restockMineButton.classList.toggle("is-active", state.restockMineOnly);
    if (els.restockPage) els.restockPage.classList.toggle("is-selecting", state.restockSelectionMode);
    if (els.restockDeleteButton) {
      const selectedCount = getRestockSelectionCount();
      els.restockDeleteButton.classList.toggle("has-selection", selectedCount > 0);
      els.restockDeleteButton.setAttribute("title", selectedCount ? `Hapus ${formatNumber(selectedCount)} data terpilih` : "Hapus data restok");
      els.restockDeleteButton.setAttribute("aria-label", selectedCount ? `Hapus ${formatNumber(selectedCount)} data restok terpilih` : "Hapus data restok");
    }

    if (!rows.length) {
      els.restockList.innerHTML = `
        <article class="restock-empty-card">
          <img src="assets/mobile-menu/restok-obat.png" alt="">
          <strong>Belum ada laporan sesuai filter</strong>
          <p>Gunakan tombol Tambah Obat Habis untuk membuat permintaan restok baru.</p>
          <button class="restock-soft-button" type="button" data-restock-action="add">Tambah Laporan</button>
        </article>
      `;
    } else {
      els.restockList.innerHTML = rows.map(renderRestockCard).join("");
    }

    updateNotificationState();
  }

  function setRestockPageMessage(message, type) {
    if (!els.restockStatusText) return;
    els.restockStatusText.textContent = message || "";
    if (type) els.restockStatusText.dataset.type = type;
    else els.restockStatusText.removeAttribute("data-type");
  }

  function startRestockLongPress(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (event.target.closest(".restock-select-toggle")) return;
    const card = event.target.closest(".restock-card");
    if (!card || !card.dataset.restockId) return;
    state.restockLongPressTarget = card.dataset.restockId;
    window.clearTimeout(state.restockLongPressTimer);
    state.restockLongPressTimer = window.setTimeout(() => {
      const targetId = state.restockLongPressTarget;
      state.restockLongPressTimer = null;
      state.restockLongPressTarget = "";
      if (targetId) enterRestockSelectionMode(targetId);
    }, 550);
  }

  function clearRestockLongPress() {
    window.clearTimeout(state.restockLongPressTimer);
    state.restockLongPressTimer = null;
    state.restockLongPressTarget = "";
  }

  function handleRestockListContextMenu(event) {
    const card = event.target.closest(".restock-card");
    if (!card || !card.dataset.restockId) return;
    event.preventDefault();
    enterRestockSelectionMode(card.dataset.restockId);
  }

  function enterRestockSelectionMode(id = "") {
    const item = id ? state.restockRequests.find((request) => request.id === id) : null;
    if (item && !canDeleteRestockRequest(item)) {
      state.restockSelectionMode = false;
      setRestockPageMessage("Akun ini hanya bisa memilih data restok yang masih pending.", "error");
      return;
    }
    state.restockSelectionMode = true;
    if (id) toggleRestockSelection(id, { keepMode: true });
    else renderRestockPage();
    if (window.navigator?.vibrate) window.navigator.vibrate(18);
  }

  function exitRestockSelectionMode() {
    state.restockSelectionMode = false;
    state.selectedRestockIds.clear();
    renderRestockPage();
  }

  function toggleRestockSelection(id, options = {}) {
    const item = state.restockRequests.find((request) => request.id === id);
    if (!item) return;
    if (!canDeleteRestockRequest(item)) {
      setRestockPageMessage("Akun ini hanya bisa memilih data restok yang masih pending.", "error");
      return;
    }
    if (state.selectedRestockIds.has(id)) state.selectedRestockIds.delete(id);
    else state.selectedRestockIds.add(id);
    if (!state.selectedRestockIds.size && !options.keepMode) state.restockSelectionMode = false;
    renderRestockPage();
  }

  function pruneRestockSelection() {
    const validIds = new Set(state.restockRequests.map((item) => item.id));
    state.selectedRestockIds.forEach((id) => {
      if (!validIds.has(id)) state.selectedRestockIds.delete(id);
    });
    if (!state.selectedRestockIds.size) state.restockSelectionMode = false;
  }

  function getRestockSelectionCount() {
    pruneRestockSelection();
    return state.selectedRestockIds.size;
  }

  function getSelectedRestockDeleteCandidates() {
    return state.restockRequests.filter((item) => state.selectedRestockIds.has(item.id) && canDeleteRestockRequest(item));
  }

  function canEditRestockRequest(item) {
    if (!item) return false;
    const user = getCurrentUserRecord();
    if (isAdminUser(user) || isOwnerUser(user)) return true;
    return item.status === "pending";
  }

  function canDeleteRestockRequest(item) {
    if (!item) return false;
    const user = getCurrentUserRecord();
    if (isAdminUser(user) || isOwnerUser(user)) return true;
    return item.status === "pending";
  }

  function getFilteredRestockRequests() {
    const query = normalizeSearch(els.restockSearchInput?.value || "");
    const status = String(els.restockStatusFilter?.value || "").trim();
    const user = getCurrentUserRecord();
    const userKeys = [user.username, user.email, user.name].map(normalizeSearch).filter(Boolean);
    return state.restockRequests.filter((item) => {
      const haystack = normalizeSearch([item.medicineName, item.code, item.reporter, item.supplier, item.note].join(" "));
      const searchMatch = !query || haystack.includes(query);
      const statusMatch = !status || item.status === status;
      const mineMatch = !state.restockMineOnly || userKeys.includes(normalizeSearch(item.reporterKey)) || userKeys.includes(normalizeSearch(item.reporter));
      return searchMatch && statusMatch && mineMatch;
    }).sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
  }

  function renderRestockCard(item) {
    const status = getRestockStatusMeta(item.status);
    const priority = getRestockPriorityMeta(item.priority);
    const isSelected = state.selectedRestockIds.has(item.id);
    const canDelete = canDeleteRestockRequest(item);
    return `
      <article class="restock-card ${isSelected ? "is-selected" : ""} ${!canDelete ? "is-locked-selection" : ""}" data-restock-id="${escapeHtml(item.id)}">
        <button class="restock-select-toggle ${isSelected ? "is-selected" : ""}" type="button" data-restock-action="select" data-restock-id="${escapeHtml(item.id)}" aria-pressed="${isSelected ? "true" : "false"}" aria-label="${escapeHtml(isSelected ? "Batalkan pilihan" : "Pilih data restok")}" ${canDelete ? "" : "disabled"}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"></path></svg>
        </button>
        <div class="restock-card-main">
          <span class="restock-priority is-${priority.key}">${escapeHtml(priority.label)}</span>
          <h3>${escapeHtml(item.medicineName || "Obat")}</h3>
          <div class="restock-card-grid">
            <span><small>Stok Saat Ini</small><strong class="${parseNumber(item.currentStock) <= 0 ? "is-danger" : ""}">${escapeHtml(formatCell(item.currentStock, "stok"))} ${escapeHtml(item.stockUnit || item.unit)}</strong></span>
            <span><small>Permintaan</small><strong>${escapeHtml(item.qty)} ${escapeHtml(item.unit)}</strong></span>
            <span><small>Pelapor</small><strong>${escapeHtml(item.reporter || "-")}</strong></span>
            <span><small>Tanggal</small><strong>${escapeHtml(formatRestockDateTime(item.createdAt))}</strong></span>
          </div>
        </div>
        <button class="restock-status-chip is-${status.key}" type="button" data-restock-action="detail" data-restock-id="${escapeHtml(item.id)}">
          ${status.icon}
          <span>${escapeHtml(status.label)}</span>
        </button>
      </article>
    `;
  }

  function toggleRestockMineOnly() {
    state.restockMineOnly = !state.restockMineOnly;
    renderRestockPage();
  }

  function handleRestockListAction(event) {
    clearRestockLongPress();
    const button = event.target.closest("[data-restock-action]");
    if (state.restockSelectionMode) {
      const card = event.target.closest(".restock-card");
      const id = button?.dataset.restockId || card?.dataset.restockId || "";
      if (id) {
        event.preventDefault();
        toggleRestockSelection(id);
      }
      return;
    }
    if (!button) return;
    const action = button.dataset.restockAction;
    if (action === "add") {
      openRestockRequestModal();
      return;
    }
    if (action === "select") {
      enterRestockSelectionMode(button.dataset.restockId);
      return;
    }
    if (action === "detail") openRestockDetailModal(button.dataset.restockId);
  }

  function openRestockDetailModal(id) {
    const item = state.restockRequests.find((request) => request.id === id);
    if (!item) return;
    state.restockDetailId = id;
    renderRestockDetail(item);
    showModal(els.restockDetailModal);
  }

  function renderRestockDetail(item) {
    const status = getRestockStatusMeta(item.status);
    const priority = getRestockPriorityMeta(item.priority);
    const row = findMedicineForRestock(item.code || item.medicineName);
    const user = getCurrentUserRecord();
    const isOwner = isOwnerUser(user);
    const canManage = isAdminUser(user) || isOwner;
    const statusLocked = item.status === "done" && !isOwner;
    const canManageStatus = canManage && !statusLocked;
    const canSendToDraft = canManageStatus && item.status !== "rejected";
    const canCancel = item.status === "pending";
    const canEditRestock = canEditRestockRequest(item);
    if (els.restockDetailTitle) els.restockDetailTitle.textContent = "Detail Permintaan Restok";
    if (els.restockDetailStatus) els.restockDetailStatus.textContent = status.label;
    if (!els.restockDetailBody) return;
    els.restockDetailBody.innerHTML = `
      <div class="restock-detail-summary">
        <div class="restock-detail-image">
          ${item.photo ? `<img src="${escapeHtml(item.photo)}" alt="">` : `<img src="assets/mobile-menu/restok-obat.png" alt="">`}
        </div>
        <div>
          <span class="restock-priority is-${priority.key}">${escapeHtml(priority.label)}</span>
          <span class="restock-status-label is-${status.key}">${status.icon}${escapeHtml(status.label)}</span>
          <h3>${escapeHtml(item.medicineName)}</h3>
          <small>${escapeHtml(item.unit || inferRestockUnit(row))}</small>
        </div>
      </div>
      <dl class="restock-detail-grid">
        <div><dt>Stok Saat Ini</dt><dd class="${parseNumber(item.currentStock) <= 0 ? "is-danger" : ""}">${escapeHtml(formatCell(item.currentStock, "stok"))} ${escapeHtml(item.stockUnit || item.unit)}</dd></div>
        <div><dt>Permintaan</dt><dd>${escapeHtml(item.qty)} ${escapeHtml(item.unit)}</dd></div>
        <div><dt>Satuan</dt><dd>${escapeHtml(item.unit)}</dd></div>
        <div><dt>Prioritas</dt><dd>${escapeHtml(priority.label)}</dd></div>
        <div><dt>Pelapor</dt><dd>${escapeHtml(item.reporter || "-")}</dd></div>
        <div><dt>Tanggal</dt><dd>${escapeHtml(formatRestockDateTime(item.createdAt))}</dd></div>
        <div><dt>Supplier</dt><dd>${escapeHtml(item.supplier || row?.suplier || "-")}</dd></div>
        <div><dt>Kode</dt><dd>${escapeHtml(item.code || row?.kode || "-")}</dd></div>
      </dl>
      <div class="restock-detail-note">
        <strong>Catatan</strong>
        <p>${escapeHtml(item.note || "Tidak ada catatan.")}</p>
      </div>
      <div class="restock-detail-actions">
        ${canSendToDraft ? `<button class="secondary-action" type="button" data-restock-detail-action="order">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3z"></path><path d="M14 10h4l3 3v4h-7z"></path></svg>
          Masukkan ke Draft Pesanan
        </button>` : ""}
        ${canManageStatus ? `
          <button class="filter-action" type="button" data-restock-detail-action="processing">Tandai Diproses</button>
          <button class="restock-done-button" type="button" data-restock-detail-action="done">Selesai</button>
          <button class="restock-danger-button" type="button" data-restock-detail-action="rejected">Tolak</button>
        ` : ""}
        ${canEditRestock ? `<button class="restock-soft-button" type="button" data-restock-detail-action="edit-medicine">Edit Data Obat</button>` : ""}
        ${canCancel ? `<button class="restock-cancel-button" type="button" data-restock-detail-action="cancel">Batalkan Laporan</button>` : ""}
      </div>
    `;
  }

  function handleRestockDetailAction(event) {
    const button = event.target.closest("[data-restock-detail-action]");
    if (!button || !state.restockDetailId) return;
    const action = button.dataset.restockDetailAction;
    if (action === "order") {
      addRestockToPurchaseOrder(state.restockDetailId);
      return;
    }
    if (action === "processing" || action === "done" || action === "rejected") {
      updateRestockStatus(state.restockDetailId, action === "processing" ? "processing" : action);
      return;
    }
    if (action === "cancel") {
      cancelRestockRequest(state.restockDetailId);
      return;
    }
    if (action === "edit-medicine") {
      const editId = state.restockDetailId;
      closeRestockDetailModal();
      openRestockRequestModal(editId);
    }
  }

  function updateRestockStatus(id, status) {
    const item = state.restockRequests.find((request) => request.id === id);
    if (!item) return;
    const user = getCurrentUserRecord();
    const isOwner = isOwnerUser(user);
    const canManage = isAdminUser(user) || isOwner;
    if (!canManage) {
      setRestockPageMessage("Status restok hanya dapat diubah oleh owner/admin.", "error");
      return;
    }
    if (item.status === "done" && !isOwner) {
      setRestockPageMessage("Status selesai hanya dapat diedit kembali oleh owner.", "error");
      return;
    }
    item.status = status;
    item.updatedAt = new Date().toISOString();
    item.history = (item.history || []).concat({ status, at: item.updatedAt, by: user.name || "Admin" });
    persistRestockRequests();
    addProfileActivity("Status restok diperbarui", `${item.medicineName} - ${getRestockStatusMeta(status).label}`);
    renderRestockPage();
    renderRestockDetail(item);
    showActionToast(`Status restok ${getRestockStatusMeta(status).label.toLowerCase()} berhasil disimpan.`);
  }

  function cancelRestockRequest(id) {
    const item = state.restockRequests.find((request) => request.id === id);
    if (!item || item.status !== "pending") {
      setRestockPageMessage("Laporan hanya bisa dibatalkan saat status masih pending.", "error");
      return;
    }
    state.restockRequests = state.restockRequests.filter((request) => request.id !== id);
    persistRestockRequests();
    addProfileActivity("Laporan restok dibatalkan", item?.medicineName || "Restok obat");
    closeRestockDetailModal();
    renderRestockPage();
    showActionToast("Laporan restok berhasil dibatalkan.");
  }

  function openRestockDeleteModal() {
    window.clearTimeout(state.restockDeleteSuccessTimer);
    if (els.restockDeleteDateFrom) els.restockDeleteDateFrom.value = "";
    if (els.restockDeleteDateTo) els.restockDeleteDateTo.value = "";
    if (getRestockSelectionCount()) showRestockDeleteConfirmPanel("selected");
    else showRestockDeleteMethodPanel();
    showModal(els.restockDeleteModal);
  }

  function closeRestockDeleteModal() {
    window.clearTimeout(state.restockDeleteSuccessTimer);
    hideModal(els.restockDeleteModal);
  }

  function handleRestockDeleteModalClick(event) {
    const modeButton = event.target.closest("[data-restock-delete-mode]");
    if (modeButton) {
      showRestockDeleteConfirmPanel(modeButton.dataset.restockDeleteMode);
      return;
    }
    if (event.target.closest("[data-restock-delete-cancel]")) {
      closeRestockDeleteModal();
    }
  }

  function showRestockDeleteMethodPanel() {
    state.restockDeleteMode = "method";
    if (els.restockDeleteScope) els.restockDeleteScope.value = "all";
    toggleRestockDeletePanels("method");
    if (els.restockDeleteTitle) els.restockDeleteTitle.textContent = "Hapus Data Restok";
    if (els.restockDeleteStatus) els.restockDeleteStatus.textContent = "Pilih metode penghapusan data yang ingin Anda lakukan.";
    if (els.restockDeleteBackButton) els.restockDeleteBackButton.hidden = true;
    if (els.restockDeleteSelectedMethod) {
      const selectedCount = getRestockSelectionCount();
      els.restockDeleteSelectedMethod.hidden = selectedCount <= 0;
      const text = els.restockDeleteSelectedMethod.querySelector("small");
      if (text) text.textContent = `${formatNumber(selectedCount)} data restok yang sudah dicentang.`;
    }
  }

  function showRestockDeleteConfirmPanel(mode) {
    state.restockDeleteMode = mode === "selected" ? "selected" : mode === "date" ? "date" : "all";
    if (els.restockDeleteScope) els.restockDeleteScope.value = state.restockDeleteMode === "date" ? "date" : "all";
    if (state.restockDeleteMode === "date") {
      if (!els.restockDeleteDateFrom?.value) els.restockDeleteDateFrom.value = getTodayDateInputValue();
      if (!els.restockDeleteDateTo?.value) els.restockDeleteDateTo.value = els.restockDeleteDateFrom?.value || getTodayDateInputValue();
      toggleRestockDeletePanels("date");
    } else {
      toggleRestockDeletePanels("confirm");
    }
    if (els.restockDeleteBackButton) els.restockDeleteBackButton.hidden = false;
    updateRestockDeletePreview();
  }

  function toggleRestockDeletePanels(activePanel) {
    if (els.restockDeleteMethodPanel) els.restockDeleteMethodPanel.hidden = activePanel !== "method";
    if (els.restockDeleteConfirmPanel) els.restockDeleteConfirmPanel.hidden = activePanel !== "confirm";
    if (els.restockDeleteDatePanel) els.restockDeleteDatePanel.hidden = activePanel !== "date";
    if (els.restockDeleteSuccessPanel) els.restockDeleteSuccessPanel.hidden = activePanel !== "success";
  }

  function updateRestockDeletePreview() {
    if (!els.restockDeleteStatus) return;
    const candidates = getRestockDeleteCandidates();
    const user = getCurrentUserRecord();
    const canManage = isAdminUser(user) || isOwnerUser(user);
    const roleText = canManage ? "semua status" : "status pending saja";
    const titleMap = {
      selected: "Hapus Data Terpilih",
      date: "Hapus Data Berdasarkan Tanggal",
      all: "Hapus Semua Data Restok"
    };
    if (els.restockDeleteTitle) els.restockDeleteTitle.textContent = titleMap[state.restockDeleteMode] || "Hapus Data Restok";
    if (els.restockDeletePrimaryLabel) els.restockDeletePrimaryLabel.textContent = "Hapus Data";
    if (state.restockDeleteMode === "selected") {
      els.restockDeleteStatus.textContent = `${formatNumber(candidates.length)} data restok terpilih ${roleText} akan dihapus.`;
      return;
    }
    if (state.restockDeleteMode === "date") {
      els.restockDeleteStatus.textContent = `${formatNumber(candidates.length)} data restok ${roleText} akan dihapus sesuai rentang tanggal.`;
      return;
    }
    els.restockDeleteStatus.textContent = `${formatNumber(candidates.length)} data restok ${roleText} akan dihapus dari seluruh tanggal.`;
  }

  function getRestockDeleteCandidates() {
    const scope = state.restockDeleteMode === "date" ? "date" : "all";
    const from = String(els.restockDeleteDateFrom?.value || "").trim();
    const to = String(els.restockDeleteDateTo?.value || "").trim();
    const source = state.restockDeleteMode === "selected"
      ? getSelectedRestockDeleteCandidates()
      : state.restockRequests;
    return source.filter((item) => {
      if (!canDeleteRestockRequest(item)) return false;
      if (scope !== "date") return true;
      const dateKey = getRestockDateKey(item.createdAt || item.updatedAt);
      if (!dateKey) return false;
      if (from && dateKey < from) return false;
      if (to && dateKey > to) return false;
      return true;
    });
  }

  function getRestockDateKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(date);
  }

  function getTodayDateInputValue() {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Jakarta"
    }).format(new Date());
  }

  function deleteRestockRequests(event) {
    event.preventDefault();
    const candidates = getRestockDeleteCandidates();
    if (!candidates.length) {
      if (els.restockDeleteStatus) els.restockDeleteStatus.textContent = "Tidak ada data yang cocok untuk dihapus.";
      return;
    }
    const ids = new Set(candidates.map((item) => item.id));
    state.restockRequests = state.restockRequests.filter((item) => !ids.has(item.id));
    persistRestockRequests();
    addProfileActivity("Hapus data restok", `${formatNumber(candidates.length)} laporan restok dihapus`);
    if (state.restockDetailId && ids.has(state.restockDetailId)) closeRestockDetailModal();
    state.selectedRestockIds.clear();
    state.restockSelectionMode = false;
    renderRestockPage();
    showRestockDeleteSuccess(candidates.length);
    setRestockPageMessage(`${formatNumber(candidates.length)} data restok berhasil dihapus.`, "success");
    showActionToast(`${formatNumber(candidates.length)} data restok berhasil dihapus.`);
  }

  function showRestockDeleteSuccess(count) {
    toggleRestockDeletePanels("success");
    if (els.restockDeleteBackButton) els.restockDeleteBackButton.hidden = true;
    if (els.restockDeleteTitle) els.restockDeleteTitle.textContent = "Berhasil Dihapus";
    if (els.restockDeleteStatus) els.restockDeleteStatus.textContent = `${formatNumber(count)} data restok berhasil dihapus.`;
    if (els.restockDeleteSuccessText) els.restockDeleteSuccessText.textContent = `${formatNumber(count)} data restok berhasil dihapus dari daftar.`;
    window.clearTimeout(state.restockDeleteSuccessTimer);
    state.restockDeleteSuccessTimer = window.setTimeout(closeRestockDeleteModal, 1100);
  }

  function addRestockToPurchaseOrder(id) {
    const item = state.restockRequests.find((request) => request.id === id);
    if (!item) return;
    const user = getCurrentUserRecord();
    const isOwner = isOwnerUser(user);
    const canManage = isAdminUser(user) || isOwner;
    if (!canManage || (item.status === "done" && !isOwner)) {
      setRestockPageMessage("Draft pesanan hanya dapat dibuat oleh owner/admin.", "error");
      return;
    }
    state.purchaseItems.push({
      kode: item.code,
      nama: item.medicineName,
      qty: item.qty,
      unit: item.unit
    });
    if (els.poSupplier && item.supplier) els.poSupplier.value = item.supplier;
    updateRestockStatus(id, "processing");
    closeRestockDetailModal();
    renderPurchaseItems();
    renderRestockPage();
    setRestockPageMessage(`${item.medicineName} berhasil dimasukkan ke draft pesanan pembelian.`, "success");
    showActionToast("Obat berhasil masuk ke draft pesanan.");
  }

  function getRestockStatusMeta(status) {
    const map = {
      pending: { key: "pending", label: "Menunggu Admin", notification: "Permintaan Restok Baru", icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>' },
      processing: { key: "processing", label: "Sedang Diproses", notification: "Status Restok Diperbarui", icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v10H3z"></path><path d="M14 10h4l3 3v4h-7z"></path></svg>' },
      done: { key: "done", label: "Selesai", notification: "Restok Selesai", icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"></path></svg>' },
      rejected: { key: "rejected", label: "Ditolak", notification: "Laporan Ditolak", icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>' }
    };
    return map[status] || map.pending;
  }

  function getRestockPriorityMeta(priority) {
    const map = {
      urgent: { key: "urgent", label: "Mendesak" },
      important: { key: "important", label: "Penting" },
      normal: { key: "normal", label: "Normal" }
    };
    return map[priority] || map.normal;
  }

  function formatRestockDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const dateText = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(date);
    return `${dateText}, ${formatRestockTime(value)} WIB`;
  }

  function formatRestockTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--.--";
    return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(date).replace(":", ".");
  }

  function renderProfile() {
    const profile = getProfileData();
    const previewProfile = state.pendingProfilePhoto !== null
      ? { ...profile, photo: state.pendingProfilePhoto }
      : profile;

    renderProfileAvatars(previewProfile);
    hydrateProfileHeader(profile);
    if (els.homeProfileName) els.homeProfileName.textContent = profile.name || "Akun";
    if (els.homeProfileRole) els.homeProfileRole.textContent = profile.role || "Operator";
    if (els.profileDisplayName) els.profileDisplayName.textContent = profile.name;
    if (els.profileDisplayRole) els.profileDisplayRole.textContent = profile.role;
    if (els.profileUsername) els.profileUsername.textContent = profile.username || "-";
    if (els.profileEmail) els.profileEmail.textContent = profile.email || "-";
    if (els.profilePhonePreview) els.profilePhonePreview.textContent = profile.phone || "-";
    if (els.profileRole) els.profileRole.textContent = profile.role || "-";
    if (els.profileNameInput) els.profileNameInput.value = profile.name || "";
    if (els.profileEmailInput) els.profileEmailInput.value = profile.email || "";
    if (els.profilePhoneInput) els.profilePhoneInput.value = profile.phone || "";
    if (els.profileJobInput) els.profileJobInput.value = profile.role || profile.job || "";
    if (els.profileAddressInput) els.profileAddressInput.value = profile.address || "";
    if (els.profilePhotoFileName) {
      els.profilePhotoFileName.textContent = state.pendingProfilePhotoName || (profile.photo ? "Foto profil tersimpan" : "Belum ada foto dipilih");
    }
    renderPharmacyIdentity();
    syncProfileActivityAccess();
  }

  function getProfileData() {
    const session = readSession() || {};
    const stored = readScopedProfileData();
    const user = state.users.length ? getCurrentUserRecord() : null;
    const role = user?.role || session.role || stored.job || "Operator";

    return {
      name: user?.name || stored.name || session.name || session.username || "Akun",
      email: user?.email || stored.email || session.email || "",
      phone: normalizePhoneNumber(user?.phone || stored.phone || session.phone || ""),
      job: formatRoleLabel(role),
      address: user?.address || stored.address || session.address || "",
      photo: user?.photo || user?.profilePhoto || stored.photo || session.profilePhoto || session.photo || "",
      username: user?.username || session.username || stored.username || "",
      role: formatRoleLabel(role)
    };
  }

  function getProfileStorageIdentity() {
    const session = readSession() || {};
    const user = state.users.length ? getCurrentUserRecord() : null;
    const rawIdentity = user?.email || session.email || user?.username || session.username || user?.name || session.name || "akun";
    return normalizeKey(rawIdentity) || "akun";
  }

  function getScopedProfileKey() {
    return `${PROFILE_KEY}.${getProfileStorageIdentity()}`;
  }

  function readScopedProfileData() {
    const scoped = readObject(getScopedProfileKey());
    if (Object.keys(scoped).length) return scoped;

    const legacy = readObject(PROFILE_KEY);
    const legacyIdentity = normalizeKey(legacy.profileKey || legacy.email || legacy.username || "");
    return legacyIdentity && legacyIdentity === getProfileStorageIdentity()
      ? legacy
      : {};
  }

  async function fetchPharmacyProfile(options = {}) {
    hydratePharmacyBrand();
    renderPharmacyIdentity();

    try {
      const payload = await postToApi({ action: "getPharmacyProfile" });
      if (!payload || (payload.success !== true && payload.ok !== true) || !payload.profile) return;

      const profile = normalizePharmacyProfile(payload.profile);
      localStorage.setItem(PHARMACY_PROFILE_KEY, JSON.stringify(profile));
      hydratePharmacyBrand(profile);
      renderPharmacyIdentity(profile);
    } catch (error) {
      if (!options.silent) {
        setProfileStatus(`Identitas apotek online belum dapat dimuat: ${error.message}`, "info");
      }
    }
  }

  function getPharmacyProfile() {
    return normalizePharmacyProfile(readObject(PHARMACY_PROFILE_KEY));
  }

  function normalizePharmacyProfile(value) {
    value = value && typeof value === "object" ? value : {};
    const logo = String(value.logo || value.logoUrl || value.logoData || DEFAULT_PHARMACY_PROFILE.logo).trim();
    const name = String(value.name || value.namaApotek || value.pharmacyName || DEFAULT_PHARMACY_PROFILE.name).trim();
    const address = String(value.address || value.alamat || value.pharmacyAddress || "").trim();

    return {
      logo: normalizePharmacyLogo(logo),
      name: name || DEFAULT_PHARMACY_PROFILE.name,
      address,
      phone: String(value.phone || value.telepon || value.noHp || "").trim(),
      email: String(value.email || "").trim(),
      website: String(value.website || value.social || "").trim(),
      latitude: String(value.latitude || value.lat || "").trim(),
      longitude: String(value.longitude || value.lng || value.lon || "").trim(),
      gpsAccuracy: String(value.gpsAccuracy || value.accuracy || "").trim(),
      licenseNumber: String(value.licenseNumber || value.sia || value.suratIzinApotek || "").trim(),
      licenseExpiry: String(value.licenseExpiry || value.siaExpiry || "").trim(),
      responsiblePharmacist: String(value.responsiblePharmacist || value.apotekerPenanggungJawab || "").trim(),
      sipaNumber: String(value.sipaNumber || value.sipa || "").trim(),
      updatedAt: String(value.updatedAt || "").trim(),
      updatedBy: String(value.updatedBy || "").trim()
    };
  }

  function normalizePharmacyLogo(value) {
    const logo = String(value || "").trim();
    if (/^(data:image\/|https?:\/\/|assets\/)/i.test(logo)) return logo;
    return DEFAULT_PHARMACY_PROFILE.logo;
  }

  function hydratePharmacyBrand(profile = getPharmacyProfile()) {
    const pharmacy = normalizePharmacyProfile(profile);
    const logo = pharmacy.logo || PLATFORM_LOGO;
    const name = pharmacy.name || DEFAULT_PHARMACY_PROFILE.name;
    const subtitle = pharmacy.address || "Sistem Informasi Apotek Digital";

    setImageSource(els.sidebarPharmacyLogo, logo);
    setImageSource(els.homeHeaderPharmacyLogo, logo);
    setImageSource(els.mobileHomePharmacyLogo, logo);
    setImageSource(els.appLoadingLogo, LOADING_LOGO);
    if (els.sidebarPharmacyName) els.sidebarPharmacyName.textContent = name;
    if (els.homeHeaderPharmacyName) els.homeHeaderPharmacyName.textContent = name;
    if (els.mobileHomePharmacyName) els.mobileHomePharmacyName.textContent = name;
    if (els.sidebarPharmacySubtitle) els.sidebarPharmacySubtitle.textContent = subtitle;
    if (els.homeHeaderPharmacySubtitle) els.homeHeaderPharmacySubtitle.textContent = "Sistem Informasi Apotek Digital";
    if (els.mobileHomePharmacySubtitle) els.mobileHomePharmacySubtitle.textContent = subtitle;
    if (els.sidebarPharmacyBrand) els.sidebarPharmacyBrand.setAttribute("aria-label", name);
    document.title = `${name} - Dashboard`;
  }

  function setImageSource(element, src) {
    if (!element) return;
    element.src = src || PLATFORM_LOGO;
  }

  function renderPharmacyIdentity(profile = getPharmacyProfile()) {
    const user = getCurrentUserRecord();
    const isOwner = isOwnerUser(user);
    const current = normalizePharmacyProfile(profile);
    const preview = state.pendingPharmacyLogo !== null
      ? normalizePharmacyProfile({ ...current, logo: state.pendingPharmacyLogo || PLATFORM_LOGO })
      : current;

    renderPharmacyLogoPreview(preview);
    if (els.pharmacyNameInput) els.pharmacyNameInput.value = current.name === DEFAULT_PHARMACY_PROFILE.name ? "" : current.name;
    if (els.pharmacyPhoneInput) els.pharmacyPhoneInput.value = current.phone || "";
    if (els.pharmacyAddressInput) els.pharmacyAddressInput.value = current.address || "";
    if (els.pharmacyLatitudeInput) els.pharmacyLatitudeInput.value = current.latitude || "";
    if (els.pharmacyLongitudeInput) els.pharmacyLongitudeInput.value = current.longitude || "";
    if (els.pharmacyLicenseInput) els.pharmacyLicenseInput.value = current.licenseNumber || "";
    if (els.pharmacyLicenseExpiryInput) els.pharmacyLicenseExpiryInput.value = current.licenseExpiry || "";
    if (els.pharmacyResponsibleInput) els.pharmacyResponsibleInput.value = current.responsiblePharmacist || "";
    if (els.pharmacySipaInput) els.pharmacySipaInput.value = current.sipaNumber || "";
    if (els.pharmacyEmailInput) els.pharmacyEmailInput.value = current.email || "";
    if (els.pharmacyWebsiteInput) els.pharmacyWebsiteInput.value = current.website || "";

    if (els.pharmacyIdentityForm) {
      els.pharmacyIdentityForm.querySelectorAll("input, button").forEach((control) => {
        if (control.hasAttribute("data-profile-panel-close")) return;
        control.disabled = !isOwner;
      });
    }
    syncProfileActivityAccess();
  }

  async function savePharmacyIdentity(event) {
    event.preventDefault();
    const user = getCurrentUserRecord();
    if (!isOwnerUser(user)) {
      setProfileStatus("Identitas apotek hanya dapat diubah oleh Owner.", "error");
      return;
    }

    const current = getPharmacyProfile();
    const profile = normalizePharmacyProfile({
      logo: state.pendingPharmacyLogo !== null ? state.pendingPharmacyLogo : current.logo,
      name: els.pharmacyNameInput?.value || current.name,
      phone: els.pharmacyPhoneInput?.value || "",
      address: els.pharmacyAddressInput?.value || "",
      latitude: els.pharmacyLatitudeInput?.value || "",
      longitude: els.pharmacyLongitudeInput?.value || "",
      gpsAccuracy: current.gpsAccuracy || "",
      licenseNumber: els.pharmacyLicenseInput?.value || "",
      licenseExpiry: els.pharmacyLicenseExpiryInput?.value || "",
      responsiblePharmacist: els.pharmacyResponsibleInput?.value || "",
      sipaNumber: els.pharmacySipaInput?.value || "",
      email: els.pharmacyEmailInput?.value || "",
      website: els.pharmacyWebsiteInput?.value || "",
      updatedAt: new Date().toISOString(),
      updatedBy: user.name || user.username || "Owner"
    });

    if (!profile.name || profile.name === DEFAULT_PHARMACY_PROFILE.name) {
      setProfileStatus("Nama apotek wajib diisi.", "error");
      return;
    }

    const loadingToken = startAppLoading("Menyimpan identitas apotek...", 0);
    let onlineSaved = false;
    let savedProfile = profile;

    try {
      localStorage.setItem(PHARMACY_PROFILE_KEY, JSON.stringify(profile));
      hydratePharmacyBrand(profile);

      try {
        const result = await postToApi({
          action: "savePharmacyProfile",
          profile,
          role: user.role || "",
          username: user.username || user.name || "",
          email: user.email || ""
        });
        if (result && (result.success === true || result.ok === true)) {
          savedProfile = normalizePharmacyProfile(result.profile || profile);
          localStorage.setItem(PHARMACY_PROFILE_KEY, JSON.stringify(savedProfile));
          onlineSaved = true;
        }
      } catch (error) {
        onlineSaved = false;
      }

      await delay(560);
      state.pendingPharmacyLogo = null;
      hydratePharmacyBrand(savedProfile);
      renderPharmacyIdentity(savedProfile);
      addProfileActivity("Identitas apotek diperbarui", `${savedProfile.name} disimpan sebagai identitas homepage`);
      switchProfileTab("profil", { openPanel: false });
      setProfileStatus(
        onlineSaved
          ? "Identitas apotek berhasil disimpan online."
          : "Identitas apotek tersimpan di perangkat ini. Deploy Apps Script terbaru agar tersimpan online.",
        onlineSaved ? "success" : "info"
      );
      showActionToast("Identitas apotek berhasil disimpan.");
    } finally {
      endAppLoading(loadingToken);
    }
  }

  async function handlePharmacyLogoChange(event) {
    const user = getCurrentUserRecord();
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!isOwnerUser(user)) {
      setProfileStatus("Logo apotek hanya dapat diubah oleh Owner.", "error");
      event.target.value = "";
      return;
    }
    if (!/^image\//.test(file.type || "")) {
      setProfileStatus("File logo harus berupa gambar.", "error");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileStatus("Ukuran logo maksimal 2MB.", "error");
      event.target.value = "";
      return;
    }

    const loadingToken = startAppLoading("Menyiapkan logo apotek...", 0);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const logo = await resizePharmacyLogo(dataUrl);
      if (logo.length > 48000) {
        setProfileStatus("Logo masih terlalu besar. Coba gambar yang lebih ringan.", "error");
        return;
      }
      state.pendingPharmacyLogo = logo;
      renderPharmacyLogoPreview();
      setProfileStatus("Logo apotek siap disimpan. Klik Simpan Identitas Apotek.", "info");
    } catch (error) {
      setProfileStatus(`Logo gagal dibaca: ${error.message}`, "error");
    } finally {
      endAppLoading(loadingToken);
      event.target.value = "";
    }
  }

  function removePharmacyLogo() {
    if (!isOwnerUser(getCurrentUserRecord())) {
      setProfileStatus("Logo apotek hanya dapat diubah oleh Owner.", "error");
      return;
    }
    state.pendingPharmacyLogo = "";
    renderPharmacyLogoPreview();
    setProfileStatus("Logo akan kembali ke Indo Apotek setelah disimpan.", "info");
  }

  function renderPharmacyLogoPreview(profile = getPharmacyProfile()) {
    if (!els.pharmacyLogoPreview) return;
    const current = normalizePharmacyProfile(profile);
    const logo = state.pendingPharmacyLogo !== null
      ? normalizePharmacyLogo(state.pendingPharmacyLogo || PLATFORM_LOGO)
      : current.logo;
    els.pharmacyLogoPreview.innerHTML = `<img src="${escapeHtml(logo || PLATFORM_LOGO)}" alt="">`;
  }

  function resizePharmacyLogo(dataUrl) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 220;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let logo = canvas.toDataURL("image/webp", 0.78);
        if (!/^data:image\/webp/i.test(logo)) logo = canvas.toDataURL("image/jpeg", 0.72);
        resolve(logo);
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  async function detectPharmacyGps() {
    if (!isOwnerUser(getCurrentUserRecord())) {
      setProfileStatus("Lokasi apotek hanya dapat diubah oleh Owner.", "error");
      return;
    }
    if (!navigator.geolocation) {
      setProfileStatus("GPS tidak tersedia di browser ini.", "error");
      return;
    }

    const loadingToken = startAppLoading("Mendeteksi lokasi apotek...", 0);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        });
      });
      const lat = Number(position.coords.latitude).toFixed(6);
      const lng = Number(position.coords.longitude).toFixed(6);
      if (els.pharmacyLatitudeInput) els.pharmacyLatitudeInput.value = lat;
      if (els.pharmacyLongitudeInput) els.pharmacyLongitudeInput.value = lng;
      const accuracy = Number(position.coords.accuracy || 0);
      const address = await lookupGpsAddress(lat, lng);
      if (els.pharmacyAddressInput && (!els.pharmacyAddressInput.value.trim() || address)) {
        els.pharmacyAddressInput.value = address || `Lokasi GPS: ${lat}, ${lng}`;
      }
      const current = getPharmacyProfile();
      localStorage.setItem(PHARMACY_PROFILE_KEY, JSON.stringify({
        ...current,
        latitude: lat,
        longitude: lng,
        gpsAccuracy: accuracy ? `${Math.round(accuracy)} m` : ""
      }));
      setProfileStatus(`Lokasi GPS berhasil dideteksi${accuracy ? `, akurasi sekitar ${Math.round(accuracy)} m` : ""}.`, "success");
    } catch (error) {
      setProfileStatus("GPS gagal mendeteksi lokasi. Izinkan akses lokasi lalu coba lagi.", "error");
    } finally {
      endAppLoading(loadingToken);
    }
  }

  async function lookupGpsAddress(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=id`;
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) return "";
      const payload = await response.json();
      return String(payload.display_name || "").trim();
    } catch (error) {
      return "";
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    const loadingToken = startAppLoading("Menyimpan profil...");
    try {
      const currentProfile = getProfileData();
      const currentUser = getCurrentUserRecord();
      const hasPendingPhotoChange = state.pendingProfilePhoto !== null;
      const profile = {
        name: els.profileNameInput.value.trim(),
        email: els.profileEmailInput.value.trim(),
        phone: normalizePhoneNumber(els.profilePhoneInput.value),
        job: currentProfile.role || "Operator",
        address: els.profileAddressInput.value.trim(),
        photo: state.pendingProfilePhoto !== null ? state.pendingProfilePhoto : currentProfile.photo || "",
        profileKey: getProfileStorageIdentity()
      };
      const currentPreferences = Object.keys(currentUser.preferences || {}).length
        ? currentUser.preferences
        : normalizeProfilePreferences(readObject(PROFILE_PREFS_KEY));
      const userPayload = {
        ...currentUser,
        name: profile.name,
        username: currentUser.username || profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        role: currentUser.role || currentProfile.role || "Operator",
        status: currentUser.status || "Aktif",
        access: currentUser.access || [],
        preferences: currentPreferences,
        profilePreferences: currentPreferences,
        profilePhoto: profile.photo,
        photo: profile.photo
      };
      const result = await postToApi({
        action: "saveLoginUser",
        user: userPayload,
        originalUsername: currentUser.username || currentProfile.username || "",
        originalEmail: currentUser.email || currentProfile.email || ""
      });

      if (!result || (result.success !== true && result.ok !== true)) {
        throw new Error(result?.message || "Google Sheet belum menerima perubahan profil.");
      }

      const savedUser = upsertUserRecord(result.user || userPayload, currentUser);
      const session = readSession() || {};
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        ...session,
        name: savedUser.name || profile.name,
        email: savedUser.email || profile.email,
        phone: savedUser.phone || profile.phone,
        address: savedUser.address || profile.address,
        role: savedUser.role || session.role,
        menu: (savedUser.access || []).join(","),
        profilePhoto: savedUser.photo || profile.photo,
        preferences: savedUser.preferences || userPayload.preferences
      }));
      localStorage.setItem(getScopedProfileKey(), JSON.stringify(profile));
      localStorage.removeItem(PROFILE_KEY);
      await delay(hasPendingPhotoChange ? 650 : 540);
      state.pendingProfilePhoto = null;
      state.pendingProfilePhotoName = "";
      syncCurrentUserName(profile.name, profile.email);
      hydrateProfileName();
      renderProfile();
      setProfileStatus("Profil berhasil disimpan", "success");
      addProfileActivity("Profil diperbarui", "Informasi profil disimpan ke Google Sheet");
      closeProfilePanel();
      showActionToast("Profil dan foto berhasil disimpan.");
    } catch (error) {
      setProfileStatus(`Profil gagal disimpan: ${error.message}`, "error");
    } finally {
      endAppLoading(loadingToken);
    }
  }

  async function handleProfilePhotoChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!/^image\//.test(file.type || "")) {
      setProfileStatus("File foto harus berupa gambar.", "error");
      if (els.profilePhotoFileName) els.profilePhotoFileName.textContent = "Belum ada foto dipilih";
      event.target.value = "";
      return;
    }

    const loadingToken = startAppLoading("Menyiapkan foto profil...");
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const photo = await resizeProfilePhoto(dataUrl);

      if (photo.length > 42000) {
        state.pendingProfilePhoto = null;
        state.pendingProfilePhotoName = "";
        if (els.profilePhotoFileName) els.profilePhotoFileName.textContent = "Belum ada foto dipilih";
        setProfileStatus("Foto masih terlalu besar untuk database. Coba foto lain yang lebih kecil.", "error");
        return;
      }

      state.pendingProfilePhoto = photo;
      state.pendingProfilePhotoName = file.name || "foto profil";
      if (els.profilePhotoFileName) els.profilePhotoFileName.textContent = state.pendingProfilePhotoName;
      renderProfile();
      setProfileStatus("Foto profil siap disimpan. Klik Simpan Profil untuk menerapkan perubahan.", "info");
    } catch (error) {
      setProfileStatus(`Foto profil gagal dibaca: ${error.message}`, "error");
    } finally {
      endAppLoading(loadingToken);
      event.target.value = "";
    }
  }

  function removeProfilePhoto() {
    state.pendingProfilePhoto = "";
    state.pendingProfilePhotoName = "Foto akan dihapus";
    if (els.profilePhotoFileName) els.profilePhotoFileName.textContent = "Foto akan dihapus";
    renderProfile();
    setProfileStatus("Foto profil akan dihapus setelah tombol Simpan Profil diklik.", "info");
  }

  function syncCurrentUserName(name, email) {
    const nextName = String(name || "").trim();
    if (!nextName) return;

    const session = readSession() || {};
    const matchKeys = [
      session.username,
      session.email,
      session.name,
      email
    ].map(normalizeSearch).filter(Boolean);

    if (!matchKeys.length) return;

    let changed = false;
    state.users = state.users.map((user) => {
      const userKeys = [user.username, user.email, user.name].map(normalizeSearch).filter(Boolean);
      if (!userKeys.some((key) => matchKeys.includes(key))) return user;
      changed = true;
      return { ...user, name: nextName };
    });

    if (changed) {
      writeStoredArray(USER_KEY, state.users);
      renderUsers();
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("File tidak dapat dibaca."));
      reader.readAsDataURL(file);
    });
  }

  function resizeProfilePhoto(dataUrl) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 128;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.62));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  function renderProfileAvatars(profile) {
    setAvatarContent(document.getElementById("profileAvatar"), profile);
    setAvatarContent(document.getElementById("profileMiniAvatar"), profile);
    setAvatarContent(els.profileLargeAvatar, profile);
  }

  function setAvatarContent(element, profile) {
    if (!element) return;
    const photo = String(profile.photo || "").trim();

    if (/^data:image\//.test(photo)) {
      element.innerHTML = `<img src="${escapeHtml(photo)}" alt="">`;
      element.classList.add("has-photo");
      return;
    }

    element.classList.remove("has-photo");
    element.textContent = getInitials(profile.name);
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
    const loadingToken = startAppLoading("Menyimpan password baru...");

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
      updateProfilePasswordIndicators();
      setProfileStatus("Password baru berhasil disimpan.", "success");
      addProfileActivity("Password diperbarui", "Password akun berhasil disimpan ke Google Sheet");
      closeProfilePanel();
      showActionToast("Password berhasil diubah.");
    } catch (error) {
      setProfileStatus(`Password gagal disimpan: ${error.message}`, "error");
    } finally {
      endAppLoading(loadingToken);
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
    return readObject(PROFILE_SECURITY_KEY);
  }

  function saveProfileSecurity() {
    return false;
  }

  function switchProfileTab(tabName, options) {
    if (!tabName) return;
    if (tabName === "identitas-apotek" && !isOwnerUser(getCurrentUserRecord())) {
      tabName = "profil";
    }
    if (tabName === "shift-absensi" && !canManageAttendanceShift(getCurrentUserRecord())) {
      tabName = "profil";
    }
    const openPanel = options && Object.prototype.hasOwnProperty.call(options, "openPanel")
      ? options.openPanel !== false
      : true;
    els.profileTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.profileTab === tabName));
    els.profilePanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.profilePanel === tabName));
    document.querySelector(".profile-modern-layout")?.classList.toggle("profile-panel-open", openPanel);
    document.body.classList.toggle("profile-panel-modal-open", openPanel);
    setProfileStatus("", "");
  }

  function closeProfilePanel() {
    document.querySelector(".profile-modern-layout")?.classList.remove("profile-panel-open");
    document.body.classList.remove("profile-panel-modal-open");
    setProfileStatus("", "");
  }

  function renderProfileActivity() {
    if (!els.profileActivityList) return;
    const user = getCurrentUserRecord();
    if (!isOwnerUser(user)) {
      els.profileActivityList.innerHTML = "<p>Riwayat aktivitas seluruh user hanya tersedia untuk owner.</p>";
      syncProfileActivityAccess();
      return;
    }

    const remoteActivity = state.ownerActivities.length ? state.ownerActivities : [];
    const localActivity = readStoredArray(PROFILE_ACTIVITY_KEY);
    const activity = remoteActivity.concat(localActivity)
      .map(normalizeActivityRecord)
      .filter((item, index, list) => {
        const key = `${item.at}|${item.title}|${item.actor}|${item.detail}`;
        return list.findIndex((entry) => `${entry.at}|${entry.title}|${entry.actor}|${entry.detail}` === key) === index;
      })
      .slice(0, 12);

    if (!activity.length) {
      els.profileActivityList.innerHTML = "<p>Belum ada aktivitas operator/kasir yang tersimpan di perangkat ini.</p>";
      return;
    }

    els.profileActivityList.innerHTML = activity.map((item) => `
      <article>
        <span><strong>${escapeHtml(item.title || "Aktivitas")}</strong><small>${escapeHtml(item.detail || "")}</small><small>${escapeHtml(item.actor || "")}</small></span>
        <time>${escapeHtml(formatLastUpdated(item.at || new Date().toISOString()).replace("Last updated ", ""))}</time>
      </article>
    `).join("");
  }

  function addProfileActivity(title, detail) {
    const activity = readStoredArray(PROFILE_ACTIVITY_KEY);
    const profile = getProfileData();
    const user = getCurrentUserRecord() || {};
    const entry = {
      title,
      detail,
      actor: `${profile.name || profile.username || "Akun"} - ${profile.role || "Operator"}`,
      role: profile.role || "Operator",
      username: user.username || profile.username || "",
      email: user.email || profile.email || "",
      scope: "account",
      at: new Date().toISOString()
    };
    activity.unshift(entry);
    writeStoredArray(PROFILE_ACTIVITY_KEY, activity.slice(0, 30));
    sendActivityLog(entry);
    renderProfileActivity();
  }

  async function sendActivityLog(entry) {
    try {
      await postToApi({
        action: "saveActivityLog",
        activity: normalizeActivityRecord(entry)
      });
    } catch (error) {
      // Audit tetap tersimpan lokal jika backend Apps Script belum diperbarui.
    }
  }

  function clearProfileActivity() {
    localStorage.removeItem(PROFILE_ACTIVITY_KEY);
    renderProfileActivity();
    setProfileStatus("Riwayat aktivitas perangkat ini sudah dibersihkan.", "success");
    showActionToast("Riwayat aktivitas berhasil dibersihkan.");
  }

  function applyProfilePreferences() {
    const userPrefs = getCurrentUserRecord()?.preferences || {};
    const localPrefs = readObject(PROFILE_PREFS_KEY);
    const prefs = Object.keys(userPrefs).length ? userPrefs : localPrefs;
    const theme = prefs.theme === "dark" ? "dark" : "light";
    document.body.classList.toggle("theme-dark", theme === "dark");
    updateThemeToggle(theme);
    document.body.classList.toggle("compact-dashboard", prefs.compact === true);
    delete document.body.dataset.menuIconSize;
    delete document.body.dataset.menuImageSize;
    delete document.body.dataset.menuFontSize;
    if (els.profileThemeSelect) els.profileThemeSelect.value = theme;
    if (els.profileCompactToggle) els.profileCompactToggle.checked = prefs.compact === true;
    if (els.profileStartDashboardToggle) els.profileStartDashboardToggle.checked = prefs.startDashboard !== false;
  }

  function updateThemeToggle(theme) {
    if (!els.homeThemeToggle) return;
    const isDark = theme === "dark";
    els.homeThemeToggle.classList.toggle("is-dark", isDark);
    els.homeThemeToggle.setAttribute("aria-label", isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    els.homeThemeToggle.title = isDark ? "Mode gelap" : "Mode terang";
  }

  function toggleDashboardTheme() {
    const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";
    saveProfilePreferences({ theme: nextTheme });
  }

  async function saveProfilePreferences(overrides = {}) {
    if (overrides && overrides.type) overrides = {};
    const userPrefs = getCurrentUserRecord()?.preferences || {};
    const localPrefs = readObject(PROFILE_PREFS_KEY);
    const currentPrefs = { ...localPrefs, ...userPrefs };
    const theme = overrides.theme || els.profileThemeSelect?.value || currentPrefs.theme || "light";
    const prefs = {
      theme: theme === "dark" ? "dark" : "light",
      compact: els.profileCompactToggle ? Boolean(els.profileCompactToggle.checked) : currentPrefs.compact === true,
      startDashboard: els.profileStartDashboardToggle ? Boolean(els.profileStartDashboardToggle.checked) : currentPrefs.startDashboard !== false,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(prefs));
    const currentUser = getCurrentUserRecord();
    if (currentUser) {
      currentUser.preferences = prefs;
      upsertUserRecord(currentUser, currentUser);
      postToApi({
        action: "saveLoginUser",
        user: {
          ...currentUser,
          profilePreferences: prefs,
          preferences: prefs
        },
        originalUsername: currentUser.username || "",
        originalEmail: currentUser.email || ""
      }).then((result) => {
        if (result && (result.success === true || result.ok === true)) {
          upsertUserRecord({ ...(result.user || currentUser), preferences: prefs }, currentUser);
        }
      }).catch((error) => {
        console.warn("Preferensi profil belum tersinkron ke Google Sheet:", error);
      });
    }
    applyProfilePreferences();
    setProfileStatus("Preferensi tampilan berhasil disimpan.", "success");
    addProfileActivity("Preferensi tampilan diperbarui", `${prefs.theme === "dark" ? "Tema gelap" : "Tema terang"}, ${prefs.compact ? "mode ringkas aktif" : "mode ringkas nonaktif"}`);
  }

  function renderAttendanceShiftSettings() {
    if (!els.shiftRulesGrid) return;
    if (!canManageAttendanceShift(getCurrentUserRecord())) {
      els.shiftRulesGrid.innerHTML = "";
      return;
    }
    const rules = loadAttendanceShiftRules();
    const dayIcon = `
      <span class="shift-day-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="3"></rect><path d="M8 3v4M16 3v4M4 10h16"></path></svg>
      </span>
    `;
    const renderShiftModeIcon = (shiftKey) => shiftKey === "pagi"
      ? '<span class="shift-mode-icon shift-mode-pagi" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"></path></svg></span>'
      : '<span class="shift-mode-icon shift-mode-sore" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 15.6A8.2 8.2 0 0 1 8.4 4a7 7 0 1 0 11.6 11.6Z"></path></svg></span>';
    const renderShiftField = (dayKey, shiftKey, field, label, value) => `
      <label class="shift-time-field">
        <span>${escapeHtml(label)}</span>
        <span class="shift-input-shell">
          <input type="time" data-shift-day="${dayKey}" data-shift-name="${shiftKey}" data-shift-field="${field}" value="${escapeHtml(value)}">
        </span>
      </label>
    `;

    els.shiftRulesGrid.innerHTML = ATTENDANCE_DAY_LABELS.map(([dayKey, dayLabel]) => {
      const dayRules = rules.days[dayKey] || {};
      const cards = ATTENDANCE_SHIFT_LABELS.map(([shiftKey, shiftLabel]) => {
        const shiftRules = dayRules[shiftKey] || {};

        return `
          <fieldset class="shift-rule-card shift-rule-card-${escapeHtml(shiftKey)}">
            <legend>${renderShiftModeIcon(shiftKey)}${escapeHtml(shiftLabel)}</legend>
            <div class="shift-rule-fields">
              ${renderShiftField(dayKey, shiftKey, "start", "Jam Masuk (jam)", shiftRules.start)}
              ${renderShiftField(dayKey, shiftKey, "deadline", "Batas Datang", shiftRules.deadline)}
              ${renderShiftField(dayKey, shiftKey, "returnStart", "Mulai Absen Pulang", shiftRules.returnStart)}
            </div>
          </fieldset>
        `;
      }).join("");

      return `<section class="shift-day-group"><h4>${dayIcon}${escapeHtml(dayLabel)}</h4><div class="shift-day-cards">${cards}</div></section>`;
    }).join("");
  }

  async function loadAttendanceShiftSettingsFromBackend(options = {}) {
    try {
      const result = await postToApi({ action: "getAttendanceShiftSettings" });
      const remoteRules = result?.settings || result?.rules;
      if (result && (result.success === true || result.ok === true) && remoteRules) {
        const rules = normalizeAttendanceShiftRules(remoteRules);
        localStorage.setItem(ATTENDANCE_SHIFT_RULES_KEY, JSON.stringify(rules));
        renderAttendanceShiftSettings();
      }
    } catch (error) {
      if (!options.silent) {
        setProfileStatus("Pengaturan shift belum bisa diambil dari backend. Pastikan Apps Script terbaru sudah di-deploy.", "error");
      }
    }
  }

  async function saveAttendanceShiftSettings(event) {
    event.preventDefault();
    if (!canManageAttendanceShift(getCurrentUserRecord())) {
      setProfileStatus("Pengaturan shift absensi hanya dapat diubah oleh owner/admin.", "error");
      return;
    }
    const rules = collectAttendanceShiftRules();
    rules.updatedAt = new Date().toISOString();
    const user = getCurrentUserRecord();
    const loadingToken = startAppLoading("Menyimpan pengaturan shift absensi ke backend...", 0);

    try {
      const result = await postToApi({
        action: "saveAttendanceShiftSettings",
        settings: rules,
        username: user.username || user.name || "",
        role: user.role || ""
      });
      if (!result || (result.success !== true && result.ok !== true)) {
        throw new Error(result?.message || "Backend belum menerima pengaturan shift.");
      }

      const savedRules = normalizeAttendanceShiftRules(result.settings || result.rules || rules);
      localStorage.setItem(ATTENDANCE_SHIFT_RULES_KEY, JSON.stringify(savedRules));
      renderAttendanceShiftSettings();
      setProfileStatus("Pengaturan shift absensi berhasil disimpan online dan siap dipakai lintas perangkat.", "success");
      addProfileActivity("Pengaturan shift absensi diperbarui", "Aturan jam datang dan pulang Face ID tersimpan di backend.");
      closeProfilePanel();
      showActionToast("Pengaturan shift berhasil disimpan.");
    } catch (error) {
      setProfileStatus(`${error.message} Pastikan Apps Script terbaru sudah ditempel dan di-deploy.`, "error");
    } finally {
      endAppLoading(loadingToken);
    }
  }

  async function resetAttendanceShiftSettings() {
    if (!canManageAttendanceShift(getCurrentUserRecord())) {
      setProfileStatus("Reset shift absensi hanya dapat dilakukan oleh owner/admin.", "error");
      return;
    }
    const user = getCurrentUserRecord();
    const rules = createDefaultAttendanceShiftRules();
    rules.updatedAt = new Date().toISOString();
    const loadingToken = startAppLoading("Mereset pengaturan shift absensi di backend...", 0);

    try {
      const result = await postToApi({
        action: "saveAttendanceShiftSettings",
        settings: rules,
        username: user.username || user.name || "",
        role: user.role || ""
      });
      if (!result || (result.success !== true && result.ok !== true)) {
        throw new Error(result?.message || "Backend belum menerima reset shift.");
      }

      const savedRules = normalizeAttendanceShiftRules(result.settings || result.rules || rules);
      localStorage.setItem(ATTENDANCE_SHIFT_RULES_KEY, JSON.stringify(savedRules));
      renderAttendanceShiftSettings();
      setProfileStatus("Pengaturan shift absensi dikembalikan ke default dan tersimpan online.", "success");
      addProfileActivity("Pengaturan shift absensi direset", "Aturan absensi Face ID kembali ke jadwal default di backend.");
      closeProfilePanel();
      showActionToast("Pengaturan shift berhasil direset.");
    } catch (error) {
      setProfileStatus(`${error.message} Pastikan Apps Script terbaru sudah ditempel dan di-deploy.`, "error");
    } finally {
      endAppLoading(loadingToken);
    }
  }

  function collectAttendanceShiftRules() {
    const rules = createDefaultAttendanceShiftRules();

    if (!els.shiftRulesGrid) return rules;

    Array.from(els.shiftRulesGrid.querySelectorAll("[data-shift-day][data-shift-name][data-shift-field]")).forEach((input) => {
      const day = input.dataset.shiftDay;
      const shift = input.dataset.shiftName;
      const field = input.dataset.shiftField;

      if (!rules.days[day] || !rules.days[day][shift]) return;

      rules.days[day][shift][field] = field === "lateMinutes"
        ? clampInteger(input.value, 0, 240, rules.days[day][shift][field])
        : sanitizeRuleTime(input.value, rules.days[day][shift][field]);
    });

    ATTENDANCE_DAY_LABELS.forEach(([dayKey]) => {
      ATTENDANCE_SHIFT_LABELS.forEach(([shiftKey]) => {
        const rule = rules.days[dayKey]?.[shiftKey];
        if (!rule) return;
        rule.lateMinutes = calculateLateMinutes(rule.start, rule.deadline, rule.lateMinutes);
      });
    });

    return normalizeAttendanceShiftRules(rules);
  }

  function calculateLateMinutes(start, deadline, fallback) {
    const startMinutes = getTimeMinutes(start);
    const deadlineMinutes = getTimeMinutes(deadline);

    if (startMinutes < 0 || deadlineMinutes < 0) return fallback;

    const diff = deadlineMinutes >= startMinutes
      ? deadlineMinutes - startMinutes
      : deadlineMinutes + 1440 - startMinutes;

    return clampInteger(diff, 0, 240, fallback);
  }

  function getTimeMinutes(value) {
    const match = String(value || "").trim().match(/^(\d{2}):(\d{2})$/);
    if (!match) return -1;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return -1;
    return hour * 60 + minute;
  }

  function loadAttendanceShiftRules() {
    return normalizeAttendanceShiftRules(readObject(ATTENDANCE_SHIFT_RULES_KEY));
  }

  function createDefaultAttendanceShiftRules() {
    const rules = {
      updatedAt: "",
      days: {}
    };

    ATTENDANCE_DAY_LABELS.forEach(([dayKey]) => {
      const isSunday = dayKey === "sunday";
      rules.days[dayKey] = {
        pagi: {
          start: "08:00",
          lateMinutes: isSunday ? 15 : 45,
          deadline: isSunday ? "08:15" : "08:45",
          returnStart: isSunday ? "15:00" : "15:30"
        },
        sore: {
          start: "14:00",
          lateMinutes: 30,
          deadline: "14:30",
          returnStart: "21:00"
        }
      };
    });

    return rules;
  }

  function normalizeAttendanceShiftRules(value) {
    const defaults = createDefaultAttendanceShiftRules();
    const source = value && typeof value === "object" ? value : {};
    const normalized = createDefaultAttendanceShiftRules();
    normalized.updatedAt = String(source.updatedAt || "");

    ATTENDANCE_DAY_LABELS.forEach(([dayKey]) => {
      ATTENDANCE_SHIFT_LABELS.forEach(([shiftKey]) => {
        const sourceRule = source.days?.[dayKey]?.[shiftKey] || {};
        const defaultRule = defaults.days[dayKey][shiftKey];

        normalized.days[dayKey][shiftKey] = {
          start: sanitizeRuleTime(sourceRule.start, defaultRule.start),
          lateMinutes: clampInteger(sourceRule.lateMinutes, 0, 240, defaultRule.lateMinutes),
          deadline: sanitizeRuleTime(sourceRule.deadline, defaultRule.deadline),
          returnStart: sanitizeRuleTime(sourceRule.returnStart, defaultRule.returnStart)
        };
      });
    });

    return normalized;
  }

  function sanitizeRuleTime(value, fallback) {
    const text = String(value || "").trim();
    const match = text.match(/^(\d{1,2})[:.](\d{2})$/);
    if (!match) return fallback;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function clampInteger(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function syncProfileActivityAccess() {
    const user = getCurrentUserRecord();
    const canManageShift = canManageAttendanceShift(user);
    const activityTab = els.profileTabButtons.find((button) => button.dataset.profileTab === "aktivitas");
    const activityPanel = els.profilePanels.find((panel) => panel.dataset.profilePanel === "aktivitas");
    const shiftTab = els.profileTabButtons.find((button) => button.dataset.profileTab === "shift-absensi");
    const shiftPanel = els.profilePanels.find((panel) => panel.dataset.profilePanel === "shift-absensi");
    const pharmacyTab = els.profileTabButtons.find((button) => button.dataset.profileTab === "identitas-apotek");
    const pharmacyPanel = els.profilePanels.find((panel) => panel.dataset.profilePanel === "identitas-apotek");
    const isOwner = isOwnerUser(user);

    if (activityTab) activityTab.hidden = true;
    if (activityPanel) activityPanel.hidden = true;
    if (shiftTab) shiftTab.hidden = !canManageShift;
    if (shiftPanel) shiftPanel.hidden = !canManageShift;
    if (pharmacyTab) pharmacyTab.hidden = !isOwner;
    if (pharmacyPanel) pharmacyPanel.hidden = !isOwner;

    if ((activityTab?.classList.contains("is-active")) ||
        (!isOwner && pharmacyTab?.classList.contains("is-active")) ||
        (!canManageShift && shiftTab?.classList.contains("is-active"))) {
      switchProfileTab("profil", { openPanel: false });
    }
  }

  function setProfileStatus(message, type) {
    if (!els.profileStatusText) return;
    els.profileStatusText.textContent = message || "";
    if (type) els.profileStatusText.dataset.type = type;
    else els.profileStatusText.removeAttribute("data-type");
  }

  async function fetchAttendanceRecords(options = {}) {
    ensureAttendanceFilterDefaults();
    const user = getCurrentUserRecord();
    const identity = getAttendanceIdentity(user);
    const attendanceName = resolveAttendanceEmployeeName(user);

    try {
      if (options.manual && els.attendanceStatusText) {
        els.attendanceStatusText.textContent = "Menyinkronkan catatan kehadiran...";
      }

      const payload = await getAbsensiRecords({
        action: "listAttendanceRecords",
        role: user.role || "",
        username: user.username || "",
        name: attendanceName || identity.name,
        nama: attendanceName || identity.name,
        nama_karyawan: attendanceName || identity.name,
        email: identity.email,
        limit: 1000
      });

      if (!Array.isArray(payload.records) && !Array.isArray(payload.data)) {
        throw new Error("Endpoint listAttendanceRecords belum aktif di Apps Script absensi.");
      }

      const records = Array.isArray(payload.records)
        ? payload.records
        : (Array.isArray(payload.data) ? payload.data : []);

      state.attendanceRecords = records.map(normalizeAttendanceRecord).filter((record) => record.name);
      state.attendanceGroups = buildAttendanceGroups(state.attendanceRecords);
      renderAttendanceDashboard();

      if (els.attendanceStatusText) {
        els.attendanceStatusText.textContent = options.manual
          ? "Catatan kehadiran berhasil disinkronkan."
          : "Catatan kehadiran tersinkron dengan Google Sheet.";
      }
    } catch (error) {
      if (!options.silent) {
        console.warn("Gagal memuat catatan presensi:", error);
      }
      if (els.attendanceStatusText) {
        els.attendanceStatusText.textContent = "Endpoint presensi belum bisa diakses. Pastikan Apps Script absensi sudah diperbarui.";
      }
      renderAttendanceDashboard();
    }
  }

  async function postToAbsensiApi(payload) {
    const response = await fetch(ABSENSI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  async function getAbsensiRecords(params) {
    const url = new URL(ABSENSI_API_URL);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    const response = await fetch(url.toString(), { cache: "no-store" });
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  function ensureAttendanceFilterDefaults() {
    const today = getTodayDateKey();
    const month = getCurrentMonthValue();
    const year = String(new Date().getFullYear());

    if (!state.attendanceDate) state.attendanceDate = today;
    if (!state.attendanceMonth) state.attendanceMonth = month;
    if (!state.attendanceYear) state.attendanceYear = year;
    if (els.attendanceDateFilter && !els.attendanceDateFilter.value) els.attendanceDateFilter.value = state.attendanceDate;
    if (els.attendanceMonthFilter) els.attendanceMonthFilter.value = state.attendanceMonth;
    populateAttendanceYearFilter();
  }

  function populateAttendanceYearFilter() {
    if (!els.attendanceYearFilter || els.attendanceYearFilter.options.length) return;
    const current = new Date().getFullYear();
    els.attendanceYearFilter.innerHTML = Array.from({ length: 5 }, (_, index) => {
      const year = current - 2 + index;
      return `<option value="${year}">${year}</option>`;
    }).join("");
    els.attendanceYearFilter.value = state.attendanceYear || String(current);
  }

  function normalizeAttendanceRecord(record) {
    const timestamp = String(record.timestamp || record.Timestamp || "").trim();
    const date = normalizeAttendanceDateKey(record.date || record.tanggal_absen || record.tanggalAbsen || record.tanggal || record.Tanggal, timestamp);
    const timestampTime = formatJakartaTimeFromTimestamp(timestamp);
    const time = timestampTime || normalizeAttendanceTime(record.time || record.jam_absen || record.jamAbsen || record.jam || record.Jam, timestamp);
    const status = normalizeAttendanceStatus(record.status || record.status_kehadiran || record.jenis_absen || record.jenisAbsen);
    const name = String(record.nama || record.nama_karyawan || record.namaKaryawan || record.name || "").trim();

    return {
      rowNumber: Number(record.rowNumber || record.row || record._row || 0),
      timestamp,
      date,
      time,
      name,
      status,
      shift: normalizeAttendanceShift(record.shift || record.Shift),
      warningMessage: String(record.warningMessage || record.attendance_warning || record.attendanceWarning || "").trim(),
      warningFlag: normalizeSearch(record.warningFlag || record.attendance_flag || record.attendanceFlag || "")
    };
  }

  function buildAttendanceGroups(records) {
    const map = new Map();

    records.forEach((record) => {
      if (!record.name || !record.date) return;
      const isOvertime = record.status === "LEMBUR";
      const key = isOvertime
        ? `${normalizeSearch(record.name)}|${record.date}|lembur|${normalizeSearch(record.shift) || "shift"}|${record.rowNumber || record.time}`
        : `${normalizeSearch(record.name)}|${record.date}|regular`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          isOvertime,
          name: record.name,
          date: record.date,
          shift: record.shift || "",
          datang: "",
          pulang: "",
          lembur: "",
          datangRow: 0,
          pulangRow: 0,
          lemburRow: 0,
          warningMessage: "",
          warningFlag: "",
          records: []
        });
      }

      const item = map.get(key);
      item.records.push(record);
      if (record.warningMessage && !item.warningMessage) item.warningMessage = record.warningMessage;
      if (record.warningFlag && !item.warningFlag) item.warningFlag = record.warningFlag;

      if (record.status === "PULANG") {
        if (!item.pulang || record.time > item.pulang) {
          item.pulang = record.time;
          item.pulangRow = record.rowNumber;
        }
        return;
      }

      if (record.status === "LEMBUR") {
        item.isOvertime = true;
        if (record.shift) item.shift = record.shift;
        if (!item.lembur || record.time > item.lembur) {
          item.lembur = record.time;
          item.lemburRow = record.rowNumber;
        }
        return;
      }

      if (record.shift && !item.shift) item.shift = record.shift;
      if (!item.datang || record.time < item.datang) {
        item.datang = record.time;
        item.datangRow = record.rowNumber;
      }
    });

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        shift: group.shift || inferAttendanceShift(group.datang),
        duration: calculateAttendanceDuration(group.datang, group.pulang),
        statusLabel: getAttendanceStatusLabel(group)
      }))
      .sort((a, b) => (`${b.date} ${getAttendanceGroupSortTime(b)}`).localeCompare(`${a.date} ${getAttendanceGroupSortTime(a)}`));
  }

  function renderAttendanceDashboard() {
    if (!els.attendanceTableBody) return;
    ensureAttendanceFilterDefaults();
    const user = getCurrentUserRecord();
    const canEdit = isAdminUser(user);
    const visibleGroups = getVisibleAttendanceGroups();
    const selectedDate = state.attendanceDate || getTodayDateKey();
    const todayGroups = visibleGroups.filter((group) => group.date === selectedDate);
    const monthGroups = visibleGroups.filter((group) => group.date.slice(0, 7) === `${state.attendanceYear}-${state.attendanceMonth}`);
    const employees = getVisibleAttendanceEmployees();
    const employeeCount = employees.length || countUniqueNames(visibleGroups);
    const regularTodayGroups = todayGroups.filter((group) => !group.isOvertime);
    const regularMonthGroups = monthGroups.filter((group) => !group.isOvertime);
    const presentToday = regularTodayGroups.filter((group) => group.datang).length;
    const lateToday = todayGroups.filter((group) => isLateAttendance(group)).length;
    const absentToday = Math.max(0, employeeCount - presentToday);
    const workDays = countWorkDaysInMonth(Number(state.attendanceYear), Number(state.attendanceMonth));
    const pagi = regularMonthGroups.filter((group) => group.datang && normalizeSearch(group.shift).includes("pagi")).length;
    const sore = regularMonthGroups.filter((group) => group.datang && normalizeSearch(group.shift).includes("sore")).length;
    const shiftTotal = Math.max(1, pagi + sore);

    document.body.classList.toggle("attendance-can-edit", canEdit);
    if (els.attendanceActionHeader) els.attendanceActionHeader.hidden = !canEdit;
    setText(els.attendanceTotalEmployees, formatNumber(employeeCount));
    setText(els.attendancePresentToday, formatNumber(presentToday));
    setText(els.attendanceLateToday, formatNumber(lateToday));
    setText(els.attendanceAbsentToday, formatNumber(absentToday));
    setText(els.attendanceWorkDays, `${formatNumber(workDays)} Hari`);
    setText(els.attendanceWorkDaysSide, `${formatNumber(workDays)} Hari`);
    setText(els.attendanceMonthTitle, `${getMonthName(state.attendanceMonth)} ${state.attendanceYear}`);
    setText(els.attendanceShiftPagi, `${formatNumber(pagi)} Hari`);
    setText(els.attendanceShiftSore, `${formatNumber(sore)} Hari`);
    if (els.attendanceShiftPagi?.nextElementSibling) els.attendanceShiftPagi.nextElementSibling.style.setProperty("--bar", `${Math.round((pagi / shiftTotal) * 100)}%`);
    if (els.attendanceShiftSore?.nextElementSibling) els.attendanceShiftSore.nextElementSibling.style.setProperty("--bar", `${Math.round((sore / shiftTotal) * 100)}%`);

    renderAttendanceTable(todayGroups, canEdit);
    renderAttendanceMonthlyTable(monthGroups, employees, workDays);
    renderSalarySlipSummary();
  }

  function renderAttendanceTable(groups, canEdit) {
    if (!els.attendanceTableBody) return;

    if (!groups.length) {
      els.attendanceTableBody.innerHTML = `<tr><td class="empty-table-cell" colspan="${canEdit ? 8 : 7}">Belum ada catatan kehadiran pada tanggal ini.</td></tr>`;
      setText(els.attendanceTableInfo, "Menampilkan 0 catatan.");
      return;
    }

    els.attendanceTableBody.innerHTML = groups.map((group) => {
      const actionCell = canEdit && !group.isOvertime
        ? `<td class="attendance-action-cell"><button class="icon-button attendance-edit-button" type="button" data-attendance-key="${escapeHtml(group.key)}" aria-label="Edit presensi ${escapeHtml(group.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg></button></td>`
        : canEdit ? `<td class="attendance-action-cell"></td>` : "";
      const displayDatang = group.isOvertime ? (group.lembur || "-") : (group.datang || "-");
      const displayPulang = group.isOvertime ? "-" : (group.pulang || "-");
      const displayDuration = group.isOvertime ? "-" : (group.duration || "-");
      return `
        <tr>
          <td><strong>${escapeHtml(group.name)}</strong></td>
          <td>${escapeHtml(formatAttendanceDate(group.date))}</td>
          <td><span class="attendance-shift-pill ${normalizeSearch(group.shift).includes("sore") ? "is-sore" : "is-pagi"}">${escapeHtml(group.shift || "-")}</span></td>
          <td>${escapeHtml(displayDatang)}</td>
          <td>${escapeHtml(displayPulang)}</td>
          <td>${escapeHtml(displayDuration)}</td>
          <td class="attendance-status-cell">${renderAttendanceStatus(group)}</td>
          ${actionCell}
        </tr>
      `;
    }).join("");
    setText(els.attendanceTableInfo, `Menampilkan ${formatNumber(groups.length)} catatan pada ${formatAttendanceDate(state.attendanceDate)}.`);
  }

  function renderAttendanceMonthlyTable(monthGroups, employees, workDays) {
    if (!els.attendanceMonthlyTableBody) return;
    const employeeNames = employees.map((employee) => employee.name).filter(Boolean);
    const names = employeeNames.length
      ? employeeNames
      : Array.from(new Set(monthGroups.map((group) => group.name))).sort((a, b) => a.localeCompare(b));

    if (!names.length) {
      els.attendanceMonthlyTableBody.innerHTML = `<tr><td class="empty-table-cell" colspan="9">Belum ada data rekap bulanan.</td></tr>`;
      setText(els.attendanceMonthlyInfo, "Menampilkan 0 karyawan.");
      return;
    }

    els.attendanceMonthlyTableBody.innerHTML = names.map((name) => {
      const groups = monthGroups.filter((group) => normalizeSearch(group.name) === normalizeSearch(name));
      const regularGroups = groups.filter((group) => !group.isOvertime);
      const hadir = regularGroups.filter((group) => group.datang).length;
      const terlambat = regularGroups.filter(isLateAttendance).length;
      const tidakHadir = Math.max(0, workDays - hadir);
      const pagi = regularGroups.filter((group) => group.datang && normalizeSearch(group.shift).includes("pagi")).length;
      const sore = regularGroups.filter((group) => group.datang && normalizeSearch(group.shift).includes("sore")).length;
      const lembur = groups.filter((group) => group.lembur).length;
      const percent = workDays > 0 ? Math.round((hadir / workDays) * 1000) / 10 : 0;
      return `<tr><td>${escapeHtml(name)}</td><td>${formatNumber(workDays)}</td><td>${formatNumber(hadir)}</td><td>${formatNumber(terlambat)}</td><td>${formatNumber(tidakHadir)}</td><td>${formatNumber(pagi)}</td><td>${formatNumber(sore)}</td><td>${formatNumber(lembur)}</td><td>${percent}%</td></tr>`;
    }).join("");
    setText(els.attendanceMonthlyInfo, `Menampilkan ${formatNumber(names.length)} karyawan untuk ${getMonthName(state.attendanceMonth)} ${state.attendanceYear}.`);
  }

  function getVisibleAttendanceGroups() {
    const user = getCurrentUserRecord();
    if (isAdminUser(user)) return state.attendanceGroups.slice();
    const keys = getAttendanceIdentityKeys(user);
    getVisibleAttendanceEmployees().forEach((employee) => {
      if (employee.name) keys.add(normalizeSearch(employee.name));
    });
    return state.attendanceGroups.filter((group) => keys.has(normalizeSearch(group.name)));
  }

  function getVisibleAttendanceEmployees() {
    const user = getCurrentUserRecord();
    const employees = state.employees.length
      ? state.employees
      : state.users.map((item) => ({ name: item.name, email: item.email, phone: item.phone, job: item.role }));
    if (isAdminUser(user)) return employees.filter((employee) => employee.name);
    const keys = getAttendanceIdentityKeys(user);
    const filtered = employees.filter((employee) => {
      return [employee.name, employee.email, employee.phone].some((value) => keys.has(normalizeSearch(value)));
    });
    return filtered.length ? filtered : [{ name: user.name || user.username || "Akun" }];
  }

  function handleAttendanceTableAction(event) {
    const button = event.target.closest("[data-attendance-key]");
    if (!button) return;
    if (!isAdminUser(getCurrentUserRecord())) return;
    const group = state.attendanceGroups.find((item) => item.key === button.dataset.attendanceKey);
    if (group) openAttendanceEditModal(group);
  }

  function openAttendanceEditModal(group) {
    if (!els.attendanceEditModal || !group) return;
    state.editingAttendanceGroup = group;
    if (els.attendanceEditName) els.attendanceEditName.value = group.name || "";
    if (els.attendanceEditDate) els.attendanceEditDate.value = group.date || getTodayDateKey();
    if (els.attendanceEditShift) els.attendanceEditShift.value = normalizeSearch(group.shift).includes("sore") ? "Sore" : "Pagi";
    if (els.attendanceEditDatang) els.attendanceEditDatang.value = group.datang || "";
    if (els.attendanceEditPulang) els.attendanceEditPulang.value = group.pulang || "";
    if (els.attendanceEditWarning) els.attendanceEditWarning.value = group.warningMessage || "";
    if (els.attendanceEditStatus) els.attendanceEditStatus.textContent = "Perubahan disimpan langsung ke Google Sheet absensi.";
    els.attendanceEditModal.hidden = false;
    document.body.classList.add("dashboard-modal-open");
  }

  function closeAttendanceEditModal() {
    if (els.attendanceEditModal) els.attendanceEditModal.hidden = true;
    state.editingAttendanceGroup = null;
    syncModalOpenState();
  }

  async function saveAttendanceEdit(event) {
    event.preventDefault();
    const user = getCurrentUserRecord();
    if (!isAdminUser(user) || !state.editingAttendanceGroup) return;
    const token = startAppLoading("Menyimpan catatan kehadiran...", 0);

    try {
      const group = state.editingAttendanceGroup;
      const payload = await postToAbsensiApi({
        action: "updateAttendanceRecord",
        role: user.role || "",
        username: user.username || user.name || "",
        name: els.attendanceEditName?.value || group.name,
        date: els.attendanceEditDate?.value || group.date,
        shift: els.attendanceEditShift?.value || group.shift,
        jamDatang: els.attendanceEditDatang?.value || "",
        jamPulang: els.attendanceEditPulang?.value || "",
        datangRow: group.datangRow || 0,
        pulangRow: group.pulangRow || 0,
        warningMessage: els.attendanceEditWarning?.value || "",
        warningFlag: els.attendanceEditWarning?.value ? "manual_note" : "",
        updatedBy: user.name || user.username || "Admin"
      });

      if (!payload || (payload.ok !== true && payload.success !== true)) {
        throw new Error(payload?.message || payload?.error || "Catatan kehadiran gagal disimpan.");
      }

      if (els.attendanceEditStatus) els.attendanceEditStatus.textContent = "Catatan berhasil disimpan online.";
      closeAttendanceEditModal();
      await fetchAttendanceRecords({ manual: true });
      showActionToast("Catatan kehadiran berhasil diubah.");
    } catch (error) {
      if (els.attendanceEditStatus) els.attendanceEditStatus.textContent = error.message || "Catatan kehadiran gagal disimpan.";
    } finally {
      endAppLoading(token);
    }
  }

  async function fetchPayrollEmployees(options = {}) {
    const user = getCurrentUserRecord();
    const canManage = isAdminUser(user);

    [els.payrollEmployeeCard, els.salarySlipCard].forEach((card) => {
      if (card) card.hidden = !canManage;
    });
    if (els.salarySlipHistoryCard) els.salarySlipHistoryCard.hidden = false;

    if (!canManage) return;

    try {
      if (options.manual && els.payrollStatusText) els.payrollStatusText.textContent = "Menyinkronkan data gaji...";
      const payload = await getAbsensiRecords({
        action: "listPayrollEmployees",
        role: user.role || "",
        username: user.username || user.name || ""
      });

      if (!payload || (payload.ok !== true && payload.success !== true) || !Array.isArray(payload.employees)) {
        throw new Error(payload?.message || "Endpoint data gaji belum aktif.");
      }

      state.payrollEndpointReady = true;
      state.payrollEmployees = (Array.isArray(payload.employees) ? payload.employees : [])
        .map(normalizePayrollEmployee)
        .filter((employee) => employee.nip || employee.name);
      renderPayrollTable();
      populateSalarySlipControls();
      renderSalarySlipSummary();
      if (els.payrollStatusText) els.payrollStatusText.textContent = `Menampilkan ${formatNumber(state.payrollEmployees.length)} data gaji karyawan.`;
    } catch (error) {
      console.warn("Gagal memuat data gaji:", error);
      state.payrollEndpointReady = false;
      if (els.payrollStatusText) els.payrollStatusText.textContent = `${error.message || "Data gaji gagal dimuat."} Pastikan Apps Script absensi sudah diperbarui.`;
      state.payrollEmployees = [];
      renderPayrollTable();
      populateSalarySlipControls();
      renderSalarySlipSummary();
    }
  }

  function renderPayrollTable() {
    if (!els.payrollTableBody) return;
    if (els.payrollAddButton) els.payrollAddButton.disabled = !state.payrollEndpointReady;

    if (!state.payrollEmployees.length) {
      const message = state.payrollEndpointReady
        ? "Belum ada data gaji karyawan."
        : "Endpoint data gaji belum aktif. Update Apps Script absensi terlebih dahulu.";
      els.payrollTableBody.innerHTML = `<tr><td class="empty-table-cell" colspan="12">${escapeHtml(message)}</td></tr>`;
      return;
    }

    els.payrollTableBody.innerHTML = state.payrollEmployees.map((employee, index) => `
      <tr>
        <td>${escapeHtml(employee.nip || "-")}</td>
        <td><strong>${escapeHtml(employee.name || "-")}</strong></td>
        <td>${escapeHtml(employee.job || "-")}</td>
        <td>${formatPayrollRate(employee.baseSalary, employee.baseSalaryMode)}</td>
        <td>${formatPayrollRate(employee.mealAllowance, employee.mealAllowanceMode)}</td>
        <td>${formatPayrollRate(employee.overtime, employee.overtimeMode)}</td>
        <td>${formatPayrollRate(employee.allowance, employee.allowanceMode)}</td>
        <td>${formatPayrollMoney(employee.bonus)}</td>
        <td>${formatPayrollMoney(employee.loan)}</td>
        <td>${formatPayrollMoney(employee.debt)}</td>
        <td>${formatPayrollMoney(employee.other)}</td>
        <td>
          <div class="row-actions">
            <button class="table-action table-action-edit" type="button" data-payroll-action="edit" data-index="${index}" aria-label="Edit data gaji">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg>
            </button>
            <button class="table-action table-action-delete" type="button" data-payroll-action="delete" data-index="${index}" aria-label="Hapus data gaji">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 15H6L5 6"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function handlePayrollTableAction(event) {
    const button = event.target.closest("[data-payroll-action]");
    if (!button || !isAdminUser(getCurrentUserRecord())) return;

    const index = Number(button.dataset.index);
    const employee = state.payrollEmployees[index] || {};

    if (button.dataset.payrollAction === "edit") openPayrollModal(index);
    if (button.dataset.payrollAction === "delete") openDeleteModal("payroll", index, `data gaji ${employee.name || employee.nip || "karyawan"}`);
  }

  function openPayrollModal(index) {
    if (!els.payrollModal || !isAdminUser(getCurrentUserRecord())) return;

    state.payrollEditingIndex = index;
    const employee = state.payrollEmployees[index] || {};
    if (els.payrollModalTitle) els.payrollModalTitle.textContent = index >= 0 ? "Edit Data Gaji" : "Tambah Data Gaji";
    setPayrollModalStatus("Data tersimpan ke sheet data_karyawan.", "info");

    setInputValue(els.payrollNipInput, employee.nip);
    setInputValue(els.payrollNameInput, employee.name);
    setInputValue(els.payrollJobInput, employee.job);
    setPayrollMoneyInputValue(els.payrollBaseSalaryInput, employee.baseSalary);
    setInputValue(els.payrollBaseSalaryModeSelect, normalizePayrollMode(employee.baseSalaryMode, "monthly"));
    setPayrollMoneyInputValue(els.payrollMealAllowanceInput, employee.mealAllowance);
    setInputValue(els.payrollMealAllowanceModeSelect, normalizePayrollMode(employee.mealAllowanceMode, "daily"));
    setPayrollMoneyInputValue(els.payrollOvertimeInput, employee.overtime);
    setInputValue(els.payrollOvertimeModeSelect, normalizePayrollMode(employee.overtimeMode, "daily"));
    setPayrollMoneyInputValue(els.payrollAllowanceInput, employee.allowance);
    setInputValue(els.payrollAllowanceModeSelect, normalizePayrollMode(employee.allowanceMode, "monthly"));
    setPayrollMoneyInputValue(els.payrollBonusInput, employee.bonus);
    setPayrollMoneyInputValue(els.payrollLoanInput, employee.loan);
    setPayrollMoneyInputValue(els.payrollDebtInput, employee.debt);
    setPayrollMoneyInputValue(els.payrollOtherInput, employee.other);
    showModal(els.payrollModal);
  }

  function closePayrollModal() {
    state.payrollEditingIndex = -1;
    hideModal(els.payrollModal);
  }

  async function savePayrollEmployee(event) {
    event.preventDefault();
    if (!isAdminUser(getCurrentUserRecord())) return;
    if (!state.payrollEndpointReady) {
      setPayrollModalStatus("Endpoint data gaji belum aktif. Update Apps Script absensi terlebih dahulu.", "error");
      return;
    }

    const user = getCurrentUserRecord();
    const index = state.payrollEditingIndex;
    const original = state.payrollEmployees[index] || {};
    const employee = getPayrollFormData();
    const token = startAppLoading("Menyimpan data gaji...", 0);

    try {
      if (!employee.nip || !employee.name) throw new Error("NIP dan nama karyawan wajib diisi.");

      const result = await postToAbsensiApi({
        action: "savePayrollEmployee",
        role: user.role || "",
        username: user.username || user.name || "",
        originalNip: original.nip || "",
        originalName: original.name || "",
        employee
      });

      if (!result || (result.ok !== true && result.success !== true)) {
        throw new Error(result?.message || "Data gaji gagal disimpan.");
      }

      setPayrollModalStatus("Data gaji berhasil disimpan.", "success");
      upsertPayrollEmployee(result.employee || employee, index);
      closePayrollModal();
      renderPayrollTable();
      populateSalarySlipControls();
      renderSalarySlipSummary();
      if (els.payrollStatusText) els.payrollStatusText.textContent = `Data gaji ${employee.name || employee.nip} berhasil disimpan.`;
      showActionToast("Data gaji berhasil disimpan.");
    } catch (error) {
      setPayrollModalStatus(error.message || "Data gaji gagal disimpan.", "error");
    } finally {
      endAppLoading(token);
    }
  }

  function getPayrollFormData() {
    return {
      nip: String(els.payrollNipInput?.value || "").trim(),
      name: String(els.payrollNameInput?.value || "").trim(),
      job: String(els.payrollJobInput?.value || "").trim(),
      baseSalary: parsePayrollNumber(els.payrollBaseSalaryInput?.value),
      baseSalaryMode: normalizePayrollMode(els.payrollBaseSalaryModeSelect?.value, "monthly"),
      mealAllowance: parsePayrollNumber(els.payrollMealAllowanceInput?.value),
      mealAllowanceMode: normalizePayrollMode(els.payrollMealAllowanceModeSelect?.value, "daily"),
      overtime: parsePayrollNumber(els.payrollOvertimeInput?.value),
      overtimeMode: normalizePayrollMode(els.payrollOvertimeModeSelect?.value, "daily"),
      allowance: parsePayrollNumber(els.payrollAllowanceInput?.value),
      allowanceMode: normalizePayrollMode(els.payrollAllowanceModeSelect?.value, "monthly"),
      bonus: parsePayrollNumber(els.payrollBonusInput?.value),
      loan: parsePayrollNumber(els.payrollLoanInput?.value),
      debt: parsePayrollNumber(els.payrollDebtInput?.value),
      other: parsePayrollNumber(els.payrollOtherInput?.value)
    };
  }

  function upsertPayrollEmployee(value, fallbackIndex) {
    const employee = normalizePayrollEmployee(value || {});
    if (!employee.nip && !employee.name) return;

    const key = normalizeSearch(employee.nip || employee.name);
    const existingIndex = state.payrollEmployees.findIndex((item) => {
      return normalizeSearch(item.nip || item.name) === key
        || (employee.name && normalizeSearch(item.name) === normalizeSearch(employee.name));
    });
    const targetIndex = existingIndex >= 0 ? existingIndex : Number(fallbackIndex);

    if (targetIndex >= 0 && targetIndex < state.payrollEmployees.length) {
      state.payrollEmployees[targetIndex] = {
        ...state.payrollEmployees[targetIndex],
        ...employee
      };
      return;
    }

    state.payrollEmployees.push(employee);
  }

  function setPayrollModalStatus(message, type) {
    if (!els.payrollModalStatus) return;
    els.payrollModalStatus.textContent = message || "";
    els.payrollModalStatus.dataset.type = type || "info";
  }

  function populateSalarySlipControls() {
    const now = new Date();

    if (els.salarySlipEmployeeSelect) {
      const current = els.salarySlipEmployeeSelect.value;
      els.salarySlipEmployeeSelect.innerHTML = state.payrollEmployees.length
        ? state.payrollEmployees.map((employee) => `<option value="${escapeHtml(employee.nip || employee.name)}">${escapeHtml(employee.name || employee.nip)}${employee.nip ? ` - ${escapeHtml(employee.nip)}` : ""}</option>`).join("")
        : `<option value="">Belum ada data gaji</option>`;
      if (current && Array.from(els.salarySlipEmployeeSelect.options).some((option) => option.value === current)) {
        els.salarySlipEmployeeSelect.value = current;
      }
    }

    if (els.salarySlipMonthSelect && !els.salarySlipMonthSelect.dataset.ready) {
      els.salarySlipMonthSelect.value = String(now.getMonth() + 1).padStart(2, "0");
      els.salarySlipMonthSelect.dataset.ready = "1";
    }

    if (els.salarySlipYearSelect && !els.salarySlipYearSelect.options.length) {
      const currentYear = now.getFullYear();
      els.salarySlipYearSelect.innerHTML = Array.from({ length: 5 }, (_, index) => {
        const year = currentYear - 2 + index;
        return `<option value="${year}">${year}</option>`;
      }).join("");
      els.salarySlipYearSelect.value = String(currentYear);
    }
  }

  function renderSalarySlipSummary() {
    if (!els.salarySlipSummary) return;

    const employee = getSelectedPayrollEmployee();
    if (!employee) {
      state.salarySlipUrl = "";
      els.salarySlipSummary.innerHTML = `<span>Belum ada karyawan terpilih.</span>`;
      if (els.generateSalarySlipButton) els.generateSalarySlipButton.disabled = true;
      if (els.openSalarySlipButton) els.openSalarySlipButton.disabled = true;
      return;
    }

    if (els.generateSalarySlipButton) els.generateSalarySlipButton.disabled = !state.payrollEndpointReady;
    const summary = calculateSalarySlipPreview(employee);
    els.salarySlipSummary.innerHTML = `
      <span><small>Hadir</small><strong>${formatNumber(summary.present)} Hari</strong></span>
      <span><small>Hadir Lengkap</small><strong>${formatNumber(summary.completeDays)} Hari</strong></span>
      <span><small>Lembur</small><strong>${formatNumber(summary.overtimeDays)} Hari</strong></span>
      <span><small>Terlambat</small><strong>${formatNumber(summary.late)} Hari</strong></span>
      <span><small>Shift Pagi</small><strong>${formatNumber(summary.shiftPagi)} Hari</strong></span>
      <span><small>Shift Sore</small><strong>${formatNumber(summary.shiftSore)} Hari</strong></span>
      <span><small>Estimasi Bersih</small><strong>${formatPayrollMoney(summary.netSalary)}</strong></span>
    `;
  }

  function calculateSalarySlipPreview(employee) {
    const monthKey = `${els.salarySlipYearSelect?.value || state.attendanceYear || new Date().getFullYear()}-${els.salarySlipMonthSelect?.value || state.attendanceMonth || getCurrentMonthValue()}`;
    const groups = state.attendanceGroups.filter((group) => {
      return normalizeSearch(group.name) === normalizeSearch(employee.name) && String(group.date || "").startsWith(monthKey);
    });
    const regularGroups = groups.filter((group) => !group.isOvertime);
    const present = regularGroups.filter((group) => group.datang).length;
    const completeDays = regularGroups.filter((group) => group.datang && group.pulang).length;
    const overtimeDays = groups.filter((group) => group.lembur).length;
    const late = regularGroups.filter(isLateAttendance).length;
    const shiftPagi = regularGroups.filter((group) => group.datang && normalizeSearch(group.shift).includes("pagi")).length;
    const shiftSore = regularGroups.filter((group) => group.datang && normalizeSearch(group.shift).includes("sore")).length;
    const baseSalary = getPayrollAmountByMode(employee.baseSalary, employee.baseSalaryMode, present);
    const mealAllowance = getPayrollAmountByMode(employee.mealAllowance, employee.mealAllowanceMode, present);
    const overtime = getPayrollAmountByMode(employee.overtime, employee.overtimeMode, overtimeDays);
    const allowance = getPayrollAmountByMode(employee.allowance, employee.allowanceMode, present);
    const income = baseSalary + mealAllowance + overtime + allowance + Number(employee.bonus || 0);
    const deductions = Number(employee.loan || 0) + Number(employee.debt || 0) + Number(employee.other || 0);

    return {
      present,
      completeDays,
      overtimeDays,
      late,
      shiftPagi,
      shiftSore,
      netSalary: income - deductions
    };
  }

  async function generateSalarySlipPdf() {
    const user = getCurrentUserRecord();
    const employee = getSelectedPayrollEmployee();

    if (!isAdminUser(user) || !employee) return;
    if (!state.payrollEndpointReady) {
      if (els.salarySlipStatusText) els.salarySlipStatusText.textContent = "Endpoint slip gaji belum aktif. Update Apps Script absensi terlebih dahulu.";
      return;
    }

    const token = startAppLoading("Membuat PDF slip gaji...", 0);
    state.salarySlipUrl = "";
    if (els.openSalarySlipButton) els.openSalarySlipButton.disabled = true;

    try {
      if (els.salarySlipStatusText) els.salarySlipStatusText.textContent = "Membuat PDF dari template Slip_Gaji...";
      const result = await postToAbsensiApi({
        action: "generateSalarySlip",
        role: user.role || "",
        username: user.username || user.name || "",
        nip: employee.nip || "",
        name: employee.name || "",
        month: els.salarySlipMonthSelect?.value || getCurrentMonthValue(),
        year: els.salarySlipYearSelect?.value || String(new Date().getFullYear())
      });

      if (!result || (result.ok !== true && result.success !== true)) {
        throw new Error(result?.message || result?.error || "PDF slip gaji gagal dibuat.");
      }

      state.salarySlipUrl = result.fileUrl || result.printUrl || "";
      appendSalarySlipHistory({
        id: result.fileId || `${employee.nip || employee.name}-${Date.now()}`,
        rowNumber: Number(result.rowNumber || 0),
        issuedAt: new Date().toISOString(),
        period: result.period?.label || `${getMonthName(els.salarySlipMonthSelect?.value)} ${els.salarySlipYearSelect?.value || ""}`.trim(),
        nip: employee.nip || "",
        name: employee.name || "",
        netSalary: Number(result.salary?.netSalary || calculateSalarySlipPreview(employee).netSalary || 0),
        fileId: result.fileId || "",
        fileName: result.fileName || "",
        fileUrl: state.salarySlipUrl
      });
      if (els.openSalarySlipButton) els.openSalarySlipButton.disabled = !state.salarySlipUrl;
      if (els.salarySlipStatusText) els.salarySlipStatusText.textContent = state.salarySlipUrl
        ? "PDF slip gaji siap dibuka."
        : (result.message || "PDF slip gaji berhasil dibuat, tetapi link file belum diterima.");
      renderSalarySlipSummary();
      await fetchSalarySlipHistory({ silent: true });
      showActionToast("PDF slip gaji berhasil dibuat.");
    } catch (error) {
      if (els.salarySlipStatusText) els.salarySlipStatusText.textContent = `${error.message || "PDF slip gaji gagal dibuat."} Pastikan Apps Script absensi terbaru sudah di-deploy.`;
    } finally {
      endAppLoading(token);
    }
  }

  async function fetchSalarySlipHistory(options = {}) {
    if (!els.salarySlipHistoryList) return;
    const user = getCurrentUserRecord();
    const localHistory = readStoredArray(getSalarySlipHistoryKey()).map(normalizeSalarySlipHistoryItem);

    if (!options.silent && els.salarySlipHistoryStatus) {
      els.salarySlipHistoryStatus.textContent = "Menyinkronkan histori slip gaji...";
    }

    try {
      const payload = await getAbsensiRecords({
        action: "listSalarySlipHistory",
        role: user.role || "",
        username: user.username || user.name || "",
        name: user.name || user.username || ""
      });

      if (!payload || (payload.ok !== true && payload.success !== true) || !Array.isArray(payload.history)) {
        throw new Error(payload?.message || "Endpoint histori slip gaji belum aktif.");
      }

      state.salaryHistoryEndpointReady = true;
      state.salarySlipHistory = mergeSalarySlipHistory(payload.history, localHistory);
      writeStoredArray(getSalarySlipHistoryKey(), state.salarySlipHistory.slice(0, 120));
    } catch (error) {
      state.salaryHistoryEndpointReady = false;
      state.salarySlipHistory = mergeSalarySlipHistory(localHistory, state.salarySlipHistory);
      if (!options.silent) console.warn("Gagal memuat histori slip gaji:", error);
    }

    renderSalarySlipHistory();
  }

  function renderSalarySlipHistory() {
    if (!els.salarySlipHistoryList) return;
    const user = getCurrentUserRecord();
    const canDelete = isAdminUser(user);
    const history = state.salarySlipHistory
      .slice()
      .sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));

    if (els.salarySlipHistoryStatus) {
      els.salarySlipHistoryStatus.textContent = history.length
        ? `${formatNumber(history.length)} slip gaji tersimpan. Setiap periode disimpan sebagai histori terpisah.`
        : "Belum ada slip gaji PDF yang diterbitkan.";
    }

    if (!history.length) {
      els.salarySlipHistoryList.innerHTML = `
        <div class="salary-history-empty">
          <strong>Belum ada histori PDF</strong>
          <span>Slip yang dibuat akan tampil di sini tanpa menimpa periode sebelumnya.</span>
        </div>
      `;
      return;
    }

    els.salarySlipHistoryList.innerHTML = history.map((item, index) => `
      <article class="salary-history-item">
        <span class="salary-history-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M8 14h8"></path><path d="M8 18h5"></path></svg>
        </span>
        <span class="salary-history-copy">
          <strong>${escapeHtml(item.name || item.fileName || "Slip Gaji")}</strong>
          <small>${escapeHtml(item.period || "Periode tidak tersedia")} - ${escapeHtml(formatSalaryHistoryDate(item.issuedAt))}</small>
          <em>${formatPayrollMoney(item.netSalary)}</em>
        </span>
        <span class="salary-history-actions">
          ${item.fileUrl ? `
            <a class="table-action salary-history-open" href="${escapeHtml(item.fileUrl)}" target="_blank" rel="noopener" aria-label="Buka PDF slip gaji" title="Buka PDF">
              <svg viewBox="0 0 24 24"><path d="M14 3h7v7"></path><path d="m10 14 11-11"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path></svg>
            </a>
          ` : ""}
          ${canDelete ? `
            <button class="table-action table-action-delete" type="button" data-salary-history-delete="${index}" aria-label="Hapus histori slip gaji" title="Hapus histori">
              <svg viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 15H6L5 6"></path></svg>
            </button>
          ` : ""}
        </span>
      </article>
    `).join("");
  }

  async function handleSalarySlipHistoryAction(event) {
    const button = event.target.closest("[data-salary-history-delete]");
    if (!button || !isAdminUser(getCurrentUserRecord())) return;

    const item = state.salarySlipHistory[Number(button.dataset.salaryHistoryDelete)];
    if (!item) return;
    if (!window.confirm(`Hapus histori slip gaji ${item.name || item.period || ""}?`)) return;

    const user = getCurrentUserRecord();
    const token = startAppLoading("Menghapus histori slip gaji...", 0);

    try {
      if (item.rowNumber && state.salaryHistoryEndpointReady) {
        const result = await postToAbsensiApi({
          action: "deleteSalarySlipHistory",
          role: user.role || "",
          username: user.username || user.name || "",
          rowNumber: item.rowNumber,
          fileId: item.fileId || ""
        });
        if (!result || (result.ok !== true && result.success !== true)) {
          throw new Error(result?.message || "Histori slip gaji gagal dihapus.");
        }
      }

      state.salarySlipHistory = state.salarySlipHistory.filter((entry) => entry !== item);
      writeStoredArray(getSalarySlipHistoryKey(), state.salarySlipHistory);
      renderSalarySlipHistory();
      if (els.salarySlipHistoryStatus) els.salarySlipHistoryStatus.textContent = "Histori slip gaji berhasil dihapus.";
      if (state.salaryHistoryEndpointReady) await fetchSalarySlipHistory({ silent: true });
    } catch (error) {
      if (els.salarySlipHistoryStatus) els.salarySlipHistoryStatus.textContent = error.message || "Histori slip gaji gagal dihapus.";
    } finally {
      endAppLoading(token);
    }
  }

  function appendSalarySlipHistory(value) {
    const item = normalizeSalarySlipHistoryItem(value);
    state.salarySlipHistory = mergeSalarySlipHistory([item], state.salarySlipHistory);
    writeStoredArray(getSalarySlipHistoryKey(), state.salarySlipHistory.slice(0, 120));
    renderSalarySlipHistory();
  }

  function mergeSalarySlipHistory() {
    const merged = Array.from(arguments).flat().map(normalizeSalarySlipHistoryItem);
    const seen = new Set();
    return merged.filter((item) => {
      const key = item.fileId || item.fileUrl || `${item.name}|${item.period}|${item.issuedAt}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));
  }

  function normalizeSalarySlipHistoryItem(value) {
    return {
      id: String(value?.id || value?.fileId || "").trim(),
      rowNumber: Number(value?.rowNumber || 0),
      issuedAt: String(value?.issuedAt || value?.createdAt || new Date().toISOString()).trim(),
      period: String(value?.period || value?.periode || "").trim(),
      nip: String(value?.nip || "").trim(),
      name: String(value?.name || value?.nama || "").trim(),
      netSalary: parsePayrollNumber(value?.netSalary ?? value?.gajiBersih),
      fileId: String(value?.fileId || "").trim(),
      fileName: String(value?.fileName || "").trim(),
      fileUrl: String(value?.fileUrl || value?.url || "").trim()
    };
  }

  function getSalarySlipHistoryKey() {
    return `${SALARY_HISTORY_KEY}.${getProfileStorageIdentity()}`;
  }

  function formatSalaryHistoryDate(value) {
    const date = new Date(value || "");
    if (Number.isNaN(date.getTime())) return String(value || "Tanggal tidak tersedia");
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta"
    }).format(date).replace(/\./g, ":");
  }

  function getSelectedPayrollEmployee() {
    const value = els.salarySlipEmployeeSelect?.value || "";
    return state.payrollEmployees.find((employee) => {
      return normalizeSearch(employee.nip) === normalizeSearch(value) || normalizeSearch(employee.name) === normalizeSearch(value);
    }) || null;
  }

  function normalizePayrollEmployee(value) {
    return {
      rowNumber: Number(value?.rowNumber || 0),
      no: String(value?.no || "").trim(),
      nip: String(value?.nip || value?.NIP || "").trim(),
      name: String(value?.name || value?.nama || value?.namaKaryawan || "").trim(),
      job: String(value?.job || value?.jabatan || "").trim(),
      baseSalary: parsePayrollNumber(value?.baseSalary ?? value?.gajiPokok ?? value?.gaji_pokok),
      baseSalaryMode: normalizePayrollMode(value?.baseSalaryMode ?? value?.modeGajiPokok ?? value?.mode_gaji_pokok, "monthly"),
      mealAllowance: parsePayrollNumber(value?.mealAllowance ?? value?.uangMakan ?? value?.uang_makan),
      mealAllowanceMode: normalizePayrollMode(value?.mealAllowanceMode ?? value?.modeUangMakan ?? value?.mode_uang_makan, "daily"),
      overtime: parsePayrollNumber(value?.overtime ?? value?.lembur),
      overtimeMode: normalizePayrollMode(value?.overtimeMode ?? value?.modeLembur ?? value?.mode_lembur, "daily"),
      allowance: parsePayrollNumber(value?.allowance ?? value?.tunjangan),
      allowanceMode: normalizePayrollMode(value?.allowanceMode ?? value?.modeTunjangan ?? value?.mode_tunjangan ?? value?.tunjanganMode ?? value?.allowance_mode, "monthly"),
      bonus: parsePayrollNumber(value?.bonus),
      loan: parsePayrollNumber(value?.loan ?? value?.pinjaman),
      debt: parsePayrollNumber(value?.debt ?? value?.hutang),
      other: parsePayrollNumber(value?.other ?? value?.lainLain ?? value?.lain_lain)
    };
  }

  function parsePayrollNumber(value) {
    const text = String(value ?? "").replace(/[^\d,-.]/g, "").replace(/\./g, "").replace(",", ".");
    const number = Number(text || 0);
    return Number.isFinite(number) ? number : 0;
  }

  function formatPayrollMoney(value) {
    return `Rp. ${formatNumber(Math.round(Number(value || 0)))}`;
  }

  function getPayrollMoneyInputs() {
    return [
      els.payrollBaseSalaryInput,
      els.payrollMealAllowanceInput,
      els.payrollOvertimeInput,
      els.payrollAllowanceInput,
      els.payrollBonusInput,
      els.payrollLoanInput,
      els.payrollDebtInput,
      els.payrollOtherInput
    ].filter(Boolean);
  }

  function setPayrollMoneyInputValue(input, value) {
    if (!input) return;
    const amount = parsePayrollNumber(value);
    input.value = amount ? formatPayrollMoney(amount) : "";
  }

  function formatPayrollMoneyInput(input) {
    if (!input) return;
    const raw = String(input.value || "");
    if (!/\d/.test(raw)) {
      input.value = "";
      return;
    }

    input.value = formatPayrollMoney(parsePayrollNumber(raw));
  }

  function formatPayrollRate(value, mode) {
    return `<span class="payroll-rate-value">${formatPayrollMoney(value)}</span><small class="payroll-rate-mode">${formatPayrollMode(mode)}</small>`;
  }

  function formatPayrollMode(mode) {
    return normalizePayrollMode(mode, "monthly") === "daily" ? "Perhari" : "Perbulan";
  }

  function normalizePayrollMode(mode, fallback = "monthly") {
    const text = normalizeSearch(mode);
    if (text === "daily" || text === "day" || text === "harian" || text === "perhari") return "daily";
    if (text === "monthly" || text === "month" || text === "bulanan" || text === "perbulan") return "monthly";
    return fallback === "daily" ? "daily" : "monthly";
  }

  function getPayrollAmountByMode(value, mode, quantity) {
    const amount = Number(value || 0);
    return normalizePayrollMode(mode, "monthly") === "daily"
      ? amount * Math.max(0, Number(quantity || 0))
      : amount;
  }

  function setInputValue(input, value) {
    if (input) input.value = value ?? "";
  }

  function getAttendanceIdentity(user) {
    return {
      name: String(user?.name || user?.username || "").trim(),
      email: String(user?.email || "").trim()
    };
  }

  function resolveAttendanceEmployeeName(user) {
    const keys = getAttendanceIdentityKeys(user);
    const employee = state.employees.find((item) => {
      return [item.name, item.email, item.phone].some((value) => keys.has(normalizeSearch(value)));
    });
    return String(employee?.name || user?.name || user?.username || "").trim();
  }

  function getAttendanceIdentityKeys(user) {
    return new Set([user?.name, user?.username, user?.email, user?.phone]
      .map(normalizeSearch)
      .filter(Boolean));
  }

  function normalizeAttendanceStatus(value) {
    const text = normalizeSearch(value);
    if (text.includes("lembur") || text.includes("overtime")) return "LEMBUR";
    return text.includes("pulang") || text.includes("keluar") || text.includes("out") ? "PULANG" : "DATANG";
  }

  function normalizeAttendanceShift(value) {
    const text = normalizeSearch(value);
    if (text.includes("sore")) return "Sore";
    if (text.includes("pagi")) return "Pagi";
    return String(value || "").trim();
  }

  function inferAttendanceShift(time) {
    if (!time) return "Pagi";
    const hour = Number(String(time).slice(0, 2));
    return hour >= 12 ? "Sore" : "Pagi";
  }

  function normalizeAttendanceDateKey(value, timestamp) {
    const text = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (slash) return `${slash[3]}-${String(slash[2]).padStart(2, "0")}-${String(slash[1]).padStart(2, "0")}`;
    const date = new Date(timestamp || text);
    if (Number.isNaN(date.getTime())) return getTodayDateKey();
    return formatDateKey(date);
  }

  function normalizeAttendanceTime(value, timestamp) {
    const text = String(value || "").trim();
    const match = text.match(/^(\d{1,2}):(\d{2})/);
    if (match) return `${String(match[1]).padStart(2, "0")}:${match[2]}`;
    const date = new Date(timestamp || text);
    if (Number.isNaN(date.getTime())) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function formatJakartaTimeFromTimestamp(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";

    try {
      const parts = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        hourCycle: "h23"
      }).formatToParts(date);
      const hour = parts.find((part) => part.type === "hour")?.value || "";
      const minute = parts.find((part) => part.type === "minute")?.value || "";
      return hour && minute ? `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}` : "";
    } catch (error) {
      return normalizeAttendanceTime("", text);
    }
  }

  function calculateAttendanceDuration(start, end) {
    const startMinutes = getClockMinutes(start);
    const endMinutes = getClockMinutes(end);
    if (startMinutes < 0 || endMinutes < 0) return "";
    const diff = endMinutes >= startMinutes ? endMinutes - startMinutes : endMinutes + 1440 - startMinutes;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}j ${minutes}m`;
  }

  function getAttendanceGroupSortTime(group) {
    return group.lembur || group.pulang || group.datang || "00:00";
  }

  function getClockMinutes(value) {
    const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
    if (!match) return -1;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function getAttendanceStatusLabel(group) {
    if (group.isOvertime || (group.lembur && !group.datang && !group.pulang)) return "Lembur";
    if (!group.datang) return "Tidak Hadir";
    if (normalizeSearch(group.warningFlag).includes("late") || normalizeSearch(group.warningMessage).includes("terlambat")) return "Terlambat";
    if (normalizeSearch(group.warningFlag).includes("early") || normalizeSearch(group.warningMessage).includes("terlalu cepat") || normalizeSearch(group.warningMessage).includes("lebih cepat")) return "Pulang Cepat";
    return "Hadir";
  }

  function isLateAttendance(group) {
    return getAttendanceStatusLabel(group) === "Terlambat";
  }

  function renderAttendanceStatus(group) {
    const label = group.statusLabel || getAttendanceStatusLabel(group);
    const key = normalizeSearch(label).replace(/\s+/g, "-");
    const note = group.warningMessage ? `<small>${escapeHtml(group.warningMessage)}</small>` : "";
    return `<span class="attendance-status-stack"><span class="attendance-status-pill is-${key}">${escapeHtml(label)}</span>${note}</span>`;
  }

  function countUniqueNames(groups) {
    return new Set(groups.map((group) => normalizeSearch(group.name)).filter(Boolean)).size;
  }

  function countWorkDaysInMonth(year, month) {
    const totalDays = new Date(year, month, 0).getDate();
    let count = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month - 1, day);
      if (date.getDay() !== 0) count += 1;
    }
    return count;
  }

  function getTodayDateKey() {
    return formatDateKey(new Date());
  }

  function getCurrentMonthValue() {
    return String(new Date().getMonth() + 1).padStart(2, "0");
  }

  function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatAttendanceDate(dateKey) {
    const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return dateKey || "-";
    return `${match[3]} ${getMonthName(match[2])} ${match[1]}`;
  }

  function getMonthName(value) {
    const names = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return names[Math.max(0, Math.min(11, Number(value) - 1))] || "";
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function showActionToast(message, type = "success") {
    if (!message) message = "Data berhasil disimpan.";

    if (state.appLoadingToken && els.appLoadingOverlay) {
      showAppLoadingSuccess(message, type);
      return;
    }

    if (!els.actionToast || !els.actionToastMessage) return;
    window.clearTimeout(state.actionToastTimer);
    els.actionToast.className = `action-toast is-${type}`;
    els.actionToastMessage.textContent = message;
    els.actionToast.hidden = false;
    state.actionToastTimer = window.setTimeout(() => {
      if (els.actionToast) els.actionToast.hidden = true;
    }, type === "error" ? 2400 : 1400);
  }

  function renderReports() {
    if (!els.reportTotal) return;
    const signature = getReportSignature(state.rows, state.uploadedAt);
    if (signature === state.reportSignature) return;
    state.reportSignature = signature;
    const active = state.rows.filter((row) => getEffectiveMedicineStatus(row) === "aktif").length;
    const inactive = state.rows.filter((row) => getEffectiveMedicineStatus(row) === "nonaktif").length;
    const expiring = state.rows.filter(isActiveExpiringMedicine).length;
    const expired = state.rows.filter(isActiveExpiredMedicine).length;
    const empty = state.rows.filter((row) => parseNumber(row.stok) === 0).length;
    const low = state.rows.filter(isLowStock).length;
    const minus = state.rows.filter((row) => parseNumber(row.stok) < 0).length;

    els.reportTotal.textContent = formatNumber(state.rows.length);
    if (els.reportActive) els.reportActive.textContent = formatNumber(active);
    if (els.reportInactive) els.reportInactive.textContent = formatNumber(inactive);
    els.reportExpiring.textContent = formatNumber(expiring);
    els.reportExpired.textContent = formatNumber(expired);
    els.reportEmpty.textContent = formatNumber(empty);
    els.reportLow.textContent = formatNumber(low);
    if (els.reportMinus) els.reportMinus.textContent = formatNumber(minus);
    if (els.reportOut) els.reportOut.textContent = formatNumber(empty);
    persistReportCache({ signature, active, inactive, expiring, expired, empty, low, minus, total: state.rows.length, uploadedAt: state.uploadedAt });

  }

  function renderReportsFromCache() {
    if (!els.reportTotal) return;
    const snapshot = readReportCache();
    if (!snapshot) return;
    state.reportSignature = snapshot.signature || state.reportSignature;
    els.reportTotal.textContent = formatNumber(snapshot.total || 0);
    if (els.reportActive) els.reportActive.textContent = formatNumber(snapshot.active || 0);
    if (els.reportInactive) els.reportInactive.textContent = formatNumber(snapshot.inactive || 0);
    if (els.reportExpiring) els.reportExpiring.textContent = formatNumber(snapshot.expiring || 0);
    if (els.reportExpired) els.reportExpired.textContent = formatNumber(snapshot.expired || 0);
    if (els.reportEmpty) els.reportEmpty.textContent = formatNumber(snapshot.empty || 0);
    if (els.reportLow) els.reportLow.textContent = formatNumber(snapshot.low || 0);
    if (els.reportMinus) els.reportMinus.textContent = formatNumber(snapshot.minus || 0);
    if (els.reportOut) els.reportOut.textContent = formatNumber(snapshot.empty || 0);
  }

  function persistReportCache(snapshot) {
    try {
      localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify({
        ...snapshot,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {}
  }

  function readReportCache() {
    try {
      const parsed = JSON.parse(localStorage.getItem(REPORT_CACHE_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function getReportSignature(rows, uploadedAt) {
    let totalStok = 0;
    let totalMinus = 0;
    let totalEmpty = 0;
    let totalLow = 0;
    let totalActive = 0;
    let totalInactive = 0;
    let totalExpiring = 0;
    let totalExpired = 0;

    (rows || []).forEach((row) => {
      const stock = parseNumber(row.stok);
      const status = getEffectiveMedicineStatus(row);
      if (status === "aktif") totalActive += 1;
      if (status === "nonaktif") totalInactive += 1;
      if (isActiveExpiringMedicine(row)) totalExpiring += 1;
      if (isActiveExpiredMedicine(row)) totalExpired += 1;
      if (stock === 0) totalEmpty += 1;
      if (isLowStock(row)) totalLow += 1;
      if (stock < 0) totalMinus += 1;
      totalStok += stock || 0;
    });

    return [uploadedAt || "", rows.length, totalStok, totalActive, totalInactive, totalExpiring, totalExpired, totalEmpty, totalLow, totalMinus].join("|");
  }

  function switchView(viewName, options = {}) {
    if (!viewName || !VIEW_TITLES[viewName]) return;
    if (viewName !== "home" && !options.skipAccessCheck && !canView(viewName)) {
      showActionToast("Menu ini belum diaktifkan untuk akun Anda.", "error");
      return;
    }
    const previousView = state.activeView;
    if (!options.fromHistory && !options.skipHistory && previousView && previousView !== viewName) {
      state.viewHistory.push(previousView);
      state.viewHistory = state.viewHistory.slice(-24);
      state.viewForwardStack = [];
    }
    if (viewName === "cari-data-obat" && previousView !== "cari-data-obat") {
      state.previousView = options.previousView || previousView || (isMobileViewport() ? "home" : "dashboard");
    }
    state.activeView = viewName;
    document.body.classList.toggle("home-view-active", viewName === "home");
    els.views.forEach((view) => view.classList.toggle("is-active", view.dataset.view === viewName));
    els.viewButtons.forEach((button) => {
      const active = button.dataset.viewTarget === viewName;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (els.viewTitle) els.viewTitle.textContent = VIEW_TITLES[viewName];
    if (viewName === "cari-data-obat") renderQuickSearchResults();
    if (viewName === "presensi") {
      renderAttendanceDashboard();
      fetchAttendanceRecords({ silent: true });
      fetchPayrollEmployees({ silent: true });
      fetchSalarySlipHistory({ silent: true });
    }
    if (viewName === "restok-obat") renderRestockPage();
    if (viewName === "home") maybeShowHomePrayerReminder();
    setSidebarCollapsed(true);
  }

  function maybeShowHomePrayerReminder() {
    return;
    if (!els.homePrayerReminderModal || state.activeView !== "home") return;
    const user = getCurrentUserRecord();
    const key = `${HOME_PRAYER_REMINDER_KEY}.${getProfileStorageIdentity() || user.username || "guest"}`;
    if (sessionStorage.getItem(key) === "1") return;

    sessionStorage.setItem(key, "1");
    els.homePrayerReminderModal.hidden = false;
    document.body.classList.add("dashboard-modal-open");
  }

  function closeHomePrayerReminder() {
    if (els.homePrayerReminderModal) els.homePrayerReminderModal.hidden = true;
    const hasOpenModal = [els.medicineModal, els.recordModal, els.deleteModal, els.scannerModal]
      .some((modal) => modal && !modal.hidden);
    document.body.classList.toggle("dashboard-modal-open", hasOpenModal);
  }

  function goHomeFromPrayerReminder() {
    closeHomePrayerReminder();
    if (state.activeView !== "home" && canView("home")) switchView("home");
  }

  function setupHomeMenuReorder() {
    const grid = els.homeMenuGrid;
    if (!grid) return;

    getHomeMenuOrderItems().forEach((item) => {
      item.dataset.homeMenuKey = getHomeMenuItemKey(item);
    });
    applySavedHomeMenuOrder();

    grid.addEventListener("click", (event) => {
      if (Date.now() >= state.homeMenuSuppressClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    grid.addEventListener("pointerdown", (event) => {
      if (!isHomeMobileViewport() || event.button > 0) return;
      const item = event.target.closest(".mobile-home-card, .apoteker-ai-fab");
      if (!item || !grid.contains(item)) return;

      window.clearTimeout(state.homeMenuLongPressTimer);
      state.homeMenuLongPressed = false;
      state.homeMenuLongPressTimer = window.setTimeout(() => {
        state.homeMenuLongPressed = true;
        state.homeMenuDragItem = item;
        item.classList.add("is-dragging");
        grid.classList.add("is-reordering");
        document.body.classList.add("home-menu-reordering");
        if (navigator.vibrate) navigator.vibrate(35);
      }, 520);
    });

    document.addEventListener("pointermove", (event) => {
      const item = state.homeMenuDragItem;
      if (!item || !state.homeMenuLongPressed || !isHomeMobileViewport()) return;
      event.preventDefault();
      const target = document.elementFromPoint(event.clientX, event.clientY)
        ?.closest(".mobile-home-card, .apoteker-ai-fab");
      if (!target || target === item || !grid.contains(target)) return;

      const targetRect = target.getBoundingClientRect();
      const placeAfter = event.clientY > targetRect.top + targetRect.height / 2
        || (
          Math.abs(event.clientY - (targetRect.top + targetRect.height / 2)) < targetRect.height / 3
          && event.clientX > targetRect.left + targetRect.width / 2
        );
      grid.insertBefore(item, placeAfter ? target.nextSibling : target);
    }, { passive: false });

    const finishReorder = () => {
      window.clearTimeout(state.homeMenuLongPressTimer);
      state.homeMenuLongPressTimer = null;
      if (!state.homeMenuDragItem) return;

      state.homeMenuSuppressClickUntil = Date.now() + 650;
      state.homeMenuDragItem.classList.remove("is-dragging");
      state.homeMenuDragItem = null;
      state.homeMenuLongPressed = false;
      grid.classList.remove("is-reordering");
      document.body.classList.remove("home-menu-reordering");
      saveHomeMenuOrder();
    };

    document.addEventListener("pointerup", finishReorder);
    document.addEventListener("pointercancel", finishReorder);
  }

  function getHomeMenuOrderItems() {
    if (!els.homeMenuGrid) return [];
    return Array.from(els.homeMenuGrid.querySelectorAll(".mobile-home-card, .apoteker-ai-fab"));
  }

  function getHomeMenuItemKey(item) {
    if (!item) return "";
    if (item.id) return item.id;
    if (item.dataset.viewTarget) return `view:${item.dataset.viewTarget}`;
    if (item.getAttribute("href")) return `href:${item.getAttribute("href").split("?")[0]}`;
    return String(item.textContent || "").trim().replace(/\s+/g, "-").toLowerCase();
  }

  function getHomeMenuOrderStorageKey() {
    return `${HOME_MENU_ORDER_KEY}.${getProfileStorageIdentity()}`;
  }

  function applySavedHomeMenuOrder() {
    const grid = els.homeMenuGrid;
    if (!grid) return;
    const saved = readStoredArray(getHomeMenuOrderStorageKey()).map(String);
    const items = getHomeMenuOrderItems();
    const itemByKey = new Map(items.map((item) => [item.dataset.homeMenuKey || getHomeMenuItemKey(item), item]));

    saved.forEach((key) => {
      const item = itemByKey.get(key);
      if (item) grid.appendChild(item);
    });
    items.forEach((item) => {
      if (!saved.includes(item.dataset.homeMenuKey)) grid.appendChild(item);
    });

    const spacer = grid.querySelector(".home-menu-spacer");
    if (spacer) grid.appendChild(spacer);
  }

  function saveHomeMenuOrder() {
    const order = getHomeMenuOrderItems()
      .map((item) => item.dataset.homeMenuKey || getHomeMenuItemKey(item))
      .filter(Boolean);
    writeStoredArray(getHomeMenuOrderStorageKey(), order);
  }

  function handleGlobalTouchStart(event) {
    if (!isMobileViewport() || !event.touches || event.touches.length !== 1) return;
    if (shouldIgnoreSwipeTarget(event.target)) return;

    const touch = event.touches[0];
    state.touchStartX = touch.clientX;
    state.touchStartY = touch.clientY;
    state.touchStartAt = Date.now();
  }

  function handleGlobalTouchEnd(event) {
    if (!isMobileViewport() || !state.touchStartAt || !event.changedTouches || !event.changedTouches.length) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - state.touchStartX;
    const deltaY = touch.clientY - state.touchStartY;
    const elapsed = Date.now() - state.touchStartAt;
    state.touchStartAt = 0;

    if (elapsed > 900 || Math.abs(deltaX) < 78 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
    navigateBySwipe(deltaX > 0 ? -1 : 1);
  }

  function shouldIgnoreSwipeTarget(target) {
    return Boolean(target && target.closest([
      "input",
      "textarea",
      "select",
      "button",
      "a",
      "[role='dialog']",
      ".notification-popover",
      ".scanner-modal",
      ".data-table-scroll",
      ".simple-table-wrap",
      ".dashboard-search"
    ].join(",")));
  }

  function navigateBySwipe(direction) {
    if (direction < 0) {
      const previous = state.viewHistory.pop();
      if (!previous || !canView(previous)) return;
      state.viewForwardStack.push(state.activeView);
      switchView(previous, { fromHistory: true });
      return;
    }

    const next = state.viewForwardStack.pop();
    if (!next || !canView(next)) return;
    state.viewHistory.push(state.activeView);
    switchView(next, { fromHistory: true });
  }

  function handleViewportRoute() {
    const viewportIsMobile = isHomeMobileViewport();

    if (viewportIsMobile === state.viewportIsMobile) return;
    state.viewportIsMobile = viewportIsMobile;

    if (viewportIsMobile && state.activeView === "dashboard") {
      switchView("home", { skipHistory: true });
      return;
    }

    if (!viewportIsMobile && state.activeView === "home") {
      switchView("dashboard", { skipHistory: true });
    }
  }

  function applySavedSidebarState() {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    const collapsed = stored == null ? true : stored === "1";
    setSidebarCollapsed(collapsed, { persist: false });
  }

  function toggleSidebar() {
    const collapsed = !document.body.classList.contains("sidebar-collapsed");
    setSidebarCollapsed(collapsed);
  }

  function setSidebarCollapsed(collapsed, options = {}) {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    document.body.classList.toggle("sidebar-open", !collapsed);
    if (collapsed) closeSidebarProfileDropdown();
    if (els.sidebarScrim) els.sidebarScrim.hidden = collapsed;
    if (options.persist !== false) localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    if (els.sidebarToggle) els.sidebarToggle.setAttribute("aria-label", collapsed ? "Buka sidebar" : "Tutup sidebar");
    updateSidebarToggleIcon(collapsed);
  }

  function updateSidebarToggleIcon(collapsed) {
    if (!els.sidebarToggle) return;

    const paths = Array.from(els.sidebarToggle.querySelectorAll("svg path"));
    const lines = collapsed
      ? ["M7 4v16", "M12 4v16", "M17 4v16"]
      : ["M4 7h16", "M4 12h16", "M4 17h16"];

    paths.forEach((path, index) => {
      if (lines[index]) path.setAttribute("d", lines[index]);
    });
  }

  function closeSidebarProfileDropdown() {
    const dropdown = document.getElementById("profileDropdown");
    const button = document.getElementById("profileMenuButton");
    if (dropdown) dropdown.hidden = true;
    if (button) {
      button.setAttribute("aria-expanded", "false");
      button.classList.remove("is-open");
    }
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 900px)").matches;
  }

  function isHomeMobileViewport() {
    return window.matchMedia("(max-width: 760px)").matches;
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

  function startAppLoading(message, delayMs) {
    const token = Date.now() + Math.random();
    state.appLoadingToken = token;
    window.clearTimeout(state.appLoadingTimer);
    window.clearTimeout(state.appLoadingMaxTimer);
    window.clearTimeout(state.appLoadingSuccessTimer);
    state.appLoadingSuccessTimer = null;
    state.appLoadingShownAt = 0;
    if (els.appLoadingOverlay) els.appLoadingOverlay.classList.remove("is-success", "is-error");
    const show = () => {
      if (state.appLoadingToken !== token || !els.appLoadingOverlay) return;
      if (els.appLoadingText) els.appLoadingText.textContent = message || "Memproses...";
      state.appLoadingShownAt = Date.now();
      els.appLoadingOverlay.hidden = false;
      state.appLoadingMaxTimer = window.setTimeout(() => {
        endAppLoading(token, { force: true });
      }, 60000);
    };
    if (Number(delayMs) <= 0) {
      show();
      return token;
    }
    state.appLoadingTimer = window.setTimeout(() => {
      show();
    }, Math.min(500, Math.max(250, Number(delayMs) || 350)));
    return token;
  }

  function endAppLoading(token, options = {}) {
    if (token && state.appLoadingToken !== token) return;
    if (!options.force && state.appLoadingSuccessTimer) return;
    window.clearTimeout(state.appLoadingTimer);
    window.clearTimeout(state.appLoadingMaxTimer);
    window.clearTimeout(state.appLoadingSuccessTimer);
    state.appLoadingSuccessTimer = null;
    state.appLoadingTimer = null;
    state.appLoadingMaxTimer = null;
    const elapsed = state.appLoadingShownAt ? Date.now() - state.appLoadingShownAt : 0;
    if (!options.force && elapsed > 0 && elapsed < 500) {
      state.appLoadingTimer = window.setTimeout(() => endAppLoading(token, { force: true }), 500 - elapsed);
      return;
    }
    state.appLoadingToken = 0;
    state.appLoadingShownAt = 0;
    if (els.appLoadingOverlay) els.appLoadingOverlay.classList.remove("is-success", "is-error");
    if (els.appLoadingOverlay) els.appLoadingOverlay.hidden = true;
  }

  function showAppLoadingSuccess(message, type = "success") {
    if (!els.appLoadingOverlay || !els.appLoadingText) return;
    window.clearTimeout(state.appLoadingSuccessTimer);
    els.appLoadingOverlay.classList.toggle("is-success", type !== "error");
    els.appLoadingOverlay.classList.toggle("is-error", type === "error");
    els.appLoadingText.textContent = message || "Berhasil.";
    els.appLoadingOverlay.hidden = false;
    state.appLoadingSuccessTimer = window.setTimeout(() => {
      endAppLoading(state.appLoadingToken, { force: true });
    }, type === "error" ? 1800 : 1100);
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function togglePasswordVisibility(event) {
    const button = event.currentTarget;
    const input = document.getElementById(button.dataset.passwordTarget || "");
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
    button.classList.toggle("is-visible", input.type === "text");
    button.innerHTML = input.type === "text" ? getEyeIcon() : getEyeOffIcon();
    button.setAttribute("aria-label", input.type === "text" ? "Sembunyikan password" : "Tampilkan password");
    input.focus();
  }

  function getEyeIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  }

  function getEyeOffIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61C3.98 8.38 2 12 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"></path><path d="M3 3l18 18"></path></svg>';
  }

  function updateProfilePasswordIndicators() {
    const password = String(els.profileNewPasswordInput?.value || "");
    const confirmPassword = String(els.profileConfirmPasswordInput?.value || "");
    const isStrong = isPasswordStrong(password);

    setPasswordValidityIcon(els.profilePasswordStrengthIcon, password ? (isStrong ? "valid" : "invalid") : "");
    setPasswordValidityIcon(
      els.profilePasswordMatchIcon,
      confirmPassword ? (password && confirmPassword === password ? "valid" : "invalid") : ""
    );
  }

  function setPasswordValidityIcon(element, stateName) {
    if (!element) return;
    if (!stateName) {
      element.hidden = true;
      element.className = "password-validity-icon";
      element.innerHTML = "";
      return;
    }

    element.hidden = false;
    element.className = `password-validity-icon is-${stateName}`;
    element.innerHTML = stateName === "valid"
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
  }

  function isPasswordStrong(password) {
    return password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
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

  function isActiveMedicineForExpiryReport(row) {
    return parseNumber(row.stok) > 0 && getEffectiveMedicineStatus(row) === "aktif";
  }

  function isActiveExpiredMedicine(row) {
    return isActiveMedicineForExpiryReport(row) && isExpired(row);
  }

  function isActiveExpiringMedicine(row) {
    return isActiveMedicineForExpiryReport(row) && isExpiringSoon(row);
  }

  function isExpiringSoon(row) {
    const date = parseDateValue(row.expired);
    if (!date || isExpired(row)) return false;
    const today = startOfToday();
    const limit = new Date(today);
    limit.setDate(limit.getDate() + EXPIRING_DAYS);
    return date <= limit;
  }

  function getExpiryDaysLeft(row) {
    const date = parseDateValue(row.expired);
    if (!date) return null;
    return Math.ceil((date.getTime() - startOfToday().getTime()) / 86400000);
  }

  function getStockStatus(row) {
    const stock = parseNumber(row.stok);
    if (stock < 0) return "minus";
    if (stock === 0) return "empty";
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
    return getEffectiveMedicineStatus(row);
  }

  function getEffectiveMedicineStatus(row) {
    return parseNumber(row.stok) <= 0 ? "nonaktif" : "aktif";
  }

  function getReportLabel(row) {
    if (parseNumber(row.stok) < 0) return "Stok minus";
    if (parseNumber(row.stok) === 0) return "Stok habis";
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
    if (PRICE_COLUMNS.has(key)) return normalizePriceValue(value, key);
    if (QUANTITY_COLUMNS.has(key)) return normalizeQuantityValue(value);
    if (key !== "expired") return String(value ?? "");
    const date = parseDateValue(value);
    if (!date) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function formatCell(value, key = "") {
    if (PRICE_COLUMNS.has(key)) return normalizePriceValue(value, key) || "-";
    if (QUANTITY_COLUMNS.has(key)) return normalizeQuantityValue(value) || "-";
    const text = String(value ?? "").trim();
    return text || "-";
  }

  function formatQuickPrice(value, key = "") {
    let text = formatCell(value, key);
    if (shouldExpandCompactPrice(text, key)) {
      text = formatIntegerPrice(String(Number(text) * 1000));
    }
    return text === "-" ? "-" : `Rp ${text}`;
  }

  function formatQuickDate(value) {
    const date = parseDateValue(value);
    if (!date) return formatCell(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  }

  function formatQuickExpiry(row) {
    const dateText = formatQuickDate(row.expired);
    const days = getExpiryDaysLeft(row);
    if (days === null) return dateText;
    if (days < 0) return `${dateText} (lewat ${Math.abs(days)} hari)`;
    if (days === 0) return `${dateText} (hari ini)`;
    return `${dateText} (${days} hari lagi)`;
  }

  function normalizeRowValue(key, value) {
    if (PRICE_COLUMNS.has(key)) return normalizePriceValue(value, key);
    if (QUANTITY_COLUMNS.has(key)) return normalizeQuantityValue(value);
    return value;
  }

  function normalizePriceValue(value, key = "") {
    const text = String(value ?? "").trim();
    if (!text) return "";
    const cleaned = text.replace(/[^\d,.-]/g, "");
    const digitsOnly = cleaned.replace(/[^\d-]/g, "");

    if (key === "harga_beli" && shouldTrimCorruptedHargaBeli(digitsOnly)) {
      return formatIntegerPrice(digitsOnly.slice(0, -3));
    }

    if (key === "harga_beli" && /^-?\d{1,3}(?:\.\d{3}){2,}$/.test(cleaned)) {
      const dotParts = cleaned.split(".");
      const lastPart = dotParts[dotParts.length - 1] || "";
      if (lastPart !== "000") return formatIntegerPrice(dotParts.slice(0, -1).join(""));
    }

    if (/^-?\d{1,3}(?:,\d{3})+$/.test(cleaned)) {
      return formatIntegerPrice(cleaned.replace(/,/g, ""));
    }

    if (/^-?\d{1,3}(?:\.\d{3})+,\d{3}$/.test(cleaned)) {
      return formatIntegerPrice(cleaned.replace(/,\d{3}$/, ""));
    }

    if (/^-?\d{4,},\d{3}$/.test(cleaned)) {
      return formatIntegerPrice(cleaned.replace(/,\d{3}$/, ""));
    }

    if (/^-?\d{4,}\.\d{1,3}$/.test(cleaned)) {
      return formatIntegerPrice(cleaned.replace(/\.\d{1,3}$/, ""));
    }

    if (/^\d+,\d{1,2}$/.test(text)) {
      const parts = text.split(",");
      return `${parts[0]}.${parts[1].padEnd(3, "0")}`;
    }

    if (/^\d+\.\d{1,2}$/.test(text)) {
      const parts = text.split(".");
      return `${parts[0]}.${parts[1].padEnd(3, "0")}`;
    }

    if (/^\d+\.\d$/.test(text)) {
      return text.replace(/\.(\d)$/, ".$100");
    }

    if (/^-?\d{4,}$/.test(text)) {
      return new Intl.NumberFormat("id-ID").format(Number(text));
    }

    if (shouldExpandCompactPrice(text, key)) {
      return formatIntegerPrice(String(Number(text) * 1000));
    }

    return text;
  }

  function shouldExpandCompactPrice(value, key = "") {
    if (!PRICE_COLUMNS.has(key)) return false;
    const text = String(value ?? "").trim();
    if (!/^-?\d{1,3}$/.test(text)) return false;
    const number = Number(text);
    return Number.isFinite(number) && number > 0 && Math.abs(number) < 500;
  }

  function shouldTrimCorruptedHargaBeli(digitsOnly) {
    const text = String(digitsOnly || "");
    return /^-?\d{7,}$/.test(text) && !/000$/.test(text);
  }

  function normalizeQuantityValue(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    const cleaned = text.replace(/[^\d,.-]/g, "");

    if (/^-?\d+,\d{3}$/.test(cleaned)) {
      return cleanDecimalText(cleaned.replace(/,\d{3}$/, ""));
    }

    if (/^-?\d+\.\d{3}$/.test(cleaned)) {
      const parts = cleaned.split(".");
      const tail = parts[parts.length - 1] || "";
      if (tail !== "000") return cleanDecimalText(parts.slice(0, -1).join("."));
    }

    if (/^-?\d+,\d{1,2}$/.test(cleaned)) {
      return cleanDecimalText(cleaned.replace(",", "."));
    }

    return text;
  }

  function cleanDecimalText(value) {
    const numeric = Number(String(value || "").replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(numeric)) return String(value || "");
    return String(numeric);
  }

  function formatIntegerPrice(value) {
    const text = String(value ?? "").replace(/[^\d-]/g, "");
    if (!text || text === "-") return "";
    const numeric = Number(text);
    return Number.isFinite(numeric) ? new Intl.NumberFormat("id-ID").format(numeric) : String(value || "");
  }

  function normalizePhoneNumber(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    const cleaned = text.replace(/[^\d+]/g, "");
    if (/^\+/.test(cleaned)) return cleaned;
    if (/^8\d{7,}$/.test(cleaned)) return `0${cleaned}`;
    return cleaned;
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
    const profile = getProfileData();
    hydrateProfileHeader(profile);
  }

  function hydrateProfileHeader(profile) {
    const session = readSession();
    const name = String(profile?.name || session?.name || session?.username || session?.email || "Akun").trim() || "Akun";
    const role = formatRoleLabel(profile?.role || session?.role || "Operator");
    const accountName = document.getElementById("profileAccountName");
    const accountMeta = document.getElementById("profileAccountMeta");

    if (els.profileName) els.profileName.textContent = name;
    if (accountName) accountName.textContent = name;
    if (accountMeta) accountMeta.textContent = role;
  }

  function formatRoleLabel(value) {
    const role = normalizeSearch(value || "operator");
    const labels = {
      owner: "Owner",
      admin: "Administrator",
      administrator: "Administrator",
      operator: "Operator",
      kasir: "Kasir",
      "asisten apoteker": "Asisten Apoteker",
      apoteker: "Apoteker",
      "staf gudang": "Staf Gudang"
    };
    return labels[role] || String(value || "Operator").trim() || "Operator";
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
    const groupedPriceColumns = [
      "satuan_beli",
      "harga_beli",
      "satuan_1",
      "isi_1",
      "harga_jual_1",
      "satuan_2",
      "isi_2",
      "harga_jual_2",
      "satuan_3",
      "isi_3",
      "harga_jual_3"
    ];
    if (valid.length && !groupedPriceColumns.every((key) => valid.includes(key))) {
      return DEFAULT_VISIBLE_COLUMNS.slice();
    }
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
    if (!modal) return;
    modal.hidden = false;
    syncModalOpenState();
  }

  function hideModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    syncModalOpenState();
  }

  function syncModalOpenState() {
    const hasOpenModal = Boolean(document.querySelector(".dashboard-modal:not([hidden])"));
    document.body.classList.toggle("dashboard-modal-open", hasOpenModal);
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
