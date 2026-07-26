# Indo Apotek — Website & Sistem Internal Apotek

Aplikasi web statis (HTML/CSS/JS, tanpa build system) untuk operasional apotek:
login & manajemen pengguna, data obat, restok & surat pesanan, absensi
foto+GPS, monitoring presensi, payroll & slip gaji.

- **Live:** https://indoapotek.my.id (GitHub Pages, custom domain via `CNAME`)
- **Remote:** https://github.com/nadhirafarma/absensi_apotek.git — Pages serve
  dari branch `main` root.

## Arsitektur singkat

| Bagian | Lokasi source | Runtime |
|---|---|---|
| Frontend | root repo (`*.html`, `assets/`, clean routes per folder) | GitHub Pages |
| GAS A — auth, data obat, restok, PO, log, profil | `tools/gas-a/` (clasp) + mirror root `google-apps-script-api-search-box-final.gs` | Apps Script Web App |
| GAS B — absensi, monitoring, payroll, slip gaji | `tools/gas-script-1/` (clasp) + mirror root `google-apps-script-absensi-api.gs` | Apps Script Web App |
| Data store | — | Google Sheets ×2 + Google Drive |

## Sumber kebenaran (PENTING)

- **Working tree ini = source repo = artefak deploy frontend.** Deploy frontend
  = commit + push ke `main`. Tidak ada folder build/deploy terpisah.
- **GAS:** edit di folder clasp (`tools/gas-a/`, `tools/gas-script-1/`), salin
  ke mirror root, cek `node tools/check_gas_mirrors.js`, lalu `clasp push` dari
  folder clasp masing-masing. Root `.clasp.json` = GAS B.
- Detail lengkap: `docs/ops/deploy-sop.md`. Jangan ikuti catatan deploy lama
  (folder `.github-deploy\...`) — sudah tidak berlaku sejak 2026-07.

## Dokumentasi

Mulai dari **`docs/index.md`** (master index): arsitektur, kontrak API GAS,
matriks role/permission, regression checklist, SOP deploy, PRD & epics.

## Tooling

- `tools/check_gas_mirrors.js` — verifikasi mirror root ↔ clasp byte-identik.
- `tools/smoke_gas_a.js` — smoke test gerbang session GAS A live.
- `tools/live_probe.js` — probe deployment live.
- `tools/generate_clean_routes.js` — regenerasi clean routes setelah ubah SPA.
