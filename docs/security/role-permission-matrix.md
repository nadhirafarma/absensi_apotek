# Matriks Role & Permission

Status: baseline v0.2; current-state + target enforcement
Tanggal rekonsiliasi: 2026-07-30

## Model akses

1. **Menu access keys** didefinisikan di `ACCESS_MENUS`.
2. **Default role map** di `ROLE_ACCESS`.
3. **Custom role policy** disimpan authoritative di GAS A Script Property `ROLE_POLICIES`; `nadhira.roleRecords` hanya cache frontend.
4. Runtime effective access non-Owner menunggu role policy dan user list authoritative, lalu memakai role access atau irisan user access dengan role access.
5. Runtime cek:
   - `canAccess(key)` di frontend
   - `data-access-key` pada menu/tombol
   - backend absensi: `isAbsensiAdmin_(role/username)`
6. Akun nonaktif → session dibuang + redirect login.

## Access keys

| Key | Label | Catatan |
|---|---|---|
| `dashboard` | Dashboard | home ringkasan |
| `absensi` | Absensi | halaman absensi |
| `presensi` | Presensi | view presensi di SPA |
| `presensi_karyawan` | Portal Karyawan (ESS) | dikunci khusus non-owner |
| `monitoring_presensi` | Monitoring Presensi | hanya admin/owner |
| `cari_data_obat` | Cari Data Obat | |
| `data_obat` | Data Obat | |
| `filter_data_obat` | Filter Data Obat | |
| `edit_obat` | Tambah/Edit Obat | aksi write |
| `hapus_obat` | Hapus Obat | aksi destructive |
| `data_karyawan` | Data Karyawan | |
| `data_supplier` | Data Supplier | |
| `restok_obat` | Restok Obat | |
| `surat_pesanan` | Surat Pesanan Pembelian | |
| `import_data_obat` | Import Data Obat | |
| `akun_profil` | Pengaturan | profil + preferensi |
| `log_aktivitas` | Log Aktivitas | |
| `manajemen_pengguna` | Manajemen Pengguna | |
| `data_role` | Data Role | |
| `akses_semua_data` | Akses Semua Data (Owner) | marker owner |

## Default role map

| Role | Menu default | Khusus |
|---|---|---|
| **owner** | semua `ACCESS_MENUS` | bypass `canAccess`; tidak pakai ESS karyawan; pantau notifikasi operasional; ubah identitas apotek/GPS/logo |
| **admin / administrator** | hampir semua, tanpa `akses_semua_data` | `monitoring_presensi` aktif; kelola absensi manual, payroll, user, role |
| **apoteker** | dashboard, absensi/presensi/ESS, cari/data obat, filter, edit obat, karyawan, supplier, restok, PO, import, profil, log | tanpa hapus obat, manajemen user/role, monitoring |
| **staf gudang** | dashboard, absensi/presensi/ESS, cari/data obat, filter, edit obat, supplier, restok, PO, import, profil, log | fokus stok & PO |
| **kasir** | dashboard, absensi/presensi/ESS, cari/data obat, restok, profil, log | akses sempit |
| **asisten apoteker** | mirip kasir | akses sempit |
| **operator** | baseline operasional (lihat kode `ROLE_ACCESS.operator`) | fallback role generik |
| **custom role** | dari editor Data Role | subset access keys yang dipilih |

Catatan: string role dinormalisasi (lowercase/search-normalized). Alias `administrator` = admin.

## Aturan hard-coded (bukan sekadar daftar menu)

| Aturan | Owner | Admin | Karyawan/role lain |
|---|---|---|---|
| Lihat semua menu jika access list kosong/invalid | Ya | Tidak | Tidak |
| `monitoring_presensi` | Ya | Ya | Tidak |
| `presensi_karyawan` (ESS) | Tidak | Ya (jika aktif) | Ya (jika aktif + access) |
| Edit catatan kehadiran manual | Ya | Ya | Tidak |
| List/save/delete payroll employee | Ya | Ya | Tidak |
| Generate/hapus slip gaji | Ya | Ya | Tidak |
| Ubah identitas apotek / logo / GPS radius | Ya | Tidak | Tidak |
| Kelola shift settings | Ya/Admin (UI manage shift) | Ya | Tidak |
| Hapus obat | Ya | Ya jika access `hapus_obat` | Hanya jika access key ada |
| Restok status `done` diubah lagi | Ya | Tidak | Tidak |
| Buat draft PO dari restok | Ya | Ya | Tidak |
| Log aktivitas full | Ya/Admin limit lebih besar | Ya | Hanya milik sendiri |

