/**
 * Digestive-system overlay: Alice's anatomical diagram aligned to torso pose.
 * Landmark indices follow MediaPipe Pose (33 points).
 */

export const ORGAN_FACTS = {
  mouth: {
    zh: "口腔",
    en: "Mouth cavity",
    color: "#f472b6",
    fact: "消化由口腔開始：牙齒咬碎食物，舌頭幫忙攪拌，唾液開始分解澱粉。",
  },
  pharynx: {
    zh: "咽",
    en: "Pharynx",
    color: "#e879f9",
    fact: "咽係口腔同食道之間嘅通道，吞嚥時會把食物由口腔送入食道。",
  },
  salivaryGlands: {
    zh: "唾液腺",
    en: "Salivary glands",
    color: "#c084fc",
    fact: "唾液腺分泌唾液，含澱粉酶，幫助初步分解澱粉，亦令食物更容易吞嚥。",
  },
  esophagus: {
    zh: "食道",
    en: "Oesophagus",
    color: "#fb923c",
    fact: "食道係一條肌肉管，用蠕動把食物由咽送落胃，即使倒立都可以運送！",
  },
  stomach: {
    zh: "胃",
    en: "Stomach",
    color: "#f87171",
    fact: "胃會分泌胃酸同消化酶，把食物攪拌成食糜。健康成人胃大約可以容納 1–1.5 升。",
  },
  liver: {
    zh: "肝臟",
    en: "Liver",
    color: "#a78bfa",
    fact: "肝臟係體內最大嘅實質器官，製造膽汁幫助消化脂肪，仲會解毒同儲存養分。",
  },
  pancreas: {
    zh: "胰臟",
    en: "Pancreas",
    color: "#fbbf24",
    fact: "胰臟分泌胰液（含多種消化酶）去小腸，亦分泌胰島素調節血糖。",
  },
  duodenum: {
    zh: "十二指腸",
    en: "Duodenum",
    color: "#fdba74",
    fact: "十二指腸係小腸起始段，接受胃嘅食糜，以及膽汁同胰液，係消化嘅重要關口。",
  },
  smallIntestine: {
    zh: "小腸（迴腸）",
    en: "Ileum / Small intestine",
    color: "#fb7185",
    fact: "小腸約 6–7 米長，表面有絨毛大大增加吸收面積，大部分養分喺度被吸收。",
  },
  caecum: {
    zh: "盲腸",
    en: "Caecum",
    color: "#4ade80",
    fact: "盲腸係大腸起始嘅袋狀部分，連接小腸同結腸。",
  },
  appendix: {
    zh: "闌尾",
    en: "Appendix",
    color: "#86efac",
    fact: "闌尾係盲腸伸出嘅細小管狀結構；發炎時就係常見嘅闌尾炎。",
  },
  largeIntestine: {
    zh: "結腸／大腸",
    en: "Colon",
    color: "#60a5fa",
    fact: "結腸吸收水分同礦物質，把剩餘物質形成糞便；亦有好多腸道細菌幫助發酵。",
  },
  rectum: {
    zh: "直腸",
    en: "Rectum",
    color: "#94a3b8",
    fact: "直腸暫存糞便，感覺脹滿時會產生便意。",
  },
  anus: {
    zh: "肛門",
    en: "Anus",
    color: "#64748b",
    fact: "肛門括約肌控制糞便排出，完成消化系統嘅最後一步。",
  },
  digestiveSystem: {
    zh: "消化系統",
    en: "Digestive system",
    color: "#0d9488",
    fact: "消化系統包括消化道（口腔→肛門）同消化腺（唾液腺、肝、胰等），負責分解同吸收食物。",
  },
};

/** MediaPipe Pose landmark indices */
const L = {
  NOSE: 0,
  MOUTH_L: 9,
  MOUTH_R: 10,
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_HIP: 23,
  R_HIP: 24,
};

/**
 * Calibration in diagram image pixels (assets/digestive-diagram.jpg / .png).
 * midShoulder → midHip maps onto pose shoulder mid → hip mid.
 */
const FULL_CALIB = {
  midShoulder: { x: 600, y: 255 },
  midHip: { x: 598, y: 855 },
  /** Approximate body silhouette half-width at shoulders (px) */
  shoulderHalfW: 100,
};

