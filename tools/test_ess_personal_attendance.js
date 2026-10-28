// Jalankan: node tools/test_ess_personal_attendance.js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(require("node:path").join(__dirname, "../assets/ess.js"), "utf8");
const personal = source.slice(source.indexOf("  function personalGroups()"), source.indexOf("  async function load(force)"));
const group = source.slice(source.indexOf("  function groupRecords(records)"), source.indexOf("  function statusOf(g)"));
const summary = source.match(/  function summary\(groups\) \{[^\n]+/)[0];
const sandbox = {
  session: () => ({ name: "Meisyi Amalia", username: "admin" }),
  employeeName: () => "Meisyi Amalia",
  norm: (value) => String(value || "").toLowerCase().trim(),
  monthKey: () => "2026-10",
  dateKey: () => "2026-10-28",
  statusOf: (g) => g.datang ? "Hadir" : "Tidak Hadir",
  state: { records: [
    { name: "Meisyi Amalia", date: "2026-10-28", time: "13:07", status: "DATANG" },
    { name: "MEISYI-AMALIA", date: "2026-10-28", time: "13:08", status: "DATANG" },
    { name: "Meisyi Amalia", date: "2026-10-27", time: "08:00", status: "DATANG" },
    { name: "Karyawan Lain", date: "2026-10-28", time: "07:00", status: "DATANG" },
    { name: "Admin", date: "2026-10-28", time: "09:00", status: "DATANG" }
  ] }
};
vm.createContext(sandbox);
vm.runInContext(`${group}\n${summary}\n${personal}\nthis.result = { personal: personalGroups(), all: groupRecords(state.records) };`, sandbox);
assert.equal(sandbox.result.personal.length, 2);
assert.equal(sandbox.result.personal[0].datang, "13:07");
assert.equal(vm.runInContext("summary(result.personal).hadir", sandbox), 2);
assert.equal(vm.runInContext("summary(result.all).hadir", sandbox), 5);
console.log("ESS personal attendance self-check: OK");
