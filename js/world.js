/* ============================================================
   world.js — the village of Petalbrook.
   Everything procedural: no image files, no model downloads.
   ============================================================ */

import * as THREE from "three";
import { SPOTS } from "./data.js";

const WORLD_SIZE = 64; // world spans -32..32 on x and z
const PX = 1024 / WORLD_SIZE; // ground-canvas pixels per world unit

/* ---------- palette (world side) ---------- */
const C = {
  sky: 0xaee2fb,
  grassA: 0x7dbf63,
  path: 0xd9b078,
  pathEdge: 0xc09a5c,
  wood: 0x9a6838,
  woodLight: 0xb07a45,
  cream: 0xf7f0dd,
  roofRose: 0xe88ba4,
  roofTerra: 0xc96f50,
  stone: 0xe9e2d0,
  water: 0x7cc7e8,
  waterDeep: 0x5aa9cf,
  leaf1: 0x6fae59,
  leaf2: 0x86c96c,
  leafAutumn: 0xd9a75a,
  trunk: 0x8a5a34,
  gold: 0xf5c84c,
  rose: 0xe97fa2,
  white: 0xfffaf0,
};

/* ---------- small helpers ---------- */
const lam = (color, opts = {}) =>
  new THREE.MeshLambertMaterial({ color, ...opts });

