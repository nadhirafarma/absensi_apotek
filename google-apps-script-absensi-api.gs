/*
  Google Apps Script - API Absensi Apotek Nadhira Farma

  Pasang kode ini di project Apps Script yang dipakai oleh ABSENSI_API_URL.
  Deploy sebagai Web App:
  - Execute as: Me
  - Who has access: Anyone

  Fitur penting:
  - GET ?nama=Yolan_Alfarel mengecek status absen datang/pulang hari ini.
  - POST menyimpan absensi datang dan pulang sebagai status terpisah.
  - Jika baris absensi pada tanggal itu dihapus dari Google Sheet, karyawan bisa absen lagi.
  - Foto base64 disimpan ke folder Drive "Foto_Absensi" jika dikirim.
*/

var ABSENSI_SPREADSHEET_ID = '1L_MfAj7UOa9Ngb6VEY6G4PiMBbwOIAu3De_puVYvNw4';
var ABSENSI_SHEET_NAME = 'Form_Responses';
var ABSENSI_PHOTO_FOLDER_NAME = 'Foto_Absensi';
var ABSENSI_TIMEZONE = 'Asia/Jakarta';
var PAYROLL_SHEET_NAME = 'data_karyawan';
var AUTH_SPREADSHEET_ID = '1jdtxpAZ-G545QfvbktjAihy2xXJeD8GbUFUx7W1TPdk';
var AUTH_SESSION_SHEET_NAME = 'auth_sessions';
var PHARMACY_PROFILE_SHEET_NAME = 'pharmacy_profile';
var ABSENSI_MAX_PHOTO_BYTES = 3 * 1024 * 1024;
var ABSENSI_MAX_TIMESTAMP_DRIFT_MS = 10 * 60 * 1000;
var ABSENSI_MAX_GPS_ACCURACY_METER = 200;
var ABSENSI_GPS_TOLERANCE_METER = 160;
var PAYROLL_TEMPLATE_SHEET_NAME = 'Slip_Gaji';
var PAYROLL_LOG_SHEET_NAME = 'log_slip_gaji';
var PAYROLL_PDF_FOLDER_NAME = 'slip_gaji_pdf';
var PAYROLL_NIP_CELL = 'E7';
var PAYROLL_NAME_CELL = 'E8';
var PAYROLL_PERIOD_CELL = 'K6';
var PAYROLL_SHIFT_PAGI_CELL = 'K8';
var PAYROLL_SHIFT_SORE_CELL = 'K9';
var PAYROLL_EXPORT_RANGE = 'C1:K32';
var PAYROLL_EXPORT_SETTLE_MS = 250;
var PAYROLL_TEMPLATE_CELLS = {
  job: 'E9',
  baseAmount: 'E13',
  mealAmount: 'E14',
  overtimeAmount: 'E15',
  allowanceAmount: 'E16',
  bonusAmount: 'E17',
  loanAmount: 'I13',
  debtAmount: 'I14',
  otherAmount: 'I15',
  gross: 'E19',
  deductions: 'I19',
  netSalary: 'E21'
};
var PAYROLL_TEMPLATE_CLEAR_CELLS = ['F20'];
var PAYROLL_DEFAULT_HEADERS = [
  'No',
  'NIP',
  'Nama Karyawan',
  'Jabatan',
  'Gaji Pokok',
  'Mode Gaji Pokok',
  'Uang Makan',
  'Mode Uang Makan',
  'Lembur',
  'Mode Lembur',
  'Tunjangan',
  'Mode Tunjangan',
  'Bonus',
  'Pinjaman',
  'Hutang',
  'Lain-Lain',
  'Status'
];
var PAYROLL_MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = String(params.action || '').trim();
    var session = validateAbsensiSession_(params);
    if (!session.ok) return jsonAbsensi_({ ok: false, success: false, message: session.message });
    applyAbsensiSession_(params, session);
    var spreadsheet = SpreadsheetApp.openById(ABSENSI_SPREADSHEET_ID);
    var sheet = getAbsensiSheet_(spreadsheet);

    if (action == 'listAttendanceRecords') {
      return handleListAttendanceRecords_(params, sheet);
    }

    if (action == 'listPayrollEmployees') {
      return handleListPayrollEmployees_(params, spreadsheet);
    }

    if (action == 'generateSalarySlip') {
      return handleGenerateSalarySlip_(params, spreadsheet);
    }

    if (action == 'listSalarySlipHistory') {
      return handleListSalarySlipHistory_(params, spreadsheet);
    }

    var nama = session.name;
    var check = checkAbsensiHariIni_(sheet, nama);

    return jsonAbsensi_({
      ok: true,
      sudahAbsen: check.sudahAbsen,
      datang: check.datang,
      pulang: check.pulang,
      lembur: check.lembur,
      datangShift: check.datangShift || '',
      pulangShift: check.pulangShift || '',
      lemburShift: check.lemburShift || '',
      nama: normalizeDisplayName_(nama),
      tanggal: getJakartaDateKey_(new Date()),
      row: check.row || null,
      datangRow: check.datangRow || null,
      pulangRow: check.pulangRow || null,
      lemburRow: check.lemburRow || null
    });
  } catch (error) {
    return jsonAbsensi_({
      ok: false,
      error: error.message
    });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var payload = parseAbsensiPayload_(e);
    var action = String(payload.action || '').trim();
    var session = validateAbsensiSession_(payload);
    if (!session.ok) return jsonAbsensi_({ ok: false, success: false, message: session.message });
    applyAbsensiSession_(payload, session);
    var nama = session.name;
    var spreadsheet = SpreadsheetApp.openById(ABSENSI_SPREADSHEET_ID);
    var sheet = getAbsensiSheet_(spreadsheet);

    if (action == 'listAttendanceRecords') {
      return handleListAttendanceRecords_(payload, sheet);
    }

    if (action == 'updateAttendanceRecord') {
      return handleUpdateAttendanceRecord_(payload, sheet);
    }

    if (action == 'listPayrollEmployees') {
      return handleListPayrollEmployees_(payload, spreadsheet);
    }

    if (action == 'savePayrollEmployee') {
      return handleSavePayrollEmployee_(payload, spreadsheet);
    }

    if (action == 'deletePayrollEmployee') {
      return handleDeletePayrollEmployee_(payload, spreadsheet);
    }

    if (action == 'generateSalarySlip') {
      return handleGenerateSalarySlip_(payload, spreadsheet);
    }

    if (action == 'listSalarySlipHistory') {
      return handleListSalarySlipHistory_(payload, spreadsheet);
    }

    if (action == 'deleteSalarySlipHistory') {
      return handleDeleteSalarySlipHistory_(payload, spreadsheet);
    }

    if (action == 'deleteAllSalarySlipHistory') {
      return handleDeleteAllSalarySlipHistory_(payload, spreadsheet);
    }

    if (action) {
      return jsonAbsensi_({
        ok: false,
        success: false,
        message: 'Action absensi tidak dikenal: ' + action
      });
    }

    var check = checkAbsensiHariIni_(sheet, nama);
    var timestamp = new Date();
    var displayName = normalizeDisplayName_(nama);
    var status = normalizeAbsensiStatus_(payload.jenis_absen || payload.jenisAbsen || payload.status_kehadiran || payload.statusKehadiran || payload.status || 'DATANG');
    var validation = validateAbsensiSubmission_(payload, timestamp);
    if (!validation.ok) return jsonAbsensi_({ ok: false, success: false, message: validation.message });
    payload.latitude = validation.latitude;
    payload.longitude = validation.longitude;
    payload.gps_accuracy = validation.accuracy;
    payload.gps_distance = validation.distance;

    if (!isAttendanceEmployeeActive_(spreadsheet, session.name) || isInactiveEmployeeStatus_(session.status)) {
      return jsonAbsensi_({
        ok: false,
        success: false,
        message: 'Akun/karyawan sedang nonaktif. Absensi tidak dapat dilakukan.'
      });
    }

    if ((status == 'DATANG' && check.datang) || (status == 'PULANG' && check.pulang) || (status == 'LEMBUR' && check.lembur)) {
      return jsonAbsensi_({
        ok: true,
        sudahAbsen: true,
        datang: check.datang,
        pulang: check.pulang,
        lembur: check.lembur,
        message: status == 'PULANG' ? 'Anda sudah absen pulang hari ini.' : status == 'LEMBUR' ? 'Anda sudah absen lembur hari ini.' : 'Anda sudah absen datang hari ini.',
        row: status == 'PULANG' ? check.pulangRow : status == 'LEMBUR' ? check.lemburRow : check.datangRow
      });
    }

    var shift = normalizeAbsensiShift_(payload.shift || payload.SHIFT || getShiftLabel_(timestamp));
    var sheetShift = status == 'PULANG' ? '' : shift;
    var photo = saveAbsensiPhoto_(payload, displayName, timestamp);
    var attendanceDate = getPayloadAttendanceDate_(payload, timestamp);
    var attendanceTime = getPayloadAttendanceTime_(payload, status, timestamp);

    ensureAbsensiHeaders_(sheet);
    sheet.appendRow([
      timestamp,
      displayName,
      status,
      sheetShift,
      photo.url,
      photo.id,
      payload.latitude || '',
      payload.longitude || '',
      payload.gps_accuracy || payload.gpsAccuracy || '',
      payload.gps_distance || payload.gpsDistance || '',
      payload.attendance_warning || payload.attendanceWarning || '',
      payload.attendance_flag || payload.attendanceFlag || ''
    ]);
    writeAttendanceDateTime_(sheet, getAbsensiColumns_(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(normalizeAbsensiHeader_)), sheet.getLastRow(), attendanceDate, attendanceTime);

    return jsonAbsensi_({
      ok: true,
      sudahAbsen: false,
      datang: status == 'DATANG' ? true : check.datang,
      pulang: status == 'PULANG' ? true : check.pulang,
      lembur: status == 'LEMBUR' ? true : check.lembur,
      status: status,
      shift: shift,
      warningMessage: payload.attendance_warning || payload.attendanceWarning || '',
      warningFlag: payload.attendance_flag || payload.attendanceFlag || '',
      date: attendanceDate,
      time: attendanceTime,
      message: 'Absensi tersimpan.',
      nama: displayName,
      fotoUrl: photo.url || ''
    });
  } catch (error) {
    return jsonAbsensi_({
      ok: false,
      error: error.message
    });
  } finally {
    lock.releaseLock();
  }
}

