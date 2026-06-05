(function () {
  const SESSION_KEY = "nadhira.authSession";
  const loginLink = document.getElementById("landingLoginLink");
  const languageSelect = document.getElementById("languageSelect");
  const menuButton = document.getElementById("landingMenuButton");
  const header = document.querySelector(".landing-header");
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
      headline: "Sehat dimulai dari pilihan yang tepat",
      subhead: "Belanja obat asli dan terpercaya kini semakin mudah. Pilih, pesan, dan kami antar langsung ke rumah Anda.",
      feature1Title: "Lengkap & Original",
      feature1Text: "Ribuan produk obat original dan bergaransi.",
      feature2Title: "Aman & Terpercaya",
      feature2Text: "Transaksi aman, privasi terjaga.",
      feature3Title: "Pengiriman Cepat",
      feature3Text: "Diantar langsung ke rumah Anda.",
      feature4Title: "Harga Bersahabat",
      feature4Text: "Harga kompetitif dengan kualitas terbaik.",
      quote: "Bersama, kita wujudkan pelayanan terbaik untuk kesehatan yang lebih baik.",
      value1Title: "Tanggung Jawab",
      value1Text: "Setiap tugas adalah amanah yang dijalankan dengan sepenuh hati.",
      value2Title: "Integritas Kerja",
      value2Text: "Kejujuran dan disiplin adalah pondasi kepercayaan dalam setiap pekerjaan.",
      value3Title: "Kerja Sama",
      value3Text: "Bersinergi, saling mendukung, dan tumbuh bersama untuk mencapai tujuan bersama.",
      quranTitle: "Allah berfirman dalam Al-Qur'an:",
      quranText: "Sesungguhnya shalat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman.",
      trust1: "Produk asli dengan kualitas terjamin",
      trust2Title: "Transaksi Aman",
      trust2: "Sistem aman dan terenkripsi",
      trust3Title: "Konsultasi Apoteker",
      trust3: "Gratis konsultasi seputar obat",
      trust4Title: "Layanan Pelanggan",
      trust4: "Siap membantu setiap saat",
      waTitle: "Mulai Bertanya",
      soonTitle: "Segera Launching",
      accountSoon: "Pendaftaran akun mandiri sedang kami siapkan. Untuk sementara, akun dibuat oleh administrator Nadhira Farma Digital.",
      shopSoon: "Menu belanja online sedang kami rapikan agar katalog dan transaksi berjalan nyaman.",
      ok: "Mengerti"
    },
    en: {
      login: "Login",
      register: "Create Account",
      shop: "Shopping",
      headline: "Health starts with the right choice",
      subhead: "Buying authentic and trusted medicine is now easier. Choose, order, and we deliver it directly to your home.",
      feature1Title: "Complete & Original",
      feature1Text: "Thousands of authentic guaranteed products.",
      feature2Title: "Safe & Trusted",
      feature2Text: "Secure transactions and protected privacy.",
      feature3Title: "Fast Delivery",
      feature3Text: "Delivered directly to your home.",
      feature4Title: "Friendly Prices",
      feature4Text: "Competitive prices with excellent quality.",
      quote: "Together, we create better service for better health.",
      value1Title: "Responsibility",
      value1Text: "Every task is a trust carried out wholeheartedly.",
      value2Title: "Work Integrity",
      value2Text: "Honesty and discipline are the foundation of trust in every job.",
      value3Title: "Teamwork",
      value3Text: "Collaborating, supporting each other, and growing together toward shared goals.",
      quranTitle: "Allah says in the Qur'an:",
      quranText: "Indeed, prayer has been decreed upon the believers a decree of specified times.",
      trust1: "Authentic products with guaranteed quality",
      trust2Title: "Secure Transactions",
      trust2: "Safe and encrypted system",
      trust3Title: "Pharmacist Consultation",
      trust3: "Free medicine consultation",
      trust4Title: "Customer Service",
      trust4: "Ready to help anytime",
      waTitle: "Start Chat",
      soonTitle: "Launching Soon",
      accountSoon: "Self-service account registration is being prepared. For now, accounts are created by the Nadhira Farma Digital administrator.",
      shopSoon: "The online shopping menu is being refined so the catalogue and transaction flow feel comfortable.",
      ok: "Got it"
    }
  };

  const session = readSession();
  if (session) {
    window.location.replace("index.html");
    return;
  }

  updateLoginHref();
  applyLanguage(localStorage.getItem("nadhira.landingLanguage") || "id");

  if (languageSelect) {
    languageSelect.addEventListener("change", () => {
      applyLanguage(languageSelect.value === "en" ? "en" : "id");
    });
  }

  if (menuButton && header) {
    menuButton.addEventListener("click", () => {
      const open = !header.classList.contains("is-open");
      header.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll("[data-coming-soon]").forEach((button) => {
    button.addEventListener("click", () => {
      const lang = document.body.closest(".landing-page")?.dataset.lang || "id";
      const dictionary = text[lang] || text.id;
      const type = button.dataset.comingSoon;
      showPopup(dictionary.soonTitle, type === "account" ? dictionary.accountSoon : dictionary.shopSoon, dictionary.ok);
    });
  });

  [popupClose, popupOk].forEach((button) => {
    if (button) button.addEventListener("click", hidePopup);
  });

  if (popup) {
    popup.addEventListener("click", (event) => {
      if (event.target === popup) hidePopup();
    });
  }

  function updateLoginHref() {
    if (!loginLink) return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "index.html";
    loginLink.href = `login.html?next=${encodeURIComponent(getSafeNext(next))}`;
  }

  function applyLanguage(lang) {
    const language = lang === "en" ? "en" : "id";
    const dictionary = text[language] || text.id;
    const page = document.querySelector(".landing-page");
    if (page) page.dataset.lang = language;
    if (languageSelect) languageSelect.value = language;
    localStorage.setItem("nadhira.landingLanguage", language);

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (dictionary[key]) element.textContent = dictionary[key];
    });

    const title = document.getElementById("landingTitle");
    if (title && language === "id") {
      title.innerHTML = 'Sehat dimulai<br>dari pilihan yang <b>tepat</b>';
    } else if (title) {
      title.innerHTML = 'Health starts<br>with the <b>right choice</b>';
    }
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
      const session = raw ? JSON.parse(raw) : null;
      if (!session || !session.expiresAt || Date.now() > Number(session.expiresAt)) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function getSafeNext(value) {
    const next = String(value || "index.html").trim() || "index.html";
    if (/^https?:\/\//i.test(next) || next.startsWith("//")) return "index.html";
    return next;
  }
})();
