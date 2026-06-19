const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const screenshotDir = path.resolve(__dirname, "..", "screenshots");

const medicines = [
  {
    kode: "899999900001",
    nama: "Paracetamol 500 mg Tablet",
    kategori: "Tablet",
    stok: 24,
    satuan_beli: "Box",
    harga_beli: 12000,
    satuan_1: "Tablet",
    isi_1: 100,
    harga_jual_1: 500,
    stok_min: 50,
    satuan_stok_min: "Tablet",
    suplier: "PT Mega Mulia Pharma",
    pabrik: "Nadhira Generik",
    expired: "2027-12-31",
    indikasi: "Demam dan nyeri ringan",
    komposisi: "Paracetamol",
    kekuatan: "500 mg",
    lokasi: "Rak A1",
    no_batch: "PCT2606"
  },
  {
    kode: "899999900002",
    nama: "Pseudoephedrine Syrup",
    kategori: "Sirup",
    stok: 8,
    satuan_beli: "Botol",
    harga_beli: 18500,
    satuan_1: "Botol",
    isi_1: 1,
    harga_jual_1: 24000,
    stok_min: 12,
    satuan_stok_min: "Botol",
    suplier: "Kimia Farma Trading",
    pabrik: "Nadhira Farma",
    expired: "2027-08-20",
    indikasi: "Dekongestan",
    komposisi: "Pseudoephedrine HCl",
    kekuatan: "30 mg/5 ml",
    lokasi: "Rak B2",
    no_batch: "PSD2606"
  }
];

const suppliers = [
  {
    id: "supplier-1",
    name: "PT Mega Mulia Pharma",
    pic: "Budi Setia",
    phone: "0812-1234-5678",
    address: "Jl. Sehat No. 12, Palembang",
    city: "Palembang",
    status: "Aktif"
  },
  {
    id: "supplier-2",
    name: "Kimia Farma Trading",
    pic: "Siti Rahma",
    phone: "0822-9876-5432",
    address: "Jl. Distribusi No. 9, Palembang",
    city: "Palembang",
    status: "Aktif"
  }
];

const restockRequests = [
  {
    id: "restock-001",
    code: "899999900002",
    medicineName: "Pseudoephedrine Syrup",
    supplier: "Kimia Farma Trading",
    qty: 4,
    unit: "Botol",
    currentStock: 8,
    stockUnit: "Botol",
    realStock: 6,
    realStockUnit: "Botol",
    priority: "Tinggi",
    status: "open",
    reporter: "Yolan Alfarel",
    reporterKey: "owner",
    note: "Stok turun dari batas minimum.",
    createdAt: "2026-06-14T01:30:00.000Z",
    updatedAt: "2026-06-14T01:30:00.000Z",
    history: []
  }
];

const employees = [
  {
    id: "emp-1",
    name: "Yolan Alfarel",
    job: "Owner",
    email: "owner@nadhira.test",
    phone: "0812-0000-0000",
    status: "Aktif"
  },
  {
    id: "emp-2",
    name: "Meisyi Amalia",
    job: "Admin",
    email: "meisyi@nadhira.test",
    phone: "0812-1111-2222",
    status: "Aktif"
  },
  {
    id: "emp-3",
    name: "Andi Nonaktif",
    job: "Kasir",
    email: "andi@nadhira.test",
    phone: "0812-3333-4444",
    status: "Non Aktif"
  }
];

const ownerSession = {
  username: "owner",
  name: "Yolan Alfarel",
  role: "Owner",
  email: "owner@nadhira.test",
  phone: "0812-0000-0000",
  status: "Aktif",
  menu: "dashboard,absensi_face_id,presensi,cari_data_obat,data_obat,filter_data_obat,edit_obat,hapus_obat,data_karyawan,data_supplier,restok_obat,surat_pesanan,import_data_obat,akun_profil,log_aktivitas,manajemen_pengguna,akses_semua_data",
  loginAt: Date.now(),
  expiresAt: Date.now() + 12 * 60 * 60 * 1000
};

function localStorageSeed() {
  return {
    "nadhira.authSession": ownerSession,
    "nadhira.userRecords": [{
      id: "owner",
      name: "Yolan Alfarel",
      username: "owner",
      role: "Owner",
      status: "Aktif",
      email: "owner@nadhira.test",
      access: ownerSession.menu.split(",")
    }],
    "nadhira.supplierRecords": suppliers,
    "nadhira.employeeRecords": employees,
    "nadhira.purchaseOrders": [],
    "nadhira.restockRequests": restockRequests,
    "nadhira.pharmacyIdentity": {
      name: "Apotek Nadhira Farma",
      address: "Jl. Raya Desa Terate Kecamatan Sirah Pulau Padang, Kabupaten Ogan Komering Ilir, Sumatera Selatan, 30651",
      phone: "0812-3456-7890",
      email: "apotek@nadhira.test",
      website: "apoteknadhira.test",
      licenseNumber: "SIA-TEST-2026",
      responsiblePharmacist: "Apt. Yolan Alfarel",
      sipaNumber: "SIPA-TEST-2026"
    }
  };
}