function validateAbsensiSession_(payload) {
  var token = String(payload.sessionToken || payload.token || '').trim();
  if (!token) return { ok: false, message: 'Sesi login tidak tersedia. Silakan masuk ulang.' };

  var sheet = SpreadsheetApp.openById(AUTH_SPREADSHEET_ID).getSheetByName(AUTH_SESSION_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { ok: false, message: 'Sesi login tidak valid. Silakan masuk ulang.' };

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getDisplayValues();
  for (var i = values.length - 1; i >= 0; i -= 1) {
    if (String(values[i][0] || '').trim() != token) continue;
    if (Number(values[i][6] || 0) <= Date.now()) return { ok: false, message: 'Sesi login sudah berakhir. Silakan masuk ulang.' };

    var session = {
      ok: true,
      username: values[i][1],
      email: values[i][2],
      name: values[i][3] || values[i][1],
      role: values[i][4],
      status: values[i][5] || 'Aktif'
    };
    var submitted = [payload.username, payload.email]
      .map(normalizeAbsensiKey_).filter(Boolean);
    var allowed = [session.username, session.email, session.name].map(normalizeAbsensiKey_).filter(Boolean);

    if (submitted.some(function(key) { return allowed.indexOf(key) < 0; })) {
      return { ok: false, message: 'Identitas absensi tidak sesuai dengan sesi login.' };
    }
    return session;
  }

  return { ok: false, message: 'Sesi login tidak valid. Silakan masuk ulang.' };
}

function applyAbsensiSession_(payload, session) {
  payload.username = session.username || '';
  payload.email = session.email || '';
  payload.role = session.role || '';
  payload.actor = session.username || session.email || session.name || '';
}

function validateAbsensiSubmission_(payload, now) {
  var photo = String(payload.foto_absensi || payload.fotoAbsensi || payload.foto || payload.photo || payload.image || payload.imageBase64 || '').trim();
  var mimeType = String(payload.mimeType || 'image/jpeg').toLowerCase();

  if (!photo) return { ok: false, message: 'Foto absensi wajib dikirim.' };
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].indexOf(mimeType) < 0) {
    return { ok: false, message: 'Format foto absensi tidak didukung.' };
  }

  photo = photo.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(photo)) return { ok: false, message: 'Data foto absensi tidak valid.' };
  var estimatedBytes = Math.floor(photo.length * 3 / 4) - (photo.slice(-2) == '==' ? 2 : photo.slice(-1) == '=' ? 1 : 0);
  if (estimatedBytes < 1024 || estimatedBytes > ABSENSI_MAX_PHOTO_BYTES) {
    return { ok: false, message: 'Ukuran foto absensi tidak valid atau melebihi 3 MB.' };
  }

  var clientTime = new Date(String(payload.timestamp || ''));
  if (isNaN(clientTime.getTime()) || Math.abs(now.getTime() - clientTime.getTime()) > ABSENSI_MAX_TIMESTAMP_DRIFT_MS) {
    return { ok: false, message: 'Waktu perangkat tidak wajar. Sinkronkan waktu lalu coba lagi.' };
  }

  var profile = getAbsensiPharmacyProfile_();
  var enabled = profile.attendanceGpsEnabled !== false && String(profile.attendanceGpsEnabled).toLowerCase() != 'false';
  if (!enabled) return { ok: true, latitude: '', longitude: '', accuracy: '', distance: 0 };

  var latitude = Number(payload.latitude);
  var longitude = Number(payload.longitude);
  var accuracy = Number(payload.gps_accuracy || payload.gpsAccuracy);
  var pharmacyLat = Number(profile.latitude);
  var pharmacyLon = Number(profile.longitude);
  var radius = Number(profile.attendanceGpsRadius || 45);

  if (!isFinite(pharmacyLat) || !isFinite(pharmacyLon) || !isFinite(radius) || radius < 1) {
    return { ok: false, message: 'Konfigurasi GPS apotek belum valid.' };
  }
  if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(accuracy) || accuracy < 0 || accuracy > ABSENSI_MAX_GPS_ACCURACY_METER) {
    return { ok: false, message: 'Koordinat atau akurasi GPS tidak valid.' };
  }

  var distance = calculateAbsensiDistance_(latitude, longitude, pharmacyLat, pharmacyLon);
  if (distance > radius + Math.min(accuracy, ABSENSI_GPS_TOLERANCE_METER)) {
    return { ok: false, message: 'Lokasi berada di luar radius absensi apotek.' };
  }

  return {
    ok: true,
    latitude: latitude,
    longitude: longitude,
    accuracy: Math.round(accuracy),
    distance: Math.round(distance)
  };
}

function getAbsensiPharmacyProfile_() {
  var sheet = SpreadsheetApp.openById(AUTH_SPREADSHEET_ID).getSheetByName(PHARMACY_PROFILE_SHEET_NAME);
  if (!sheet) return {};
  try {
    return JSON.parse(String(sheet.getRange('A2').getDisplayValue() || '{}')) || {};
  } catch (error) {
    return {};
  }
}

function calculateAbsensiDistance_(lat1, lon1, lat2, lon2) {
  var toRad = function(value) { return value * Math.PI / 180; };
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseAbsensiPayload_(e) {
  var params = (e && e.parameter) || {};
  var content = e && e.postData && e.postData.contents ? String(e.postData.contents) : '';
  var payload = {};

  if (content) {
    try {
      payload = JSON.parse(content);
    } catch (error) {
      payload = {};
    }
  }

  Object.keys(params).forEach(function(key) {
    if (payload[key] == null || payload[key] === '') {
      payload[key] = params[key];
    }
  });

  return payload;
}

function getAbsensiSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(ABSENSI_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(ABSENSI_SHEET_NAME);
  }

  ensureAbsensiHeaders_(sheet);
  return sheet;
}

function ensureAbsensiHeaders_(sheet) {
  var headers = [
    'Timestamp',
    'NAMA KARYAWAN',
    'STATUS KEHADIRAN',
    'SHIFT',
    'FOTO ABSENSI',
    'FILE ID',
    'LATITUDE',
    'LONGITUDE',
    'GPS ACCURACY',
    'GPS DISTANCE',
    'ATTENDANCE WARNING',
    'ATTENDANCE FLAG',
    'UPDATED AT',
    'UPDATED BY',
    'TANGGAL ABSEN',
    'JAM ABSEN'
  ];
  var current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  var needsUpdate = false;

  headers.forEach(function(header, index) {
    if (!current[index]) {
      current[index] = header;
      needsUpdate = true;
    }
  });

  if (needsUpdate || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([current]);
  }
}

function checkAbsensiHariIni_(sheet, nama) {
  var targetName = normalizeAbsensiKey_(nama);

  if (!targetName) {
    return {
      sudahAbsen: false,
      datang: false,
      pulang: false,
      lembur: false
    };
  }

  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      sudahAbsen: false,
      datang: false,
      pulang: false,
      lembur: false
    };
  }

  var todayKey = getJakartaDateKey_(new Date());
  var values = sheet.getRange(1, 1, lastRow, Math.max(sheet.getLastColumn(), 4)).getValues();
  var headers = values[0].map(normalizeAbsensiHeader_);
  var timestampIndex = findHeaderIndex_(headers, ['timestamp', 'tanggal', 'waktu']);
  var nameIndex = findHeaderIndex_(headers, ['namakaryawan', 'nama', 'karyawan', 'pegawai']);
  var statusIndex = findHeaderIndex_(headers, ['statuskehadiran', 'status', 'jenisabsen', 'absen']);
  var shiftIndex = findHeaderIndex_(headers, ['shift']);
  var result = {
    sudahAbsen: false,
    datang: false,
    pulang: false,
    lembur: false,
    row: null,
    datangRow: null,
    pulangRow: null,
    lemburRow: null,
    datangShift: '',
    pulangShift: '',
    lemburShift: ''
  };

  if (timestampIndex < 0) timestampIndex = 0;
  if (nameIndex < 0) nameIndex = 1;
  if (statusIndex < 0) statusIndex = 2;
  if (shiftIndex < 0) shiftIndex = 3;

  for (var index = values.length - 1; index >= 1; index -= 1) {
    var row = values[index];
    var rowDateKey = getJakartaDateKey_(row[timestampIndex]);
    var rowName = normalizeAbsensiKey_(row[nameIndex]);

    if (rowDateKey === todayKey && rowName === targetName) {
      var status = normalizeAbsensiStatus_(row[statusIndex] || 'DATANG');

      if (status == 'PULANG' && !result.pulang) {
        result.pulang = true;
        result.pulangRow = index + 1;
        result.pulangShift = row[shiftIndex] || '';
      }

      if (status == 'LEMBUR' && !result.lembur) {
        result.lembur = true;
        result.lemburRow = index + 1;
        result.lemburShift = row[shiftIndex] || '';
      }

      if (status == 'DATANG' && !result.datang) {
        result.datang = true;
        result.datangRow = index + 1;
        result.datangShift = row[shiftIndex] || '';
      }

      if (!result.row) result.row = index + 1;
    }
  }

  result.sudahAbsen = result.datang && result.pulang;
  return result;
}

function saveAbsensiPhoto_(payload, displayName, timestamp) {
  var base64 = payload.foto_absensi || payload.fotoAbsensi || payload.foto || payload.photo || payload.image || payload.imageBase64 || '';

  if (!base64) {
    return {
      id: '',
      url: ''
    };
  }

  base64 = String(base64).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

  var folder = getOrCreateAbsensiFolder_();
  var fileName = payload.fileName || ('absensi_' + sanitizeAbsensiFileName_(displayName) + '_' + Utilities.formatDate(timestamp, ABSENSI_TIMEZONE, 'yyyyMMdd_HHmmss') + '.jpg');
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, payload.mimeType || 'image/jpeg', fileName);
  var file = folder.createFile(blob);

  return {
    id: file.getId(),
    url: file.getUrl()
  };
}

function getOrCreateAbsensiFolder_() {
  var folders = DriveApp.getFoldersByName(ABSENSI_PHOTO_FOLDER_NAME);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(ABSENSI_PHOTO_FOLDER_NAME);
}

function isAttendanceEmployeeActive_(spreadsheet, name) {
  var target = normalizeAbsensiKey_(name || '');
  if (!target) return false;

  try {
    var sheet = spreadsheet.getSheetByName(PAYROLL_SHEET_NAME);
    if (!sheet) return true;

    var employees = readPayrollEmployees_(sheet);
    for (var i = 0; i < employees.length; i += 1) {
      var employee = employees[i];
      var keys = [
        employee.name,
        employee.nip,
        employee.email,
        employee.phone
      ].map(normalizeAbsensiKey_).filter(Boolean);

      if (keys.indexOf(target) >= 0) {
        return !isInactiveEmployeeStatus_(employee.status);
      }
    }
  } catch (error) {
    return true;
  }

  return true;
}