function mesh(geo, mat, x = 0, y = 0, z = 0, rot = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (rot) m.rotation.y = rot;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* triangular prism = gable roof */
function prismRoof(width, height, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function tree(x, z, scale = 1, leafColor = C.leaf1) {
  const g = new THREE.Group();
  const trunkH = 1.5 * scale;
  g.add(
    mesh(
      new THREE.CylinderGeometry(0.22 * scale, 0.3 * scale, trunkH, 6),
      lam(C.trunk),
      0,
      trunkH / 2,
      0
    )
  );
  const blob = (r, dx, dy, dz) =>
    mesh(
      new THREE.IcosahedronGeometry(r, 0),
      lam(leafColor, { flatShading: true }),
      dx,
      trunkH + dy,
      dz
    );
  g.add(blob(1.05 * scale, 0, 0.55 * scale, 0));
  g.add(blob(0.75 * scale, 0.55 * scale, 0.05 * scale, 0.25 * scale));
  g.add(blob(0.7 * scale, -0.5 * scale, 0.1 * scale, -0.3 * scale));
  g.position.set(x, 0, z);
  g.rotation.y = Math.random() * Math.PI;
  return g;
}

function flowerInstanced(count) {
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.42, 4);
  stemGeo.translate(0, 0.21, 0);
  const headGeo = new THREE.IcosahedronGeometry(0.14, 0);
  headGeo.translate(0, 0.5, 0);
  const stems = new THREE.InstancedMesh(stemGeo, lam(0x5c9a4a), count);
  const heads = new THREE.InstancedMesh(headGeo, lam(0xffffff), count);
  const colors = [new THREE.Color(C.rose), new THREE.Color(C.gold), new THREE.Color(C.white), new THREE.Color(0xc9a7e8)];
  const dummy = new THREE.Object3D();
  // scatter inside the village but off the paths
  const beds = [
    [-9, -4], [9, -2.5], [-12, 7], [10.5, 8.5], [0, 1.5],
    [-5, 11], [6, 9.5], [-3, -10], [3, -9], [13, 1], [-15, 0],
  ];
  let placed = 0;
  for (let i = 0; i < count; i++) {
    const bed = beds[i % beds.length];
    const a = Math.random() * Math.PI * 2;
    const r = 0.6 + Math.random() * 2.6;
    const x = bed[0] + Math.cos(a) * r;
    const z = bed[1] + Math.sin(a) * r;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.scale.setScalar(0.8 + Math.random() * 0.6);
    dummy.updateMatrix();
    stems.setMatrixAt(i, dummy.matrix);
    heads.setMatrixAt(i, dummy.matrix);
    heads.setColorAt(i, colors[i % colors.length]);
    placed++;
  }
  stems.count = placed;
  heads.count = placed;
  stems.castShadow = heads.castShadow = true;
  return [stems, heads];
}

function fenceLine(x1, z1, x2, z2) {
  const g = new THREE.Group();
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const posts = Math.max(2, Math.round(len / 1.4));
  const postGeo = new THREE.BoxGeometry(0.14, 0.85, 0.14);
  const railGeo = new THREE.BoxGeometry(len, 0.09, 0.07);
  for (let i = 0; i <= posts; i++) {
    const t = i / posts;
    g.add(mesh(postGeo, lam(C.woodLight), x1 + dx * t, 0.42, z1 + dz * t));
  }
  for (const h of [0.35, 0.62]) {
    const r = mesh(railGeo, lam(C.wood), (x1 + x2) / 2, h, (z1 + z2) / 2);
    r.rotation.y = -Math.atan2(dz, dx);
    g.add(r);
  }
  return g;
}

/* ---------- ground texture (paths, grass, pond sand) ---------- */
function groundTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1024;
  const g = cv.getContext("2d");
  const px = (x) => (x + WORLD_SIZE / 2) * PX;
  const pz = (z) => (WORLD_SIZE / 2 - z) * PX;

  g.fillStyle = "#7dbf63";
  g.fillRect(0, 0, 1024, 1024);

  // grass tone blotches
  for (let i = 0; i < 260; i++) {
    g.fillStyle = Math.random() > 0.5 ? "rgba(134,201,108,0.5)" : "rgba(110,180,88,0.45)";
    const r = 14 + Math.random() * 60;
    g.beginPath();
    g.ellipse(Math.random() * 1024, Math.random() * 1024, r, r * 0.55, Math.random() * 3, 0, 7);
    g.fill();
  }

  // pond sand ring
  g.fillStyle = "#e5cf9a";
  g.beginPath();
  g.arc(px(-7), pz(15), 4.6 * PX, 0, 7);
  g.fill();

  // paths
  const stroke = (pts, width) => {
    g.strokeStyle = "#c09a5c";
    g.lineWidth = width + 7;
    g.lineCap = g.lineJoin = "round";
    g.beginPath();
    g.moveTo(px(pts[0][0]), pz(pts[0][1]));
    for (const p of pts.slice(1)) g.lineTo(px(p[0]), pz(p[1]));
    g.stroke();
    g.strokeStyle = "#d9b078";
    g.lineWidth = width;
    g.stroke();
  };
  stroke([[0, 19.5], [0, 10], [0, 1.5]], 26); // spawn to plaza
  stroke([[0, 1.5], [-3.5, -2], [-9, -4.1]], 24); // to chapel
  stroke([[0, 1.5], [4, -1.5], [9, -2.6]], 24); // to memory garden
  stroke([[0, 1.5], [0, -5], [0, -8.3]], 22); // to clock tower
  stroke([[0, 5], [-6, 7], [-9, 7]], 20); // to wishing tree
  stroke([[0, 5], [5, 7], [7.6, 8.5]], 20); // to photo bench
  stroke([[0, 12], [1.4, 14], [2.8, 14.5]], 14); // mailbox spur
  g.fillStyle = "#d9b078";
  g.beginPath(); g.arc(px(0), pz(1.5), 2.6 * PX, 0, 7); g.fill();
  g.beginPath(); g.arc(px(0), pz(19.2), 1.8 * PX, 0, 7); g.fill();

  // speckles: tiny grass blades
  g.strokeStyle = "rgba(70,130,55,0.5)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 1024, y = Math.random() * 1024;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() - 0.5) * 5, y - 4 - Math.random() * 5);
    g.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ---------- buildings ---------- */
function buildChapel() {
  const g = new THREE.Group();
  // body
  g.add(mesh(new THREE.BoxGeometry(6, 3.6, 5), lam(C.cream), 0, 1.8, 0));
  // gable roof
  const roof = mesh(prismRoof(6.6, 2.2, 5.6), lam(C.roofRose));
  roof.position.y = 3.6;
  g.add(roof);
  // tower + spire at the FRONT (over the entrance), crowned with a proper cross —
  // dark slate spire so the silhouette reads "church" against the rose roof and sky
  g.add(mesh(new THREE.BoxGeometry(1.6, 5.2, 1.6), lam(C.cream), 0, 2.6, 2.2));
  g.add(mesh(new THREE.ConeGeometry(1.3, 1.9, 4), lam(0x46506a), 0, 6.15, 2.2, Math.PI / 4));
  const crossGold = lam(C.gold);
  g.add(mesh(new THREE.BoxGeometry(0.18, 1.4, 0.18), crossGold, 0, 7.85, 2.2));
  g.add(mesh(new THREE.BoxGeometry(0.95, 0.18, 0.18), crossGold, 0, 8.2, 2.2));
  // door (wood, arched top) set into the tower base
  g.add(mesh(new THREE.BoxGeometry(1.3, 1.9, 0.16), lam(C.woodLight), 0, 0.95, 3.02));
  const arch = mesh(new THREE.CircleGeometry(0.65, 16, 0, Math.PI), lam(C.woodLight), 0, 1.9, 3.03);
  g.add(arch);
  // big gold cross on the tower face above the door — the follow camera looks down,
  // so this is the cross you actually see walking up the path (spire cross is the silhouette)
  g.add(mesh(new THREE.BoxGeometry(0.18, 1.3, 0.14), crossGold, 0, 2.95, 3.06));
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.18, 0.14), crossGold, 0, 3.2, 3.06));
  // windows (gold glass)
  for (const wx of [-2, 2]) {
    g.add(mesh(new THREE.BoxGeometry(0.8, 1.1, 0.14), lam(C.gold), wx, 1.9, 2.53));
    g.add(mesh(new THREE.BoxGeometry(0.14, 1.1, 0.16), lam(C.cream), wx, 1.9, 2.54));
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.14, 0.16), lam(C.cream), wx, 1.9, 2.54));
  }
  // rose window on the tower face, above the door
  g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16), lam(C.rose), 0, 4.4, 3.06).rotateX(Math.PI / 2));
  // flower arch in front of the door
  const archTorus = mesh(new THREE.TorusGeometry(1.5, 0.12, 6, 24, Math.PI), lam(0x5c9a4a), 0, 0, 3.4);
  g.add(archTorus);
  const bloomSpots = [-1.4, -0.9, -0.4, 0.4, 0.9, 1.4];
  bloomSpots.forEach((bx, i) => {
    const t = Math.acos(-bx / 1.5);
    const by = Math.sin(t) * 1.5;
    g.add(mesh(new THREE.IcosahedronGeometry(0.16, 0), lam(i % 2 ? C.rose : C.white, { flatShading: true }), bx, by, 3.4));
  });
  // side hedges
  for (const hx of [-3.4, 3.4]) {
    g.add(mesh(new THREE.BoxGeometry(0.7, 0.7, 4.4), lam(0x5c9a4a), hx, 0.35, 0));
  }
  return g;
}

