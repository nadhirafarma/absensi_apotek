// Diagnostic: Cek mana GAS A live yang dipakainya
// GAS A URL ada di assets/*.js — ekstrak dan cek isinya

const fs = require("fs");
const path = require("path");

async function checkEndpoint(url, label, action, method = "POST") {
  try {
    const body = method === "POST" ? JSON.stringify({ action, sessionToken: "", username: "", email: "" }) : undefined;
    const res = await fetch(url + (method === "GET" ? `?action=${action}` : ""), {
      method,
      headers: method === "POST" ? { "Content-Type": "text/plain;charset=utf-8" } : undefined,
      body,
      timeout: 5000
    });
    const text = await res.text();
    let j;
    try { j = JSON.parse(text); } catch (e) { j = { raw: text.slice(0, 100) }; }
    return { label, url, action, status: res.status, j };
  } catch (e) {
    return { label, url, action, error: e.message };
  }
}

async function main() {
  // Ekstrak GAS A URL dari assets
  const files = ["assets/login.js", "assets/app.js", "assets/home-dashboard.js"];
  const urls = new Set();
  
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, "utf8");
      const matches = content.match(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g);
      if (matches) matches.forEach(u => urls.add(u));
    } catch (e) {
      console.log(`! Tidak bisa baca ${f}`);
    }
  }

  console.log("\n=== GAS A URLs ditemukan di assets ===");
  for (const u of urls) {
    console.log("  " + u);
  }

  console.log("\n=== Test validatePharmacySession_ — check if code updated ===");
  if (urls.size > 0) {
    const url = Array.from(urls)[0];
    const res = await checkEndpoint(url, "POST listLoginUsers (harus reject)", "listLoginUsers", "POST");
    console.log(JSON.stringify(res, null, 2));
    
    if (res.j && res.j.ok === true) {
      console.log("\n❌ GAGAL: listLoginUsers masih OK (open) — kode lama masih jalan");
      console.log("   Kemungkinan: Deployment belum diupdate / file yang salah ter-paste");
    } else if (res.j && res.j.ok === false) {
      console.log("\n✓ OK: listLoginUsers ditolak — validatePharmacySession_ aktif");
    }
  }
}

main().catch(e => console.error("Error:", e));
