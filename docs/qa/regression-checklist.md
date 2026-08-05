# Regression Checklist — Indo Apotek

Status: revisi 2026-07-28. Setiap item mewakili satu kebutuhan verifikasi.
Gunakan sebelum deploy yang menyentuh auth, session, GAS, atau data.

> Seluruh checklist ini **dianalisis dari source**; item manual belum dieksekusi
> kecuali ada evidence log bertanggal dan signed-off di bawahnya. Jangan mencentang
> manual item tanpa bukti eksekusi: deployment/version, role akun, timestamp, hasil
> redacted. Token, password, URL file, dan data payroll tidak boleh masuk log.

## Evidence template per story
```
Story: 3.x | Date: YYYY-MM-DD | Executor: <role>
Deployment GAS A version: @Nxx | rollback: @Nyy
Deployment GAS B version: @Nxx | rollback: @Nyy
Source commit: <sha>
Akun test: owner/admin/<employee>
Hasil: <pass/fail> <ringkasan>; lihat log redacted di <path>
```

---

## A. Static / local (jalankan sebelum commit apa pun)

- [ ] `node --check tools/gas-a/Kode.js` — parse syntax OK.
- [ ] `node --check tools/gas-script-1/Kode.js` — parse syntax OK.
- [x] `node tools/check_gas_mirrors.js` — lulus 2026-07-28: GAS A `a1dc12d71982…`; GAS B `7a99cf1471a4…`.
- [x] `node tools/check_gas_mirrors.js` — lulus 2026-08-06: GAS A `d93d695dd862…`; GAS B `0a8aba6ee3fd…` (pasca sync mirror import-data-obat).
- [ ] `node --check assets/home-dashboard.js assets/ess.js assets/attendance.js assets/login.js assets/auth-guard.js` — OK.
- [ ] Perubahan tidak mengandung token/password/email/URL Drive/data gaji mentah.

---

## B. Negative security (authenticated ke test deployment atau dengan data uji)

### B1 GAS A — public GET allowlist
- [x] `GET ?sheet=auth_sessions` → `{ ok:false }` tanpa data di staging Story 3.1a (2026-07-28). Production belum diuji/dideploy.
- [x] `GET ?sheet=user` → `{ ok:false }` di staging Story 3.1a (2026-07-28). Production belum diuji/dideploy.
- [x] `GET ?sheet=data_obat` → `{ ok:true, data:[...] }` tanpa session di staging Story 3.1a (2026-07-28).
- [ ] `GET ?sheet=<sheet internal lain>` → `{ ok:false }`.
- [ ] `GET ?page=reset` → halaman reset; tidak melakukan mutasi.

### B2 GAS A — write without session
- [x] `POST saveLoginUser` tanpa token → `{ ok:false }` di staging Story 3.1a (2026-07-28).

### Evidence deploy 2026-08-06 (import_data_obat live fix)
```
Story: bug import_data_obat live | Date: 2026-08-06 | Executor: owner (akun test: master/owner)
Deployment GAS A version: @127 | rollback: @126
Source commit: <belum di-commit; lihat git status>
Akun test: owner
Hasil: PASS — smoke GAS A (public OK, sensitive rejected); import live append 2 baris dummy
  → `{ ok:true }`, masuk sheet lengkap (kode/nama/stok/harga_beli, angka terformat), lalu
  dihapus bersih (sheet kembali 3302 baris). Data produksi tidak berubah.
```
- [ ] `POST deleteLoginUser` tanpa token → `{ ok:false }`.
- [ ] `POST savePharmacyProfile` tanpa token → `{ ok:false }`.
- [ ] `POST add_data_obat` / `update_data_obat` / `delete_data_obat` tanpa token → `{ ok:false }`.
- [ ] `POST import_data_obat` tanpa token/non-admin → `{ ok:false }`; data tidak berubah.
- [ ] `POST import_data_obat` mode/header/kode invalid → `{ ok:false }`; data tidak berubah.
- [ ] Uji `replace` hanya di staging dengan spreadsheet disposable/backup; jangan smoke test replace di production.
- [x] `POST saveLoginUser` employee → `{ ok:false }` di staging Story 3.1a (2026-07-28).
- [x] `POST saveLoginUser` admin → `{ ok:true }` di staging Story 3.1a (2026-07-28).
- [x] `POST savePharmacyProfile` admin → `{ ok:false }` di staging Story 3.1a (2026-07-28).
- [x] `POST savePharmacyProfile` owner → `{ ok:true }` di staging Story 3.1a (2026-07-28).
- [x] `POST add_data_obat` employee → `{ ok:false }` di staging Story 3.1a (2026-07-28).
- [x] `POST add_data_obat` admin → `{ ok:true }` di staging Story 3.1a (2026-07-28).
- [ ] `POST saveActivityLog` dengan payload `sessionEvent=login` kosong → tidak mint sesi.

