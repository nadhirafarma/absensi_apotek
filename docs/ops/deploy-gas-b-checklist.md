# Deploy GAS B + Checklist Tes Pasca-Deploy

Status: focused operator guide for Apps Script absensi/payroll (`GAS B`).

## Scope
Dokumen ini hanya untuk deploy backend absensi/payroll yang sumber kebenarannya ada di:

- `tools/gas-script-1/Kode.js` — source deploy kanonik
- `google-apps-script-absensi-api.gs` — mirror review/rollback, wajib identik

Dokumen ini **tidak** mencakup deploy frontend statis dan **tidak** untuk
`google-apps-script-slip-gaji-bulanan.gs`.

## Aturan aman
- Jangan tulis token, Spreadsheet ID, script ID, deployment ID, URL file Drive, email, atau nominal payroll mentah di log bukti.
- Deploy dilakukan ke **deployment Web App yang sudah dipakai frontend**, kecuali memang sengaja mengganti URL.
- Jangan deploy `slip_gaji_bulanan` bersamaan. Pisahkan agar rollback mudah.
- Sebelum deploy, simpan versi rollback yang masih stabil.

## Pre-deploy
- [ ] `git status` bersih untuk file target deploy.
- [ ] `node --check tools/gas-script-1/Kode.js`
- [ ] `node tools/check_gas_mirrors.js`
- [ ] Mirror `google-apps-script-absensi-api.gs` identik dengan source clasp.
- [ ] Backup versi live di Apps Script editor atau catat version/rollback aktif.
- [ ] Siapkan akun uji owner/admin/karyawan.
- [ ] Siapkan bukti pembanding di `log_slip_gaji`: minimal satu row normal, dan bila ada satu row nominal nol/negatif untuk validasi.
- [ ] Pastikan perubahan frontend yang bergantung pada param filter sudah ada di server statis bila ingin uji UI penuh.

## Langkah deploy — manual editor (disarankan)
1. Buka project Apps Script absensi.
2. Buka file `Kode.gs`.
3. Ganti isi file dengan seluruh isi `tools/gas-script-1/Kode.js`.
4. Simpan.
5. Buka **Deploy → Manage deployments**.
6. Pilih deployment Web App yang sudah dipakai aplikasi.
7. Klik **Edit** → **New version** → Deploy.
8. Jangan ubah URL konsumsi frontend kecuali Anda memang membuat deployment baru.
9. Catat waktu deploy, executor, version baru, dan rollback version.

## Langkah deploy — clasp (opsional)
`rootDir` untuk GAS B sudah diarahkan ke `tools/gas-script-1` oleh `.clasp.json`, jadi jalankan dari root repo.

```bash
clasp push --force
```

Sesudah `push`, tetap disarankan update deployment aktif lewat Apps Script editor agar tidak salah membuat deployment baru dengan URL berbeda.

## Checklist tes pasca-deploy

### A. Kompatibilitas kontrak lama
- [ ] `GET action=listSalarySlipHistory` tanpa filter masih mengembalikan `ok/success`, `history`, `total`, `canDelete`.
- [ ] `POST action=listSalarySlipHistory` tanpa filter masih kompatibel dengan klien lama.
- [ ] Request lama tanpa `month/year/startDate/endDate/page/limit` tidak error.

### B. Read path histori tidak lagi memodifikasi data
- [ ] Buka `log_slip_gaji` sebelum uji.
- [ ] Panggil `listSalarySlipHistory` sebagai admin.
- [ ] Buka kembali `log_slip_gaji` sesudah uji.
- [ ] Tidak ada row berubah/terhapus akibat read biasa.

### C. Perilaku histori baru
- [ ] Row dengan `netSalary > 0` tampil.
- [ ] Row dengan `netSalary = 0` tampil.
- [ ] Row dengan `netSalary < 0` tampil.
- [ ] Row dengan nominal kosong/tidak parse tidak hilang; UI menandai nominal tidak tersedia.
- [ ] Dedupe berdasarkan `fileId`/fallback berjalan; tidak ada duplikat baru pada hasil list.
- [ ] Sort terbaru dahulu; jika timestamp sama, urutan stabil.

