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

Halaman pencarian juga menyediakan tombol scanner di dalam kolom pencarian untuk membaca barcode/QR lewat kamera browser.

## Backup Perubahan Terakhir

Backup ini dibuat pada `26/05/2026` setelah deploy perbaikan terakhir.

Live website:

`https://nadhirafarma.github.io/absensi_apotek/`

Commit deploy terakhir:

`ab37ebec5027f4fd6f5a14a3860e72bc1aca19c3`

Perubahan yang sudah masuk:

- Menu utama tetap sederhana dengan dua pilihan: `Absensi Face ID` dan `Cari Data Obat`.
- Halaman `cari-obat.html` memakai cache lokal pengguna melalui IndexedDB.
- Tombol `Sinkronkan` dipindahkan ke header bersama tombol `Menu` dan `Absensi`.
- Kolom pencarian obat dibuat lebih ringkas, dengan tombol scanner menyatu di sisi kanan input.
- Hasil pencarian obat tampil sebagai pop-up di bawah kolom pencarian, sehingga tidak mengganggu pengetikan.
- Saat pop-up hasil pencarian terbuka, teks/header/footer yang mengganggu layar mobile disembunyikan.
- Nama obat diberi blok warna variatif sesuai panjang nama agar lebih mudah dibaca.
- Review obat dibuat compact untuk mobile: nama obat, barcode, stok + satuan beli, expired, dan harga per level.
- `batch` dan `kategori` tidak ditampilkan di review obat.
- Filter kolom tetap tersedia agar data yang ditampilkan bisa dipilih.
- Status stok kosong/menipis/tersedia dibuat terlihat jelas.
- Last updated hanya dipakai sebagai keterangan update data obat dari Google Sheet.
- Import Excel data obat sudah tersedia di header untuk upload perubahan database ke Google Sheet.
- Scanner memakai beberapa lapis pembaca: `BarcodeDetector`, `ZXing`, `jsQR`, dan fallback `Quagga2`.
- Flash scanner dicoba melalui beberapa metode browser agar peluang aktif lebih besar di Android/iPhone.

Catatan penting:

- Fitur import Excel membutuhkan dukungan Google Apps Script pada file `google-apps-script-import-data-obat.gs`.
- Import Excel data obat sekarang wajib mendapat response JSON `ok: true` dari Apps Script, lalu website mengambil ulang data dari Google Sheet. Jika URL Web App salah atau Apps Script menulis ke spreadsheet lain, website akan menampilkan error dan tidak menimpa cache lokal.
- Target import data obat di Apps Script: spreadsheet `1jdtxpAZ-G545QfvbktjAihy2xXJeD8GbUFUx7W1TPdk`, sheet `data_obat`.
- Mapping data obat baru sudah didukung di pencarian: `kode` dibaca sebagai barcode, `nama` sebagai nama obat, `satuan_1` sampai `satuan_3` sebagai level satuan, dan `harga_jual_1` sampai `harga_jual_3` sebagai harga jual. Harga ringkas seperti `3`, `20`, `22`, atau `9.5` otomatis ditampilkan sebagai ribuan rupiah.
- Jika kolom `stok` dari file baru berisi tanggal, nilai tersebut tidak lagi ditampilkan sebagai stok agar review obat tidak menyesatkan.
- Perbaikan 01/06/2026: data stok dari file Excel baru dibaca dari alias `stok_real`, `stok_asli`, `sisa_stok`, atau `sisa_stok_box`. Paste `google-apps-script-api-search-box-final.gs` ke Apps Script `API Search Box`, deploy Web App versi baru, lalu tekan `Sinkronkan`.
- Fitur share slip gaji otomatis awal bulan disiapkan pada file `google-apps-script-slip-gaji-bulanan.gs`.
- Jika slip gaji tanggal 1 belum terkirim karena trigger belum aktif/terpasang setelah jam 08.00 WIB, jalankan `sendSalarySlipsThisMonthNow()` untuk catch-up manual. Untuk pemasangan rutin berikutnya jalankan `setupMonthlySalarySlipAutomationWithWhatsappAndCatchUp()`.
- Jika scanner/flash berbeda perilaku antar HP, penyebabnya biasanya batasan browser dan izin kamera perangkat.
- Setelah deploy, browser mobile kadang masih memakai cache lama. Tutup-buka ulang browser atau hard refresh jika tampilan belum berubah.

## Backup Apps Script Slip Gaji

File backup:

`google-apps-script-slip-gaji-bulanan.gs`

Fungsi yang disiapkan:

- Membaca data slip dari sheet `Slip_Gaji`.
- Membaca email dan WhatsApp dari sheet `data_karyawan` jika kolom kontak tidak ada di `Slip_Gaji`.
- Membuat PDF slip gaji per karyawan.
- Menyimpan PDF ke folder Drive `slip_gaji_pdf`.
- Mengirim PDF ke email.
- Mengirim notifikasi atau link PDF ke WhatsApp.
- Membuat trigger otomatis setiap tanggal 1 jam 08.00 WIB.

Fungsi penting di Apps Script:

- `setupMonthlySalarySlipAutomation()` untuk memasang trigger otomatis.
- `setupMonthlySalarySlipAutomationWithWhatsapp()` untuk memasang trigger otomatis sekaligus mengaktifkan email, WhatsApp, dan link PDF.
- `sendSalarySlipsNow()` untuk test manual.
- `sendCurrentSalarySlipToYolanNow()` untuk test slip NIP yang sedang dipilih di `Slip_Gaji!E7` ke `yolanalfarel@gmail.com` dan WhatsApp `08128247474`.
- `sendSalarySlipsForPeriod('Mei 2026')` untuk mengirim periode tertentu.

Script Properties minimal:

- `SLIP_EMAIL_ENABLED=true`
- `SLIP_WA_ENABLED=true` jika WhatsApp dipakai.
- `SLIP_SHARE_PDF_LINK=true` agar link PDF di WhatsApp bisa dibuka.
- `WA_PROVIDER=fonnte` atau `wablas` atau `generic`.
- `FONNTE_TOKEN=token_fonnte` jika memakai Fonnte.
- `WABLAS_TOKEN=token_wablas`, `WABLAS_SECRET_KEY=secret_key_wablas`, dan `WABLAS_DOMAIN=https://domain-wablas` jika memakai Wablas.
- `SLIP_PRINT_PORTRAIT=true` agar PDF slip lebih pas di kertas A4.
- `SLIP_ENSURE_OUTER_BORDER=true` agar garis tepi slip ikut tercetak.
