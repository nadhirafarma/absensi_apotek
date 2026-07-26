// Verifikasi mirror GAS root <-> source clasp byte-identik.
// Pakai: node tools/check_gas_mirrors.js   (exit 0 = identik, exit 1 = drift/missing)
// Rujukan SOP: docs/ops/deploy-sop.md (langkah "cek hash sama" setelah salin mirror).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const PAIRS = [
  {
    name: "GAS A (dataObatAuth)",
    clasp: "tools/gas-a/Kode.js",
    mirror: "google-apps-script-api-search-box-final.gs"
  },
  {
    name: "GAS B (attendanceAndPayroll)",
    clasp: "tools/gas-script-1/Kode.js",
    mirror: "google-apps-script-absensi-api.gs"
  }
];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

let failed = false;
for (const pair of PAIRS) {
  const claspPath = path.join(root, pair.clasp);
  const mirrorPath = path.join(root, pair.mirror);
  const missing = [claspPath, mirrorPath].filter((p) => !fs.existsSync(p));
  if (missing.length) {
    failed = true;
    console.error(`✗ ${pair.name}: file tidak ditemukan: ${missing.join(", ")}`);
    continue;
  }
  const claspHash = sha256(claspPath);
  const mirrorHash = sha256(mirrorPath);
  if (claspHash === mirrorHash) {
    console.log(`✓ ${pair.name}: identik (sha256 ${claspHash.slice(0, 12)}…)`);
  } else {
    failed = true;
    console.error(`✗ ${pair.name}: DRIFT!`);
    console.error(`    clasp  ${pair.clasp}  ${claspHash}`);
    console.error(`    mirror ${pair.mirror}  ${mirrorHash}`);
    console.error(`    Salin ulang dari source clasp ke mirror (lihat docs/ops/deploy-sop.md).`);
  }
}

process.exit(failed ? 1 : 0);
