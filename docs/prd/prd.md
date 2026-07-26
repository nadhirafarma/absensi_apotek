# PRD Induk — Indo Apotek Digital

Status: draft v0.1. Menyatukan `PRD_Presensi_Owner_Admin_Monitoring_v1.0.txt`
dan `PRD_Employee_Self_Service_(ESS)_Presensi_Karyawan_v1.0.txt` (Downloads)
sebagai input, direkonsiliasi dengan current-state code (`docs/api/gas-contracts.md`,
`docs/architecture/`, `docs/security/role-permission-matrix.md`).

> Dua PRD sumber mendeskripsikan target-state yang lebih luas dari yang saat
> ini terimplementasi. PRD ini TIDAK membuat ulang tanpa alasan — bagian yang
> sudah baik dari PRD sumber dipertahankan, gap terhadap kode nyata ditandai
> eksplisit di §4.

## 1. Tujuan produk
Platform internal apotek untuk: autentikasi berbasis role, presensi karyawan
(GPS+foto), monitoring & approval oleh owner/admin, payroll & slip gaji,
manajemen data obat/stok/supplier, dan employee self-service (ESS).

## 2. Pengguna & role
| Role | Sumber kebenaran | Ringkas |
|---|---|---|
| Owner | `docs/security/role-permission-matrix.md` | Akses penuh semua modul |
| Admin | idem | Operasional, tunduk gerbang `isAbsensiAdmin_` untuk absensi/payroll |
| Karyawan | idem | ESS: hanya data milik sendiri |

## 3. Modul (dari PRD sumber, dipertahankan sebagai target)
- **Owner/Admin — Monitoring**: Dashboard, Monitoring Presensi/Jadwal/Cuti/
  Lembur/Slip Gaji/Dokumen/Pengumuman, Rekap, Pengaturan.
- **Karyawan — ESS**: Dashboard Presensi, Presensi Saya, Jadwal Kerja,
  Cuti & Izin, Lembur, Slip Gaji, Dokumen Saya, Pengumuman.
- **Data Obat & Operasional** (dari kode, tidak ada di PRD sumber):
  data obat, cari obat, restok, purchase order, data supplier, import data
  obat, manajemen pengguna, data role, log aktivitas, akun profil.

## 4. Gap target vs current-state (⚠ prioritas produk)
| Fitur PRD sumber | Status kode saat ini |
|---|---|
| Presensi submit (DATANG/PULANG/LEMBUR), GPS+foto | ✅ Ada (`google-apps-script-absensi-api.gs`) |
| Payroll & slip gaji, generate massal/per-karyawan | ✅ Ada |
| Monitoring presensi (lihat, filter, koreksi, export) | ⚠ Sebagian: `listAttendanceRecords`/`updateAttendanceRecord` ada; export PDF/Excel belum teridentifikasi di kontrak |
| Jadwal kerja (CRUD, assign shift, kalender) | ❌ Tidak ditemukan action GAS terkait "jadwal"/"shift" selain `AttendanceShiftSettings` (pengaturan shift global, bukan kalender per-karyawan) |
| Cuti & Izin (ajukan, approval, riwayat) | ❌ Tidak ada action `cuti`/`izin`/`leave` di kontrak API manapun |
| Lembur (ajukan, approval terpisah dari submit LEMBUR presensi) | ⚠ Submit LEMBUR ada sebagai tipe presensi; workflow approval lembur terpisah tidak ditemukan |
| Dokumen (upload, kategori, arsip: BPJS, NPWP, kontrak) | ❌ Tidak ada action terkait di kontrak API |
| Pengumuman (buat, publish, pin, jadwalkan) | ❌ Tidak ada action terkait |
| Audit log semua perubahan | ⚠ Ada `saveActivityLog`/`listActivityLog` (GAS A) — cakupan penuh belum diverifikasi |
| RBAC ketat | ⚠ Ada untuk absensi/payroll (GAS B); GAS A punya endpoint read tanpa gerbang session — lihat regression checklist §1 |

**Implikasi:** modul Cuti/Izin, Jadwal Kerja (kalender), Dokumen, dan
Pengumuman adalah **fitur baru**, bukan hardening dari yang sudah ada.
Modul ini harus diperlakukan sebagai epic greenfield dengan schema Sheet dan
action GAS baru — bukan diasumsikan sudah berjalan.

## 5. Non-functional requirements
- Responsif desktop/mobile/tablet/laptop (disyaratkan kedua PRD sumber).
- Validasi form + audit log setiap pengajuan (cuti/izin/lembur) — begitu
  modul tsb dibangun.
- Keamanan: session GAS B wajib untuk semua aksi; GAS A read-sensitif harus
  ditutup dari akses tanpa auth (lihat gas-contracts.md §3.3).
- Foto absensi ≤3MB, GPS radius ≤160m/akurasi ≤200m, drift waktu ≤10 menit
  (sudah terimplementasi, jadi jadi baseline regression, bukan requirement baru).

## 6. Batasan teknis
- Backend: 2 Google Apps Script Web App terpisah (GAS A data/auth, GAS B
  absensi/payroll), keduanya membaca/menulis Google Sheets sebagai data
  store — tidak ada database relasional.
- Frontend: HTML statis multi-halaman di GitHub Pages, tanpa build step,
  tanpa framework SPA.
- Deploy: manual per-part (lihat `docs/ops/deploy-sop.md`); tidak ada CI/CD
  otomatis yang teridentifikasi.

## 7. Keluar dari cakupan v1 (tunda)
- TEA/pengujian otomatis penuh (ditambahkan setelah baseline regression
  stabil — lihat §8 rencana workflow).
- Modul BMB/BMAD lain di luar BMM inti.