### D. Filter dan pagination
- [ ] `month` bekerja.
- [ ] `year` bekerja.
- [ ] `startDate`/`endDate` bekerja.
- [ ] `page`/`limit` bekerja.
- [ ] `filteredTotal`, `page`, `limit`, `hasMore` dikembalikan bila filter/page dipakai.
- [ ] Input invalid ditolak aman:
  - [ ] bulan `13`
  - [ ] tanggal awal > tanggal akhir
  - [ ] `limit > 100`
  - [ ] `page < 1`

### E. Batas akses
- [ ] Admin melihat semua histori yang sesuai filter.
- [ ] `employeeId` hanya mempersempit hasil admin.
- [ ] Non-admin tetap hanya menerima histori milik mereka sendiri.
- [ ] Non-admin tidak bisa memperluas hasil dengan `employeeId`, `name`, atau field klien lain.

### F. Generate, idempotensi, partial success
- [ ] Generate slip untuk periode yang **belum ada** → sukses normal, satu PDF, satu row histori.
- [ ] Generate slip untuk periode yang **sudah ada** → respons `reused: true`, tidak menambah PDF/row baru.
- [ ] Jika PDF berhasil tetapi histori gagal dicatat, respons mengandung `partial`, `fileCreated: true`, `historySaved: false`, dan pesan jelas.
- [ ] Batch manual tetap memberi hasil per karyawan; sukses/gagal tidak saling menimpa.

### G. UI pasca-deploy
Jalankan hanya jika frontend statis yang memanggil endpoint baru sudah ter-publish.

#### Legacy Presensi
- [ ] Filter bulan/tahun default bulan berjalan.
- [ ] Filter tanggal tunggal.
- [ ] Filter rentang tanggal.
- [ ] Tombol Terapkan Filter.
- [ ] Tombol Reset.
- [ ] Jumlah hasil dan pagination.
- [ ] Empty state saat hasil kosong.
- [ ] Nominal nol/negatif tampil.

#### ESS / Monitoring
- [ ] Search monitoring tetap jalan.
- [ ] Filter histori ESS jalan.
- [ ] Count memakai hasil terfilter, bukan raw array.
- [ ] Pagination ESS jalan.
- [ ] Nominal nol/negatif tampil.

### H. Kasus Ayu Novalia
Lakukan klasifikasi dengan bukti redacted:
- [ ] Cek apakah row ada di `log_slip_gaji` untuk periode target.
- [ ] Cek apakah admin menerima row itu dari `listSalarySlipHistory`.
- [ ] Cek apakah akun Ayu menerima row itu dari `listSalarySlipHistory`.
- [ ] Cek apakah file PDF target ada di Drive.
- [ ] Tentukan kasus:
  - [ ] Drive ada, Sheet tidak ada
  - [ ] Admin lihat, Ayu tidak
  - [ ] API kirim, UI tidak render
  - [ ] Nominal nol/negatif
  - [ ] Lainnya (catat bukti)

### I. Log dan bukti
- [ ] Console browser bersih dari error baru.
- [ ] Execution log GAS dicatat untuk uji generate/list.
- [ ] Bukti disimpan redacted.

## Template bukti deploy
```text
Date:
Executor:
Source commit:
Deployment updated:
Rollback version:
Akun uji: owner/admin/karyawan

Checklist pass:
Checklist fail:
Checklist blocked:

Catatan Ayu Novalia:
- row sheet:
- response admin:
- response Ayu:
- file Drive:
- klasifikasi:
```

## Selesai bila
- deploy GAS B sukses,
- checklist wajib terisi pass/fail/blocked,
- tidak ada data sensitif tertulis,
- rollback version tercatat.
