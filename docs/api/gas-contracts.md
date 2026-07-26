# Kontrak API GAS — Indo Apotek

Status: draft current-state (BMM `bmad-document-project`, deep scan, 2026-07-26)
Sumber terverifikasi: `google-apps-script-api-search-box-final.gs`, `google-apps-script-absensi-api.gs`, `google-apps-script-import-data-obat.gs`, `tools/gas-script-1/Kode.js`, `assets/*.js`
Bahasa output: Indonesia. Setiap entri di bawah dilacak ke nomor baris kode yang dibaca.

> Catatan validasi: kontrak ini dibaca dari source repo. URL deployment aktif dan schema sheet **harus divalidasi ulang** terhadap Apps Script live + Google Sheets sebelum dijadikan acuan final. Bagian yang belum diverifikasi ditandai `⚠ perlu validasi`.
>
> **Log validasi 2026-07-27:** (1) mirror GAS B root ↔ `tools/gas-script-1/Kode.js` byte-identik (sha256 `7f0bd9f…`); (2) mirror GAS A root ↔ `tools/gas-a/Kode.js` byte-identik (sha256 `ae52804…`); (3) sitasi nomor baris di-refresh terhadap source pasca Epic 1 fase 2 & Epic 2; (4) frontend live `https://indoapotek.my.id` HTTP 200 (Pages branch `main`).

---

## 1. Endpoint & transport

| Part | Konstanta frontend | URL deployment (dari source) |
|---|---|---|
| GAS A `dataObatAuth` | `AUTH_API_URL` / `API_BASE` / `DEFAULT_API_URL` | `.../AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec` |
| GAS B `attendanceAndPayroll` | `ABSENSI_API_URL` | `.../AKfycbx7fkoLgH6igHP17przjmxWaP8bQNG_6OcoQ3-Ug79A_vmZxK6_ibCdLC0u-W-JLtw3/exec` |

- Transport: HTTPS `fetch` dari browser (bukan `google.script.run`).
- Body POST: JSON `{ action, ...payload }` (lihat `assets/home-dashboard.js` `postToApi`).
- **Epic 1 fase 1 (frontend, non-breaking):** `postToApi` di `assets/home-dashboard.js` otomatis menempelkan `sessionToken`, `username`, `email`, `role` dari `sessionStorage` ke setiap payload GAS A. Field eksplisit di payload pemanggil tetap menang (spread di akhir). GAS A saat ini mengabaikan field ini pada aksi unlocked, jadi perilaku runtime tidak berubah.
- `assets/attendance.js` juga mengirim identitas sesi yang sama pada `getPharmacyProfile` dan `getAttendanceShiftSettings`.
- Sebagian besar list/read menggunakan `cache: "no-store"`.
- Beberapa aksi dikirim via GET query string (`action=...`), mis. `listLoginUsers`, `listAttendanceRecords` (ESS), `import_data_obat` fallback.


## 2. Format response (TIDAK identik antar backend)

- **GAS A**: umumnya `{ success: boolean, ok: boolean, message?, data?, ... }`. GET data obat menambah `sheet`, `total`, `updatedAt`, `uploadedAt`, `data`. (`google-apps-script-api-search-box-final.gs` doGet `:154-230`, fallback `:493`)
- **GAS B**: umumnya `{ ok: boolean, success?: boolean, message?, ... }`. Selalu `ContentService` JSON. (`google-apps-script-absensi-api.gs:2223-2225`)

> Inkonsistensi `ok` vs `success` adalah risiko kontrak nyata → kandidat epic standardisasi.

## 3. GAS A — dataObatAuth

### 3.1 doGet (`:154-230`)
| Query | Fungsi | Auth |
|---|---|---|
| `page=reset` | render halaman reset password | publik |
| `action=listLoginUsers` | daftar user login | ⚠ terbuka via GET |
| `sheet=<nama>` | baca sheet generik sebagai objek | `sheet=user` diblokir (`:186`) |
| `sheet=data_obat` | data obat + metadata upload | publik-read |

### 3.2 doPost — action dikenal (`:338-497`)
Data obat & filter: `import_data_obat`, `getDataObatFilter`, `saveDataObatFilter`, `add_data_obat`, `update_data_obat`, `delete_data_obat`.
Log: `saveActivityLog`, `listActivityLog`, `deleteActivityLog`.
Shift & profil: `getAttendanceShiftSettings`, `saveAttendanceShiftSettings`, `getPharmacyProfile`, `savePharmacyProfile`.
Restok & PO: `listRestockRequests`, `saveRestockRequests`, `clearRestockRequests`, `listPurchaseOrders`, `savePurchaseOrders`.
Data lokal: `listLocalRecords`, `saveLocalRecord`, `deleteLocalRecord`.
Auth & user: `login`, `listLoginUsers`, `saveLoginUser`/`updateLoginUser`, `deleteLoginUser`, `resetPassword`, `saveResetPassword`/`updatePassword`/`confirmResetPassword`/`savePassword`/`setPassword`.
Fallback: `{ success:false, ok:false, message:'Action tidak ditemukan' }` (`:493`).

### 3.3 Aksi early-path (`handleUnlockedPostAction_`)
Dijalankan sebelum `LockService`. **Epic 1 fase 2 (kode repo, 2026-07-26):**

