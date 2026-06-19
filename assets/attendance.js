(function () {
  const MODEL_BASE = "https://nadhirafarma.github.io/absensi_apotek/weights";
  const STATIC_FACE_DB_BASE = "https://nadhirafarma.github.io/absensi_apotek/database_wajah";
  const GITHUB_FACE_DB_API_URL = "https://api.github.com/repos/nadhirafarma/absensi_apotek/contents/database_wajah?ref=main";
  const ABSENSI_API_URL = "https://script.google.com/macros/s/AKfycbx7fkoLgH6igHP17przjmxWaP8bQNG_6OcoQ3-Ug79A_vmZxK6_ibCdLC0u-W-JLtw3/exec";
  const DASHBOARD_API_BASE = "https://script.google.com/macros/s/AKfycbzk3yqMIUTkodcmhAHDayVTzb7YGNfJT8jHC4Yeejekt_NBo2cs_oIvR1P82XWNq4Hu/exec";
  const SESSION_KEY = "nadhira.authSession";
  const PROFILE_KEY = "nadhira.localProfile";
  const PHARMACY_PROFILE_KEY = "nadhira.pharmacyIdentity";
  const ATTENDANCE_SHIFT_RULES_KEY = "nadhira.attendanceShiftRules";

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
  const ATTENDANCE_DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const ATTENDANCE_SHIFT_KEYS = ["pagi", "sore"];

  const LABELS = [
    "Al_Hafiz",
    "Meisyi_Amalia",
    "Putri_Sinta",
    "Delpi_Vira",
    "Ayu_Novalia",
    "Tia_Ivanka",
    "Yolan_Alfarel"
  ];
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
    started: false,
    integrityRead: false,
    selectedShift: "",
    selectedAttendanceType: "",
    attendancePlan: null,
    lastLabel: "",
    matchStreak: 0
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindElements();
    bindEvents();
    hydrateAttendanceBrand();
    startClock();

    const profileStatus = validateProfileCompleteness();
    if (!profileStatus.ok) {
      showProfileRequired(profileStatus);
      return;
    }

    await loadAttendanceShiftSettingsFromBackend({ silent: true });
    showIntegrityGate();
  }

  async function startAttendanceFlow() {
    if (state.started) return;
    if (!state.integrityRead) return;
    if (!state.attendancePlan) {
      showAttendanceChoice();
      return;
    }
    state.started = true;
    if (els.attendanceChoiceModal) els.attendanceChoiceModal.hidden = true;
    if (els.integrityGateModal) els.integrityGateModal.hidden = true;
    setStatus("Menyiapkan kamera dan Face ID...");
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
    els.profileRequiredModal = document.getElementById("profileRequiredModal");
    els.profileRequiredMissing = document.getElementById("profileRequiredMissing");
    els.integrityGateModal = document.getElementById("integrityGateModal");
    els.integrityReminderScroll = document.getElementById("integrityReminderScroll");
    els.integrityReadHint = document.getElementById("integrityReadHint");
    els.integrityStartButton = document.getElementById("integrityStartButton");
    els.integrityCloseButton = document.getElementById("integrityCloseButton");
    els.attendanceChoiceModal = document.getElementById("attendanceChoiceModal");
    els.attendanceShiftSelect = document.getElementById("attendanceShiftSelect");
    els.attendanceArrivalButton = document.getElementById("attendanceArrivalButton");
    els.attendanceReturnButton = document.getElementById("attendanceReturnButton");
    els.attendanceOvertimeButton = document.getElementById("attendanceOvertimeButton");
    els.attendanceChoiceCloseButton = document.getElementById("attendanceChoiceCloseButton");
    els.attendanceChoiceStatus = document.getElementById("attendanceChoiceStatus");
  }

  function bindEvents() {
    els.cancelButton.addEventListener("click", cancelAttendance);
    els.retryButton.addEventListener("click", () => window.location.reload());
    if (els.integrityStartButton) {
      els.integrityStartButton.addEventListener("click", () => {
        if (!state.integrityRead) return;
        showAttendanceChoice();
      });
    }
    if (els.integrityReminderScroll) {
      els.integrityReminderScroll.addEventListener("scroll", updateIntegrityReadState, { passive: true });
    }
    if (els.integrityCloseButton) els.integrityCloseButton.addEventListener("click", () => {
      window.location.href = "index.html";
    });
    if (els.attendanceChoiceCloseButton) els.attendanceChoiceCloseButton.addEventListener("click", () => {
      window.location.href = "index.html";
    });
    if (els.attendanceArrivalButton) els.attendanceArrivalButton.addEventListener("click", () => selectAttendanceType("DATANG"));
    if (els.attendanceReturnButton) els.attendanceReturnButton.addEventListener("click", () => selectAttendanceType("PULANG"));
    if (els.attendanceOvertimeButton) els.attendanceOvertimeButton.addEventListener("click", () => selectAttendanceType("LEMBUR"));
    window.addEventListener("beforeunload", stopAll);
    window.addEventListener("resize", resizeFaceCanvas);
  }

  function showIntegrityGate() {
    setStatus("Baca pengingat integritas sebelum memulai Absensi Face ID.");
    setModelStatus("Menunggu mulai", "warning");
    setGpsStatus("Belum dimulai", "warning");
    state.integrityRead = false;
    state.attendancePlan = null;
    state.selectedShift = "";
    state.selectedAttendanceType = "";
    if (els.attendanceChoiceModal) els.attendanceChoiceModal.hidden = true;
    if (els.integrityGateModal) els.integrityGateModal.hidden = false;
    updateIntegrityReadState();
    window.setTimeout(updateIntegrityReadState, 60);
  }

  function updateIntegrityReadState() {
    if (!els.integrityStartButton) return;

    const scrollBox = els.integrityReminderScroll;
    const canStart = state.integrityRead || !scrollBox ||
      scrollBox.scrollHeight - scrollBox.clientHeight <= 8 ||
      scrollBox.scrollTop + scrollBox.clientHeight >= scrollBox.scrollHeight - 8;

    if (canStart) state.integrityRead = true;
    els.integrityStartButton.disabled = !state.integrityRead;
    if (els.integrityReadHint) els.integrityReadHint.hidden = state.integrityRead;
  }

  function showAttendanceChoice() {
    if (!state.integrityRead) return;
    if (els.integrityGateModal) els.integrityGateModal.hidden = true;
    if (els.attendanceChoiceModal) els.attendanceChoiceModal.hidden = false;
    if (els.attendanceShiftSelect) els.attendanceShiftSelect.value = normalizeShiftLabel(state.selectedShift || getShiftLabel());
    state.attendancePlan = null;
    setAttendanceChoiceStatus("Pilih shift dan jenis absensi terlebih dahulu.");
    setStatus("Pilih shift dan jenis absensi sebelum kamera Face ID dimulai.");
  }

  function selectAttendanceType(type) {
    const shift = normalizeShiftLabel(els.attendanceShiftSelect?.value || getShiftLabel());
    const plan = {
      done: false,
      type: normalizeAttendanceType(type),
      shift
    };
    const windowResult = validateAttendanceWindow(plan, getAttendanceProfileData());

    if (!windowResult.ok) {
      setAttendanceChoiceStatus(windowResult.message, "error");
      setStatus(windowResult.message);
      return;
    }

    state.selectedShift = shift;
    state.selectedAttendanceType = plan.type;
    state.attendancePlan = {
      ...plan,
      warning: Boolean(windowResult.warning),
      warningFlag: windowResult.flag || "",
      warningTitle: windowResult.title || "",
      warningMessage: windowResult.message || ""
    };
    setAttendanceChoiceStatus(
      windowResult.warning ? `${windowResult.message} Absensi tetap dapat dilanjutkan.` : "Valid. Menyiapkan kamera Face ID...",
      windowResult.warning ? "warning" : "success"
    );
    startAttendanceFlow();
  }

  function setAttendanceChoiceStatus(message, type) {
    if (!els.attendanceChoiceStatus) return;
    els.attendanceChoiceStatus.textContent = message || "";
    if (type) els.attendanceChoiceStatus.dataset.type = type;
    else els.attendanceChoiceStatus.removeAttribute("data-type");
  }

  function showProfileRequired(profileStatus) {
    const missing = profileStatus.missing || [];
    setStatus("Lengkapi profil terlebih dahulu sebelum absensi.");
    setModelStatus("Profil belum lengkap", "error");
    setGpsStatus("Absensi ditahan", "error");
    if (els.profileRequiredMissing) {
      els.profileRequiredMissing.textContent = missing.length
        ? `Data yang belum lengkap: ${missing.join(", ")}.`
        : "Data profil belum lengkap.";
    }
    if (els.profileRequiredModal) els.profileRequiredModal.hidden = false;
  }

  function validateProfileCompleteness() {
    const profile = getAttendanceProfileData();
    const checks = [
      ["Nama", profile.name],
      ["Email", profile.email],
      ["No. HP", profile.phone],
      ["Alamat", profile.address]
    ];
    const missing = checks
      .filter((item) => !String(item[1] || "").trim())
      .map((item) => item[0]);

    return {
      ok: missing.length === 0,
      missing,
      profile
    };
  }

  function getAttendanceProfileData() {
    const session = readSession() || {};
    const stored = readScopedProfileData(session);
    return {
      name: String(stored.name || session.name || session.username || "").trim(),
      email: String(stored.email || session.email || "").trim(),
      phone: normalizePhoneNumber(stored.phone || session.phone || ""),
      address: String(stored.address || session.address || "").trim(),
      role: String(stored.role || stored.job || session.role || "").trim(),
      username: String(stored.username || session.username || "").trim()
    };
  }

  function readScopedProfileData(session) {
    const identity = getProfileStorageIdentity(session);
    const scoped = readObject(`${PROFILE_KEY}.${identity}`);
    if (Object.keys(scoped).length) return scoped;

    const legacy = readObject(PROFILE_KEY);
    const legacyIdentity = normalizeKey(legacy.profileKey || legacy.email || legacy.username || "");
    return legacyIdentity && legacyIdentity === identity ? legacy : {};
  }

  function getProfileStorageIdentity(session) {
    const rawIdentity = session.email || session.username || session.name || "akun";
    return normalizeKey(rawIdentity) || "akun";
  }

  function readSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function readObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (error) {
      return {};
    }
  }

  function getAttendancePharmacyProfile() {
    const stored = readObject(PHARMACY_PROFILE_KEY);
    const logo = String(stored.logo || stored.logoUrl || "assets/indo-apotek-mark.png").trim();
    const name = String(stored.name || stored.namaApotek || stored.pharmacyName || "Apotek Anda").trim();
    return {
      logo: /^(data:image\/|https?:\/\/|assets\/)/i.test(logo) ? logo : "assets/indo-apotek-mark.png",
      name: name || "Apotek Anda"
    };
  }

  function hydrateAttendanceBrand() {
    const pharmacy = getAttendancePharmacyProfile();
    document.querySelectorAll(".brand-link img").forEach((image) => {
      image.src = pharmacy.logo;
      image.alt = pharmacy.name;
    });
    const brandName = document.querySelector(".attendance-header .brand-link small");
    if (brandName) brandName.textContent = pharmacy.name;
    document.title = `Absensi Face ID - ${pharmacy.name}`;
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
    const remoteDescriptors = await loadRemoteFaceDescriptors(descriptorOptions);
    const remoteLabels = new Set(remoteDescriptors.map((item) => normalizeKey(item.label)));
    const staticDescriptors = await loadStaticFaceDescriptors(descriptorOptions, remoteLabels);
    const descriptors = remoteDescriptors.concat(staticDescriptors);

    if (!descriptors.length) {
      throw new Error("Database wajah tidak terbaca.");
    }

    state.faceMatcher = new faceapi.FaceMatcher(descriptors, 0.5);
  }

  async function loadRemoteFaceDescriptors(descriptorOptions) {
    try {
      const response = await fetchWithTimeout(DASHBOARD_API_BASE, {
        method: "POST",
        body: JSON.stringify({ action: "listFaceDatabase" }),
        cache: "no-store"
      }, 15000);
      if (!response.ok) return [];

      const payload = await response.json();
      const faces = Array.isArray(payload?.faces) ? payload.faces : [];

      return (await Promise.all(faces.map((face) => {
        const label = sanitizeFaceLabel(face.label || face.name);
        const source = String(face.imageDataUrl || face.imageUrl || "").trim();
        return loadFaceDescriptor(label, source, descriptorOptions);
      }))).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  async function loadStaticFaceDescriptors(descriptorOptions, skippedLabels) {
    const files = await listGithubFaceDatabaseFiles();
    const sources = files.length
      ? files
      : LABELS.map((label) => ({ label, imageUrl: `${STATIC_FACE_DB_BASE}/${label}.jpg` }));

    return (await Promise.all(sources.map((file) => {
      const label = sanitizeFaceLabel(file.label);
      if (skippedLabels && skippedLabels.has(normalizeKey(label))) return null;
      return loadFaceDescriptor(label, file.imageUrl, descriptorOptions);
    }))).filter(Boolean);
  }

  async function listGithubFaceDatabaseFiles() {
    try {
      const response = await fetchWithTimeout(GITHUB_FACE_DB_API_URL, { cache: "no-store" }, 12000);
      if (!response.ok) return [];
      const payload = await response.json();
      if (!Array.isArray(payload)) return [];

      return payload
        .filter((file) => /\.(jpe?g|png|webp)$/i.test(String(file.name || "")))
        .map((file) => ({
          label: String(file.name || "").replace(/\.[^.]+$/, ""),
          imageUrl: file.download_url || `${STATIC_FACE_DB_BASE}/${encodeURIComponent(file.name)}`
        }));
    } catch (error) {
      return [];
    }
  }

  async function loadFaceDescriptor(label, source, descriptorOptions) {
    if (!label || !source) return null;

    try {
      const image = await faceapi.fetchImage(source);
      const detection = await faceapi
        .detectSingleFace(image, descriptorOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;
      return new faceapi.LabeledFaceDescriptors(label, [detection.descriptor]);
    } catch (error) {
      return null;
    }
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

      if (attendanceResult.checkFailed) {
        setStatus("Tidak bisa mengecek data absensi di Google Sheet. Absensi dibatalkan agar tidak tercatat dobel.");
        els.retryButton.hidden = false;
        state.paused = true;
        state.processing = false;
        state.lastLabel = "";
        state.matchStreak = 0;
        return;
      }

      const attendancePlan = buildRequestedAttendancePlan(attendanceResult);

      if (attendancePlan.done) {
        showResult(attendancePlan.title || "Absen sudah ada", formatName(label), {
          primary: attendancePlan.message || "Absensi hari ini sudah tercatat.",
          secondary: attendancePlan.secondary || "Bekerjalah dengan jujur dan tanggung jawab."
        }, "warning");
        return;
      }

      if (attendancePlan.blocked) {
        showResult(attendancePlan.title, formatName(label), {
          primary: attendancePlan.message,
          secondary: attendancePlan.secondary || "Silakan pilih jenis absensi yang sesuai."
        }, "warning");
        return;
      }

      const windowResult = validateAttendanceWindow(attendancePlan, getAttendanceProfileData());
      if (!windowResult.ok) {
        showResult(windowResult.title, formatName(label), {
          primary: windowResult.message,
          secondary: windowResult.secondary || "Hubungi owner jika membutuhkan pembukaan akses absensi."
        }, "warning");
        return;
      }

      if (windowResult.warning) {
        attendancePlan.warning = true;
        attendancePlan.warningFlag = windowResult.flag || attendancePlan.warningFlag || "";
        attendancePlan.warningTitle = windowResult.title || attendancePlan.warningTitle || "";
        attendancePlan.warningMessage = windowResult.message || attendancePlan.warningMessage || "";
        setStatus(`${windowResult.message} Absensi tetap diproses.`);
      }

      await sendAttendance(label, locationResult, attendancePlan);
    } catch (error) {
      setStatus(`Absensi gagal: ${error.message}`);
      els.retryButton.hidden = false;
      state.paused = true;
      state.processing = false;
    }
  }

  async function validateLocation(label) {
    const profile = getAttendanceProfileData();

    if (canBypassAttendanceRules(profile)) {
      return {
        ok: true,
        message: "GPS dilewati untuk owner.",
        location: null,
        distance: 0
      };
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

  function buildAttendancePlan(result) {
    const hasDatang = Boolean(result?.datang);
    const hasPulang = Boolean(result?.pulang);
    if ((hasDatang && hasPulang) || (result?.sudahAbsen && !hasDatang && !hasPulang)) {
      return { done: true, type: "", shift: "" };
    }

    if (hasDatang) {
      const datangInfo = typeof result.datang === "object" ? result.datang : {};
      return {
        done: false,
        type: "PULANG",
        shift: normalizeShiftLabel(datangInfo.shift || result.datangShift || getShiftLabel())
      };
    }

    return {
      done: false,
      type: "DATANG",
      shift: getShiftLabel()
    };
  }

  function buildRequestedAttendancePlan(result) {
    const selected = state.attendancePlan;
    if (!selected) return buildAttendancePlan(result);

    const hasDatang = Boolean(result?.datang);
    const hasPulang = Boolean(result?.pulang);
    const hasLembur = Boolean(result?.lembur);
    const shift = normalizeShiftLabel(selected.shift || getShiftLabel());
    const datangInfo = typeof result.datang === "object" ? result.datang : {};
    const rawDatangShift = String(datangInfo.shift || result.datangShift || "").trim();
    const existingDatangShift = rawDatangShift ? normalizeShiftLabel(rawDatangShift) : "";

    if (selected.type === "LEMBUR") {
      if (hasLembur) {
        return {
          done: true,
          type: "LEMBUR",
          shift,
          title: "Absen Lembur Sudah Ada",
          message: "Absen lembur hari ini sudah tercatat."
        };
      }

      return {
        done: false,
        type: "LEMBUR",
        shift,
        warning: Boolean(selected.warning),
        warningFlag: selected.warningFlag || "",
        warningTitle: selected.warningTitle || "",
        warningMessage: selected.warningMessage || ""
      };
    }

    if ((hasDatang && hasPulang) || (result?.sudahAbsen && !hasDatang && !hasPulang)) {
      return {
        done: true,
        type: "",
        shift,
        title: "Absen Sudah Lengkap",
        message: "Absensi datang dan pulang hari ini sudah tercatat."
      };
    }

    if (selected.type === "DATANG" && hasDatang) {
      return {
        done: true,
        type: "DATANG",
        shift,
        title: "Absen Datang Sudah Ada",
        message: "Absen datang hari ini sudah tercatat. Gunakan Absen Pulang jika sudah waktunya."
      };
    }

    if (selected.type === "PULANG" && hasPulang) {
      return {
        done: true,
        type: "PULANG",
        shift,
        title: "Absen Pulang Sudah Ada",
        message: "Absen pulang hari ini sudah tercatat."
      };
    }

    if (selected.type === "PULANG" && hasDatang && existingDatangShift && shift !== existingDatangShift) {
      const shiftText = existingDatangShift === "SHIFT SORE" ? "shift sore" : "shift pagi";
      return {
        blocked: true,
        type: "PULANG",
        shift: existingDatangShift,
        title: "Shift Tidak Sesuai",
        message: `Anda berada di ${shiftText}, pilih ${shiftText} untuk absen pulang.`
      };
    }

    if (selected.type === "PULANG" && !hasDatang) {
      return {
        blocked: true,
        type: "PULANG",
        shift,
        title: "Absen Datang Belum Ada",
        message: "Absen pulang belum bisa karena absen datang hari ini belum tercatat."
      };
    }

    return {
      done: false,
      type: normalizeAttendanceType(selected.type),
      shift,
      warning: Boolean(selected.warning),
      warningFlag: selected.warningFlag || "",
      warningTitle: selected.warningTitle || "",
      warningMessage: selected.warningMessage || ""
    };
  }

  function validateAttendanceWindow(plan, profile) {
    if (canBypassAttendanceRules(profile)) {
      return { ok: true };
    }

    if (plan.type === "LEMBUR") {
      return { ok: true };
    }

    const now = getJakartaNowParts();
    const minutes = now.hour * 60 + now.minute;
    const rule = getAttendanceRuleForDay(now.weekday, plan.shift);
    const shiftLabel = normalizeShiftLabel(plan.shift) === "SHIFT PAGI" ? "shift pagi" : "shift sore";
    const deadline = getRuleDeadlineMinutes(rule);
    const returnStart = parseRuleTime(rule.returnStart, minutesOf(0, 0));

    if (plan.type === "DATANG" && minutes > deadline) {
      const lateMinutes = Math.max(1, minutes - deadline);
      return {
        ok: true,
        warning: true,
        flag: "late",
        title: "Absen Terlambat",
        message: `Anda telat absensi selama ${formatDurationWords(lateMinutes)}. Batas absen datang ${shiftLabel} sampai jam ${formatRuleTime(deadline)}.`
      };
    }

    if (plan.type === "PULANG" && minutes < returnStart) {
      const earlyMinutes = Math.max(1, returnStart - minutes);
      return {
        ok: true,
        warning: true,
        flag: "early_return",
        title: "Pulang Terlalu Cepat",
        message: `Anda Pulang ${formatDurationWords(earlyMinutes)} lebih cepat, seharusnya jam ${formatRuleTime(returnStart)}.`
      };
    }

    return { ok: true };
  }

  function canBypassAttendanceRules(profile) {
    const role = normalizeSearch(profile?.role || "");
    const username = normalizeSearch(profile?.username || profile?.name || "");
    return role === "owner" || username === "owner";
  }

  async function sendAttendance(label, locationResult, attendancePlan) {
    setStatus("Mengirim absensi...");

    const photo = capturePhoto();
    const photoBase64 = extractBase64(photo);
    const displayName = formatName(label);
    const shift = normalizeShiftLabel(attendancePlan?.shift || getShiftLabel());
    const attendanceType = attendancePlan?.type || "DATANG";
    const jakartaTime = getJakartaNowParts();
    const submitUrl = `${ABSENSI_API_URL}?nama=${encodeURIComponent(label)}&nama_karyawan=${encodeURIComponent(displayName)}&status=${encodeURIComponent(attendanceType)}`;
    const timestamp = new Date().toISOString();
    const fileName = `absensi_${label}_${timestamp.replace(/[:.]/g, "-")}.jpg`;
    const payload = {
      nama: label,
      nama_karyawan: displayName,
      namaKaryawan: displayName,
      status: attendanceType,
      status_kehadiran: attendanceType,
      statusKehadiran: attendanceType,
      jenis_absen: attendanceType,
      jenisAbsen: attendanceType,
      shift,
      SHIFT: shift,
      tanggal_absen: jakartaTime.dateKey,
      tanggalAbsen: jakartaTime.dateKey,
      jam_absen: jakartaTime.timeText,
      jamAbsen: jakartaTime.timeText,
      waktu_datang: attendanceType === "DATANG" ? jakartaTime.timeText : "",
      waktu_pulang: attendanceType === "PULANG" ? jakartaTime.timeText : "",
      waktu_lembur: attendanceType === "LEMBUR" ? jakartaTime.timeText : "",
      jam_lembur: attendanceType === "LEMBUR" ? jakartaTime.timeText : "",
      jamLembur: attendanceType === "LEMBUR" ? jakartaTime.timeText : "",
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
      attendance_warning: attendancePlan?.warningMessage || "",
      attendanceWarning: attendancePlan?.warningMessage || "",
      attendance_flag: attendancePlan?.warningFlag || "",
      attendanceFlag: attendancePlan?.warningFlag || "",
      timestamp
    };
    let responseText = "";
    let result = {};

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
        throw new Error("Gagal menghubungi server absensi. Coba lagi setelah koneksi stabil.");
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
      const duplicateLabel = getAttendanceTypeLabel(attendanceType).toLowerCase();
      showResult("Absen sudah ada", displayName, {
        primary: `${duplicateLabel} hari ini sudah tercatat.`,
        secondary: "Bekerjalah dengan jujur dan tanggung jawab."
      }, "warning");
      return;
    }

    const warningMessage = attendancePlan?.warningMessage || result.warningMessage || "";
    const successTitle = attendanceType === "PULANG"
      ? "Absen Pulang Berhasil"
      : attendanceType === "LEMBUR"
        ? "Absen Lembur Berhasil"
        : "Absen Datang Berhasil";
    const successLabel = getAttendanceTypeLabel(attendanceType).toLowerCase();

    showResult(successTitle, displayName, {
      primary: `${successLabel} tersimpan`,
      secondary: warningMessage || "Bekerjalah dengan jujur dan tanggung jawab."
    }, "success");
  }

  function normalizeAttendanceType(type) {
    const text = String(type || "").toUpperCase();
    if (text === "PULANG") return "PULANG";
    if (text === "LEMBUR") return "LEMBUR";
    return "DATANG";
  }

  function getAttendanceTypeLabel(type) {
    if (type === "PULANG") return "Absen pulang";
    if (type === "LEMBUR") return "Absen lembur";
    return "Absen datang";
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
    const hour = jakartaHour === 24 ? 0 : jakartaHour;

    return hour < 12 ? "SHIFT PAGI" : "SHIFT SORE";
  }

  function normalizeShiftLabel(value) {
    return /sore/i.test(String(value || "")) ? "SHIFT SORE" : "SHIFT PAGI";
  }

  function normalizeShiftKey(value) {
    return normalizeShiftLabel(value) === "SHIFT SORE" ? "sore" : "pagi";
  }

  function getAttendanceRuleForDay(weekday, shift) {
    const rules = loadAttendanceShiftRules();
    const dayKey = getAttendanceDayKey(weekday);
    const shiftKey = normalizeShiftKey(shift);
    return rules.days[dayKey]?.[shiftKey] || createDefaultAttendanceShiftRules().days[dayKey][shiftKey];
  }

  function loadAttendanceShiftRules() {
    return normalizeAttendanceShiftRules(readObject(ATTENDANCE_SHIFT_RULES_KEY));
  }

  async function loadAttendanceShiftSettingsFromBackend(options = {}) {
    try {
      const response = await fetchWithTimeout(DASHBOARD_API_BASE, {
        method: "POST",
        body: JSON.stringify({ action: "getAttendanceShiftSettings" }),
        cache: "no-store"
      }, 10000);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const remoteRules = result?.settings || result?.rules;
      if (result && (result.success === true || result.ok === true) && remoteRules) {
        localStorage.setItem(ATTENDANCE_SHIFT_RULES_KEY, JSON.stringify(normalizeAttendanceShiftRules(remoteRules)));
      }
    } catch (error) {
      if (!options.silent) setStatus("Aturan shift belum bisa disinkronkan. Menggunakan aturan terakhir di perangkat.");
    }
  }

  function createDefaultAttendanceShiftRules() {
    const rules = {
      updatedAt: "",
      days: {}
    };

    ATTENDANCE_DAY_KEYS.forEach((dayKey) => {
      const isSunday = dayKey === "sunday";
      rules.days[dayKey] = {
        pagi: {
          start: "08:00",
          lateMinutes: isSunday ? 15 : 45,
          deadline: isSunday ? "08:15" : "08:45",
          returnStart: isSunday ? "15:00" : "15:30"
        },
        sore: {
          start: "14:00",
          lateMinutes: 30,
          deadline: "14:30",
          returnStart: "21:00"
        }
      };
    });

    return rules;
  }

  function normalizeAttendanceShiftRules(value) {
    const defaults = createDefaultAttendanceShiftRules();
    const source = value && typeof value === "object" ? value : {};
    const normalized = createDefaultAttendanceShiftRules();
    normalized.updatedAt = String(source.updatedAt || "");

    ATTENDANCE_DAY_KEYS.forEach((dayKey) => {
      ATTENDANCE_SHIFT_KEYS.forEach((shiftKey) => {
        const sourceRule = source.days?.[dayKey]?.[shiftKey] || {};
        const defaultRule = defaults.days[dayKey][shiftKey];
        normalized.days[dayKey][shiftKey] = {
          start: sanitizeRuleTime(sourceRule.start, defaultRule.start),
          lateMinutes: clampInteger(sourceRule.lateMinutes, 0, 240, defaultRule.lateMinutes),
          deadline: sanitizeRuleTime(sourceRule.deadline, defaultRule.deadline),
          returnStart: sanitizeRuleTime(sourceRule.returnStart, defaultRule.returnStart)
        };
      });
    });

    return normalized;
  }

  function getAttendanceDayKey(weekday) {
    const key = String(weekday || "").trim().toLowerCase();
    return ATTENDANCE_DAY_KEYS.indexOf(key) >= 0 ? key : "monday";
  }

  function getRuleDeadlineMinutes(rule) {
    const start = parseRuleTime(rule.start, minutesOf(0, 0));
    const fallback = start + clampInteger(rule.lateMinutes, 0, 240, 0);
    return Math.max(parseRuleTime(rule.deadline, fallback), fallback);
  }

  function sanitizeRuleTime(value, fallback) {
    const parsed = parseRuleTime(value, -1);
    if (parsed < 0) return fallback;
    const hour = Math.floor(parsed / 60);
    const minute = parsed % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function parseRuleTime(value, fallback) {
    const text = String(value || "").trim();
    const match = text.match(/^(\d{1,2})[:.](\d{2})$/);
    if (!match) return fallback;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
    return minutesOf(hour, minute);
  }

  function clampInteger(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.round(number)));
  }

  function getJakartaNowParts() {
    const parts = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    }).formatToParts(new Date()).reduce((map, part) => {
      map[part.type] = part.value;
      return map;
    }, {});
    const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour || 0);
    const minute = Number(parts.minute || 0);
    const year = String(parts.year || "").padStart(4, "0");
    const month = String(parts.month || "").padStart(2, "0");
    const day = String(parts.day || "").padStart(2, "0");

    return {
      weekday: parts.weekday || "",
      hour,
      minute,
      dateKey: `${year}-${month}-${day}`,
      timeText: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    };
  }

  function minutesOf(hour, minute) {
    return hour * 60 + minute;
  }

  function formatRuleTime(totalMinutes) {
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return `${String(hour).padStart(2, "0")}.${String(minute).padStart(2, "0")}`;
  }

  function formatDurationWords(totalMinutes) {
    const safeMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    const parts = [];

    if (hours) parts.push(`${hours} Jam`);
    if (minutes || !parts.length) parts.push(`${minutes} Menit`);

    return parts.join(" ");
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
    const pharmacy = getAttendancePharmacyProfile();

    document.body.innerHTML = `
      <main class="attendance-shell">
        <section class="attendance-card result-card">
          <header class="attendance-header result-header">
            <a class="brand-link" href="index.html" aria-label="Kembali ke menu utama">
              <img src="${escapeHtml(pharmacy.logo)}" alt="${escapeHtml(pharmacy.name)}">
              <span>
                <strong>${escapeHtml(pharmacy.name)}</strong>
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

  function sanitizeFaceLabel(value) {
    return String(value || "")
      .trim()
      .replace(/_/g, " ")
      .replace(/[^\w\s-]+/g, "")
      .replace(/\s+/g, "_");
  }

  function normalizeSearch(value) {
    return String(value || "").trim().toLowerCase().replace(/_/g, " ");
  }

  function normalizeKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function normalizePhoneNumber(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const cleaned = text.replace(/[^\d+]/g, "");
    if (/^\+/.test(cleaned)) return cleaned;
    if (/^8\d{7,}$/.test(cleaned)) return `0${cleaned}`;
    return cleaned;
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