function isInactiveEmployeeStatus_(value) {
  var key = normalizeAbsensiKey_(value || 'Aktif').replace(/\s+/g, '');
  return key == 'nonaktif' || key == 'inactive' || key == 'nonactive' || key == 'tidakaktif' || key == 'keluar' || key == 'resign' || key == 'cuti';
}

function handleListAttendanceRecords_(params, sheet) {
  ensureAbsensiHeaders_(sheet);

  var lastRow = sheet.getLastRow();
  var lastColumn = Math.max(sheet.getLastColumn(), 16);
  var role = normalizeAbsensiKey_(params.role || '');
  var isAdmin = isAbsensiAdmin_(params);
  var identityKeys = [
    params.nama,
    params.nama_karyawan,
    params.namaKaryawan,
    params.username,
    params.name,
    params.email
  ].map(normalizeAbsensiKey_).filter(Boolean);
  var dateFrom = String(params.dateFrom || params.from || '').trim();
  var dateTo = String(params.dateTo || params.to || '').trim();
  var limit = Number(params.limit || 300);
  var hasRange = Boolean(dateFrom || dateTo);
  var records = [];

  if (!limit || limit < 1) limit = hasRange ? 5000 : 300;
  if (limit > 5000) limit = 5000;

  if (lastRow < 2) {
    return jsonAbsensi_({
      ok: true,
      success: true,
      records: [],
      total: 0
    });
  }

  var values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  var headers = values[0].map(normalizeAbsensiHeader_);
  var columns = getAbsensiColumns_(headers);

  for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    var row = values[rowIndex];
    var timestamp = row[columns.timestamp];
    var dateKey = sanitizeAbsensiDateKey_(row[columns.dateKey]) || getJakartaDateKey_(timestamp);
    var timestampTime = timestamp instanceof Date && !isNaN(timestamp.getTime())
      ? Utilities.formatDate(timestamp, ABSENSI_TIMEZONE, 'HH:mm')
      : '';
    var timeText = timestampTime || sanitizeAbsensiTime_(row[columns.timeText]);
    var displayName = normalizeDisplayName_(row[columns.name]);
    var nameKey = normalizeAbsensiKey_(displayName);

    if (!isAdmin && identityKeys.length && identityKeys.indexOf(nameKey) < 0) {
      continue;
    }

    if (!isAdmin && !identityKeys.length) {
      continue;
    }

    if (dateFrom && dateKey < dateFrom) continue;
    if (dateTo && dateKey > dateTo) continue;

    records.push({
      rowNumber: rowIndex + 1,
      timestamp: timestamp instanceof Date && !isNaN(timestamp.getTime()) ? timestamp.toISOString() : String(timestamp || ''),
      date: dateKey,
      tanggal_absen: dateKey,
      tanggalAbsen: dateKey,
      time: timeText,
      jam_absen: timeText,
      jamAbsen: timeText,
      nama: displayName,
      nama_karyawan: displayName,
      status: normalizeAbsensiStatus_(row[columns.status]),
      shift: String(row[columns.shift] || ''),
      fotoUrl: String(row[columns.photo] || ''),
      fileId: String(row[columns.fileId] || ''),
      latitude: String(row[columns.latitude] || ''),
      longitude: String(row[columns.longitude] || ''),
      gpsAccuracy: String(row[columns.gpsAccuracy] || ''),
      gpsDistance: String(row[columns.gpsDistance] || ''),
      warningMessage: String(row[columns.warning] || ''),
      warningFlag: String(row[columns.warningFlag] || '')
    });

    if (!hasRange && records.length >= limit) break;
  }

  if (records.length > limit) {
    records = records.slice(0, limit);
  }

  return jsonAbsensi_({
    ok: true,
    success: true,
    records: records,
    total: records.length,
    isAdmin: isAdmin,
    role: role
  });
}

function handleUpdateAttendanceRecord_(payload, sheet) {
  if (!isAbsensiAdmin_(payload)) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Hanya owner/admin yang dapat mengedit catatan kehadiran.'
    });
  }

  ensureAbsensiHeaders_(sheet);

  var values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), Math.max(sheet.getLastColumn(), 16)).getValues();
  var headers = values[0].map(normalizeAbsensiHeader_);
  var columns = getAbsensiColumns_(headers);
  var dateKey = sanitizeAbsensiDateKey_(payload.date || payload.tanggal) || getJakartaDateKey_(new Date());
  var name = normalizeDisplayName_(payload.nama || payload.nama_karyawan || payload.namaKaryawan || payload.name || '');
  var shift = normalizeAbsensiShift_(payload.shift || payload.SHIFT || 'SHIFT PAGI');
  var updatedAt = new Date();
  var updatedBy = String(payload.updatedBy || payload.username || payload.actor || '').trim();

  if (!name) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Nama karyawan wajib diisi.'
    });
  }

  updateAttendanceRowByStatus_(sheet, columns, payload.datangRow || payload.arrivalRow, dateKey, payload.jamDatang || payload.datang || '', name, 'DATANG', shift, payload.warningMessage || '', payload.warningFlag || '', updatedAt, updatedBy);
  updateAttendanceRowByStatus_(sheet, columns, payload.pulangRow || payload.returnRow, dateKey, payload.jamPulang || payload.pulang || '', name, 'PULANG', shift, payload.warningMessage || '', payload.warningFlag || '', updatedAt, updatedBy);
  SpreadsheetApp.flush();

  return jsonAbsensi_({
    ok: true,
    success: true,
    message: 'Catatan kehadiran berhasil diperbarui.',
    updatedAt: updatedAt.toISOString()
  });
}

function updateAttendanceRowByStatus_(sheet, columns, rowNumber, dateKey, timeText, name, status, shift, warningMessage, warningFlag, updatedAt, updatedBy) {
  rowNumber = Number(rowNumber || 0);
  timeText = String(timeText || '').trim();

  if (!timeText) return;

  var timestamp = buildJakartaTimestamp_(dateKey, timeText);
  var targetRow = rowNumber >= 2 && rowNumber <= sheet.getLastRow() ? rowNumber : sheet.getLastRow() + 1;

  sheet.getRange(targetRow, columns.timestamp + 1).setValue(timestamp);
  sheet.getRange(targetRow, columns.name + 1).setValue(name);
  sheet.getRange(targetRow, columns.status + 1).setValue(status);
  sheet.getRange(targetRow, columns.shift + 1).setValue(status == 'PULANG' ? '' : shift);
  sheet.getRange(targetRow, columns.warning + 1).setValue(warningMessage);
  sheet.getRange(targetRow, columns.warningFlag + 1).setValue(warningFlag);
  sheet.getRange(targetRow, columns.updatedAt + 1).setValue(updatedAt);
  sheet.getRange(targetRow, columns.updatedBy + 1).setValue(updatedBy);
  writeAttendanceDateTime_(sheet, columns, targetRow, dateKey, sanitizeAbsensiTime_(timeText));
}

function handleListPayrollEmployees_(params, spreadsheet) {
  if (!isAbsensiAdmin_(params)) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      employees: [],
      message: 'Hanya owner/admin yang dapat mengakses data gaji karyawan.'
    });
  }

  var sheet = getPayrollSheet_(spreadsheet);
  var employees = readPayrollEmployees_(sheet);

  return jsonAbsensi_({
    ok: true,
    success: true,
    employees: employees,
    total: employees.length
  });
}

function handleSavePayrollEmployee_(payload, spreadsheet) {
  if (!isAbsensiAdmin_(payload)) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Hanya owner/admin yang dapat menyimpan data gaji karyawan.'
    });
  }

  var sheet = getPayrollSheet_(spreadsheet);
  var headerInfo = ensurePayrollHeaders_(sheet);
  var values = sheet.getDataRange().getDisplayValues();
  var employee = sanitizePayrollEmployee_(payload.employee || payload.record || payload);
  var rowNumber = findPayrollEmployeeRow_(values, headerInfo, {
    originalNip: payload.originalNip,
    originalName: payload.originalName,
    nip: employee.nip,
    name: employee.name
  });

  if (!employee.nip || !employee.name) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'NIP dan nama karyawan wajib diisi.'
    });
  }

  if (rowNumber < 1) {
    rowNumber = Math.max(sheet.getLastRow() + 1, headerInfo.row + 2);
  }

  writePayrollEmployeeRow_(sheet, headerInfo, rowNumber, employee);
  SpreadsheetApp.flush();

  return jsonAbsensi_({
    ok: true,
    success: true,
    message: 'Data gaji karyawan berhasil disimpan.',
    employee: employee,
    rowNumber: rowNumber
  });
}

function handleDeletePayrollEmployee_(payload, spreadsheet) {
  if (!isAbsensiAdmin_(payload)) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Hanya owner/admin yang dapat menghapus data gaji karyawan.'
    });
  }

  var sheet = getPayrollSheet_(spreadsheet);
  var headerInfo = ensurePayrollHeaders_(sheet);
  var values = sheet.getDataRange().getDisplayValues();
  var rowNumber = findPayrollEmployeeRow_(values, headerInfo, {
    originalNip: payload.originalNip,
    originalName: payload.originalName,
    nip: payload.nip,
    name: payload.name || payload.nama
  });

  if (rowNumber < 1) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Data gaji karyawan tidak ditemukan.'
    });
  }

  sheet.deleteRow(rowNumber);
  SpreadsheetApp.flush();

  return jsonAbsensi_({
    ok: true,
    success: true,
    message: 'Data gaji karyawan berhasil dihapus.'
  });
}

