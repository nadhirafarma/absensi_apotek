(function () {
  const AUTH_API_URL = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec";
  const SESSION_KEY = "nadhira.authSession";
  const REMEMBER_KEY = "nadhira.rememberedUsername";
  const REMEMBER_PASSWORD_KEY = "nadhira.rememberedPassword";
  const REMEMBER_ENABLED_KEY = "nadhira.rememberCredentials";
  const LOGIN_USERS_CACHE_KEY = "nadhira.loginUsersCache";
  const DASHBOARD_USERS_KEY = "nadhira.userRecords";
  const CACHED_AUTH_KEY = "nadhira.cachedLoginAuth";
  const LOGIN_USERS_TIMEOUT_MS = 8000;
  const LOGIN_TIMEOUT_MS = 10000;
  const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

  // Standar envelope Epic 1 (docs/api/gas-contracts.md §8): sukses = ok ATAU success.
  function isApiOk(res) {
    return !!res && (res.ok === true || res.success === true);
  }

  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("usernameInput");
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

      if (!isApiOk(result)) {
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
      const cachedSession = await getCachedLoginSession(username, password);
      if (cachedSession) {
        finishLogin(cachedSession, username, password);
        showRouteSuccess("Login berhasil.");
        window.setTimeout(() => window.location.assign(getSafeNextUrl()), 380);
        return;
      }

      const result = await login(username, password);

      if (!isApiOk(result)) {
        throw new Error(result?.message || "Username atau password salah.");
      }

      const session = {
        username: result.username || username,
        email: result.email || "",
        role: result.role || "",
        status: result.status || "Aktif",
        menu: result.menu || "",
        name: result.name || result.nama || result.fullName || result.username || username,
        phone: result.phone || result.noHp || "",
        address: result.address || result.alamat || "",
        preferences: result.preferences || result.profilePreferences || "",
        profilePhoto: result.profilePhoto || result.photo || "",
        sessionToken: result.sessionToken || "",
        loginAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS
      };

      await finishLogin(session, username, password);

      setStatus("Login berhasil. Membuka menu...", "success");
      showRouteSuccess("Login berhasil.");
      await delay(380);
      window.location.assign(getSafeNextUrl());
    } catch (error) {
      setStatus(error.message || "Login gagal. Coba lagi.", "error");
      hideRouteLoading();
      setLoading(false);
    }
  });

  async function login(username, password) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "login",
        username,
        password
      }),
      signal: controller.signal,
      cache: "no-store"
    }).catch((error) => {
      if (error && error.name === "AbortError") {
        throw new Error("Login online belum merespons. Coba lagi sebentar.");
      }
      throw new Error("Koneksi login belum stabil. Coba lagi sebentar.");
    }).finally(() => {
      window.clearTimeout(timeout);
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
        sessionEvent: "login",
        sessionToken: session.sessionToken || "",
        sessionExpiresAt: session.expiresAt || 0,
        name: session.name || "",
        username: session.username || "",
        email: session.email || "",
        role: session.role || "",
        status: session.status || "Aktif",
        activity: {
          title: "Login ke sistem",
          detail: "Akun berhasil masuk ke dashboard",
          actor: `${session.name || session.username || "Akun"} - ${session.role || "Operator"}`,
          role: session.role || "",
          username: session.username || "",
          email: session.email || "",
          scope: "account",
          module: "Autentikasi",
          status: "success",
          at: new Date().toISOString()
        }
      }),
      keepalive: true
    }).catch(() => {});
  }

  async function fetchLoginUsers() {
    const result = await requestLoginUsers("POST");
    if (isApiOk(result)) return result;
    throw new Error((result && result.message) || "Daftar user online belum tersedia.");
  }

  async function requestLoginUsers(method) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), LOGIN_USERS_TIMEOUT_MS);
    let response;

    try {
      const isGet = method === "GET";
      response = await fetch(isGet ? `${AUTH_API_URL}?action=listLoginUsers&t=${Date.now()}` : AUTH_API_URL, {
        method: isGet ? "GET" : "POST",
        headers: isGet ? undefined : {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: isGet ? undefined : JSON.stringify({
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
    loginUsers = [];
    renderUserOptions([], selectedUsername);
    renderResetUserOptions([]);
    setStatus("", "");
  }

  function renderUserOptions(users, selectedUsername) {
    const selected = String(selectedUsername || "").trim();
    const uniqueUsers = [];
    const seen = new Set();

    users.forEach((item) => {
      if (!isLoginUserActive(item)) return;
      const username = getLoginUsername(item);
      const key = username.toLowerCase();

      if (!username || seen.has(key)) return;

      seen.add(key);
      uniqueUsers.push(username);
    });

    uniqueUsers.sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }));
    loginUsers = uniqueUsers;

    const selectedExists = selected && uniqueUsers.some((username) => username.toLowerCase() === selected.toLowerCase());
    const options = uniqueUsers.slice();
    if (selected && !selectedExists) options.unshift(selected);

    renderSelectOptions(usernameInput, options, selected, "Masukkan email atau username");
    renderSelectOptions(resetUsernameInput, options, resetUsernameInput.value || selected, "Masukkan username atau email");

    if (selected) usernameInput.value = selected;
  }

  function renderResetUserOptions(users) {
    renderSelectOptions(resetUsernameInput, users, resetUsernameInput.value || usernameInput.value, "Masukkan username atau email");
    if (!resetUsernameInput.value && users.length === 1) {
      resetUsernameInput.value = users[0];
    }
  }

  function renderSelectOptions(select, values, selectedValue, placeholder) {
    if (!select) return;
    const selected = String(selectedValue || "").trim();
    if (select.tagName && select.tagName.toLowerCase() === "input") {
      const listId = select.getAttribute("list") || "";
      const list = listId ? document.getElementById(listId) : null;
      if (list) {
        list.innerHTML = "";
        values.forEach((username) => {
          list.appendChild(createOption(username, username));
        });
      }
      select.placeholder = placeholder || "Masukkan email atau username";
      if (selected) select.value = selected;
      return;
    }
    select.innerHTML = `<option value="">${placeholder || "Pilih user"}</option>`;
    values.forEach((username) => {
      select.appendChild(createOption(username, username, selected));
    });
    if (selected && Array.from(select.options).some((option) => option.value === selected)) {
      select.value = selected;
    }
  }

  function readCachedLoginUsers() {
    const cached = readStoredArray(LOGIN_USERS_CACHE_KEY);
    const dashboardUsers = readStoredArray(DASHBOARD_USERS_KEY);
    return cached.concat(dashboardUsers);
  }

  function cacheLoginUsers(users) {
    const normalized = (users || []).map((user) => ({
      username: getLoginUsername(user),
      status: String(user?.status || "Aktif").trim() || "Aktif"
    })).filter((user) => user.username && isLoginUserActive(user));
    localStorage.setItem(LOGIN_USERS_CACHE_KEY, JSON.stringify(normalized));
  }

  function getLoginUsername(user) {
    if (typeof user === "string") return user.trim();
    return String(user?.username || user?.name || user?.email || "").trim();
  }

  function isLoginUserActive(user) {
    if (typeof user === "string") return true;
    const key = normalizeLoginKey(user?.status || "Aktif").replace(/\s+/g, "");
    return !["nonaktif", "inactive", "nonactive", "tidakaktif", "keluar", "resign", "cuti"].includes(key);
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

  async function finishLogin(session, username, password) {
    session.sessionToken = session.sessionToken || createSessionToken();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    logLoginActivity(session);

    if (rememberInput.checked) {
      localStorage.setItem(REMEMBER_ENABLED_KEY, "true");
      localStorage.setItem(REMEMBER_KEY, username);
      localStorage.setItem(REMEMBER_PASSWORD_KEY, password);
      await cacheSuccessfulLogin(username, password, session);
    } else {
      localStorage.removeItem(REMEMBER_ENABLED_KEY);
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(REMEMBER_PASSWORD_KEY);
      localStorage.removeItem(CACHED_AUTH_KEY);
    }
  }

  function createSessionToken() {
    if (window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(24);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }

  async function cacheSuccessfulLogin(username, password, session) {
    const passwordHash = await digestText(`${normalizeLoginKey(username)}::${password}`);
    localStorage.setItem(CACHED_AUTH_KEY, JSON.stringify({
      username: normalizeLoginKey(username),
      passwordHash,
      session: {
        ...session,
        expiresAt: Date.now() + SESSION_DURATION_MS
      },
      savedAt: Date.now()
    }));
  }

  async function getCachedLoginSession(username, password) {
    return null;
    if (!rememberInput.checked) return null;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHED_AUTH_KEY) || "{}");
      if (!cached || cached.username !== normalizeLoginKey(username) || !cached.passwordHash || !cached.session) return null;
      const passwordHash = await digestText(`${normalizeLoginKey(username)}::${password}`);
      if (passwordHash !== cached.passwordHash) return null;
      return {
        ...cached.session,
        loginAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS
      };
    } catch (error) {
      return null;
    }
  }

  async function digestText(value) {
    if (!window.crypto?.subtle) return btoa(unescape(encodeURIComponent(String(value || ""))));
    const bytes = new TextEncoder().encode(String(value || ""));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function normalizeLoginKey(value) {
    return String(value || "").trim().toLowerCase();
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const session = raw ? JSON.parse(raw) : null;
      const expiresAt = Number(session?.expiresAt);

      if (!session || !Number.isFinite(expiresAt) || Date.now() >= expiresAt) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch (error) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (_) {
        /* storage unavailable: fail closed */
      }
      return null;
    }
  }

  function getSafeNextUrl() {
    const next = String(new URLSearchParams(window.location.search).get("next") || "/");
    if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\x00-\x1f\x7f]/.test(next)) return "/";
    return next;
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
    routeLoadingOverlay.classList.remove("is-success", "is-error");
    routeLoadingOverlay.hidden = false;
    window.clearTimeout(routeLoadingTimer);
    routeLoadingTimer = null;
  }

  function showRouteSuccess(message) {
    if (!routeLoadingOverlay) showRouteLoading(message || "Login berhasil.");
    const text = routeLoadingOverlay.querySelector("#loginLoadingText");
    if (text) text.textContent = message || "Login berhasil.";
    routeLoadingOverlay.classList.add("is-success");
    routeLoadingOverlay.hidden = false;
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
