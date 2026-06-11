/*
  Google Apps Script final - API Search Box + import data_obat.

  Paste seluruh isi file ini ke Kode.gs project "API Search Box".
  File reset.html tetap dipertahankan.
*/

var DATA_OBAT_SPREADSHEET_ID = '1jdtxpAZ-G545QfvbktjAihy2xXJeD8GbUFUx7W1TPdk';
var DATA_OBAT_SHEET_NAME = 'data_obat';
var USER_SHEET_NAME = 'user';
var EMPLOYEE_SHEET_NAME = 'data_karyawan';
var SUPPLIER_SHEET_NAME = 'data_supplier';
var RESTOCK_REQUESTS_SHEET_NAME = 'restock_requests';
var DATA_OBAT_LAST_UPLOAD_PROPERTY = 'DATA_OBAT_LAST_UPLOAD_AT';
var DATA_OBAT_FILTER_PROPERTY = 'DATA_OBAT_GLOBAL_FILTER';
var OWNER_ACTIVITY_LOG_PROPERTY = 'OWNER_ACTIVITY_LOG';
var ATTENDANCE_SHIFT_RULES_PROPERTY = 'ATTENDANCE_SHIFT_RULES';
var EMPLOYEE_STATUS_CACHE_KEY = 'EMPLOYEE_STATUS_MAP_V1';
var PHARMACY_PROFILE_SHEET_NAME = 'pharmacy_profile';
var EMPLOYEE_DEFAULT_HEADERS = ['name', 'phone', 'address', 'job', 'email', 'status', 'updated_at'];
var SUPPLIER_DEFAULT_HEADERS = ['name', 'address', 'phone', 'pic', 'updated_at'];
var RESTOCK_REQUEST_HEADERS = [
  'id',
  'code',
  'medicineName',
  'currentStock',
  'stockUnit',
  'realStock',
  'realStockUnit',
  'unit',
  'qty',
  'priority',
  'status',
  'reporter',
  'reporterKey',
  'note',
  'photo',
  'supplier',
  'createdAt',
  'updatedAt',
  'historyJson'
];
var DATA_OBAT_PRICE_HEADERS = [
  'hargabeli',
  'hargajual1',
  'hargajual2',
  'hargajual3',
  'hargajual4',
  'hargaresep1',
  'hargaresep2',
  'hargaresep3',
  'hargaresep4'
];
var DATA_OBAT_QUANTITY_HEADERS = [
  'stok',
  'stokmin',
  'stokkonversi1',
  'stokkonversi2',
  'stokkonversi3',
  'stokkonversi4'
];
var DATA_OBAT_DEFAULT_HEADERS = [
  'kode',
  'nama',
  'kategori',
  'stok',
  'satuan_beli',
  'harga_beli',
  'stok_min',
  'satuan_stok_min',
  'satuan_1',
  'satuan_2',
  'satuan_3',
  'satuan_4',
  'isi_1',
  'isi_2',
  'isi_3',
  'isi_4',
  'harga_jual_1',
  'laba_jual_1',
  'harga_jual_2',
  'laba_jual_2',
  'harga_jual_3',
  'laba_jual_3',
  'harga_jual_4',
  'laba_jual_4',
  'harga_resep_1',
  'isi_resep_1',
  'satuan_resep_1',
  'laba_resep_1',
  'stok_konversi_1',
  'satuan_konversi_1',
  'harga_resep_2',
  'isi_resep_2',
  'satuan_resep_2',
  'laba_resep_2',
  'stok_konversi_2',
  'satuan_konversi_2',
  'harga_resep_3',
  'isi_resep_3',
  'satuan_resep_3',
  'laba_resep_3',
  'stok_konversi_3',
  'satuan_konversi_3',
  'harga_resep_4',
  'isi_resep_4',
  'satuan_resep_4',
  'laba_resep_4',
  'stok_konversi_4',
  'satuan_konversi_4',
  'laba_otomatis',
  'suplier',
  'pabrik',
  'expired',
  'indikasi',
  'komposisi',
  'lokasi',
  'no_batch'
];

function doGet(e) {
  try {
    e = e || {};
    e.parameter = e.parameter || {};

    if (e.parameter.page == 'reset') {
      return renderResetPasswordPage_(e.parameter.email || '');
    }

    if (String(e.parameter.action || '').trim() == 'listLoginUsers') {
      var loginSheet = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID).getSheetByName(USER_SHEET_NAME);

      if (!loginSheet) {
        return jsonOutput_({
          success: false,
          ok: false,
          message: 'Sheet user tidak ditemukan'
        });
      }

      return handleListLoginUsers_(readUserRows_(loginSheet));
    }

    var sheetName = String(e.parameter.sheet || 'user').trim();

    if (sheetName == USER_SHEET_NAME) {
      return jsonOutput_({
        success: false,
        ok: false,
        message: 'Akses sheet user tidak diizinkan lewat GET.'
      });
    }

    var ss = getSpreadsheetBySheetName_(sheetName);
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return jsonOutput_({
        success: false,
        ok: false,
        message: 'Sheet tidak ditemukan: ' + sheetName
      });
    }

    var rows = readSheetAsObjects_(sheet, sheetName);

    if (sheetName == DATA_OBAT_SHEET_NAME) {
      return jsonOutput_({
        success: true,
        ok: true,
        sheet: sheetName,
        total: rows.length,
        updatedAt: getDataObatLastUploadAt_(),
        uploadedAt: getDataObatLastUploadAt_(),
        data: rows
      });
    }

    return jsonOutput_(rows);
  } catch (error) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: error.toString(),
      error: error.toString()
    });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    e = e || {};
    e.parameter = e.parameter || {};

    var data = parsePostData_(e);
    Object.keys(e.parameter).forEach(function(key) {
      if (data[key] == null) {
        data[key] = e.parameter[key];
      }
    });
    var action = String(data.action || e.parameter.action || '').trim();

    if (action == 'import_data_obat') {
      return handleImportDataObat_(data);
    }

    if (action == 'getDataObatFilter') {
      return handleGetDataObatFilter_();
    }

    if (action == 'saveDataObatFilter') {
      return handleSaveDataObatFilter_(data);
    }

    if (action == 'saveActivityLog') {
      return handleSaveActivityLog_(data);
    }

    if (action == 'listActivityLog') {
      return handleListActivityLog_(data);
    }

    if (action == 'getAttendanceShiftSettings') {
      return handleGetAttendanceShiftSettings_();
    }

    if (action == 'saveAttendanceShiftSettings') {
      return handleSaveAttendanceShiftSettings_(data);
    }

    if (action == 'getPharmacyProfile') {
      return handleGetPharmacyProfile_();
    }

    if (action == 'savePharmacyProfile') {
      return handleSavePharmacyProfile_(data);
    }

    if (action == 'listRestockRequests') {
      return handleListRestockRequests_(data);
    }

    if (action == 'saveRestockRequests') {
      return handleSaveRestockRequests_(data);
    }

    if (action == 'clearRestockRequests') {
      return handleClearRestockRequests_(data);
    }

    if (action == 'add_data_obat') {
      return handleAddDataObat_(data);
    }

    if (action == 'update_data_obat') {
      return handleUpdateDataObat_(data);
    }

    if (action == 'delete_data_obat') {
      return handleDeleteDataObat_(data);
    }

    if (action == 'listLocalRecords') {
      return handleListLocalRecords_(data);
    }

    if (action == 'saveLocalRecord') {
      return handleSaveLocalRecord_(data);
    }

    if (action == 'deleteLocalRecord') {
      return handleDeleteLocalRecord_(data);
    }

    var userSheet = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID).getSheetByName(USER_SHEET_NAME);

    if (!userSheet) {
      return jsonOutput_({
        success: false,
        ok: false,
        message: 'Sheet user tidak ditemukan'
      });
    }

    var users = readUserRows_(userSheet);

    if (action == 'login') {
      return handleLogin_(data, users);
    }

    if (action == 'listLoginUsers') {
      return handleListLoginUsers_(users);
    }

    if (action == 'saveLoginUser' || action == 'updateLoginUser') {
      return handleSaveLoginUser_(data, userSheet);
    }

    if (action == 'deleteLoginUser') {
      return handleDeleteLoginUser_(data, userSheet);
    }

    if (action == 'resetPassword') {
      return handleResetPassword_(data, users);
    }

    if (action == 'saveResetPassword' || action == 'updatePassword' || action == 'confirmResetPassword' || action == 'savePassword' || action == 'setPassword') {
      return handleSaveResetPassword_(data, userSheet);
    }

    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Action tidak ditemukan'
    });
  } catch (error) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: error.toString(),
      error: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

function handleLogin_(data, users) {
  var loginKey = normalizeLoginKey_(data.username || data.email || '');
  var password = String(data.password || '');
  var employeeStatusMap = getEmployeeStatusMap_();

  if (!loginKey || !password) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Email/username dan password wajib diisi'
    });
  }

  for (var i = 0; i < users.length; i += 1) {
    var user = users[i];
    var usernameKey = normalizeLoginKey_(user.username);
    var emailKey = normalizeLoginKey_(user.email);

    if ((usernameKey == loginKey || emailKey == loginKey) && String(user.password || '') == password) {
      if (isLoginUserInactive_(user, employeeStatusMap)) {
        return jsonOutput_({
          success: false,
          ok: false,
          message: 'Akun/karyawan sedang nonaktif. Silakan hubungi Owner/Admin.'
        });
      }

      return jsonOutput_({
        success: true,
        ok: true,
        username: user.username,
        name: user.name || user.username,
        role: user.role,
        email: user.email,
        menu: user.menu,
        status: user.status || 'Aktif',
        phone: user.phone || '',
        address: user.address || '',
        preferences: user.preferences || '',
        profilePreferences: user.preferences || '',
        profilePhoto: user.profilePhoto || '',
        photo: user.profilePhoto || ''
      });
    }
  }

  return jsonOutput_({
    success: false,
    ok: false,
    message: 'Username atau password salah'
  });
}

function handleListLoginUsers_(users) {
  var seen = {};
  var list = [];
  var employeeStatusMap = getEmployeeStatusMap_();

  users.forEach(function(user) {
    var username = String(user.username || '').trim();
    var key = normalizeLoginKey_(username);

    if (!username || seen[key]) return;
    if (isLoginUserInactive_(user, employeeStatusMap)) return;

    seen[key] = true;
    list.push({
      username: username,
      name: user.name || username,
      role: user.role,
      email: user.email,
      menu: user.menu,
      access: user.menu,
      status: user.status || 'Aktif',
      phone: user.phone || '',
      address: user.address || '',
      preferences: user.preferences || '',
      profilePreferences: user.preferences || '',
      profilePhoto: user.profilePhoto || '',
      photo: user.profilePhoto || ''
    });
  });

  list.sort(function(a, b) {
    return String(a.username || '').localeCompare(String(b.username || ''));
  });

  return jsonOutput_({
    success: true,
    ok: true,
    users: list
  });
}

function getEmployeeStatusMap_() {
  var map = {};

  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(EMPLOYEE_STATUS_CACHE_KEY);

    if (cached) {
      return JSON.parse(cached) || {};
    }

    readLocalRecordsByConfig_(getLocalRecordConfig_('employee')).forEach(function(employee) {
      var status = employee.status || 'Aktif';
      [
        employee.email,
        employee.name,
        employee.phone
      ].map(normalizeLoginKey_).filter(Boolean).forEach(function(key) {
        map[key] = status;
      });
    });

    cache.put(EMPLOYEE_STATUS_CACHE_KEY, JSON.stringify(map), 120);
  } catch (error) {}

  return map;
}

function clearEmployeeStatusCache_() {
  try {
    CacheService.getScriptCache().remove(EMPLOYEE_STATUS_CACHE_KEY);
  } catch (error) {}
}