function handleGenerateSalarySlip_(payload, spreadsheet) {
  if (!isAbsensiAdmin_(payload)) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Hanya owner/admin yang dapat membuat slip gaji.'
    });
  }

  var payrollSheet = getPayrollSheet_(spreadsheet);
  var employees = readPayrollEmployees_(payrollSheet);
  var employee = findPayrollEmployee_(employees, payload.nip || payload.NIP, payload.name || payload.nama || payload.nama_karyawan);
  var period = buildPayrollPeriod_(payload.month || payload.bulan, payload.year || payload.tahun);

  if (!employee) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Karyawan tidak ditemukan di sheet data_karyawan.'
    });
  }

  var templateSheet = spreadsheet.getSheetByName(PAYROLL_TEMPLATE_SHEET_NAME);

  if (!templateSheet) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Sheet template Slip_Gaji tidak ditemukan.'
    });
  }

  var summary = calculatePayrollAttendanceSummary_(spreadsheet, employee, period);
  var salary = calculatePayrollSalaryTotals_(employee, summary);
  var folder = getOrCreatePayrollFolder_();
  var exportSheet = templateSheet.copyTo(spreadsheet);
  var tempName = '_Slip_Gaji_Print_' + Utilities.formatDate(new Date(), ABSENSI_TIMEZONE, 'yyyyMMdd_HHmmss');
  var file;

  exportSheet.setName(tempName);

  try {
    writePayrollTemplateContext_(exportSheet, employee, period, summary, salary);
    SpreadsheetApp.flush();
    Utilities.sleep(PAYROLL_EXPORT_SETTLE_MS);
    file = exportPayrollSlipPdf_(spreadsheet, exportSheet, folder, employee, period);
  } finally {
    spreadsheet.deleteSheet(exportSheet);
  }

  var rowNumber = writePayrollLog_(spreadsheet, employee, period, summary, salary, file, payload);

  return jsonAbsensi_({
    ok: true,
    success: true,
    message: 'PDF slip gaji berhasil dibuat.',
    employee: employee,
    summary: summary,
    salary: salary,
    period: period,
    fileId: file.getId(),
    fileName: file.getName(),
    fileUrl: file.getUrl(),
    printUrl: file.getUrl(),
    rowNumber: rowNumber
  });
}

function handleListSalarySlipHistory_(params, spreadsheet) {
  var sheet = spreadsheet.getSheetByName(PAYROLL_LOG_SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    return jsonAbsensi_({
      ok: true,
      success: true,
      history: [],
      total: 0
    });
  }

  if (isAbsensiAdmin_(params)) {
    migrateLegacyPayrollLogRows_(sheet);
    cleanupZeroSalarySlipHistory_(sheet);
    if (isPayrollHistoryMaintenanceRequested_(params)) {
      restorePayrollLogFromPdfFiles_(spreadsheet, sheet);
    }
  }

  var values = sheet.getDataRange().getValues();
  var displayValues = sheet.getDataRange().getDisplayValues();
  var headerInfo = ensurePayrollLogHeaders_(sheet);
  values = sheet.getDataRange().getValues();
  displayValues = sheet.getDataRange().getDisplayValues();
  var headers = headerInfo.headers.map(normalizeAbsensiHeader_);
  var timestampColumn = findHeaderIndex_(headers, ['timestamp', 'diterbitkan', 'tanggal']);
  var periodColumn = findHeaderIndex_(headers, ['periode']);
  var nipColumn = findHeaderIndex_(headers, ['nip']);
  var nameColumn = findHeaderIndex_(headers, ['nama', 'namakaryawan']);
  var netSalaryColumn = findHeaderIndex_(headers, ['gajibersih', 'netsalary']);
  var fileColumn = findHeaderIndex_(headers, ['file']);
  var fileIdColumn = findHeaderIndex_(headers, ['fileid']);
  var fileUrlColumn = findHeaderIndex_(headers, ['fileurl', 'url']);
  var isAdmin = isAbsensiAdmin_(params);
  var identityKeys = [
    params.name,
    params.nama,
    params.nama_karyawan,
    params.username
  ].map(normalizeAbsensiKey_).filter(Boolean);
  var history = [];

  if (!isAdmin && !identityKeys.length) {
    return jsonAbsensi_({
      ok: true,
      success: true,
      history: [],
      total: 0,
      canDelete: false
    });
  }

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex];
    var displayRow = displayValues[rowIndex];
    var name = nameColumn >= 0 ? String(displayRow[nameColumn] || '').trim() : '';
    var nip = nipColumn >= 0 ? String(displayRow[nipColumn] || '').trim() : '';
    var rowIdentity = normalizeAbsensiKey_([name, nip].join(' '));

    if (!isAdmin && identityKeys.length && !identityKeys.some(function(key) {
      return key && rowIdentity.indexOf(key) >= 0;
    })) {
      continue;
    }

    var fileText = fileColumn >= 0 ? String(displayRow[fileColumn] || '').trim() : '';
    if (isCombinedPayrollHistoryRow_(name, nip, fileText)) {
      continue;
    }
    var fileParts = fileText.split('|');
    var fileName = String(fileParts[0] || '').trim();
    var fileUrl = fileUrlColumn >= 0
      ? String(displayRow[fileUrlColumn] || '').trim()
      : String(fileParts.slice(1).join('|') || '').trim();
    var fileId = fileIdColumn >= 0
      ? String(displayRow[fileIdColumn] || '').trim()
      : extractDriveFileId_(fileUrl);
    var timestampValue = timestampColumn >= 0 ? row[timestampColumn] : '';
    var issuedAt = timestampValue instanceof Date && !isNaN(timestampValue.getTime())
      ? timestampValue.toISOString()
      : String(timestampColumn >= 0 ? displayRow[timestampColumn] || '' : '').trim();
    var netSalary = netSalaryColumn >= 0 ? parsePayrollMoney_(displayRow[netSalaryColumn] || row[netSalaryColumn] || 0) : 0;

    if (netSalary <= 0) {
      continue;
    }

    history.push({
      id: fileId || ('row-' + (rowIndex + 1)),
      rowNumber: rowIndex + 1,
      issuedAt: issuedAt,
      period: periodColumn >= 0 ? String(displayRow[periodColumn] || '').trim() : '',
      nip: nip,
      name: name,
      netSalary: netSalary,
      fileId: fileId,
      fileName: fileName,
      fileUrl: fileUrl
    });
  }

  history.sort(function(a, b) {
    return new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime();
  });

  return jsonAbsensi_({
    ok: true,
    success: true,
    history: history,
    total: history.length,
    canDelete: isAdmin
  });
}

function handleDeleteSalarySlipHistory_(payload, spreadsheet) {
  if (!isAbsensiAdmin_(payload)) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Hanya owner/admin yang dapat menghapus histori slip gaji.'
    });
  }

  var sheet = spreadsheet.getSheetByName(PAYROLL_LOG_SHEET_NAME);
  var rowNumber = Number(payload.rowNumber || 0);

  if (!sheet || rowNumber < 2 || rowNumber > sheet.getLastRow()) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Histori slip gaji tidak ditemukan.'
    });
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(normalizeAbsensiHeader_);
  var row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var fileColumn = findHeaderIndex_(headers, ['file']);
  var fileIdColumn = findHeaderIndex_(headers, ['fileid']);
  var fileUrlColumn = findHeaderIndex_(headers, ['fileurl', 'url']);
  var fileText = fileColumn >= 0 ? String(row[fileColumn] || '').trim() : '';
  var fileUrl = fileUrlColumn >= 0
    ? String(row[fileUrlColumn] || '').trim()
    : String(fileText.split('|').slice(1).join('|') || '').trim();
  var fileId = String(payload.fileId || (fileIdColumn >= 0 ? row[fileIdColumn] : '') || extractDriveFileId_(fileUrl)).trim();

  if (fileId) {
    try {
      DriveApp.getFileById(fileId).setTrashed(true);
    } catch (error) {
      // Log tetap boleh dihapus jika file Drive sudah tidak tersedia.
    }
  }

  sheet.deleteRow(rowNumber);
  SpreadsheetApp.flush();

  return jsonAbsensi_({
    ok: true,
    success: true,
    message: 'Histori slip gaji berhasil dihapus.'
  });
}

function handleDeleteAllSalarySlipHistory_(payload, spreadsheet) {
  if (!isAbsensiAdmin_(payload)) {
    return jsonAbsensi_({
      ok: false,
      success: false,
      message: 'Hanya owner/admin yang dapat menghapus semua histori slip gaji.'
    });
  }

  var sheet = spreadsheet.getSheetByName(PAYROLL_LOG_SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    return jsonAbsensi_({
      ok: true,
      success: true,
      deleted: 0,
      message: 'Tidak ada histori slip gaji yang perlu dihapus.'
    });
  }

  var headerInfo = ensurePayrollLogHeaders_(sheet);
  var values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  var fileColumn = findHeaderIndex_(headerInfo.normalized, getPayrollLogHeaderAliases_('file'));
  var fileIdColumn = findHeaderIndex_(headerInfo.normalized, getPayrollLogHeaderAliases_('fileid'));
  var fileUrlColumn = findHeaderIndex_(headerInfo.normalized, getPayrollLogHeaderAliases_('fileurl'));
  var deleted = 0;
  var trashed = 0;

  for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    var row = values[rowIndex];
    var fileText = fileColumn >= 0 ? String(row[fileColumn] || '').trim() : '';
    var fileUrl = fileUrlColumn >= 0
      ? String(row[fileUrlColumn] || '').trim()
      : String(fileText.split('|').slice(1).join('|') || '').trim();
    var fileId = String(fileIdColumn >= 0 ? row[fileIdColumn] || '' : '').trim() || extractDriveFileId_(fileUrl);

    if (fileId) {
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
        trashed += 1;
      } catch (error) {
        // Baris tetap dihapus meskipun file Drive sudah tidak tersedia.
      }
    }

    sheet.deleteRow(rowIndex + 1);
    deleted += 1;
  }

  SpreadsheetApp.flush();

  return jsonAbsensi_({
    ok: true,
    success: true,
    deleted: deleted,
    trashed: trashed,
    message: 'Semua histori slip gaji berhasil dihapus.'
  });
}

function getPayrollSheet_(spreadsheet) {
  return spreadsheet.getSheetByName(PAYROLL_SHEET_NAME) || spreadsheet.insertSheet(PAYROLL_SHEET_NAME);
}

function ensurePayrollHeaders_(sheet) {
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    sheet.getRange(1, 1, 1, PAYROLL_DEFAULT_HEADERS.length).setValues([PAYROLL_DEFAULT_HEADERS]);
  }

  var values = sheet.getDataRange().getDisplayValues();
  var headerInfo = findPayrollHeaderInfo_(values);

  if (headerInfo.row < 0) {
    sheet.getRange(1, 1, 1, PAYROLL_DEFAULT_HEADERS.length).setValues([PAYROLL_DEFAULT_HEADERS]);
    values = sheet.getDataRange().getDisplayValues();
    headerInfo = findPayrollHeaderInfo_(values);
  }

  var normalizedHeaders = headerInfo.headers.map(normalizeAbsensiHeader_);

  PAYROLL_DEFAULT_HEADERS.forEach(function(header) {
    if (findHeaderIndex_(normalizedHeaders, getPayrollHeaderAliases_(normalizeAbsensiHeader_(header))) >= 0) return;
    sheet.getRange(headerInfo.row + 1, headerInfo.headers.length + 1).setValue(header);
    headerInfo.headers.push(header);
    normalizedHeaders.push(normalizeAbsensiHeader_(header));
  });

  headerInfo.normalized = normalizedHeaders;
  return headerInfo;
}

