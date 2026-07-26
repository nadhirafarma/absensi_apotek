# Epic List — Indo Apotek Digital

Status: draft v0.1. Diprioritaskan berdasarkan risiko × nilai bisnis, sesuai
gap analysis di `docs/prd/prd.md` §4. Workflow eksekusi mengikuti alur BMAD
berbasis risiko: epic risiko tinggi pakai workflow lengkap (arsitektur,
kontrak API, security review, regression test); epic risiko rendah pakai
alur ringan.

## Tier 1 — Risiko tinggi (workflow lengkap wajib)

### Epic 1: Hardening Autentikasi & Otorisasi
- Tutup endpoint GAS A yang terbuka tanpa session (`handleUnlockedPostAction_`).
- Standardisasi format response (`ok` vs `success`) lintas GAS A/GAS B.
- Audit ulang `auth_sessions` schema & expiry handling.
- **Value:** mencegah kebocoran data user/profil apotek.
- **Risk driver:** keamanan, data pengguna.
- **Progress (2026-07-26):**
  - [x] Fase 1 frontend (non-breaking): `assets/home-dashboard.js` `postToApi` + `assets/attendance.js` profile/shift attach `sessionToken`/`username`/`email`/`role`.
  - [x] Frontend live di GitHub Pages (`sessionToken` terverifikasi di `home-dashboard.js` / `attendance.js`).
  - [x] Fase 2 backend (kode repo): `validatePharmacySession_` + gerbang di `handleUnlockedPostAction_` + `doGet listLoginUsers`.
    - Public tetap: `getDataObatFilter`, `getPharmacyProfile`, `getAttendanceShiftSettings`.
    - Wajib session: `listLoginUsers`, `listActivityLog`, `listRestockRequests`, `listPurchaseOrders`, `listLocalRecords`.
  - [x] Deploy GAS A live + smoke test — **terverifikasi production 2026-07-27** via `tools/smoke_gas_a.js`: 3 public read OK tanpa token (`getPharmacyProfile`, `getAttendanceShiftSettings`, `getDataObatFilter`); 3 sensitive read ditolak tanpa token (`listLoginUsers` POST+GET, `listActivityLog` → "Sesi login tidak tersedia").
  - [ ] Standardisasi `ok`/`success` — kontrak target + rencana migrasi: `docs/api/gas-contracts.md` §8.
    - [x] Fase A docs-first (2026-07-27): survei 3 sisi (GAS A 63/63 dual, GAS B 30/35 dual + 5 ok-only, frontend 32 dual + 8 success-only + 1 ok-only); kanonik = `ok`, `success` alias transisi.
    - [ ] Fase B backend: normalisasi `jsonAbsensi_`, envelope GAS A `:221`, keputusan file `import-data-obat.gs`.
    - [ ] Fase C frontend: helper `isApiOk()`, ganti 9 titik cek tunggal, cek HTTP `response.ok` di helper fetch, perbaiki `attendance.js:937-944`.
    - [ ] Fase D: hapus alias `success` (setelah C stabil + regression lulus).



### Epic 2: Konsolidasi Sumber GAS B (hilangkan drift)
- Tetapkan satu sumber kebenaran antara `google-apps-script-absensi-api.gs`
  (root) dan `tools/gas-script-1/Kode.js` (clasp).
- Setup proses sinkronisasi atau deprecate salah satu.
- **Value:** cegah bug akibat deploy dari salinan usang.
- **Risk driver:** deployment, integritas kode.
- **Progress (2026-07-26):**
  - [x] Canonical = `tools/gas-script-1/Kode.js` (clasp); root = mirror.
  - [x] Root disalin dari clasp (hash byte-identik, 2307 baris).
  - [x] SOP deploy + gas-contracts diperbarui (copy mirror setelah edit).
  - [x] Opsional: `tools/check_gas_mirrors.js` (2026-07-27) — cek hash root vs clasp untuk GAS A & GAS B; dipanggil manual/di SOP (belum sebagai git hook).


### Epic 3: Payroll & Slip Gaji — Verifikasi & Pengamanan
- Validasi ulang `generateSalarySlip`, `deleteSalarySlipHistory` terhadap
  data nyata; pastikan gerbang admin tidak bisa dilewati.
- Regression test penuh sesuai `docs/qa/regression-checklist.md` §4.
- **Value:** payroll salah = risiko finansial & kepercayaan karyawan.
- **Risk driver:** keuangan, kepatuhan.

## Tier 2 — Risiko menengah (workflow lengkap, cakupan lebih kecil)

### Epic 4: Monitoring Presensi — Lengkapi Export & Koreksi
- Implementasi export PDF/Excel (gap §4 PRD).
- Perkuat audit trail pada `updateAttendanceRecord`.
- **Value:** kebutuhan operasional owner/admin harian.

### Epic 5: Modul Cuti & Izin (baru)
- Schema Sheet baru + action GAS baru (`submitLeaveRequest`, `approveLeave`,
  `listLeaveHistory`, dst).
- Approval workflow + notifikasi.
- **Value:** fitur dijanjikan PRD sumber, belum ada di kode.
- **Risk driver:** perubahan schema/API baru — perlakukan sebagai greenfield.

### Epic 6: Modul Lembur — Approval Terpisah (baru)
- Pisahkan submit LEMBUR (presensi, sudah ada) dari pengajuan/approval
  lembur formal.
- **Value:** kontrol upah lembur lebih akurat.

### Epic 7: Jadwal Kerja / Kalender Karyawan (baru)
- CRUD jadwal per-karyawan, assign shift, kalender view.
- Beda dari `AttendanceShiftSettings` yang sudah ada (itu pengaturan global).
- **Value:** dasar untuk validasi keterlambatan & lembur akurat.

## Tier 3 — Risiko rendah-menengah

### Epic 8: Data Obat, Restok, PO — Regression & UX
- Pastikan CRUD data obat, restok, PO sesuai `gas-contracts.md` §3.2.
- **Value:** operasional inti apotek non-SDM.

### Epic 9: Dokumen Saya & Pengumuman (baru)
- Upload/arsip dokumen (slip gaji, BPJS, NPWP, kontrak).
- CMS pengumuman internal (buat, publish, pin, jadwalkan).
- **Value:** kelengkapan ESS sesuai PRD sumber, tapi bukan blocker operasional.

## Tier 4 — Alur ringan (bug UI lokal, low risk)
- Perbaikan teks, warna, spacing, ikon.
- Polish dark mode / responsive minor.
- Cleanup file temporer root (`tmp-css-*.txt`, `$null`, dll — lihat SOP §exclude).

## Urutan eksekusi yang direkomendasikan
1. Epic 1 (auth hardening) — prasyarat keamanan semua epic lain.
2. Epic 2 (konsolidasi GAS B) — cegah drift sebelum epic lain menyentuh GAS B.
3. Epic 3 (payroll safety).
4. Epic 4 (monitoring presensi export/koreksi).
5. Epic 8 (data obat regression) — paralel dengan epic 4, risiko lebih rendah.
6. Epic 5, 6, 7 (fitur baru SDM: cuti, lembur, jadwal) — greenfield, butuh
   desain schema Sheet + kontrak API baru sebelum implementasi.
7. Epic 9 (dokumen & pengumuman).
8. Tier 4 kapan saja, tidak memblokir tier lain.

## TEA
Ditambahkan setelah Epic 1–4 stabil dan baseline regression checklist lulus
manual minimal sekali penuh.
