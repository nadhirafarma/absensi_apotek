const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const source = read("assets/home-dashboard.js");

for (const file of ["assets/home-dashboard.js", "assets/auth-guard.js", "assets/landing.js", "assets/login.js", "tools/generate_clean_routes.js"]) {
  new vm.Script(read(file), { filename: file });
}

assert.match(source, /async function loadCurrentUserAccess\(\)[\s\S]*Promise\.allSettled\(\[[\s\S]*fetchRolePolicies\(\{ deferAccessApply: true \}\)[\s\S]*fetchUsers\(\{ force: false, deferAccessApply: true \}\)/);
assert.match(source, /else if \(!state\.rolePoliciesReady \|\| !state\.userAccessReady \|\| user\.authoritative !== true\) \{\s*access = \[\];/);
assert.match(source, /normalizeAccessMode\(user\.accessMode\) === "override"[\s\S]*getDefaultAccessForRole\(user\.role \|\| "Operator"/);
assert.match(source, /return isAdminUser\(user\) \? access : access\.filter\(\(key\) => key !== "import_data_obat"\);/);
assert.doesNotMatch(source, /const userAccess = normalizeAccessList\(user\.access \|\| \[\]\);/);
assert.doesNotMatch(source, /userAccess\.filter\(\(key\) => roleSet\.has\(key\)\)/);
assert.match(source, /state\.userAccessReady = false;[\s\S]*if \(options\.deferAccessApply !== true && !state\.accessSnapshot\) applyCurrentUserAccess\(\);[\s\S]*return state\.users;/);
assert.match(source, /element\.hidden = !allowed;[\s\S]*element\.classList\.toggle\("is-access-hidden", !allowed\);[\s\S]*element\.style\.setProperty\("display", "none", "important"\);/);
assert.match(source, /const ROLE_FETCH_TTL_MS = 60000;[\s\S]*const USER_FETCH_TTL_MS = 60000;/);
assert.match(source, /showCachedAccessWhileLoading\(\)[\s\S]*restoreAccessSnapshot\(\) \|\| restoreSessionAccessSnapshot\(\)[\s\S]*access-cache-ready/);
assert.match(source, /function restoreSessionAccessSnapshot\(\)[\s\S]*session\.access \?\? session\.menu[\s\S]*state\.accessSnapshot = access[\s\S]*access-cache-ready/);
assert.match(source, /if \(state\.accessSnapshot && \(!state\.rolePoliciesReady \|\| !state\.userAccessReady\)\) \{\s*access = state\.accessSnapshot\.slice\(\);/);
assert.match(source, /loadStoredModules\(\{ applyAccess: !accessRestored \}\)/);
assert.match(source, /PHARMACY_PROFILE_CACHE_TTL_MS[\s\S]*OWNER_ACTIVITY_CACHE_TTL_MS[\s\S]*ATTENDANCE_SHIFT_CACHE_TTL_MS/);
assert.match(source, /window\.setTimeout\(finishAccessLoading, 2500\)/);
assert.doesNotMatch(source, /addProfileActivity\(`Buka menu/);
assert.match(source, /Date\.now\(\) - readStoredNumber\(PO_SYNC_AT_KEY\) >= PURCHASE_CACHE_TTL_MS/);
assert.match(source, /Date\.now\(\) - readStoredNumber\(RESTOCK_SYNC_AT_KEY\) >= RESTOCK_CACHE_TTL_MS/);
assert.match(source, /Date\.now\(\) - readStoredNumber\(LOCAL_RECORDS_SYNC_AT_KEY\) >= MENU_CACHE_TTL_MS/);
assert.match(source, /Date\.now\(\) - readStoredNumber\(OWNER_ACTIVITY_SYNC_AT_KEY\) >= OWNER_ACTIVITY_CACHE_TTL_MS/);

const initSource = between(source, "  function init() {", "  function readInitialViewRequest() {");
const sessionGateAt = initSource.indexOf("if (!readSession())");
assert.ok(sessionGateAt >= 0, "init: session gate");
for (const marker of ["bindElements()", "loadStoredModules(", "routeInitialViewFromQuery()", "fetchDataObat()", "loadCurrentUserAccess()"]) {
  assert.ok(sessionGateAt < initSource.indexOf(marker), `init: session gate before ${marker}`);
}
assert.match(initSource, /if \(!readSession\(\)\) \{\s*redirectToLanding\(\);\s*return;\s*\}/);
assert.match(source, /function finishAccessLoading\(\) \{\s*if \(!readSession\(\)\) \{\s*redirectToLanding\(\);\s*return;[\s\S]*classList\.remove\("access-loading", "access-cache-ready"\)/);
assert.match(source, /function readSession\(\)[\s\S]*Number\.isFinite\(expiresAt\)[\s\S]*Date\.now\(\) >= expiresAt[\s\S]*sessionStorage\.removeItem\(SESSION_KEY\)/);
assert.match(source, /const next = `\$\{window\.location\.pathname \|\| "\/"\}\$\{window\.location\.search \|\| ""\}\$\{window\.location\.hash \|\| ""\}`;\s*window\.location\.replace\(`\/beranda\.html\?next=\$\{encodeURIComponent\(next\)\}`\);/);

const localFetch = between(source, "  async function fetchLocalRecords(options = {}) {", "  async function pushLocalRecordsToBackend");
assert.ok(localFetch.indexOf("if (state.localRecordsFetchPromise)") < localFetch.indexOf("MENU_CACHE_TTL_MS"), "local records: active request before TTL");
assert.match(localFetch, /state\.localRecordsFetchPromise = \(async \(\) => \{/);
assert.match(localFetch, /return await state\.localRecordsFetchPromise;\s*\} finally \{\s*state\.localRecordsFetchPromise = null;/);
const bootstrapPush = between(source, "  async function pushLocalRecordsToBackend", "  function parsePayload");
assert.doesNotMatch(bootstrapPush, /fetchLocalRecords\(/);
assert.doesNotMatch(source, /skipBootstrap/);

const activityFetch = between(source, "  async function fetchOwnerActivityLog(options = {}) {", "  function normalizeActivityRecord");
assert.ok(activityFetch.indexOf("if (state.ownerActivityFetchPromise)") < activityFetch.indexOf("OWNER_ACTIVITY_CACHE_TTL_MS"), "activity: active request before TTL");
assert.match(activityFetch, /state\.ownerActivityFetchPromise = \(async \(\) => \{/);
assert.match(activityFetch, /return await state\.ownerActivityFetchPromise;\s*\} finally \{\s*state\.ownerActivityFetchPromise = null;/);

const guardSource = read("assets/auth-guard.js");
const cleanNext = "/dashboard/?view=summary#stock";
let guard = runGuard({ pathname: "/dashboard/", search: "?view=summary", hash: "#stock" });
assert.deepStrictEqual(guard.redirects, [`/beranda.html?next=${encodeURIComponent(cleanNext)}`]);
assert.strictEqual(guard.removed, true);
guard = runGuard({ pathname: "/dashboard/", session: { expiresAt: Date.now() - 1 } });
assert.strictEqual(guard.redirects.length, 1);
assert.strictEqual(guard.removed, true);
guard = runGuard({ pathname: "/dashboard/", session: { expiresAt: Date.now() + 60000 } });
assert.deepStrictEqual(guard.redirects, []);
assert.strictEqual(guard.removed, false);
assert.doesNotMatch(guardSource, /index\.html/);

const safeValues = ["/", "/dashboard/", "/data-karyawan/?mode=compact#row-7"];
const unsafeValues = ["https://evil.example/", "//evil.example/", "javascript:alert(1)", "dashboard/", "\\evil.example\\", "/\\evil.example/"];
const landingSafeNext = compileFunction(read("assets/landing.js"), "getSafeNext");
for (const value of safeValues) assert.strictEqual(landingSafeNext(value), value, `landing accepts ${value}`);
for (const value of unsafeValues) assert.strictEqual(landingSafeNext(value), "/", `landing rejects ${value}`);
const loginSafeNext = compileFunction(read("assets/login.js"), "getSafeNextUrl", {
  URLSearchParams,
  window: { location: { search: "" } }
});
for (const value of safeValues) {
  loginSafeNext.context.window.location.search = `?next=${encodeURIComponent(value)}`;
  assert.strictEqual(loginSafeNext(), value, `login accepts ${value}`);
}
for (const value of unsafeValues) {
  loginSafeNext.context.window.location.search = `?next=${encodeURIComponent(value)}`;
  assert.strictEqual(loginSafeNext(), "/", `login rejects ${value}`);
}
assert.match(read("assets/landing.js"), /loginLink\.href = `\/login\.html\?next=/);

const appViews = [
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
const appHtml = read("index.html");
assert.ok(appHtml.includes("assets/auth-guard.js?v=20260731-auth-flow-v1"));
assert.ok(appHtml.includes("assets/home-dashboard.js?v=20260803-salary-import-v1"));
assert.ok(appHtml.includes("assets/ess.js?v=20260806-salary-fix-v2"));
assert.ok(appHtml.includes("assets/styles.css?v=20260810-sidebar-uniform-v5"));
assert.ok(appHtml.includes("assets/ess.css?v=20260806-salary-fix-v2"));
assert.ok(appHtml.includes("assets/ui-polish.css?v=20260810-sidebar-uniform-v5"));
const sidebar = between(appHtml, '<aside class="app-sidebar"', '<div class="sidebar-scrim"');
const sidebarLinks = sidebar.match(/<[^>]*class="sidebar-link(?:\s[^"]*)?"[\s\S]*?<\/(?:a|button)>/g) || [];
const sidebarIconSources = [
  "assets/mobile-menu/dashboard.png",
  "assets/mobile-menu/absensi.png",
  "assets/mobile-menu/presensi.png",
  "assets/mobile-menu/presensi.png",
  "assets/mobile-menu/monitoring-presensi.png",
  "assets/mobile-menu/cari-data-obat.png",
  "assets/mobile-menu/data-obat.png",
  "assets/mobile-menu/data-karyawan.png",
  "assets/mobile-menu/data-supllier.png",
  "assets/mobile-menu/surat-pesanan-pembelian.png",
  "assets/mobile-menu/restok-obat.png",
  "assets/mobile-menu/impor-data-obat.png",
  "assets/mobile-menu/setting.png",
  "assets/mobile-menu/log-aktivitas.png",
  "assets/mobile-menu/managemen-pengguna.png",
  "assets/mobile-menu/data-role.png"
];
assert.strictEqual(sidebarLinks.length, sidebarIconSources.length, "sidebar link count");
const sidebarIcons = sidebarLinks.map((link, index) => {
  assert.doesNotMatch(link, /<svg\b/, `sidebar link ${index}: no SVG`);
  const match = link.match(/<img class="sidebar-icon" src="([^"]+)" alt="" aria-hidden="true">/);
  assert.ok(match, `sidebar link ${index}: decorative PNG icon`);
  return match[1].split("?", 1)[0];
});
assert.deepStrictEqual(sidebarIcons, sidebarIconSources, "sidebar PNG mapping");
for (const src of sidebarIconSources) assert.ok(fs.existsSync(path.join(root, src)), `sidebar asset: ${src}`);
const sidebarSvgs = sidebar.match(/<svg\b[^>]*>/g) || [];
assert.strictEqual(sidebarSvgs.length, 2, "sidebar chevron count");
for (const svg of sidebarSvgs) assert.match(svg, /class="sidebar-section-chevron"/, "sidebar SVG is chevron");
assert.match(appHtml, /localStorage\.getItem\("nadhira\.sidebarCollapsed"\) === "1"/);
assert.match(appHtml, /classList\.toggle\("sidebar-collapsed", sidebarCollapsed\)[\s\S]*classList\.toggle\("sidebar-open", !sidebarCollapsed\)/);
assert.match(appHtml, /<span id="todayLabel">Hari ini<\/span>/);
assert.ok(appHtml.includes('data-view-target="presensi" data-access-key="presensi"'));
assert.ok(appHtml.includes('data-view-target="presensi-karyawan" data-access-key="presensi_karyawan"'));
for (const view of appViews) {
  const route = `${view}/index.html`;
  assert.strictEqual(read(route), setInitialView(injectBase(appHtml), view), `${route}: generated parity`);
}
assert.strictEqual(read("beranda/index.html"), injectBase(read("beranda.html")), "beranda route parity");
assert.strictEqual(read("login/index.html"), injectBase(read("login.html")), "login route parity");
assert.ok(read("beranda.html").includes("assets/landing.js?v=20260731-auth-flow-v1"));
assert.ok(read("login.html").includes("assets/login.js?v=20260731-auth-flow-v1"));
assert.ok(read("absensi.html").includes("assets/auth-guard.js?v=20260731-auth-flow-v1"));

const uiPolish = read("assets/ui-polish.css");
assert.match(uiPolish, /\[data-access-key\]\.is-access-hidden[\s\S]*\.app-sidebar \.sidebar-link\.is-access-hidden[\s\S]*display: none !important;/);
assert.doesNotMatch(uiPolish, /Memuat menu/);
assert.match(uiPolish, /body\.sidebar-collapsed \.app-sidebar \.sidebar-link \{[\s\S]*width: 44px !important;[\s\S]*margin-inline: auto !important;[\s\S]*justify-content: center !important;/);
assert.match(uiPolish, /body\.sidebar-collapsed \.app-sidebar \.sidebar-section-toggle \{[\s\S]*width: 44px !important;[\s\S]*min-height: 44px !important;[\s\S]*justify-content: center !important;/);
assert.match(uiPolish, /#sidebarToggle\.header-pharmacy-toggle \{\s*overflow: hidden !important;/);
assert.match(uiPolish, /body\.sidebar-collapsed #sidebarToggle \.header-pharmacy-copy,[\s\S]*display: none !important;[\s\S]*visibility: hidden !important;/);
assert.match(source, /function readSavedSidebarCollapsed\(\)[\s\S]*localStorage\.getItem\(SIDEBAR_KEY\) === "1"/);
assert.match(source, /setSidebarCollapsed\(isMobileViewport\(\) \? true : readSavedSidebarCollapsed\(\), \{ persist: false \}\)/);
assert.match(source, /options\.persist !== false && !isMobileViewport\(\)/);
assert.match(source, /aria-expanded", collapsed \? "false" : "true"/);
assert.match(read("assets/app.js"), /group\.setAttribute\("aria-hidden", expanded \? "false" : "true"\);[\s\S]*group\.inert = !expanded/);
assert.match(read("assets/app.js"), /sidebarToggle\.click\(\)/);
assert.ok(appHtml.includes('id="appSidebar"'));
assert.ok(appHtml.includes('aria-controls="appSidebar"'));
assert.match(uiPolish, /@media \(min-width: 901px\)[\s\S]*--app-sidebar-rail-width/);
assert.match(uiPolish, /@media \(max-width: 900px\)[\s\S]*translateX\(calc\(-100% - 12px\)\)/);
assert.match(source, /function getDefaultSalaryHistoryFilter\(\)[\s\S]*function renderSalaryHistoryPagination\(\)/);
assert.doesNotMatch(appHtml, /salaryHistoryDate/);
assert.doesNotMatch(source, /salaryHistoryDate/);
assert.match(source, /const result = await postToApi\(\{\s*action: "import_data_obat"/);
assert.match(source, /mode === "replace"[\s\S]*showConfirmDialog/);
assert.match(source, /return isAdminUser\(user\) \? access : access\.filter\(\(key\) => key !== "import_data_obat"\);/);
assert.doesNotMatch(source, /apoteker:\s*\[[^\]]*"import_data_obat"/);
assert.doesNotMatch(source, /"staf gudang":\s*\[[^\]]*"import_data_obat"/);
const essSource = read("assets/ess.js");
assert.match(essSource, /function dedupeSalarySlips\(rows\)/);
assert.match(essSource, /data-salary-apply/);
assert.doesNotMatch(essSource, /essSalaryDate/);
assert.match(uiPolish, /\.dashboard-topbar:has\(\.header-profile-menu \.profile-dropdown:not\(\[hidden\]\)\) \{[\s\S]*z-index: 1600 !important;[\s\S]*overflow: visible !important;/);

const styles = read("assets/styles.css");
assert.match(styles, /\.app-sidebar \.sidebar-icon \{[\s\S]*width: 30px;[\s\S]*height: 30px;[\s\S]*flex: 0 0 30px;[\s\S]*object-fit: contain;/);
assert.match(uiPolish, /2026-08-10 sidebar icons:[\s\S]*body\.theme-dark\.sidebar-open \.app-sidebar \.sidebar-link \.sidebar-icon \{[\s\S]*width: 36px !important;[\s\S]*height: 36px !important;[\s\S]*flex: 0 0 36px !important;[\s\S]*border-radius: 50% !important;[\s\S]*object-fit: contain !important;[\s\S]*clip-path: circle\(50%\) !important;[\s\S]*transition: none !important;[\s\S]*body\.theme-dark\.sidebar-collapsed \.app-sidebar \.sidebar-link \.sidebar-icon \{[\s\S]*width: 36px !important;[\s\S]*height: 36px !important;[\s\S]*flex: 0 0 36px !important;[\s\S]*border-radius: 50% !important;[\s\S]*object-fit: contain !important;[\s\S]*clip-path: circle\(50%\) !important;[\s\S]*transition: none !important;/);
assert.doesNotMatch(uiPolish, /\.app-sidebar \.sidebar-link svg/);
assert.match(source, /const actionCell = canEdit && group\.editable !== false/);
assert.doesNotMatch(source, /const actionCell = canEdit && group\.editable !== false && !group\.isOvertime/);
assert.match(source, /function setAttendanceEditOvertimeMode\(isOvertime\)[\s\S]*Jam Lembur[\s\S]*pulangLabel\.hidden = isOvertime[\s\S]*attendanceEditPulang\.disabled = isOvertime/);
assert.match(source, /group\.isOvertime \? \(group\.lembur \|\| ""\) : \(group\.datang \|\| ""\)/);
assert.match(source, /const isOvertime = !isAddMode && group\.isOvertime;[\s\S]*const jamLembur = isOvertime \? primaryTime : "";/);
assert.match(source, /jamLembur,[\s\S]*lemburRow: isOvertime \? \(group\.lemburRow \|\| 0\) : 0/);
const attendanceApi = read("tools/gas-script-1/Kode.js");
const attendanceMirror = read("google-apps-script-absensi-api.gs");
assert.strictEqual(attendanceApi, attendanceMirror, "attendance GAS mirror parity");
assert.match(attendanceApi, /payload\.lemburRow \|\| payload\.overtimeRow[\s\S]*payload\.jamLembur \|\| payload\.lembur \|\| ''[\s\S]*'LEMBUR'/);
assert.match(styles, /#view-data-role \.role-access-table \{\s*table-layout: fixed !important;\s*width: 100% !important;/);
assert.match(styles, /#view-data-role \.role-access-table \.pill-tag \{[\s\S]*?max-width: 100% !important;[\s\S]*?white-space: normal !important;[\s\S]*?overflow-wrap: anywhere !important;/);
assert.doesNotMatch(styles, /#view-akun-profil \.profile-avatar-large \{\s*margin-top: -48px/);
assert.match(source, /profileLargeAvatar\.addEventListener\("click", openProfilePhotoViewer\)/);
assert.match(source, /event\.key !== "Enter" && event\.key !== " "/);
assert.match(source, /function ensureProfilePhotoViewer\(\)[\s\S]*document\.createElement\("dialog"\)[\s\S]*showModal\(\)/);
assert.match(source, /function openProfilePhotoViewer\(\)[\s\S]*!\/\^data:image\\\//);
assert.match(source, /if \(closeProfilePhotoViewer\(\)\) return;/);
assert.match(styles, /#profileLargeAvatar\.has-photo\[role="button"\][\s\S]*cursor: zoom-in;/);
assert.match(styles, /\.profile-photo-viewer::backdrop[\s\S]*background: rgba\(3, 10, 24, 0\.82\);/);

console.log("home access checks: PASS");

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function between(text, start, end) {
  const startAt = text.indexOf(start);
  const endAt = text.indexOf(end, startAt + start.length);
  assert.ok(startAt >= 0 && endAt > startAt, `source block: ${start}`);
  return text.slice(startAt, endAt);
}

function runGuard({ pathname, search = "", hash = "", session = null }) {
  const redirects = [];
  const state = { removed: false };
  const context = {
    Date,
    Number,
    encodeURIComponent,
    window: {
      location: {
        pathname,
        search,
        hash,
        replace(value) {
          redirects.push(value);
        }
      }
    },
    sessionStorage: {
      getItem() {
        return session ? JSON.stringify(session) : null;
      },
      removeItem() {
        state.removed = true;
      }
    }
  };
  vm.runInNewContext(guardSource, context);
  return { redirects, get removed() { return state.removed; } };
}

function compileFunction(text, name, globals = {}) {
  const match = text.match(new RegExp(`  function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\}`));
  assert.ok(match, `function ${name}`);
  const context = { ...globals };
  vm.runInNewContext(`${match[0]}\nthis.compiled = ${name};`, context);
  const compiled = context.compiled.bind(context);
  compiled.context = context;
  return compiled;
}

function injectBase(html) {
  if (/<base\s/i.test(html)) return html;
  return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n  <base href="/">`);
}

function setInitialView(html, view) {
  return html.replace(/<body\b([^>]*)>/i, (full, attrs) => {
    const next = /\sdata-initial-view=/i.test(attrs)
      ? attrs.replace(/\sdata-initial-view="[^"]*"/i, ` data-initial-view="${view}"`)
      : `${attrs} data-initial-view="${view}"`;
    return `<body${next}>`;
  });
}
