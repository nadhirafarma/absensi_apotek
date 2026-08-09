# SOP Source ↔ Deploy — Indo Apotek

Status: current-state (BMM bmad-document-project, 2026-07-26; validasi 2026-07-27)

## Prinsip
Working tree ini (`c:\Users\asus\Documents\Website Indo Apotek`) ADALAH sumber
kebenaran untuk frontend. GitHub Pages membaca langsung dari branch yang
di-push (lihat `CNAME`, `.nojekyll` di root). Tidak ada folder build terpisah
yang teridentifikasi — repo == deploy artifact untuk frontend.

## Sebelum commit apa pun
1. `git status` — pastikan tidak ada file tak terduga (temp CSS audit,
   `$null`, dsb) ikut ter-stage.
2. Review `.gitignore` — pastikan folder besar/sensitif (`backups/`,
   `_bmad/`, `_bmad-output/`) ditangani sesuai kebijakan, bukan dihapus
   diam-diam.
3. Diff GAS: bandingkan root mirror dengan source clasp sebelum push — keduanya
   harus identik via `node tools/check_gas_mirrors.js`, bukan sekadar diff mata.
4. Pastikan perubahan security tidak memasukkan token, password, URL file Drive,
   email, atau data payroll mentah ke docs/log/commit.

## Bukti deploy wajib
Catat di regression checklist sebelum status story menjadi done:

- commit SHA;
- script ID dan environment;
- deployment ID/version baru dan rollback version;
- timestamp serta role akun test;
- hasil smoke/checklist redacted;
- dampak data/Drive yang perlu remediasi operator.

Deploy terpisah untuk perubahan boundary publik, write authorization,
credential/reset, payroll mutation/delete, dan PDF privacy. Jangan menggabungkan
semuanya dalam satu deploy besar.

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
**Sumber kebenaran:** `tools/gas-a/Kode.js` (clasp; scriptId
`1oj9FfGGSv4FNiaK6kPqV_39kg2vESJ4RfUg_FH8mrpnzVhz2u42AiE5M`, config di
`tools/gas-a/.clasp.json`). `google-apps-script-api-search-box-final.gs` di
root adalah **mirror referensi** — wajib byte-identik dengan clasp
(terverifikasi identik 2026-07-27, sha256 `ae52804…`).

1. Edit `tools/gas-a/Kode.js` (source clasp).
2. Salin ke mirror root:
   `Copy-Item tools\gas-a\Kode.js google-apps-script-api-search-box-final.gs -Force`
   lalu verifikasi: `node tools/check_gas_mirrors.js`.
3. `clasp push` dari dalam `tools/gas-a/` (JANGAN dari root — root
   `.clasp.json` adalah milik GAS B).
4. Deploy sebagai Web App versi baru via clasp atau Apps Script editor.
   **Catat rollback version sebelum menyetujui versi baru.**
5. Update `AUTH_API_URL`/`ABSENSI_API_URL` di `assets/*.js` bila URL deployment
   berubah.
6. Verifikasi endpoint via `tools/live_probe.js` + `tools/smoke_gas_a.js`
   (public read lolos; sensitive read dan write tanpa token ditolak; forged
   action/role ditolak). Catat deployment ID/version dan hasil redacted.
7. Untuk perubahan write authorization atau credential: gunakan test deployment
   atau akun uji terkendali; jangan log token, email, atau password mentah.

## Deploy GAS B (attendanceAndPayroll)
**Sumber kebenaran:** `tools/gas-script-1/Kode.js` (clasp aktif; scriptId di
`.clasp.json` / `tools/gas-projects.json`).
`google-apps-script-absensi-api.gs` di root adalah **mirror referensi** —
wajib byte-identik dengan clasp setelah setiap edit, bukan tempat edit
langsung.

Ringkasan alur:
1. Edit `tools/gas-script-1/Kode.js`.
2. Salin ke mirror root lalu verifikasi `node tools/check_gas_mirrors.js`.
3. `clasp push` dari root repo (`rootDir: tools/gas-script-1`).
4. Update deployment Web App aktif.
5. Jalankan checklist pasca-deploy khusus GAS B.

Checklist operator rinci pindah ke:
- `ops/deploy-gas-b-checklist.md`

Gunakan dokumen itu untuk:
- backup/rollback version,
- checklist kompatibilitas endpoint lama,
- verifikasi histori nol/negatif,
- filter `month/year/startDate/endDate/page/limit`,
- uji `reused: true`, partial outcome, dan kasus Ayu Novalia.

Jangan deploy dari mirror root; mirror hanya untuk review/diff/backup di git.

## Referensi deploy GAS B cepat
- canonical: `tools/gas-script-1/Kode.js`
- mirror: `google-apps-script-absensi-api.gs`
- checklist operator: `docs/ops/deploy-gas-b-checklist.md`
- regression master: `docs/qa/regression-checklist.md`

## Deploy slip gaji bulanan
Perubahan `google-apps-script-slip-gaji-bulanan.gs` / `tools/gas-script-1/slip_gaji_bulanan.js`
**jangan** digabung dalam rollout yang sama kecuali user memang meminta. Deploy terpisah
agar rollback email/WA lebih mudah.

## Yang tidak boleh dilog
- token / password / email
- Spreadsheet ID / script ID / deployment ID
- URL file Drive
- nominal payroll mentah
- data personal non-redacted

Laporan deploy cukup pakai timestamp, role akun uji, hasil pass/fail/blocked, dan
pointer ke bukti redacted.

## Status route frontend
Jika deploy GAS B bertujuan menguji filter histori baru, pastikan frontend statis yang
memakai query baru (`assets/home-dashboard.js`, `assets/ess.js`) sudah ter-publish.
Jika belum, uji endpoint dilakukan langsung via Apps Script / curl / browser console.

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

## Keputusan yang sudah ditetapkan (2026-07-27; diperbarui 2026-07-28)
- **Pages**: serve dari branch `main` root. Live terverifikasi:
  `https://indoapotek.my.id` (CNAME) HTTP 200;
  `nadhirafarma.github.io/absensi_apotek` redirect ke CNAME.
- **GAS A**: clasp project sendiri di `tools/gas-a/`;
  root `.clasp.json` tetap canonical GAS B — jangan ditimpa.
- **`backups/`**: kebijakan = **ignore**, disimpan lokal, tidak di-commit.
- **`_bmad/`, `_bmad-output/`, `.agents/`**: ignore — tooling AI lokal.
- **PDF slip** — lihat Story 3.7: perubahan izin Drive **tidak dapat di-rollback**
  setelah link lama tersebar. Rollout harus per-batch, idempotent, dengan laporan
  migrated/skipped/failed. Jangan lakukan bulk re-share tanpa persetujuan operator.