async function mockBackend(page) {
  await page.route("https://script.google.com/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "GET" && url.searchParams.get("sheet") === "data_obat") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: medicines, uploadedAt: "2026-06-14T01:00:00.000Z" })
      });
      return;
    }

    let body = {};
    try {
      body = JSON.parse(request.postData() || "{}");
    } catch (error) {
      body = {};
    }

    const action = body.action || "";
    const response = {
      success: true,
      ok: true,
      users: [localStorageSeed()["nadhira.userRecords"][0]],
      employees,
      suppliers,
      orders: [],
      requests: restockRequests,
      records: [],
      settings: {},
      profile: localStorageSeed()["nadhira.pharmacyIdentity"]
    };

    if (action === "savePurchaseOrders") response.orders = Array.isArray(body.orders) ? body.orders : [];
    if (action === "saveRestockRequests") response.requests = Array.isArray(body.requests) ? body.requests : restockRequests;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response)
    });
  });
}

async function seedSession(page) {
  await page.addInitScript((seed) => {
    sessionStorage.setItem("nadhira.authSession", JSON.stringify(seed["nadhira.authSession"]));

    Object.entries(seed).forEach(([key, value]) => {
      if (key !== "nadhira.authSession") localStorage.setItem(key, JSON.stringify(value));
    });
  }, localStorageSeed());
}

async function saveShot(page, name, options = {}) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDir, name),
    fullPage: options.fullPage !== false
  });
}

async function assertNoLayoutOverflow(page) {
  const result = await page.evaluate(() => {
    const overflowElements = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || !element.getClientRects().length) return false;
        if (element.closest(".purchase-table-wrap, .purchase-product-table-wrap, .simple-table-wrap, .data-table-wrap, .attendance-table-wrap, .activity-table-wrap")) return false;
        const rect = element.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) return false;
        return rect.left < -6 || rect.right > window.innerWidth + 6;
      })
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        id: element.id || "",
        className: String(element.className || ""),
        text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
        rect: element.getBoundingClientRect().toJSON()
      }));
    const visibleTextBlocks = Array.from(document.querySelectorAll("body *"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none"
          && style.visibility !== "hidden"
          && element.getClientRects().length
          && (element.textContent || "").trim();
      })
      .map((element) => {
        const style = window.getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || "",
          className: String(element.className || ""),
          text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
          fontSize: Number.parseFloat(style.fontSize || "0")
        };
      })
      .filter((item) => item.fontSize > 64);

    return { overflowElements, visibleTextBlocks };
  });

  expect(result.overflowElements).toEqual([]);
  expect(result.visibleTextBlocks).toEqual([]);
}

async function openDashboardView(page, view) {
  const sidebarLink = page.locator(`.sidebar-link[data-view-target="${view}"]`);
  if (await sidebarLink.isVisible().catch(() => false)) {
    await sidebarLink.click();
  } else {
    await page.goto(`/index.html?view=${view}`);
  }
  await page.locator(`#view-${view}`).waitFor({ state: "visible" });
}

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
  await seedSession(page);
});

