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

Nama kolom `data_obat` yang dibaca pencarian:

- `kode`, `nama`, `kategori`, `stok`, `satuan_beli`, `harga_beli`, `stok_min`
- `satuan_1`, `satuan_2`, `satuan_3`, `satuan_4`
- `isi_1`, `isi_2`, `isi_3`, `isi_4`
- `harga_jual_1`, `harga_jual_2`, `harga_jual_3`, `harga_jual_4`
- `expired`, `suplier`, `supplier`, `pabrik`, `lokasi`, `no_batch`

Kolom `stok` sekarang dibaca hanya dari header `stok`; sistem tidak lagi mengambil nilai dari `harga_beli`, `satuan_beli`, atau fallback posisi kolom.

Cache tersimpan di browser masing-masing pengguna. Kalau data di Google Sheet berubah, tekan `Sinkronkan` untuk mengambil data terbaru.

Halaman pencarian juga menyediakan tombol scanner di dalam kolom pencarian untuk membaca barcode/QR lewat kamera browser.

## Backup Perubahan Terakhir

Backup ini dibuat pada `26/05/2026` setelah deploy perbaikan terakhir.

Live website:

`https://nadhirafarma.github.io/absensi_apotek/`

Commit deploy terakhir:

`eab6df7c70f0dbd32c3de4017b7affff00bf9d55`

Perubahan yang sudah masuk:

- Menu utama tetap sederhana dengan dua pilihan: `Absensi Face ID` dan `Cari Data Obat`.
- Halaman `cari-obat.html` memakai cache lokal pengguna melalui IndexedDB.
- Tombol `Sinkronkan` dipindahkan ke header bersama tombol `Menu` dan `Absensi`.
- Kolom pencarian obat dibuat lebih ringkas, dengan tombol scanner menyatu di sisi kanan input.
- Hasil pencarian obat tampil sebagai pop-up di bawah kolom pencarian, sehingga tidak mengganggu pengetikan.
- Saat pop-up hasil pencarian terbuka, teks/header/footer yang mengganggu layar mobile disembunyikan.
- Nama obat diberi blok warna variatif sesuai panjang nama agar lebih mudah dibaca.
- Review obat dibuat compact untuk mobile: nama obat, barcode, stok, satuan beli, expired, dan harga per level.
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
- Perbaikan 01/06/2026: backend `data_obat` sekarang membaca stok hanya dari kolom `stok` resmi. Paste `google-apps-script-api-search-box-final.gs` ke Apps Script `API Search Box`, deploy Web App versi baru, lalu tekan `Sinkronkan`.
- Perbaikan lanjutan 01/06/2026: tampilan stok tidak lagi menambahkan `satuan_beli`, karena satuan beli sudah tampil sebagai baris terpisah.
- Perbaikan lanjutan 01/06/2026: jika ada header kolom duplikat di `data_obat`, backend memakai kemunculan pertama agar kolom `stok` tidak tertimpa nilai dari kolom lain.
- Perbaikan lanjutan 01/06/2026: backend membaca `data_obat` dengan `getDisplayValues()` agar stok seperti `23.6` tidak berubah menjadi tanggal saat dikirim ke website.
- Fitur share slip gaji otomatis awal bulan disiapkan pada file `google-apps-script-slip-gaji-bulanan.gs`.
- Jika slip gaji tanggal 1 belum terkirim karena trigger belum aktif/terpasang setelah jam 08.00 WIB, jalankan `sendSalarySlipsThisMonthNow()` untuk catch-up manual. Untuk pemasangan rutin berikutnya jalankan `setupMonthlySalarySlipAutomationWithWhatsappAndCatchUp()`.
- Untuk diagnosa slip gaji, jalankan `checkSalarySlipAutomationStatus()` dan lihat apakah email/WhatsApp karyawan terbaca, token provider tersedia, serta trigger bulanan aktif.
- Jika scanner/flash berbeda perilaku antar HP, penyebabnya biasanya batasan browser dan izin kamera perangkat.
- Setelah deploy, browser mobile kadang masih memakai cache lama. Tutup-buka ulang browser atau hard refresh jika tampilan belum berubah.