function isLoginUserInactive_(user, employeeStatusMap) {
  if (isInactiveStatus_(user.status)) return true;

  var keys = [
    user.email,
    user.name,
    user.username,
    user.phone
  ].map(normalizeLoginKey_).filter(Boolean);

  for (var i = 0; i < keys.length; i += 1) {
    if (employeeStatusMap[keys[i]] && isInactiveStatus_(employeeStatusMap[keys[i]])) {
      return true;
    }
  }

  return false;
}

function isInactiveStatus_(value) {
  var key = normalizeHeaderKey_(value || 'Aktif');
  return key == 'nonaktif' || key == 'inactive' || key == 'nonactive' || key == 'tidakaktif' || key == 'keluar' || key == 'resign' || key == 'cuti';
}

function handleSaveLoginUser_(data, userSheet) {
  var input = data.user || data.record || data.profile || data;
  var originalUsername = pickRequestValueAllowEmpty_(data, ['originalUsername', 'oldUsername', 'previousUsername']);
  var originalEmail = pickRequestValueAllowEmpty_(data, ['originalEmail', 'oldEmail', 'previousEmail']);
  var username = String(pickRequestValue_(input, ['username', 'user', 'namauser']) || '').trim();
  var name = String(pickRequestValue_(input, ['name', 'nama', 'namaLengkap', 'fullName']) || username).trim();
  var email = String(pickRequestValueAllowEmpty_(input, ['email', 'alamatEmail', 'gmail']) || '').trim();
  var role = String(pickRequestValue_(input, ['role', 'akses', 'level']) || 'Operator').trim();
  var status = String(pickRequestValue_(input, ['status', 'aktif', 'keterangan']) || 'Aktif').trim();
  var phone = normalizePhoneValue_(pickRequestValueAllowEmpty_(input, ['phone', 'noHp', 'no_hp', 'telepon', 'hp']));
  var address = String(pickRequestValueAllowEmpty_(input, ['address', 'alamat']) || '').trim();
  var profilePhoto = String(pickRequestValueAllowEmpty_(input, ['profilePhoto', 'photo', 'foto', 'profile_photo', 'fotoProfil']) || '');
  var preferences = normalizeUserPreferencesValue_(pickRequestValueAllowEmpty_(input, ['preferences', 'profilePreferences', 'profile_preferences', 'preferensi']));
  var password = String(pickRequestValueAllowEmpty_(input, ['password', 'pass', 'kata_sandi', 'katasandi']) || '');
  var hasMenu = hasRequestKey_(input, ['access', 'menu', 'aksesMenu', 'menuakses']);
  var hasPhoto = hasRequestKey_(input, ['profilePhoto', 'photo', 'foto', 'profile_photo', 'fotoProfil']);
  var hasPreferences = hasRequestKey_(input, ['preferences', 'profilePreferences', 'profile_preferences', 'preferensi']);
  var menuValue = hasMenu
    ? normalizeUserMenuValue_(pickRequestValueAllowEmpty_(input, ['access', 'menu', 'aksesMenu', 'menuakses']))
    : '';

  if (!username && name) username = name;
  role = normalizeSpecialUserRole_(role, username, name, email);

  if (!username) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Username operator wajib diisi.'
    });
  }

  if (profilePhoto && profilePhoto.length > 48000) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Foto profil terlalu besar. Coba unggah foto lain yang lebih kecil.'
    });
  }

  var values = userSheet.getDataRange().getDisplayValues();

  if (!values.length) {
    userSheet.getRange(1, 1, 1, 6).setValues([['username', 'password', 'role', 'email', 'menu', 'status']]);
    values = userSheet.getDataRange().getDisplayValues();
  }

  var headers = values[0].map(normalizeHeaderKey_);
  var usernameColumn = ensureUserColumn_(userSheet, headers, ['username', 'user', 'namauser', 'nama'], 'username');
  var nameColumn = ensureUserColumn_(userSheet, headers, ['name', 'namalengkap', 'namaoperator', 'fullname'], 'name');
  var roleColumn = ensureUserColumn_(userSheet, headers, ['role', 'akses', 'level'], 'role');
  var emailColumn = ensureUserColumn_(userSheet, headers, ['email', 'alamatemail', 'gmail'], 'email');
  var menuColumn = ensureUserColumn_(userSheet, headers, ['menu', 'aksesmenu', 'menuakses'], 'menu');
  var statusColumn = ensureUserColumn_(userSheet, headers, ['status', 'aktif', 'keterangan'], 'status');
  var phoneColumn = ensureUserColumn_(userSheet, headers, ['phone', 'nohp', 'telepon', 'hp'], 'phone');
  var addressColumn = ensureUserColumn_(userSheet, headers, ['address', 'alamat'], 'address');
  var profilePhotoColumn = ensureUserColumn_(userSheet, headers, ['profilephoto', 'foto', 'photo', 'fotoprofil'], 'profile_photo');
  var preferencesColumn = ensureUserColumn_(userSheet, headers, ['preferences', 'profilepreferences', 'profile_preferences', 'preferensi'], 'profile_preferences');
  var passwordColumn = findHeaderColumn_(headers, ['password', 'pass', 'kata_sandi', 'katasandi']);
  userSheet.getRange(1, phoneColumn + 1, userSheet.getMaxRows(), 1).setNumberFormat('@');

  values = userSheet.getDataRange().getDisplayValues();
  headers = values[0].map(normalizeHeaderKey_);

  var rowIndex = findUserSheetRowIndex_(values, headers, {
    username: username,
    name: name,
    email: email,
    originalUsername: originalUsername,
    originalEmail: originalEmail
  });
  var rowNumber = rowIndex >= 1 ? rowIndex + 1 : userSheet.getLastRow() + 1;

  if (!hasMenu && rowIndex >= 1) {
    menuValue = String(values[rowIndex][menuColumn] || '');
  }

  if (!hasPhoto && rowIndex >= 1) {
    profilePhoto = String(values[rowIndex][profilePhotoColumn] || '');
  }

  if (!hasPreferences && rowIndex >= 1) {
    preferences = String(values[rowIndex][preferencesColumn] || '');
  }

  userSheet.getRange(rowNumber, usernameColumn + 1).setValue(username);
  userSheet.getRange(rowNumber, nameColumn + 1).setValue(name || username);
  userSheet.getRange(rowNumber, roleColumn + 1).setValue(role);
  userSheet.getRange(rowNumber, emailColumn + 1).setValue(email);
  userSheet.getRange(rowNumber, menuColumn + 1).setValue(menuValue);
  userSheet.getRange(rowNumber, statusColumn + 1).setValue(status);
  userSheet.getRange(rowNumber, phoneColumn + 1).setValue(phone);
  userSheet.getRange(rowNumber, addressColumn + 1).setValue(address);
  userSheet.getRange(rowNumber, profilePhotoColumn + 1).setValue(profilePhoto);
  userSheet.getRange(rowNumber, preferencesColumn + 1).setValue(preferences);

  if (password && passwordColumn >= 0) {
    userSheet.getRange(rowNumber, passwordColumn + 1).setValue(password);
  }

  SpreadsheetApp.flush();

  return jsonOutput_({
    success: true,
    ok: true,
    message: 'Data operator berhasil disimpan ke Google Sheet.',
    user: {
      username: username,
      name: name || username,
      role: role,
      email: email,
      menu: menuValue,
      access: menuValue,
      status: status,
      phone: phone,
      address: address,
      preferences: preferences,
      profilePreferences: preferences,
      profilePhoto: profilePhoto,
      photo: profilePhoto
    }
  });
}

function handleDeleteLoginUser_(data, userSheet) {
  var values = userSheet.getDataRange().getDisplayValues();

  if (values.length < 2) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Data user kosong.'
    });
  }

  var headers = values[0].map(normalizeHeaderKey_);
  var rowIndex = findUserSheetRowIndex_(values, headers, {
    username: pickRequestValueAllowEmpty_(data, ['username', 'user', 'name']),
    email: pickRequestValueAllowEmpty_(data, ['email'])
  });

  if (rowIndex < 1) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Operator tidak ditemukan di Google Sheet.'
    });
  }

  userSheet.deleteRow(rowIndex + 1);
  SpreadsheetApp.flush();

  return jsonOutput_({
    success: true,
    ok: true,
    message: 'Operator berhasil dihapus dari Google Sheet.'
  });
}

function handleResetPassword_(data, users) {
  var usernameKey = normalizeLoginKey_(data.username || '');
  var emailKey = normalizeLoginKey_(data.email || '');

  if (!usernameKey || !emailKey) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Username dan email wajib diisi'
    });
  }

  for (var i = 0; i < users.length; i += 1) {
    var user = users[i];
    var dbUsernameKey = normalizeLoginKey_(user.username);
    var dbEmailKey = normalizeLoginKey_(user.email);

    if (dbUsernameKey == usernameKey) {
      if (!user.email) {
        return jsonOutput_({
          success: false,
          ok: false,
          message: 'Email akun belum terisi di Google Sheet'
        });
      }

      if (dbEmailKey != emailKey) {
        return jsonOutput_({
          success: false,
          ok: false,
          message: 'Email tidak sesuai dengan data akun di Google Sheet'
        });
      }

      var resetUrl = buildResetPasswordUrl_(user.email);

      MailApp.sendEmail({
        to: user.email,
        subject: 'Reset Password - Indo Apotek',
        htmlBody: [
          '<p>Halo ' + escapeHtml_(user.username || user.email) + ',</p>',
          '<p>Klik link berikut untuk membuka halaman reset password:</p>',
          '<p><a href="' + resetUrl + '">Reset Password</a></p>',
          '<p>Jika Anda tidak meminta reset password, abaikan email ini.</p>',
          '<p>Indo Apotek</p>'
        ].join('')
      });

      return jsonOutput_({
        success: true,
        ok: true,
        message: 'Link reset password berhasil dikirim ke email terdaftar'
      });
    }
  }

  return jsonOutput_({
    success: false,
    ok: false,
    message: 'Username tidak ditemukan'
  });
}

function handleSaveResetPassword_(data, userSheet) {
  return jsonOutput_(saveResetPassword_(
    pickRequestValue_(data, ['email', 'resetEmail']),
    pickRequestValue_(data, ['password', 'newPassword', 'passwordBaru', 'new_password']),
    pickRequestValue_(data, ['confirmPassword', 'confirm_password', 'ulangiPassword', 'konfirmasiPassword']),
    userSheet
  ));
}

function updateResetPassword(email, password, confirmPassword) {
  var userSheet = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID).getSheetByName(USER_SHEET_NAME);

  if (!userSheet) {
    return {
      success: false,
      ok: false,
      message: 'Sheet user tidak ditemukan'
    };
  }

  return saveResetPassword_(email, password, confirmPassword, userSheet);
}

function savePassword(email, password, confirmPassword) {
  return updateResetPassword(email, password, confirmPassword);
}

function saveNewPassword(email, password, confirmPassword) {
  return updateResetPassword(email, password, confirmPassword);
}

function simpanPasswordBaru(email, password, confirmPassword) {
  return updateResetPassword(email, password, confirmPassword);
}

function updatePassword(email, password, confirmPassword) {
  return updateResetPassword(email, password, confirmPassword);
}

function saveResetPassword_(email, password, confirmPassword, userSheet) {
  var cleanEmail = normalizeLoginKey_(email || '');
  var newPassword = String(password || '');
  var confirm = confirmPassword == null ? newPassword : String(confirmPassword || '');
  var passwordError = validateNewPassword_(newPassword, confirm);

  if (!cleanEmail) {
    return {
      success: false,
      ok: false,
      message: 'Email reset password tidak ditemukan.'
    };
  }

  if (passwordError) {
    return {
      success: false,
      ok: false,
      message: passwordError
    };
  }

  var values = userSheet.getDataRange().getDisplayValues();

  if (values.length < 2) {
    return {
      success: false,
      ok: false,
      message: 'Data user kosong.'
    };
  }

  var headers = values[0].map(normalizeHeaderKey_);
  var emailColumn = findHeaderColumn_(headers, ['email', 'alamatemail', 'gmail']);
  var passwordColumn = findHeaderColumn_(headers, ['password', 'pass', 'kata_sandi', 'katasandi']);

  if (emailColumn < 0) {
    return {
      success: false,
      ok: false,
      message: 'Kolom email tidak ditemukan di sheet user.'
    };
  }

  if (passwordColumn < 0) {
    return {
      success: false,
      ok: false,
      message: 'Kolom password tidak ditemukan di sheet user.'
    };
  }

  for (var i = 1; i < values.length; i += 1) {
    var rowEmail = normalizeLoginKey_(values[i][emailColumn] || '');

    if (rowEmail == cleanEmail) {
      userSheet.getRange(i + 1, passwordColumn + 1).setValue(newPassword);
      SpreadsheetApp.flush();

      return {
        success: true,
        ok: true,
        message: 'Password baru berhasil disimpan. Silakan login kembali.'
      };
    }
  }

  return {
    success: false,
    ok: false,
    message: 'Email tidak ditemukan di sheet user.'
  };
}

