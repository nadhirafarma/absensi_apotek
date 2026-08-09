(function () {
  const SESSION_KEY = "nadhira.authSession";

  if (isAuthPage()) return;
  if (readSession()) return;

  const next = `${window.location.pathname || "/"}${window.location.search || ""}${window.location.hash || ""}`;
  window.location.replace(`/beranda.html?next=${encodeURIComponent(next)}`);

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

  function isAuthPage() {
    const page = String(window.location.pathname || "")
      .split("/")
      .filter(Boolean)
      .pop()
      ?.toLowerCase();
    return page === "login" || page === "login.html" || page === "beranda" || page === "beranda.html";
  }
})();