function findPayrollHeaderInfo_(values) {
  var maxRows = Math.min(values.length, 20);

  for (var rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    var normalized = values[rowIndex].map(normalizeAbsensiHeader_);
    var joined = normalized.join('|');

    if (joined.indexOf('nip') >= 0 && (joined.indexOf('namakaryawan') >= 0 || joined.indexOf('nama') >= 0)) {
      return {
        row: rowIndex,
        headers: values[rowIndex].map(function(header) {
          return String(header || '').trim();
        }),
        normalized: normalized
      };
    }
  }

  return {
    row: -1,
    headers: [],
    normalized: []
  };
}

function readPayrollEmployees_(sheet) {
  var headerInfo = ensurePayrollHeaders_(sheet);
  var values = sheet.getDataRange().getDisplayValues();
  var normalizedHeaders = headerInfo.headers.map(normalizeAbsensiHeader_);
  var employees = [];

  for (var rowIndex = headerInfo.row + 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex];
    var employee = readPayrollEmployeeFromRow_(row, normalizedHeaders);

    if (!employee.nip && !employee.name) continue;

    employee.rowNumber = rowIndex + 1;
    employees.push(employee);
  }

  return employees;
}

function readPayrollEmployeeFromRow_(row, normalizedHeaders) {
  var nipColumn = findHeaderIndex_(normalizedHeaders, getPayrollHeaderAliases_('nip'));

  return {
    no: pickPayrollValue_(row, normalizedHeaders, ['no', 'nomor']),
    nip: pickPayrollValue_(row, normalizedHeaders, ['nip', 'idkaryawan', 'nik', 'kode']),
    name: pickPayrollValue_(row, normalizedHeaders, ['namakaryawan', 'nama', 'name', 'karyawan']),
    job: pickPayrollValue_(row, normalizedHeaders, ['jabatan', 'job', 'posisi', 'role']),
    status: pickPayrollValue_(row, normalizedHeaders, ['status', 'aktif', 'keterangan']) || 'Aktif',
    baseSalary: pickPayrollMoney_(row, normalizedHeaders, ['gajipokok', 'gaji'], nipColumn, 3),
    baseSalaryMode: sanitizePayrollMode_(pickPayrollValue_(row, normalizedHeaders, ['modegajipokok', 'modegaji', 'gajipokokmode']), 'monthly'),
    mealAllowance: pickPayrollMoney_(row, normalizedHeaders, ['uangmakan', 'makan'], nipColumn, 4),
    mealAllowanceMode: sanitizePayrollMode_(pickPayrollValue_(row, normalizedHeaders, ['modeuangmakan', 'uangmakanmode', 'modemakan']), 'daily'),
    overtime: pickPayrollMoney_(row, normalizedHeaders, ['lembur'], nipColumn, 5),
    overtimeMode: sanitizePayrollMode_(pickPayrollValue_(row, normalizedHeaders, ['modelembur', 'lemburmode', 'modeovertime']), 'daily'),
    allowance: pickPayrollMoney_(row, normalizedHeaders, ['tunjangan', 'tunjangantransport', 'transport'], nipColumn, 6),
    allowanceMode: sanitizePayrollMode_(pickPayrollValue_(row, normalizedHeaders, ['modetunjangan', 'tunjanganmode', 'modetunjangantransport']), 'monthly'),
    bonus: pickPayrollMoney_(row, normalizedHeaders, ['bonus'], nipColumn, 7),
    loan: pickPayrollMoney_(row, normalizedHeaders, ['pinjaman'], nipColumn, 8),
    debt: pickPayrollMoney_(row, normalizedHeaders, ['hutang'], nipColumn, 9),
    other: pickPayrollMoney_(row, normalizedHeaders, ['lainlain', 'lainnya', 'potonganlain'], nipColumn, 10),
    email: pickPayrollValue_(row, normalizedHeaders, ['email', 'gmail', 'alamatemail']),
    phone: pickPayrollValue_(row, normalizedHeaders, ['phone', 'telepon', 'hp', 'nohp', 'whatsapp', 'wa'])
  };
}

function sanitizePayrollEmployee_(value) {
  value = value && typeof value == 'object' ? value : {};

  return {
    nip: String(value.nip || value.NIP || value.id || '').trim(),
    name: String(value.name || value.nama || value.namaKaryawan || value.nama_karyawan || '').trim(),
    job: String(value.job || value.jabatan || value.role || '').trim(),
    status: isInactiveEmployeeStatus_(value.status || value.aktif || value.keterangan) ? 'Non Aktif' : 'Aktif',
    baseSalary: parsePayrollMoney_(value.baseSalary || value.gajiPokok || value.gaji_pokok || value.gaji || 0),
    baseSalaryMode: sanitizePayrollMode_(value.baseSalaryMode || value.modeGajiPokok || value.mode_gaji_pokok || value.gajiPokokMode, 'monthly'),
    mealAllowance: parsePayrollMoney_(value.mealAllowance || value.uangMakan || value.uang_makan || 0),
    mealAllowanceMode: sanitizePayrollMode_(value.mealAllowanceMode || value.modeUangMakan || value.mode_uang_makan || value.uangMakanMode, 'daily'),
    overtime: parsePayrollMoney_(value.overtime || value.lembur || 0),
    overtimeMode: sanitizePayrollMode_(value.overtimeMode || value.modeLembur || value.mode_lembur || value.lemburMode, 'daily'),
    allowance: parsePayrollMoney_(value.allowance || value.tunjangan || value.transport || 0),
    allowanceMode: sanitizePayrollMode_(value.allowanceMode || value.modeTunjangan || value.mode_tunjangan || value.tunjanganMode, 'monthly'),
    bonus: parsePayrollMoney_(value.bonus || 0),
    loan: parsePayrollMoney_(value.loan || value.pinjaman || 0),
    debt: parsePayrollMoney_(value.debt || value.hutang || 0),
    other: parsePayrollMoney_(value.other || value.lainLain || value.lain_lain || 0),
    email: String(value.email || value.gmail || '').trim(),
    phone: String(value.phone || value.noHp || value.no_hp || value.telepon || value.whatsapp || value.wa || '').trim()
  };
}

function writePayrollEmployeeRow_(sheet, headerInfo, rowNumber, employee) {
  var normalizedHeaders = headerInfo.headers.map(normalizeAbsensiHeader_);
  var map = {
    no: rowNumber - headerInfo.row - 1,
    nip: employee.nip,
    namakaryawan: employee.name,
    jabatan: employee.job,
    status: employee.status || 'Aktif',
    gajipokok: employee.baseSalary,
    modegajipokok: employee.baseSalaryMode,
    uangmakan: employee.mealAllowance,
    modeuangmakan: employee.mealAllowanceMode,
    lembur: employee.overtime,
    modelembur: employee.overtimeMode,
    tunjangan: employee.allowance,
    modetunjangan: employee.allowanceMode,
    bonus: employee.bonus,
    pinjaman: employee.loan,
    hutang: employee.debt,
    lainlain: employee.other,
    email: employee.email || '',
    phone: employee.phone || ''
  };

  Object.keys(map).forEach(function(key) {
    var column = findHeaderIndex_(normalizedHeaders, getPayrollHeaderAliases_(key));
    if (column < 0) return;
    sheet.getRange(rowNumber, column + 1).setValue(map[key]);
  });
}

function findPayrollEmployeeRow_(values, headerInfo, criteria) {
  criteria = criteria || {};
  var normalizedHeaders = headerInfo.headers.map(normalizeAbsensiHeader_);
  var nipColumn = findHeaderIndex_(normalizedHeaders, getPayrollHeaderAliases_('nip'));
  var nameColumn = findHeaderIndex_(normalizedHeaders, getPayrollHeaderAliases_('namakaryawan'));
  var wanted = [
    criteria.originalNip,
    criteria.originalName,
    criteria.nip,
    criteria.name
  ].map(normalizeAbsensiKey_).filter(Boolean);

  if (!wanted.length) return -1;

  for (var rowIndex = headerInfo.row + 1; rowIndex < values.length; rowIndex += 1) {
    var rowKeys = [];
    if (nipColumn >= 0) rowKeys.push(values[rowIndex][nipColumn]);
    if (nameColumn >= 0) rowKeys.push(values[rowIndex][nameColumn]);
    rowKeys = rowKeys.map(normalizeAbsensiKey_).filter(Boolean);

    for (var keyIndex = 0; keyIndex < rowKeys.length; keyIndex += 1) {
      if (wanted.indexOf(rowKeys[keyIndex]) >= 0) return rowIndex + 1;
    }
  }

  return -1;
}

function findPayrollEmployee_(employees, nip, name) {
  var nipKey = normalizeAbsensiKey_(nip || '');
  var nameKey = normalizeAbsensiKey_(name || '');

  for (var i = 0; i < employees.length; i += 1) {
    if (nipKey && normalizeAbsensiKey_(employees[i].nip) == nipKey) return employees[i];
    if (nameKey && normalizeAbsensiKey_(employees[i].name) == nameKey) return employees[i];
  }

  return null;
}

function pickPayrollValue_(row, normalizedHeaders, aliases) {
  var column = findHeaderIndex_(normalizedHeaders, aliases);
  if (column < 0) return '';
  return row[column] == null ? '' : row[column];
}

function pickPayrollMoney_(row, normalizedHeaders, aliases, anchorColumn, offsetFromAnchor) {
  var value = pickPayrollValue_(row, normalizedHeaders, aliases);
  var number = parsePayrollMoney_(value);
  var fallbackColumn = anchorColumn >= 0 ? anchorColumn + offsetFromAnchor : -1;
  var fallbackValue = fallbackColumn >= 0 && fallbackColumn < row.length ? row[fallbackColumn] : '';
  var fallbackNumber = parsePayrollMoney_(fallbackValue);

  if (fallbackNumber !== 0 && (number === 0 || String(value || '').trim() === '')) {
    return fallbackNumber;
  }

  return number;
}

