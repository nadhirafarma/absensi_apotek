# Dokumentasi Indo Apotek — Index

Dihasilkan dari BMM `bmad-document-project` deep scan (step 2–12 selesai
2026-07-27), lalu direkonsiliasi dengan source dan audit security pada
2026-07-28. BMM/BMAD `6.10.0` terpasang lokal di `_bmad/`; `_bmad-output/`
hanya workspace draft, bukan dependency runtime atau sumber kebenaran.

## Status validasi

- Mirror GAS A dan GAS B byte-identik dengan source clasp pada validasi
  2026-07-27.
- GitHub Pages `https://indoapotek.my.id` tercatat HTTP 200 dari branch `main`.
- ⚠ Masih perlu validasi terautentikasi: schema/data Google Sheets live, script
  dan deployment version GAS aktif, policy Drive untuk PDF, serta smoke owner/
  admin/karyawan.
- ⚠ Dokumen hanya boleh menyatakan test live lulus jika menyimpan bukti
  redacted di checklist/audit.

## Urutan sumber kebenaran

1. **Source deploy kanonik** — `tools/gas-a/Kode.js` dan
   `tools/gas-script-1/Kode.js`; root `.gs` adalah mirror review/rollback.
2. **Bukti security/status** — `security/payroll-audit-2026-07-27.md`,
   `security/gas-a-boundary-audit-2026-07-28.md`, dan status deployed bertanggal
   di `prd/epics.md`.
3. **Kontrak dan akses** — `api/gas-contracts.md`,
   `security/role-permission-matrix.md`.
4. **Product intent/backlog** — `prd/prd.md`, `prd/epics.md`.
5. **Kontrol release** — `qa/regression-checklist.md`, `ops/deploy-sop.md`, `ops/deploy-gas-b-checklist.md`.
6. `epic1-phase2-gas-a-session-gate.md` adalah catatan historis; status
   “Ready to implement” di sana tidak lagi berlaku.

## Fondasi project

1. **Arsitektur** — `architecture/frontend-gas-data-store.md`,
   `architecture/integration-architecture.md`, `architecture/source-tree.md`
2. **Role & permission** — `security/role-permission-matrix.md`
3. **Audit security** — `security/payroll-audit-2026-07-27.md`,
   `security/gas-a-boundary-audit-2026-07-28.md`
4. **Kontrak API** — `api/gas-contracts.md`
5. **Regression checklist** — `qa/regression-checklist.md`
6. **SOP source/deploy** — `ops/deploy-sop.md`
7. **Checklist deploy GAS B** — `ops/deploy-gas-b-checklist.md`

## PRD dan epic

- `prd/prd.md` — baseline product/security v0.2.
- `prd/epics.md` — backlog berbasis risiko dan story executable Epic 3.
- Epic 1 Fase A–C sudah deployed; Fase D hapus alias `success` tertunda sampai
  full regression.
- Epic 2 selesai; integrity checker mirror masih manual.
- Target aktif: Epic 3 preflight dan hardening security. Epic 4–9 tetap backlog
  dan tidak boleh dimulai sebagai bagian patch security.

## BMM workflow

Konfigurasi BMM menggunakan `docs/` sebagai project knowledge dan
`_bmad-output/planning-artifacts` sebagai output draft. Sesudah preflight
security terdokumentasi:

1. Jalankan architecture update/validate.
2. Buat/validasi story Epic 3 di workspace BMM.
3. Merge keputusan disetujui ke `docs/prd/epics.md`.
4. Jalankan implementation-readiness.
5. Sprint planning hanya setelah Story 3.0/3.1 disetujui.

Jangan membuat status sprint atau story selesai fiktif dari commit historis.

## Langkah berikutnya

1. Selesaikan Story 3.0: preflight deployment, Sheet/Drive, akun uji, dan
   evidence lock.
2. Tangani Story 3.1 GAS A bila temuan source terkonfirmasi di environment uji:
   generic GET, write authorization, password/reset.
3. Lanjutkan Story 3.2–3.8 satu deployable change per story.
4. Jalankan regression penuh sebelum cleanup response alias atau fitur baru.

## Scan mentah

`project-scan-report.json` — state BMM deep scan; bukan status release.