test("halaman surat pesanan tampil stabil dan form produk berfungsi", async ({ page }, testInfo) => {
  let nativeDialogSeen = false;
  page.on("dialog", async (dialog) => {
    nativeDialogSeen = true;
    await dialog.dismiss();
  });

  await page.goto("/index.html?view=surat-pesanan");
  await page.locator("#view-surat-pesanan").waitFor({ state: "visible" });
  if ((page.viewportSize()?.width || 0) > 900) {
    await expect(page.locator("body")).not.toHaveClass(/sidebar-collapsed/);
  }
  if (await page.locator("#sidebarToggle").isVisible().catch(() => false)) {
    const sidebarIconBefore = await page.locator("#sidebarToggle path").evaluateAll((paths) => paths.map((path) => path.getAttribute("d")).join("|"));
    await page.locator("#sidebarToggle").click();
    const sidebarIconAfter = await page.locator("#sidebarToggle path").evaluateAll((paths) => paths.map((path) => path.getAttribute("d")).join("|"));
    expect(sidebarIconAfter).toBe(sidebarIconBefore);
    await page.locator("#sidebarToggle").click();
  }
  await expect(page.locator("#poOpenCount")).toHaveText("0");
  await expect(page.locator("#poImportDraftButton")).toHaveCount(0);
  await expect(page.locator("#poExportButton")).toHaveCount(0);
  await expect(page.locator("#poFilterButton")).toHaveCount(0);
  await expect(page.locator('[data-profile-tab="aktivitas"]')).toHaveCount(0);
  await expect(page.locator("#profileActivityList")).toHaveCount(0);
  await expect(page.locator("#clearProfileActivityButton")).toHaveCount(0);
  await expect(page.locator("#poOrdersTableBody")).toContainText("Belum ada pesanan pembelian online");
  await assertNoLayoutOverflow(page);
  await saveShot(page, `${testInfo.project.name}-01-surat-pesanan-list.png`);

  await page.locator("#poNewButton").click();
  await page.locator("#purchaseFormView").waitFor({ state: "visible" });
  await expect(page.locator("#poFormTitle")).toHaveText("Pesanan Baru");
  await expect(page.locator("#poSupplier")).toContainText("PT Mega Mulia Pharma");
  await assertNoLayoutOverflow(page);
  await saveShot(page, `${testInfo.project.name}-02-pesanan-baru.png`);

  await page.locator("#poSupplier").selectOption("PT Mega Mulia Pharma");
  await page.locator("#poDate").fill("2026-06-16");
  await page.locator("#poPaymentMethod").selectOption("Tempo");
  await expect(page.locator("#poDueDaysField")).toBeVisible();
  await page.locator("#poDueDays").fill("14");
  await expect(page.locator("#poDueDate")).toHaveValue("2026-06-30");
  await expect(page.locator("#poRecipient")).toHaveValue("Budi Setia");
  await expect(page.locator("#poCity")).toHaveValue("Palembang");
  await expect(page.locator("#poPurpose")).toHaveCount(0);
  await page.locator("#poNote").fill("Kirim sebelum siang");
  await page.locator("#poAdditionalNote").fill("Konfirmasi stok sebelum dikirim.");
  await page.locator("#poType").selectOption("prekursor");
  await expect(page.locator("#poProductHead")).toContainText("Zat Aktif");
  await expect(page.locator("#poProductHead")).toContainText("Bentuk Sediaan");

  await page.locator('input[data-po-field="productSearch"][data-po-index="0"]').fill("paracetamol");
  await expect(page.locator("#poProductSearchPopup")).toBeVisible();
  await expect(page.locator("#poProductRows .purchase-product-results")).toHaveCount(0);
  await expect(page.locator('[data-po-select-product="0"][data-po-result-index="0"]')).toBeVisible();
  await page.locator('[data-po-select-product="0"][data-po-result-index="0"]').dispatchEvent("click");
  await expect(page.locator("#poProductSearchPopup")).toBeHidden();
  await expect(page.locator('input[data-po-field="productSearch"][data-po-index="0"]')).toHaveValue("Paracetamol 500 mg Tablet");
  await expect(page.locator('input[data-po-field="dosageForm"][data-po-index="0"]')).toHaveValue("");
  await page.locator('input[data-po-field="qty"][data-po-index="0"]').fill("3");
  await expect(page.locator("#poSummaryItems")).toHaveText("1 item");
  await expect(page.locator("#poSummaryQty")).toHaveText("3");
  await assertNoLayoutOverflow(page);
  await saveShot(page, `${testInfo.project.name}-03-prekursor-autofill.png`);

  await page.locator('[data-po-draft-add="restock-001"]').click();
  await expect(page.locator('input[data-po-field="productSearch"][data-po-index="1"]')).toHaveValue("Pseudoephedrine Syrup");
  await expect(page.locator('[data-po-draft="restock-001"]')).toHaveCount(0);
  await assertNoLayoutOverflow(page);
  await saveShot(page, `${testInfo.project.name}-04-draft-restok-dipilih.png`);

  await page.locator("#poSaveOrderButton").click();
  await expect(page.locator("#poSummaryModal")).toBeVisible();
  await expect(page.locator("#poSummaryTotal")).toContainText("Rp");
  await page.locator("#poSummaryConfirmButton").click();
  await page.locator("#purchaseListView").waitFor({ state: "visible" });
  await expect(page.locator("#poOrdersTableBody")).toContainText("PT Mega Mulia Pharma");
  await expect(page.locator(".purchase-row-menu-trigger").first()).toBeVisible();
  await expect(page.locator(".purchase-row-action").first()).not.toBeVisible();
  await saveShot(page, `${testInfo.project.name}-05-surat-pesanan-tersimpan.png`);

  await page.locator(".purchase-row-menu-trigger").first().click();
  await expect(page.locator("[data-po-view]").first()).toBeVisible();
  await page.locator("[data-po-view]").first().click();
  await expect(page.locator("#poDetailPanel")).toBeVisible();
  await expect(page.locator("#poDetailContent")).toContainText("Informasi Pesanan");
  await page.locator("#printPoButton").click();
  await expect(page.locator(".purchase-print-settings-card")).toBeVisible();
  await page.locator('.purchase-print-settings-card select[name="orientation"]').selectOption("portrait");
  await page.locator('.purchase-print-settings-card select[name="paperSize"]').selectOption("A4");
  await page.locator('.purchase-print-settings-card input[name="fontSize"]').fill("10");
  const popupPromise = page.waitForEvent("popup");
  await page.locator(".purchase-print-settings-actions .is-primary").click();
  const printPage = await popupPromise;
  await printPage.waitForLoadState("domcontentloaded");
  await expect(printPage).toHaveTitle("");
  await expect(printPage.locator(".print-preview-toolbar")).toBeVisible();
  await expect(printPage.locator("#sendWhatsappButton")).toBeVisible();
  await expect(printPage.locator(".brand-text h1")).toContainText("Apotek Nadhira Farma");
  await expect(printPage.locator(".title")).toContainText(/No\. SP\. \d{6}-001/);
  await expect(printPage.locator(".print-footer")).toContainText("SURAT PESANAN");
  await expect(printPage.locator("table.purchase-print-table")).toBeVisible();
  await expect(printPage.locator("table.purchase-print-table")).not.toContainText("Batch");
  await expect(printPage.locator(".print-notes")).toContainText("Note : Kirim sebelum siang");
  const printColumnWidths = await printPage.evaluate(() => {
    const name = document.querySelector("td.name")?.getBoundingClientRect().width || 0;
    const qty = document.querySelector("td.qty")?.getBoundingClientRect().width || 0;
    return { name, qty };
  });
  expect(printColumnWidths.name).toBeGreaterThan(printColumnWidths.qty * 2);
  await printPage.close();
  await saveShot(page, `${testInfo.project.name}-06-detail-po-modal.png`, { fullPage: false });
  await page.locator("#poCloseDetailButton").click();

  await page.locator(".purchase-row-menu-trigger").first().click();
  await page.locator("[data-po-edit]").first().click();
  await page.locator("#purchaseFormView").waitFor({ state: "visible" });
  await expect(page.locator("#poFormTitle")).toHaveText("Edit Pesanan");
  await page.locator("#poBackButton").click();
  await page.locator("#purchaseListView").waitFor({ state: "visible" });

  await page.locator(".purchase-row-menu-trigger").first().click();
  await page.locator("[data-po-delete]").first().click();
  await expect(page.locator(".confirm-dialog")).toBeVisible();
  await expect(page.locator(".confirm-dialog")).toContainText("Hapus Surat Pesanan");
  await page.locator(".confirm-ok").click();
  expect(nativeDialogSeen).toBe(false);
  await expect(page.locator("#poOrdersTableBody")).toContainText("Belum ada pesanan pembelian online");

  await openDashboardView(page, "restok-obat");
  await page.locator('[data-restock-action="detail"]').first().click();
  await expect(page.locator("#restockDetailModal")).toBeVisible();
  await expect(page.locator("#restockDetailBody")).not.toContainText("Botol Botol");
  await saveShot(page, `${testInfo.project.name}-07-detail-restok-modern.png`, { fullPage: false });
  await page.locator("#closeRestockDetailButton").click();

  await openDashboardView(page, "log-aktivitas");
  await expect(page.locator("#activityLogTitle")).toHaveText("Log Aktivitas");
  await expect(page.locator("#activityModuleFilter")).toContainText("Surat Pesanan Pembelian");
  await expect(page.locator("#activityModuleFilter")).toContainText("Data Karyawan");
  await expect(page.locator("#activityUserFilter")).toContainText("Meisyi Amalia");
  await expect(page.locator("#activityUserFilter")).not.toContainText("Andi Nonaktif");
  await expect(page.locator("#activityLogTableBody")).toContainText(/Surat pesanan|Belum ada log aktivitas/);
  await saveShot(page, `${testInfo.project.name}-08-log-aktivitas.png`);
});
