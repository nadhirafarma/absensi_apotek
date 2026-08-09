# Audit Keamanan GAS A Boundary — 2026-07-28

Status: **Remediation verified in staging** (2026-07-28). Temuan source tetap belum diprobe pada production. Draf Story 3.1a lulus 10/10 skenario boundary di deployment staging dan Spreadsheet staging.
Target: `google-apps-script-api-search-box-final.gs` / `tools/gas-a/Kode.js`.

## Evidence preflight 2026-07-28

| Bukti | Hasil |
|---|---|
| Canonical source | `tools/gas-a/Kode.js` dengan script ID production `1oj9FfGGSv4FNiaK6kPqV_39kg2vESJ4RfUg_FH8mrpnzVhz2u42AiE5M` |
| GAS A production | deployment version `@124`; Story 3.1a **belum** di-deploy |
| GAS B production | deployment version `@70`; tidak berubah |
| Mirror integrity sebelum draf | lulus; mirror perlu disinkron ulang setelah Story 3.1a final |
| Staging boundary test | 10/10 pass pada 2026-07-28 09:19 WIB |

### Hasil staging Story 3.1a

| Skenario | Expected | Actual |
|---|---|---|
| GET `data_obat` anonymous | allow | pass (`ok:true`) |
| GET `user` anonymous | reject | pass (`ok:false`) |
| GET `auth_sessions` anonymous | reject | pass (`ok:false`) |
| `saveLoginUser` anonymous | reject | pass (`ok:false`) |
| `saveLoginUser` employee | reject | pass (`ok:false`) |
| `saveLoginUser` admin | allow | pass (`ok:true`) |
| `savePharmacyProfile` admin | reject | pass (`ok:false`) |
| `savePharmacyProfile` owner | allow | pass (`ok:true`) |
| `add_data_obat` employee | reject | pass (`ok:false`) |
| `add_data_obat` admin | allow | pass (`ok:true`) |

> Bukti ini memverifikasi efektivitas remediasi di staging, bukan membuktikan production sudah aman. Password/reset tokenless dan permission mapping write lain masih open.

Laporan ini menindaklanjuti audit payroll (2026-07-27) dan berfokus pada sisi GAS A (auth, user, obat, log, profil).

## 1. 🔴 CRITICAL — Credential management (Password & Reset)

**Temuan Source:**
1. **Reset password tokenless:** `handleResetPassword_` (`:915`) mem-build link hanya menggunakan `?page=reset&email=...`. Tidak ada secret token sekali pakai, expiry, atau record request reset (`buildResetPasswordUrl_` `:3384`).
2. **Password plaintext:** `login` membandingkan input mentah dengan nilai kolom (`:614`); `saveLoginUser` (`:846`) dan `saveResetPassword_` menulis input mentah langsung ke Sheets.
3. **Public write reset:** aksi `saveResetPassword`, `updatePassword`, `setPassword` route ke public tanpa session (wajar untuk reset flow, tetapi berbahaya karena request dapat dieksekusi siapa saja yang tahu email akun tanpa secret token).

**Risiko jika terkonfirmasi live:** Account takeover penuh (ATO). Penyerang cukup mengetahui email admin/karyawan, melakukan POST ke `saveResetPassword` (atau membuka URL `?page=reset&email=...`), lalu mengambil alih akun. Plaintext password membocorkan kredensial yang mungkin dipakai di platform lain.

**Status Preflight:** ⚠ Perlu validasi di akun uji. Jangan tes ATO ke akun produksi.

## 2. 🔴 CRITICAL — GAS A Write Authorization (Missing Backend Enforcement)

**Temuan Source:**
1. **Unprotected Writes:** `doPost` dispatcher (`:368-535`) me-route ke berbagai action (mis. `saveLoginUser`, `savePharmacyProfile`, `deleteActivityLog`, `add_data_obat`) langsung setelah `LockService`. Tidak ada pemanggilan `validatePharmacySession_` pada jalur-jalur write ini (hanya 5 aksi sensitive read yang di-gated).
2. **Client-controlled Identity:** Beberapa handler membaca `data.role` atau `data.username` (mis. `handleSaveLoginUser_`), tetapi karena `applyPharmacySession_` tidak dipanggil, field-field tersebut berasal sepenuhnya dari payload input yang dikendalikan klien, bukan identitas server-side.

**Risiko jika terkonfirmasi live:** Privilege escalation / unauthenticated data tampering. Penyerang tanpa login dapat membuat admin baru, menghapus user, mengubah profil apotek, atau merusak data obat/restok/PO hanya dengan mem-bypass UI frontend dan mengirim HTTP POST langsung.

**Status Preflight:** ⚠ Perlu direproduksi menggunakan POST tanpa token / token karyawan dengan `role=admin` di payload.

## 3. 🟠 HIGH — Generic GET `sheet=<nama>` Exposure

**Temuan Source:**
1. `doGet` (`:186-228`) membaca sheet generik apa saja jika `e.parameter.sheet` diberikan.
2. Filter blocking hanya melarang `sheet=user` (`:188`).
3. `getSpreadsheetBySheetName_` (`:3343`) mengandalkan `SpreadsheetApp.getActiveSpreadsheet()` sebagai fallback jika nama sheet tidak ada di map khusus.
4. Sheet `auth_sessions` adalah sheet dalam active spreadsheet GAS A.

**Risiko jika terkonfirmasi live:** Data exposure. `?sheet=auth_sessions` kemungkinan akan me-return seluruh token aktif, `username`, dan `role`. Penyerang bisa mengambil token owner/admin yang sedang aktif lalu melakukan impersonasi. Data operasional lain (jika ada sheet internal) juga terekspos.

**Status Preflight:** ⚠ Lakukan request `GET ?sheet=auth_sessions` tanpa log hasil.

## 4. 🟡 LOW/MEDIUM — Hardening

**Temuan Source:**
- `saveActivityLog` (`:389`): Tidak punya session gate; handler-nya `handleSaveActivityLog_` (`:1131`) memanggil `syncAuthSession_` yang bisa digunakan mem-mint sesi kosong (sudah dimitigasi oleh Epic 1 Fase 2, tetapi endpoint log-nya sendiri tetap unauthenticated).
- Payload JSON vs Error Handling: Handler `listActivityLog` dan beberapa list lainnya rentan gagal/crash jika baris data di Sheet memiliki kolom kosong tanpa fallback yang aman, membocorkan stack trace.

---

## Action Plan
- Jadikan temuan di atas sebagai input **Story 3.0 (Security preflight)** dan **Story 3.1 (GAS A boundary closure)**.
- Setelah preflight live dilakukan, perbarui status `Confirmed source-only` menjadi `Confirmed live` atau `Refuted`.
- Terapkan fix satu-per-satu sesuai prioritas CRITICAL → HIGH → MED.
