# Epic & Story Backlog — Indo Apotek Digital

Status: **baseline v0.2 (2026-07-28)**. Diprioritaskan berdasarkan risiko ×
nilai bisnis. Source/status authority mengikuti `docs/index.md`. Setiap story
security memuat scope, acceptance criteria, evidence, dan rollback.

## Definition of Done

Story hanya **Done** jika:

1. kontrak/action dan role/ownership rule disetujui;
2. source clasp kanonik + root mirror identik;
3. local/static checks lulus;
4. deployment/version + rollback version tercatat;
5. negative security smoke + valid-role smoke lulus;
6. browser/manual flow terkait lulus;
7. docs, audit, dan checklist diperbarui dengan bukti redacted.

Status source-only atau code-complete tidak sama dengan deployed/live-verified.

## Tier 1 — Risiko tinggi

### Epic 1 — Hardening autentikasi dan response contract

**Status:** Mostly done; deployed 2026-07-27.

- [x] Frontend menempelkan session token ke request GAS A/GAS B.
- [x] Sensitive read GAS A gated session; 3 public read tetap allowlisted.
- [x] GAS A production smoke: public read lolos; sensitive read tokenless ditolak.
- [x] Response Fase A docs, Fase B backend, Fase C frontend deployed/stabilized.
- [ ] Fase D hapus alias `success` — **deferred** sampai full regression M4.

Catatan historis `docs/epic1-phase2-gas-a-session-gate.md` memiliki status stale
“Ready to implement”; source dan bukti deploy di atas lebih baru.

### Epic 2 — Konsolidasi sumber GAS

**Status:** Done; control tetap manual.

- [x] GAS A kanonik `tools/gas-a/Kode.js`; root `.gs` mirror.
- [x] GAS B kanonik `tools/gas-script-1/Kode.js`; root `.gs` mirror.
- [x] `tools/check_gas_mirrors.js` memverifikasi kedua pasangan.
- [ ] Git hook/CI — optional; tidak menjadi blocker selama SOP manual dipatuhi.

### Epic 3 — Security boundary, payroll, dan ESS

**Value:** mencegah account takeover, data exposure, payroll manipulation, dan
kebocoran slip gaji.

**Urutan wajib:** 3.0 → 3.1 → 3.2–3.6 → 3.7 → 3.8. Story 3.2–3.6 dapat
diparalelkan hanya setelah contract lock dan environment uji siap. Story 3.7
selalu rollout terpisah.

#### Completed remediation sebelum story baseline

- [x] CRITICAL payroll admin bypass ditutup tiga lapis dan live-verified
  (GAS B @66, GAS A @121).
- [x] HIGH IDOR-read attendance/slip non-admin ditutup dan deployed (GAS B @67).
- [ ] ESS self-view employee/owner live smoke masih bagian Story 3.8.

---

#### Story 3.0 — Security preflight dan contract lock

**Status:** Ready for preflight. **Blocker semua runtime story.**

**Sebagai** maintainer/owner, **saya ingin** fakta deployment, schema, Drive,
dan akun uji terkunci **agar** patch security tidak salah project atau merusak
data live.

**Scope**
- Read-only inventory script/deployment ID/version dan URL frontend GAS A/B.
- Read-only Sheet headers/data quality: `user`, `auth_sessions`,
  `data_karyawan`, `log_slip_gaji`, attendance source.
- Drive inventory: folder PDF/foto, policy sharing, legacy public PDF, ukuran
  sampel PDF.
- Akun uji owner, admin, employee; identity normalization dan expiry behavior.
- Probe GAS A aman pada test deployment/data uji.

**Non-scope**
- Auto-fix Sheet, reset akun produksi, bulk permission change, deploy runtime.

**Acceptance criteria**

- **Given** source dan environment aktif, **when** preflight selesai, **then**
  script ID, deployment ID/version, URL, commit SHA, dan rollback version
  terdokumentasi tanpa secret.
- **Given** Sheet live, **when** header/quality dipindai read-only, **then** NIP
  kosong/duplikat, duplicate/missing file ID, dan schema mismatch dilaporkan;
  tidak ada cell diubah.
