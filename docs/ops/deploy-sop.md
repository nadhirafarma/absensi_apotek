# SOP Source ↔ Deploy — Indo Apotek

Status: draft current-state (BMM bmad-document-project, 2026-07-26)

## Prinsip
Working tree ini (`c:\Users\asus\Documents\Website Indo Apotek`) ADALAH sumber
kebenaran untuk frontend. GitHub Pages membaca langsung dari branch yang
di-push (lihat `CNAME`, `.nojekyll` di root). Tidak ada folder build terpisah
yang teridentifikasi — repo == deploy artifact untuk frontend.

## Sebelum commit apa pun
1. `git status` — pastikan tidak ada file tak terduga (temp CSS audit,
   `$null`, dsb) ikut ter-stage.
2. Review `.gitignore` — pastikan folder besar/sensitif (`backups/`,
   `_bmad-output/` bila perlu) ditangani sesuai kebijakan, bukan dihapus
   diam-diam.
3. Diff GAS: bandingkan `google-apps-script-absensi-api.gs` (root) dengan
   `tools/gas-script-1/Kode.js` sebelum push — keduanya harus identik atau
   didokumentasikan perbedaannya.

## Deploy frontend (GitHub Pages)
1. Commit perubahan HTML/CSS/JS di root/assets/subfolder halaman.
2. Branch kerja lokal saat ini: `work/local-regression-20260719` (ahead of
   `origin/main` hanya commit lokal yang belum di-push).
3. Push ke branch yang dikonfigurasi Pages. Default remote `origin/main`
   (`https://github.com/nadhirafarma/absensi_apotek.git`). Verifikasi Settings
   → Pages: root branch mana yang live (`⚠ perlu validasi` di UI GitHub).
4. **Jangan force-push `main`** tanpa backup. Prefer merge/PR dari branch kerja.
5. Tunggu build Pages, verifikasi via URL live (`CNAME`) — bukan hanya lokal.
6. Rollback: revert commit, push ulang (tidak ada mekanisme rollback binary
   terpisah karena repo == deploy).


## Deploy GAS A (dataObatAuth)
1. Edit source di root (`google-apps-script-*.gs`) ATAU Apps Script editor
   langsung — **tetapkan satu arah sumber kebenaran** untuk part ini
   (`⚠ belum ada clasp config untuk GAS A` — cek `.clasp.json` root sebelum
   asumsi).
2. Deploy sebagai Web App versi baru dari Apps Script editor.
3. Update `AUTH_API_URL`/`ABSENSI_API_URL` di `assets/*.js` bila URL deployment
   berubah.
4. Verifikasi endpoint via `tools/live_probe.js` sebelum menganggap selesai.

## Deploy GAS B (attendanceAndPayroll)
**Sumber kebenaran:** `tools/gas-script-1/Kode.js` (clasp aktif; scriptId di
`.clasp.json` / `tools/gas-projects.json`).
`google-apps-script-absensi-api.gs` di root adalah **mirror referensi** —
wajib byte-identik dengan clasp setelah setiap edit, bukan tempat edit
langsung.

1. Edit `tools/gas-script-1/Kode.js` (source clasp).
2. Salin ke mirror root:
   `Copy-Item tools\gas-script-1\Kode.js google-apps-script-absensi-api.gs -Force`
   lalu cek hash sama.
3. `clasp push` dari workspace root (`.clasp.json` menunjuk
   `rootDir: tools/gas-script-1`) — butuh clasp login.
4. Deploy versi Web App baru via clasp atau Apps Script editor.
5. Jangan deploy dari mirror root; mirror hanya untuk review/diff/backup di git.


## Yang dikecualikan dari paket deploy GitHub Pages
- `_bmad/`, `_bmad-output/` — artefak internal BMAD, tidak dibutuhkan
  runtime website.
- `docs/` — dokumentasi, aman disertakan di source repo tetapi tidak perlu
  di-serve sebagai halaman publik (tidak masalah jika ikut ter-deploy karena
  statis, tetapi tidak untuk dipromosikan sebagai halaman produk).
- `tools/`, `backups/` — tooling & backup, bukan runtime asset.
- File temporer (`tmp-css-*.txt`, `.css-target-audit.txt`, `.quick-search-*`,
  `$null`) — kandidat cleanup, tambahkan ke `.gitignore` jika memang tidak
  dipakai lagi.

## ⚠ Perlu validasi
- Branch/folder Pages sebenarnya (root vs `/docs` vs `gh-pages`) — cek repo
  Settings → Pages.
- Apakah GAS A memiliki clasp project sendiri atau full manual.
- Kebijakan final untuk `backups/` (ignore vs commit) — lihat item audit repo.
