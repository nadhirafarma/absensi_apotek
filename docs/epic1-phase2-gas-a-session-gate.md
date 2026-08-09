# Epic 1 Fase 2: Gerbang Session GAS A

**Status:** ~~Ready to implement~~ — **STALE.** Source dan `docs/prd/epics.md` mencatat implementasi Fase B sudah deployed 2026-07-27 (GAS A @120). Dokumen ini disimpan sebagai catatan desain historis; jangan dijadikan dasar status proyek terkini.
**Tanggal:** 2026-07-26
**Target:** `google-apps-script-api-search-box-final.gs`

## Ringkasan

Setelah frontend live (Epic 1 fase 1), semua request ke GAS A sudah membawa `sessionToken`, `username`, `email`, `role`. Sekarang saatnya menutup endpoint `handleUnlockedPostAction_` yang terbuka tanpa validasi.

## Implementasi

### 1. Tambah fungsi validasi session (setelah baris ~280, dekat `getAuthSessionSheet_`)

```javascript
function validatePharmacySession_(payload) {
  var token = String(payload.sessionToken || payload.token || '').trim();
  if (!token) return { ok: false, message: 'Sesi login tidak tersedia. Silakan masuk ulang.' };

  var sheet = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID).getSheetByName(AUTH_SESSION_SHEET_NAME);
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
      .map(function(s) { return String(s || '').trim().toLowerCase(); })
      .filter(Boolean);
    var allowed = [session.username, session.email, session.name]
      .map(function(s) { return String(s || '').trim().toLowerCase(); })
      .filter(Boolean);

    if (submitted.some(function(key) { return allowed.indexOf(key) < 0; })) {
      return { ok: false, message: 'Identitas tidak sesuai dengan sesi login.' };
    }
    return session;
  }

  return { ok: false, message: 'Sesi login tidak valid. Silakan masuk ulang.' };
}

function applyPharmacySession_(payload, session) {
  payload.username = session.username || '';
  payload.email = session.email || '';
  payload.role = session.role || '';
  payload.actor = session.username || session.email || session.name || '';
}
```

### 2. Modifikasi `handleUnlockedPostAction_` (baris ~451)

```javascript
function handleUnlockedPostAction_(action, data) {
  // Tetap public — tidak butuh session
  if (action == 'getDataObatFilter') {
    return handleGetDataObatFilter_();
  }
  if (action == 'getPharmacyProfile') {
    return handleGetPharmacyProfile_();
  }
  if (action == 'getAttendanceShiftSettings') {
    return handleGetAttendanceShiftSettings_();
  }

  // Wajib session — read sensitif
  var sessionActions = ['listActivityLog', 'listLoginUsers', 'listRestockRequests', 'listPurchaseOrders', 'listLocalRecords'];
  if (sessionActions.indexOf(action) >= 0) {
    var session = validatePharmacySession_(data);
    if (!session.ok) {
      return jsonOutput_({ success: false, ok: false, message: session.message });
    }
    applyPharmacySession_(data, session);
  }

  if (action == 'listActivityLog') {
    return handleListActivityLog_(data);
  }
  if (action == 'listRestockRequests') {
    return handleListRestockRequests_(data);
  }
  if (action == 'listPurchaseOrders') {
    return handleListPurchaseOrders_(data);
  }
  if (action == 'listLocalRecords') {
    return handleListLocalRecords_(data);
  }
  if (action == 'listLoginUsers') {
    var ss = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID);
    return handleListLoginUsers_(readUserRows_(ss.getSheetByName(USER_SHEET_NAME) || ss.insertSheet(USER_SHEET_NAME)));
  }

  return null;
}
```

### 3. Modifikasi `doGet` untuk `listLoginUsers` (baris ~163)

```javascript
if (String(e.parameter.action || '').trim() == 'listLoginUsers') {
  var session = validatePharmacySession_(e.parameter);
  if (!session.ok) {
    return jsonOutput_({ success: false, ok: false, message: session.message });
  }
  var loginSheet = SpreadsheetApp.openById(DATA_OBAT_SPREADSHEET_ID).getSheetByName(USER_SHEET_NAME);
  if (!loginSheet) {
    return jsonOutput_({ success: false, ok: false, message: 'Sheet user tidak ditemukan' });
  }
  return handleListLoginUsers_(readUserRows_(loginSheet));
}
```

## Deployment steps

1. Backup GAS A live (copy-paste source ke file `.gs.bak`)
2. Deploy kode baru ke GAS A
3. Smoke test: coba akses `listLoginUsers` tanpa token → harus ditolak
4. Smoke test: akses `getPharmacyProfile` tanpa token → masih OK (public)
5. Smoke test: akses dengan token valid → semua jalan

## Rollback plan

Jika ada masalah, revert ke backup GAS A sebelumnya. Frontend sudah mengirim token, jadi rollback backend tidak akan merusak frontend.