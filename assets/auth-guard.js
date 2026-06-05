(function () {
  const SESSION_KEY = "nadhira.authSession";
  const LOGIN_PAGE = "login.html";
  const LANDING_PAGE = "beranda.html";

  const currentPage = getCurrentPageName();
  const currentFile = currentPage.split("?")[0].split("#")[0];

  if (currentFile === LOGIN_PAGE || currentFile === LANDING_PAGE) return;

  const session = readSession();

  if (session) return;

  const next = encodeURIComponent(currentPage || "index.html");
  window.location.replace(`${LANDING_PAGE}?next=${next}`);

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

  function getCurrentPageName() {
    const pathname = window.location.pathname || "";
    const fileName = pathname.split("/").filter(Boolean).pop() || "index.html";
    const page = fileName.includes(".") ? fileName : "index.html";

    return `${page}${window.location.search || ""}${window.location.hash || ""}`;
  }
})();