function validateNewPassword_(password, confirmPassword) {
  if (!password) {
    return 'Password baru wajib diisi.';
  }

  if (password.length < 6) {
    return 'Password baru minimal 6 karakter.';
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password baru wajib kombinasi huruf dan angka.';
  }

  if (password != confirmPassword) {
    return 'Konfirmasi password tidak sama.';
  }

  return '';
}

function handleGetDataObatFilter_() {
  var stored = String(PropertiesService.getScriptProperties().getProperty(DATA_OBAT_FILTER_PROPERTY) || '').trim();
  var filter = {};

  if (stored) {
    try {
      filter = JSON.parse(stored) || {};
    } catch (error) {
      filter = {};
    }
  }

  return jsonOutput_({
    success: true,
    ok: true,
    filter: sanitizeDataObatFilter_(filter)
  });
}

function handleSaveDataObatFilter_(data) {
  var role = normalizeLoginKey_(data.role || '');
  var isAllowed = role == 'owner' || role == 'admin' || role == 'administrator';

  if (!isAllowed) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Hanya owner/admin yang dapat menyimpan filter global data obat.'
    });
  }

  var filter = sanitizeDataObatFilter_(data.filter || {});
  filter.updatedAt = new Date().toISOString();
  filter.updatedBy = String(data.username || filter.updatedBy || '').trim();

  PropertiesService.getScriptProperties().setProperty(DATA_OBAT_FILTER_PROPERTY, JSON.stringify(filter));

  return jsonOutput_({
    success: true,
    ok: true,
    filter: filter,
    message: 'Filter data obat berhasil disimpan'
  });
}

function handleSaveActivityLog_(data) {
  var item = sanitizeActivityLogItem_(data.activity || data);
  var list = readActivityLog_();

  list.unshift(item);
  list = list.slice(0, 120);

  PropertiesService.getScriptProperties().setProperty(OWNER_ACTIVITY_LOG_PROPERTY, JSON.stringify(list));

  return jsonOutput_({
    success: true,
    ok: true,
    activity: item
  });
}

function handleListActivityLog_(data) {
  var limit = Number(data.limit || 30);
  if (!limit || limit < 1) limit = 30;
  if (limit > 120) limit = 120;
  var role = normalizeLoginKey_(data.role || '');
  var isOwner = role == 'owner' || normalizeLoginKey_(data.username || data.actor || '') == 'owner';
  var list = readActivityLog_();

  if (!isOwner) {
    var keys = [
      data.username,
      data.email,
      data.actor
    ].map(normalizeLoginKey_).filter(Boolean);

    list = list.filter(function(item) {
      var identityText = normalizeLoginKey_([item.username, item.email, item.actor].join(' '));
      var accountText = normalizeLoginKey_([item.title, item.detail, item.scope].join(' '));
      var isAccountEvent = /akun|profil|foto|password|preferensi|login|logout|email/.test(accountText);
      var isOwn = keys.some(function(key) {
        return key && identityText.indexOf(key) >= 0;
      });

      return isAccountEvent && isOwn;
    });
  }

  return jsonOutput_({
    success: true,
    ok: true,
    activities: list.slice(0, limit)
  });
}

function readActivityLog_() {
  var stored = String(PropertiesService.getScriptProperties().getProperty(OWNER_ACTIVITY_LOG_PROPERTY) || '').trim();

  if (!stored) return [];

  try {
    var parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function sanitizeActivityLogItem_(item) {
  item = item && typeof item == 'object' ? item : {};

  return {
    title: String(item.title || 'Aktivitas').slice(0, 120),
    detail: String(item.detail || '').slice(0, 220),
    actor: String(item.actor || '').slice(0, 120),
    role: String(item.role || '').slice(0, 60),
    username: String(item.username || '').slice(0, 120),
    email: String(item.email || '').slice(0, 120),
    scope: String(item.scope || '').slice(0, 60),
    at: String(item.at || new Date().toISOString())
  };
}

function handleGetAttendanceShiftSettings_() {
  var stored = String(PropertiesService.getScriptProperties().getProperty(ATTENDANCE_SHIFT_RULES_PROPERTY) || '').trim();
  var settings = stored ? safeParseObject_(stored) : {};
  settings = sanitizeAttendanceShiftSettings_(settings);

  return jsonOutput_({
    success: true,
    ok: true,
    settings: settings,
    rules: settings
  });
}

function handleSaveAttendanceShiftSettings_(data) {
  var role = normalizeLoginKey_(data.role || '');
  var username = normalizeLoginKey_(data.username || data.actor || '');
  var isAllowed = role == 'owner' || role == 'admin' || role == 'administrator' || username == 'owner';

  if (!isAllowed) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Hanya owner/admin yang dapat menyimpan pengaturan shift absensi.'
    });
  }

  var settings = sanitizeAttendanceShiftSettings_(data.settings || data.rules || data.shiftSettings || {});
  settings.updatedAt = new Date().toISOString();
  settings.updatedBy = String(data.username || data.actor || '').trim();

  PropertiesService.getScriptProperties().setProperty(ATTENDANCE_SHIFT_RULES_PROPERTY, JSON.stringify(settings));

  return jsonOutput_({
    success: true,
    ok: true,
    settings: settings,
    rules: settings,
    message: 'Pengaturan shift absensi berhasil disimpan online.'
  });
}

function handleGetPharmacyProfile_() {
  return jsonOutput_({
    success: true,
    ok: true,
    profile: sanitizePharmacyProfile_(readPharmacyProfile_())
  });
}

function handleSavePharmacyProfile_(data) {
  var role = normalizeLoginKey_(data.role || '');
  var username = normalizeLoginKey_(data.username || data.actor || '');
  var isAllowed = role == 'owner' || username == 'owner';

  if (!isAllowed) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Hanya owner yang dapat menyimpan identitas apotek.'
    });
  }

  var profile = sanitizePharmacyProfile_(data.profile || data.identity || data);
  profile.updatedAt = new Date().toISOString();
  profile.updatedBy = String(data.username || data.actor || '').trim();

  writePharmacyProfile_(profile);

  return jsonOutput_({
    success: true,
    ok: true,
    profile: profile,
    message: 'Identitas apotek berhasil disimpan online.'
  });
}

function readPharmacyProfile_() {
  var sheet = getPharmacyProfileSheet_();
  var value = String(sheet.getRange('A2').getDisplayValue() || '').trim();

  if (!value) {
    return {};
  }

  return safeParseObject_(value);
}

function writePharmacyProfile_(profile) {
  var sheet = getPharmacyProfileSheet_();
  sheet.getRange('A2').setValue(JSON.stringify(profile || {}));
}

function getPharmacyProfileSheet_() {
  var ss = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(PHARMACY_PROFILE_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(PHARMACY_PROFILE_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange('A1').setValue('profile_json');
    sheet.setColumnWidth(1, 600);
  }

  return sheet;
}

function sanitizePharmacyProfile_(value) {
  value = value && typeof value == 'object' ? value : {};

  var profile = {
    logo: normalizePharmacyLogo_(value.logo || value.logoUrl || value.logoData || ''),
    name: String(value.name || value.namaApotek || value.pharmacyName || 'Apotek Anda').trim() || 'Apotek Anda',
    address: String(value.address || value.alamat || value.pharmacyAddress || '').trim(),
    phone: String(value.phone || value.telepon || value.noHp || '').trim(),
    email: String(value.email || '').trim(),
    website: String(value.website || value.social || '').trim(),
    latitude: String(value.latitude || value.lat || '').trim(),
    longitude: String(value.longitude || value.lng || value.lon || '').trim(),
    gpsAccuracy: String(value.gpsAccuracy || value.accuracy || '').trim(),
    licenseNumber: String(value.licenseNumber || value.sia || value.suratIzinApotek || '').trim(),
    licenseExpiry: String(value.licenseExpiry || value.siaExpiry || '').trim(),
    responsiblePharmacist: String(value.responsiblePharmacist || value.apotekerPenanggungJawab || '').trim(),
    sipaNumber: String(value.sipaNumber || value.sipa || '').trim(),
    updatedAt: String(value.updatedAt || '').trim(),
    updatedBy: String(value.updatedBy || '').trim()
  };

  if (!profile.logo) {
    profile.logo = '';
  }

  return profile;
}

function normalizePharmacyLogo_(value) {
  var logo = String(value || '').trim();

  if (/^(data:image\/|https?:\/\/|assets\/)/i.test(logo)) {
    return logo;
  }

  return '';
}

function handleListRestockRequests_(data) {
  var requests = readRestockRequests_();

  return jsonOutput_({
    success: true,
    ok: true,
    total: requests.length,
    requests: requests
  });
}

function handleSaveRestockRequests_(data) {
  var requests = data.requests || data.restockRequests || [];

  if (Object.prototype.toString.call(requests) != '[object Array]') {
    requests = [];
  }

  requests = requests.map(sanitizeRestockRequest_).filter(function(item) {
    return item.id && item.medicineName;
  });

  writeRestockRequests_(requests);

  return jsonOutput_({
    success: true,
    ok: true,
    total: requests.length,
    requests: requests,
    message: 'Data restok berhasil disinkronkan online.'
  });
}

function handleClearRestockRequests_(data) {
  var role = normalizeLoginKey_(data.role || '');
  var username = normalizeLoginKey_(data.username || data.actor || '');
  var isAllowed = role == 'owner' || role == 'admin' || role == 'administrator' || username == 'owner';

  if (!isAllowed) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: 'Hanya owner/admin yang dapat mengosongkan data restok online.'
    });
  }

  writeRestockRequests_([]);

  return jsonOutput_({
    success: true,
    ok: true,
    total: 0,
    requests: [],
    message: 'Data restok online berhasil dikosongkan.'
  });
}

function readRestockRequests_() {
  var sheet = getRestockRequestsSheet_();
  var headers = ensureRestockRequestHeaders_(sheet);
  var values = sheet.getDataRange().getDisplayValues();

  if (values.length < 2) return [];

  return values.slice(1).map(function(row) {
    return readRestockRequestFromRow_(headers, row);
  }).filter(function(item) {
    return item.id && item.medicineName;
  });
}

function writeRestockRequests_(requests) {
  var sheet = getRestockRequestsSheet_();
  var headers = ensureRestockRequestHeaders_(sheet);
  var lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, Math.max(headers.length, sheet.getLastColumn())).clearContent();
  }

  if (!requests.length) {
    SpreadsheetApp.flush();
    return;
  }

  var values = requests.map(function(item) {
    item = sanitizeRestockRequest_(item);
    return headers.map(function(header) {
      var key = normalizeHeaderKey_(header);
      if (key == 'historyjson') return JSON.stringify(item.history || []);
      return item[key] != null ? item[key] : item[header] != null ? item[header] : '';
    });
  });

  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  SpreadsheetApp.flush();
}