## Backup Apps Script Slip Gaji

File backup:

`google-apps-script-slip-gaji-bulanan.gs`

Per 01/06/2026 script slip gaji disederhanakan. Setelah paste ulang, cukup pakai fungsi berikut:

- `cekStatusSlipGaji()` untuk mengecek NIP, email, WhatsApp, token provider, dan trigger.
- `testKirimSlipGajiKeYolan()` untuk test kirim slip NIP yang sedang dipilih ke email/WA Yolan.
- `testKirimSemuaSlipKeYolan()` untuk mengirim semua PDF slip karyawan dalam satu email ke Yolan.
- `kirimSlipGajiSekarang()` untuk kirim semua slip periode bulan lalu sekarang.
- `setupSlipGajiOtomatis()` untuk memasang trigger rutin tanggal 1 jam 08.00 WIB. Trigger ini mengirim satu email berisi semua slip ke Yolan.
- `runMonthlySalarySlipAutomation()` hanya untuk trigger otomatis.

Semua fungsi tersebut menulis hasil ke `Logger.log`, jadi detail penyebab gagal bisa dilihat dari `Log eksekusi`.

Fungsi yang disiapkan:

- Membaca data slip dari sheet `Slip_Gaji`.
- Membaca email dan WhatsApp dari sheet `data_karyawan` jika kolom kontak tidak ada di `Slip_Gaji`.
- Membuat PDF slip gaji per karyawan.
- Menyimpan PDF ke folder Drive `slip_gaji_pdf`.
- Mengirim PDF ke email.
- Mengirim semua PDF slip dalam satu email ke Yolan untuk mode HRD/bulanan.
- Mengirim notifikasi atau link PDF ke WhatsApp.
- Membuat trigger otomatis setiap tanggal 1 jam 08.00 WIB.

Script Properties minimal:

- `SLIP_EMAIL_ENABLED=true`
- `SLIP_WA_ENABLED=true` jika WhatsApp dipakai.
- `SLIP_SHARE_PDF_LINK=true` agar link PDF di WhatsApp bisa dibuka.
- `WA_PROVIDER=fonnte` atau `wablas` atau `generic`.
- `FONNTE_TOKEN=token_fonnte` jika memakai Fonnte.
- `WABLAS_TOKEN=token_wablas`, `WABLAS_SECRET_KEY=secret_key_wablas`, dan `WABLAS_DOMAIN=https://domain-wablas` jika memakai Wablas.
- `SLIP_PRINT_PORTRAIT=true` agar PDF slip lebih pas di kertas A4.
- `SLIP_ENSURE_OUTER_BORDER=true` agar garis tepi slip ikut tercetak.

## Preview Login Internal

File login lokal:

`login.html`

Per 01/06/2026 halaman login internal disiapkan untuk GitHub Pages.

- `login.html` menampilkan UI login website yang responsive saat dibuka di desktop, Android, dan iOS.
- `assets/login.css` mengatur tampilan responsive login agar muat di layar tanpa preview perangkat.
- `assets/login.js` mengambil dropdown user dengan action `listLoginUsers`, mengirim login dengan action `login`, menyimpan username/password hanya jika dicentang, dan membuka modal lupa password sebelum action `resetPassword`.
- `assets/auth-guard.js` dipasang di `index.html`, `absensi.html`, dan `cari-obat.html` agar pengguna diarahkan ke login jika belum ada sesi.
- Sesi login disimpan sementara di `sessionStorage`; password hanya disimpan di browser lokal jika opsi `Ingat username & password` dicentang.
- `index.html` memakai avatar akun dan menu logout dari sesi login.
- `reset.html` menyimpan password baru melalui fungsi Apps Script `updateResetPassword()`. Password baru minimal 6 karakter dan wajib kombinasi huruf serta angka.
