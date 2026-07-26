const base = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec";

async function post(action, body = {}) {
  const r = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...body })
  });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch (e) { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, j };
}

async function get(qs) {
  const r = await fetch(base + "?" + qs, { cache: "no-store" });
  const t = await r.text();
  let j;
  try { j = JSON.parse(t); } catch (e) { j = { raw: t.slice(0, 300) }; }
  return { status: r.status, j };
}

async function main() {
  const tests = [];
  tests.push(["POST getPharmacyProfile no token (public)", await post("getPharmacyProfile")]);
  tests.push(["POST getAttendanceShiftSettings no token (public)", await post("getAttendanceShiftSettings")]);
  tests.push(["POST getDataObatFilter no token (public)", await post("getDataObatFilter")]);
  tests.push(["POST listLoginUsers no token (must reject)", await post("listLoginUsers")]);
  tests.push(["POST listActivityLog no token (must reject)", await post("listActivityLog")]);
  tests.push(["GET listLoginUsers no token (must reject)", await get("action=listLoginUsers&t=" + Date.now())]);

  for (const [name, res] of tests) {
    const j = res.j || {};
    console.log("---");
    console.log(name);
    console.log("HTTP", res.status, "success", j.success, "ok", j.ok, "message", j.message || j.error || "");
    if (j.raw) console.log("raw", j.raw);
    if (Array.isArray(j.data)) console.log("dataLen", j.data.length);
    if (Array.isArray(j.users)) console.log("usersLen", j.users.length);
    if (Array.isArray(j.records)) console.log("recordsLen", j.records.length);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
