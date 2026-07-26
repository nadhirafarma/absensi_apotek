# Arsitektur Frontend → Google Apps Script → Data Store

Status: draft current-state (dibaca dari kode, 2026-07-25)  
Sumber utama: `assets/*`, `tools/gas-script-1/*`, `google-apps-script-*.gs`, `tools/gas-projects.json`

## Ringkasan

Indo Apotek adalah aplikasi web statis (HTML/CSS/JS) yang di-host di GitHub Pages, dengan backend operasional di Google Apps Script (GAS) + Google Sheets + Google Drive.

```text
Browser (GitHub Pages)
  ├─ beranda.html / login.html / absensi.html / index.html + clean routes
  ├─ sessionStorage: nadhira.authSession
  ├─ localStorage: cache data, preferensi, role, restock, PO, dll.
  │
  ├─ GAS A: dataObatAuth
  │    URL: .../AKfycbzk3yq.../exec
  │    Spreadsheet: 1jdtxpAZ-G545QfvbktjAihy2xXJeD8GbUFUx7W1TPdk
  │    Modul: auth, user, data obat, karyawan, supplier, restock, PO, log, profil apotek
  │
  └─ GAS B: attendanceAndPayroll
       URL: .../AKfycbx7fkoL.../exec
       Spreadsheet: 1L_MfAj7UOa9Ngb6VEY6G4PiMBbwOIAu3De_puVYvNw4
       Modul: absensi foto/GPS, monitoring, payroll, slip gaji PDF
       Cross-read: auth_sessions + pharmacy_profile dari spreadsheet A
```

## Lapisan Frontend

| Area | File utama | Fungsi |
|---|---|---|
| Landing | `beranda.html`, `assets/landing.js` | marketing + redirect login |
| Auth UI | `login.html`, `assets/login.js`, `reset.html` | login, remember me, reset password |
| Guard | `assets/auth-guard.js` | cek session; redirect ke landing jika kosong/expired |
| Shell app | `index.html`, clean routes `*/index.html` | SPA multi-view + route folder |
| Dashboard logic | `assets/home-dashboard.js` | menu, role access, data obat, restock, PO, user, role, payroll UI |
| Absensi page | `absensi.html`, `assets/attendance.js` | absen datang/pulang + foto + GPS |
| ESS | `assets/ess.js`, `assets/ess.css` | portal karyawan + monitoring |
| Shared chrome | `assets/app.js`, `assets/styles.css` | profil, logout, jam, sidebar |

### Routing

- Legacy files: `index.html`, `login.html`, `beranda.html`, `absensi.html`
- Clean routes digenerate `tools/generate_clean_routes.js`
- Tiap `route/index.html` = salinan penuh SPA + `<base href="/">` + `data-initial-view`
- View app: dashboard, cari-data-obat, presensi, presensi-karyawan, monitoring-presensi, data-obat, data-karyawan, data-supplier, restok-obat, surat-pesanan, import-data-obat, akun-profil, log-aktivitas, manajemen-pengguna, data-role

## GAS Projects

Didefinisikan di `tools/gas-projects.json` dan `.clasp.json`.

### 1) dataObatAuth

- Source mirror: `google-apps-script-api-search-box-final.gs` (+ import script terpisah)
- Script ID: `1oj9FfGGSv4FNiaK6kPqV_39kg2vESJ4RfUg_FH8mrpnzVhz2u42AiE5M`
- Web app deployment (frontend): `AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu`
- Spreadsheet: `1jdtxpAZ-G545QfvbktjAihy2xXJeD8GbUFUx7W1TPdk`

Sheet/property penting:

| Nama | Fungsi |
|---|---|
| `user` | akun login + role + password |
| `data_obat` | master obat |
| `data_karyawan` | master karyawan lokal (bukan payroll absensi) |
| `data_supplier` | supplier |
| `restock_requests` | permintaan restok |
| `purchase_orders` | surat pesanan |
| `auth_sessions` | token sesi server-side |
| `pharmacy_profile` | identitas apotek + GPS radius |
| Script Properties | filter data obat, shift rules, activity log owner, cache status |

