(function () {
  const SESSION_KEY = "nadhira.authSession";
  const THEME_KEY = "nadhira.landingTheme";
  const PROFILE_PREFS_KEY = "nadhira.profilePreferences";
  const loginLink = document.getElementById("landingLoginLink");
  const languageSelect = document.getElementById("languageSelect");
  const themeToggle = document.getElementById("themeToggle");
  const popup = document.getElementById("landingPopup");
  const popupTitle = document.getElementById("landingPopupTitle");
  const popupText = document.getElementById("landingPopupText");
  const popupClose = document.getElementById("landingPopupClose");
  const popupOk = document.getElementById("landingPopupOk");

  const text = {
    id: {
      login: "Login",
      register: "Daftar Akun",
      shop: "Belanja",
      welcome: "Selamat Datang",
      headline: 'Kelola Apotek Anda<br>dengan <span>Lebih Mudah</span>',
      subhead: "Sistem informasi apotek digital lengkap untuk manajemen data obat, stok, presensi, dan laporan dalam satu platform terintegrasi.",
      feature1Title: "Aman & Terpercaya",
      feature1Text: "Keamanan data terjamin dengan standar perlindungan berlapis.",
      feature2Title: "Operasional Cepat",
      feature2Text: "Pencarian, stok, supplier, dan laporan tersedia dalam satu alur kerja.",
      feature3Title: "Efisien & Praktis",
      feature3Text: "Mengurangi pekerjaan berulang dan memudahkan pengawasan data.",
      feature4Title: "Data Terintegrasi",
      feature4Text: "Informasi penting tersimpan rapi dan dapat diakses sesuai hak pengguna.",
      infoTitle: "Info Penting",
      info1Title: "Stok Obat Real-time",
      info1Text: "Pantau ketersediaan stok secara langsung dan akurat.",
      info2Title: "Laporan Otomatis",
      info2Text: "Dapatkan laporan data dan aktivitas secara otomatis.",
      info3Title: "Akses Multi Perangkat",
      info3Text: "Gunakan sistem dari berbagai perangkat sesuai kebutuhan.",
      hoursTitle: "Jam Operasional",
      hoursText: "Senin - Sabtu: 08.00 - 20.00 WIB<br>Minggu & Hari Libur: 09.00 - 17.00 WIB",
      privacyTitle: "Kebijakan & Privasi Pengguna",
      privacyIntro: "Kami berkomitmen melindungi data dan memberikan layanan terbaik bagi pengguna.",
      privacy1Title: "Kerahasiaan Data",
      privacy1Text: "Data pribadi, stok, supplier, transaksi, dan aktivitas apotek disimpan dengan perlindungan akses berlapis.",
      privacy2Title: "Penggunaan Data",
      privacy2Text: "Data digunakan untuk menjalankan fitur, sinkron antar perangkat, membuat laporan, dan meningkatkan kualitas layanan.",
      privacy3Title: "Transaksi Aman",
      privacy3Text: "Proses penting seperti restok, surat pesanan, presensi, dan perubahan data dibatasi sesuai kewenangan pengguna.",
      privacy4Title: "Hak Pengguna",
      privacy4Text: "Owner dan admin dapat mengatur akses, memperbarui data, membatasi akun, atau menghapus informasi sesuai kebutuhan.",
      privacy5Title: "Persetujuan",
      privacy5Text: "Dengan memakai Indo Apotek, pengguna menyetujui kebijakan privasi, syarat layanan, dan aturan akses yang berlaku.",
      copyright: "Semua hak dilindungi.",
      privacyLink: "Kebijakan Privasi",
      termsLink: "Syarat & Ketentuan",
      helpLink: "Bantuan",
      waTitle: "Hubungi Kami",
      soonTitle: "Segera Tersedia",
      accountSoon: "Pendaftaran akun mandiri sedang disiapkan. Untuk sementara, akun dibuat oleh administrator Indo Apotek.",
      shopSoon: "Menu belanja sedang disiapkan agar katalog dan proses transaksi dapat digunakan dengan nyaman.",
      ok: "Mengerti",
      darkMode: "Aktifkan mode gelap",
      lightMode: "Aktifkan mode terang"
    },
    en: {
      login: "Login",
      register: "Create Account",
      shop: "Shop",
      welcome: "Welcome",
      headline: 'Manage Your Pharmacy<br><span>More Easily</span>',
      subhead: "A complete digital pharmacy information system for medicine data, stock, attendance, and reports in one integrated platform.",
      feature1Title: "Safe & Trusted",
      feature1Text: "Layered protection keeps important pharmacy data secure.",
      feature2Title: "Faster Operations",
      feature2Text: "Search, stock, suppliers, and reports are available in one workflow.",
      feature3Title: "Efficient & Practical",
      feature3Text: "Reduce repetitive work and simplify daily data supervision.",
      feature4Title: "Integrated Data",
      feature4Text: "Important information stays organized and follows user access rights.",
      infoTitle: "Important Info",
      info1Title: "Real-time Medicine Stock",
      info1Text: "Monitor stock availability directly and accurately.",
      info2Title: "Automatic Reports",
      info2Text: "Receive data and activity reports automatically.",
      info3Title: "Multi-device Access",
      info3Text: "Use the system from different devices as needed.",
      hoursTitle: "Operating Hours",
      hoursText: "Monday - Saturday: 08:00 - 20:00<br>Sunday & Holidays: 09:00 - 17:00",
      privacyTitle: "User Policy & Privacy",
      privacyIntro: "We are committed to protecting data and delivering reliable service.",
      privacy1Title: "Data Confidentiality",
      privacy1Text: "Personal data, stock, suppliers, transactions, and pharmacy activity are protected with layered access controls.",
      privacy2Title: "Data Usage",
      privacy2Text: "Data is used to run features, sync devices, generate reports, and improve service quality.",
      privacy3Title: "Secure Transactions",
      privacy3Text: "Key processes such as restock, purchase orders, attendance, and data changes follow user permissions.",
      privacy4Title: "User Rights",
      privacy4Text: "Owners and admins can manage access, update records, limit accounts, or remove information when needed.",
      privacy5Title: "Consent",
      privacy5Text: "Using Indo Apotek means agreeing to the privacy policy, service terms, and access rules.",
      copyright: "All rights reserved.",
      privacyLink: "Privacy Policy",
      termsLink: "Terms & Conditions",
      helpLink: "Help",
      waTitle: "Contact Us",
      soonTitle: "Coming Soon",
      accountSoon: "Self-service account registration is being prepared. For now, accounts are created by the Indo Apotek administrator.",
      shopSoon: "The shopping menu is being prepared so the catalogue and transaction process can be used comfortably.",
      ok: "Got it",
      darkMode: "Enable dark mode",
      lightMode: "Enable light mode"
    }
  };

  const nextUrl = getSafeNext(new URLSearchParams(window.location.search).get("next"));
  const session = readSession();
  if (session) {
    window.location.replace(nextUrl);
    return;
  }

  updateLoginHref();
  applyTheme(getInitialTheme());
  applyLanguage(localStorage.getItem("nadhira.landingLanguage") || "id");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener("change", () => {
      applyLanguage(languageSelect.value === "en" ? "en" : "id");
    });
  }

  document.querySelectorAll("[data-coming-soon]").forEach((button) => {
    button.addEventListener("click", () => {
      const lang = document.querySelector(".landing-page")?.dataset.lang || "id";
      const dictionary = text[lang] || text.id;
      const message = button.dataset.comingSoon === "account" ? dictionary.accountSoon : dictionary.shopSoon;
      showPopup(dictionary.soonTitle, message, dictionary.ok);
    });
  });

  [popupClose, popupOk].forEach((button) => {
    if (button) button.addEventListener("click", hidePopup);
  });

  setupPricingToggle();
  setupScrollReveal();

  if (popup) {
    popup.addEventListener("click", (event) => {
      if (event.target === popup) hidePopup();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hidePopup();
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_KEY && event.key !== PROFILE_PREFS_KEY) return;
    applyTheme(getInitialTheme(), { persist: false });
  });

  function updateLoginHref() {
    if (!loginLink) return;
    loginLink.href = `/login.html?next=${encodeURIComponent(nextUrl)}`;
  }

  function applyTheme(theme, options = {}) {
    const selectedTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = selectedTheme;
    document.documentElement.classList.toggle("theme-dark", selectedTheme === "dark");
    document.documentElement.style.colorScheme = selectedTheme;
    if (options.persist !== false) {
      localStorage.setItem(THEME_KEY, selectedTheme);
      try {
        const prefs = JSON.parse(localStorage.getItem(PROFILE_PREFS_KEY) || "{}") || {};
        localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify({
          ...prefs,
          theme: selectedTheme
        }));
      } catch (error) {
        localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify({ theme: selectedTheme }));
      }
    }
    updateThemeButton();
  }

  function updateThemeButton() {
    if (!themeToggle) return;
    const language = document.querySelector(".landing-page")?.dataset.lang || "id";
    const dictionary = text[language] || text.id;
    const isDark = document.documentElement.dataset.theme === "dark";
    const label = isDark ? dictionary.lightMode : dictionary.darkMode;
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
  }

  function getInitialTheme() {
    try {
      const prefs = JSON.parse(localStorage.getItem(PROFILE_PREFS_KEY) || "{}") || {};
      if (prefs.theme === "dark" || prefs.theme === "light") return prefs.theme;
    } catch (error) {
      /* ignore profile prefs parse error */
    }
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyLanguage(lang) {
    const language = lang === "en" ? "en" : "id";
    const dictionary = text[language] || text.id;
    const page = document.querySelector(".landing-page");
    if (page) page.dataset.lang = language;
    document.documentElement.lang = language;
    if (languageSelect) languageSelect.value = language;
    localStorage.setItem("nadhira.landingLanguage", language);

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (!dictionary[key]) return;
      if (key === "hoursText") element.innerHTML = dictionary[key];
      else element.textContent = dictionary[key];
    });

    const title = document.getElementById("landingTitle");
    if (title) title.innerHTML = dictionary.headline;
    updateThemeButton();
  }

  function setupPricingToggle() {
    const buttons = Array.from(document.querySelectorAll("[data-plan-period]"));
    const panels = Array.from(document.querySelectorAll("[data-pricing-panel]"));
    if (!buttons.length || !panels.length) return;

    function setPeriod(period) {
      const selectedPeriod = period === "yearly" ? "yearly" : "monthly";
      buttons.forEach((button) => {
        const isActive = button.dataset.planPeriod === selectedPeriod;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.pricingPanel === selectedPeriod);
      });
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => setPeriod(button.dataset.planPeriod));
    });
    setPeriod(buttons.find((button) => button.classList.contains("is-active"))?.dataset.planPeriod || "monthly");
  }

  function setupScrollReveal() {
    const selectors = [
      ".information-band",
      ".privacy-section",
      ".pricing-section",
      ".landing-footer"
    ];
    const elements = Array.from(document.querySelectorAll(selectors.join(",")));

    elements.forEach((element, index) => {
      element.classList.add("reveal-slide");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 80}ms`);
    });

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    });

    elements.forEach((element) => observer.observe(element));
  }

  function showPopup(title, message, okText) {
    if (!popup) return;
    if (popupTitle) popupTitle.textContent = title;
    if (popupText) popupText.textContent = message;
    if (popupOk) popupOk.textContent = okText || "OK";
    popup.hidden = false;
  }

  function hidePopup() {
    if (popup) popup.hidden = true;
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const sessionValue = raw ? JSON.parse(raw) : null;
      const expiresAt = Number(sessionValue?.expiresAt);
      if (!sessionValue || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return sessionValue;
    } catch (error) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (_) {
        /* storage unavailable: fail closed */
      }
      return null;
    }
  }

  function getSafeNext(value) {
    const next = String(value || "/");
    if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\x00-\x1f\x7f]/.test(next)) return "/";
    return next;
  }
})();