## UI visibility bukan backend enforcement

`canAccess()` dan `data-access-key` menyembunyikan/menampilkan UI. Keduanya
bukan security boundary: request HTTP dapat dibuat tanpa halaman/tombol. Setiap
backend action di bawah harus validasi token, status aktif, role, dan ownership
berdasarkan session server-side.

## Backend enforcement — current-state

### GAS A (auth/data)

| Kelas | Action | Target role/ownership | Current source |
|---|---|---|---|
| Public allowlist | `getDataObatFilter`, `getPharmacyProfile`, `getAttendanceShiftSettings` | Public read, data diklasifikasikan non-sensitif | Tidak pakai session — keputusan sadar |
| Authenticated read | `listLoginUsers`, `listActivityLog`, `listRestockRequests`, `listPurchaseOrders`, `listLocalRecords`, `listRolePolicies` | Session valid; row scope sesuai role | `validatePharmacySession_` enforced |
| Role policy | `saveRolePolicies` | Owner-only; policy tersanitasi; identity dari session | Enforced; persistence `ROLE_POLICIES` |
| User management | save/update/delete user | Owner/Admin | Enforced hard role gate; belum memakai custom permission key |
| Pharmacy/global settings | profil apotek, GPS, shift | Owner untuk identitas apotek; admin/owner untuk shift sesuai approval | Enforced hard role gate |
| Obat/restok/PO/local | add/update/delete/import/save/clear | Session + hard role gate sesuai kelas action | Session enforced; permission key granular belum diterapkan |
| Activity log | save/delete | Server menulis actor dari session; delete Owner-only | Session dan hard role gate enforced |
| Credential/reset | login/reset/save password | Public request netral; reset token one-time; password hash; invalidate session | Enforced source; live validation tetap wajib |
| Generic GET sheet | `sheet=<nama>` | Deny-by-default; hanya allowlist public | Enforced allowlist `data_obat` dan `pharmacy_profile` |

### GAS B (absensi/payroll)

| Kelas | Action | Target role/ownership | Current source |
|---|---|---|---|
| Semua request | doGet/doPost | Session valid; identity overwrite | `validateAbsensiSession_` + `applyAbsensiSession_` |
| Presensi sendiri | submit DATANG/PULANG/LEMBUR | Karyawan aktif; self-only | Enforced |
| Monitoring/koreksi | list/update attendance | Non-admin self-only; update admin/owner | Enforced, ESS smoke pending |
| Payroll CRUD/generate | list/save/delete employee, generate | Admin/owner only | Enforced role gate; GET generate hardening open |
| Slip history | list | Non-admin self-only; admin all | Enforced source, live ESS pending |
| Slip delete | one/all | Admin/owner; server-record binding + confirmation | **Gap:** row/file client target, bulk no server confirmation |
| PDF slip | download/open | Employee self-only; admin documented target | **Gap:** Drive `ANYONE_WITH_LINK` |

## Target rules yang wajib dijaga

1. Setiap write endpoint GAS cek session, status aktif, role, dan ownership di
   backend. UI hide tidak cukup.
2. Client `role`, `username`, `actor`, `nama`, `rowNumber`, atau `fileId` tidak
   menjadi authority; backend overwrite/resolve dari session dan record server.
3. Permission key frontend harus memiliki mapping backend eksplisit; custom role
   tidak melewati owner-only rule.
4. `auth_sessions` dan credential/reset adalah boundary sensitif, tidak dapat
   diakses lewat generic GET atau public write.
5. Owner tidak perlu ESS pribadi; admin/karyawan butuh ESS sesuai scope.
6. Akun nonaktif tidak boleh login, absen, atau melakukan write.
7. Public profile dan shift global hanya tetap public bila owner menyetujui
   klasifikasi data; action selain allowlist harus deny-by-default.

## Checklist verifikasi role

1. Owner: semua menu dan server action owner-only valid.
2. Admin: monitoring/payroll/user management sesuai batas server.
3. Role terbatas: request manual ke write GAS A dengan role/actor palsu ditolak.
4. Karyawan: ESS hanya record sendiri; request employee-A ke employee-B ditolak.
5. Akun nonaktif/session expired: semua write ditolak.
6. Generic GET sheet internal dan `auth_sessions`: ditolak tanpa membocorkan data.
7. Custom role tanpa `edit_obat`: UI hilang **dan** backend action ditolak.
