import {
  PoseLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

import {
  drawDigestiveSystem,
  drawDebugSkeleton,
  hitTestOrgan,
  ORGAN_FACTS,
} from "./digestive-overlay.js";

const MEDIAPIPE_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const stage = document.getElementById("stage");
const permissionGate = document.getElementById("permission-gate");
const statusBanner = document.getElementById("status-banner");
const noPose = document.getElementById("no-pose");

const btnStart = document.getElementById("btn-start");
const btnToggleCam = document.getElementById("btn-toggle-cam");
const btnOverlay = document.getElementById("btn-overlay");
const btnLabels = document.getElementById("btn-labels");
const btnMirror = document.getElementById("btn-mirror");
const btnSkeleton = document.getElementById("btn-skeleton");
const btnHelp = document.getElementById("btn-help");

const factDialog = document.getElementById("fact-dialog");
const factTitle = document.getElementById("fact-title");
const factEn = document.getElementById("fact-en");
const factBody = document.getElementById("fact-body");
const factColor = document.getElementById("fact-color");
const helpDialog = document.getElementById("help-dialog");

const state = {
  running: false,
  stream: null,
  poseLandmarker: null,
  lastVideoTime: -1,
  showOverlay: true,
  showLabels: true,
  mirror: false,
  showSkeleton: false,
  hitRegions: [],
  facingMode: "user", // start with selfie-friendly; user can still see self
  raf: 0,
  lastPoseTs: 0,
};

function setStatus(msg, ms = 0) {
  if (!msg) {
    statusBanner.classList.add("hidden");
    statusBanner.textContent = "";
    return;
  }
  statusBanner.textContent = msg;
  statusBanner.classList.remove("hidden");
  if (ms > 0) {
    clearTimeout(setStatus._t);
    setStatus._t = setTimeout(() => setStatus(""), ms);
  }
}

function setControlsEnabled(on) {
  for (const b of [btnToggleCam, btnOverlay, btnLabels, btnMirror, btnSkeleton]) {
    b.disabled = !on;
  }
}

function updateToggleLabels() {
  btnOverlay.classList.toggle("active", state.showOverlay);
  btnOverlay.querySelector(".ctrl-label").textContent = state.showOverlay
    ? "疊圖：開"
    : "疊圖：關";

  btnLabels.classList.toggle("active", state.showLabels);
  btnLabels.querySelector(".ctrl-label").textContent = state.showLabels
    ? "標籤：開"
    : "標籤：關";

  btnMirror.classList.toggle("active", state.mirror);
  btnMirror.querySelector(".ctrl-label").textContent = state.mirror
    ? "鏡像：開"
    : "鏡像：關";
  stage.classList.toggle("mirrored", state.mirror);

  btnSkeleton.classList.toggle("active", state.showSkeleton);
  btnSkeleton.querySelector(".ctrl-label").textContent = state.showSkeleton
    ? "骨架：開"
    : "骨架：關";

  btnToggleCam.querySelector(".ctrl-icon").textContent = state.running ? "⏹" : "▶️";
  btnToggleCam.querySelector(".ctrl-label").textContent = state.running
    ? "停止相機"
    : "開相機";
}

async function initPoseLandmarker() {
  setStatus("載入姿勢模型中…");
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);
  const common = {
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
  try {
    state.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      ...common,
    });
  } catch (e) {
    console.warn("GPU delegate failed, falling back to CPU", e);
    state.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
      ...common,
    });
  }
  setStatus("模型就緒", 1500);
}

async function startCamera() {
  if (state.running) return;

  btnStart.disabled = true;
  btnStart.textContent = "啟動中…";
  setStatus("請求相機權限…");

  try {
    if (!state.poseLandmarker) {
      await initPoseLandmarker();
    }

    // Prefer environment (rear) on phones for pointing at another person;
    // fall back to user.
    let stream;
    const tryModes = ["environment", "user"];
    let lastErr;
    for (const mode of tryModes) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        state.facingMode = mode;
        break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!stream) throw lastErr || new Error("無法開啟相機");

    state.stream = stream;
    video.srcObject = stream;
    await video.play();

    state.running = true;
    permissionGate.classList.add("hidden");
    setControlsEnabled(true);
    updateToggleLabels();
    setStatus(
      state.facingMode === "environment"
        ? "後置鏡頭已開——影住同學全身"
        : "前置鏡頭已開——可開鏡像睇住自己",
      2800
    );
    resizeCanvas();
    loop();
  } catch (err) {
    console.error(err);
    btnStart.disabled = false;
    btnStart.textContent = "再開啟相機";
    let msg = "無法開啟相機。";
    if (err && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
      msg = "你拒絕咗相機權限。請喺瀏覽器設定允許相機，再試一次。";
    } else if (err && err.name === "NotFoundError") {
      msg = "搵唔到相機裝置。";
    } else if (location.protocol === "file:") {
      msg = "請用本地伺服器開啟（唔好直接雙擊 HTML），否則相機會被封鎖。";
    }
    setStatus(msg);
    alert(msg);
  }
}