function buildMemoryGarden() {
  const g = new THREE.Group();
  // round stone patio — the garden is walkable, only the tree blocks
  g.add(mesh(new THREE.CylinderGeometry(2.7, 2.9, 0.12, 20), lam(C.stone), 0, 0.06, 0));
  g.add(mesh(new THREE.TorusGeometry(2.72, 0.09, 6, 24), lam(0xb8a99a), 0, 0.12, 0).rotateX(Math.PI / 2));
  // memory tree — blossom canopy with polaroids of the couple hanging from it
  g.add(mesh(new THREE.CylinderGeometry(0.26, 0.4, 2.6, 8), lam(C.trunk), 0, 1.3, 0));
  const bloom = lam(0xf0b8cd, { flatShading: true });
  g.add(mesh(new THREE.IcosahedronGeometry(1.5, 1), bloom, 0, 3.2, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(1.0, 1), bloom, 0.9, 2.6, 0.5));
  g.add(mesh(new THREE.IcosahedronGeometry(0.95, 1), bloom, -0.9, 2.7, -0.4));
  // hanging photo frames
  const frameMat = lam(0xfdf3dc, { side: THREE.DoubleSide });
  const photoMat = lam(0xf9c6cf, { side: THREE.DoubleSide });
  for (const [px, py, pz] of [[0.9, 2.2, 0.5], [-1.0, 2.35, -0.4], [0.3, 1.9, 1.05], [-0.4, 2.5, 0.9], [1.15, 2.7, -0.3], [-0.95, 1.85, 0.55]]) {
    g.add(mesh(new THREE.BoxGeometry(0.03, 0.34, 0.03), lam(C.trunk), px, py + 0.2, pz));
    g.add(mesh(new THREE.BoxGeometry(0.3, 0.34, 0.03), frameMat, px, py, pz));
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.2, 0.035), photoMat, px, py + 0.02, pz));
  }
  // heart-shaped tulip ring on the patio edge
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    const hx = 0.16 * 16 * Math.sin(t) ** 3;
    const hz = 0.16 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const color = [C.rose, C.gold, 0xffffff][i % 3];
    g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5), lam(0x5c9a4a), hx * 0.82, 0.37, hz * 0.82 - 0.4));
    g.add(mesh(new THREE.IcosahedronGeometry(0.12, 0), lam(color, { flatShading: true }), hx * 0.82, 0.68, hz * 0.82 - 0.4));
  }
  // entrance arch (south) with vine knots + two lanterns flanking it
  g.add(mesh(new THREE.TorusGeometry(1.35, 0.1, 6, 20, Math.PI), lam(C.wood), 0, 0.02, 3.3));
  for (const vx of [-0.9, -0.3, 0.3, 0.9]) {
    g.add(mesh(new THREE.IcosahedronGeometry(0.12, 0), lam(0x5c9a4a, { flatShading: true }), vx, 1.35 - (vx * vx) * 0.35, 3.3));
  }
  for (const lx of [-1.9, 1.9]) {
    g.add(mesh(new THREE.BoxGeometry(0.09, 1.2, 0.09), lam(C.wood), lx, 0.6, 3.0));
    g.add(mesh(new THREE.BoxGeometry(0.24, 0.3, 0.24), lam(C.gold), lx, 1.32, 3.0));
    g.add(mesh(new THREE.ConeGeometry(0.2, 0.18, 4), lam(C.wood), lx, 1.55, 3.0));
  }
  // stone bench facing the tree
  g.add(mesh(new THREE.BoxGeometry(1.7, 0.16, 0.5), lam(C.stone), 0, 0.42, -2.2));
  for (const bx of [-0.65, 0.65]) {
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.36, 0.42), lam(0xb8a99a), bx, 0.18, -2.2));
  }
  return g;
}

function clockFaceTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d");
  g.fillStyle = "#fffaf0";
  g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
  g.strokeStyle = "#b07a45"; g.lineWidth = 14;
  g.stroke();
  g.strokeStyle = "#4a3222";
  g.lineWidth = 8; g.lineCap = "round";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.beginPath();
    g.moveTo(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92);
    g.lineTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104);
    g.stroke();
  }
  // hands at 9:00 — the ceremony hour
  g.lineWidth = 12;
  g.beginPath(); g.moveTo(128, 128); g.lineTo(128 - 62, 128); g.stroke();
  g.lineWidth = 9;
  g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 128 - 78); g.stroke();
  g.fillStyle = "#e97fa2";
  g.beginPath(); g.arc(128, 128, 10, 0, 7); g.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildClockTower() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(3, 7.2, 3), lam(C.stone), 0, 3.6, 0));
  const roof = mesh(prismRoof(3.5, 1.6, 3.5), lam(C.roofRose));
  roof.position.y = 7.2;
  g.add(roof);
  g.add(mesh(new THREE.SphereGeometry(0.14, 8, 8), lam(C.gold), 0, 9.1, 0));
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({ map: clockFaceTexture() })
  );
  face.position.set(0, 5.6, 1.56);
  g.add(face);
  // corner trims — sit proud of the wall (coplanar faces z-fight/blink)
  for (const [cx, cz] of [[-1.32, 1.32], [1.32, 1.32], [-1.32, -1.32], [1.32, -1.32]]) {
    g.add(mesh(new THREE.BoxGeometry(0.44, 7.4, 0.44), lam(C.woodLight), cx, 3.6, cz));
  }
  return g;
}

function buildMailbox() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(0.16, 1.1, 0.16), lam(C.wood), 0, 0.55, 0));
  const box = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.85, 12, 1, false, 0, Math.PI), lam(C.roofRose));
  box.rotation.z = Math.PI / 2;
  box.rotation.y = Math.PI / 2;
  box.position.set(0, 1.25, 0);
  g.add(box);
  g.add(mesh(new THREE.BoxGeometry(0.85, 0.02, 0.64), lam(C.rose), 0, 1.25, 0));
  // a letter peeking out — this is where guests write
  const letter = mesh(new THREE.BoxGeometry(0.42, 0.03, 0.26), lam(C.white), 0.05, 1.34, 0.22);
  letter.rotation.y = -0.35;
  letter.rotation.z = 0.08;
  g.add(letter);
  // little flag
  g.add(mesh(new THREE.BoxGeometry(0.05, 0.4, 0.24), lam(C.gold), 0.42, 1.55, 0));
  // wooden sign so everyone knows what this is
  g.add(mesh(new THREE.BoxGeometry(0.09, 0.8, 0.09), lam(C.wood), -0.75, 0.4, 0.15));
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.38, 0.06),
    new THREE.MeshLambertMaterial({ map: rsvpPlateTexture() })
  );
  plate.position.set(-0.75, 0.95, 0.15);
  g.add(plate);
  return g;
}

function rsvpPlateTexture() {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 128;
  const g = cv.getContext("2d");
  g.fillStyle = "#fdf3dc";
  g.fillRect(0, 0, 256, 128);
  g.strokeStyle = "#b07a45";
  g.lineWidth = 10;
  g.strokeRect(5, 5, 246, 118);
  g.fillStyle = "#d15e84";
  g.font = "700 64px 'Pixelify Sans', 'Trebuchet MS', sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("RSVP", 128, 70);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* floating landmark name labels (always visible, fade with distance) */
function labelPlate(text) {
  const cv = document.createElement("canvas");
  const state = { text, cv };
  const draw = () => {
    const probe = cv.getContext("2d");
    const font = "700 46px 'Pixelify Sans', 'Trebuchet MS', sans-serif";
    probe.font = font;
    const w = Math.ceil(probe.measureText(state.text).width) + 64;
    cv.width = w;
    cv.height = 84;
    const g = cv.getContext("2d");
    const plate = (x, y, pw, ph, r, color) => {
      g.fillStyle = color;
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, pw, ph, r);
      else g.rect(x, y, pw, ph);
      g.fill();
    };
    plate(0, 0, w, 84, 20, "#5b3a1f");
    plate(5, 5, w - 10, 74, 16, "#b07a45");
    plate(12, 12, w - 24, 60, 11, "#fdf3dc");
    g.fillStyle = "#4a3222";
    g.font = font;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(state.text, w / 2, 44);
    return w;
  };
  state.w = draw();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  state.tex = tex;
  state.redraw = () => {
    state.w = draw();
    tex.needsUpdate = true;
    state.spr.scale.set(state.w * 0.0125, 84 * 0.0125, 1);
  };
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  spr.scale.set(state.w * 0.0125, 84 * 0.0125, 1);
  spr.renderOrder = 999;
  state.spr = spr;
  return state;
}

function heartSpriteTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d");
  g.fillStyle = "#d15e84";
  g.strokeStyle = "#5b3a1f";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(32, 54);
  g.bezierCurveTo(6, 36, 8, 14, 32, 22);
  g.bezierCurveTo(56, 14, 58, 36, 32, 54);
  g.fill();
  g.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildWishingTree() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.72, 3.4, 7), lam(C.trunk), 0, 1.7, 0));
  const canopy = [
    [2.1, 0, 2.6, 0],
    [1.5, 1.3, 3.6, 0.5],
    [1.4, -1.2, 3.4, -0.4],
    [1.2, 0.2, 4.3, 1.0],
  ].map(([r, dx, dy, dz]) =>
    mesh(new THREE.IcosahedronGeometry(r, 1), lam(C.leaf2, { flatShading: true }), dx, dy, dz)
  );
  canopy.forEach((c) => g.add(c));
  // hanging paper wishes
  const tagGeo = new THREE.PlaneGeometry(0.34, 0.22);
  const tagMat = lam(0xfdf3dc, { side: THREE.DoubleSide });
  g.userData.tags = [];
  for (let i = 0; i < 9; i++) {
    const tag = new THREE.Mesh(tagGeo, tagMat);
    const a = Math.random() * Math.PI * 2;
    const r = 0.8 + Math.random() * 1.6;
    tag.position.set(Math.cos(a) * r, 2.1 + Math.random() * 1.5, Math.sin(a) * r);
    tag.rotation.y = Math.random() * Math.PI;
    g.add(tag);
    g.userData.tags.push(tag);
  }
  // hanging hearts — this is the love tree, after all
  const heartTex = heartSpriteTexture();
  // deterministic spread so hearts always ring the canopy edge, some dangling low
  const heartSpots = [
    [2.3, 2.6, 0.4], [-2.4, 3.0, -0.3], [1.7, 1.8, 1.9], [-1.6, 2.2, -2.1],
    [0.6, 1.4, 2.5], [-0.5, 3.4, 2.3], [2.5, 3.6, -1.2], [-2.2, 1.6, 1.4],
  ];
  for (const [hx, hy, hz] of heartSpots) {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true }));
    spr.position.set(hx, hy, hz);
    spr.scale.setScalar(0.52);
    g.add(spr);
  }
  // little sign at base — kept outside the canopy (leaves reach ~2.1 from the trunk)
  const sign = new THREE.Group();
  sign.position.set(2.45, 0, 0.95);
  sign.rotation.y = Math.PI * 0.28;
  sign.add(mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), lam(C.wood), 0, 0.45, 0));
  const plate = mesh(new THREE.BoxGeometry(0.9, 0.5, 0.07), lam(C.woodLight), 0, 1.05, 0);
  sign.add(plate);
  const heart = mesh(new THREE.IcosahedronGeometry(0.11, 0), lam(C.rose, { flatShading: true }), 0, 1.08, 0.06);
  sign.add(heart);
  g.add(sign);
  return g;
}

