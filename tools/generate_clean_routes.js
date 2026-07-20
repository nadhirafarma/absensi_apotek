#!/usr/bin/env node
/**
 * generate_clean_routes.js
 *
 * Cara benar: UI/DOM lama TIDAK dipecah.
 * Tiap route/index.html = SALINAN PENUH index.html lama (SPA utuh),
 * hanya beda 2 hal minimal:
 *   1) sisip <base href="/"> agar aset relatif (assets/, absensi.html, dst)
 *      tetap resolve dari root domain walau file berada di /route/.
 *   2) set atribut body[data-initial-view] agar JS lama langsung
 *      menampilkan view yang benar (dibaca readInitialViewRequest()).
 *
 * beranda/ dan login/ = salinan penuh beranda.html & login.html (+ <base href="/">).
 *
 * Aset & href TIDAK diubah. Markup visual/icon/class TIDAK diubah.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// View routes: folder => data-initial-view. Clone dari index.html (SPA app).
const APP_VIEWS = [
  "dashboard",
  "cari-data-obat",
  "presensi",
  "presensi-karyawan",
  "monitoring-presensi",
  "data-obat",
  "data-karyawan",
  "data-supplier",
  "restok-obat",
  "surat-pesanan",
  "import-data-obat",
  "akun-profil",
  "log-aktivitas",
  "manajemen-pengguna",
  "data-role"
];

// Standalone pages: folder => legacy source file (clone penuh + <base href="/">).
const PAGE_ROUTES = {
  beranda: "beranda.html",
  login: "login.html"
};

function readSource(file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) {
    throw new Error(`Source tidak ditemukan: ${file}`);
  }
  return fs.readFileSync(abs, "utf8");
}

function injectBase(html) {
  if (/<base\s/i.test(html)) return html; // sudah ada base
  // sisip tepat setelah <head ...> pertama
  return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n  <base href="/">`);
}

function setInitialView(html, view) {
  // set / ganti data-initial-view di tag <body ...>
  return html.replace(/<body\b([^>]*)>/i, (full, attrs) => {
    let next = attrs;
    if (/\sdata-initial-view=/i.test(next)) {
      next = next.replace(/\sdata-initial-view="[^"]*"/i, ` data-initial-view="${view}"`);
    } else {
      next = `${next} data-initial-view="${view}"`;
    }
    return `<body${next}>`;
  });
}

function writeRoute(folder, html) {
  const dir = path.join(ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, "index.html");
  fs.writeFileSync(target, html, "utf8");
  return path.relative(ROOT, target);
}

function main() {
  const appHtml = readSource("index.html");
  const written = [];

  // 1) App view routes = clone penuh index.html + base + data-initial-view.
  APP_VIEWS.forEach((view) => {
    let html = injectBase(appHtml);
    html = setInitialView(html, view);
    written.push(writeRoute(view, html));
  });

  // 2) Standalone page routes = clone penuh source + base.
  Object.entries(PAGE_ROUTES).forEach(([folder, sourceFile]) => {
    const html = injectBase(readSource(sourceFile));
    written.push(writeRoute(folder, html));
  });

  written.forEach((rel) => console.log(`wrote ${rel}`));
  console.log(`\nDone. ${written.length} route file(s) generated.`);
}

main();
