(function () {
  const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec";
  const SESSION_KEY = "nadhira.authSession";
  const REMEMBER_KEY = "nadhira.rememberedUsername";
  const REMEMBER_PASSWORD_KEY = "nadhira.rememberedPassword";
  const REMEMBER_ENABLED_KEY = "nadhira.rememberCredentials";
  const LOGIN_USERS_CACHE_KEY = "nadhira.loginUsersCache";
  const DASHBOARD_USERS_KEY = "nadhira.userRecords";
  const LOGIN_USERS_TIMEOUT_MS = 5500;
  const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("usernameInput");
  const loginUserOptions = document.getElementById("loginUserOptions");
  const passwordInput = document.getElementById("passwordInput");
  const rememberInput = document.getElementById("rememberInput");
  const togglePasswordButton = document.getElementById("togglePasswordButton");
  const loginButton = document.getElementById("loginButton");
  const formStatus = document.getElementById("formStatus");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const resetPasswordModal = document.getElementById("resetPasswordModal");
  const resetForm = document.getElementById("resetForm");
  const resetUsernameInput = document.getElementById("resetUsernameInput");
  const resetEmailInput = document.getElementById("resetEmailInput");
  const resetStatus = document.getElementById("resetStatus");
  const resetCloseButton = document.getElementById("resetCloseButton");
  const resetCancelButton = document.getElementById("resetCancelButton");
  const resetSubmitButton = document.getElementById("resetSubmitButton");

  let loginUsers = [];
  let routeLoadingOverlay = null;
  let routeLoadingTimer = null;

  if (new URLSearchParams(window.location.search).get("logout") === "1") {
    sessionStorage.removeItem(SESSION_KEY);
  }

  const existingSession = readSession();

  if (existingSession) {
    window.location.replace(getSafeNextUrl());
    return;
  }

  const shouldRememberCredentials = localStorage.getItem(REMEMBER_ENABLED_KEY) === "true";
  const rememberedUsername = shouldRememberCredentials ? localStorage.getItem(REMEMBER_KEY) || "" : "";
  const rememberedPassword = shouldRememberCredentials ? localStorage.getItem(REMEMBER_PASSWORD_KEY) || "" : "";

  rememberInput.checked = shouldRememberCredentials;
  passwordInput.value = rememberedPassword;
  loadLoginUsers(rememberedUsername);

  togglePasswordButton.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePasswordButton.setAttribute("aria-label", isHidden ? "Sembunyikan password" : "Tampilkan password");
    passwordInput.focus();
  });

  forgotPasswordLink.addEventListener("click", async (event) => {
    event.preventDefault();
    openResetModal();
  });

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = resetUsernameInput.value.trim();
    const email = resetEmailInput.value.trim();

    if (!username || !email) {
      setResetStatus("Username dan email wajib diisi.", "error");
      return;
    }

    setResetLoading(true);
    setResetStatus("Mengecek data akun...", "success");

    try {
      const result = await resetPassword(username, email);

      if (!result || result.success !== true) {
        throw new Error(result?.message || "Gagal mengirim link reset password.");
      }

      setResetStatus(result.message || "Link reset password sudah dikirim ke email terdaftar.", "success");
    } catch (error) {
      setResetStatus(error.message || "Gagal mengirim link reset password.", "error");
    } finally {
      setResetLoading(false);
    }
  });

  resetCloseButton.addEventListener("click", closeResetModal);
  resetCancelButton.addEventListener("click", closeResetModal);
  resetPasswordModal.addEventListener("click", (event) => {
    if (event.target === resetPasswordModal) {
      closeResetModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !resetPasswordModal.hidden) {
      closeResetModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      setStatus("Email/username dan password wajib diisi.", "error");
      return;
    }

    setLoading(true);
    setStatus("Memeriksa akun...", "success");
    showRouteLoading("Memeriksa akun...");

    try {
      const result = await login(username, password);

      if (!result || result.success !== true) {
        throw new Error(result?.message || "Username atau password salah.");
      }

      const session = {
        username: result.username || username,
        email: result.email || "",
        role: result.role || "",
        menu: result.menu || "",
        name: result.name || result.nama || result.fullName || result.username || username,
        phone: result.phone || result.noHp || "",
        address: result.address || result.alamat || "",
        preferences: result.preferences || result.profilePreferences || "",
        profilePhoto: result.profilePhoto || result.photo || "",
        loginAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      logLoginActivity(session);

      if (rememberInput.checked) {
        localStorage.setItem(REMEMBER_ENABLED_KEY, "true");
        localStorage.setItem(REMEMBER_KEY, username);
        localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
      } else {
        localStorage.removeItem(REMEMBER_ENABLED_KEY);
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_PASSWORD_KEY);
      }

      setStatus("Login berhasil. Membuka menu...", "success");
      showRouteLoading("Membuka dashboard...");
      await delay(560);
      window.location.assign(getSafeNextUrl());
    } catch (error) {
      setStatus(error.message || "Login gagal. Coba lagi.", "error");
      hideRouteLoading();
      setLoading(false);
    }
  });

  async function login(username, password) {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "login",
        username,
        password
      })
    });

    if (!response.ok) {
      throw new Error(`Server login tidak merespons (${response.status}).`);
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("Response login bukan JSON valid. Cek deployment Apps Script.");
    }
  }

  function logLoginActivity(session) {
    fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "saveActivityLog",
        activity: {
          title: "Login aplikasi",
          detail: "Akun berhasil masuk ke dashboard",
          actor: `${session.name || session.username || "Akun"} - ${session.role || "Operator"}`,
          role: session.role || "",
          username: session.username || "",
          email: session.email || "",
          scope: "account",
          at: new Date().toISOString()
        }
      }),
      keepalive: true
    }).catch(() => {});
  }

  async function fetchLoginUsers() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), LOGIN_USERS_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(AUTH_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "listLoginUsers"
        }),
        signal: controller.signal,
        cache: "no-store"
      });
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("Daftar user online terlalu lama merespons.");
      }
      throw new Error("Daftar user online belum dapat dihubungi.");
    } finally {
      window.clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Server daftar user tidak merespons (${response.status}).`);
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("Response daftar user bukan JSON valid. Cek deployment Apps Script.");
    }
  }

  async function resetPassword(username, email) {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "resetPassword",
        username,
        email
      })
    });

    if (!response.ok) {
      throw new Error(`Server reset password tidak merespons (${response.status}).`);
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("Response reset password bukan JSON valid. Cek deployment Apps Script.");
    }
  }

  async function loadLoginUsers(selectedUsername) {
    const cachedUsers = readCachedLoginUsers();
    renderUserOptions(cachedUsers, selectedUsername);
    renderResetUserOptions(loginUsers);

    try {
      const result = await fetchLoginUsers();

      if (!result || result.success !== true) {
        throw new Error(result?.message || "Daftar user tidak bisa dibaca.");
      }

      const users = result.users || [];
      renderUserOptions(users, usernameInput.value || selectedUsername);
      renderResetUserOptions(loginUsers);
      cacheLoginUsers(users);
      setStatus("", "");
    } catch (error) {
      if (!loginUsers.length) {
        setStatus("Daftar user online belum tersedia. Username tetap dapat diketik manual.", "info");
      }
    }
  }

  function renderUserOptions(users, selectedUsername) {
    const selected = String(selectedUsername || "").trim();
    const uniqueUsers = [];
    const seen = new Set();

    users.forEach((item) => {
      const username = String(item?.username || "").trim();
      const key = username.toLowerCase();

      if (!username || seen.has(key)) return;

      seen.add(key);
      uniqueUsers.push(username);
    });

    uniqueUsers.sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
    loginUsers = uniqueUsers;

    if (loginUserOptions) {
      loginUserOptions.innerHTML = "";
      uniqueUsers.forEach((username) => {
        loginUserOptions.appendChild(createOption(username, username));
      });
    }

    if (selected) usernameInput.value = selected;
  }

  function renderResetUserOptions(users) {
    if (!resetUsernameInput.value && users.length === 1) {
      resetUsernameInput.value = users[0];
    }
  }

  function readCachedLoginUsers() {
    const cached = readStoredArray(LOGIN_USERS_CACHE_KEY);
    const dashboardUsers = readStoredArray(DASHBOARD_USERS_KEY);
    return cached.concat(dashboardUsers);
  }

  function cacheLoginUsers(users) {
    const normalized = (users || []).map((user) => ({
      username: String(user?.username || user?.name || "").trim()
    })).filter((user) => user.username);
    localStorage.setItem(LOGIN_USERS_CACHE_KEY, JSON.stringify(normalized));
  }

  function readStoredArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function openResetModal() {
    renderResetUserOptions(loginUsers);
    resetUsernameInput.value = usernameInput.value || "";
    resetEmailInput.value = "";
    setResetStatus("", "");
    resetPasswordModal.hidden = false;

    if (resetUsernameInput.value) {
      resetEmailInput.focus();
    } else {
      resetUsernameInput.focus();
    }
  }

  function closeResetModal() {
    resetPasswordModal.hidden = true;
    setResetLoading(false);
  }

  function createOption(value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;

    return option;
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

  function getSafeNextUrl() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "index.html";

    if (/^https?:\/\//i.test(next) || next.startsWith("//")) {
      return "index.html";
    }

    return next || "index.html";
  }

  function setStatus(message, type) {
    formStatus.textContent = message || "";
    if (type) {
      formStatus.dataset.type = type;
    } else {
      delete formStatus.dataset.type;
    }
  }

  function setResetStatus(message, type) {
    resetStatus.textContent = message || "";
    if (type) {
      resetStatus.dataset.type = type;
    } else {
      delete resetStatus.dataset.type;
    }
  }

  function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    usernameInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    rememberInput.disabled = isLoading;
    loginButton.firstChild.textContent = isLoading ? "Memproses " : "Login ";
  }

  function setResetLoading(isLoading) {
    resetSubmitButton.disabled = isLoading;
    resetUsernameInput.disabled = isLoading;
    resetEmailInput.disabled = isLoading;
    resetSubmitButton.textContent = isLoading ? "Mengirim..." : "Kirim Link";
  }

  function showRouteLoading(message) {
    if (!routeLoadingOverlay) {
      routeLoadingOverlay = document.createElement("section");
      routeLoadingOverlay.className = "login-loading-overlay";
      routeLoadingOverlay.innerHTML = [
        '<div class="login-loading-card" role="status" aria-live="polite">',
        '<span class="login-loading-orbit"><img src="assets/indo-apotek-mark-transparent.png" alt=""></span>',
        '<strong id="loginLoadingText">Memproses...</strong>',
        '</div>'
      ].join("");
      document.body.appendChild(routeLoadingOverlay);
    }

    const text = routeLoadingOverlay.querySelector("#loginLoadingText");
    if (text) text.textContent = message || "Memproses...";
    routeLoadingOverlay.hidden = false;
    window.clearTimeout(routeLoadingTimer);
    routeLoadingTimer = null;
  }

  function hideRouteLoading() {
    window.clearTimeout(routeLoadingTimer);
    routeLoadingTimer = null;
    if (routeLoadingOverlay) routeLoadingOverlay.hidden = true;
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
})();
