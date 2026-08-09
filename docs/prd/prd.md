# PRD Induk — Indo Apotek Digital

Status: **baseline v0.2 (2026-07-28)**. Menyatukan
`PRD_Presensi_Owner_Admin_Monitoring_v1.0.txt` dan
`PRD_Employee_Self_Service_(ESS)_Presensi_Karyawan_v1.0.txt` sebagai product
input, lalu direkonsiliasi dengan source, audit security, dan status deploy.
BMM/BMAD terpasang lokal di `_bmad/`; tidak menjadi bagian runtime/deploy.

> Dua PRD sumber mendeskripsikan target yang lebih luas dari current-state.
> Fitur yang belum ada diperlakukan sebagai greenfield, bukan diasumsikan aktif.
> Patch security tidak boleh membawa fitur baru tanpa story terpisah.

## 1. Tujuan produk

Platform internal apotek untuk autentikasi berbasis role, presensi GPS+foto,
monitoring dan koreksi oleh owner/admin, payroll serta slip gaji, manajemen
data obat/stok/supplier, dan Employee Self-Service (ESS).

## 2. Pengguna dan role

| Role | Sumber kebenaran | Ringkas |
|---|---|---|
| Owner | `docs/security/role-permission-matrix.md` | Akses penuh dan owner-only rule |
| Admin | idem | Operasional; payroll/absensi sesuai server gate |
| Karyawan | idem | ESS hanya data milik sendiri |

Role efektif ditentukan backend dari session aktif. Frontend `ACCESS_MENUS`
hanya mengatur visibility dan tidak memberikan otorisasi.

## 3. Modul target

- **Owner/Admin — Monitoring**: dashboard, monitoring presensi, payroll/slip,
  data operasional, user/role, log, dan pengaturan.
- **Karyawan — ESS**: dashboard presensi, histori presensi, slip gaji sendiri.
- **Target greenfield sesuai PRD sumber**: jadwal per-karyawan, cuti/izin,
  approval lembur, dokumen, dan pengumuman. Semuanya tertunda setelah baseline
  security dan regression stabil.
- **Data obat/operasional**: data obat, cari obat, restok, purchase order,
  supplier, import, user, role, log, dan profil akun.

## 4. Gap current-state

| Area | Status |
|---|---|
| Presensi submit DATANG/PULANG/LEMBUR | Ada, dengan validasi foto/GPS/waktu |
| Payroll dan slip gaji | Ada; hardening masih berjalan |
| Monitoring presensi | List/koreksi ada; export PDF/Excel belum |
| Export payroll/presensi | Belum tervalidasi |
| Jadwal kerja per-karyawan | Belum ada; greenfield |
| Cuti/izin | Belum ada; greenfield |
| Approval lembur formal | Belum ada; greenfield |
| Dokumen karyawan | Belum ada; greenfield |
| Pengumuman | Belum ada; greenfield |
| Audit log | Ada, tetapi coverage/action belum terbukti penuh |
| RBAC backend GAS B | Dasar session/admin gate ada; hardening lanjutan open |
| RBAC backend GAS A | Sensitive read gated; write authorization belum setara |
| Credential dan reset password | Source menunjukkan gap; wajib preflight |

## 5. Requirement security non-negotiable

1. **Backend authority** — Semua keputusan sensitif dibuat backend dari session
   server-side. Field `username`, `email`, `role`, `actor`, `nama`, `rowNumber`,
   atau `fileId` dari klien tidak boleh menjadi privilege atau target
   authoritative.
2. **Write protection** — Semua write sensitif wajib session valid, role
   sesuai, ownership check, dan re-check state under lock bila berpotensi race.
3. **Stable identifiers** — Mutation/deletion memakai ID tersimpan server dan
   resolve unik; positional row client tidak authoritative.
4. **HTTP safety** — GET tidak boleh mengubah Sheet, Drive, session, user,
   atau PDF. Mutasi harus POST dan memakai lock sesuai risiko.
5. **Public GET allowlist** — Endpoint hanya melayani resource yang sudah
   diklasifikasikan public. Deny-by-default untuk sheet internal termasuk
   `auth_sessions`.
6. **Credential security** — Password disimpan hashed dengan salt. Reset wajib
   secret token random, hash token tersimpan, expiry, single-use, response
   anti-enumeration, dan invalidasi session setelah ganti password.
7. **Injection defense** — Teks tak tepercaya yang diawali `=`, `+`, `-`, `@`
   harus tersimpan sebagai literal; numeric, Date, enum terkendali, dan formula
   template tidak diubah.
8. **Payroll PDF** — File baru private. Delivery melalui endpoint
   session+ownership check. Direct public link tidak boleh menjadi satu-satunya
   jalan akses ESS.
9. **Evidence** — Claim “lulus” wajib memiliki deployment/version, akun-role,
   timestamp, dan hasil redacted.
10. **Privacy** — Token, email, URL file, data gaji, foto, dan PDF tidak dicatat
    mentah ke log/repository.

## 6. Batas teknis

- Dua GAS Web App terpisah: GAS A data/auth dan GAS B attendance/payroll.
- Persistensi memakai Google Sheets dan Drive; tidak ada database relasional.
- Frontend statis multi-page di GitHub Pages; tidak ada build/framework SPA.
- Deploy manual. Canonical source ada di folder clasp, root `.gs` mirror.
- Tidak ada CI/CD. Mirror checker dan smoke dijalankan eksplisit sesuai SOP.

## 7. Milestone dan release gate

### M0 — Documentation/security baseline
- PRD, epics/story, API contract, role matrix, SOP, dan QA konsisten.
- Tidak ada status stale yang disalahpahami sebagai pekerjaan baru.

### M1 — Security preflight
- Deployment ID/version dan source commit diverifikasi.
- Schema/header live dan data-quality issue dicatat read-only.
- Drive policy, ukuran PDF, duplicate ID, serta akun owner/admin/karyawan uji
  diketahui.
- Temuan GAS A/GAS B diklasifikasikan: confirmed live, confirmed source-only,
  atau refuted.

**Gate:** tidak ada patch/deploy runtime sebelum M1.

### M2 — Boundary closure
- Public GET allowlist, write authorization, credential/reset, dan payroll
  mutation/deletion terlindungi. Perubahan besar dibagi deploy terpisah.

**Gate:** local checks, mirror integrity, authenticated smoke, dan browser ESS
lulus dengan bukti redacted.

### M3 — Payroll PDF privacy
- New PDF private, endpoint delivery, frontend Blob, dan migrasi legacy
  idempotent.

**Gate:** rollback plan dan approval operator eksplisit.

### M4 — Regression baseline
- Owner/admin/employee smoke dan full manual checklist lulus.
- Fase D response alias cleanup baru dapat dipertimbangkan.

### M5 — Product epics
- Epic 4–9 dimulai hanya setelah M4, satu epic per workflow dengan schema/API
  contract baru.

## 8. Traceability

Setiap fitur/perubahan wajib dapat dilacak:

`PRD requirement → Epic → Story → kontrak/action → test/checklist → deployment
version → bukti redacted`.

Jika salah satu tautan belum ada, status pekerjaan maksimal **draft** atau
**ready with gaps**, bukan **done**.

## 9. Keluar dari cakupan security hardening

- Epic 4–9 (fitur greenfield atau expansion).
- Framework migration, redesign frontend, atau CI/CD besar.
- Reinstall/reconfigure BMM; instalasi lokal sudah ada.
- Penghapusan alias response `success` sebelum full regression.