/** Body-only crop (assets/digestive-body.png) was taken at (430, 10)-(780, 1005) */
const BODY_CROP_ORIGIN = { x: 430, y: 10 };
const BODY_CALIB = {
  midShoulder: {
    x: FULL_CALIB.midShoulder.x - BODY_CROP_ORIGIN.x,
    y: FULL_CALIB.midShoulder.y - BODY_CROP_ORIGIN.y,
  },
  midHip: {
    x: FULL_CALIB.midHip.x - BODY_CROP_ORIGIN.x,
    y: FULL_CALIB.midHip.y - BODY_CROP_ORIGIN.y,
  },
  shoulderHalfW: FULL_CALIB.shoulderHalfW,
};

/** Hotspots in torso UV: u across (−0.5…0.5), v along shoulder→hip (0…1+) */
const HOTSPOTS = [
  { id: "mouth", u: 0.02, v: -0.42, r: 0.12 },
  { id: "pharynx", u: 0.0, v: -0.28, r: 0.1 },
  { id: "salivaryGlands", u: 0.18, v: -0.35, r: 0.11 },
  { id: "esophagus", u: 0.0, v: 0.12, r: 0.1 },
  { id: "liver", u: -0.22, v: 0.42, r: 0.16 },
  { id: "stomach", u: 0.18, v: 0.48, r: 0.14 },
  { id: "pancreas", u: 0.06, v: 0.58, r: 0.11 },
  { id: "duodenum", u: 0.08, v: 0.66, r: 0.1 },
  { id: "smallIntestine", u: 0.0, v: 0.82, r: 0.18 },
  { id: "caecum", u: -0.2, v: 0.95, r: 0.1 },
  { id: "appendix", u: -0.22, v: 1.02, r: 0.08 },
  { id: "largeIntestine", u: 0.22, v: 0.78, r: 0.14 },
  { id: "rectum", u: 0.02, v: 1.12, r: 0.1 },
  { id: "anus", u: 0.02, v: 1.22, r: 0.08 },
];

let diagramFull = null;
let diagramBody = null;
let loadPromise = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/** Preload diagram assets (call once from app). */
export function loadDiagramImages() {
  if (loadPromise) return loadPromise;
  loadPromise = Promise.all([
    loadImage("assets/digestive-diagram.png").catch(() =>
      loadImage("assets/digestive-diagram.jpg")
    ),
    loadImage("assets/digestive-body.png").catch(() => null),
  ]).then(([full, body]) => {
    diagramFull = full;
    diagramBody = body;
    return true;
  });
  return loadPromise;
}

function avg(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z || 0) + (b.z || 0)) / 2,
  };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function buildTorsoFrame(landmarks) {
  const ls = landmarks[L.L_SHOULDER];
  const rs = landmarks[L.R_SHOULDER];
  const lh = landmarks[L.L_HIP];
  const rh = landmarks[L.R_HIP];
  const nose = landmarks[L.NOSE];
  const mouth = avg(landmarks[L.MOUTH_L], landmarks[L.MOUTH_R]);

  if (!ls || !rs || !lh || !rh || !nose) return null;

  const midShoulder = avg(ls, rs);
  const midHip = avg(lh, rh);
  const shoulderW = dist(ls, rs);
  const torsoH = dist(midShoulder, midHip);

  if (shoulderW < 0.02 || torsoH < 0.02) return null;

  let downX = midHip.x - midShoulder.x;
  let downY = midHip.y - midShoulder.y;
  const downLen = Math.hypot(downX, downY) || 1;
  downX /= downLen;
  downY /= downLen;

  let rightX = -downY;
  let rightY = downX;
  const rightLen = Math.hypot(rightX, rightY) || 1;
  rightX /= rightLen;
  rightY /= rightLen;

  return {
    origin: midShoulder,
    midHip,
    midShoulder,
    nose,
    mouth,
    shoulderW,
    torsoH,
    down: { x: downX, y: downY },
    right: { x: rightX, y: rightY },
    ls,
    rs,
    lh,
    rh,
  };
}

/** Map local torso coords: u ∈ [-0.5,0.5] across, v ∈ [0,1] shoulder→hip */
export function torsoToNorm(frame, u, v) {
  const x =
    frame.origin.x +
    frame.right.x * u * frame.shoulderW * 1.15 +
    frame.down.x * v * frame.torsoH;
  const y =
    frame.origin.y +
    frame.right.y * u * frame.shoulderW * 1.15 +
    frame.down.y * v * frame.torsoH;
  return { x, y };
}

function toCanvas(pt, w, h) {
  return { x: pt.x * w, y: pt.y * h };
}

/**
 * Draw the anatomical diagram transformed so diagram shoulder→hip
 * matches the pose torso frame.
 */
