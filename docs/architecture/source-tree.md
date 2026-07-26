# Source Tree Overview — Indo Apotek

Status: current-state (BMM bmad-document-project, 2026-07-26; update 2026-07-27)

## Root files
| File | Peran |
|---|---|
| index.html | Landing page (publik) |
| login.html | Login (publik, guarded redirect) |
| beranda.html | Home setelah login |
| absensi.html | Halaman absensi self-service |
| cari-obat.html | Pencarian data obat |
| privacy.html, terms.html | Legal |
| reset.html | Reset password |
| CNAME | Domain custom GitHub Pages |
| .nojekyll | Nonaktifkan Jekyll processing |
| logo.png | Favicon/logo |
| README.md | Dokumentasi project |
| $null | Artifak Windows (sebaiknya di-cleanup) |

## assets/
| File | Peran |
|---|---|
| app.js | Inisialisasi umum, utils, bootstrap |
| auth-guard.js | Guard session semua halaman app |
| login.js | Login form handler + GAS A call |
| home-dashboard.js | Dashboard, postToApi, GAS A helper |
| search-obat.js | Pencarian obat client-side |
| attendance.js | Absensi self-service + GAS B call |
| ess.js, ess.css | Employee Self-Service UI/API |
| landing.js, landing.css | Landing page UI |
| styles.css | Style global |
| dark-mode-fixes.css | Patch dark mode |
| ui-polish.css | Polish UI tambahan |
| login.css, attendance.css | Style spesifik halaman |
| *.png | Asset gambar (logo, reminder, landing) |
| mobile-menu/ | Komponen mobile menu |

## Subhalaman (HTML mandiri, satu file per fitur)
dashboard/, presensi/, presensi-karyawan/, monitoring-presensi/,
data-obat/, cari-data-obat/, import-data-obat/, restok-obat/,
data-karyawan/, data-role/, data-supplier/, surat-pesanan/,
akun-profil/, log-aktivitas/, manajemen-pengguna/, login/.

## Google Apps Script
| File | Peran |
|---|---|
| google-apps-script-api-search-box-final.gs | GAS A: auth, data obat, restok, PO, user, role, log, shift, profil |
| google-apps-script-absensi-api.gs | GAS B: absensi, payroll, slip gaji (root mirror) |
| google-apps-script-import-data-obat.gs | GAS import data obat terpisah |
| google-apps-script-slip-gaji-bulanan.gs | Script slip gaji bulanan |

## tools/
| File | Peran |
|---|---|
| gas-script-1/Kode.js | GAS B clasp source (canonical deploy GAS B) |
| gas-script-1/appsscript.json | Konfigurasi clasp GAS B |
| gas-a/Kode.js | GAS A clasp source (canonical deploy GAS A) |
| gas-a/.clasp.json | Config clasp GAS A (scriptId `1oj9Ff…`) |
| gas-a/reset.html | Halaman reset password GAS A |
| gas-projects.json | Referensi URL deployment |
| generate_clean_routes.js | Generator routing |
| live_probe.js | Probe deployment live |
| smoke_gas_a.js | Smoke test gerbang session GAS A |
| diagnose_gas_a.js | Diagnosa endpoint GAS A |

## docs/ (keluaran BMM)
index.md — master index dokumentasi
architecture/: frontend-gas-data-store.md, integration-architecture.md, source-tree.md
api/: gas-contracts.md
security/: role-permission-matrix.md
ops/: deploy-sop.md
qa/: regression-checklist.md
prd/: prd.md, epics.md
epic1-phase2-gas-a-session-gate.md — catatan implementasi Epic 1 fase 2
project-scan-report.json — state file scan BMM
