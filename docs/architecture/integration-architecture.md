# Arsitektur Integrasi — Indo Apotek

Status: direkonsiliasi 2026-07-28; current-state terverifikasi source (BMM `bmad-document-project` step 7, 2026-07-27)
Sumber: `assets/*.js`, `google-apps-script-api-search-box-final.gs`, `google-apps-script-absensi-api.gs`, `tools/gas-a/`, `tools/gas-script-1/`, `tools/gas-projects.json`
Detail per-bagian: lihat `frontend-gas-data-store.md`; detail action/payload: `../api/gas-contracts.md`.

## 1. Peta bagian

| Part | Peran | Sumber kebenaran deploy | Runtime |
|---|---|---|---|
| `frontend` | UI statis multi-halaman + clean routes | Root repo → GitHub Pages branch `main` | Browser, `https://indoapotek.my.id` |
| `gas-data-auth` (GAS A) | Auth, session, user, data obat, restok, PO, log, profil | `tools/gas-a/` (clasp, scriptId `1oj9Ff…`) | Apps Script Web App `AKfycbzk3yq…` |
| `gas-attendance-payroll` (GAS B) | Absensi foto/GPS, monitoring, payroll, slip gaji | `tools/gas-script-1/` (clasp, scriptId `1_WgOm…`) | Apps Script Web App `AKfycbx7fkoL…` |
| Data store | Persistensi | — | Google Sheets ×2 + Drive (`Foto_Absensi`, `slip_gaji_pdf`) |

## 2. Titik integrasi

| # | Dari → Ke | Tipe | Detail |
|---|---|---|---|
| 1 | frontend → GAS A | HTTPS `fetch` POST/GET JSON | `postToApi` (`assets/home-dashboard.js`) menempelkan `sessionToken`+identitas dari `sessionStorage` ke tiap payload |
| 2 | frontend → GAS B | HTTPS `fetch` POST/GET JSON | `assets/attendance.js`, `assets/ess.js`; selalu bawa `sessionToken` |
| 3 | GAS A → Spreadsheet A | SpreadsheetApp | Sheet `user`, `data_obat`, `auth_sessions`, `pharmacy_profile`, dst. |
| 4 | GAS B → Spreadsheet B | SpreadsheetApp | `Form_Responses` (+sheet respons lain), `data_karyawan`, `log_slip_gaji` |
| 5 | **GAS B → Spreadsheet A (cross-read)** | SpreadsheetApp lintas file | `validateAbsensiSession_` membaca `auth_sessions`; profil apotek/GPS dari `pharmacy_profile` |
| 6 | GAS B → Drive | DriveApp | Simpan foto absensi & PDF slip gaji |

Titik integrasi #5 adalah sambungan paling kritis: **session yang diterbitkan GAS A adalah gerbang wajib semua aksi GAS B**.

## 3. Alur autentikasi lintas bagian

```text
Browser                    GAS A                        Sheet auth_sessions          GAS B
  │  POST action=login       │                                 │                       │
  ├─────────────────────────►│ validasi sheet `user`           │                       │
  │                          ├─ createAuthSession_ (:255) ────►│ token+role+expiresAt  │
  │◄─ token,role,expiresAt ──┤   (+12 jam)                     │                       │
  │  simpan sessionStorage   │                                 │                       │
  │  nadhira.authSession     │                                 │                       │
  │                          │                                 │                       │
  │  POST {action, sessionToken, …}  (aksi sensitive GAS A)    │                       │
  ├─────────────────────────►│ validatePharmacySession_ (:291)─┤ lookup+expiry check   │
  │                          │ applyPharmacySession_ (:330) — identitas DITIMPA dari session
  │                          │                                 │                       │
  │  POST {action, sessionToken, …}  (semua aksi GAS B)        │                       │
  ├────────────────────────────────────────────────────────────┼──────────────────────►│
  │                          │                                 │◄── cross-read ────────┤ validateAbsensiSession_ (:278)
  │                          │                                 │    applyAbsensiSession_ (:311)
  │  logout ────────────────►│ syncAuthSession_ (:232) hapus token                     │
```

Properti kunci:
- Role/identitas efektif di kedua backend **ditimpa dari session sheet**, bukan dipercaya dari input klien.
- GAS B menolak semua request tanpa token valid (gerbang di `doGet` `:91` dan `doPost` `:147`).
- GAS A (Epic 1 fase 2): aksi *sensitive read* lewat gerbang session; aksi *public read* (`getPharmacyProfile`, `getAttendanceShiftSettings`, `getDataObatFilter`) tetap terbuka by design.
- Gerbang admin GAS B: `isAbsensiAdmin_` (`:2216`) untuk aksi payroll/koreksi absensi.

