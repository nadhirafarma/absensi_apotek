async function verify() {
  const url = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec?sheet=data_obat";
  const res = await fetch(url);
  const data = await res.json();
  const rows = Array.isArray(data) ? data : (data.data || []);
  const invalid = rows.filter(row => String(row.stok ?? "").includes("30.12") || /1899/.test(String(row.stok ?? "")));
  console.log("Total obat:", rows.length);
  console.log("Stok tanggal/30.12 tersisa:", invalid.length);
  console.log("Sampel stok kosong:", rows.filter(row => Number(row.stok) === 0).slice(0, 3).map(row => ({ nama: row.nama, stok: row.stok })));
  if (invalid.length) {
    console.log("Data invalid:", invalid.slice(0, 5).map(row => ({ nama: row.nama, stok: row.stok })));
    process.exitCode = 1;
  }
}

verify().catch(error => {
  console.error(error);
  process.exitCode = 1;
});