function polaroidTexture(caption, tint) {
  const cv = document.createElement("canvas");
  cv.width = 128; cv.height = 128;
  const g = cv.getContext("2d");
  g.fillStyle = tint;
  g.fillRect(0, 0, 128, 128);
  // sun
  g.fillStyle = "rgba(255,255,255,0.75)";
  g.beginPath(); g.arc(96, 32, 16, 0, 7); g.fill();
  // hills
  g.fillStyle = "rgba(111,174,89,0.85)";
  g.beginPath(); g.ellipse(40, 110, 46, 26, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(96, 116, 42, 22, 0, 0, 7); g.fill();
  // two little figures + heart
  g.fillStyle = "#4a3222";
  g.beginPath(); g.arc(52, 84, 8, 0, 7); g.fill();
  g.fillRect(44, 88, 16, 22);
  g.beginPath(); g.arc(76, 86, 8, 0, 7); g.fill();
  g.fillRect(68, 90, 16, 20);
  g.fillStyle = "#e97fa2";
  g.font = "22px sans-serif";
  g.fillText("♥", 60, 62);
  g.fillStyle = "#4a3222";
  g.font = "italic 12px serif";
  g.textAlign = "center";
  g.fillText(caption, 64, 122);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildPhotoBench() {
  const g = new THREE.Group();
  // bench — offset left, kept clear of the easel
  const bench = new THREE.Group();
  bench.position.set(-0.8, 0, 0.1);
  bench.add(mesh(new THREE.BoxGeometry(2.2, 0.14, 0.7), lam(C.woodLight), 0, 0.55, 0));
  for (const lx of [-0.9, 0.9]) {
    bench.add(mesh(new THREE.BoxGeometry(0.16, 0.55, 0.6), lam(C.wood), lx, 0.27, 0));
  }
  bench.add(mesh(new THREE.BoxGeometry(2.2, 0.5, 0.12), lam(C.wood), 0, 0.95, -0.3));
  g.add(bench);
  // easel — proper A-frame: front leg forward, two rear legs splayed back,
  // all meeting at the apex so nothing stabs through the canvas or the bench
  const easel = new THREE.Group();
  easel.position.set(1.5, 0, -0.2);
  easel.rotation.y = -0.3;
  const apex = { y: 1.9 };
  const legFromTo = (x, z) => {
    const len = Math.hypot(apex.y, z);
    const l = mesh(new THREE.BoxGeometry(0.08, len, 0.08), lam(C.wood), x, apex.y / 2, z / 2);
    l.rotation.x = Math.atan2(-z, apex.y);
    return l;
  };
  easel.add(legFromTo(0, 0.62)); // front leg
  easel.add(legFromTo(-0.4, -0.55)); // rear left
  easel.add(legFromTo(0.4, -0.55)); // rear right
  easel.add(mesh(new THREE.BoxGeometry(0.86, 0.07, 0.07), lam(C.wood), 0, 0.62, -0.28)); // crossbar
  const canvas = mesh(
    new THREE.BoxGeometry(1.05, 1.05, 0.06),
    new THREE.MeshLambertMaterial({ map: polaroidTexture("our bench", "#f9c6cf") }),
    0, 1.26, 0.29
  );
  canvas.rotation.x = -0.32; // parallel to the front leg it rests on — never clips it
  easel.add(canvas);
  g.add(easel);
  return g;
}

/* ---------- "!" speech bubble markers ---------- */
function buildMarker() {
  const g = new THREE.Group();
  const bubble = mesh(new THREE.SphereGeometry(0.55, 12, 10), lam(C.white));
  bubble.castShadow = false;
  bubble.scale.set(1, 0.82, 1);
  g.add(bubble);
  // exclamation mark — deep rose so it pops against sky and grass
  const alertMat = lam(0xd15e84);
  const bar = mesh(new THREE.BoxGeometry(0.14, 0.4, 0.07), alertMat, 0, 0.08, 0.52);
  bar.castShadow = false;
  const dot = mesh(new THREE.SphereGeometry(0.075, 6, 6), alertMat, 0, -0.24, 0.52);
  dot.castShadow = false;
  g.add(bar, dot);
  // little tail
  const tail = mesh(new THREE.ConeGeometry(0.16, 0.28, 4), lam(C.white), 0, -0.54, 0);
  tail.rotation.x = Math.PI;
  tail.castShadow = false;
  g.add(tail);
  return g;
}

/* ============================================================
   MAIN BUILDER
   ============================================================ */
export function createWorld(scene) {
  const colliders = []; // {x, z, r}
  const markers = new Map(); // spot id -> marker group
  const anim = { tags: [], butterflies: [], petals: null, clouds: [], labels: [] };
  const addCollider = (x, z, r) => colliders.push({ x, z, r });

  /* lights & sky */
  scene.background = new THREE.Color(C.sky);
  scene.fog = new THREE.FogExp2(0xb8dff2, 0.014);
  scene.add(new THREE.HemisphereLight(0xcdeaff, 0xa8cf8e, 0.85));
  const sun = new THREE.DirectionalLight(0xfff2d0, 1.35);
  sun.position.set(18, 28, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -26;
  sun.shadow.camera.right = 26;
  sun.shadow.camera.top = 26;
  sun.shadow.camera.bottom = -26;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);

  /* ground */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
    new THREE.MeshLambertMaterial({ map: groundTexture() })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* pond (south-west) */
  const pond = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 26),
    new THREE.MeshLambertMaterial({ color: C.water })
  );
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(-7, 0.02, 15);
  scene.add(pond);
  const deep = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 20),
    new THREE.MeshLambertMaterial({ color: C.waterDeep })
  );
  deep.rotation.x = -Math.PI / 2;
  deep.position.set(-7.4, 0.03, 15.4);
  scene.add(deep);
  for (let i = 0; i < 5; i++) {
    const pad = mesh(new THREE.CircleGeometry(0.28 + Math.random() * 0.2, 7), lam(0x5c9a4a), -7 + (Math.random() - 0.5) * 4, 0.05, 15 + (Math.random() - 0.5) * 4);
    pad.rotation.x = -Math.PI / 2;
    pad.castShadow = false;
    scene.add(pad);
  }
  addCollider(-7, 15, 3.8);

  /* buildings at data.js coordinates */
  const chapel = buildChapel();
  chapel.position.set(-9, 0, -7.5);
  chapel.rotation.y = Math.PI * 0.12;
  scene.add(chapel);
  addCollider(-9, -7.5, 3.6);

  const house = buildMemoryGarden();
  house.position.set(9, 0, -6);
  house.rotation.y = -Math.PI * 0.14;
  scene.add(house);
  // the garden itself is walkable — only the memory tree blocks
  addCollider(9, -6, 0.9);

  const tower = buildClockTower();
  tower.position.set(0, 0, -11.5);
  scene.add(tower);
  addCollider(0, -11.5, 2.2);

  const mailbox = buildMailbox();
  mailbox.position.set(2.8, 0, 14.5);
  mailbox.rotation.y = Math.PI * 0.8;
  scene.add(mailbox);
  addCollider(2.8, 14.5, 0.5);

  const wishingTree = buildWishingTree();
  wishingTree.position.set(-12, 0, 7);
  scene.add(wishingTree);
  addCollider(-12, 7, 1.1);
  anim.tags = wishingTree.userData.tags;

  const bench = buildPhotoBench();
  bench.position.set(10.5, 0, 8.5);
  bench.rotation.y = -Math.PI * 0.3;
  scene.add(bench);
  addCollider(10.5, 8.5, 1.2);

  /* welcome sign near spawn */
  const sign = new THREE.Group();
  sign.add(mesh(new THREE.BoxGeometry(0.14, 1.5, 0.14), lam(C.wood), 0, 0.75, 0));
  const board = mesh(new THREE.BoxGeometry(1.7, 0.8, 0.1), lam(C.woodLight), 0, 1.5, 0);
  sign.add(board);
  sign.add(mesh(new THREE.IcosahedronGeometry(0.13, 0), lam(C.rose, { flatShading: true }), 0.45, 1.62, 0.08));
  sign.add(mesh(new THREE.IcosahedronGeometry(0.1, 0), lam(C.gold, { flatShading: true }), -0.4, 1.45, 0.08));
  sign.position.set(-1.6, 0, 17.5);
  sign.rotation.y = 0.4;
  scene.add(sign);
  addCollider(-1.6, 17.5, 0.5);

  /* trees around the edge + sprinkled inside */
  const treeSpots = [
    [-24, -18, 1.4, C.leaf1], [-19, -24, 1.2, C.leafAutumn], [-6, -24, 1.3, C.leaf1],
    [7, -24, 1.1, C.leaf2], [19, -20, 1.4, C.leafAutumn], [25, -12, 1.2, C.leaf1],
    [26, 2, 1.3, C.leaf2], [24, 14, 1.4, C.leaf1], [18, 22, 1.2, C.leafAutumn],
    [8, 26, 1.3, C.leaf1], [-4, 26, 1.1, C.leaf2], [-14, 25, 1.4, C.leaf1],
    [-24, 18, 1.3, C.leafAutumn], [-26, 6, 1.2, C.leaf1], [-26, -6, 1.3, C.leaf2],
    [-7, -20, 0.9, C.leaf2], [16, 4, 0.9, C.leaf1], [-19, -2, 1.0, C.leaf2],
  ];
  for (const [x, z, s, c] of treeSpots) {
    scene.add(tree(x, z, s, c));
    addCollider(x, z, 0.4 * s + 0.15);
  }

  /* fences framing the world */
  const F = 27;
  scene.add(fenceLine(-F, -F, F, -F));
  scene.add(fenceLine(-F, F, F, F));
  scene.add(fenceLine(-F, -F, -F, F));
  scene.add(fenceLine(F, -F, F, F));
  // (the old farmhouse yard fence is gone — it cut across the memory garden entrance)

  /* flowers */
  const [stems, heads] = flowerInstanced(140);
  scene.add(stems, heads);

  /* clouds */
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  for (let i = 0; i < 5; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 3);
    for (let p = 0; p < puffs; p++) {
      const s = 1.2 + Math.random() * 1.6;
      const puff = mesh(new THREE.SphereGeometry(s, 7, 6), cloudMat, p * s * 1.1, Math.random() * 0.4, Math.random() * s);
      puff.castShadow = false;
      puff.receiveShadow = false;
      cloud.add(puff);
    }
    cloud.position.set(-30 + Math.random() * 60, 16 + Math.random() * 6, -24 + Math.random() * 48);
    cloud.userData.speed = 0.25 + Math.random() * 0.35;
    anim.clouds.push(cloud);
    scene.add(cloud);
  }

  /* falling petals — soft round sprites */
  const petalCv = document.createElement("canvas");
  petalCv.width = petalCv.height = 32;
  const pg = petalCv.getContext("2d");
  const grad = pg.createRadialGradient(16, 16, 2, 16, 16, 15);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.6, "rgba(252,205,222,0.95)");
  grad.addColorStop(1, "rgba(252,205,222,0)");
  pg.fillStyle = grad;
  pg.beginPath(); pg.arc(16, 16, 15, 0, 7); pg.fill();
  const petalTex = new THREE.CanvasTexture(petalCv);

  const PETALS = 170;
  const positions = new Float32Array(PETALS * 3);
  const seeds = new Float32Array(PETALS);
  for (let i = 0; i < PETALS; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = Math.random() * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    seeds[i] = Math.random() * 100;
  }
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const petalMat = new THREE.PointsMaterial({
    size: 0.22,
    map: petalTex,
    transparent: true,
    depthWrite: false,
    color: 0xffc9dc,
    sizeAttenuation: true,
  });
  const petals = new THREE.Points(petalGeo, petalMat);
  anim.petals = { points: petals, seeds };
  scene.add(petals);

  /* butterflies */
  const wingGeo = new THREE.PlaneGeometry(0.22, 0.3);
  const wingMats = [lam(0xf5c84c, { side: THREE.DoubleSide }), lam(0xe97fa2, { side: THREE.DoubleSide }), lam(0xffffff, { side: THREE.DoubleSide })];
  for (let i = 0; i < 6; i++) {
    const bf = new THREE.Group();
    const wl = new THREE.Mesh(wingGeo, wingMats[i % 3]);
    const wr = new THREE.Mesh(wingGeo, wingMats[i % 3]);
    wl.position.x = -0.1; wr.position.x = 0.1;
    bf.add(wl, wr);
    const home = [[-9, -3], [9, -2], [-12, 7], [10.5, 8.5], [0, 1.5], [-7, 15]][i];
    bf.userData = {
      wl, wr,
      home,
      phase: Math.random() * 100,
      speed: 0.5 + Math.random() * 0.4,
      flap: 8 + Math.random() * 4,
    };
    anim.butterflies.push(bf);
    scene.add(bf);
  }

  /* interaction markers — positioned AT their spot (never at origin), lifted just
     above the landmark so the bubble is where the camera actually looks */
  const MARKER_SPOT = {
    chapel: { y: 3.1, dz: 3.6 }, // in front of the entrance tower, above the flower arch
    house: { y: 4.0 }, // floats over the memory tree canopy
    clock: { y: 3.6, dz: 2.4 }, // south of the tower column
    mailbox: { y: 2.4 },
    gallery: { y: 3.2 },
    wish: { y: 6.2 },
    sign: { y: 2.6 },
  };
  for (const [id, cfg] of Object.entries(MARKER_SPOT)) {
    const spot = SPOTS.find((s) => s.id === id);
    const m = buildMarker();
    m.visible = false;
    m.userData.baseY = cfg.y;
    m.position.set(spot.pos[0] + (cfg.dx || 0), cfg.y, spot.pos[1] + (cfg.dz || 0));
    markers.set(id, m);
    scene.add(m);
  }

  /* permanent name labels — fixed height above the ground for every landmark,
     drawn over geometry so tall buildings (chapel spire) never hide them */
  for (const spot of SPOTS) {
    const lab = labelPlate(spot.menu);
    lab.spr.position.set(spot.pos[0], 3.4, spot.pos[1]);
    scene.add(lab.spr);
    anim.labels.push({ spr: lab.spr, redraw: lab.redraw, x: spot.pos[0], z: spot.pos[1], r: spot.r });
  }
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      for (const l of anim.labels) l.redraw();
    });
  }

  /* ---------- per-frame world life ---------- */
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function update(dt, t, playerPos, camera) {
    // petals fall & sway
    if (anim.petals && !reduced) {
      const pos = anim.petals.points.geometry.attributes.position;
      for (let i = 0; i < PETALS; i++) {
        let y = pos.getY(i) - dt * 0.55;
        if (y < 0.1) y = 12 + Math.random() * 3;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(t * 0.9 + anim.petals.seeds[i]) * dt * 0.35);
      }
      pos.needsUpdate = true;
    }
    // butterflies wander
    for (const bf of anim.butterflies) {
      const { home, phase, speed, flap } = bf.userData;
      const s = t * speed + phase;
      bf.position.set(
        home[0] + Math.cos(s * 0.9) * 2.4,
        1.1 + Math.sin(s * 1.7) * 0.45,
        home[1] + Math.sin(s * 1.3) * 2.4
      );
      bf.rotation.y = -s * 0.9;
      bf.userData.wl.rotation.y = Math.sin(s * flap) * 0.9;
      bf.userData.wr.rotation.y = -Math.sin(s * flap) * 0.9;
    }
    // clouds drift
    for (const cl of anim.clouds) {
      cl.position.x += cl.userData.speed * dt;
      if (cl.position.x > 36) cl.position.x = -36;
    }
    // wishing tags sway
    for (const tag of anim.tags) {
      tag.rotation.x = Math.sin(t * 1.4 + tag.position.x * 3) * 0.25;
    }
    // landmark labels: fade with distance, shy when you're close enough to read
    for (const l of anim.labels) {
      const d = Math.hypot(playerPos.x - l.x, playerPos.z - l.z);
      l.spr.material.opacity = THREE.MathUtils.clamp(1.55 - d / 26, 0.3, 1) * (d < l.r ? 0.3 : 1);
      l.spr.visible = l.spr.material.opacity > 0.02;
    }
    // markers bob & face camera
    for (const [, m] of markers) {
      if (!m.visible) continue;
      m.position.y = m.userData.baseY + Math.sin(t * 2.6) * 0.14;
      m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z);
    }
  }

  return { colliders, markers, update, sun };
}
