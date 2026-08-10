const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const gasPath = "tools/gas-script-1/Kode.js";
const frontendPath = "assets/attendance.js";
const gas = fs.readFileSync(gasPath, "utf8");
const frontend = fs.readFileSync(frontendPath, "utf8");
const context = vm.createContext({ console });
vm.runInContext(gas, context, { filename: gasPath });

assert.equal(context.getAbsensiMonthSheetName_("2026-07-01"), "Absensi_Juli2026");
assert.equal(context.getAbsensiMonthSheetName_("2026-08-31"), "Absensi_Agustus2026");
assert.throws(() => context.getAbsensiMonthSheetName_("2026-13-01"), /Tanggal absensi tidak valid/);
const rowA = context.normalizeAbsensiStoredRow_(["09/08/2026 13:41:40", "Ayu_Novalia", "PULANG", "SHIFT SORE", "", "", "", "", "", "", "", "", "", "", "", ""], {
  timestamp: 0, name: 1, status: 2, shift: 3, photo: 4, fileId: 5, latitude: 6, longitude: 7, gpsAccuracy: 8, gpsDistance: 9, warning: 10, warningFlag: 11, updatedAt: 12, updatedBy: 13, dateKey: 14, timeText: 15
});
const rowB = context.normalizeAbsensiStoredRow_(["09/08/2026 13:41:40", "Ayu Novalia", "PULANG", "", "", "", "", "", "", "", "", "", "", "", "2026-08-09", "13:41"], {
  timestamp: 0, name: 1, status: 2, shift: 3, photo: 4, fileId: 5, latitude: 6, longitude: 7, gpsAccuracy: 8, gpsDistance: 9, warning: 10, warningFlag: 11, updatedAt: 12, updatedBy: 13, dateKey: 14, timeText: 15
});
assert.equal(context.buildAbsensiMigrationRecordKey_(rowA), context.buildAbsensiMigrationRecordKey_(rowB));
const plan = context.calculateAbsensiMigrationPlan_([rowA], [rowA, rowB]);
assert.equal(plan.appendable, 0);
assert.equal(plan.duplicates, 2);
assert.ok(gas.indexOf("checkAbsensiHariIni_(spreadsheet, nama)") < gas.indexOf("saveAbsensiPhoto_(payload"), "anti-duplikat harus berjalan sebelum foto disimpan");
assert.match(gas, /makeCopy\(spreadsheet\.getName\(\) \+ '_BACKUP_SEBELUM_MIGRASI_/);
assert.match(frontend, /for \(let attempt = 0; attempt < 2; attempt \+= 1\)/);
assert.match(frontend, /transient: lastError\?\.transient !== false/);

console.log("attendance monthly self-check: OK");