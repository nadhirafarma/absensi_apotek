// Self-check fitur Slip Gaji ESS. Jalankan: node tools/test_ess_salary.js
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync(require("path").join(__dirname, "../assets/ess.js"), "utf8");

async function renderSalary(role, history, monitoring) {
  const listeners = {};
  const containers = { essContent: { innerHTML: "" }, monitoringContent: { innerHTML: "" } };
  const requests = [];
  const document = {
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
    getElementById(id) { return containers[id] || null; },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const session = { sessionToken: "token-test", role, name: "Ayu Novalia", username: "ayu" };
  const context = {
    document,
    sessionStorage: { getItem() { return JSON.stringify(session); } },
    fetch: async (input) => {
      const url = new URL(input);
      requests.push(url);
      return { ok: true, json: async () => ({ ok: true, success: true, history }) };
    },
    URL,
    Intl,
    Date,
    Blob,
    setTimeout,
    console
  };
  vm.runInNewContext(source, context, { filename: "assets/ess.js" });
  for (const handler of listeners.DOMContentLoaded || []) handler();
  const tabSelector = monitoring ? "[data-monitoring-tab]" : "[data-ess-tab]";
  const tab = monitoring ? { dataset: { monitoringTab: "salary" } } : { dataset: { essTab: "salary" } };
  const target = { closest(selector) { return selector === tabSelector ? tab : null; } };
  await listeners.click[0]({ target });
  return { html: containers[monitoring ? "monitoringContent" : "essContent"].innerHTML, requests };
}

(async () => {
  const employee = await renderSalary("karyawan", [{
    name: "Ayu Novalia", nip: "K-01", period: "Juli <script>alert(1)</script>",
    issuedAt: "2026-07-27T03:02:00Z", netSalary: 600000, fileUrl: "javascript:alert(1)"
  }], false);
  assert.match(employee.html, /Slip Gaji Saya/);
  assert.match(employee.html, /Juli &lt;script&gt;/);
  assert.doesNotMatch(employee.html, /javascript:/);
  assert.match(employee.html, /PDF tidak tersedia/);
  assert.strictEqual(employee.requests[0].searchParams.get("action"), "listSalarySlipHistory");
  assert.strictEqual(employee.requests[0].searchParams.get("sessionToken"), "token-test");
  assert.strictEqual(employee.requests[0].searchParams.has("role"), false);
  assert.strictEqual(employee.requests[0].searchParams.has("name"), false);

  const admin = await renderSalary("owner", [
    { name: "Ayu Novalia", nip: "K-01", period: "Juli 2026", netSalary: 600000, fileUrl: "https://drive.google.com/file/d/ayu" },
    { name: "Budi", nip: "K-02", period: "Juli 2026", netSalary: 700000, fileUrl: "https://drive.google.com/file/d/budi" }
  ], true);
  assert.match(admin.html, /Monitoring Slip Gaji/);
  assert.match(admin.html, /Ayu Novalia/);
  assert.match(admin.html, /Budi/);
  assert.match(admin.html, /Buka PDF/);
  assert.match(admin.html, /https:\/\/drive\.google\.com/);

  const ownerEmployeeView = await renderSalary("owner", [], false);
  assert.match(ownerEmployeeView.html, /Gunakan Monitoring Slip Gaji/);
  assert.strictEqual(ownerEmployeeView.requests.length, 0);
  console.log("ESS salary self-check: OK");
})().catch((error) => { console.error(error); process.exit(1); });