function getPayrollHeaderAliases_(key) {
  var aliases = {
    no: ['no', 'nomor'],
    nip: ['nip', 'idkaryawan', 'idpegawai', 'nik', 'kode'],
    namakaryawan: ['namakaryawan', 'nama', 'name', 'karyawan', 'namapegawai', 'pegawai'],
    jabatan: ['jabatan', 'job', 'posisi', 'role'],
    status: ['status', 'aktif', 'keterangan'],
    gajipokok: ['gajipokok', 'gaji', 'salary', 'basesalary'],
    modegajipokok: ['modegajipokok', 'modegaji', 'gajipokokmode', 'basesalarymode'],
    uangmakan: ['uangmakan', 'makan', 'mealallowance'],
    modeuangmakan: ['modeuangmakan', 'uangmakanmode', 'modemakan', 'mealallowancemode'],
    lembur: ['lembur', 'overtime'],
    modelembur: ['modelembur', 'lemburmode', 'modeovertime', 'overtimemode'],
    tunjangan: ['tunjangan', 'tunjangantransport', 'transport', 'allowance'],
    modetunjangan: ['modetunjangan', 'tunjanganmode', 'modetunjangantransport', 'allowancemode'],
    bonus: ['bonus'],
    pinjaman: ['pinjaman', 'loan'],
    hutang: ['hutang', 'debt'],
    lainlain: ['lainlain', 'lainnya', 'potonganlain', 'other'],
    email: ['email', 'alamatemail', 'gmail'],
    phone: ['phone', 'telepon', 'hp', 'nohp', 'whatsapp', 'wa']
  };

  return aliases[key] || [key];
}

function parsePayrollMoney_(value) {
  if (typeof value == 'number') return isFinite(value) ? value : 0;

  var text = String(value == null ? '' : value).trim();
  if (!text) return 0;

  var negative = /^\s*-/.test(text);
  text = text
    .replace(/[^\d.,-]/g, '')
    .replace(/-/g, '')
    .replace(/^[.,]+/, '');

  if (!text) return 0;

  if (text.indexOf(',') >= 0 && text.indexOf('.') >= 0) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, '');
  } else if (/^\d{1,3}(,\d{3})+$/.test(text)) {
    text = text.replace(/,/g, '');
  } else {
    text = text.replace(',', '.');
  }

  var number = Number(text);
  if (!isFinite(number)) return 0;

  return negative ? -number : number;
}

function sanitizePayrollMode_(value, fallback) {
  var text = normalizeAbsensiKey_(value || '');
  var defaultMode = fallback == 'daily' ? 'daily' : 'monthly';

  if (text == 'perhari' || text == 'harian' || text == 'daily' || text == 'day') {
    return 'daily';
  }

  if (text == 'perbulan' || text == 'bulanan' || text == 'monthly' || text == 'month') {
    return 'monthly';
  }

  return defaultMode;
}

function buildPayrollPeriod_(monthValue, yearValue) {
  var now = new Date();
  var month = Number(monthValue || (now.getMonth() + 1));
  var year = Number(yearValue || now.getFullYear());

  if (!month || month < 1 || month > 12) month = now.getMonth() + 1;
  if (!year || year < 2000 || year > 2200) year = now.getFullYear();

  return {
    month: ('0' + month).slice(-2),
    monthNumber: month,
    year: String(year),
    label: PAYROLL_MONTHS_ID[month - 1] + ' ' + year,
    fileStamp: year + '-' + ('0' + month).slice(-2),
    start: year + '-' + ('0' + month).slice(-2) + '-01',
    end: Utilities.formatDate(new Date(year, month, 0), ABSENSI_TIMEZONE, 'yyyy-MM-dd')
  };
}

function calculatePayrollAttendanceSummary_(spreadsheet, employee, period) {
  var sheet = getAbsensiSheet_(spreadsheet);
  var values = sheet.getDataRange().getValues();
  var groups = {};
  var targetName = normalizeAbsensiKey_(employee.name || '');

  if (values.length < 2) {
    return buildPayrollSummaryResult_({}, period);
  }

  var headers = values[0].map(normalizeAbsensiHeader_);
  var columns = getAbsensiColumns_(headers);

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex];
    var rowName = normalizeAbsensiKey_(row[columns.name]);
    if (!targetName || rowName != targetName) continue;

    var timestamp = row[columns.timestamp];
    var dateKey = sanitizeAbsensiDateKey_(row[columns.dateKey]) || getJakartaDateKey_(timestamp);
    if (!dateKey || dateKey < period.start || dateKey > period.end) continue;

    var shift = String(row[columns.shift] || '').toUpperCase();
    var shiftKey = shift.indexOf('SORE') >= 0 ? 'sore' : 'pagi';
    var status = normalizeAbsensiStatus_(row[columns.status]);
    var groupKey = status == 'LEMBUR'
      ? dateKey + '|lembur|' + shiftKey + '|' + rowIndex
      : dateKey + '|regular';
    var warningText = normalizeAbsensiKey_([row[columns.warning], row[columns.warningFlag]].join(' '));

    if (!groups[groupKey]) {
      groups[groupKey] = {
        date: dateKey,
        shift: shiftKey,
        datang: false,
        pulang: false,
        lembur: false,
        late: false,
        early: false
      };
    }

    if (status == 'DATANG') groups[groupKey].datang = true;
    if (status == 'PULANG') groups[groupKey].pulang = true;
    if (status == 'LEMBUR') groups[groupKey].lembur = true;
    if (warningText.indexOf('late') >= 0 || warningText.indexOf('terlambat') >= 0 || warningText.indexOf('telat') >= 0) groups[groupKey].late = true;
    if (warningText.indexOf('earlyreturn') >= 0 || warningText.indexOf('pulangcepat') >= 0 || warningText.indexOf('lebihcepat') >= 0) groups[groupKey].early = true;
  }

  return buildPayrollSummaryResult_(groups, period);
}

function buildPayrollSummaryResult_(groups, period) {
  var keys = Object.keys(groups || {});
  var summary = {
    workDays: countPayrollWorkDays_(Number(period.year), Number(period.monthNumber)),
    present: 0,
    completeDays: 0,
    late: 0,
    absent: 0,
    earlyReturn: 0,
    overtimeDays: 0,
    shiftPagi: 0,
    shiftSore: 0
  };

  keys.forEach(function(key) {
    var item = groups[key];
    if (item.datang) {
      summary.present += 1;
      if (item.shift == 'sore') summary.shiftSore += 1;
      else summary.shiftPagi += 1;
    }
    if (item.datang && item.pulang) summary.completeDays += 1;
    if (item.lembur) summary.overtimeDays += 1;
    if (item.late) summary.late += 1;
    if (item.early) summary.earlyReturn += 1;
  });

  summary.absent = Math.max(0, summary.workDays - summary.present);
  return summary;
}

function calculatePayrollSalaryTotals_(employee, summary) {
  var presentDays = Number(summary.present || 0);
  var completeDays = Number(summary.completeDays || summary.present || 0);
  var overtimeDays = Number(summary.overtimeDays || 0);
  var baseSalary = Number(employee.baseSalary || 0);
  var mealAllowance = Number(employee.mealAllowance || 0);
  var overtime = Number(employee.overtime || 0);
  var baseAmount = employee.baseSalaryMode == 'daily' ? baseSalary * presentDays : baseSalary;
  var mealAmount = employee.mealAllowanceMode == 'daily' ? mealAllowance * presentDays : mealAllowance;
  var overtimeAmount = employee.overtimeMode == 'daily' ? overtime * overtimeDays : overtime;
  var allowance = Number(employee.allowance || 0);
  var allowanceAmount = employee.allowanceMode == 'daily' ? allowance * presentDays : allowance;
  var bonusAmount = Number(employee.bonus || 0);
  var loanAmount = Number(employee.loan || 0);
  var debtAmount = Number(employee.debt || 0);
  var otherAmount = Number(employee.other || 0);
  var gross = baseAmount + mealAmount + overtimeAmount + allowanceAmount + bonusAmount;
  var deductions = loanAmount + debtAmount + otherAmount;

  return {
    presentDays: presentDays,
    completeDays: completeDays,
    overtimeDays: overtimeDays,
    baseAmount: baseAmount,
    mealAmount: mealAmount,
    overtimeAmount: overtimeAmount,
    allowanceAmount: allowanceAmount,
    bonusAmount: bonusAmount,
    loanAmount: loanAmount,
    debtAmount: debtAmount,
    otherAmount: otherAmount,
    gross: gross,
    deductions: deductions,
    netSalary: gross - deductions
  };
}

function countPayrollWorkDays_(year, month) {
  var total = 0;
  var date = new Date(year, month - 1, 1);

  while (date.getMonth() == month - 1) {
    if (date.getDay() !== 0) total += 1;
    date.setDate(date.getDate() + 1);
  }

  return total;
}

function writePayrollTemplateContext_(templateSheet, employee, period, summary, salary) {
  clearPayrollTemplateCells_(templateSheet);
  setPayrollTemplateValue_(templateSheet, PAYROLL_NIP_CELL, employee.nip, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_NAME_CELL, employee.name || '', true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_PERIOD_CELL, period.label, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_SHIFT_PAGI_CELL, summary.shiftPagi + ' HARI', true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_SHIFT_SORE_CELL, summary.shiftSore + ' HARI', true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.job, employee.job || '', true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.baseAmount, salary.baseAmount, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.mealAmount, salary.mealAmount, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.overtimeAmount, salary.overtimeAmount, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.allowanceAmount, salary.allowanceAmount, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.bonusAmount, salary.bonusAmount, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.loanAmount, salary.loanAmount, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.debtAmount, salary.debtAmount, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.otherAmount, salary.otherAmount, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.gross, salary.gross, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.deductions, salary.deductions, true);
  setPayrollTemplateValue_(templateSheet, PAYROLL_TEMPLATE_CELLS.netSalary, salary.netSalary, true);
}

function clearPayrollTemplateCells_(templateSheet) {
  PAYROLL_TEMPLATE_CLEAR_CELLS.forEach(function(a1) {
    if (!a1) return;

    try {
      templateSheet.getRange(a1).clearContent();
    } catch (error) {
      // Cell template opsional boleh tidak ada.
    }
  });
}

function setPayrollTemplateValue_(sheet, a1, value, always) {
  if (!a1) return;

  try {
    var range = sheet.getRange(a1);
    if (!always && range.getFormula()) return;
    range.setValue(value);
  } catch (error) {
    // Template range can be customized manually; missing optional cells are ignored.
  }
}