function readRestockRequestFromRow_(headers, row) {
  var raw = {};

  headers.forEach(function(header, index) {
    raw[normalizeHeaderKey_(header) || ('kolom' + (index + 1))] = row[index];
  });

  return sanitizeRestockRequest_({
    id: pickDataValue_(raw, ['id']),
    code: pickDataValue_(raw, ['code', 'kode']),
    medicineName: pickDataValue_(raw, ['medicinename', 'nama', 'namaobat']),
    currentStock: pickDataValue_(raw, ['currentstock', 'stok']),
    stockUnit: pickDataValue_(raw, ['stockunit', 'satuanstok']),
    realStock: pickDataValue_(raw, ['realstock', 'stokreal', 'stokfisik', 'physicalstock']),
    realStockUnit: pickDataValue_(raw, ['realstockunit', 'satuanstokreal']),
    unit: pickDataValue_(raw, ['unit', 'satuan']),
    qty: pickDataValue_(raw, ['qty', 'requestqty', 'permintaan']),
    priority: pickDataValue_(raw, ['priority', 'prioritas']),
    status: pickDataValue_(raw, ['status']),
    reporter: pickDataValue_(raw, ['reporter', 'pelapor']),
    reporterKey: pickDataValue_(raw, ['reporterkey', 'username']),
    note: pickDataValue_(raw, ['note', 'catatan']),
    photo: pickDataValue_(raw, ['photo', 'foto']),
    supplier: pickDataValue_(raw, ['supplier', 'suplier']),
    createdAt: pickDataValue_(raw, ['createdat', 'tanggal']),
    updatedAt: pickDataValue_(raw, ['updatedat']),
    history: parseRestockHistory_(pickDataValue_(raw, ['historyjson', 'history']))
  });
}

function getRestockRequestsSheet_() {
  var ss = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID);
  return ss.getSheetByName(RESTOCK_REQUESTS_SHEET_NAME) || ss.insertSheet(RESTOCK_REQUESTS_SHEET_NAME);
}

function ensureRestockRequestHeaders_(sheet) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    sheet.getRange(1, 1, 1, RESTOCK_REQUEST_HEADERS.length).setValues([RESTOCK_REQUEST_HEADERS]);
    return RESTOCK_REQUEST_HEADERS.slice();
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function(header) {
    return String(header || '').trim();
  });

  if (!headers.filter(Boolean).length) {
    sheet.getRange(1, 1, 1, RESTOCK_REQUEST_HEADERS.length).setValues([RESTOCK_REQUEST_HEADERS]);
    return RESTOCK_REQUEST_HEADERS.slice();
  }

  var normalizedHeaders = headers.map(normalizeHeaderKey_);

  RESTOCK_REQUEST_HEADERS.forEach(function(header) {
    if (normalizedHeaders.indexOf(normalizeHeaderKey_(header)) >= 0) return;
    sheet.getRange(1, headers.length + 1).setValue(header);
    headers.push(header);
    normalizedHeaders.push(normalizeHeaderKey_(header));
  });

  return headers;
}

function sanitizeRestockRequest_(item) {
  item = item && typeof item == 'object' ? item : {};

  var now = new Date().toISOString();
  var createdAt = sanitizeRestockTimestamp_(item.createdAt || item.date || item.tanggal, now);
  var updatedAt = sanitizeRestockTimestamp_(item.updatedAt || item.updated_at, createdAt);
  var history = parseRestockHistory_(item.history);
  var photo = String(item.photo || item.foto || '').trim();
  var realStock = item.realStock;

  if (realStock == null || realStock === '') {
    realStock = item.stokReal != null && item.stokReal !== '' ? item.stokReal : item.stok_real;
  }

  if (realStock == null || realStock === '') {
    realStock = item.physicalStock != null && item.physicalStock !== '' ? item.physicalStock : item.stokFisik;
  }

  if (realStock == null || realStock === '') {
    realStock = item.stok_fisik;
  }

  if (photo.length > 48000 || !/^(data:image\/|https?:\/\/|assets\/)/i.test(photo)) {
    photo = '';
  }

  return {
    id: String(item.id || ('RST-' + new Date().getTime())).slice(0, 90),
    code: String(item.code || item.kode || '').trim().slice(0, 120),
    medicineName: String(item.medicineName || item.nama || item.name || '').trim().slice(0, 220),
    currentStock: String(item.currentStock || item.stok || '0').trim().slice(0, 80),
    stockUnit: String(item.stockUnit || item.currentStockUnit || item.satuanStok || item.unit || 'Pcs').trim().slice(0, 60) || 'Pcs',
    realStock: String(realStock == null ? '' : realStock).trim().slice(0, 80),
    realStockUnit: String(item.realStockUnit || item.stokRealUnit || item.stok_real_unit || item.stockUnit || item.currentStockUnit || item.satuanStok || item.unit || 'Pcs').trim().slice(0, 60) || 'Pcs',
    unit: String(item.unit || item.requestUnit || item.satuan || 'Pcs').trim().slice(0, 60) || 'Pcs',
    qty: Math.max(1, Number(item.qty || item.requestQty || item.quantity || item.permintaan || 1) || 1),
    priority: normalizeRestockPriority_(item.priority || item.prioritas),
    status: normalizeRestockStatus_(item.status),
    reporter: String(item.reporter || item.pelapor || '').trim().slice(0, 160),
    reporterKey: String(item.reporterKey || item.username || item.email || '').trim().slice(0, 160),
    note: String(item.note || item.catatan || '').trim().slice(0, 1200),
    photo: photo,
    supplier: String(item.supplier || item.suplier || '').trim().slice(0, 180),
    createdAt: createdAt,
    updatedAt: updatedAt,
    history: history.slice(0, 80)
  };
}

function normalizeRestockPriority_(value) {
  var key = normalizeLoginKey_(value || '');
  if (key == 'urgent' || key == 'mendesak') return 'urgent';
  if (key == 'important' || key == 'penting') return 'important';
  return 'normal';
}

function normalizeRestockStatus_(value) {
  var key = normalizeLoginKey_(value || '');
  if (key == 'processing' || key == 'diproses' || key == 'sedang diproses') return 'processing';
  if (key == 'done' || key == 'selesai') return 'done';
  if (key == 'rejected' || key == 'ditolak' || key == 'tolak') return 'rejected';
  return 'pending';
}

function sanitizeRestockTimestamp_(value, fallback) {
  var text = String(value || '').trim();
  if (!text) return fallback;
  var date = new Date(text);
  if (isNaN(date.getTime())) return fallback;
  return date.toISOString();
}

function parseRestockHistory_(value) {
  if (Object.prototype.toString.call(value) == '[object Array]') return value;
  var text = String(value || '').trim();
  if (!text) return [];

  try {
    var parsed = JSON.parse(text);
    return Object.prototype.toString.call(parsed) == '[object Array]' ? parsed : [];
  } catch (error) {
    return [];
  }
}