function stopCamera() {
  state.running = false;
  if (state.raf) cancelAnimationFrame(state.raf);
  state.raf = 0;
  if (state.stream) {
    for (const t of state.stream.getTracks()) t.stop();
    state.stream = null;
  }
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.hitRegions = [];
  noPose.classList.add("hidden");
  permissionGate.classList.remove("hidden");
  btnStart.disabled = false;
  btnStart.textContent = "開啟相機開始";
  setControlsEnabled(false);
  updateToggleLabels();
  setStatus("相機已停止", 1500);
}

function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
}

/**
 * Map pose landmarks (normalized to video frame) into canvas cover-layout space.
 */
function mapLandmarksToCanvas(landmarks) {
  const cw = canvas.width;
  const ch = canvas.height;
  const vw = video.videoWidth || cw;
  const vh = video.videoHeight || ch;
  if (!vw || !vh) return landmarks;

  const scale = Math.max(cw / vw, ch / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;

  return landmarks.map((p) => ({
    x: (ox + p.x * dw) / cw,
    y: (oy + p.y * dh) / ch,
    z: p.z,
    visibility: p.visibility,
  }));
}

function loop() {
  if (!state.running) return;
  state.raf = requestAnimationFrame(loop);

  if (video.readyState < 2) return;

  const now = performance.now();
  if (video.currentTime === state.lastVideoTime) {
    // still redraw last hit regions? skip detect but keep canvas if needed
  }
  state.lastVideoTime = video.currentTime;

  let result;
  try {
    result = state.poseLandmarker.detectForVideo(video, now);
  } catch (e) {
    console.warn(e);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.hitRegions = [];

  const poses = result?.landmarks || [];
  if (!poses.length) {
    noPose.classList.remove("hidden");
    return;
  }
  noPose.classList.add("hidden");
  state.lastPoseTs = now;

  const mapped = mapLandmarksToCanvas(poses[0]);

  if (state.showSkeleton) {
    drawDebugSkeleton(ctx, mapped, canvas.width, canvas.height);
  }

  if (state.showOverlay) {
    state.hitRegions = drawDigestiveSystem(ctx, mapped, {
      width: canvas.width,
      height: canvas.height,
      showLabels: state.showLabels,
      mirrored: state.mirror,
    });
  }
}

function canvasPointerToHit(evt) {
  const rect = canvas.getBoundingClientRect();
  const dprX = canvas.width / rect.width;
  const dprY = canvas.height / rect.height;
  let x = (evt.clientX - rect.left) * dprX;
  let y = (evt.clientY - rect.top) * dprY;
  // When CSS mirror is applied, visual click is mirrored but canvas buffer is not.
  // stage.mirrored flips both video and canvas via CSS, so hit coords in buffer
  // need to be mirrored back.
  if (state.mirror) {
    x = canvas.width - x;
  }
  return { x, y };
}

function showFact(id) {
  const info = ORGAN_FACTS[id];
  if (!info) return;
  factTitle.textContent = info.zh;
  factEn.textContent = info.en;
  factBody.textContent = info.fact;
  factColor.style.background = info.color;
  if (typeof factDialog.showModal === "function") {
    factDialog.showModal();
  }
}

// Events
btnStart.addEventListener("click", () => startCamera());
btnToggleCam.addEventListener("click", () => {
  if (state.running) stopCamera();
  else startCamera();
});
btnOverlay.addEventListener("click", () => {
  state.showOverlay = !state.showOverlay;
  updateToggleLabels();
});
btnLabels.addEventListener("click", () => {
  state.showLabels = !state.showLabels;
  updateToggleLabels();
});
btnMirror.addEventListener("click", () => {
  state.mirror = !state.mirror;
  updateToggleLabels();
});
btnSkeleton.addEventListener("click", () => {
  state.showSkeleton = !state.showSkeleton;
  updateToggleLabels();
});
btnHelp.addEventListener("click", () => {
  if (typeof helpDialog.showModal === "function") helpDialog.showModal();
});

canvas.addEventListener("click", (evt) => {
  if (!state.showOverlay || !state.hitRegions.length) return;
  const { x, y } = canvasPointerToHit(evt);
  const id = hitTestOrgan(state.hitRegions, x, y);
  if (id) showFact(id);
});

window.addEventListener("resize", () => {
  resizeCanvas();
});

// Warm-load model in background after first paint (optional snappy start)
updateToggleLabels();
setControlsEnabled(false);

if (!navigator.mediaDevices?.getUserMedia) {
  setStatus("呢個瀏覽器唔支援相機 API。請用最新 Chrome 或 Safari。");
  btnStart.disabled = true;
}

// Expose tiny debug hook
window.__digestiveAR = state;
