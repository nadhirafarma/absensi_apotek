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

> Inkonsistensi `ok` vs `success` adalah risiko kontrak nyata → standar target + rencana migrasi ditetapkan di **§8** (docs-first 2026-07-27).

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

Validasi: lookup token di sheet `auth_sessions` (spreadsheet data obat), cek `expiresAt`, lalu `applyPharmacySession_` menimpa identitas dari session. **(2026-07-27)** Pencocokan `username`/`email` payload vs session **dihapus** — identitas selalu server-authoritative dari `sessionToken`; cek lama memicu tolakan palsu ("Identitas tidak sesuai dengan sesi login") saat identitas di browser drift setelah edit profil, karena `saveLoginUser` tidak menyegarkan baris sesi. Kini `handleSaveLoginUser_` juga memanggil `refreshAuthSessionAfterSave_` untuk menyegarkan **kolom identitas** (username/email/name — role/status/expiresAt tidak disentuh) pada baris `auth_sessions` milik token, hanya bila `originalUsername`/`originalEmail` user yang disimpan cocok dengan username/email pemilik baris sesi.

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
`validateAbsensiSession_` (`:278-303`):
- Butuh `sessionToken`/`token`.
- Lookup token di `auth_sessions` (spreadsheet A), tolak jika `expiresAt <= now`.
- **(2026-07-27)** Pencocokan `username`/`email` payload vs session **dihapus** — identitas selalu server-authoritative dari `sessionToken`. Cek lama menolak palsu ("Identitas absensi tidak sesuai dengan sesi login") ketika email/nama di sessionStorage drift setelah edit profil (bug edit catatan kehadiran). Frontend kini juga tidak lagi mengirim `username`/`email` ke GAS B.
`applyAbsensiSession_` menimpa `role/username/actor` dari session, bukan dari input klien.

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
- Terverifikasi live 2026-07-27: URL deployment aktif, keterbukaan read GAS A di produksi (public OK, sensitive rejected), kesetaraan mirror GAS A & B (hash identik).
- `⚠ perlu validasi` tersisa: schema kolom Google Sheets live.

## 8. Standar envelope response — target Epic 1 (docs-first, 2026-07-27)

Status: **Fase A (kontrak target) — ditetapkan.** Implementasi bertahap Fase B–D di bawah.
Dasar: survei menyeluruh 3 sisi (response GAS A, response GAS B, konsumen frontend) 2026-07-27; klaim baris kunci di-spot-check terhadap source.

### 8.1 Envelope standar (target)

Semua response HTTP JSON dari GAS A & GAS B wajib berbentuk objek envelope:

```jsonc
{
  "ok": true,          // KANONIK — kunci keputusan sukses/gagal (boolean asli)
  "success": true,     // alias transisi, nilai SELALU === ok (dihapus di Fase D)
  "message": "...",    // kanal pesan utama; WAJIB terisi saat ok=false
  "error": "...",      // alias legacy khusus catch block; jangan diandalkan klien
  // ...payload domain: data / records / users / history / total / dst.
}
```

Aturan tambahan:
- Boolean asli, bukan string (saat ini sudah dipatuhi — survei: 0 boolean string).
- Tidak boleh array mentah tanpa envelope.
- Error path aksi list menyertakan payload utama kosong (mis. `records: []`) agar
  iterasi klien tidak crash — saat ini hanya `listPayrollEmployees` yang melakukannya.

**Kenapa `ok` kanonik:** hadir di 100% response backend (GAS A 63/63 envelope +
import 3/3; GAS B 35/35), dipakai sebagai kunci keputusan internal kedua backend
(`if (!session.ok)`), dan `slip-gaji-bulanan.gs` memakai `ok` eksklusif (30 titik,
0 `success`). `success` dipertahankan sebagai alias transisi karena 8 titik
frontend paling kritis saat ini success-only (lihat 8.2).

### 8.2 Divergensi current-state (temuan survei — target perbaikan)