function safeParseObject_(text) {
  try {
    var parsed = JSON.parse(String(text || '{}'));
    return parsed && typeof parsed == 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function getDefaultAttendanceShiftSettings_() {
  var dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  var settings = {
    updatedAt: '',
    updatedBy: '',
    days: {}
  };

  dayKeys.forEach(function(dayKey) {
    var isSunday = dayKey == 'sunday';
    settings.days[dayKey] = {
      pagi: {
        start: '08:00',
        lateMinutes: isSunday ? 15 : 45,
        deadline: isSunday ? '08:15' : '08:45',
        returnStart: isSunday ? '15:00' : '15:30'
      },
      sore: {
        start: '14:00',
        lateMinutes: 30,
        deadline: '14:30',
        returnStart: '21:00'
      }
    };
  });

  return settings;
}

function sanitizeAttendanceShiftSettings_(value) {
  if (typeof value == 'string') {
    value = safeParseObject_(value);
  }

  value = value && typeof value == 'object' ? value : {};

  var defaults = getDefaultAttendanceShiftSettings_();
  var settings = getDefaultAttendanceShiftSettings_();
  var dayKeys = Object.keys(defaults.days);
  var shiftKeys = ['pagi', 'sore'];

  settings.updatedAt = String(value.updatedAt || '').trim();
  settings.updatedBy = String(value.updatedBy || '').trim();

  dayKeys.forEach(function(dayKey) {
    shiftKeys.forEach(function(shiftKey) {
      var source = value.days && value.days[dayKey] && value.days[dayKey][shiftKey]
        ? value.days[dayKey][shiftKey]
        : {};
      var fallback = defaults.days[dayKey][shiftKey];
      var start = sanitizeAttendanceTime_(source.start, fallback.start);
      var deadline = sanitizeAttendanceTime_(source.deadline, fallback.deadline);

      settings.days[dayKey][shiftKey] = {
        start: start,
        lateMinutes: calculateAttendanceLateMinutes_(start, deadline, fallback.lateMinutes),
        deadline: deadline,
        returnStart: sanitizeAttendanceTime_(source.returnStart, fallback.returnStart)
      };
    });
  });

  return settings;
}

function sanitizeAttendanceTime_(value, fallback) {
  var text = String(value || '').trim();
  var match = text.match(/^(\d{1,2})[:.](\d{2})$/);

  if (!match) return fallback;

  var hour = Number(match[1]);
  var minute = Number(match[2]);

  if (!isFinite(hour) || !isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return fallback;
  }

  return String(hour).replace(/^(\d)$/, '0$1') + ':' + String(minute).replace(/^(\d)$/, '0$1');
}

function calculateAttendanceLateMinutes_(start, deadline, fallback) {
  var startMinutes = getAttendanceTimeMinutes_(start);
  var deadlineMinutes = getAttendanceTimeMinutes_(deadline);

  if (startMinutes < 0 || deadlineMinutes < 0) return fallback;

  var diff = deadlineMinutes >= startMinutes
    ? deadlineMinutes - startMinutes
    : deadlineMinutes + 1440 - startMinutes;

  return Math.min(240, Math.max(0, Math.round(diff)));
}

function getAttendanceTimeMinutes_(value) {
  var match = String(value || '').trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return -1;

  var hour = Number(match[1]);
  var minute = Number(match[2]);

  if (!isFinite(hour) || !isFinite(minute)) return -1;

  return hour * 60 + minute;
}

function sanitizeDataObatFilter_(filter) {
  filter = filter && typeof filter == 'object' ? filter : {};

  var allowedStock = {
    '': true,
    empty: true,
    low: true,
    ready: true
  };
  var allowedExpired = {
    '': true,
    expired: true,
    soon: true,
    safe: true,
    blank: true
  };
  var allowedColumns = DATA_OBAT_DEFAULT_HEADERS.reduce(function(map, header) {
    map[header] = true;
    return map;
  }, {});

  var visibleColumns = Array.isArray(filter.visibleColumns)
    ? filter.visibleColumns.map(function(column) {
      return String(column || '').trim();
    }).filter(function(column) {
      return allowedColumns[column];
    })
    : [];

  return {
    category: String(filter.category || '').trim(),
    supplier: String(filter.supplier || '').trim(),
    stockLevel: allowedStock[String(filter.stockLevel || '')] ? String(filter.stockLevel || '') : '',
    expiredLevel: allowedExpired[String(filter.expiredLevel || '')] ? String(filter.expiredLevel || '') : '',
    visibleColumns: visibleColumns.length ? visibleColumns : DATA_OBAT_DEFAULT_HEADERS.slice(),
    updatedAt: String(filter.updatedAt || '').trim(),
    updatedBy: String(filter.updatedBy || '').trim()
  };
}

function handleListLocalRecords_(data) {
  var type = normalizeHeaderKey_(data.type || '');
  var result = {
    success: true,
    ok: true
  };

  if (!type || type == 'employee' || type == 'karyawan' || type == 'datakaryawan') {
    result.employees = readLocalRecordsByConfig_(getLocalRecordConfig_('employee'));
  }

  if (!type || type == 'supplier' || type == 'suplier' || type == 'datasupplier') {
    result.suppliers = readLocalRecordsByConfig_(getLocalRecordConfig_('supplier'));
  }

  return jsonOutput_(result);
}

function handleSaveLocalRecord_(data) {
  var config = getLocalRecordConfig_(data.type || data.sheet || '');
  var record = data.record || data.data || data.item || data;
  var sheet = getLocalRecordSheet_(config);
  var headers = ensureLocalRecordHeaders_(sheet, config);
  var values = sheet.getDataRange().getDisplayValues();
  var rowIndex = findLocalRecordRowIndex_(values, headers, config, {
    originalName: data.originalName,
    originalEmail: data.originalEmail,
    originalPhone: data.originalPhone,
    name: pickRequestValueAllowEmpty_(record, config.aliases.name),
    email: pickRequestValueAllowEmpty_(record, config.aliases.email || []),
    phone: pickRequestValueAllowEmpty_(record, config.aliases.phone || []),
    pic: pickRequestValueAllowEmpty_(record, config.aliases.pic || [])
  });
  var rowNumber = rowIndex >= 1 ? rowIndex + 1 : sheet.getLastRow() + 1;
  var now = new Date().toISOString();
  var normalizedHeaders = headers.map(normalizeHeaderKey_);

  config.fields.forEach(function(field) {
    var column = findHeaderColumn_(normalizedHeaders, config.aliases[field] || [field]);
    if (column < 0) return;

    var value = field == 'updated_at'
      ? now
      : pickRequestValueAllowEmpty_(record, config.aliases[field] || [field]);

    if (field == 'phone') value = normalizePhoneValue_(value);
    sheet.getRange(rowNumber, column + 1).setValue(value);
  });

  SpreadsheetApp.flush();

  if (config.type == 'employee') {
    clearEmployeeStatusCache_();
  }

  headers = ensureLocalRecordHeaders_(sheet, config);
  values = sheet.getDataRange().getDisplayValues();
  var saved = readLocalRecordFromRow_(headers, values[rowNumber - 1], config);

  return jsonOutput_({
    success: true,
    ok: true,
    type: config.type,
    record: saved,
    rowNumber: rowNumber,
    message: config.title + ' berhasil disimpan online.'
  });
}

function handleDeleteLocalRecord_(data) {
  var config = getLocalRecordConfig_(data.type || data.sheet || '');
  var sheet = getLocalRecordSheet_(config);
  var headers = ensureLocalRecordHeaders_(sheet, config);
  var values = sheet.getDataRange().getDisplayValues();
  var rowIndex = findLocalRecordRowIndex_(values, headers, config, {
    originalName: data.originalName,
    originalEmail: data.originalEmail,
    originalPhone: data.originalPhone,
    name: data.name,
    email: data.email,
    phone: data.phone,
    pic: data.pic
  });

  if (rowIndex < 1) {
    return jsonOutput_({
      success: false,
      ok: false,
      message: config.title + ' tidak ditemukan di Google Sheet.'
    });
  }

  sheet.deleteRow(rowIndex + 1);
  SpreadsheetApp.flush();

  if (config.type == 'employee') {
    clearEmployeeStatusCache_();
  }

  return jsonOutput_({
    success: true,
    ok: true,
    type: config.type,
    message: config.title + ' berhasil dihapus online.'
  });
}

function getLocalRecordConfig_(type) {
  var key = normalizeHeaderKey_(type || '');

  if (key == 'employee' || key == 'karyawan' || key == 'datakaryawan' || key == normalizeHeaderKey_(EMPLOYEE_SHEET_NAME)) {
    return {
      type: 'employee',
      title: 'Data karyawan',
      sheetName: EMPLOYEE_SHEET_NAME,
      headers: EMPLOYEE_DEFAULT_HEADERS.slice(),
      fields: EMPLOYEE_DEFAULT_HEADERS.slice(),
      aliases: {
        name: ['name', 'nama', 'namalengkap', 'namakaryawan', 'karyawan'],
        phone: ['phone', 'nohp', 'no_hp', 'telepon', 'hp'],
        address: ['address', 'alamat'],
        job: ['job', 'jabatan', 'role', 'posisi'],
        email: ['email', 'gmail', 'alamatemail'],
        status: ['status', 'aktif', 'keterangan'],
        updated_at: ['updated_at', 'updatedat', 'updated']
      }
    };
  }

  if (key == 'supplier' || key == 'suplier' || key == 'datasupplier' || key == normalizeHeaderKey_(SUPPLIER_SHEET_NAME)) {
    return {
      type: 'supplier',
      title: 'Data supplier',
      sheetName: SUPPLIER_SHEET_NAME,
      headers: SUPPLIER_DEFAULT_HEADERS.slice(),
      fields: SUPPLIER_DEFAULT_HEADERS.slice(),
      aliases: {
        name: ['name', 'supplier', 'suplier', 'nama', 'namasupplier', 'namasuplier'],
        address: ['address', 'alamat'],
        phone: ['phone', 'nohp', 'no_hp', 'telepon', 'hp'],
        pic: ['pic', 'sales', 'cp', 'kontak', 'contact', 'narahubung'],
        updated_at: ['updated_at', 'updatedat', 'updated']
      }
    };
  }

  throw new Error('Tipe data lokal tidak dikenal: ' + type);
}

function getLocalRecordSheet_(config) {
  var ss = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID);
  return ss.getSheetByName(config.sheetName) || ss.insertSheet(config.sheetName);
}

function ensureLocalRecordHeaders_(sheet, config) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    return config.headers.slice();
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function(header) {
    return String(header || '').trim();
  });

  if (!headers.filter(Boolean).length) {
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    return config.headers.slice();
  }

  var normalizedHeaders = headers.map(normalizeHeaderKey_);

  config.fields.forEach(function(field) {
    if (findHeaderColumn_(normalizedHeaders, config.aliases[field] || [field]) >= 0) return;
    sheet.getRange(1, headers.length + 1).setValue(field);
    headers.push(field);
    normalizedHeaders.push(normalizeHeaderKey_(field));
  });

  return headers;
}

function readLocalRecordsByConfig_(config) {
  var sheet = getLocalRecordSheet_(config);
  var headers = ensureLocalRecordHeaders_(sheet, config);
  var values = sheet.getDataRange().getDisplayValues();

  if (values.length < 2) return [];

  return values.slice(1).map(function(row) {
    return readLocalRecordFromRow_(headers, row, config);
  }).filter(function(record) {
    return record.name || record.email || record.phone || record.pic;
  });
}

function readLocalRecordFromRow_(headers, row, config) {
  var raw = {};

  headers.map(normalizeHeaderKey_).forEach(function(header, index) {
    raw[header || ('kolom' + (index + 1))] = row[index];
  });

  if (config.type == 'employee') {
    return {
      name: pickDataValue_(raw, config.aliases.name),
      phone: normalizePhoneValue_(pickDataValue_(raw, config.aliases.phone)),
      address: pickDataValue_(raw, config.aliases.address),
      job: pickDataValue_(raw, config.aliases.job),
      email: pickDataValue_(raw, config.aliases.email),
      status: pickDataValue_(raw, config.aliases.status) || 'Aktif',
      updatedAt: pickDataValue_(raw, config.aliases.updated_at)
    };
  }

  return {
    name: pickDataValue_(raw, config.aliases.name),
    address: pickDataValue_(raw, config.aliases.address),
    phone: normalizePhoneValue_(pickDataValue_(raw, config.aliases.phone)),
    pic: pickDataValue_(raw, config.aliases.pic),
    updatedAt: pickDataValue_(raw, config.aliases.updated_at)
  };
}

function findLocalRecordRowIndex_(values, headers, config, criteria) {
  criteria = criteria || {};
  if (values.length < 2) return -1;

  var normalizedHeaders = headers.map(normalizeHeaderKey_);
  var columns = {
    name: findHeaderColumn_(normalizedHeaders, config.aliases.name || ['name']),
    email: findHeaderColumn_(normalizedHeaders, config.aliases.email || ['email']),
    phone: findHeaderColumn_(normalizedHeaders, config.aliases.phone || ['phone']),
    pic: findHeaderColumn_(normalizedHeaders, config.aliases.pic || ['pic'])
  };
  var wanted = [
    criteria.originalName,
    criteria.originalEmail,
    criteria.originalPhone,
    criteria.name,
    criteria.email,
    criteria.phone,
    criteria.pic
  ].map(normalizeLoginKey_).filter(Boolean);

  if (!wanted.length) return -1;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var rowKeys = [];

    Object.keys(columns).forEach(function(key) {
      var column = columns[key];
      if (column >= 0) rowKeys.push(values[rowIndex][column]);
    });

    rowKeys = rowKeys.map(normalizeLoginKey_).filter(Boolean);

    for (var keyIndex = 0; keyIndex < rowKeys.length; keyIndex += 1) {
      if (wanted.indexOf(rowKeys[keyIndex]) >= 0) {
        return rowIndex;
      }
    }
  }

  return -1;
}

function handleImportDataObat_(payload) {
  var sheetName = String(payload.sheet || DATA_OBAT_SHEET_NAME).trim();
  var mode = String(payload.mode || 'replace').trim();
  var headers = (payload.headers || []).map(function(header) {
    return String(header || '').trim();
  }).filter(Boolean);
  var rows = payload.rows || [];

  if (sheetName !== DATA_OBAT_SHEET_NAME) {
    throw new Error('Import hanya diizinkan untuk sheet data_obat.');
  }

  if (!rows.length) {
    throw new Error('Data import kosong.');
  }

  var ss = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  if (!headers.length) {
    headers = Object.keys(rows[0]);
  }

  if (!headers.length) {
    throw new Error('Header kolom tidak ditemukan.');
  }

  var normalizedHeaders = headers.map(normalizeHeaderKey_);
  var values = rows.map(function(row) {
    return normalizedHeaders.map(function(key) {
      return normalizeDataObatImportValue_(key, row[key] == null ? '' : row[key]);
    });
  });

  if (mode == 'append' && sheet.getLastRow() > 0) {
    var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var existingKeys = existingHeaders.map(normalizeHeaderKey_);
    var appendValues = rows.map(function(row) {
      return existingKeys.map(function(key) {
        return normalizeDataObatImportValue_(key, row[key] == null ? '' : row[key]);
      });
    });

    sheet.getRange(sheet.getLastRow() + 1, 1, appendValues.length, existingHeaders.length).setValues(appendValues);
    formatDataObatPriceColumns_(sheet, existingKeys, sheet.getLastRow() - appendValues.length + 1, appendValues.length);
  } else {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
    formatDataObatPriceColumns_(sheet, normalizedHeaders, 2, values.length);
  }

  SpreadsheetApp.flush();

  var updatedAt = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperty(DATA_OBAT_LAST_UPLOAD_PROPERTY, updatedAt);

  return jsonOutput_({
    success: true,
    ok: true,
    spreadsheetId: ss.getId(),
    sheet: sheetName,
    mode: mode,
    total: rows.length,
    lastRow: sheet.getLastRow(),
    updatedAt: updatedAt,
    uploadedAt: updatedAt
  });
}

function normalizeDataObatImportValue_(key, value) {
  var normalizedKey = normalizeHeaderKey_(key);

  if (DATA_OBAT_PRICE_HEADERS.indexOf(normalizedKey) >= 0) {
    return normalizeDataObatPriceNumber_(value, normalizedKey);
  }

  if (DATA_OBAT_QUANTITY_HEADERS.indexOf(normalizedKey) >= 0) {
    return normalizeDataObatQuantityNumber_(value);
  }

  return value;
}