function drawDiagramOnTorso(ctx, img, calib, frame, width, height) {
  const midS = toCanvas(frame.midShoulder, width, height);
  const midH = toCanvas(frame.midHip, width, height);
  const ls = toCanvas(frame.ls, width, height);
  const rs = toCanvas(frame.rs, width, height);

  const poseDownX = midH.x - midS.x;
  const poseDownY = midH.y - midS.y;
  const poseTorsoLen = Math.hypot(poseDownX, poseDownY) || 1;
  const poseAngle = Math.atan2(poseDownY, poseDownX);

  const imgDownX = calib.midHip.x - calib.midShoulder.x;
  const imgDownY = calib.midHip.y - calib.midShoulder.y;
  const imgTorsoLen = Math.hypot(imgDownX, imgDownY) || 1;
  const imgAngle = Math.atan2(imgDownY, imgDownX);

  const poseShoulderPx = Math.hypot(ls.x - rs.x, ls.y - rs.y);
  const scaleY = poseTorsoLen / imgTorsoLen;
  const scaleX = (poseShoulderPx * 1.05) / (calib.shoulderHalfW * 2);

  ctx.save();
  ctx.globalAlpha = 0.94;
  // Mild classroom clarity boost (image already recolored offline)
  try {
    ctx.filter = "saturate(1.12) contrast(1.04)";
  } catch (_) {
    /* older browsers */
  }
  ctx.translate(midS.x, midS.y);
  ctx.rotate(poseAngle - imgAngle);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-calib.midShoulder.x, -calib.midShoulder.y);
  ctx.drawImage(img, 0, 0);
  ctx.filter = "none";
  ctx.restore();
}

function buildHitRegions(frame, width, height) {
  const hits = [];
  const unit = frame.shoulderW * width;

  for (const hs of HOTSPOTS) {
    const p = toCanvas(torsoToNorm(frame, hs.u, hs.v), width, height);
    const r = Math.max(14, unit * hs.r * 1.15);
    hits.push({
      id: hs.id,
      type: "ellipse",
      cx: p.x,
      cy: p.y,
      rx: r,
      ry: r * 0.9,
    });
  }

  // Whole-torso fallback
  const center = toCanvas(torsoToNorm(frame, 0, 0.55), width, height);
  hits.push({
    id: "digestiveSystem",
    type: "ellipse",
    cx: center.x,
    cy: center.y,
    rx: unit * 0.7,
    ry: frame.torsoH * height * 0.7,
  });

  return hits;
}

function pointInEllipse(px, py, cx, cy, rx, ry) {
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

/**
 * Draw digestive overlay and return hit-test regions in canvas pixels.
 * showLabels=true → full diagram with English labels (default, as Alice provided)
 * showLabels=false → body-only crop without side label panels
 */
export function drawDigestiveSystem(ctx, landmarks, opts) {
  const { width, height, showLabels = true } = opts;

  const frame = buildTorsoFrame(landmarks);
  if (!frame) return [];

  const preferFull = showLabels || !diagramBody;
  const img = preferFull ? diagramFull : diagramBody;
  const calib = preferFull ? FULL_CALIB : BODY_CALIB;

  if (img && img.complete && img.naturalWidth > 0) {
    drawDiagramOnTorso(ctx, img, calib, frame, width, height);
  } else {
    // Images still loading — kick off load and skip draw this frame
    loadDiagramImages().catch(() => {});
  }

  return buildHitRegions(frame, width, height);
}

export function hitTestOrgan(hits, x, y) {
  const priority = [
    "appendix",
    "anus",
    "caecum",
    "duodenum",
    "pancreas",
    "salivaryGlands",
    "pharynx",
    "mouth",
    "rectum",
    "stomach",
    "liver",
    "esophagus",
    "smallIntestine",
    "largeIntestine",
    "digestiveSystem",
  ];
  const byId = Object.fromEntries(hits.map((h) => [h.id, h]));
  for (const id of priority) {
    const h = byId[id];
    if (!h) continue;
    if (h.type === "ellipse" && pointInEllipse(x, y, h.cx, h.cy, h.rx, h.ry)) {
      return id;
    }
  }
  return null;
}

/** Subtle torso outline for debug alignment */
export function drawDebugSkeleton(ctx, landmarks, width, height) {
  const pairs = [
    [11, 12],
    [11, 23],
    [12, 24],
    [23, 24],
    [0, 11],
    [0, 12],
  ];
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.fillStyle = "rgba(45,212,191,0.7)";
  ctx.lineWidth = 2;
  for (const [a, b] of pairs) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    if (!pa || !pb) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * width, pa.y * height);
    ctx.lineTo(pb.x * width, pb.y * height);
    ctx.stroke();
  }
  for (const i of [0, 11, 12, 23, 24, 9, 10]) {
    const p = landmarks[i];
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
