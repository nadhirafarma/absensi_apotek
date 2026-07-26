# Kontrak API GAS — Indo Apotek

Status: draft current-state (BMM `bmad-document-project`, deep scan, 2026-07-26)
Sumber terverifikasi: `google-apps-script-api-search-box-final.gs`, `google-apps-script-absensi-api.gs`, `google-apps-script-import-data-obat.gs`, `tools/gas-script-1/Kode.js`, `assets/*.js`
Bahasa output: Indonesia. Setiap entri di bawah dilacak ke nomor baris kode yang dibaca.

> Catatan validasi: kontrak ini dibaca dari source repo. URL deployment aktif dan schema sheet **harus divalidasi ulang** terhadap Apps Script live + Google Sheets sebelum dijadikan acuan final. Bagian yang belum diverifikasi ditandai `⚠ perlu validasi`.

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

- **GAS A**: umumnya `{ success: boolean, ok: boolean, message?, data?, ... }`. GET data obat menambah `sheet`, `total`, `updatedAt`, `uploadedAt`, `data`. (`google-apps-script-api-search-box-final.gs:180-212`, `:434-438`)
- **GAS B**: umumnya `{ ok: boolean, success?: boolean, message?, ... }`. Selalu `ContentService` JSON. (`google-apps-script-absensi-api.gs:2177-2181`)

> Inkonsistensi `ok` vs `success` adalah risiko kontrak nyata → kandidat epic standardisasi.

## 3. GAS A — dataObatAuth

### 3.1 doGet (`:154-221`)
| Query | Fungsi | Auth |
|---|---|---|
| `page=reset` | render halaman reset password | publik |
| `action=listLoginUsers` | daftar user login | ⚠ terbuka via GET |
| `sheet=<nama>` | baca sheet generik sebagai objek | `sheet=user` diblokir (`:179-185`) |
| `sheet=data_obat` | data obat + metadata upload | publik-read |

### 3.2 doPost — action dikenal (`:282-438`)
Data obat & filter: `import_data_obat`, `getDataObatFilter`, `saveDataObatFilter`, `add_data_obat`, `update_data_obat`, `delete_data_obat`.
Log: `saveActivityLog`, `listActivityLog`, `deleteActivityLog`.
Shift & profil: `getAttendanceShiftSettings`, `saveAttendanceShiftSettings`, `getPharmacyProfile`, `savePharmacyProfile`.
Restok & PO: `listRestockRequests`, `saveRestockRequests`, `clearRestockRequests`, `listPurchaseOrders`, `savePurchaseOrders`.
Data lokal: `listLocalRecords`, `saveLocalRecord`, `deleteLocalRecord`.
Auth & user: `login`, `listLoginUsers`, `saveLoginUser`/`updateLoginUser`, `deleteLoginUser`, `resetPassword`, `saveResetPassword`/`updatePassword`/`confirmResetPassword`/`savePassword`/`setPassword`.
Fallback: `{ success:false, ok:false, message:'Action tidak ditemukan' }` (`:434-438`).

### 3.3 Aksi tanpa lock / terbuka (`handleUnlockedPostAction_` `:451-486`)
`getDataObatFilter`, `listActivityLog`, `getAttendanceShiftSettings`, `getPharmacyProfile`, `listRestockRequests`, `listPurchaseOrders`, `listLocalRecords`, `listLoginUsers` — dijalankan **sebelum** `LockService` dan **tanpa cek role/session**.

> ⚠ Risiko keamanan: read endpoint sensitif (daftar user, profil apotek) dapat dipanggil tanpa autentikasi.
>
> **Status Epic 1:**
> - Fase 1 (selesai, non-breaking): frontend sudah mengirim `sessionToken`/identitas pada pemanggil utama GAS A (`postToApi`, `attendance.js` profile/shift).
> - Fase 2 (belum): gerbang session di backend GAS A. Harus deploy frontend dulu, verifikasi traffic membawa token, baru tutup endpoint unlocked. Jangan aktifkan gerbang backend sebelum frontend live.


### 3.4 Session server-side
- `login` → `createAuthSession_` menulis ke sheet `auth_sessions` (token, username, email, name, role, status, expiresAt=+12 jam). (`:246-263`)
- `logout`/event via `syncAuthSession_` menghapus token. (`:223-244`)

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

### 5.4 Gerbang admin (`isAbsensiAdmin_` `:2171-2175`)
`role ∈ {owner, admin, administrator}` ATAU `username ∈ {owner, admin}`.
Wajib admin: `updateAttendanceRecord` (`:708`), `listPayrollEmployees` (`:768`), `savePayrollEmployee` (`:789`), `deletePayrollEmployee` (`:833`), `generateSalarySlip` (`:870`), `deleteSalarySlipHistory` (`:1053`), `deleteAllSalarySlipHistory` (`:1102`).
`listSalarySlipHistory`: admin lihat semua; non-admin difilter identitas (`:949`, `:971`, `:997`).

### 5.5 Validasi submit absensi (`:198-260`, `validateAbsensiSubmission_` `:318`)
- Karyawan nonaktif ditolak (`:209-215`).
- Anti-duplikat DATANG/PULANG/LEMBUR harian (`:217-227`).
- Batasan foto ≤3MB, drift timestamp ≤10 menit, akurasi GPS ≤200m, toleransi radius 160m (`:24-27`).
- Foto base64 → Drive `Foto_Absensi`.

## 6. Sumber-of-truth ganda (drift risk)
- GAS B punya **dua mirror**: `google-apps-script-absensi-api.gs` (root) dan `tools/gas-script-1/Kode.js` (clasp aktif). Header action identik pada scan ini, tetapi wajib disinkron manual. `⚠ perlu validasi` bahwa keduanya byte-identik saat deploy.

## 7. Ringkasan verifikasi
- Diverifikasi dari source: daftar action, gerbang admin/session, format response, batas validasi absensi.
- `⚠ perlu validasi` live: URL deployment aktif, schema kolom sheet, keterbukaan read endpoint GAS A di produksi, kesetaraan mirror GAS B.