function normalizeDataObatPriceNumber_(value, key) {
  var text = String(value == null ? '' : value).trim();
  if (!text) return '';

  text = text.replace(/[^\d.,-]/g, '');

  if (!text || text == '-' || text == ',' || text == '.') return '';

  var negative = text.charAt(0) == '-';
  text = text.replace(/-/g, '');

  if (key == 'hargabeli' && /^\d{7,}$/.test(text) && !/000$/.test(text)) {
    text = text.slice(0, -3);
  }

  if (key == 'hargabeli' && /^\d{1,3}(\.\d{3}){2,}$/.test(text)) {
    var priceDotParts = text.split('.');
    var priceLastPart = priceDotParts[priceDotParts.length - 1] || '';
    if (priceLastPart != '000') {
      text = priceDotParts.slice(0, -1).join('.');
    }
  }

  var hasComma = text.indexOf(',') >= 0;
  var hasDot = text.indexOf('.') >= 0;
  var normalized = text;

  if (/^\d{1,3}(,\d{3})+$/.test(text)) {
    normalized = text.replace(/,/g, '');
  } else if (/^\d{4,},\d{3}$/.test(text)) {
    normalized = text.replace(/,\d{3}$/, '');
  } else if (hasComma && hasDot) {
    var mixedParts = text.split(',');
    var mixedTail = mixedParts[mixedParts.length - 1] || '';
    normalized = mixedTail.length == 3
      ? mixedParts[0].replace(/\./g, '')
      : text.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    var commaParts = text.split(',');
    var commaTail = commaParts[commaParts.length - 1] || '';
    normalized = commaTail.length == 3
      ? commaParts.slice(0, -1).join('')
      : commaTail.length > 0 && commaTail.length < 3
      ? commaParts.join('') + new Array(4 - commaTail.length).join('0')
      : text.replace(/,/g, '');
  } else if (hasDot) {
    var dotParts = text.split('.');
    var dotTail = dotParts[dotParts.length - 1] || '';
    normalized = dotTail.length == 3 && dotParts[0].length >= 4
      ? dotParts[0]
      : dotTail.length > 0 && dotTail.length < 3 && dotParts[0].length >= 4
      ? dotParts[0]
      : dotTail.length > 0 && dotTail.length < 3
      ? dotParts.join('') + new Array(4 - dotTail.length).join('0')
      : text.replace(/\./g, '');
  }

  var number = Number(normalized);
  if (!isFinite(number)) return value;

  if (number > 0 && number < 500 && String(normalized).indexOf('.') < 0) {
    number = number * 1000;
  }

  return negative ? -number : number;
}

function normalizeDataObatQuantityNumber_(value) {
  var text = String(value == null ? '' : value).trim();
  if (!text) return '';

  text = text.replace(/[^\d.,-]/g, '');

  if (!text || text == '-' || text == ',' || text == '.') return '';

  var negative = text.charAt(0) == '-';
  text = text.replace(/-/g, '');

  if (/^\d+,\d{3}$/.test(text)) {
    text = text.replace(/,\d{3}$/, '');
  } else if (/^\d+\.\d{3}$/.test(text)) {
    var dotParts = text.split('.');
    var dotTail = dotParts[dotParts.length - 1] || '';
    if (dotTail != '000') {
      text = dotParts.slice(0, -1).join('.');
    }
  }

  var normalized = text.replace(',', '.');
  var number = Number(normalized);

  if (!isFinite(number)) return value;

  return negative ? -number : number;
}

function formatDataObatPriceColumns_(sheet, normalizedHeaders, startRow, rowCount) {
  if (!sheet || rowCount <= 0 || startRow < 2) return;

  normalizedHeaders.forEach(function(header, index) {
    if (DATA_OBAT_PRICE_HEADERS.indexOf(normalizeHeaderKey_(header)) < 0) return;
    sheet.getRange(startRow, index + 1, rowCount, 1).setNumberFormat('#,##0');
  });
}

function handleAddDataObat_(payload) {
  var sheet = getDataObatSheet_();
  var headers = ensureDataObatHeaders_(sheet);
  var row = getDataObatRequestRow_(payload);
  var values = buildDataObatRowValues_(headers, row);

  if (!pickDataObatRequestValue_(row, ['kode']) || !pickDataObatRequestValue_(row, ['nama'])) {
    throw new Error('Kode dan nama obat wajib diisi.');
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([values]);
  formatDataObatPriceColumns_(sheet, headers.map(normalizeHeaderKey_), sheet.getLastRow(), 1);
  SpreadsheetApp.flush();

  return jsonOutput_({
    success: true,
    ok: true,
    message: 'Data obat berhasil ditambahkan.',
    rowNumber: sheet.getLastRow(),
    updatedAt: new Date().toISOString()
  });
}

function handleUpdateDataObat_(payload) {
  var sheet = getDataObatSheet_();
  var headers = ensureDataObatHeaders_(sheet);
  var row = getDataObatRequestRow_(payload);
  var rowNumber = findDataObatRowNumber_(sheet, headers, payload, row);

  if (rowNumber < 2) {
    throw new Error('Baris data obat tidak ditemukan.');
  }

  if (!pickDataObatRequestValue_(row, ['kode']) || !pickDataObatRequestValue_(row, ['nama'])) {
    throw new Error('Kode dan nama obat wajib diisi.');
  }

  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([buildDataObatRowValues_(headers, row)]);
  formatDataObatPriceColumns_(sheet, headers.map(normalizeHeaderKey_), rowNumber, 1);
  SpreadsheetApp.flush();

  return jsonOutput_({
    success: true,
    ok: true,
    message: 'Data obat berhasil diperbarui.',
    rowNumber: rowNumber,
    updatedAt: new Date().toISOString()
  });
}

function handleDeleteDataObat_(payload) {
  var sheet = getDataObatSheet_();
  var headers = ensureDataObatHeaders_(sheet);
  var row = getDataObatRequestRow_(payload);
  var rowNumber = findDataObatRowNumber_(sheet, headers, payload, row);

  if (rowNumber < 2) {
    throw new Error('Baris data obat tidak ditemukan.');
  }

  sheet.deleteRow(rowNumber);
  SpreadsheetApp.flush();

  return jsonOutput_({
    success: true,
    ok: true,
    message: 'Data obat berhasil dihapus.',
    rowNumber: rowNumber,
    updatedAt: new Date().toISOString()
  });
}

function getDataObatSheet_() {
  var ss = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID);
  return ss.getSheetByName(DATA_OBAT_SHEET_NAME) || ss.insertSheet(DATA_OBAT_SHEET_NAME);
}

function ensureDataObatHeaders_(sheet) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    sheet.getRange(1, 1, 1, DATA_OBAT_DEFAULT_HEADERS.length).setValues([DATA_OBAT_DEFAULT_HEADERS]);
    return DATA_OBAT_DEFAULT_HEADERS.slice();
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function(header) {
    return String(header || '').trim();
  });

  if (!headers.filter(Boolean).length) {
    sheet.getRange(1, 1, 1, DATA_OBAT_DEFAULT_HEADERS.length).setValues([DATA_OBAT_DEFAULT_HEADERS]);
    return DATA_OBAT_DEFAULT_HEADERS.slice();
  }

  var normalizedHeaders = headers.map(normalizeHeaderKey_);

  DATA_OBAT_DEFAULT_HEADERS.forEach(function(header) {
    if (normalizedHeaders.indexOf(normalizeHeaderKey_(header)) >= 0) return;
    sheet.getRange(1, headers.length + 1).setValue(header);
    headers.push(header);
    normalizedHeaders.push(normalizeHeaderKey_(header));
  });

  return headers;
}

function getDataObatRequestRow_(payload) {
  return payload.row || payload.data || payload.record || payload.item || payload || {};
}

function buildDataObatRowValues_(headers, row) {
  return headers.map(function(header) {
    var key = normalizeHeaderKey_(header);
    return normalizeDataObatImportValue_(key, pickDataObatRequestValue_(row, getDataObatHeaderAliases_(key)));
  });
}

function findDataObatRowNumber_(sheet, headers, payload, row) {
  var explicitRow = Number(payload.rowNumber || payload._row || row._row || row.rowNumber || 0);

  if (explicitRow >= 2 && explicitRow <= sheet.getLastRow()) {
    return explicitRow;
  }

  var kode = normalizeLoginKey_(payload.kode || row.kode || row.barcode || '');
  if (!kode) return -1;

  var normalizedHeaders = headers.map(normalizeHeaderKey_);
  var kodeColumn = findHeaderColumn_(normalizedHeaders, ['kode', 'barcode', 'kodebarcode', 'sku', 'idobat', 'id']);
  if (kodeColumn < 0 || sheet.getLastRow() < 2) return -1;

  var values = sheet.getRange(2, kodeColumn + 1, sheet.getLastRow() - 1, 1).getDisplayValues();

  for (var i = 0; i < values.length; i += 1) {
    if (normalizeLoginKey_(values[i][0]) == kode) {
      return i + 2;
    }
  }

  return -1;
}

function getDataObatHeaderAliases_(key) {
  var aliases = {
    kode: ['kode', 'barcode', 'kodebarcode', 'sku', 'idobat', 'id'],
    nama: ['nama', 'namaobat', 'namabarang', 'produk', 'item', 'obat'],
    satuanbeli: ['satuanbeli', 'satuan_beli'],
    hargabeli: ['hargabeli', 'harga_beli'],
    stokmin: ['stokmin', 'stok_min'],
    satuanstokmin: ['satuanstokmin', 'satuan_stok_min', 'satuan_stok_minimum'],
    hargajual1: ['hargajual1', 'harga_jual_1'],
    labajual1: ['labajual1', 'laba_jual_1'],
    hargajual2: ['hargajual2', 'harga_jual_2'],
    labajual2: ['labajual2', 'laba_jual_2'],
    hargajual3: ['hargajual3', 'harga_jual_3'],
    labajual3: ['labajual3', 'laba_jual_3'],
    hargajual4: ['hargajual4', 'harga_jual_4'],
    labajual4: ['labajual4', 'laba_jual_4'],
    isiresep1: ['isiresep1', 'isi_resep_1'],
    satuanresep1: ['satuanresep1', 'satuan_resep_1'],
    hargaresep1: ['hargaresep1', 'harga_resep_1'],
    labaresep1: ['labaresep1', 'laba_resep_1'],
    stokkonversi1: ['stokkonversi1', 'stok_konversi_1'],
    satuankonversi1: ['satuankonversi1', 'satuan_konversi_1'],
    isiresep2: ['isiresep2', 'isi_resep_2'],
    satuanresep2: ['satuanresep2', 'satuan_resep_2'],
    hargaresep2: ['hargaresep2', 'harga_resep_2'],
    labaresep2: ['labaresep2', 'laba_resep_2'],
    stokkonversi2: ['stokkonversi2', 'stok_konversi_2'],
    satuankonversi2: ['satuankonversi2', 'satuan_konversi_2'],
    isiresep3: ['isiresep3', 'isi_resep_3'],
    satuanresep3: ['satuanresep3', 'satuan_resep_3'],
    hargaresep3: ['hargaresep3', 'harga_resep_3'],
    labaresep3: ['labaresep3', 'laba_resep_3'],
    stokkonversi3: ['stokkonversi3', 'stok_konversi_3'],
    satuankonversi3: ['satuankonversi3', 'satuan_konversi_3'],
    isiresep4: ['isiresep4', 'isi_resep_4'],
    satuanresep4: ['satuanresep4', 'satuan_resep_4'],
    hargaresep4: ['hargaresep4', 'harga_resep_4'],
    labaresep4: ['labaresep4', 'laba_resep_4'],
    stokkonversi4: ['stokkonversi4', 'stok_konversi_4'],
    satuankonversi4: ['satuankonversi4', 'satuan_konversi_4'],
    labaotomatis: ['labaotomatis', 'laba_otomatis'],
    suplier: ['suplier', 'supplier'],
    supplier: ['supplier', 'suplier'],
    nobatch: ['nobatch', 'no_batch', 'batch']
  };

  return aliases[key] || [key];
}

function pickDataObatRequestValue_(row, keys) {
  var normalized = {};

  Object.keys(row || {}).forEach(function(key) {
    normalized[normalizeHeaderKey_(key)] = row[key];
  });

  for (var i = 0; i < keys.length; i += 1) {
    var key = normalizeHeaderKey_(keys[i]);

    if (Object.prototype.hasOwnProperty.call(normalized, key)) {
      return normalized[key] == null ? '' : normalized[key];
    }
  }

  return '';
}

