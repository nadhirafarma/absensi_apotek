# Matriks Role & Permission

Status: draft current-state dari `assets/home-dashboard.js` + aturan backend absensi  
Tanggal: 2026-07-25

## Model akses

1. **Menu access keys** didefinisikan di `ACCESS_MENUS`.
2. **Default role map** di `ROLE_ACCESS`.
3. **Custom role** bisa disimpan di `nadhira.roleRecords` + data user.
4. Runtime cek:
   - `canAccess(key)` di frontend
   - `data-access-key` pada menu/tombol
   - backend absensi: `isAbsensiAdmin_(role/username)`
5. Akun nonaktif → session dibuang + redirect login.

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

## Backend enforcement (saat ini)

### GAS A (auth/data)

- Login, save user, password, CRUD data bergantung action handler.
- Beberapa list/read dibuka lewat `handleUnlockedPostAction_` / GET tertentu.
- **Belum ada matriks permission setara frontend untuk semua write action.**

### GAS B (absensi/payroll)

- Wajib session token valid di `auth_sessions`.
- `isAbsensiAdmin_` true jika role `owner|admin|administrator` atau username `owner|admin`.
- Admin-only: update attendance, payroll CRUD, generate/delete slip.
- Karyawan aktif boleh submit absensi sendiri; nonaktif ditolak.

## Target matriks yang harus dijaga ke depan

1. Setiap write endpoint GAS wajib cek role/session, tidak hanya UI hide.
2. Permission key frontend = permission key backend (satu sumber kebenaran).
3. Custom role tidak boleh melewati hard rule owner-only (identitas apotek, force unlock status done, akses semua data).
4. Owner tidak perlu ESS pribadi; admin & karyawan butuh ESS.
5. Akun nonaktif tidak boleh login/absen/write.

## Checklist verifikasi role (manual)

1. Login sebagai owner → semua menu admin muncul; ESS karyawan tidak.
2. Login sebagai admin → monitoring + payroll + user management muncul.
3. Login sebagai kasir → tidak bisa buka manajemen pengguna/data role/monitoring.
4. Nonaktifkan user → session ditolak.
5. Coba endpoint absensi update tanpa role admin → ditolak backend.
6. Custom role tanpa `edit_obat` → tombol edit obat hilang dan aksi ditolak UI.
