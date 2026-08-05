// Self-check Import Data Obat. Jalankan: node tools/test_import_data_obat.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const frontend = fs.readFileSync(path.join(root, "assets/home-dashboard.js"), "utf8");
const backend = fs.readFileSync(path.join(root, "tools/gas-a/Kode.js"), "utf8");

const importHelpers = between(frontend, "  function detectCsvDelimiter", "  async function importExcelToGoogleSheet");
const normalizeKey = between(frontend, "  function normalizeKey", "  function readSession");
const context = {
  DATA_COLUMNS: [
    { key: "kode" },
    { key: "nama" },
    { key: "harga_beli" },
    { key: "stok" }
  ],
  PRICE_COLUMNS: new Set(["harga_beli"]),
  QUANTITY_COLUMNS: new Set(["stok"])
};
vm.runInNewContext(`${normalizeKey}
${importHelpers}
this.api = { detectCsvDelimiter, parseCsvMatrix, matrixToImportRows, parseImportNumber };`, context);
const { detectCsvDelimiter, parseCsvMatrix, matrixToImportRows, parseImportNumber } = context.api;

assert.strictEqual(detectCsvDelimiter('kode,nama,catatan'), ',');
assert.strictEqual(detectCsvDelimiter('kode;nama;catatan'), ';');
assert.strictEqual(detectCsvDelimiter('kode\tnama\tcatatan'), '\t');
assert.strictEqual(detectCsvDelimiter('kode;nama;catatan\nA1;"Obat, Anak";aman'), ';');

let parsed = matrixToImportRows(parseCsvMatrix('﻿kode;nama;harga_beli;stok\r\nA1;"Obat; Anak";1234567;1500'));
assert.strictEqual(parsed.rows[0].nama, 'Obat; Anak');
assert.strictEqual(parsed.rows[0].harga_beli, 1234567);
assert.strictEqual(parsed.rows[0].stok, 1500);
parsed = matrixToImportRows(parseCsvMatrix('kode,nama,catatan\nA1,"Obat\nAnak","aman"'));
assert.strictEqual(parsed.rows[0].nama, 'Obat\nAnak');
assert.strictEqual(parseImportNumber('Rp 1.234.567'), 1234567);
assert.strictEqual(parseImportNumber('1.234,50'), 1234.5);
assert.strictEqual(parseImportNumber('12x'), null);
assert.throws(() => matrixToImportRows([["kode", "Kode", "nama"], ["A1", "A2", "Obat"]]), /Header duplikat/);
assert.throws(() => matrixToImportRows([["kode", "stok"], ["A1", "1"]]), /Header wajib/);
assert.throws(() => matrixToImportRows([["kode", "nama"], ["", "Obat"]]), /kode dan nama wajib/);
assert.throws(() => matrixToImportRows([["kode", "nama"], ["A1", "Satu"], ["A1", "Dua"]]), /Kode duplikat/);

assert.match(frontend, /const result = await postToApi\(\{\s*action: "import_data_obat"/);
assert.doesNotMatch(frontend, /fetch\(getImportApiUrl\(\)/);
assert.match(frontend, /mode === "replace"[\s\S]*showConfirmDialog/);
assert.match(frontend, /return isAdminUser\(user\) \? access : access\.filter\(\(key\) => key !== "import_data_obat"\)/);

assert.match(backend, /return handleImportDataObat_\(data, session\)/);
assert.match(backend, /function handleImportDataObat_\(payload, session\)/);
assert.match(backend, /mode != 'replace' && mode != 'append'/);
assert.match(backend, /normalizedHeaders\.indexOf\('kode'\)[\s\S]*normalizedHeaders\.indexOf\('nama'\)/);
assert.match(backend, /Kode duplikat dalam file import/);
assert.match(backend, /sudah ada di data/);
assert.doesNotMatch(between(backend, "function handleImportDataObat_", "function normalizeDataObatImportValue_"), /clearContents\(|clear\(\)/);
const replaceBlock = between(backend, "// Write new data (header + rows)", "SpreadsheetApp.flush();");
assert.ok(replaceBlock.indexOf("setValues(fullMatrix)") < replaceBlock.indexOf("clearContent()"), "replace writes before clearing stale cells");

console.log("Import Data Obat self-check: PASS");

function between(text, start, end) {
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end, startAt + start.length);
  assert.ok(startAt >= 0 && endAt > startAt, `source block: ${start}`);
  return text.slice(startAt, endAt);
}