| # | Lokasi | Masalah |
|---|---|---|
| 1 | GAS B `:116` (status harian), `:218` (sudah absen), `:252` (simpan absensi) | response sukses inti absensi **tanpa `success`** — frontend pola success-only menganggap gagal |
| 2 | GAS B catch `:133`, `:269` | `{ ok:false, error }` — tanpa `success`, tanpa `message` |
| 3 | GAS A `:221` | GET `sheet=<nama>` generik mengembalikan **array mentah** tanpa envelope |
| 4 | `google-apps-script-import-data-obat.gs` `:26`, `:31`, `:88` | hanya `{ ok, error/... }` — 0 `success`, 0 `message`; bentuk `import_data_obat` beda dari file utama (`:2488-2498`); definisi `doPost`/`jsonOutput_` bertabrakan bila satu project dengan file utama |
| 5 | Frontend success-only: `assets/login.js`, `assets/home-dashboard.js` (7 titik) | ✅ **FIXED Fase C 2026-07-27** — helper lokal `isApiOk()` per IIFE |
| 5b | Halaman reset live: `buildResetPasswordHtml_` (`google-apps-script-api-search-box-final.gs:2955` + mirror `tools/gas-a/Kode.js:2955`) cek `result.success` saja | **Digeser ke Fase B** — halaman reset dirender inline oleh GAS A (HtmlService), butuh deploy GAS A. Catatan: `reset.html` root & `tools/gas-a/reset.html` hanyalah **arsip**, tidak diserve |
| 6 | Frontend ok-only: `assets/search-obat.js:620` | **Dead code** — file tidak dimuat halaman mana pun (`cari-obat.html` = redirect ke SPA); tidak diubah, kandidat cleanup terpisah |
| 7 | Helper fetch tanpa cek HTTP `response.ok`: `postToApi`, `postToAbsensiApi`, `getAbsensiRecords` (home-dashboard.js), `ess.js` load | ✅ **FIXED Fase C 2026-07-27** — `if (!response.ok) throw` sebelum parse body |
| 8 | `assets/attendance.js` submit: body non-JSON ber-HTTP-200 disintesis jadi `{ok:true}` | ✅ **FIXED Fase C 2026-07-27** — non-JSON kini error eksplisit; cek negatif diganti positif `isApiOk(result)` (body kosong `{}` kini = gagal, bukan sukses senyap) |

Frontend saat ini: 32 titik fallback ganda (`success`/`ok`), 8 success-only, 1 ok-only —
`success` dibaca di 40/41 titik cek body, `ok` di 33/41.

### 8.3 Rencana migrasi non-breaking (fase)

- **Fase A — docs (SELESAI 2026-07-27):** kontrak target ini.
- **Fase B — backend (SELESAI & DEPLOYED 2026-07-27 — GAS B @65, GAS A @120, URL tetap):**
  1. ✅ GAS B `jsonAbsensi_`: normalisasi sebelum `JSON.stringify` (success=ok bila
     absen, message fallback dari error) → memperbaiki divergensi #1 & #2 tanpa
     menyentuh 35 call site. Kode di `tools/gas-script-1/Kode.js` + mirror root.
  2. ✅ GAS A GET sheet generik: dibungkus envelope `{ success, ok, sheet, total, data }`
     — **terverifikasi tidak ada konsumen frontend** untuk GET `?sheet=` non-data_obat
     (grep seluruh assets/*.js: 0 hit), jadi aman tanpa koordinasi.
  3. ✅ GAS A halaman reset (`buildResetPasswordHtml_`): cek `success` → dual
     `success||ok` (residu Fase C).
  4. ✅ File `import-data-obat.gs`: envelope disamakan (success+message ditambahkan).
     Status: **legacy/orphan** — frontend hanya mereferensikan 2 URL deployment utama;
     import live dilayani GAS A utama (`import_data_obat`). Tidak perlu deploy terpisah.
  - **Deploy (2026-07-27):** `clasp push` + `create-version` + `update-deployment`
    ke ID live yang sama. Verifikasi pasca-deploy: smoke GAS A utuh (3 public OK,
    3 sensitive rejected); GET `?sheet=` kini ber-envelope `{success, ok, sheet,
    total, data}` (live-verified); gerbang GAS B utuh. Rollback: `-V 63` (GAS B) /
    `-V 119` (GAS A).
- **Fase C — frontend (SELESAI 2026-07-27):** helper `isApiOk(res)` =
  `!!res && (res.ok === true || res.success === true)` didefinisikan **lokal per IIFE**
  (`login.js`, `home-dashboard.js`, `ess.js`, `attendance.js` — tidak ada mekanisme
  modul/ekspor global di codebase); 7 titik success-only diganti; cek HTTP
  `response.ok` ditambahkan di `postToApi`/`postToAbsensiApi`/`getAbsensiRecords`/
  `ess.js`; sintesis sukses `attendance.js` dihapus (non-JSON & body kosong = error).
  **Residu digeser ke Fase B:** halaman reset (`buildResetPasswordHtml_` `:2955`).
  `search-obat.js` tidak disentuh (dead code).
- **Fase D — cleanup (opsional, setelah C stabil + regression lulus):** hapus
  alias `success` dari backend; `ok` jadi satu-satunya kunci.

Verifikasi tiap fase: `node tools/smoke_gas_a.js` + item regression checklist
terkait (login, absensi, data obat, payroll). Jangan gabungkan Fase B dan C
dalam satu deploy kecuali item #2 (perubahan bentuk `:221`).
