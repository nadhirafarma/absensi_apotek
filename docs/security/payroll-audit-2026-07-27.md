# Audit Keamanan Payroll & Otorisasi GAS B — 2026-07-27

Metode: audit adversarial multi-agen (3 lensa temuan → verifikasi refutasi per temuan),
lalu **diverifikasi ulang manual** oleh pembacaan source langsung. Target:
`google-apps-script-absensi-api.gs` (= `tools/gas-script-1/Kode.js`) dan rantai lintas
ke GAS A (`tools/gas-a/Kode.js`). 14 temuan lolos verifikasi; 2 refuted.

## 🔴 CRITICAL — Bypass admin payroll TANPA login

**Rantai (terverifikasi manual):**
1. GAS A `saveActivityLog` (doPost `:389`) **tidak di belakang gerbang session** →
   `handleSaveActivityLog_` (`:1131`) memanggil `syncAuthSession_`.
2. `syncAuthSession_` (`:239`) dengan `sessionEvent=login` + token pilihan penyerang
   **menulis baris sesi ber-identitas kosong** ke sheet `auth_sessions` bersama
   (`saveAuthSession_` `:279`), `expiresAt = now+12j`. Tanpa autentikasi apa pun.
3. GAS B `validateAbsensiSession_` (`:278`) **menerima sesi identitas-kosong**:
   `submitted=[username,email].filter(Boolean)=[]` → `.some()` atas array kosong = false → lolos.
4. GAS B `isAbsensiAdmin_` (`:2216`): `username = params.username || params.actor || params.nama`.
   `applyAbsensiSession_` menimpa `username`/`actor` (jadi kosong) tapi **tidak** `params.nama`
   → jatuh ke `params.nama='admin'` klien → `username=='admin'` → **admin TRUE**.

**Dampak:** penyerang yang hanya tahu 2 URL GAS publik (ada di frontend JS) bisa
`generateSalarySlip`, `savePayrollEmployee`, `deletePayrollEmployee`,
`deleteAllSalarySlipHistory` — buat/hapus data payroll siapa pun.

**Fix (3 lapis, defense-in-depth, aman — sesi sah selalu punya username):**
- L1 GAS B `isAbsensiAdmin_`: buang fallback `|| params.nama` (klien, tak pernah ditimpa session).
- L2 GAS B `validateAbsensiSession_`: tolak sesi bila `username` DAN `email` DAN `name` kosong.
- L3 GAS A `syncAuthSession_`: jangan mint sesi `login` bila username & email kosong.

## 🟠 HIGH — Kebocoran data lintas-karyawan (IDOR baca)

Semua butuh SATU sesi karyawan valid (non-admin), lalu baca data karyawan LAIN:

- **Histori slip gaji** `handleListSalarySlipHistory_` (`:1016-1046`): `identityKeys` untuk
  non-admin diambil dari `params.name/nama/nama_karyawan` **klien** (tak diikat session),
  filter pakai **substring** `indexOf` (`:1042`). Kirim `name=<korban>` → gaji bersih +
  link PDF korban; `name=a` → **dump SELURUH** histori payroll.
- **Kehadiran (GPS/foto/jam)** `handleListAttendanceRecords_` (`:613-620`): pola sama,
  `params.nama/name/...` klien → baca presensi karyawan lain.
- **PDF slip ANYONE_WITH_LINK** (`:1732`): tiap PDF slip di-share publik-by-link →
  URL = bearer publik; bocor sekali = permanen tanpa auth.

**Fix HIGH-read (perlu kehati-hatian anti-lockout ESS):** untuk non-admin, turunkan
`identityKeys` HANYA dari session (`payload.__sessionName` + username/email session),
buang field nama klien. PDF: berhenti pakai ANYONE_WITH_LINK (butuh cek pemakaian
`fileUrl` di frontend agar tampil/print slip tak rusak).

## 🟡 LOW/MEDIUM — hardening (semua di belakang gerbang admin)

- `deleteSalarySlipHistory` (`:1107`): hapus baris **posisional** by `rowNumber` klien +
  trash Drive by `fileId` klien tanpa cek kecocokan (IDOR/TOCTOU) — **admin-gated**.
- `deleteAllSalarySlipHistory` (`:1146`): satu request hapus SEMUA + trash semua PDF,
  tanpa konfirmasi/scope server — admin-gated.
- Formula/CSV injection (`:1359,:1647,:802,:1743`): field teks (`name/nip/job/...`) ditulis
  mentah via `setValue` tanpa escape `= + - @`.
- `generateSalarySlip` terekspos di `doGet` (mutasi tanpa LockService) (`:105`).
- `findPayrollEmployeeRow_` match by NIP **atau** nama (match pertama) → salah target bila nama duplikat.

## Refuted (benar-benar bukan bug)
- `updateAttendanceRecord` timpa baris karyawan lain — admin-gated, bukan bypass.
- Injeksi nominal finansial ke slip via payload — angka gaji dibaca dari sheet, bukan payload.

## Status remediasi
- 2026-07-27: fix CRITICAL 3-lapis diterapkan di source (lihat commit). Deploy: lihat epics.md.
- HIGH-read & PDF & hardening: antre, butuh keputusan/uji anti-lockout.