### B3 GAS A — forged role/identity
- [ ] `POST <write-admin>` dengan token valid employee + `role=admin` di payload → ditolak backend; role dari session menang.

### B4 GAS A — credential/reset
- [ ] Reset request dengan username/email terdaftar → response netral (tidak membocorkan status akun).
- [ ] Reset request dengan data tidak terdaftar → response netral (tidak membedakan).
- [ ] ⚠ Token reset di email: validasi bahwa bersifat one-time dan ber-expiry (perlu akun test inbox terkendali; preflight scope di Story 3.1).

### B5 GAS B — IDOR payroll
- [ ] `POST listSalarySlipHistory` dengan token employee A; nama/NIP employee B di payload → hanya menerima data sendiri.
- [ ] `POST listAttendanceRecords` idem → hanya data sendiri.
- [ ] `POST deleteSalarySlipHistory` dengan `rowNumber`/`fileId` milik employee B → fail closed; baris/file milik A tidak terpengaruh.

### B6 GAS B — generate GET blocked
- [ ] `GET action=generateSalarySlip` → `{ ok:false }` tanpa PDF/row/file baru.

### B7 GAS B — delete constraints
- [ ] Delete satu slip dengan `rowNumber` stale (slip baru diadded setelah list) → fail closed; tidak menghapus baris salah.
- [ ] Delete all dengan `expectedCount` salah → `{ ok:false }`.
- [ ] Delete all tanpa `confirmation` → `{ ok:false }`.

### B8 Formula injection
- [ ] Simpan nama karyawan `=SUM(1)` → Sheets menyimpan literal `'=SUM(1)`, bukan formula.
- [ ] Idem untuk prefix `+`, `-`, `@`.

---

## C. Login dan session (GAS A — authenticated live)

- [ ] Login user aktif + kredensial benar → `{ ok:true }`, token di sessionStorage.
- [ ] Login kredensial salah → `{ ok:false }` dengan pesan jelas.
- [ ] Login user nonaktif → ditolak.
- [ ] Session expired (>12 jam) → auto-redirect login (`auth-guard.js`).
- [ ] `listLoginUsers` tanpa token → ditolak ("Sesi login tidak tersedia").
- [ ] `listActivityLog` tanpa token → ditolak.
- [ ] Logout → token terhapus dari `auth_sessions`; request GAS B berikutnya ditolak.

---

## D. Presensi (GAS B — authenticated live)

- [ ] Submit DATANG sukses: foto ≤3MB, GPS dalam radius ≤160m.
- [ ] DATANG ditolak: di luar radius atau foto >3MB atau drift timestamp >10 menit.
- [ ] Duplikat DATANG/PULANG/LEMBUR hari sama → ditolak.
- [ ] Karyawan nonaktif → ditolak.
- [ ] `updateAttendanceRecord` tanpa role admin → ditolak backend.
- [ ] Request GAS B tanpa `sessionToken` valid → semua endpoint ditolak.
- [ ] Role/username dari session menang atas payload.

---

## E. Data obat (GAS A — authenticated live)

- [ ] `add_data_obat`/`update_data_obat`/`delete_data_obat` → sukses dengan session valid; ditolak tanpa session.
- [ ] `listRestockRequests`/`saveRestockRequests` konsisten sesuai role.

---

## F. Payroll dan slip (GAS B — authenticated live)

- [ ] `listPayrollEmployees`/`savePayrollEmployee`/`deletePayrollEmployee` → hanya admin/owner.
- [ ] `generateSalarySlip` POST → slip sesuai data absensi periode.
- [ ] `listSalarySlipHistory` employee → hanya data sendiri.
- [ ] Delete satu/semua slip → hanya admin; tidak menghapus baris lain.
- [ ] ESS owner/admin view history dan download (via endpoint yang sesuai).
- [ ] ESS karyawan self-only history; download dari akun sendiri.

---

## G. Role dan permission (manual browser)

- [ ] Owner: semua menu admin muncul; ESS karyawan tidak.
- [ ] Admin: monitoring/payroll/user management sesuai batas server.
- [ ] Kasir/karyawan: tidak dapat membuka manajemen pengguna/monitoring.
- [ ] Session expired di browser → halaman redirect ke login.
- [ ] Employee A tidak dapat melihat data employee B lewat UI ESS.

---

## H. Deploy sanity (setelah setiap deploy GAS atau Pages)

- [ ] `node tools/live_probe.js` → endpoint hidup dan merespons.
- [ ] `node tools/smoke_gas_a.js` → public read OK, sensitive/write tanpa token ditolak.
- [ ] URL API di `assets/*.js` cocok deployment aktif.
- [ ] GitHub Pages live: versi terbaru, bukan cache lama.
- [ ] Deployment version dan rollback version tercatat di evidence log.

### H1. Deploy GAS B khusus

Gunakan checklist operator rinci di:
- `docs/ops/deploy-gas-b-checklist.md`