function renderResetPasswordPage_(email) {
  return HtmlService
    .createHtmlOutput(buildResetPasswordHtml_(email))
    .setTitle('Reset Password - Indo Apotek')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function buildResetPasswordHtml_(email) {
  var safeEmail = escapeHtml_(email || '');
  var eyeOffIcon = [
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">',
    '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>',
    '<path d="M6.61 6.61C3.98 8.38 2 12 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>',
    '<path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"></path>',
    '<path d="M3 3l18 18"></path>',
    '</svg>'
  ].join('');
  var checkIcon = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">',
    '<path d="M20 6 9 17l-5-5"></path>',
    '</svg>'
  ].join('');
  var xIcon = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">',
    '<path d="M18 6 6 18"></path>',
    '<path d="m6 6 12 12"></path>',
    '</svg>'
  ].join('');

  return [
    '<!doctype html>',
    '<html lang="id">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Reset Password - Indo Apotek</title>',
    '<style>',
    '*{box-sizing:border-box}',
    'body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;color:#fff;font-family:Arial,sans-serif;background:linear-gradient(145deg,#2800f6,#c400e8)}',
    '.card{width:min(100%,390px);padding:34px 30px;border-radius:24px;background:rgba(255,255,255,.08);box-shadow:0 24px 70px rgba(20,0,110,.22);text-align:center}',
    'h1{margin:0 0 22px;font-size:1.45rem;letter-spacing:.04em;text-transform:uppercase}',
    '.field{position:relative;margin-bottom:14px}',
    'input{width:100%;min-height:42px;padding:0 74px 0 14px;border:0;border-radius:12px;outline:0;background:#fff;color:#1b1458;font-size:1rem}',
    '.toggle{position:absolute;top:50%;right:8px;width:30px;height:30px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;color:#514a82;transform:translateY(-50%);cursor:pointer}',
    '.toggle:hover{background:#f0edff}',
    '.toggle svg{display:block;width:18px;height:18px}',
    '.field-status{position:absolute;top:50%;right:42px;width:22px;height:22px;display:grid;place-items:center;border-radius:999px;transform:translateY(-50%);pointer-events:none}',
    '.field-status[hidden]{display:none}',
    '.field-status svg{display:block;width:14px;height:14px}',
    '.field-status.is-valid{background:#e8fff2;color:#12a85e}',
    '.field-status.is-invalid{background:#fff0f2;color:#e52d46}',
    '.rules{margin:0 0 14px;padding:12px 14px 12px 30px;border:1px solid rgba(255,255,255,.24);border-radius:14px;background:rgba(255,255,255,.10);color:rgba(255,255,255,.88);font-size:.8rem;line-height:1.45;text-align:left}',
    '.rules li+li{margin-top:4px}',
    'button[type=submit]{width:100%;min-height:42px;border:0;border-radius:12px;background:#fff;color:#3700dc;font-weight:700;cursor:pointer}',
    'button[type=submit]:disabled{cursor:wait;opacity:.76}',
    '.status{min-height:22px;margin:16px 0 0;color:#fff;font-size:.86rem;font-weight:700;line-height:1.45}',
    '.status[data-type=error]{color:#ffe1ef}',
    '.status[data-type=success]{color:#dbffef}',
    '.success-modal{position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:rgba(18,0,90,.42);backdrop-filter:blur(14px)}',
    '.success-modal[hidden]{display:none}',
    '.success-card{width:min(100%,390px);padding:28px;border:1px solid rgba(255,255,255,.35);border-radius:24px;background:rgba(255,255,255,.96);color:#1b1458;box-shadow:0 30px 80px rgba(20,0,110,.32);text-align:center}',
    '.success-card h2{margin:0 0 10px;color:#3700dc;font-size:1.25rem}',
    '.success-card p{margin:0 0 14px;color:#514a82;font-size:.92rem;line-height:1.55}',
    '.password-preview{display:block;width:100%;margin:12px 0 16px;padding:12px;border:1px solid #d7d0ff;border-radius:14px;background:#f5f2ff;color:#1b1458;font-size:1.08rem;font-weight:700;word-break:break-word}',
    '.modal-button{width:100%;min-height:42px;border:0;border-radius:12px;background:linear-gradient(100deg,#2f49f5,#cc12cb);color:#fff;font-weight:700;cursor:pointer}',
    '</style>',
    '</head>',
    '<body>',
    '<main class="card">',
    '<h1>Reset Password</h1>',
    '<form id="resetForm">',
    '<input id="emailInput" type="hidden" value="' + safeEmail + '">',
    '<div class="field">',
    '<input id="passwordInput" type="password" placeholder="Password Baru" autocomplete="new-password" required>',
    '<button class="toggle" type="button" data-target="passwordInput" aria-label="Tampilkan password">' + eyeOffIcon + '</button>',
    '<span class="field-status" id="passwordStatusIcon" hidden>' + checkIcon + '</span>',
    '</div>',
    '<div class="field">',
    '<input id="confirmPasswordInput" type="password" placeholder="Konfirmasi Password" autocomplete="new-password" required>',
    '<button class="toggle" type="button" data-target="confirmPasswordInput" aria-label="Tampilkan password">' + eyeOffIcon + '</button>',
    '<span class="field-status" id="confirmPasswordStatusIcon" hidden data-check="' + escapeHtml_(checkIcon) + '" data-x="' + escapeHtml_(xIcon) + '"></span>',
    '</div>',
    '<ul class="rules">',
    '<li>Password baru minimal 6 karakter.</li>',
    '<li>Wajib kombinasi huruf &amp; angka.</li>',
    '<li>Password konfirmasi harus sama.</li>',
    '</ul>',
    '<button id="submitButton" type="submit">Simpan Password</button>',
    '<p class="status" id="statusText" role="status" aria-live="polite"></p>',
    '</form>',
    '</main>',
    '<section class="success-modal" id="successModal" hidden>',
    '<div class="success-card" role="dialog" aria-modal="true" aria-labelledby="successTitle">',
    '<h2 id="successTitle">Password berhasil dibuat</h2>',
    '<p>Silakan screenshot password baru Anda agar tidak lupa. Simpan screenshot di tempat yang aman.</p>',
    '<strong class="password-preview" id="passwordPreview"></strong>',
    '<button class="modal-button" id="successButton" type="button">Selesai</button>',
    '</div>',
    '</section>',
    '<script>',
    '(function(){',
    'var form=document.getElementById("resetForm");',
    'var emailInput=document.getElementById("emailInput");',
    'var passwordInput=document.getElementById("passwordInput");',
    'var confirmPasswordInput=document.getElementById("confirmPasswordInput");',
    'var passwordStatusIcon=document.getElementById("passwordStatusIcon");',
    'var confirmPasswordStatusIcon=document.getElementById("confirmPasswordStatusIcon");',
    'var submitButton=document.getElementById("submitButton");',
    'var statusText=document.getElementById("statusText");',
    'var successModal=document.getElementById("successModal");',
    'var passwordPreview=document.getElementById("passwordPreview");',
    'var successButton=document.getElementById("successButton");',
    'Array.prototype.forEach.call(document.querySelectorAll(".toggle"),function(button){button.addEventListener("click",function(){var input=document.getElementById(button.getAttribute("data-target"));input.type=input.type==="password"?"text":"password";input.focus();});});',
    'passwordInput.addEventListener("input",updateFieldIndicators);',
    'confirmPasswordInput.addEventListener("input",updateFieldIndicators);',
    'updateFieldIndicators();',
    'form.addEventListener("submit",function(event){',
    'event.preventDefault();',
    'var email=String(emailInput.value||"").trim();',
    'var password=passwordInput.value;',
    'var confirmPassword=confirmPasswordInput.value;',
    'var validationError=validatePassword(password,confirmPassword);',
    'updateFieldIndicators();',
    'if(!email){setStatus("Email reset tidak ditemukan. Silakan ulangi dari halaman login.","error");return;}',
    'if(validationError){setStatus(validationError,"error");return;}',
    'setLoading(true);setStatus("Menyimpan password...","success");',
    'google.script.run.withSuccessHandler(function(result){',
    'setLoading(false);',
    'if(!result||result.success!==true){setStatus((result&&result.message)||"Password baru gagal disimpan.","error");return;}',
    'setStatus(result.message||"Password baru berhasil disimpan. Silakan login kembali.","success");',
    'showSuccessPopup(password);',
    '}).withFailureHandler(function(error){setLoading(false);setStatus((error&&error.message)||"Password baru gagal disimpan.","error");}).updateResetPassword(email,password,confirmPassword);',
    '});',
    'successButton.addEventListener("click",function(){successModal.hidden=true;passwordInput.value="";confirmPasswordInput.value="";passwordInput.focus();});',
    'function updateFieldIndicators(){var password=passwordInput.value;var confirmPassword=confirmPasswordInput.value;var passwordValid=isPasswordStrong(password);setIndicator(passwordStatusIcon,passwordValid?"valid":"hidden");if(!confirmPassword){setIndicator(confirmPasswordStatusIcon,"hidden");return;}setIndicator(confirmPasswordStatusIcon,password&&confirmPassword===password?"valid":"invalid");}',
    'function setIndicator(element,state){element.className="field-status";if(state==="hidden"){element.hidden=true;return;}element.hidden=false;element.classList.add(state==="valid"?"is-valid":"is-invalid");if(element.id==="confirmPasswordStatusIcon"){element.innerHTML=state==="valid"?element.getAttribute("data-check"):element.getAttribute("data-x");}}',
    'function isPasswordStrong(password){return password.length>=6&&/[A-Za-z]/.test(password)&&/[0-9]/.test(password);}',
    'function validatePassword(password,confirmPassword){if(!password)return"Password baru wajib diisi.";if(password.length<6)return"Password baru minimal 6 karakter.";if(!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return"Password baru wajib kombinasi huruf dan angka.";if(password!==confirmPassword)return"Konfirmasi password tidak sama.";return"";}',
    'function setLoading(isLoading){submitButton.disabled=isLoading;submitButton.textContent=isLoading?"Menyimpan...":"Simpan Password";}',
    'function setStatus(message,type){statusText.textContent=message||"";if(type){statusText.setAttribute("data-type",type);}else{statusText.removeAttribute("data-type");}}',
    'function showSuccessPopup(password){passwordPreview.textContent=password;successModal.hidden=false;}',
    '})();',
    '</script>',
    '</body>',
    '</html>'
  ].join('');
}

function readSheetAsObjects_(sheet, sheetName) {
  var values = sheetName == DATA_OBAT_SHEET_NAME
    ? sheet.getDataRange().getDisplayValues()
    : sheet.getDataRange().getValues();

  if (!values.length) {
    return [];
  }

  var headers = values[0];

  return values.slice(1).map(function(row, index) {
    if (sheetName == DATA_OBAT_SHEET_NAME) {
      return normalizeDataObatRow_(headers, row, index);
    }

    var obj = {};
    headers.forEach(function(header, columnIndex) {
      obj[header] = row[columnIndex];
    });
    return obj;
  }).filter(function(row) {
    return Object.keys(row).some(function(key) {
      return row[key] !== '' && row[key] != null;
    });
  });
}

