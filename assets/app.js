(function () {
  const SESSION_KEY = "nadhira.authSession";
  const LOGIN_PAGE = "login.html";
  const dateLabel = document.getElementById("todayLabel");
  const clockLabel = document.getElementById("clockLabel");
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

  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
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

    if (dateLabel) {
      dateLabel.textContent = dateFormatter.format(now);
    }

    if (clockLabel) {
      clockLabel.textContent = `${timeFormatter.format(now)} WIB`;
    }
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
    const accountName = getAccountName(session);
    const accountMeta = getAccountMeta(session);
    const initials = getInitials(accountName);

    if (profileAvatar) profileAvatar.textContent = initials;
    if (profileMiniAvatar) profileMiniAvatar.textContent = initials;
    if (profileAccountName) profileAccountName.textContent = accountName;
    if (profileAccountMeta) profileAccountMeta.textContent = accountMeta;

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
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace(getLogoutUrl());
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
    if (!session) return "Nadhira Farma Digital";

    return String(session.role || session.email || session.menu || "Nadhira Farma Digital").trim() || "Nadhira Farma Digital";
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

  function getCurrentPageName() {
    const pathname = window.location.pathname || "";
    const fileName = pathname.split("/").filter(Boolean).pop() || "index.html";
    const page = fileName.includes(".") ? fileName : "index.html";

    return `${page}${window.location.search || ""}${window.location.hash || ""}`;
  }

  function getLogoutUrl() {
    return `${LOGIN_PAGE}?logout=1&t=${Date.now()}&next=${encodeURIComponent(getCurrentPageName())}`;
  }

  updateClock();
  updateConnection();
  setupProfileMenu();
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  setInterval(updateClock, 1000);
})();
