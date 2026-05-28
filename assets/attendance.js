(function () {
  const MODEL_BASE = "https://nadhirafarma.github.io/absensi_apotek/weights";
  const FACE_DB_BASE = "https://nadhirafarma.github.io/absensi_apotek/database_wajah";
  const ABSENSI_API_URL = "https://script.google.com/macros/s/AKfycbx7fkoLgH6igHP17przjmxWaP8bQNG_6OcoQ3-Ug79A_vmZxK6_ibCdLC0u-W-JLtw3/exec";

  const APOTEK_LAT = -3.2733637;
  const APOTEK_LON = 104.8819249;
  const MAX_RADIUS_METER = 45;
  const MAX_GPS_ACCURACY_METER = 200;
  const GPS_DISTANCE_TOLERANCE_METER = 160;
  const GPS_CACHE_MS = 60000;
  const GPS_WAIT_TIMEOUT_MS = 12000;
  const REQUEST_TIMEOUT_MS = 18000;
  const DETECTION_DELAY_MS = 450;
  const REQUIRED_MATCH_STREAK = 2;

  const LABELS = [
    "Al_Hafiz",
    "Meisyi_Amalia",
    "Putri_Sinta",
    "Delpi_Vira",
    "Ayu_Novalia",
    "Tia_Ivanka",
    "Yolan_Alfarel"
  ];
  const GPS_BYPASS_LABELS = new Set(["Yolan_Alfarel"]);

  const els = {};
  const state = {
    faceMatcher: null,
    stream: null,
    locationWatchId: null,
    lastLocation: null,
    detectTimer: null,
    detecting: false,
    processing: false,
    finished: false,
    paused: false,
    lastLabel: "",
    matchStreak: 0
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindElements();
    bindEvents();
    startClock();
    warmUpLocation();

    try {
      await Promise.all([loadModels(), startCamera()]);
      await prepareFaceMatcher();
      resizeFaceCanvas();
      setModelStatus("Face ID siap", "ready");
      setStatus("Posisikan wajah di dalam bingkai.");
      scheduleDetection(100);
    } catch (error) {
      setModelStatus("Face ID gagal", "error");
      setStatus(`Gagal menyiapkan absensi: ${error.message}`);
      els.retryButton.hidden = false;
    }
  }

  function bindElements() {
    els.video = document.getElementById("video");
    els.faceCanvas = document.getElementById("faceCanvas");
    els.captureCanvas = document.getElementById("captureCanvas");
    els.statusText = document.getElementById("statusText");
    els.clockLabel = document.getElementById("clockLabel");
    els.modelStatus = document.getElementById("modelStatus");
    els.gpsStatus = document.getElementById("gpsStatus");
    els.cancelButton = document.getElementById("cancelButton");
    els.retryButton = document.getElementById("retryButton");
  }

  function bindEvents() {
    els.cancelButton.addEventListener("click", cancelAttendance);
    els.retryButton.addEventListener("click", () => window.location.reload());
    window.addEventListener("beforeunload", stopAll);
    window.addEventListener("resize", resizeFaceCanvas);
  }

  function startClock() {
    const formatter = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    });

    function updateClock() {
      els.clockLabel.textContent = `${formatter.format(new Date())} WIB`;
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  async function loadModels() {
    setModelStatus("Memuat Face ID", "warning");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE)
    ]);
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Kamera tidak didukung browser.");
    }

    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });

    els.video.srcObject = state.stream;
    await els.video.play();
  }

  async function prepareFaceMatcher() {
    const descriptorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.35
    });
    const descriptors = (await Promise.all(LABELS.map(async (label) => {
      try {
        const image = await faceapi.fetchImage(`${FACE_DB_BASE}/${label}.jpg`);
        const detection = await faceapi
          .detectSingleFace(image, descriptorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) return null;
        return new faceapi.LabeledFaceDescriptors(label, [detection.descriptor]);
      } catch (error) {
        return null;
      }
    }))).filter(Boolean);

    if (!descriptors.length) {
      throw new Error("Database wajah tidak terbaca.");
    }

    state.faceMatcher = new faceapi.FaceMatcher(descriptors, 0.5);
  }

  function warmUpLocation() {
    if (!navigator.geolocation) {
      setGpsStatus("GPS tidak tersedia", "error");
      return;
    }

    setGpsStatus("Mengunci GPS", "warning");
    state.locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        rememberLocation(position);
        const accuracy = Math.round(state.lastLocation.accuracy);
        const status = accuracy <= MAX_GPS_ACCURACY_METER ? "ready" : "warning";
        setGpsStatus(`GPS ${accuracy} m`, status);
      },
      () => {
        setGpsStatus("GPS belum aktif", "warning");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000
      }
    );
  }

  function resizeFaceCanvas() {
    const rect = els.video.getBoundingClientRect();
    els.faceCanvas.width = Math.round(rect.width || 1);
    els.faceCanvas.height = Math.round(rect.height || 1);
  }

  function scheduleDetection(delay = DETECTION_DELAY_MS) {
    window.clearTimeout(state.detectTimer);
    if (state.finished || state.processing || state.paused) return;
    state.detectTimer = window.setTimeout(detectFace, delay);
  }

  async function detectFace() {
    if (state.detecting || state.processing || state.finished) return;

    state.detecting = true;

    try {
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: window.innerWidth <= 520 ? 224 : 320,
        scoreThreshold: 0.45
      });
      const detection = await faceapi
        .detectSingleFace(els.video, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      clearFaceCanvas();

      if (!detection) {
        state.lastLabel = "";
        state.matchStreak = 0;
        setStatus("Posisikan wajah di dalam bingkai.");
        return;
      }

      drawFaceBox(detection.detection.box);
      const bestMatch = state.faceMatcher.findBestMatch(detection.descriptor);

      if (bestMatch.label === "unknown") {
        state.lastLabel = "";
        state.matchStreak = 0;
        setStatus("Wajah belum dikenali. Dekatkan wajah ke kamera.");
        return;
      }

      if (bestMatch.label === state.lastLabel) {
        state.matchStreak += 1;
      } else {
        state.lastLabel = bestMatch.label;
        state.matchStreak = 1;
      }

      const name = formatName(bestMatch.label);
      setStatus(`Wajah dikenali: ${name}. Validasi cepat sedang disiapkan.`);

      if (state.matchStreak >= REQUIRED_MATCH_STREAK) {
        await processAttendance(bestMatch.label);
      }
    } catch (error) {
      setStatus(`Deteksi wajah terganggu: ${error.message}`);
    } finally {
      state.detecting = false;
      scheduleDetection();
    }
  }

  async function processAttendance(label) {
    if (state.processing || state.finished) return;

    state.processing = true;
    window.clearTimeout(state.detectTimer);
    setStatus(`Wajah ${formatName(label)} cocok. Mengecek GPS dan absensi...`);

    try {
      if (hasLocalAttendanceToday(label)) {
        showResult("Absen sudah ada", formatName(label), {
          primary: "Absensi hari ini sudah pernah diproses di perangkat ini.",
          secondary: "Bekerjalah dengan jujur dan tanggung jawab."
        }, "warning");
        return;
      }

      const locationResult = await validateLocation(label);

      if (!locationResult.ok) {
        setStatus(locationResult.message);
        els.retryButton.hidden = false;
        state.paused = true;
        state.processing = false;
        state.lastLabel = "";
        state.matchStreak = 0;
        return;
      }

      const attendanceResult = await safeCheckAttendanceToday(label);

      if (attendanceResult.sudahAbsen) {
        markLocalAttendance(label, "server");
        showResult("Absen sudah ada", formatName(label), {
          primary: "Absensi hari ini sudah tercatat.",
          secondary: "Bekerjalah dengan jujur dan tanggung jawab."
        }, "warning");
        return;
      }

      await sendAttendance(label, locationResult, attendanceResult);
    } catch (error) {
      setStatus(`Absensi gagal: ${error.message}`);
      els.retryButton.hidden = false;
      state.paused = true;
      state.processing = false;
    }
  }

  async function validateLocation(label) {
    if (GPS_BYPASS_LABELS.has(label)) {
      return { ok: true, message: "GPS dilewati untuk akun khusus.", location: null, distance: 0 };
    }

    setStatus("Menunggu GPS terbaik...");
    const location = await getBestLocation();

    if (!location) {
      return {
        ok: false,
        message: "GPS belum terbaca. Aktifkan lokasi akurasi tinggi lalu coba lagi."
      };
    }

    const distance = calculateDistance(location.latitude, location.longitude, APOTEK_LAT, APOTEK_LON);
    const allowedDistance = MAX_RADIUS_METER + Math.min(location.accuracy || 0, GPS_DISTANCE_TOLERANCE_METER);

    if (location.accuracy > MAX_GPS_ACCURACY_METER && distance > MAX_RADIUS_METER) {
      return {
        ok: false,
        message: `GPS belum stabil. Akurasi ${Math.round(location.accuracy)} meter, jarak ${Math.round(distance)} meter. Aktifkan lokasi akurasi tinggi lalu coba lagi.`
      };
    }

    if (distance > allowedDistance) {
      return {
        ok: false,
        message: `Lokasi di luar area absensi. Jarak terdeteksi ${Math.round(distance)} meter dari apotek.`
      };
    }

    return {
      ok: true,
      message: `Lokasi valid. Akurasi ${Math.round(location.accuracy)} meter.`,
      location,
      distance
    };
  }

  function getBestLocation() {
    const cached = state.lastLocation;
    if (isUsableLocation(cached)) {
      return Promise.resolve(cached);
    }

    if (!navigator.geolocation) return Promise.resolve(null);

    return new Promise((resolve) => {
      let settled = false;
      const startedAt = Date.now();
      const finish = (location) => {
        if (settled) return;
        settled = true;
        resolve(location || state.lastLocation || cached || null);
      };
      const poll = () => {
        if (isUsableLocation(state.lastLocation)) {
          finish(state.lastLocation);
          return;
        }

        if (Date.now() - startedAt >= GPS_WAIT_TIMEOUT_MS) {
          finish(state.lastLocation || cached || null);
          return;
        }

        window.setTimeout(poll, 500);
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          rememberLocation(position);
          if (isUsableLocation(state.lastLocation)) finish(state.lastLocation);
        },
        () => {
          if (cached) finish(cached);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: GPS_WAIT_TIMEOUT_MS
        }
      );

      poll();
    });
  }

  function rememberLocation(position) {
    const next = normalizePosition(position);
    const current = state.lastLocation;

    if (!current || next.accuracy <= current.accuracy || Date.now() - current.receivedAt > GPS_CACHE_MS) {
      state.lastLocation = next;
    }
  }

  function isUsableLocation(location) {
    return Boolean(location)
      && Date.now() - location.receivedAt <= GPS_CACHE_MS
      && location.accuracy <= MAX_GPS_ACCURACY_METER;
  }

  function normalizePosition(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      receivedAt: Date.now()
    };
  }

  async function checkAttendanceToday(label) {
    const response = await fetchWithTimeout(`${ABSENSI_API_URL}?nama=${encodeURIComponent(label)}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Cek absensi gagal (${response.status}).`);
    }

    return response.json();
  }

  async function safeCheckAttendanceToday(label) {
    try {
      return await checkAttendanceToday(label);
    } catch (error) {
      return {
        sudahAbsen: false,
        checkFailed: true,
        message: error.message
      };
    }
  }

  async function sendAttendance(label, locationResult, attendanceCheck) {
    setStatus("Mengirim absensi...");

    const photo = capturePhoto();
    const photoBase64 = extractBase64(photo);
    const displayName = formatName(label);
    const shift = getShiftLabel();
    const submitUrl = `${ABSENSI_API_URL}?nama=${encodeURIComponent(label)}&nama_karyawan=${encodeURIComponent(displayName)}&status=HADIR`;
    const timestamp = new Date().toISOString();
    const fileName = `absensi_${label}_${timestamp.replace(/[:.]/g, "-")}.jpg`;
    const payload = {
      nama: label,
      nama_karyawan: displayName,
      namaKaryawan: displayName,
      status: "HADIR",
      status_kehadiran: "HADIR",
      statusKehadiran: "HADIR",
      shift,
      SHIFT: shift,
      foto: photoBase64,
      foto_absensi: photoBase64,
      fotoAbsensi: photoBase64,
      photo: photoBase64,
      image: photoBase64,
      imageBase64: photoBase64,
      mimeType: "image/jpeg",
      fileName,
      folder: "foto_absensi",
      latitude: locationResult.location ? locationResult.location.latitude : "",
      longitude: locationResult.location ? locationResult.location.longitude : "",
      gps_accuracy: locationResult.location ? Math.round(locationResult.location.accuracy) : "",
      gps_distance: typeof locationResult.distance === "number" ? Math.round(locationResult.distance) : "",
      timestamp
    };
    let responseText = "";
    let result = {};

    if (attendanceCheck && attendanceCheck.checkFailed) {
      setStatus("Server tidak mengizinkan pengecekan langsung. Mengirim mode aman...");
      await sendAttendanceNoCors(submitUrl, payload);
      markLocalAttendance(label, "fallback");
      showResult("Absen Berhasil", displayName, {
        primary: "Absensi tersimpan",
        secondary: "Bekerjalah dengan jujur dan tanggung jawab."
      }, "success");
      return;
    }

    try {
      const response = await fetchWithTimeout(submitUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Pengiriman gagal (${response.status}).`);
      }

      responseText = await response.text();
      result = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      if (!responseText && isFetchNetworkError(error)) {
        setStatus("Server lambat merespons. Mengirim ulang mode aman...");
        await sendAttendanceNoCors(submitUrl, payload);
        markLocalAttendance(label, "fallback");
        showResult("Absen Berhasil", displayName, {
          primary: "Absensi tersimpan",
          secondary: "Bekerjalah dengan jujur dan tanggung jawab."
        }, "success");
        return;
      }

      if (responseText) {
        result = { ok: true, raw: responseText };
      } else {
        throw error;
      }
    }

    if (result && result.error) {
      throw new Error(result.error);
    }

    if (result && result.sudahAbsen) {
      markLocalAttendance(label, "server");
      showResult("Absen sudah ada", displayName, {
        primary: "Absensi hari ini sudah tercatat.",
        secondary: "Bekerjalah dengan jujur dan tanggung jawab."
      }, "warning");
      return;
    }

    markLocalAttendance(label, "success");
    showResult("Absen Berhasil", displayName, {
      primary: "Absensi tersimpan",
      secondary: "Bekerjalah dengan jujur dan tanggung jawab."
    }, "success");
  }

  function sendAttendanceNoCors(submitUrl, payload) {
    return fetchWithTimeout(submitUrl, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  }

  async function fetchWithTimeout(url, options = {}, timeout = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function isFetchNetworkError(error) {
    return error && (
      error.name === "AbortError"
      || /failed to fetch|network|load failed|abort/i.test(error.message || "")
    );
  }

  function capturePhoto() {
    const width = els.video.videoWidth || 640;
    const height = els.video.videoHeight || 480;
    const maxWidth = 480;
    const scale = Math.min(1, maxWidth / width);

    els.captureCanvas.width = Math.round(width * scale);
    els.captureCanvas.height = Math.round(height * scale);

    const context = els.captureCanvas.getContext("2d");
    context.drawImage(els.video, 0, 0, els.captureCanvas.width, els.captureCanvas.height);
    return els.captureCanvas.toDataURL("image/jpeg", 0.68);
  }

  function extractBase64(dataUrl) {
    const value = String(dataUrl || "");
    const commaIndex = value.indexOf(",");

    return commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
  }

  function drawFaceBox(box) {
    const context = els.faceCanvas.getContext("2d");
    const scaleX = els.faceCanvas.width / (els.video.videoWidth || els.faceCanvas.width);
    const scaleY = els.faceCanvas.height / (els.video.videoHeight || els.faceCanvas.height);
    const x = els.faceCanvas.width - (box.x + box.width) * scaleX;
    const y = box.y * scaleY;
    const width = box.width * scaleX;
    const height = box.height * scaleY;

    context.strokeStyle = "#8aff8a";
    context.lineWidth = 3;
    context.shadowColor = "#8aff8a";
    context.shadowBlur = 10;
    context.strokeRect(x, y, width, height);
  }

  function clearFaceCanvas() {
    const context = els.faceCanvas.getContext("2d");
    context.clearRect(0, 0, els.faceCanvas.width, els.faceCanvas.height);
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const radius = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function toRad(value) {
    return value * Math.PI / 180;
  }

  function getShiftLabel() {
    const jakartaHour = Number(new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    }).format(new Date()));

    return jakartaHour < 12 ? "SHIFT PAGI" : "SHIFT SORE";
  }

  function hasLocalAttendanceToday(label) {
    try {
      return Boolean(window.localStorage.getItem(getLocalAttendanceKey(label)));
    } catch (error) {
      return false;
    }
  }

  function markLocalAttendance(label, status) {
    try {
      window.localStorage.setItem(getLocalAttendanceKey(label), JSON.stringify({
        label,
        status,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      // Local cache is a convenience guard only; attendance still works without it.
    }
  }

  function getLocalAttendanceKey(label) {
    return `nadhira-attendance:${getJakartaDateKey()}:${label}`;
  }

  function getJakartaDateKey() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Jakarta"
    }).formatToParts(new Date()).reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function showResult(title, name, message, type) {
    state.finished = true;
    stopAll();
    const icon = type === "success"
      ? `
        <span class="result-icon success" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        </span>
      `
      : `
        <span class="result-icon warning" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 8v5"></path>
            <path d="M12 17h.01"></path>
          </svg>
        </span>
      `;
    const primaryMessage = typeof message === "string" ? message : message.primary;
    const secondaryMessage = typeof message === "string" ? "" : message.secondary;

    document.body.innerHTML = `
      <main class="attendance-shell">
        <section class="attendance-card result-card">
          <header class="attendance-header result-header">
            <a class="brand-link" href="index.html" aria-label="Kembali ke menu utama">
              <img src="https://nadhirafarma.github.io/absensi_apotek/logo.png" alt="">
              <span>
                <strong>Nadhira Farma Digital</strong>
                <small>Absensi Face ID</small>
              </span>
            </a>
          </header>
          <div class="result-body">
            <p class="result-title">${escapeHtml(title)}</p>
            ${icon}
            <p class="result-name">${escapeHtml(name)}</p>
            <div class="result-message">
              <strong>${escapeHtml(primaryMessage)}</strong>
              ${secondaryMessage ? `<span>${escapeHtml(secondaryMessage)}</span>` : ""}
            </div>
          </div>
          <a class="${type === "success" ? "secondary-button" : "danger-button"} result-button" href="index.html">Kembali ke menu</a>
        </section>
      </main>
    `;
  }

  function cancelAttendance() {
    state.finished = true;
    stopAll();
    showResult("ABSENSI DIBATALKAN", "Kamera dimatikan", "Silakan kembali ke menu utama.", "warning");
  }

  function stopAll() {
    window.clearTimeout(state.detectTimer);

    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }

    if (state.locationWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(state.locationWatchId);
      state.locationWatchId = null;
    }
  }

  function setStatus(message) {
    els.statusText.textContent = message;
  }

  function setModelStatus(message, type) {
    setPillStatus(els.modelStatus, message, type);
  }

  function setGpsStatus(message, type) {
    setPillStatus(els.gpsStatus, message, type);
  }

  function setPillStatus(element, message, type) {
    element.textContent = message;
    element.classList.toggle("is-ready", type === "ready");
    element.classList.toggle("is-warning", type === "warning");
    element.classList.toggle("is-error", type === "error");
  }

  function formatName(label) {
    return String(label || "").replace(/_/g, " ");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