function normalizeDataObatRow_(headers, row, index) {
  var raw = mapNormalizedHeaders_(headers, row);
  var stock = pickDataValue_(raw, ['stok']);
  var kode = pickDataValue_(raw, ['kode', 'barcode', 'kodebarcode', 'sku', 'idobat', 'id']) || row[0] || '';
  var nama = pickDataValue_(raw, ['nama', 'namaobat', 'namabarang', 'produk', 'item', 'obat']) || row[1] || kode;

  return {
    kode: kode,
    barcode: kode,
    nama: nama,
    nama_obat: nama,
    kategori: pickDataValue_(raw, ['kategori']),
    stok: stock,
    stok_real: stock,
    stok_asli: stock,
    sisa_stok: stock,
    sisa_stok_box: stock,
    satuan_beli: pickDataValue_(raw, ['satuanbeli']),
    harga_beli: pickDataValue_(raw, ['hargabeli']),
    stok_min: pickDataValue_(raw, ['stokmin']),
    satuan_stok_min: pickDataValue_(raw, ['satuanstokmin', 'satuan_stok_min', 'satuan_stok_minimum']),
    satuan_1: pickDataValue_(raw, ['satuan1']),
    satuan_2: pickDataValue_(raw, ['satuan2']),
    satuan_3: pickDataValue_(raw, ['satuan3']),
    satuan_4: pickDataValue_(raw, ['satuan4']),
    isi_1: pickDataValue_(raw, ['isi1']),
    isi_2: pickDataValue_(raw, ['isi2']),
    isi_3: pickDataValue_(raw, ['isi3']),
    isi_4: pickDataValue_(raw, ['isi4']),
    harga_jual_1: pickDataValue_(raw, ['hargajual1']),
    laba_jual_1: pickDataValue_(raw, ['labajual1']),
    harga_jual_2: pickDataValue_(raw, ['hargajual2']),
    laba_jual_2: pickDataValue_(raw, ['labajual2']),
    harga_jual_3: pickDataValue_(raw, ['hargajual3']),
    laba_jual_3: pickDataValue_(raw, ['labajual3']),
    harga_jual_4: pickDataValue_(raw, ['hargajual4']),
    laba_jual_4: pickDataValue_(raw, ['labajual4']),
    isi_resep_1: pickDataValue_(raw, ['isiresep1']),
    satuan_resep_1: pickDataValue_(raw, ['satuanresep1']),
    harga_resep_1: pickDataValue_(raw, ['hargaresep1']),
    laba_resep_1: pickDataValue_(raw, ['labaresep1']),
    stok_konversi_1: pickDataValue_(raw, ['stokkonversi1']),
    satuan_konversi_1: pickDataValue_(raw, ['satuankonversi1']),
    isi_resep_2: pickDataValue_(raw, ['isiresep2']),
    satuan_resep_2: pickDataValue_(raw, ['satuanresep2']),
    harga_resep_2: pickDataValue_(raw, ['hargaresep2']),
    laba_resep_2: pickDataValue_(raw, ['labaresep2']),
    stok_konversi_2: pickDataValue_(raw, ['stokkonversi2']),
    satuan_konversi_2: pickDataValue_(raw, ['satuankonversi2']),
    isi_resep_3: pickDataValue_(raw, ['isiresep3']),
    satuan_resep_3: pickDataValue_(raw, ['satuanresep3']),
    harga_resep_3: pickDataValue_(raw, ['hargaresep3']),
    laba_resep_3: pickDataValue_(raw, ['labaresep3']),
    stok_konversi_3: pickDataValue_(raw, ['stokkonversi3']),
    satuan_konversi_3: pickDataValue_(raw, ['satuankonversi3']),
    isi_resep_4: pickDataValue_(raw, ['isiresep4']),
    satuan_resep_4: pickDataValue_(raw, ['satuanresep4']),
    harga_resep_4: pickDataValue_(raw, ['hargaresep4']),
    laba_resep_4: pickDataValue_(raw, ['labaresep4']),
    stok_konversi_4: pickDataValue_(raw, ['stokkonversi4']),
    satuan_konversi_4: pickDataValue_(raw, ['satuankonversi4']),
    laba_otomatis: pickDataValue_(raw, ['labaotomatis']),
    suplier: pickDataValue_(raw, ['suplier', 'supplier']),
    supplier: pickDataValue_(raw, ['suplier', 'supplier']),
    pabrik: pickDataValue_(raw, ['pabrik']),
    expired: pickDataValue_(raw, ['expired']),
    indikasi: pickDataValue_(raw, ['indikasi']),
    komposisi: pickDataValue_(raw, ['komposisi']),
    lokasi: pickDataValue_(raw, ['lokasi']),
    no_batch: pickDataValue_(raw, ['nobatch']),
    _row: index + 2
  };
}

function mapNormalizedHeaders_(headers, row) {
  var obj = {};

  headers.forEach(function(header, index) {
    var key = normalizeHeaderKey_(header);

    if (!key) {
      key = 'kolom' + (index + 1);
    }

    if (obj[key] === undefined) {
      obj[key] = row[index];
      return;
    }

    obj[key + '_' + (index + 1)] = row[index];
  });

  return obj;
}

function pickDataValue_(obj, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    var key = normalizeHeaderKey_(keys[i]);

    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return obj[key];
    }
  }

  return '';
}

function pickRequestValue_(obj, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    var key = keys[i];

    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return obj[key];
    }
  }

  return '';
}

function pickRequestValueAllowEmpty_(obj, keys) {
  obj = obj || {};

  for (var i = 0; i < keys.length; i += 1) {
    var key = keys[i];

    if (obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }

  return '';
}

function hasRequestKey_(obj, keys) {
  obj = obj || {};

  for (var i = 0; i < keys.length; i += 1) {
    if (obj[keys[i]] !== undefined && obj[keys[i]] !== null) {
      return true;
    }
  }

  return false;
}

function normalizeUserMenuValue_(value) {
  if (Object.prototype.toString.call(value) == '[object Array]') {
    return value.map(function(item) {
      return String(item || '').trim();
    }).filter(Boolean).join(',');
  }

  return String(value || '').trim();
}

function normalizeUserPreferencesValue_(value) {
  if (value == null || value === '') {
    return '';
  }

  if (typeof value == 'object') {
    return JSON.stringify({
      theme: value.theme == 'dark' ? 'dark' : 'light',
      compact: value.compact === true || value.compact == 'true',
      startDashboard: value.startDashboard === false || value.startDashboard == 'false' ? false : true,
      menuIconSize: ['small', 'normal', 'large'].indexOf(value.menuIconSize) >= 0 ? value.menuIconSize : 'normal',
      menuImageSize: ['small', 'normal', 'large'].indexOf(value.menuImageSize) >= 0 ? value.menuImageSize : 'normal',
      menuFontSize: ['small', 'normal', 'large'].indexOf(value.menuFontSize) >= 0 ? value.menuFontSize : 'normal',
      updatedAt: String(value.updatedAt || new Date().toISOString())
    });
  }

  var text = String(value || '').trim();
  if (!text) return '';

  try {
    var parsed = JSON.parse(text);
    return normalizeUserPreferencesValue_(parsed);
  } catch (error) {
    return text;
  }
}

function normalizeSpecialUserRole_(role, username, name, email) {
  var identity = [username, name, email]
    .join(' ')
    .replace(/_/g, ' ')
    .toLowerCase();

  if (identity.indexOf('ayu novalia') >= 0) {
    return 'Asisten Apoteker';
  }

  return String(role || 'Operator').trim() || 'Operator';
}

function findHeaderColumn_(headers, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    var key = normalizeHeaderKey_(keys[i]);
    var index = headers.indexOf(key);

    if (index >= 0) return index;
  }

  return -1;
}

function ensureUserColumn_(sheet, headers, keys, fallbackHeader) {
  var column = findHeaderColumn_(headers, keys);

  if (column >= 0) {
    return column;
  }

  column = headers.length;
  sheet.getRange(1, column + 1).setValue(fallbackHeader);
  headers.push(normalizeHeaderKey_(fallbackHeader));

  return column;
}

function findUserSheetRowIndex_(values, headers, criteria) {
  criteria = criteria || {};

  var usernameColumn = findHeaderColumn_(headers, ['username', 'user', 'namauser', 'nama']);
  var nameColumn = findHeaderColumn_(headers, ['name', 'namalengkap', 'namaoperator', 'fullname']);
  var emailColumn = findHeaderColumn_(headers, ['email', 'alamatemail', 'gmail']);
  var wanted = [
    criteria.originalUsername,
    criteria.originalEmail,
    criteria.username,
    criteria.email,
    criteria.name
  ].map(normalizeLoginKey_).filter(Boolean);

  if (!wanted.length) {
    return -1;
  }

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var rowKeys = [];

    if (usernameColumn >= 0) rowKeys.push(values[rowIndex][usernameColumn]);
    if (nameColumn >= 0) rowKeys.push(values[rowIndex][nameColumn]);
    if (emailColumn >= 0) rowKeys.push(values[rowIndex][emailColumn]);

    rowKeys = rowKeys.map(normalizeLoginKey_).filter(Boolean);

    for (var keyIndex = 0; keyIndex < rowKeys.length; keyIndex += 1) {
      if (wanted.indexOf(rowKeys[keyIndex]) >= 0) {
        return rowIndex;
      }
    }
  }

  return -1;
}

function getDataObatLastUploadAt_() {
  return String(PropertiesService.getScriptProperties().getProperty(DATA_OBAT_LAST_UPLOAD_PROPERTY) || '').trim();
}

function readUserRows_(sheet) {
  var values = sheet.getDataRange().getDisplayValues();

  if (values.length < 2) return [];

  var headers = values[0].map(normalizeHeaderKey_);

  return values.slice(1).map(function(row) {
    var raw = {};

    headers.forEach(function(header, index) {
      raw[header || ('kolom' + (index + 1))] = row[index];
    });

    var username = pickDataValue_(raw, ['username', 'user', 'namauser', 'nama']);
    var name = pickDataValue_(raw, ['name', 'namalengkap', 'namaoperator', 'fullname']) || username;

    return {
      username: username,
      name: name,
      password: pickDataValue_(raw, ['password', 'pass', 'kata_sandi', 'katasandi']),
      role: normalizeSpecialUserRole_(pickDataValue_(raw, ['role', 'akses', 'level']), username, name, pickDataValue_(raw, ['email', 'alamatemail', 'gmail'])),
      email: pickDataValue_(raw, ['email', 'alamatemail', 'gmail']),
      menu: pickDataValue_(raw, ['menu', 'aksesmenu', 'menuakses']),
      status: pickDataValue_(raw, ['status', 'aktif', 'keterangan']),
      phone: normalizePhoneValue_(pickDataValue_(raw, ['phone', 'nohp', 'telepon', 'hp'])),
      address: pickDataValue_(raw, ['address', 'alamat']),
      preferences: pickDataValue_(raw, ['preferences', 'profilepreferences', 'profile_preferences', 'preferensi']),
      profilePhoto: pickDataValue_(raw, ['profilephoto', 'foto', 'photo', 'fotoprofil'])
    };
  }).filter(function(user) {
    return user.username || user.email || user.password;
  });
}

function getSpreadsheetBySheetName_(sheetName) {
  var name = String(sheetName || '').trim();

  if (name == DATA_OBAT_SHEET_NAME || name == USER_SHEET_NAME || name == EMPLOYEE_SHEET_NAME || name == SUPPLIER_SHEET_NAME || name == RESTOCK_REQUESTS_SHEET_NAME) {
    return SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID);
  }

  return SpreadsheetApp.getActiveSpreadsheet();
}

function parsePostData_(e) {
  var content = e.postData && e.postData.contents ? String(e.postData.contents) : '{}';

  try {
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

function normalizeHeaderKey_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeLoginKey_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhoneValue_(value) {
  var text = String(value || '').trim();
  if (!text) return '';

  var cleaned = text.replace(/[^\d+]/g, '');
  if (/^\+/.test(cleaned)) return cleaned;
  if (/^8\d{7,}$/.test(cleaned)) return '0' + cleaned;

  return cleaned;
}

function buildResetPasswordUrl_(email) {
  var serviceUrl = ScriptApp.getService().getUrl();

  if (!serviceUrl) {
    serviceUrl = 'https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec';
  }

  return serviceUrl + '?page=reset&email=' + encodeURIComponent(email);
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonOutput_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function testImportDataObatTarget() {
  var ss = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(DATA_OBAT_SHEET_NAME);

  return {
    ok: true,
    success: true,
    spreadsheetId: ss.getId(),
    sheet: DATA_OBAT_SHEET_NAME,
    lastRow: sheet ? sheet.getLastRow() : 0,
    url: ss.getUrl()
  };
}

function testSave() {
  return jsonOutput_({
    success: true,
    ok: true,
    message: 'Apps Script aktif'
  });
}
