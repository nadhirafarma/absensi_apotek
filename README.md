# Nadhira Farma Digital

Website sederhana berisi dua menu utama:

- Absensi Face ID, memakai halaman `absensi.html`
- Cari Data Obat, memakai cache lokal browser pengguna dengan IndexedDB

Halaman absensi baru dibuat lebih ringan untuk handphone:

- GPS mulai dikunci sejak halaman dibuka, sehingga validasi lokasi tidak menunggu setelah wajah cocok.
- Deteksi wajah memakai resolusi model lebih kecil dan tidak menggambar mesh/radar berat.
- Loop deteksi wajah dibuat tidak saling menumpuk.
- Saat wajah sudah cocok, deteksi wajah dihentikan sementara agar GPS dan API tidak berebut proses.

## Menyambungkan API Google Sheet

URL API data obat sudah dipasang sebagai sumber default:

`https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec?sheet=data_obat`

Pengguna cukup membuka `cari-obat.html`, lalu menekan `Sinkronkan`.

1. Buka `cari-obat.html`.
2. Tekan tombol pengaturan di kanan judul.
3. Masukkan URL API Google Sheet atau Google Apps Script.
4. Tekan `Simpan`, lalu `Sinkronkan`.

Gunakan endpoint khusus data obat. Jangan gunakan endpoint akun/login karena URL API di website statis bisa terlihat dari browser pengguna.

Format data yang didukung bisa berupa JSON array, objek dengan properti `data`, `obat`, `records`, `values`, atau CSV.

Nama kolom yang terbaca otomatis:

- `nama`, `nama_obat`, `name`, `obat`, `nama_barang`, `produk`
- `barcode`, `kode_barcode`, `kode`, `sku`, `id_obat`
- `stok`, `stock`, `qty`, `jumlah`, `sisa`
- `satuan`, `harga`, `kategori`, `lokasi`, `expired`, `updated`

Cache tersimpan di browser masing-masing pengguna. Kalau data di Google Sheet berubah, tekan `Sinkronkan` untuk mengambil data terbaru.

Halaman pencarian juga menyediakan tombol `Scan` untuk membaca barcode lewat kamera browser yang mendukung Barcode Detector API.
