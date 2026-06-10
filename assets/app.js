(function () {
  const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec";
  const SESSION_KEY = "nadhira.authSession";
  const PROFILE_KEY = "nadhira.localProfile";
  const LANDING_PAGE = "beranda.html";
  const dateLabel = document.getElementById("todayLabel");
  const clockLabel = document.getElementById("clockLabel");
  const homeDateLabel = document.getElementById("todayLabelHome");
  const homeClockLabel = document.getElementById("clockLabelHome");
  const homeGreeting = document.getElementById("homeGreeting");
  const homeProfileName = document.getElementById("homeProfileName");
  const homeProfileRole = document.getElementById("homeProfileRole");
  const connectionStatus = document.getElementById("connectionStatus");
  const profileMenu = document.getElementById("profileMenu");
  const profileMenuButton = document.getElementById("profileMenuButton");
  const profileDropdown = document.getElementById("profileDropdown");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileMiniAvatar = document.getElementById("profileMiniAvatar");
  const profileAccountName = document.getElementById("profileAccountName");
  const profileAccountMeta = document.getElementById("profileAccountMeta");
  const logoutButton = document.getElementById("logoutButton");
  const logoutButtons = Array.from(document.querySelectorAll("#logoutButton, [data-logout-button]"));
  let isLoggingOut = false;
  let routeLoadingOverlay = null;
  let routeLoadingTimer = null;

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  });

  const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta"
  });

  function updateClock() {
    const now = new Date();

    [dateLabel, homeDateLabel].forEach(function (label) {
      if (label) label.textContent = dateFormatter.format(now);
    });

    [clockLabel, homeClockLabel].forEach(function (label) {
      if (label) label.textContent = `${timeFormatter.format(now)} WIB`;
    });

    if (homeGreeting) homeGreeting.textContent = getGreeting(now);
  }

  function updateConnection() {
    if (!connectionStatus) return;

    const isOnline = navigator.onLine;
    connectionStatus.classList.toggle("is-offline", !isOnline);
    connectionStatus.lastChild.textContent = isOnline ? " Online" : " Offline";
  }

  function setupProfileMenu() {
    if (!profileMenu || !profileMenuButton || !profileDropdown) return;

    const session = readSession();
    const storedProfile = readObject(PROFILE_KEY);
    const accountName = getAccountName(session);
    const accountMeta = getAccountMeta(session);
    const initials = getInitials(accountName);
    const sessionPhoto = session?.profilePhoto || session?.photo || "";
    const profilePhoto = storedProfile.photo || sessionPhoto;

    setAvatarContent(profileAvatar, profilePhoto, initials);
    setAvatarContent(profileMiniAvatar, profilePhoto, initials);
    if (profileAccountName) profileAccountName.textContent = accountName;
    if (profileAccountMeta) profileAccountMeta.textContent = accountMeta;
    if (homeProfileName) homeProfileName.textContent = accountName;
    if (homeProfileRole) homeProfileRole.textContent = accountMeta;

    profileMenuButton.setAttribute("aria-label", `Akun ${accountName}`);
    profileMenuButton.title = `Akun ${accountName}`;

    logoutButtons.forEach((button) => {
      const logoutUrl = getLogoutUrl();
      if (button.tagName === "A") {
        button.setAttribute("href", logoutUrl);
      }
      button.dataset.logoutUrl = logoutUrl;
      ["pointerdown", "touchstart", "mousedown", "click"].forEach((eventName) => {
        button.addEventListener(eventName, logout, true);
      });
    });

    ["pointerdown", "touchstart", "mousedown", "click"].forEach((eventName) => {
      document.addEventListener(eventName, function (event) {
      const target = event.target.closest ? event.target.closest("#logoutButton, [data-logout-button]") : null;

      if (target) {
        logout(event);
      }
      }, true);
    });

    profileMenuButton.addEventListener("click", function (event) {
      event.stopPropagation();

      if (shouldOpenSidebarBeforeProfileMenu()) {
        openSidebarForProfileMenu();
        closeProfileMenu();
        return;
      }

      toggleProfileMenu();
    });

    profileDropdown.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    document.addEventListener("click", closeProfileMenu);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeProfileMenu();
      }
    });
  }

  function toggleProfileMenu() {
    const isOpen = profileMenuButton.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeProfileMenu();
      return;
    }

    profileDropdown.hidden = false;
    profileMenuButton.setAttribute("aria-expanded", "true");
    profileMenuButton.classList.add("is-open");
  }

  function shouldOpenSidebarBeforeProfileMenu() {
    return document.body.classList.contains("dashboard-page") &&
      document.body.classList.contains("sidebar-collapsed") &&
      Boolean(profileMenu.closest(".app-sidebar"));
  }

  function openSidebarForProfileMenu() {
    document.body.classList.remove("sidebar-collapsed");
    document.body.classList.add("sidebar-open");
    localStorage.setItem("nadhira.sidebarCollapsed", "0");

    const sidebarScrim = document.getElementById("sidebarScrim");
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarScrim) sidebarScrim.hidden = false;
    if (sidebarToggle) sidebarToggle.setAttribute("aria-label", "Tutup sidebar");
  }

  function closeProfileMenu() {
    if (!profileMenuButton || !profileDropdown) return;

    profileDropdown.hidden = true;
    profileMenuButton.setAttribute("aria-expanded", "false");
    profileMenuButton.classList.remove("is-open");
  }

  function logout(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
    }

    if (isLoggingOut) return;

    isLoggingOut = true;
    logLogoutActivity(readSession());
    showRouteLoading("Keluar dari sistem...");
    window.setTimeout(function () {
      sessionStorage.removeItem(SESSION_KEY);
      window.location.replace(getLogoutUrl());
    }, 560);
  }

  function showRouteLoading(message) {
    if (!routeLoadingOverlay) {
      routeLoadingOverlay = document.createElement("section");
      routeLoadingOverlay.className = "app-loading-overlay route-loading-overlay";
      routeLoadingOverlay.innerHTML = [
        '<div class="app-loading-card" role="status" aria-live="polite">',
        '<span class="app-loading-orbit"><img src="assets/indo-apotek-mark.png" alt=""></span>',
        '<strong id="routeLoadingText">Memproses...</strong>',
        '</div>'
      ].join("");
      document.body.appendChild(routeLoadingOverlay);
    }

    const text = routeLoadingOverlay.querySelector("#routeLoadingText");
    if (text) text.textContent = message || "Memproses...";
    routeLoadingOverlay.hidden = false;
    window.clearTimeout(routeLoadingTimer);
    routeLoadingTimer = window.setTimeout(function () {
      if (routeLoadingOverlay) routeLoadingOverlay.hidden = true;
    }, 1500);
  }

  function logLogoutActivity(session) {
    if (!session) return;
    fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "saveActivityLog",
        activity: {
          title: "Logout aplikasi",
          detail: "Akun keluar dari dashboard",
          actor: `${session.name || session.username || "Akun"} - ${session.role || "Operator"}`,
          role: session.role || "",
          username: session.username || "",
          email: session.email || "",
          scope: "account",
          at: new Date().toISOString()
        }
      }),
      keepalive: true
    }).catch(function () {});
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

  function getAccountName(session) {
    if (!session) return "Akun";

    return String(session.name || session.username || session.email || "Akun").trim() || "Akun";
  }

  function getAccountMeta(session) {
    if (!session) return "Indo Apotek";

    return String(session.role || session.email || session.menu || "Indo Apotek").trim() || "Indo Apotek";
  }

  function getInitials(value) {
    const text = String(value || "Akun")
      .replace(/@.*$/, "")
      .replace(/[^a-zA-Z0-9\s]+/g, " ")
      .trim();
    const parts = text.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return (parts[0] || "AK").slice(0, 2).toUpperCase();
  }

  function getGreeting(now) {
    const parts = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    }).formatToParts(now || new Date());
    const hour = Number((parts.find(function (part) { return part.type === "hour"; }) || {}).value || 0);

    if (hour >= 4 && hour < 11) return "Selamat Pagi 👋";
    if (hour >= 11 && hour < 15) return "Selamat Siang 👋";
    if (hour >= 15 && hour < 18) return "Selamat Sore 👋";
    return "Selamat Malam 👋";
  }

  function setAvatarContent(element, photo, initials) {
    if (!element) return;

    const image = String(photo || "").trim();
    if (/^data:image\//.test(image)) {
      element.innerHTML = `<img src="${escapeHtml(image)}" alt="">`;
      element.classList.add("has-photo");
      return;
    }

    element.classList.remove("has-photo");
    element.textContent = initials;
  }

  function readObject(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch (error) {
      return {};
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getCurrentPageName() {
    const pathname = window.location.pathname || "";
    const fileName = pathname.split("/").filter(Boolean).pop() || "index.html";
    const page = fileName.includes(".") ? fileName : "index.html";

    return `${page}${window.location.search || ""}${window.location.hash || ""}`;
  }

  function getLogoutUrl() {
    return `${LANDING_PAGE}?logout=1&t=${Date.now()}`;
  }

  updateClock();
  updateConnection();
  setupProfileMenu();
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  setInterval(updateClock, 1000);
})();
