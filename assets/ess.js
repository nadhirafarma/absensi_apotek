(function () {
  "use strict";
  const API_URL = "https://script.google.com/macros/s/AKfycbx7fkoLgH6igHP17przjmxWaP8bQNG_6OcoQ3-Ug79A_vmZxK6_ibCdLC0u-W-JLtw3/exec";
  const SESSION_KEY = "nadhira.authSession";
  const state = { records: [], groups: [], loading: false, error: "", employeeTab: "dashboard", monitoringTab: "dashboard", employeeFilter: { date: "", status: "" }, monitoringFilter: { date: "", status: "", search: "" }, loadedAt: 0 };
  const icons = {
    attendance: '<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4"></path><rect x="4" y="4" width="16" height="18" rx="2"></rect><path d="M8 12h8M8 16h5m2 1 2 2 4-4"></path></svg>',
    people: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"></path></svg>',
    schedule: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
    leave: '<svg viewBox="0 0 24 24"><path d="M5 21V4m0 1h13l-2 5 2 5H5"></path></svg>',
    overtime: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5h5"></path><path d="m18 4 2 2"></path></svg>',
    salary: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18M7 15h3"></path></svg>',
    document: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6M8 13h8M8 17h6"></path></svg>',
    announcement: '<svg viewBox="0 0 24 24"><path d="m3 11 15-6v14L3 13Z"></path><path d="M7 14v5h4l-1-6"></path></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M8 16v-4m4 4V7m4 9v-6"></path></svg>'
  };

  function session() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null") || {}; } catch (_) { return {}; } }
  function roleKey() { return String(session().role || "").toLowerCase().trim(); }
  function isAdmin() { return /^(owner|admin|administrator)$/.test(roleKey()); }
  function esc(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function norm(value) { return String(value || "").toLowerCase().trim(); }
  function dateKey(value) { const d = value ? new Date(value) : new Date(); return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
  function monthKey() { return dateKey().slice(0, 7); }
  function rupiah(value) { return `Rp ${new Intl.NumberFormat("id-ID").format(Number(value) || 0)}`; }
  function prettyDate(value) { const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value || "-" : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d); }
  function initials(value) { return String(value || "Akun").split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase(); }
  function employeeName() { const s = session(); return String(s.name || s.username || "Karyawan"); }
  function badge(label) { const key = norm(label); const tone = /terlambat|pending|menunggu/.test(key) ? "is-warning" : /tidak|ditolak|gagal/.test(key) ? "is-danger" : /hadir|disetujui|selesai/.test(key) ? "" : "is-info"; return `<span class="ess-badge ${tone}">${esc(label)}</span>`; }
  function stat(icon, tone, label, value, note) { return `<article class="ess-stat-card"><span class="ess-stat-icon ${tone}">${icons[icon] || esc(initials(label))}</span><small>${esc(label)}</small><strong>${esc(value)}</strong><em>${esc(note)}</em></article>`; }
  function empty(icon, title, text) { return `<div class="ess-empty"><span class="ess-icon">${icons[icon] || icons.document}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`; }

  function normalizeRecord(row) {
    const timestamp = String(row.timestamp || "");
    const d = String(row.date || row.tanggal_absen || row.tanggalAbsen || "") || dateKey(timestamp);
    const time = String(row.time || row.jam_absen || row.jamAbsen || "").slice(0, 5);
    return { name: String(row.nama || row.nama_karyawan || row.name || ""), date: d, time, status: String(row.status || "DATANG").toUpperCase(), shift: String(row.shift || ""), warning: String(row.warningMessage || ""), rowNumber: Number(row.rowNumber || 0) };
  }
  function groupRecords(records) {
    const map = new Map();
    records.forEach((r) => {
      const key = `${norm(r.name)}|${r.date}`;
      if (!map.has(key)) map.set(key, { name: r.name, date: r.date, shift: r.shift || "-", datang: "", pulang: "", overtime: false, warning: "" });
      const g = map.get(key); if (r.shift) g.shift = r.shift; if (r.warning) g.warning = r.warning;
      if (r.status === "PULANG") g.pulang = !g.pulang || r.time > g.pulang ? r.time : g.pulang;
      else if (r.status === "LEMBUR") g.overtime = true;
      else g.datang = !g.datang || r.time < g.datang ? r.time : g.datang;
    });
    return Array.from(map.values()).sort((a, b) => `${b.date}${b.datang}`.localeCompare(`${a.date}${a.datang}`));
  }
  function statusOf(g) { if (!g.datang) return "Tidak Hadir"; if (/terlambat|late/i.test(g.warning)) return "Terlambat"; return "Hadir"; }
  function duration(g) { if (!g.datang || !g.pulang) return "-"; const [ah, am] = g.datang.split(":").map(Number); const [bh, bm] = g.pulang.split(":").map(Number); let mins = bh * 60 + bm - ah * 60 - am; if (mins < 0) mins += 1440; return `${Math.floor(mins / 60)}j ${mins % 60}m`; }
  function summary(groups) { const month = groups.filter((g) => g.date.startsWith(monthKey())); return { month, hadir: month.filter((g) => g.datang).length, late: month.filter((g) => statusOf(g) === "Terlambat").length, overtime: month.filter((g) => g.overtime).length, today: groups.filter((g) => g.date === dateKey()) }; }

  async function load(force) {
    if (state.loading || (!force && Date.now() - state.loadedAt < 120000)) return;
    state.loading = true; state.error = "";
    try {
      const s = session(); const url = new URL(API_URL); url.searchParams.set("action", "listAttendanceRecords"); url.searchParams.set("sessionToken", s.sessionToken || ""); url.searchParams.set("username", s.username || ""); url.searchParams.set("email", s.email || ""); url.searchParams.set("name", s.name || s.username || ""); url.searchParams.set("dateFrom", `${monthKey()}-01`); url.searchParams.set("dateTo", dateKey(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))); url.searchParams.set("limit", "5000");
      const res = await fetch(url.toString()); const data = await res.json();
      if (!data || (data.ok !== true && data.success !== true)) throw new Error(data?.message || "Data presensi gagal dimuat.");
      state.records = (data.records || data.data || []).map(normalizeRecord); state.groups = groupRecords(state.records); state.loadedAt = Date.now();
    } catch (error) { state.error = error.message || "Data presensi belum tersedia."; }
    finally { state.loading = false; }
  }

  function welcome(admin) { return `<section class="ess-welcome"><div><h3>${admin ? "Ringkasan operasional hari ini" : `Halo, ${esc(employeeName())}`}</h3><p>${admin ? "Pantau presensi karyawan dan tindak lanjuti anomali lebih cepat." : "Pantau aktivitas kerja Anda dengan data yang aman dan personal."}</p></div><span class="ess-live">Tersinkron</span></section>`; }
  function quickButton(tab, icon, text) { return `<button class="ess-shortcut-card" type="button" data-ess-tab="${tab}"><span class="ess-icon">${icons[icon]}</span>${esc(text)}</button>`; }
  function errorLine() { return state.error ? `<div class="ess-error">${esc(state.error)}</div>` : ""; }

  function renderESSDashboard() {
    const c = document.getElementById("essContent"); if (!c) return; const s = summary(state.groups);
    const today = s.today[0];
    c.innerHTML = `<div class="ess-module-shell">${welcome(false)}${errorLine()}<section class="ess-stats">${stat("attendance", "is-blue", "Hadir", s.hadir, "Bulan ini")}${stat("schedule", "is-orange", "Terlambat", s.late, "Bulan ini")}${stat("leave", "is-red", "Tidak Hadir", Math.max(0, new Set(s.month.map((g) => g.date)).size - s.hadir), "Bulan ini")}${stat("leave", "is-purple", "Cuti", 0, "Bulan ini")}${stat("overtime", "is-green", "Lembur", s.overtime, "Bulan ini")}${stat("salary", "is-pink", "Estimasi Gaji", rupiah(0), "Bulan ini")}</section><section class="ess-grid-2"><article class="ess-panel"><div class="ess-panel-head"><div><h4>Akses Cepat</h4><p>Fungsi yang paling sering digunakan.</p></div></div><div class="ess-shortcut-grid">${quickButton("attendance", "attendance", "Presensi Saya")}${quickButton("leave", "leave", "Ajukan Cuti")}${quickButton("schedule", "schedule", "Jadwal Kerja")}${quickButton("salary", "salary", "Slip Gaji")}</div></article><article class="ess-panel"><div class="ess-panel-head"><div><h4>Hari Ini</h4><p>${esc(prettyDate(dateKey()))}</p></div></div><div class="ess-today-list"><div class="ess-today-row"><span>Presensi<strong>${esc(today?.datang || "Belum absen")}</strong></span>${badge(today ? statusOf(today) : "Belum Absen")}</div><div class="ess-today-row"><span>Jadwal<strong>${esc(today?.shift || "Belum tersedia")}</strong></span>${badge(today?.shift || "Info")}</div><div class="ess-today-row"><span>Pengajuan<strong>Tidak ada pengajuan aktif</strong></span>${badge("Selesai")}</div></div></article></section></div>`;
  }

  function attendanceTable(groups, monitoring) {
    const rows = groups.length ? groups.map((g) => `<tr>${monitoring ? `<td><strong>${esc(g.name)}</strong></td>` : ""}<td>${esc(prettyDate(g.date))}</td><td>${esc(g.shift || "-")}</td><td>${esc(g.datang || "-")}</td><td>${esc(g.pulang || "-")}</td><td>${esc(duration(g))}</td><td>${badge(statusOf(g))}</td><td>${esc(g.warning || "-")}</td></tr>`).join("") : `<tr><td colspan="${monitoring ? 8 : 7}">Belum ada catatan presensi.</td></tr>`;
    return `<div class="ess-table-wrap"><table class="ess-table"><thead><tr>${monitoring ? "<th>Karyawan</th>" : ""}<th>Tanggal</th><th>Shift</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Durasi</th><th>Status</th><th>Catatan</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function getEmployeeGroups() { return state.groups.filter((g) => (!state.employeeFilter.date || g.date === state.employeeFilter.date) && (!state.employeeFilter.status || statusOf(g) === state.employeeFilter.status)); }
  function renderEmployeeAttendance() { const c = document.getElementById("essContent"); if (!c) return; c.innerHTML = `<article class="ess-panel"><div class="ess-panel-head"><div><h4>Presensi Saya</h4><p>Riwayat pribadi bulan berjalan.</p></div></div><div class="ess-table-tools"><input class="ess-control" id="essSearchDate" type="date" value="${esc(state.employeeFilter.date)}"><select class="ess-control" id="essStatusFilter"><option value="">Semua status</option><option${state.employeeFilter.status === "Hadir" ? " selected" : ""}>Hadir</option><option${state.employeeFilter.status === "Terlambat" ? " selected" : ""}>Terlambat</option><option${state.employeeFilter.status === "Tidak Hadir" ? " selected" : ""}>Tidak Hadir</option></select><button class="ess-tool-button" type="button" data-ess-export>Export CSV</button></div>${errorLine()}${attendanceTable(getEmployeeGroups(), false)}</article>`; }

  const employeeModules = {
    schedule: ["schedule", "Jadwal kerja belum tersedia", "Kalender shift, hari kerja, libur, dan detail jadwal akan tampil setelah jadwal dipublikasikan."],
    leave: ["leave", "Cuti & Izin", "Ajukan cuti/izin, simpan draft, unggah lampiran, lalu pantau status approval dari halaman ini."],
    overtime: ["overtime", "Lembur", "Ajukan lembur dan pantau riwayat beserta status persetujuannya."],
    salary: ["salary", "Slip Gaji", "Slip yang sudah dipublikasikan owner/admin akan tersedia untuk dilihat dan diunduh sebagai PDF."],
    documents: ["document", "Dokumen Saya", "Kontrak, BPJS, NPWP, surat izin, dan dokumen personal akan tampil aman di sini."],
    announcements: ["announcement", "Pengumuman", "Informasi meeting, libur, THR, perubahan shift, dan peraturan akan tampil di sini."]
  };
  function renderEmployeeModule(name) { const c = document.getElementById("essContent"); if (!c) return; const data = employeeModules[name] || employeeModules.documents; c.innerHTML = `<article class="ess-panel">${empty(data[0], data[1], data[2])}</article>`; }

  function renderMonitoringDashboard() {
    const c = document.getElementById("monitoringContent"); if (!c) return; const s = summary(state.groups); const employees = new Set(state.groups.map((g) => norm(g.name)).filter(Boolean)); const todayPresent = new Set(s.today.filter((g) => g.datang).map((g) => norm(g.name))).size; const late = s.today.filter((g) => statusOf(g) === "Terlambat").length; const absent = Math.max(0, employees.size - todayPresent); const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return dateKey(d); });
    c.innerHTML = `<div class="ess-module-shell">${welcome(true)}${errorLine()}<section class="ess-stats">${stat("people", "is-blue", "Total Karyawan", employees.size, "Aktif terpantau")}${stat("attendance", "is-green", "Hadir Hari Ini", todayPresent, "Sudah absen")}${stat("schedule", "is-orange", "Terlambat", late, "Hari ini")}${stat("attendance", "is-red", "Belum Absen", absent, "Hari ini")}${stat("leave", "is-purple", "Sedang Cuti", 0, "Karyawan")}${stat("overtime", "is-pink", "Sedang Lembur", s.today.filter((g) => g.overtime).length, "Karyawan")}${stat("document", "is-yellow", "Approval Pending", 0, "Menunggu")}${stat("salary", "is-cyan", "Slip Belum Publish", 0, "Slip")}</section><section class="ess-grid-2"><article class="ess-panel"><div class="ess-panel-head"><div><h4>Tren Kehadiran 7 Hari</h4><p>Jumlah karyawan yang melakukan presensi.</p></div></div><div class="ess-chart">${days.map((day) => { const val = new Set(state.groups.filter((g) => g.date === day && g.datang).map((g) => norm(g.name))).size; const max = Math.max(1, employees.size); return `<span style="--height:${Math.max(5, Math.round(val / max * 100))}%" data-label="${day.slice(-2)}"></span>`; }).join("")}</div></article><article class="ess-panel"><div class="ess-panel-head"><div><h4>Perlu Tindakan</h4><p>Prioritas operasional hari ini.</p></div></div><div class="ess-today-list"><div class="ess-today-row"><span>Belum Absen<strong>${absent} karyawan</strong></span>${badge(absent ? "Periksa" : "Selesai")}</div><div class="ess-today-row"><span>Terlambat<strong>${late} karyawan</strong></span>${badge(late ? "Periksa" : "Selesai")}</div><div class="ess-today-row"><span>Approval<strong>0 pengajuan</strong></span>${badge("Selesai")}</div></div></article></section></div>`;
  }
  const monitoringModules = {
    schedule: ["schedule", "Monitoring Jadwal", "CRUD jadwal, assign shift, copy jadwal, dan kalender seluruh karyawan tersedia di modul ini."],
    leave: ["leave", "Monitoring Cuti", "Approval, reject, revisi, komentar, lampiran, dan riwayat persetujuan dikelola di sini."],
    overtime: ["overtime", "Monitoring Lembur", "Approval lembur, perhitungan upah otomatis, dan riwayat tersedia di sini."],
    salary: ["salary", "Monitoring Slip Gaji", "Generate massal/per karyawan, publish, unpublish, dan unduh PDF dikelola di sini."],
    documents: ["document", "Monitoring Dokumen", "Upload, kategori, arsip, dan penghapusan dokumen dikelola di sini."],
    announcements: ["announcement", "Monitoring Pengumuman", "Buat, edit, pin, jadwalkan, lampirkan, dan publish pengumuman."],
    "attendance-recap": ["chart", "Rekap Kehadiran", "Rekap kehadiran siap difilter dan diekspor ke PDF/Excel."],
    "payroll-recap": ["salary", "Rekap Payroll", "Rekap payroll lintas periode dan karyawan tersedia di sini."],
    settings: ["document", "Pengaturan ESS", "Kelola workflow approval, notifikasi otomatis, audit log, dan kebijakan modul."]
  };
  function getMonitoringGroups() { return state.groups.filter((g) => (!state.monitoringFilter.date || g.date === state.monitoringFilter.date) && (!state.monitoringFilter.status || statusOf(g) === state.monitoringFilter.status) && (!state.monitoringFilter.search || norm(g.name).includes(norm(state.monitoringFilter.search)))); }
  function renderMonitoringAttendance() { const c = document.getElementById("monitoringContent"); if (!c) return; c.innerHTML = `<article class="ess-panel"><div class="ess-panel-head"><div><h4>Monitoring Presensi</h4><p>Data seluruh karyawan, filter, statistik, koreksi, dan export.</p></div><button class="ess-tool-button" type="button" data-open-presensi>Koreksi Presensi</button></div><div class="ess-table-tools"><input class="ess-control" id="monitorDate" type="date" value="${esc(state.monitoringFilter.date)}"><input class="ess-control" id="monitorSearch" type="search" value="${esc(state.monitoringFilter.search)}" placeholder="Cari karyawan..."><select class="ess-control" id="monitorStatus"><option value="">Semua status</option><option${state.monitoringFilter.status === "Hadir" ? " selected" : ""}>Hadir</option><option${state.monitoringFilter.status === "Terlambat" ? " selected" : ""}>Terlambat</option><option${state.monitoringFilter.status === "Tidak Hadir" ? " selected" : ""}>Tidak Hadir</option></select><button class="ess-tool-button is-primary" type="button" data-monitoring-export>Export CSV</button></div>${errorLine()}${attendanceTable(getMonitoringGroups(), true)}</article>`; }
  function renderMonitoringModule(name) { const c = document.getElementById("monitoringContent"); if (!c) return; const data = monitoringModules[name] || monitoringModules.settings; c.innerHTML = `<article class="ess-panel">${empty(data[0], data[1], data[2])}</article>`; }

  function switchEmployee(name) { state.employeeTab = name; document.querySelectorAll("[data-ess-tab]").forEach((b) => b.classList.toggle("is-active", b.dataset.essTab === name)); if (name === "dashboard") renderESSDashboard(); else if (name === "attendance") renderEmployeeAttendance(); else renderEmployeeModule(name); }
  function switchMonitoring(name) { state.monitoringTab = name; document.querySelectorAll("[data-monitoring-tab]").forEach((b) => b.classList.toggle("is-active", b.dataset.monitoringTab === name)); if (name === "dashboard") renderMonitoringDashboard(); else if (name === "attendance") renderMonitoringAttendance(); else renderMonitoringModule(name); }
  function exportCsv(monitoring) { const groups = monitoring ? getMonitoringGroups() : getEmployeeGroups(); const header = monitoring ? ["Karyawan", "Tanggal", "Shift", "Jam Masuk", "Jam Pulang", "Durasi", "Status", "Catatan"] : ["Tanggal", "Shift", "Jam Masuk", "Jam Pulang", "Durasi", "Status", "Catatan"]; const rows = groups.map((g) => monitoring ? [g.name, g.date, g.shift, g.datang, g.pulang, duration(g), statusOf(g), g.warning] : [g.date, g.shift, g.datang, g.pulang, duration(g), statusOf(g), g.warning]); const csv = [header].concat(rows).map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); a.download = `${monitoring ? "monitoring" : "presensi-saya"}-${dateKey()}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); }
  function bind() { document.addEventListener("click", (event) => { const e = event.target.closest("[data-ess-tab]"); if (e) switchEmployee(e.dataset.essTab); const m = event.target.closest("[data-monitoring-tab]"); if (m) switchMonitoring(m.dataset.monitoringTab); if (event.target.closest("[data-ess-export]")) exportCsv(false); if (event.target.closest("[data-monitoring-export]")) exportCsv(true); if (event.target.closest("[data-open-presensi]")) document.querySelector('[data-view-target="presensi"]')?.click(); }); document.addEventListener("input", (event) => { if (event.target.id === "essSearchDate") { state.employeeFilter.date = event.target.value; renderEmployeeAttendance(); } if (event.target.id === "monitorSearch") { state.monitoringFilter.search = event.target.value; renderMonitoringAttendance(); } }); document.addEventListener("change", (event) => { if (event.target.id === "essStatusFilter") { state.employeeFilter.status = event.target.value; renderEmployeeAttendance(); } if (event.target.id === "monitorDate") { state.monitoringFilter.date = event.target.value; renderMonitoringAttendance(); } if (event.target.id === "monitorStatus") { state.monitoringFilter.status = event.target.value; renderMonitoringAttendance(); } }); document.querySelector("[data-ess-refresh]")?.addEventListener("click", async () => { await load(true); switchEmployee(state.employeeTab); }); document.querySelector("[data-monitoring-refresh]")?.addEventListener("click", async () => { await load(true); switchMonitoring(state.monitoringTab); }); }
  document.addEventListener("DOMContentLoaded", bind);
  document.addEventListener("ess:view", async (event) => { await load(false); if (event.detail.view === "presensi-karyawan") switchEmployee(state.employeeTab); if (event.detail.view === "monitoring-presensi" && isAdmin()) switchMonitoring(state.monitoringTab); });
}());