- **Given** Drive PDF, **when** inventory dijalankan, **then** jumlah public/
  private, missing file, dan ukuran representatif tercatat redacted.
- **Given** dugaan GAS A, **when** probe aman dijalankan pada akun/data uji,
  **then** tiap finding berstatus `confirmed live`, `confirmed source-only`, atau
  `refuted` di `docs/security/gas-a-boundary-audit-2026-07-28.md`.
- Token, password, email, URL file, PDF, dan payroll data tidak muncul di log.

**Evidence:** `docs/qa/regression-checklist.md §I`, audit GAS A bertanggal.

**Rollback:** none; operasi read-only. Hapus/redact evidence jika secret
tercatat tidak sengaja, lalu rotate secret terdampak.

---

#### Story 3.1 — Emergency GAS A boundary closure

**Status:** Proposed; P0 jika Story 3.0 mengonfirmasi live. Bagi menjadi deploy
3.1a GET allowlist, 3.1b write authorization, 3.1c credential/reset.

**Sebagai** owner, **saya ingin** seluruh GAS A action punya server boundary
**agar** request HTTP langsung tidak dapat membaca sheet internal, mengubah
data, atau mengambil alih akun.

**Scope**
- Generic GET deny-by-default; allowlist `data_obat` dan public resource yang
  disetujui.
- Global session/status gate untuk write; action-level role/permission mapping.
- Server-authoritative identity/role.
- Password hash+salt dan reset token random/hash+expiry/single-use.
- Migrasi credential lama yang aman dan session invalidation pasca-reset.

**Non-scope**
- Redesign role UI, framework auth baru, OAuth, atau fitur product.

**Dependencies:** Story 3.0, API §9, role matrix, test deployment, owner approval
atas public `getPharmacyProfile`/shift classification.

**Acceptance criteria**

- **Given** request `GET ?sheet=auth_sessions|user|<internal>`, **when** tanpa
  session, **then** `{ok:false}` tanpa data atau detail sheet; `data_obat`
  tetap public-read.
- **Given** write GAS A tanpa token/fake token/expired token, **when** action
  dieksekusi, **then** semua ditolak sebelum Sheet/Drive mutation.
- **Given** employee session + payload `role=admin`, **when** admin/owner action
  dipanggil, **then** backend memakai role session dan menolak.
- **Given** owner/admin valid, **when** action sesuai permission dipanggil,
  **then** flow existing tetap berhasil.
- **Given** public reset request untuk account ada/tidak ada, **when** dikirim,
  **then** response sama/netral dan tidak melakukan password change.
- **Given** reset token valid, **when** dipakai sekali sebelum expiry, **then**
  password hash berubah dan seluruh session user invalidated.
- **Given** token expired/reused/forged, **when** confirm reset dipanggil,
  **then** ditolak tanpa perubahan credential.
- Tidak ada password plaintext tersisa untuk akun yang sudah termigrasi; login
  legacy hanya mengikuti migration window terdokumentasi.

**Evidence:** negative smoke GAS A, login/reset akun uji, Sheet inspection
redacted, browser owner/admin/employee.

**Rollback:** per sub-deploy. GET/write rollback ke versi sebelumnya hanya untuk
lockout yang terbukti; credential migration tidak boleh kembali ke plaintext.
Reset token table dapat dinonaktifkan tanpa memulihkan password lama.

---

#### Story 3.2 — Generate slip POST-only dan serialized

**Status:** Proposed.

**Sebagai** owner/admin, **saya ingin** generate slip hanya melalui request
terautentikasi dan terkunci **agar** GET/retry/race tidak membuat data ganda.

**Scope:** GAS B route + existing generation call sites.

**Acceptance criteria**

- **Given** `GET action=generateSalarySlip`, **when** dipanggil role apa pun,
  **then** response reject dan tidak ada row/file/PDF baru.
- **Given** POST tanpa auth, employee, atau expired session, **when** generate
  dipanggil, **then** ditolak tanpa mutation.