## 4. Aliran data utama antar bagian

1. **Login** — frontend → GAS A → `auth_sessions`; token dikembalikan dan dipakai kedua backend.
2. **Absensi** — frontend ambil shift/profil dari GAS A, submit foto+GPS ke GAS B; GAS B validasi session (cross-read A), tulis `Form_Responses` + Drive.
3. **Data obat/restok/PO** — frontend ↔ GAS A; cache lokal (localStorage/IndexedDB) untuk UX.
4. **Payroll/slip** — frontend (admin) → GAS B; agregasi absensi + `data_karyawan` → PDF Drive + `log_slip_gaji`.

## 5. Kontrak antar bagian

- Payload request: JSON `{ action, sessionToken, username, email, role, …payload }` — identitas otomatis dari `postToApi`/`attendance.js`.
- Response **tidak seragam**: GAS A dominan `{ success, ok, … }`, GAS B dominan `{ ok, success?, … }` — kandidat epic standardisasi (lihat `../api/gas-contracts.md` §2).
- Perubahan schema sheet = perubahan kontrak lintas bagian → wajib update `gas-contracts.md` + regression checklist.

## 6. Topologi source ↔ deploy (terverifikasi 2026-07-27)

| Part | Source clasp | Mirror referensi di git | Status verifikasi |
|---|---|---|---|
| GAS A | `tools/gas-a/Kode.js` | `google-apps-script-api-search-box-final.gs` | **byte-identik** (sha256 `ae52804…`) |
| GAS B | `tools/gas-script-1/Kode.js` | `google-apps-script-absensi-api.gs` | **byte-identik** (sha256 `7f0bd9f…`, 2307 baris) |
| Frontend | root repo | — | live `https://indoapotek.my.id` HTTP 200; `nadhirafarma.github.io/absensi_apotek` redirect ke CNAME |

Root `.clasp.json` = **GAS B** (canonical). Deploy GAS A dijalankan dari `tools/gas-a/`. Lihat `../ops/deploy-sop.md`.

## 7. Keputusan arsitektur yang sudah ditetapkan

| Keputusan | Aturan |
|---|---|
| Source kanonik GAS | Clasp folder (`tools/gas-a/`, `tools/gas-script-1/`); root `.gs` mirror review/rollback |
| Ownership auth_sessions | GAS A menerbitkan dan mengelola session; GAS B hanya cross-read |
| Response key kanonik | `ok`; alias `success` transisi sampai cleanup post-regression |
| Public GET allowlist | Hanya resource yang disetujui dokumen ini; deny-by-default untuk selain itu |
| HTTP mutation | POST + LockService; GET tidak boleh mengubah Sheets, Drive, atau session |
| Identitas | Server overwrite dari session; client field `role`/`username`/`actor`/`nama` tidak authoritative |
| Schema change | Wajib update `gas-contracts.md` + regression checklist sebelum deploy |
| GAS A write scope | Session + server-side role check wajib per action; UI hide bukan otorisasi (gap open, lihat §8) |

## 8. Risiko integrasi current-state

1. `ok` vs `success` antar backend → cabang penanganan ganda di frontend; cleanup Fase D setelah full regression.
2. Mirror drift bila SOP salin-setelah-edit dilewati — mitigasi: `node tools/check_gas_mirrors.js` wajib sebelum deploy.
3. GAS B bergantung schema `auth_sessions` GAS A; perubahan kolom wajib dikoordinasikan.
4. Public read GAS A (`getPharmacyProfile`, `getAttendanceShiftSettings`, `getDataObatFilter`) terbuka by design, terdokumentasi dan ter-allowlist.
5. **GAS A write authorization — gap terbuka (2026-07-28):** sensitive reads sudah gated (Epic 1); write handler di `doPost` belum semuanya punya session check dan role enforcement — lihat `security/role-permission-matrix.md §74-80` dan `api/gas-contracts.md` action classification table. Perbaikan via Story 3.1.
6. **GAS A generic GET sheet — gap terbuka:** `doGet?sheet=<nama>` selain `user` dan `data_obat` tidak ada deny-by-default; termasuk potensi expose `auth_sessions`. Perbaikan via Story 3.1.
7. **Credential — gap terbuka (perlu preflight):** source menunjukkan password plaintext di sheet dan reset tanpa token sekali pakai. Status live perlu dikonfirmasi sebelum scope fix ditetapkan.
8. Kode repo GAS bisa lebih baru dari deployment live; deployment version dicatat per-story di `gas-contracts.md`.
