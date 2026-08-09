const assert = require("assert");
const Utilities = { formatDate(date) { return date.toISOString().slice(0, 10); } };
const ABSENSI_TIMEZONE = "Asia/Jakarta";
const PAYROLL_MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
function normalizeAbsensiKey_(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function getSalaryHistoryRow_(sheet, rowNumber) {
  if (!sheet || rowNumber < 2 || rowNumber > sheet.getLastRow()) return {};
  var headerInfo = ensurePayrollLogHeaders_(sheet);
  var row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var get = function(aliases) {
    var column = findHeaderIndex_(headerInfo.normalized, aliases);
    return column >= 0 ? String(row[column] || '').trim() : '';
  };
  var fileUrl = get(['fileurl', 'url']);
  return {
    fileId: get(['fileid']) || extractDriveFileId_(fileUrl),
    fileName: get(['file']).split('|')[0].trim(),
    fileUrl: fileUrl || get(['file']).split('|').slice(1).join('|').trim()
  };
}

function getSalaryHistoryTime_(value) {
  var time = new Date(value || 0).getTime();
  return isNaN(time) ? 0 : time;
}

function dedupeSalarySlipHistory_(history) {
  var seen = {};
  return (history || []).filter(function(item) {
    var key = String(item.fileId || '').trim()
      || String(item.fileUrl || '').trim()
      || [item.nip || item.name || '', item.period || '', item.fileName || '', item.issuedAt || ''].join('|');
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function parseSalaryHistoryQuery_(params) {
  var month = String(params.month || '').trim();
  var year = String(params.year || '').trim();
  var startDate = String(params.startDate || '').trim();
  var endDate = String(params.endDate || '').trim();
  var employeeId = String(params.employeeId || '').trim();
  var hasPage = params.page !== undefined && String(params.page).trim() !== '';
  var hasLimit = params.limit !== undefined && String(params.limit).trim() !== '';
  var page = Number(params.page || 1);
  var limit = Number(params.limit || 0);

  if (month && !/^(0[1-9]|1[0-2])$/.test(month)) return { ok: false, message: 'Filter bulan tidak valid.' };
  if (year && !/^\d{4}$/.test(year)) return { ok: false, message: 'Filter tahun tidak valid.' };
  if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { ok: false, message: 'Tanggal awal tidak valid.' };
  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return { ok: false, message: 'Tanggal akhir tidak valid.' };
  if (startDate && endDate && startDate > endDate) return { ok: false, message: 'Rentang tanggal tidak valid.' };
  if ((hasPage || hasLimit) && (!isFinite(page) || page < 1 || !isFinite(limit) || limit < 1 || limit > 100)) {
    return { ok: false, message: 'Halaman atau jumlah data tidak valid.' };
  }

  return {
    ok: true,
    month: month,
    year: year,
    startDate: startDate,
    endDate: endDate,
    employeeId: employeeId,
    page: hasPage || hasLimit ? Math.floor(page) : 1,
    limit: hasPage || hasLimit ? Math.floor(limit) : 0,
    paginate: hasPage || hasLimit
  };
}

function matchesSalaryHistoryQuery_(item, query, isAdmin) {
  var period = String(item.period || '').toLowerCase();
  var issuedDate = getSalaryHistoryIssuedDate_(item.issuedAt);
  var employeeId = normalizeAbsensiKey_(query.employeeId || '');

  if (query.month && !salaryHistoryPeriodMatchesMonth_(period, query.month)) return false;
  if (query.year && period.indexOf(query.year) < 0 && issuedDate.slice(0, 4) !== query.year) return false;
  if (query.startDate && (!issuedDate || issuedDate < query.startDate)) return false;
  if (query.endDate && (!issuedDate || issuedDate > query.endDate)) return false;
  if (isAdmin && employeeId && normalizeAbsensiKey_(item.nip || '') !== employeeId) return false;
  return true;
}

function getSalaryHistoryIssuedDate_(value) {
  var date = new Date(value || '');
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, ABSENSI_TIMEZONE, 'yyyy-MM-dd');
}

function salaryHistoryPeriodMatchesMonth_(period, month) {
  var monthName = String(PAYROLL_MONTHS_ID[Number(month) - 1] || '').toLowerCase();
  return period.indexOf(monthName) >= 0 || new RegExp('(?:^|[^0-9])' + month + '(?:[^0-9]|$)').test(period);
}


if (typeof module !== 'undefined') module.exports = {
  parseSalaryHistoryQuery_, matchesSalaryHistoryQuery_, dedupeSalarySlipHistory_
};

const q = parseSalaryHistoryQuery_({ month: "08", year: "2026", startDate: "2026-08-01", endDate: "2026-08-31", page: "1", limit: "2" });
assert.strictEqual(q.ok, true);
assert.strictEqual(parseSalaryHistoryQuery_({ month: "13" }).ok, false);
assert.strictEqual(parseSalaryHistoryQuery_({ startDate: "2026-08-03", endDate: "2026-08-01" }).ok, false);
const rows = [
 {fileId:"a", nip:"K1", period:"Agustus 2026", issuedAt:"2026-08-02T00:00:00Z", rowNumber:2, netSalary:100},
 {fileId:"a", nip:"K1", period:"Agustus 2026", issuedAt:"2026-08-01T00:00:00Z", rowNumber:1, netSalary:100},
 {fileId:"b", nip:"K2", period:"Agustus 2026", issuedAt:"2026-08-03T00:00:00Z", rowNumber:3, netSalary:0},
 {fileId:"c", nip:"K3", period:"Agustus 2026", issuedAt:"2026-08-04T00:00:00Z", rowNumber:4, netSalary:-10}
];
assert.strictEqual(dedupeSalarySlipHistory_(rows).length, 3);
assert.strictEqual(rows.filter(r => matchesSalaryHistoryQuery_(r, q, true)).length, 4);
assert.strictEqual(matchesSalaryHistoryQuery_(rows[0], {...q, employeeId:"K2"}, true), false);
console.log("Salary history helper self-check: OK");