- **Given** owner/admin valid, **when** POST dipanggil, **then** `LockService`
  melindungi generation dan tepat satu slip/history intended dibuat.
- Tidak ada frontend caller GET tersisa sebelum route GET diblokir.

**Evidence:** pre/post row+Drive count akun uji, local source assertion, live
admin smoke.

**Rollback:** Apps Script previous version; jangan hapus artifact yang sudah
terbuat tanpa operator review.

---

#### Story 3.3 — NIP unik sebagai target payroll

**Status:** Proposed; blocked oleh data-quality Story 3.0.

**Sebagai** admin payroll, **saya ingin** mutasi karyawan menggunakan NIP unik
**agar** nama duplikat tidak mengubah record salah.

**Acceptance criteria**

- Missing/duplicate normalized NIP fail closed dengan pesan actionable.
- Save/edit/delete/generate resolve tepat satu NIP; tidak ada fallback mutasi
  match-by-name.
- Dua nama sama dengan NIP berbeda hanya mengubah NIP yang dipilih.
- Existing valid payroll flow tetap lulus.

**Evidence:** fixture/data uji duplicate name, missing/duplicate NIP report,
local test + live admin smoke.

**Rollback:** previous version; data invalid tetap dilaporkan dan tidak diubah
otomatis.

---

#### Story 3.4 — Delete satu slip terikat record server

**Status:** Proposed.

**Sebagai** admin payroll, **saya ingin** delete resolve record stabil di server
**agar** row stale atau file ID palsu tidak menghapus data lain.

**Acceptance criteria**

- Client selector di-resolve under lock ke tepat satu `log_slip_gaji` record.
- Drive file ID untuk trash dibaca dari record server, bukan dipercaya dari
  payload.
- Missing/duplicate/stale selector fail closed; tidak ada row/file berubah.
- Forged `rowNumber`/`fileId` tidak dapat menghapus file/baris lain.
- Partial Drive/Sheet failure mengembalikan detail aman dan tidak mengklaim full
  success.

**Evidence:** stale target, forged ID, duplicate ID, valid admin delete.

**Rollback:** previous version; restore from Drive trash/manual Sheet backup
hanya setelah operator cocokkan record.

---

#### Story 3.5 — Bulk delete deliberate dan bounded

**Status:** Proposed.

**Sebagai** owner/admin, **saya ingin** bulk delete dikonfirmasi server dan
terikat count **agar** state yang berubah tidak terhapus tanpa sengaja.

**Acceptance criteria**

- POST admin/owner only; missing/invalid `confirmation` ditolak.
- Server re-read under lock; `expectedCount` mismatch ditolak dan meminta reload.
- Empty history adalah safe no-op.
- Success response memuat `deleted`, `trashed`, `failed`; partial failure tidak
  menjadi full success.
- Non-admin ditolak sebelum mutation.

**Evidence:** no-confirm, wrong-count, empty, partial failure simulation, valid
admin test.

**Rollback:** Drive trash/manual backup; bulk restore bukan otomatis.

---

#### Story 3.6 — Formula injection boundary

**Status:** Proposed.

**Sebagai** operator, **saya ingin** teks input disimpan literal **agar** Sheet
tidak mengeksekusi formula dari nama/NIP/job/payload.

**Scope:** sink teks untrusted yang ditemukan Story 3.0 di payroll, attendance,
dan GAS A. Satu helper kecil; tanpa dependency.

**Acceptance criteria**

- Prefix `=`, `+`, `-`, `@` disimpan literal.
- Text normal tidak berubah.
- Numeric, Date, enum, dan formula template tetap bertipe/perilaku semula.
- PDF hasil menampilkan nilai literal intended.
- Runnable local test mencakup empat prefix + normal input.

**Rollback:** previous version; cell yang sudah menyimpan formula berbahaya
butuh inventory/remediation operator terpisah.

---

#### Story 3.7 — PDF slip private dan authenticated delivery

**Status:** Proposed; rollout terpisah. Blocked ukuran PDF + Drive inventory.

**Sebagai** karyawan, **saya ingin** slip hanya dapat dibuka melalui session
milik saya **agar** link yang bocor tidak menjadi bearer public permanen.

