/**
 * Cartoon digestive-system overlay positioned in torso landmark space.
 * Landmark indices follow MediaPipe Pose (33 points).
 */

export const ORGAN_FACTS = {
  mouth: {
    zh: "口腔",
    en: "Mouth",
    color: "#f472b6",
    fact: "消化由口腔開始：牙齒咬碎食物，舌頭幫忙攪拌，唾液（口水）開始分解澱粉。",
  },
  esophagus: {
    zh: "食道",
    en: "Esophagus",
    color: "#fb923c",
    fact: "食道係一條肌肉管，用蠕動把食物由咽喉送落胃，即使你倒立都可以運送！",
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
  gallbladder: {
    zh: "膽囊",
    en: "Gallbladder",
    color: "#34d399",
    fact: "膽囊儲存同濃縮膽汁；進食含脂肪食物時會收縮，把膽汁釋放去小腸。",
  },
  pancreas: {
    zh: "胰臟",
    en: "Pancreas",
    color: "#fbbf24",
    fact: "胰臟分泌胰液（含多種消化酶）去小腸，亦分泌胰島素調節血糖。",
  },
  smallIntestine: {
    zh: "小腸",
    en: "Small intestine",
    color: "#fb7185",
    fact: "小腸約 6–7 米長，表面有絨毛大大增加吸收面積，大部分養分喺度被吸收。",
  },
  largeIntestine: {
    zh: "大腸",
    en: "Large intestine",
    color: "#60a5fa",
    fact: "大腸吸收水分同礦物質，把剩餘物質形成糞便；亦有好多腸道細菌幫助發酵。",
  },
  rectum: {
    zh: "直腸／肛門",
    en: "Rectum / Anus",
    color: "#94a3b8",
    fact: "直腸暫存糞便，肛門括約肌控制排出，完成消化系統嘅最後一步。",
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

function avg(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 };
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Build a torso-aligned coordinate frame from pose landmarks.
 * u = right→left across shoulders (image x grows right; person's right shoulder is lower index side visually depending on facing)
 * We use mid-shoulder → mid-hip as "down", and shoulder span as width.
 */
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

  // Unit vectors in normalized image coords
  let downX = midHip.x - midShoulder.x;
  let downY = midHip.y - midShoulder.y;
  const downLen = Math.hypot(downX, downY) || 1;
  downX /= downLen;
  downY /= downLen;

  // Perpendicular "right" in image (rotate down by +90°): (dx,dy) -> (-dy, dx)
  // For a person facing camera, image-right is person's left.
  let rightX = -downY;
  let rightY = downX;
  const rightLen = Math.hypot(rightX, rightY) || 1;
  rightX /= rightLen;
  rightY /= rightLen;

  return {
    origin: midShoulder, // top of torso
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

/** Map local torso coords: u ∈ [-0.5,0.5] across, v ∈ [0,1] shoulder→hip (+ beyond) */
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

function drawCapsule(ctx, x, y, w, h, color, alpha = 0.85) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 2;
  const r = Math.min(w, h) / 2;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + r, y - h / 2);
  ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, r);
  ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, r);
  ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, r);
  ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawEllipse(ctx, x, y, rx, ry, color, alpha = 0.88, rotation = 0) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTube(ctx, points, width, color, alpha = 0.9) {
  if (points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  // soft highlight
  ctx.globalAlpha = alpha * 0.35;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = width * 0.35;
  ctx.stroke();
  ctx.restore();
}

function labelAt(ctx, x, y, text, mirrored) {
  ctx.save();
  if (mirrored) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    x = 0;
    y = 0;
  }
  ctx.font = "600 12px 'PingFang HK', 'Noto Sans TC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const padX = 6;
  const padY = 4;
  const metrics = ctx.measureText(text);
  const tw = metrics.width + padX * 2;
  const th = 18;
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  roundRect(ctx, x - tw / 2, y - th / 2, tw, th, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function pointInEllipse(px, py, cx, cy, rx, ry) {
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const t = clamp01(((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1));
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Draw digestive overlay and return hit-test regions in canvas pixels.
 */
export function drawDigestiveSystem(ctx, landmarks, opts) {
  const {
    width,
    height,
    showLabels = true,
    mirrored = false,
  } = opts;

  const frame = buildTorsoFrame(landmarks);
  if (!frame) return [];

  const hits = [];
  const scale = Math.min(width, height);
  const unit = frame.shoulderW * width; // approx shoulder width in px

  const P = (u, v) => toCanvas(torsoToNorm(frame, u, v), width, height);

  // Mouth — near mouth / below nose
  const mouthNorm = {
    x: frame.mouth.x,
    y: frame.mouth.y + frame.torsoH * 0.02,
  };
  const mouth = toCanvas(mouthNorm, width, height);
  const mouthRx = unit * 0.18;
  const mouthRy = unit * 0.1;
  drawEllipse(ctx, mouth.x, mouth.y, mouthRx, mouthRy, ORGAN_FACTS.mouth.color, 0.9);
  // smile line
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(mouth.x, mouth.y + mouthRy * 0.1, mouthRx * 0.55, mouthRy * 0.35, 0, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
  hits.push({
    id: "mouth",
    type: "ellipse",
    cx: mouth.x,
    cy: mouth.y,
    rx: mouthRx * 1.2,
    ry: mouthRy * 1.4,
  });
  if (showLabels) labelAt(ctx, mouth.x, mouth.y - mouthRy - 12, "口腔 Mouth", mirrored);

  // Esophagus — mouth to upper stomach
  const esoTop = mouth;
  const esoBot = P(0.02, 0.42);
  const esoMid = P(0.01, 0.22);
  const esoPts = [esoTop, esoMid, esoBot];
  const esoW = Math.max(6, unit * 0.08);
  drawTube(ctx, esoPts, esoW, ORGAN_FACTS.esophagus.color, 0.92);
  hits.push({
    id: "esophagus",
    type: "tube",
    points: esoPts,
    threshold: esoW * 1.4,
  });
  if (showLabels) {
    const mid = esoMid;
    labelAt(ctx, mid.x + unit * 0.28, mid.y, "食道 Esophagus", mirrored);
  }

  // Liver — person's right upper abdomen → image left when facing camera
  // In our frame, positive u follows "right" vector which is image-right ≈ person's left.
  // So person's right (liver) is negative u.
  const liver = P(-0.22, 0.48);
  const liverRx = unit * 0.28;
  const liverRy = unit * 0.2;
  const torsoAngle = Math.atan2(frame.down.y, frame.down.x) - Math.PI / 2;
  drawEllipse(ctx, liver.x, liver.y, liverRx, liverRy, ORGAN_FACTS.liver.color, 0.82, torsoAngle * 0.3);
  hits.push({
    id: "liver",
    type: "ellipse",
    cx: liver.x,
    cy: liver.y,
    rx: liverRx * 1.15,
    ry: liverRy * 1.15,
  });
  if (showLabels) labelAt(ctx, liver.x, liver.y - liverRy - 10, "肝臟 Liver", mirrored);

  // Gallbladder — under liver
  const gall = P(-0.12, 0.58);
  const gallR = unit * 0.07;
  drawEllipse(ctx, gall.x, gall.y, gallR, gallR * 1.25, ORGAN_FACTS.gallbladder.color, 0.95);
  hits.push({
    id: "gallbladder",
    type: "ellipse",
    cx: gall.x,
    cy: gall.y,
    rx: gallR * 1.6,
    ry: gallR * 1.8,
  });
  if (showLabels) labelAt(ctx, gall.x - unit * 0.22, gall.y + 4, "膽囊 Gallbladder", mirrored);

  // Stomach — person's left (positive u)
  const stomach = P(0.2, 0.52);
  const stomRx = unit * 0.22;
  const stomRy = unit * 0.18;
  drawEllipse(ctx, stomach.x, stomach.y, stomRx, stomRy, ORGAN_FACTS.stomach.color, 0.88, torsoAngle * 0.2 + 0.25);
  // gastric curve accent
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(stomach.x - stomRx * 0.15, stomach.y, stomRx * 0.45, stomRy * 0.55, 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  hits.push({
    id: "stomach",
    type: "ellipse",
    cx: stomach.x,
    cy: stomach.y,
    rx: stomRx * 1.15,
    ry: stomRy * 1.15,
  });
  if (showLabels) labelAt(ctx, stomach.x, stomach.y - stomRy - 10, "胃 Stomach", mirrored);

  // Pancreas — across mid abdomen
  const pan = P(0.02, 0.62);
  const panW = unit * 0.42;
  const panH = unit * 0.1;
  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.rotate(torsoAngle * 0.15);
  drawCapsule(ctx, 0, 0, panW, panH, ORGAN_FACTS.pancreas.color, 0.88);
  ctx.restore();
  hits.push({
    id: "pancreas",
    type: "ellipse",
    cx: pan.x,
    cy: pan.y,
    rx: panW * 0.55,
    ry: panH * 1.4,
  });
  if (showLabels) labelAt(ctx, pan.x, pan.y + panH + 12, "胰臟 Pancreas", mirrored);

  // Small intestine — coiled loops center abdomen
  const siCenter = P(0.0, 0.82);
  const siR = unit * 0.22;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = ORGAN_FACTS.smallIntestine.color;
  ctx.lineWidth = Math.max(5, unit * 0.07);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= 36; i++) {
    const t = i / 36;
    const ang = t * Math.PI * 5.5;
    const rad = siR * (0.25 + 0.75 * t);
    const lx = siCenter.x + Math.cos(ang) * rad * 0.85;
    const ly = siCenter.y + Math.sin(ang) * rad * 0.7 + (t - 0.5) * unit * 0.05;
    if (i === 0) ctx.moveTo(lx, ly);
    else ctx.lineTo(lx, ly);
  }
  ctx.stroke();
  ctx.restore();
  hits.push({
    id: "smallIntestine",
    type: "ellipse",
    cx: siCenter.x,
    cy: siCenter.y,
    rx: siR * 1.1,
    ry: siR * 0.95,
  });
  if (showLabels) labelAt(ctx, siCenter.x, siCenter.y, "小腸 Small intestine", mirrored);

  // Large intestine — frame around small intestine (ascending / transverse / descending)
  const liPts = [
    P(-0.28, 1.05), // bottom-left (person right ascending start)
    P(-0.28, 0.72),
    P(-0.22, 0.68),
    P(0.22, 0.68), // transverse
    P(0.28, 0.72),
    P(0.28, 1.05), // descending
    P(0.1, 1.12),
    P(0.0, 1.15), // toward rectum
  ];
  const liW = Math.max(8, unit * 0.11);
  drawTube(ctx, liPts, liW, ORGAN_FACTS.largeIntestine.color, 0.88);
  // haustra bumps
  for (let i = 0; i < liPts.length - 1; i++) {
    const a = liPts[i];
    const b = liPts[i + 1];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    drawEllipse(ctx, mx, my, liW * 0.45, liW * 0.35, ORGAN_FACTS.largeIntestine.color, 0.55);
  }
  hits.push({
    id: "largeIntestine",
    type: "tube",
    points: liPts,
    threshold: liW * 1.5,
  });
  if (showLabels) {
    const lab = P(-0.34, 0.88);
    labelAt(ctx, lab.x, lab.y, "大腸 Large intestine", mirrored);
  }

  // Rectum / anus
  const rectum = P(0.0, 1.22);
  const rectRx = unit * 0.08;
  const rectRy = unit * 0.12;
  drawEllipse(ctx, rectum.x, rectum.y, rectRx, rectRy, ORGAN_FACTS.rectum.color, 0.9);
  hits.push({
    id: "rectum",
    type: "ellipse",
    cx: rectum.x,
    cy: rectum.y,
    rx: rectRx * 1.5,
    ry: rectRy * 1.5,
  });
  if (showLabels) labelAt(ctx, rectum.x + unit * 0.28, rectum.y, "直腸 Rectum", mirrored);

  return hits;
}

export function hitTestOrgan(hits, x, y) {
  // Prefer smaller / more specific organs first (reverse draw order-ish)
  const priority = [
    "gallbladder",
    "mouth",
    "pancreas",
    "rectum",
    "stomach",
    "liver",
    "esophagus",
    "smallIntestine",
    "largeIntestine",
  ];
  const byId = Object.fromEntries(hits.map((h) => [h.id, h]));
  for (const id of priority) {
    const h = byId[id];
    if (!h) continue;
    if (h.type === "ellipse") {
      if (pointInEllipse(x, y, h.cx, h.cy, h.rx, h.ry)) return id;
    } else if (h.type === "tube") {
      for (let i = 0; i < h.points.length - 1; i++) {
        const a = h.points[i];
        const b = h.points[i + 1];
        if (distToSegment(x, y, a.x, a.y, b.x, b.y) <= h.threshold) return id;
      }
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