function getOrCreatePayrollFolder_() {
  var folders = DriveApp.getFoldersByName(PAYROLL_PDF_FOLDER_NAME);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(PAYROLL_PDF_FOLDER_NAME);
}

function exportPayrollSlipPdf_(spreadsheet, templateSheet, folder, employee, period) {
  var url = 'https://docs.google.com/spreadsheets/d/' + spreadsheet.getId() + '/export'
    + '?format=pdf'
    + '&gid=' + templateSheet.getSheetId()
    + '&range=' + encodeURIComponent(PAYROLL_EXPORT_RANGE)
    + '&size=A4'
    + '&portrait=true'
    + '&fitw=true'
    + '&sheetnames=false'
    + '&printtitle=false'
    + '&pagenumbers=false'
    + '&gridlines=false'
    + '&fzr=false'
    + '&horizontal_alignment=CENTER'
    + '&vertical_alignment=TOP'
    + '&top_margin=0.25'
    + '&bottom_margin=0.25'
    + '&left_margin=0.25'
    + '&right_margin=0.25';
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() >= 400) {
    throw new Error('Export PDF slip gaji gagal: ' + response.getContentText());
  }

  var fileName = 'Slip_Gaji_' + sanitizeAbsensiFileName_(employee.name || employee.nip) + '_' + period.fileStamp + '.pdf';
  var file = folder.createFile(response.getBlob().setName(fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file;
}

function writePayrollLog_(spreadsheet, employee, period, summary, salary, file, payload) {
  var sheet = spreadsheet.getSheetByName(PAYROLL_LOG_SHEET_NAME) || spreadsheet.insertSheet(PAYROLL_LOG_SHEET_NAME);
  var headerInfo = ensurePayrollLogHeaders_(sheet);
  var rowNumber = sheet.getLastRow() + 1;
  var actor = String((payload && (payload.username || payload.actor)) || '').trim();
  var map = {
    timestamp: payload && payload.timestamp ? payload.timestamp : new Date(),
    periode: period.label,
    nip: employee.nip,
    nama: employee.name,
    shiftpagi: summary.shiftPagi,
    shiftsore: summary.shiftSore,
    hadir: summary.present,
    hadirlengkap: summary.completeDays,
    terlambat: summary.late,
    pulangcepat: summary.earlyReturn,
    lembur: summary.overtimeDays,
    gajibersih: salary.netSalary,
    file: file.getName() + ' | ' + file.getUrl(),
    fileid: file.getId(),
    fileurl: file.getUrl(),
    diterbitkanoleh: actor
  };

  Object.keys(map).forEach(function(key) {
    var column = findHeaderIndex_(headerInfo.normalized, getPayrollLogHeaderAliases_(key));
    if (column < 0) return;
    sheet.getRange(rowNumber, column + 1).setValue(map[key]);
  });

  SpreadsheetApp.flush();
  return rowNumber;
}

function getPayrollLogDefaultHeaders_() {
  return [
    'Timestamp',
    'Periode',
    'NIP',
    'Nama',
    'Shift Pagi',
    'Shift Sore',
    'Hadir',
    'Hadir Lengkap',
    'Terlambat',
    'Pulang Cepat',
    'Lembur',
    'Gaji Bersih',
    'File',
    'File ID',
    'File URL',
    'Diterbitkan Oleh'
  ];
}

function getPayrollLogHeaderAliases_(key) {
  var aliases = {
    timestamp: ['timestamp', 'tanggal', 'diterbitkan'],
    periode: ['periode', 'period'],
    nip: ['nip', 'idkaryawan', 'nik'],
    nama: ['nama', 'namakaryawan', 'name'],
    shiftpagi: ['shiftpagi'],
    shiftsore: ['shiftsore'],
    hadir: ['hadir'],
    hadirlengkap: ['hadirlengkap'],
    terlambat: ['terlambat'],
    pulangcepat: ['pulangcepat'],
    lembur: ['lembur'],
    gajibersih: ['gajibersih', 'netsalary'],
    file: ['file'],
    fileid: ['fileid'],
    fileurl: ['fileurl', 'url'],
    diterbitkanoleh: ['diterbitkanoleh', 'publishedby', 'actor']
  };

  return aliases[key] || [key];
}

function ensurePayrollLogHeaders_(sheet) {
  var defaults = getPayrollLogDefaultHeaders_();

  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    sheet.getRange(1, 1, 1, defaults.length).setValues([defaults]);
  }

  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0].map(function(header) {
    return String(header || '').trim();
  });

  if (!headers.filter(Boolean).length) {
    headers = defaults.slice();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  var normalized = headers.map(normalizeAbsensiHeader_);

  defaults.forEach(function(header) {
    var key = normalizeAbsensiHeader_(header);
    if (findHeaderIndex_(normalized, getPayrollLogHeaderAliases_(key)) >= 0) return;
    sheet.getRange(1, headers.length + 1).setValue(header);
    headers.push(header);
    normalized.push(normalizeAbsensiHeader_(header));
  });

  return {
    headers: headers,
    normalized: normalized
  };
}

function cleanupZeroSalarySlipHistory_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return 0;

  var headerInfo = ensurePayrollLogHeaders_(sheet);
  var values = sheet.getDataRange().getDisplayValues();
  var nameColumn = findHeaderIndex_(headerInfo.normalized, ['nama', 'namakaryawan']);
  var nipColumn = findHeaderIndex_(headerInfo.normalized, ['nip', 'idkaryawan', 'nik']);
  var netSalaryColumn = findHeaderIndex_(headerInfo.normalized, ['gajibersih', 'netsalary']);
  var fileColumn = findHeaderIndex_(headerInfo.normalized, ['file']);
  var deleted = 0;

  if (netSalaryColumn < 0) return 0;

  for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    var row = values[rowIndex];
    var name = nameColumn >= 0 ? String(row[nameColumn] || '').trim() : '';
    var nip = nipColumn >= 0 ? String(row[nipColumn] || '').trim() : '';
    var fileText = fileColumn >= 0 ? String(row[fileColumn] || '').trim() : '';

    if (isCombinedPayrollHistoryRow_(name, nip, fileText)) {
      sheet.deleteRow(rowIndex + 1);
      deleted += 1;
      continue;
    }

    var netSalary = parsePayrollMoney_(row[netSalaryColumn]);
    var legacySalary = parseLegacyPayrollLogSalary_(row);
    var rowLooksLikeSlip = fileText || row.join('|').indexOf('Slip_Gaji_') >= 0;

    if (legacySalary > 0 && netSalary <= 0) {
      continue;
    }

    if (rowLooksLikeSlip && netSalary <= 0) {
      sheet.deleteRow(rowIndex + 1);
      deleted += 1;
    }
  }

  if (deleted) SpreadsheetApp.flush();
  return deleted;
}

function migrateLegacyPayrollLogRows_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return 0;

  var headerInfo = ensurePayrollLogHeaders_(sheet);
  var lastRow = sheet.getLastRow();
  var lastColumn = Math.max(sheet.getLastColumn(), 16);
  var values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  var normalized = headerInfo.normalized;
  var columns = {
    shiftPagi: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('shiftpagi')),
    shiftSore: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('shiftsore')),
    hadir: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('hadir')),
    hadirLengkap: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('hadirlengkap')),
    terlambat: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('terlambat')),
    pulangCepat: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('pulangcepat')),
    lembur: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('lembur')),
    gajiBersih: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('gajibersih')),
    file: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('file')),
    fileId: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('fileid')),
    fileUrl: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('fileurl')),
    diterbitkanOleh: findHeaderIndex_(normalized, getPayrollLogHeaderAliases_('diterbitkanoleh'))
  };
  var migrated = 0;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex];
    var rowText = row.join('|');
    if (isCombinedPayrollHistoryRow_(row[3], row[2], rowText)) continue;
    var fileInfo = getLegacyPayrollLogFileInfo_(row);
    var legacySalary = parseLegacyPayrollLogSalary_(row);

    if (rowText.indexOf('Slip_Gaji_') < 0 && !fileInfo.fileName) continue;
    if (legacySalary <= 0) continue;

    var map = {
      shiftPagi: row[4],
      shiftSore: row[5],
      hadir: row[6],
      hadirLengkap: row[7],
      terlambat: row[8],
      pulangCepat: row[9],
      lembur: row[10],
      gajiBersih: legacySalary,
      file: fileInfo.fileText,
      fileId: fileInfo.fileId,
      fileUrl: fileInfo.fileUrl,
      diterbitkanOleh: sanitizeLegacyPayrollLogCell_(row[15])
    };

    Object.keys(map).forEach(function(key) {
      var column = columns[key];
      if (column < 0) return;

      var value = map[key];
      if (value == null || value === '') return;

      var current = String(row[column] || '').trim();
      var shouldWrite = !current;

      if (key == 'gajiBersih') {
        shouldWrite = parsePayrollMoney_(current) <= 0;
      } else if (key == 'fileId' || key == 'fileUrl' || key == 'diterbitkanOleh') {
        shouldWrite = !current || current === '0';
      }

      if (!shouldWrite) return;

      sheet.getRange(rowIndex + 1, column + 1).setValue(value);
      row[column] = value;
      migrated += 1;
    });
  }

  if (migrated) SpreadsheetApp.flush();
  return migrated;
}

function parseLegacyPayrollLogSalary_(row) {
  var preferred = parsePayrollMoney_(row[11]);
  if (preferred > 0) return preferred;

  for (var index = 4; index < row.length; index += 1) {
    var text = String(row[index] || '').trim();
    if (!text) continue;
    if (/[a-zA-Z]/.test(text) && !/^rp\b/i.test(text)) continue;

    var number = parsePayrollMoney_(text);
    if (number >= 10000) return number;
  }

  return 0;
}

function getLegacyPayrollLogFileInfo_(row) {
  var fileIndex = -1;
  var fileText = '';
  var fileId = '';
  var fileUrl = '';

  for (var index = 0; index < row.length; index += 1) {
    var text = String(row[index] || '').trim();
    if (text.indexOf('Slip_Gaji_') >= 0) {
      fileIndex = index;
      fileText = text;
      break;
    }
  }

  if (fileIndex >= 0) {
    var parts = fileText.split('|');
    var fileName = sanitizeLegacyPayrollLogCell_(parts[0]);
    fileUrl = sanitizeLegacyPayrollLogCell_(parts.slice(1).join('|')) || sanitizeLegacyPayrollLogCell_(row[fileIndex + 2]);
    fileId = sanitizeLegacyPayrollLogCell_(row[fileIndex + 1]) || extractDriveFileId_(fileUrl);

    if (!fileUrl && fileId) {
      fileUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
    }

    return {
      fileName: fileName,
      fileId: fileId,
      fileUrl: fileUrl,
      fileText: fileName + (fileUrl ? ' | ' + fileUrl : '')
    };
  }

  return {
    fileName: '',
    fileId: '',
    fileUrl: '',
    fileText: ''
  };
}