**Scope**
- New PDFs private.
- POST `downloadSalarySlip` dengan session + ownership/admin check.
- Server resolve file dari history record.
- Frontend Blob/object URL + revoke.
- Batch migration legacy idempotent dengan report.

**Non-scope:** dokumen karyawan Epic 9 atau storage provider baru.

**Acceptance criteria**

- Employee A tidak dapat download PDF employee B lewat file ID, row, nama, NIP,
  atau URL.
- Owner/admin valid dan employee self valid menerima PDF sesuai contract bounded.
- New PDF tidak memakai `ANYONE_WITH_LINK`.
- ESS tidak bergantung direct `fileUrl`; object URL direvoke.
- Legacy URL gagal setelah file termigrasi private.
- Migration report `migrated/skipped/failed`, dapat diulang aman, dan tidak
  memproses batch tanpa explicit operator approval.

**Evidence:** Drive permission check, employee-A/B IDOR, browser open/print,
size limit, migration dry-run + approved batch.

**Rollback:** stop batch/deploy previous frontend/backend. Jangan mengembalikan
public sharing massal otomatis; file yang sudah diunduh tidak dapat ditarik.

---

#### Story 3.8 — ESS live smoke dan regression baseline

**Status:** Proposed; closure story.

**Sebagai** owner dan karyawan, **saya ingin** flow real-role diverifikasi
**agar** Epic 3 ditutup dengan bukti, bukan code review saja.

**Acceptance criteria**

- Employee melihat attendance/slip/history/download milik sendiri saja.
- Owner/admin melihat scope monitoring sesuai matriks.
- Employee-A versus employee-B requests fail closed.
- Logout, expired session, forged identity/role ditolak.
- Full relevant checklist Section B–I lulus dan evidence redacted tercatat.
- Epic 3 status baru berubah Done setelah semua story required selesai.

**Rollback:** sesuai version tiap story; regression failure menghentikan rollout,
bukan langsung bulk rollback data.

## Tier 2 — Risiko menengah (deferred sampai Epic 3 stabil)

### Epic 4 — Monitoring presensi: export dan audit koreksi
- Export PDF/Excel.
- Audit trail pada `updateAttendanceRecord`.
- Perlu story/schema/contract baru; tidak masuk patch security.

### Epic 5 — Cuti dan izin (greenfield)
- Sheet schema, submit/approve/list, notification.

### Epic 6 — Approval lembur (greenfield)
- Pisahkan presensi `LEMBUR` dari request/approval formal.

### Epic 7 — Jadwal kerja per-karyawan (greenfield)
- CRUD schedule, assign shift, calendar; berbeda dari global shift settings.

## Tier 3 — Deferred

### Epic 8 — Data obat/restok/PO regression dan UX
- Full role/backend regression setelah Story 3.1 write authorization.

### Epic 9 — Dokumen dan pengumuman (greenfield)
- Dokumen employee dan internal CMS.

## Tier 4 — Alur ringan

- Copy, spacing, icon, responsive polish.
- Dead/temp cleanup.
- Tidak boleh digabung ke security deploy bila menambah review noise.

## Urutan eksekusi

1. Story 3.0 preflight.
2. Story 3.1 GAS A boundary; sub-deploy 3.1a–c.
3. Story 3.2–3.6 satu perubahan deployable per story.
4. Story 3.7 PDF privacy rollout terpisah.
5. Story 3.8 full baseline.
6. Epic 1 Fase D response cleanup.
7. Epic 4 dan 8.
8. Epic 5–7 dan 9 melalui workflow greenfield.

## BMM workflow checkpoint

- `bmad-architecture`: update/validate, bukan membuat authority baru.
- `bmad-create-epics-and-stories`: validasi story 3.0–3.8 dan BDD coverage.
- `bmad-check-implementation-readiness`: expected `not ready` sebelum Story
  3.0; hasil tersimpan di ignored `_bmad-output` lalu keputusan diringkas ke
  tracked docs.
- Sprint planning setelah Story 3.0/3.1 mendapat approval.
