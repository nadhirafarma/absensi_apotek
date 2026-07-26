# Regression Checklist — Indo Apotek

Status: draft current-state (BMM bmad-document-project, 2026-07-26)
Sumber: dianalisis dari `assets/*.js`, `google-apps-script-*.gs`.
Gunakan sebelum setiap deploy yang menyentuh auth, presensi, data obat, atau payroll.

## 1. Login & Session (GAS A)
- [ ] Login user aktif dengan kredensial benar → sukses, token tersimpan.
- [ ] Login kredensial salah → ditolak dengan pesan jelas.
- [ ] Login user nonaktif/dihapus → ditolak.
- [ ] Session expired (>12 jam) → auto-redirect ke login (`auth-guard.js`).
- [ ] Reset password: flow lengkap `resetPassword` → `confirmResetPassword`.
- [ ] Endpoint `listLoginUsers` — verifikasi TIDAK bisa diakses tanpa auth
      di lingkungan produksi (risiko GAS A `handleUnlockedPostAction_`).
- [ ] Logout menghapus token dari `auth_sessions` (tidak bisa dipakai ulang).

## 2. Presensi (GAS B)
- [ ] Submit DATANG sukses dengan foto valid, GPS dalam radius (≤160m).
- [ ] Submit DATANG ditolak jika di luar radius (>160m).
- [ ] Submit DATANG ditolak jika foto >3MB.
- [ ] Submit DATANG ditolak jika timestamp drift >10 menit.
- [ ] Duplikat submit DATANG/PULANG/LEMBUR hari sama → ditolak.
- [ ] Karyawan nonaktif tidak bisa submit absensi.
- [ ] `updateAttendanceRecord` hanya bisa dipanggil role admin/owner.
- [ ] Request GAS B tanpa `sessionToken` valid → ditolak semua endpoint.
- [ ] Role/username hasil session menang atas payload klien (anti-spoof).

## 3. Data Obat (GAS A)
- [ ] `add_data_obat` / `update_data_obat` / `delete_data_obat` berfungsi
      dan tervalidasi di sheet `data_obat`.
- [ ] Pencarian obat (`cari-obat.html`, `search-obat.js`) mengembalikan hasil
      sesuai query & filter.
- [ ] Import data obat (`import_data_obat`) sukses untuk file valid, gagal
      dengan pesan jelas untuk format salah.
- [ ] Restok obat: `listRestockRequests`/`saveRestockRequests` konsisten
      dengan role yang mengakses.

## 4. Payroll & Slip Gaji (GAS B)
- [ ] `listPayrollEmployees`/`savePayrollEmployee`/`deletePayrollEmployee`
      hanya untuk admin/owner.
- [ ] `generateSalarySlip` menghasilkan slip sesuai data absensi periode.
- [ ] `listSalarySlipHistory` non-admin hanya melihat data miliknya sendiri.
- [ ] `deleteSalarySlipHistory`/`deleteAllSalarySlipHistory` hanya admin,
      dan tidak menghapus data lintas karyawan tanpa sengaja.

## 5. Role & Permission
- [ ] Owner bisa akses semua modul manajemen (user, role, payroll, log).
- [ ] Admin sesuai batas matriks (`docs/security/role-permission-matrix.md`).
- [ ] Karyawan (ESS) hanya bisa akses profil/presensi miliknya sendiri.
- [ ] Percobaan akses halaman admin oleh role karyawan → redirect/blok oleh
      `auth-guard.js`.

## 6. Deploy sanity check
- [ ] Setelah deploy GAS baru, jalankan `tools/live_probe.js` untuk cek
      endpoint hidup.
- [ ] URL API di `assets/*.js` cocok dengan deployment aktif terbaru.
- [ ] GitHub Pages live menampilkan versi terbaru (bukan cache lama).

## ⚠ Catatan
Checklist ini hasil analisis source code (current-state), BUKAN hasil
eksekusi test nyata. Setiap item wajib dijalankan manual/otomatis sebelum
dianggap "lulus regresi".