function sanitizeLegacyPayrollLogCell_(value) {
  var text = String(value || '').trim();
  return text === '0' ? '' : text;
}

function isCombinedPayrollHistoryRow_(name, nip, fileText) {
  var nameKey = normalizeAbsensiKey_(name || '');
  var nipKey = normalizeAbsensiKey_(nip || '');
  var fileKey = normalizeAbsensiKey_(fileText || '');

  return nipKey == 'semua'
    || nameKey == 'semuaslipgaji'
    || nameKey == 'semua'
    || fileKey.indexOf('semuaslipgaji') >= 0;
}

function isPayrollHistoryMaintenanceRequested_(params) {
  var value = normalizeAbsensiKey_(params.repairHistory || params.restoreHistory || params.maintenance || '');
  return value == '1' || value == 'true' || value == 'yes' || value == 'restore' || value == 'repair';
}

function restorePayrollLogFromPdfFiles_(spreadsheet, sheet) {
  if (!sheet) return 0;

  var headerInfo = ensurePayrollLogHeaders_(sheet);
  var values = sheet.getDataRange().getDisplayValues();
  var fileIdColumn = findHeaderIndex_(headerInfo.normalized, getPayrollLogHeaderAliases_('fileid'));
  var fileColumn = findHeaderIndex_(headerInfo.normalized, getPayrollLogHeaderAliases_('file'));
  var known = {};
  var restored = 0;

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var row = values[rowIndex];
    var fileId = fileIdColumn >= 0 ? sanitizeLegacyPayrollLogCell_(row[fileIdColumn]) : '';
    var fileText = fileColumn >= 0 ? sanitizeLegacyPayrollLogCell_(row[fileColumn]) : '';

    if (fileId) known['id:' + fileId] = true;
    if (fileText) known['file:' + fileText.split('|')[0].trim()] = true;
  }

  var payrollSheet = getPayrollSheet_(spreadsheet);
  var employees = readPayrollEmployees_(payrollSheet);
  var folder = getOrCreatePayrollFolder_();
  var files = folder.getFiles();

  while (files.hasNext()) {
    var file = files.next();
    var parsed = parsePayrollSlipFileName_(file.getName());

    if (!parsed) continue;
    if (known['id:' + file.getId()] || known['file:' + file.getName()]) continue;

    var employee = findPayrollEmployee_(employees, '', parsed.name);
    if (!employee) continue;

    var period = buildPayrollPeriod_(parsed.month, parsed.year);
    var summary = calculatePayrollAttendanceSummary_(spreadsheet, employee, period);
    var salary = calculatePayrollSalaryTotals_(employee, summary);

    if (Number(salary.netSalary || 0) <= 0) continue;

    writePayrollLog_(spreadsheet, employee, period, summary, salary, file, {
      actor: 'restore',
      timestamp: file.getDateCreated ? file.getDateCreated() : new Date()
    });
    known['id:' + file.getId()] = true;
    known['file:' + file.getName()] = true;
    restored += 1;
  }

  return restored;
}

function parsePayrollSlipFileName_(fileName) {
  var match = String(fileName || '').match(/^Slip_Gaji_(.+)_(\d{4})-(\d{2})\.pdf$/i);

  if (!match) return null;

  return {
    name: match[1].replace(/_/g, ' '),
    year: match[2],
    month: match[3]
  };
}

function extractDriveFileId_(value) {
  var text = String(value || '').trim();
  var match = text.match(/\/d\/([a-zA-Z0-9_-]+)/) || text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : '';
}

function getPayloadAttendanceDate_(payload, timestamp) {
  return sanitizeAbsensiDateKey_(payload.tanggal_absen || payload.tanggalAbsen || payload.date || payload.tanggal) || getJakartaDateKey_(timestamp);
}

function getPayloadAttendanceTime_(payload, status, timestamp) {
  var typedTime = status == 'PULANG'
    ? payload.waktu_pulang || payload.jam_pulang || payload.jamPulang
    : status == 'LEMBUR'
    ? payload.waktu_lembur || payload.jam_lembur || payload.jamLembur
    : payload.waktu_datang || payload.jam_datang || payload.jamDatang;
  return sanitizeAbsensiTime_(typedTime || payload.jam_absen || payload.jamAbsen || payload.time || payload.waktu) || Utilities.formatDate(timestamp, ABSENSI_TIMEZONE, 'HH:mm');
}

function writeAttendanceDateTime_(sheet, columns, rowNumber, dateKey, timeText) {
  if (columns.dateKey >= 0) {
    sheet.getRange(rowNumber, columns.dateKey + 1).setValue(dateKey || '');
  }

  if (columns.timeText >= 0) {
    sheet.getRange(rowNumber, columns.timeText + 1).setValue(timeText || '');
  }
}

function sanitizeAbsensiDateKey_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, ABSENSI_TIMEZONE, 'yyyy-MM-dd');
  }

  var text = String(value || '').trim();
  var iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return iso[1] + '-' + ('0' + iso[2]).slice(-2) + '-' + ('0' + iso[3]).slice(-2);

  // Baris lama dari Google Form menggunakan dd/MM/yyyy HH:mm:ss.
  var indonesia = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (indonesia) return indonesia[3] + '-' + ('0' + indonesia[2]).slice(-2) + '-' + ('0' + indonesia[1]).slice(-2);

  return '';
}

function sanitizeAbsensiTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, ABSENSI_TIMEZONE, 'HH:mm');
  }

  var match = String(value || '').trim().match(/^(\d{1,2})[:.](\d{2})$/);

  if (!match) return '';

  var hour = Number(match[1]);
  var minute = Number(match[2]);

  if (!isFinite(hour) || !isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return '';
  }

  return String(hour).replace(/^(\d)$/, '0$1') + ':' + String(minute).replace(/^(\d)$/, '0$1');
}

function buildJakartaTimestamp_(dateKey, timeText) {
  var dateMatch = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  var timeMatch = String(timeText || '').match(/^(\d{1,2})[:.](\d{2})$/);
  var now = new Date();

  if (!dateMatch || !timeMatch) return now;

  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    Number(timeMatch[1]),
    Number(timeMatch[2]),
    0
  );
}

function getAbsensiColumns_(headers) {
  return {
    timestamp: fallbackHeaderIndex_(headers, ['timestamp', 'tanggal', 'waktu'], 0),
    name: fallbackHeaderIndex_(headers, ['namakaryawan', 'nama', 'karyawan', 'pegawai'], 1),
    status: fallbackHeaderIndex_(headers, ['statuskehadiran', 'status', 'jenisabsen', 'absen'], 2),
    shift: fallbackHeaderIndex_(headers, ['shift'], 3),
    photo: fallbackHeaderIndex_(headers, ['fotoabsensi', 'foto', 'photo'], 4),
    fileId: fallbackHeaderIndex_(headers, ['fileid', 'idfile'], 5),
    latitude: fallbackHeaderIndex_(headers, ['latitude', 'lat'], 6),
    longitude: fallbackHeaderIndex_(headers, ['longitude', 'lon', 'lng'], 7),
    gpsAccuracy: fallbackHeaderIndex_(headers, ['gpsaccuracy', 'accuracy'], 8),
    gpsDistance: fallbackHeaderIndex_(headers, ['gpsdistance', 'distance'], 9),
    warning: fallbackHeaderIndex_(headers, ['attendancewarning', 'warning', 'peringatan'], 10),
    warningFlag: fallbackHeaderIndex_(headers, ['attendanceflag', 'flag', 'statusperingatan'], 11),
    updatedAt: fallbackHeaderIndex_(headers, ['updatedat', 'updated'], 12),
    updatedBy: fallbackHeaderIndex_(headers, ['updatedby', 'editor'], 13),
    dateKey: fallbackHeaderIndex_(headers, ['tanggalabsen', 'tanggalkehadiran', 'tanggal'], 14),
    timeText: fallbackHeaderIndex_(headers, ['jamabsen', 'jamkehadiran', 'jam'], 15)
  };
}

function fallbackHeaderIndex_(headers, keys, fallback) {
  var index = findHeaderIndex_(headers, keys);
  return index >= 0 ? index : fallback;
}

function isAbsensiAdmin_(params) {
  var role = normalizeAbsensiKey_(params.role || '');
  var username = normalizeAbsensiKey_(params.username || params.actor || params.nama || '');
  return role == 'owner' || role == 'admin' || role == 'administrator' || username == 'owner' || username == 'admin';
}

function jsonAbsensi_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getShiftLabel_(date) {
  var hour = Number(Utilities.formatDate(date, ABSENSI_TIMEZONE, 'H'));
  return hour < 12 ? 'SHIFT PAGI' : 'SHIFT SORE';
}

function normalizeAbsensiShift_(value) {
  return /sore/i.test(String(value || '')) ? 'SHIFT SORE' : 'SHIFT PAGI';
}

function getJakartaDateKey_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, ABSENSI_TIMEZONE, 'yyyy-MM-dd');
  }

  var text = String(value || '').trim();
  var match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);

  if (match) {
    return [
      match[3],
      ('0' + match[2]).slice(-2),
      ('0' + match[1]).slice(-2)
    ].join('-');
  }

  var parsed = new Date(text);

  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, ABSENSI_TIMEZONE, 'yyyy-MM-dd');
  }

  return '';
}

function normalizeAbsensiStatus_(value) {
  var text = String(value || '').trim().toUpperCase();

  if (/LEMBUR|OVERTIME/.test(text)) {
    return 'LEMBUR';
  }

  if (/PULANG|KELUAR|OUT/.test(text)) {
    return 'PULANG';
  }

  return 'DATANG';
}

function normalizeDisplayName_(value) {
  return String(value || '').trim().replace(/_/g, ' ');
}

function normalizeAbsensiKey_(value) {
  return normalizeDisplayName_(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeAbsensiHeader_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function findHeaderIndex_(headers, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    var key = normalizeAbsensiHeader_(keys[i]);
    var index = headers.indexOf(key);

    if (index >= 0) return index;
  }

  return -1;
}

function sanitizeAbsensiFileName_(value) {
  return String(value || 'karyawan')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_');
}