### 2) attendanceAndPayroll

- Source aktif clasp: `tools/gas-script-1/` (`Kode.js`, `slip_gaji_bulanan.js`)
- Source mirror root: `google-apps-script-absensi-api.gs`, `google-apps-script-slip-gaji-bulanan.gs`
- Script ID: `1_WgOmzhpGLCNyx1Oucl_a8to1vUXgtdzh_bplbCP7ruFUdk9dNA6qkL_`
- Web app: `AKfycbx7fkoLgH6igHP17przjmxWaP8bQNG_6OcoQ3-Ug79A_vmZxK6_ibCdLC0u-W-JLtw3`
- Spreadsheet absensi/payroll: `1L_MfAj7UOa9Ngb6VEY6G4PiMBbwOIAu3De_puVYvNw4`
- Cross-auth spreadsheet: `1jdtxpAZ-...` (`auth_sessions`, `pharmacy_profile`)

Sheet/folder penting:

| Nama | Fungsi |
|---|---|
| `Form_Responses` | log absensi utama |
| form response lain | sumber agregasi monitoring |
| `data_karyawan` | data gaji/NIP/status karyawan payroll |
| `Slip_Gaji` | template PDF |
| `log_slip_gaji` | histori slip |
| Drive `Foto_Absensi` | foto absensi |
| Drive `slip_gaji_pdf` | PDF slip gaji |

## Alur data inti

### Login

1. Browser POST `action=login` ke GAS A
2. GAS A validasi sheet `user`
3. Session disimpan ke `auth_sessions` + dikembalikan ke browser
4. Browser simpan `sessionStorage.nadhira.authSession` (berisi token, role, expiresAt)
5. `auth-guard.js` melindungi halaman app

### Absensi

1. Browser cek session + profil apotek/GPS
2. Ambil shift settings dari GAS A
3. Submit absensi ke GAS B (foto + GPS + shift + status DATANG/PULANG)
4. GAS B validasi session token lewat spreadsheet A
5. GAS B tulis baris ke sheet absensi + Drive foto

### Data obat / restock / PO

1. Frontend baca/tulis via GAS A
2. Cache sementara di IndexedDB/localStorage untuk UX offline-ish
3. Sync periodik + force refresh

### Payroll

1. UI admin/owner panggil GAS B
2. Baca `data_karyawan` + ringkas absensi
3. Generate PDF dari template sheet + log ke `log_slip_gaji`

## Batasan arsitektur saat ini

1. **Dua backend GAS** dengan kontrak response yang mirip tapi tidak identik (`ok` vs `success`).
2. **Mirror source ganda**: root `*.gs` vs `tools/gas-script-1/*` bisa drift.
3. **Auth browser-centric**: guard frontend + session sheet; endpoint GET tertentu masih terbuka tanpa lock penuh.
4. **Role matrix frontend-heavy**: `ACCESS_MENUS` / `ROLE_ACCESS` di `home-dashboard.js`; backend absensi hanya cek owner/admin kasar.
5. **Deploy frontend multi-path**: working tree lokal, branch work, remote origin, dan catatan deploy lama bisa membingungkan source of truth.
6. **Clean routes = full clone SPA**: perubahan UI harus disinkron via generator, bukan edit per-route.

## Aturan perubahan aman

1. Ubah source JS/CSS di `assets/` + page root, lalu regenerate clean routes.
2. Ubah absensi/payroll di `tools/gas-script-1/`, deploy via clasp ke script attendance.
3. Ubah auth/data obat di source GAS A, deploy ke deployment dataObatAuth.
4. Jangan hardcode deployment baru di banyak file tanpa update inventaris endpoint.
5. Setiap perubahan sheet schema wajib update dokumen API + regression checklist.

## Inventaris endpoint (lihat dokumen API)

Detail action, payload, dan response ada di:

- `docs/api/gas-contracts.md`