Minimum yang wajib dilaporkan setelah deploy GAS B:
- [ ] kontrak endpoint lama masih kompatibel
- [ ] list histori tidak lagi memodifikasi sheet
- [ ] nominal `0` dan negatif tampil
- [ ] filter `month/year/startDate/endDate/page/limit` bekerja
- [ ] `employeeId` tidak meluaskan akses non-admin
- [ ] `reused: true` untuk slip periode sama
- [ ] partial outcome jelas bila PDF sukses tetapi histori gagal dicatat
- [ ] kasus Ayu diklasifikasikan dengan bukti redacted
- [ ] rollback version dicatat

Jika seluruh butir H1 dijalankan, bukti detail cukup disimpan di dokumen deploy GAS B dan dirujuk dari evidence log story.

---

## I. Live data quality (preflight sebelum Story 3.x runtime)

- [x] Script ID dan deployment ID GAS A/B dicatat 2026-07-28: GAS A production `@124`; GAS B production `@70`; URL frontend cocok. ⚠ Source parity terhadap version aktif belum dibuktikan dengan pull/diff atau smoke.
- [ ] Header Sheet `user`, `auth_sessions`, `data_karyawan`, `log_slip_gaji` sesuai yang diasumsikan source.
- [ ] Tidak ada NIP kosong atau duplicate NIP di `data_karyawan`.
- [ ] Tidak ada duplicate `fileId` di `log_slip_gaji`; semua file ID merujuk ke file Drive yang ada.
- [ ] Folder PDF (`slip_gaji_pdf`) dan folder foto (`Foto_Absensi`) dapat dibaca oleh service account GAS.
- [ ] Sampel PDF representative tersedia untuk estimasi ukuran blob/base64.
- [ ] Akun owner, admin, dan employee uji tersedia dengan credential dan inbox test terkendali.
- [ ] Status sharing file PDF legacy tercatat (jumlah public link yang ada).

---

## Smoke log historis (2026-07-26–27)

### Lokal + live API (2026-07-26, pre-merge ke main)
- [x] Syntax JS: `home-dashboard.js`, `attendance.js`, `auth-guard.js`, `login.js`, `ess.js`, `app.js` — OK.
- [x] Simulasi enrich `postToApi`: token/username/email/role menempel; field eksplisit menang.
- [x] GAS A `GET sheet=data_obat` → 200, `success/ok true`, total 3310.
- [x] GAS A `POST getPharmacyProfile` tanpa token → 200 (fase 1 non-breaking).
- [x] GAS B `POST listAttendanceRecords` tanpa token → ditolak.
- [x] Live site `https://indoapotek.my.id` → 200.
- [x] Mirror GAS B root vs clasp hash identik.

### Post-deploy (2026-07-26)
- [x] GitHub Pages live → 200, Last-Modified terbaru.
- [x] `home-dashboard.js` live 200, 594KB, mengandung `sessionToken`.
- [x] `attendance.js` live 200, 48KB, mengandung `sessionToken`.

### Post-deploy Epic 1 Fase B + Epic 3 Critical (2026-07-27)
- [x] GAS A smoke via `tools/smoke_gas_a.js`: 3 public read OK tanpa token; 3 sensitive read tanpa token ditolak "Sesi login tidak tersedia".
- [x] Mirror GAS A (sha256 `ae52804…`) dan GAS B (sha256 `7f0bd9f…`) byte-identik setelah deploy.
- [x] CRITICAL bypass admin live-verified tertutup.
- [x] HIGH IDOR-read non-admin deployed (GAS B @67); perlu smoke ESS employee live.

### GAS A role policy (2026-07-30)
- [x] Script ID `1oj9FfGGSv4FNiaK6kPqV_39kg2vESJ4RfUg_FH8mrpnzVhz2u42AiE5M`; production deployment `AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu` diperbarui dari rollback `@125` ke `@126`.
- [x] `clasp push` mengirim `appsscript.json`, `Kode.js`, dan `reset.html`; version `126` dibuat dengan deskripsi `Role policies persistence and access loading 2026-07-30`.
- [x] Preflight syntax GAS A dan mirror check lulus; GAS A sha256 `e313dd345542…`, GAS B sha256 `7a99cf1471a4…`.
- [x] `clasp deployments` mengonfirmasi production aktif pada `@126`; URL frontend tetap memakai deployment ID yang sama.
- [x] Post-deploy `node tools/smoke_gas_a.js` PASS manual 2026-07-30: 3 public read HTTP 200 dengan `success/ok=true`; `listLoginUsers` dan `listActivityLog` tanpa token ditolak; GET legacy `listLoginUsers` ditolak dan mengarahkan ke POST.
- [ ] `node tools/live_probe.js` tidak dijalankan karena file probe kosong; cakupan endpoint GAS A sudah diverifikasi oleh smoke di atas.
- Source: working tree belum di-commit; HEAD awal sesi `ec7950b`. Akun aplikasi tidak dipakai; deploy melalui kredensial clasp lokal.
