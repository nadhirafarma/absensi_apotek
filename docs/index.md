# Dokumentasi Indo Apotek — Index

Dihasilkan via BMM `bmad-document-project` (deep scan) + validasi manual,
2026-07-26; scan diselesaikan penuh (step 2–12) + validasi source 2026-07-27.
Terverifikasi 2026-07-27: mirror GAS A & GAS B byte-identik dengan clasp,
sitasi baris di-refresh, live site `https://indoapotek.my.id` HTTP 200
(Pages branch `main`). Yang masih `⚠ perlu validasi`: schema kolom
Google Sheets live dan status deployment kode GAS terbaru di Apps Script.

## Lima fondasi project

1. **Arsitektur** — `architecture/frontend-gas-data-store.md`,
   `architecture/integration-architecture.md`, `architecture/source-tree.md`
2. **Role & Permission** — `security/role-permission-matrix.md`
3. **Kontrak API** — `api/gas-contracts.md`
4. **Regression Checklist** — `qa/regression-checklist.md`
5. **SOP Source/Deploy** — `ops/deploy-sop.md`

## PRD induk & epic
- `prd/prd.md` — PRD induk, menyatukan kedua PRD sumber Downloads dengan gap
  analysis eksplisit terhadap current-state code.
- `prd/epics.md` — daftar epic diprioritaskan risiko × nilai bisnis, dengan
  urutan eksekusi rekomendasi dan penempatan TEA.

## Catatan implementasi epic
- `epic1-phase2-gas-a-session-gate.md` — gerbang session GAS A (Epic 1 fase 2).

## Scan mentah
`project-scan-report.json` — state file scan BMM (step 1–12 selesai 2026-07-27).

## Langkah berikutnya
- Jalankan Epic 1 (hardening auth) sebagai prioritas tertinggi — lihat
  `prd/epics.md`.
- Workflow lengkap untuk epic Tier 1–2 (risiko tinggi/menengah); alur ringan
  untuk Tier 4 (bug UI, teks, warna).
- TEA ditambahkan setelah Epic 1–4 stabil dan baseline regression checklist
  lulus manual minimal sekali penuh.