| Kelas | Action | Auth |
|---|---|---|
| Public read | `getDataObatFilter`, `getPharmacyProfile`, `getAttendanceShiftSettings` | tanpa session |
| Sensitive read | `listActivityLog`, `listLoginUsers`, `listRestockRequests`, `listPurchaseOrders`, `listLocalRecords` | wajib `validatePharmacySession_` |

`doGet action=listLoginUsers` juga melewati `validatePharmacySession_`.

Validasi: lookup token di sheet `auth_sessions` (spreadsheet data obat), cek `expiresAt`, cocokkan `username`/`email` payload vs session, lalu `applyPharmacySession_` menimpa identitas dari session.

> **Deploy status (2026-07-27): AKTIF di production.** Terverifikasi via `tools/smoke_gas_a.js` terhadap deployment live `AKfycbzk3yq…`: aksi public read lolos tanpa token; `listLoginUsers` (POST & GET) dan `listActivityLog` tanpa token **ditolak** dengan pesan "Sesi login tidak tersedia. Silakan masuk ulang."



### 3.4 Session server-side
- `login` → `createAuthSession_` menulis ke sheet `auth_sessions` (token, username, email, name, role, status, expiresAt=+12 jam). (`:255`)
- `logout`/event via `syncAuthSession_` menghapus token. (`:232`)

## 4. GAS A — import (`google-apps-script-import-data-obat.gs`)
- `doPost` action `import_data_obat` (`:13-27`); action lain → `{ error:'Action tidak dikenal.' }`.
- Endpoint pola `.../exec?sheet=data_obat&action=import_data_obat` (`:7`).

## 5. GAS B — attendanceAndPayroll

### 5.1 Gerbang session WAJIB
Semua `doGet`/`doPost` memanggil `validateAbsensiSession_(payload)` sebelum aksi apa pun (`:91-92`, `:147-148`).
`validateAbsensiSession_` (`:278-309`):
- Butuh `sessionToken`/`token`.
- Lookup token di `auth_sessions` (spreadsheet A), tolak jika `expiresAt <= now`.
- Cocokkan `username`/`email` payload dengan session; mismatch → ditolak.
`applyAbsensiSession_` menimpa `role/username/actor` dari session, bukan dari input klien (`:311-316`).

### 5.2 doGet actions (`:97-131`)
`listAttendanceRecords`, `listPayrollEmployees`, `generateSalarySlip`, `listSalarySlipHistory`; default = cek absensi hari ini untuk `session.name`.

### 5.3 doPost actions (`:154-196`)
`listAttendanceRecords`, `updateAttendanceRecord`, `listPayrollEmployees`, `savePayrollEmployee`, `deletePayrollEmployee`, `generateSalarySlip`, `listSalarySlipHistory`, `deleteSalarySlipHistory`, `deleteAllSalarySlipHistory`; tanpa action = submit absensi (DATANG/PULANG/LEMBUR).

### 5.4 Gerbang admin (`isAbsensiAdmin_` `:2216-2220`)
`role ∈ {owner, admin, administrator}` ATAU `username ∈ {owner, admin}`.
Wajib admin: `updateAttendanceRecord` (`:753`), `listPayrollEmployees` (`:813`), `savePayrollEmployee` (`:834`), `deletePayrollEmployee` (`:878`), `generateSalarySlip` (`:915`), `deleteSalarySlipHistory` (`:1098`), `deleteAllSalarySlipHistory` (`:1147`).
`listSalarySlipHistory`: admin lihat semua; non-admin difilter identitas (`:994`, `:1016`, `:1042`).
`listAttendanceRecords` multi-sheet: cek admin di `:612` (non-admin difilter identitas sendiri).

### 5.5 Validasi submit absensi (`:198-260`, `validateAbsensiSubmission_` `:318`)
- Karyawan nonaktif ditolak (`:209-215`).
- Anti-duplikat DATANG/PULANG/LEMBUR harian (`:217-227`).
- Batasan foto ≤3MB, drift timestamp ≤10 menit, akurasi GPS ≤200m, toleransi radius 160m (`:24-27`).
- Foto base64 → Drive `Foto_Absensi`.

## 6. Sumber-of-truth GAS B
- **Canonical deploy source:** `tools/gas-script-1/Kode.js` (clasp; scriptId `1_WgOmzhpGLCNyx1Oucl_a8to1vUXgtdzh_bplbCP7ruFUdk9dNA6qkL_`).
- **Mirror referensi di git:** `google-apps-script-absensi-api.gs` (root) — disalin dari clasp, bukan diedit langsung.
- **Epic 2 (2026-07-26):** root disinkron ulang ke clasp (hash identik, 2307 baris). Termasuk `handleListAttendanceRecords_` multi-sheet + `getAbsensiRecordSheets_`.
- Setelah edit clasp: salin ke root mirror sebelum commit (lihat `docs/ops/deploy-sop.md`).


## 7. Ringkasan verifikasi
- Diverifikasi dari source: daftar action, gerbang admin/session, format response, batas validasi absensi.
- `⚠ perlu validasi` live: URL deployment aktif, schema kolom sheet, keterbukaan read endpoint GAS A di produksi, kesetaraan mirror GAS B.
