/*
  Tambahkan fungsi ini ke project Google Apps Script API data_obat.
  Tujuannya agar website bisa mengupload Excel/CSV yang sudah diparse
  menjadi JSON, lalu mengganti atau menambah isi sheet data_obat.

  Endpoint yang dipakai frontend:
  POST .../exec?sheet=data_obat&action=import_data_obat
*/

var DATA_OBAT_SPREADSHEET_ID = '1jdtxpAZ-G545QfvbktjAihy2xXJeD8GbUFUx7W1TPdk';
var DATA_OBAT_DEFAULT_SHEET_NAME = 'data_obat';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    var action = String(payload.action || e.parameter.action || '').trim();

    if (action === 'import_data_obat') {
      return handleImportDataObat_(payload);
    }

    return jsonOutput_({
      ok: false,
      error: 'Action tidak dikenal.'
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      error: error.message
    });
  } finally {
    lock.releaseLock();
  }
}

function handleImportDataObat_(payload) {
  var sheetName = String(payload.sheet || DATA_OBAT_DEFAULT_SHEET_NAME).trim();
  var mode = String(payload.mode || 'replace').trim();
  var headers = (payload.headers || []).map(function(header) {
    return String(header || '').trim();
  }).filter(Boolean);
  var rows = payload.rows || [];

  if (!rows.length) {
    throw new Error('Data import kosong.');
  }

  var ss = openDataObatSpreadsheet_();
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
      return row[key] == null ? '' : row[key];
    });
  });

  if (mode === 'append' && sheet.getLastRow() > 0) {
    var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var existingKeys = existingHeaders.map(normalizeHeaderKey_);
    var appendValues = rows.map(function(row) {
      return existingKeys.map(function(key) {
        return row[key] == null ? '' : row[key];
      });
    });

    sheet.getRange(sheet.getLastRow() + 1, 1, appendValues.length, existingHeaders.length).setValues(appendValues);
  } else {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }

  SpreadsheetApp.flush();

  return jsonOutput_({
    ok: true,
    spreadsheetId: ss.getId(),
    sheet: sheetName,
    mode: mode,
    total: rows.length,
    lastRow: sheet.getLastRow(),
    updatedAt: new Date().toISOString()
  });
}

function testImportDataObatTarget() {
  var ss = openDataObatSpreadsheet_();
  var sheet = ss.getSheetByName(DATA_OBAT_DEFAULT_SHEET_NAME);

  return {
    ok: true,
    spreadsheetId: ss.getId(),
    sheet: DATA_OBAT_DEFAULT_SHEET_NAME,
    lastRow: sheet ? sheet.getLastRow() : 0,
    url: ss.getUrl()
  };
}

function openDataObatSpreadsheet_() {
  var spreadsheetId = String(PropertiesService.getScriptProperties().getProperty('DATA_OBAT_SPREADSHEET_ID') || DATA_OBAT_SPREADSHEET_ID || '').trim();

  if (!spreadsheetId) {
    throw new Error('DATA_OBAT_SPREADSHEET_ID belum diisi.');
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function normalizeHeaderKey_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function jsonOutput_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
