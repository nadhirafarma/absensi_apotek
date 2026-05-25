(function () {
  const dateLabel = document.getElementById("todayLabel");
  const clockLabel = document.getElementById("clockLabel");
  const connectionStatus = document.getElementById("connectionStatus");

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

  updateClock();
  updateConnection();
  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);
  setInterval(updateClock, 1000);
})();
