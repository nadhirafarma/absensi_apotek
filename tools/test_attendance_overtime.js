const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("assets/home-dashboard.js", "utf8");
function extract(name) {
  const start = source.indexOf("  function " + name + "(");
  const end = source.indexOf("\n  function ", start + 1);
  return source.slice(start, end);
}
const label = { firstChild: { textContent: "Jam Datang" } };
const pulang = { hidden: false };
const els = {
  attendanceEditDatang: { closest: () => label },
  attendanceEditPulang: { closest: () => pulang, disabled: false },
  attendanceEditStatus: { textContent: "" }
};
const context = vm.createContext({ els });
vm.runInContext(extract("setAttendanceEditOvertimeMode"), context);
context.setAttendanceEditOvertimeMode(true);
assert.equal(label.firstChild.textContent, "Jam Lembur");
assert.equal(pulang.hidden, true);
assert.equal(els.attendanceEditPulang.disabled, true);
context.setAttendanceEditOvertimeMode(false);
assert.equal(label.firstChild.textContent, "Jam Datang");
assert.equal(pulang.hidden, false);
assert.equal(els.attendanceEditPulang.disabled, false);
const start = source.indexOf('    const isOvertime = els.attendanceEditShift?.value');
const end = source.indexOf('    const warningMessage =', start);
const build = new Function("els", "group", "isAddMode", "normalizeAttendanceDateKey", "normalizeAttendanceShift", "inferAttendanceShift", "normalizeAttendanceTime", source.slice(start, end) + "return { isOvertime, shift, jamDatang, jamPulang, jamLembur };");
const identity = value => value;
function payload(shift, add, group = {}) {
  return build({ attendanceEditShift: { value: shift }, attendanceEditName: { value: "Ayu" }, attendanceEditDate: { value: "2026-10-28" }, attendanceEditDatang: { value: "18:00" }, attendanceEditPulang: { value: "22:00" } }, group, add, identity, identity, () => "SHIFT SORE", identity);
}
assert.deepEqual(payload("LEMBUR", true), { isOvertime: true, shift: "SHIFT SORE", jamDatang: "", jamPulang: "", jamLembur: "18:00" });
assert.equal(payload("LEMBUR", false, { shift: "SHIFT PAGI" }).shift, "SHIFT PAGI");
assert.deepEqual(payload("SHIFT PAGI", true), { isOvertime: false, shift: "SHIFT PAGI", jamDatang: "18:00", jamPulang: "22:00", jamLembur: "" });
const files = ["index.html", ...fs.readdirSync(".", { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith(".")).map(d => d.name + "/index.html")].filter(p => fs.existsSync(p));
let pages = 0;
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes('id="attendanceEditShift"')) continue;
  assert.match(html, /<option value="LEMBUR">LEMBUR<\/option>/, file);
  assert.match(html, /home-dashboard\.js\?v=20261028-presensi-owner-v1/, file);
  pages++;
}
assert.equal(pages, 16);
console.log("attendance overtime self-check: OK (16 pages, form mode, add/edit payload)");
