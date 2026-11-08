// Procedural 3D sets & props for "Perbedaan Saham vs Kripto"
// Built on the proven two-tone Lambert + InkPass + hand-painted Canvas2D texture pipeline.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng, ctex, rep, grassHD, stoneHD, planksHD, beamHD } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";

export type Kit = Record<string, THREE.Object3D>;
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------------- materials (shared, cached, all two-tone shaded) ----------------
const mats = new Map<string, THREE.Material>();
export const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters) => {
  let m = mats.get(key) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    m = twoTone(new THREE.MeshLambertMaterial(make()));
    mats.set(key, m);
  }
  return m;
};

const f32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return new THREE.Float32BufferAttribute(out, a.itemSize);
};

export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const x = new THREE.BufferGeometry();
    x.setAttribute("position", f32(src.attributes.position));
    if (src.attributes.normal) x.setAttribute("normal", f32(src.attributes.normal)); else x.computeVertexNormals();
    x.setAttribute("uv", src.attributes.uv ? f32(src.attributes.uv) : new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat);
    if (l) l.push(x); else this.g.set(mat, [x]);
  }
  build(parent: THREE.Object3D, cast = true) {
    for (const [mat, list] of this.g) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
      parent.add(mesh);
    }
    this.g.clear();
  }
}

// ---------------- cartoon trees ----------------
const LEAF = ["#5aa83c", "#4c9a37", "#69b545", "#55a243", "#3f8f3c"];
const leafTex = (i: number) => ctex("leafS" + i, 256, 128, (g) => {
  const base = new THREE.Color(LEAF[i % LEAF.length]), top = base.clone().offsetHSL(0.01, 0.03, 0.08), bot = base.clone().offsetHSL(-0.01, 0, -0.08);
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#" + top.getHexString()); gr.addColorStop(0.5, "#" + base.getHexString()); gr.addColorStop(1, "#" + bot.getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
});
const leafMat = (i: number) => lam("leafS" + i, () => ({ map: leafTex(i) }));
const barkMat = () => lam("barkS", () => ({ color: "#8f5d3b" }));
const SPH = new THREE.SphereGeometry(1, 14, 10);
const TRUNK = new THREE.CylinderGeometry(0.55, 1, 1, 8, 1).translate(0, 0.5, 0);

export const addTree = (b: Batch, x: number, y: number, z: number, h: number, seed: number) => {
  const r = rng(Math.abs(Math.floor(seed * 97 + 13)));
  const leaf = leafMat(Math.floor(r() * 4));
  const tr = 0.07 * h, th = 0.42 * h;
  b.add(TRUNK, barkMat(), new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(tr, th, tr)));
  const cy = y + 0.62 * h;
  const put = (dx: number, dy: number, dz: number, rad: number) =>
    b.add(SPH, leaf, new THREE.Matrix4().compose(V(x + dx, cy + dy, z + dz), new THREE.Quaternion(), V(rad, rad * 0.88, rad)));
  put(0, 0, 0, 0.28 * h);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + r() * 0.5, d = 0.18 * h;
    put(Math.cos(a) * d, -0.05 * h, Math.sin(a) * d, 0.21 * h);
  }
  put(0, 0.16 * h, 0, 0.19 * h);
};

/** Helper to draw auto-fitted text inside Canvas2D textures so it never clips */
const fitText = (
  g: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  startPx: number,
  weight = "900",
  family = "sans-serif"
) => {
  let sz = startPx;
  g.font = `${weight} ${sz}px ${family}`;
  while (g.measureText(text).width > maxW && sz > 16) {
    sz -= 2;
    g.font = `${weight} ${sz}px ${family}`;
  }
  g.fillText(text, cx, cy);
};

// ---------------- Hand-Painted Custom Canvas2D Textures ----------------

/** Polished cream & emerald marble floor tiles for Bursa Efek Hall */
export const marbleTileTex = () => ctex("sahamMarbleTileHD", 1024, 1024, (g, r) => {
  const S = 1024, N = 4, T = S / N;
  g.fillStyle = "#b5aa99"; g.fillRect(0, 0, S, S);
  const cols = ["#f5efe6", "#eee7dc", "#f8f3eb", "#e9e0d2"];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x * T, py = y * T;
    g.fillStyle = cols[(x + y * 3) % cols.length];
    g.fillRect(px + 5, py + 5, T - 10, T - 10);
    g.strokeStyle = "rgba(180, 160, 130, 0.35)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(px + 20, py + 40 + r() * 80);
    g.quadraticCurveTo(px + 128, py + 120, px + 230, py + 60 + r() * 120);
    g.stroke();
    if ((x + y) % 2 === 0) {
      g.fillStyle = "#1f5a4c";
      g.beginPath();
      g.moveTo(px + T / 2, py + T / 2 - 18);
      g.lineTo(px + T / 2 + 18, py + T / 2);
      g.lineTo(px + T / 2, py + T / 2 + 18);
      g.lineTo(px + T / 2 - 18, py + T / 2);
      g.closePath();
      g.fill();
    }
  }
});

/** Dark Cyberpunk Neon Grid Floor for Blockchain Lab & Volatile Room */
export const cyberGridTex = (lineCol = "#00e5ff", bgCol = "#16192b") => ctex("cyberGrid_" + lineCol, 1024, 1024, (g) => {
  g.fillStyle = bgCol; g.fillRect(0, 0, 1024, 1024);
  const N = 4, T = 1024 / N;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = x * T, py = y * T;
    g.fillStyle = (x + y) % 2 === 0 ? "#1d2238" : "#181c30";
    g.fillRect(px + 6, py + 6, T - 12, T - 12);
    g.strokeStyle = lineCol;
    g.lineWidth = 4;
    g.strokeRect(px + 4, py + 4, T - 8, T - 8);
  }
});

/** Warm patterned rug for Auto Rejection & Fundamental Studio */
export const rugTex = (baseCol = "#8f2d38", trimCol = "#e0a84c") => ctex("sahamRug_" + baseCol, 512, 512, (g) => {
  g.fillStyle = baseCol; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = trimCol; g.lineWidth = 18;
  g.strokeRect(28, 28, 456, 456);
  g.strokeStyle = "#fff5dc"; g.lineWidth = 6;
  g.strokeRect(54, 54, 404, 404);
  g.fillStyle = trimCol;
  g.beginPath(); g.ellipse(256, 256, 135, 90, 0, 0, Math.PI * 2); g.fill();
});

/** Plinth Signboard texture (auto-fitted) */
export const plinthSignTex = (title: string, sub: string, bg: string, badgeCol: string) =>
  ctex("sahamSign_" + title + sub, 512, 256, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = "#241726"; g.lineWidth = 14;
    g.strokeRect(8, 8, 496, 240);
    g.fillStyle = "#ffffff"; g.textAlign = "center";
    fitText(g, title, 256, 82, 456, 46);
    g.fillStyle = badgeCol;
    g.fillRect(28, 118, 456, 102);
    g.strokeRect(28, 118, 456, 102);
    g.fillStyle = "#241726";
    fitText(g, sub, 256, 184, 430, 40);
  });

/** Overhead Banner Texture (compact width so it NEVER clips 9:16 edges) */
export const headerBannerTex = (line1: string, line2: string, bg: string, topCol: string) =>
  ctex("sahamHdr_" + line1, 1024, 256, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = "#241726"; g.lineWidth = 16;
    g.strokeRect(12, 12, 1000, 232);
    g.fillStyle = topCol; g.textAlign = "center";
    fitText(g, line1, 512, 110, 940, 68);
    g.fillStyle = "#ffffff";
    fitText(g, line2, 512, 196, 940, 48);
  });

/** Golden Bitcoin 3D Coin Face Texture ("₿") */
export const btcCoinTex = () => ctex("btcCoinTexHD", 512, 512, (g) => {
  g.fillStyle = "#f39c12"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#ffd43b";
  g.strokeStyle = "#241726"; g.lineWidth = 18;
  g.beginPath(); g.arc(256, 256, 220, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#f39c12";
  g.beginPath(); g.arc(256, 256, 175, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = "#241726"; g.textAlign = "center";
  g.font = "900 220px 'Segoe UI', Arial, sans-serif";
  g.fillText("₿", 256, 332);
});

/** Bursa Efek Wall Clock & Schedule Board ("09:00 - 16:00 HARI KERJA") */
export const bursaClockTex = () => ctex("bursaClockTexHD", 512, 640, (g) => {
  g.fillStyle = "#1b4d3e"; g.fillRect(0, 0, 512, 640);
  g.strokeStyle = "#e0a84c"; g.lineWidth = 16;
  g.strokeRect(12, 12, 488, 616);
  // Clock face at top
  g.fillStyle = "#fff9eb";
  g.strokeStyle = "#241726"; g.lineWidth = 12;
  g.beginPath(); g.arc(256, 200, 135, 0, Math.PI * 2); g.fill(); g.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    g.beginPath();
    g.moveTo(256 + Math.cos(a) * 105, 200 + Math.sin(a) * 105);
    g.lineTo(256 + Math.cos(a) * 122, 200 + Math.sin(a) * 122);
    g.stroke();
  }
  g.fillStyle = "rgba(46, 204, 113, 0.35)";
  g.beginPath(); g.moveTo(256, 200); g.arc(256, 200, 95, Math.PI, Math.PI * 2.15); g.closePath(); g.fill();
  g.strokeStyle = "#241726"; g.lineWidth = 10;
  g.beginPath(); g.moveTo(256, 200); g.lineTo(175, 200); g.stroke();
  g.beginPath(); g.moveTo(256, 200); g.lineTo(256, 95); g.stroke();
  g.fillStyle = "#d9382e"; g.beginPath(); g.arc(256, 200, 12, 0, Math.PI * 2); g.fill();

  g.fillStyle = "#ffe66d";
  g.fillRect(36, 370, 440, 110);
  g.strokeRect(36, 370, 440, 110);
  g.fillStyle = "#241726"; g.textAlign = "center";
  fitText(g, "09:00 - 16:00 WIB", 256, 442, 410, 48);
  g.fillStyle = "#ffffff";
  fitText(g, "SENIN - JUMAT (HARI KERJA)", 256, 555, 450, 36);
});

/** Crypto 24/7 Widescreen Monitor Candlestick Texture */
export const cryptoMonitorTex = () => ctex("cryptoMonitorTexHD", 512, 320, (g) => {
  g.fillStyle = "#0d1326"; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#00e5ff"; g.lineWidth = 10;
  g.strokeRect(6, 6, 500, 308);
  g.strokeStyle = "rgba(0, 229, 255, 0.18)"; g.lineWidth = 2;
  for (let x = 40; x < 500; x += 48) { g.beginPath(); g.moveTo(x, 12); g.lineTo(x, 300); g.stroke(); }
  for (let y = 40; y < 300; y += 48) { g.beginPath(); g.moveTo(12, y); g.lineTo(500, y); g.stroke(); }
  const candles = [
    [60, 190, 70, "#2ecc71"],
    [115, 150, 85, "#2ecc71"],
    [170, 175, 65, "#ff4757"],
    [225, 110, 95, "#2ecc71"],
    [280, 130, 80, "#ff4757"],
    [335, 75, 105, "#2ecc71"],
    [390, 50, 90, "#2ecc71"],
    [445, 35, 85, "#00e5ff"],
  ] as const;
  for (const [cx, top, h, col] of candles) {
    g.strokeStyle = col; g.lineWidth = 4;
    g.beginPath(); g.moveTo(cx + 14, top - 18); g.lineTo(cx + 14, top + h + 18); g.stroke();
    g.fillStyle = col;
    g.fillRect(cx, top, 28, h);
  }
  g.fillStyle = "#ffd43b"; g.textAlign = "left";
  fitText(g, "BTC/USD • 24/7 LIVE", 28, 52, 320, 32);
});

/** Auto Rejection (ARA / ARB) Chart Board Texture */
export const araBoardTex = () => ctex("araBoardTexHD", 768, 768, (g) => {
  g.fillStyle = "#142838"; g.fillRect(0, 0, 768, 768);
  g.strokeStyle = "#e0a84c"; g.lineWidth = 14;
  g.strokeRect(10, 10, 748, 748);
  // Top ARA Guardrail Zone
  g.fillStyle = "#1e824c";
  g.fillRect(28, 36, 712, 124);
  g.strokeStyle = "#241726"; g.lineWidth = 8;
  g.strokeRect(28, 36, 712, 124);
  g.fillStyle = "#ffe66d"; g.textAlign = "center";
  fitText(g, "BATAS ARA (+25%)", 384, 116, 650, 54);

  // Bottom ARB Guardrail Zone
  g.fillStyle = "#c0392b";
  g.fillRect(28, 608, 712, 124);
  g.strokeRect(28, 608, 712, 124);
  g.fillStyle = "#ffffff";
  fitText(g, "BATAS ARB (-15%)", 384, 688, 650, 54);

  // Safe controlled price wave in middle
  g.strokeStyle = "rgba(255,255,255,0.2)"; g.lineWidth = 3;
  for (let y = 210; y <= 550; y += 68) { g.beginPath(); g.moveTo(40, y); g.lineTo(728, y); g.stroke(); }

  g.strokeStyle = "#2ecc71"; g.lineWidth = 16;
  g.beginPath();
  g.moveTo(60, 480);
  g.lineTo(210, 390);
  g.lineTo(340, 420);
  g.lineTo(490, 240);
  g.lineTo(660, 175);
  g.stroke();

  g.fillStyle = "#ffffff";
  fitText(g, "TERKENDALI HARIAN", 384, 340, 620, 46);
});

/** Laporan Keuangan (Corporate Fundamental Sheet) on Table */
export const fundamentalTex = () => ctex("fundamentalTexHD", 1024, 768, (g) => {
  g.fillStyle = "#fff9eb"; g.fillRect(0, 0, 1024, 768);
  g.strokeStyle = "#1f5a4c"; g.lineWidth = 14;
  g.strokeRect(20, 20, 984, 728);
  g.fillStyle = "#1f5a4c";
  g.fillRect(44, 44, 936, 130);
  g.fillStyle = "#ffe66d"; g.textAlign = "center";
  fitText(g, "LAPORAN KEUANGAN PERUSAHAAN", 512, 128, 890, 52);

  const bars = [
    [110, 440, 150, "#2980b9", "Q1"],
    [250, 380, 210, "#2980b9", "Q2"],
    [390, 300, 290, "#27ae60", "Q3"],
    [530, 220, 370, "#2ecc71", "Q4"],
  ] as const;
  for (const [bx, top, h, col, lbl] of bars) {
    g.fillStyle = col;
    g.strokeStyle = "#241726"; g.lineWidth = 6;
    g.fillRect(bx, top, 95, h);
    g.strokeRect(bx, top, 95, h);
    g.fillStyle = "#241726";
    fitText(g, lbl, bx + 47, 645, 90, 36);
  }
  g.fillStyle = "#e8f8f5";
  g.fillRect(670, 220, 290, 370);
  g.strokeRect(670, 220, 290, 370);
  g.fillStyle = "#1f5a4c";
  fitText(g, "LABA BERSIH", 815, 310, 250, 38);
  g.fillStyle = "#27ae60";
  fitText(g, "+28.5%", 815, 410, 250, 64);
  g.fillStyle = "#241726";
  fitText(g, "FUNDAMENTAL KUAT", 815, 510, 250, 28);
});

/** Volatile Kripto Board Texture ("FLUKTUATIF TANPA BATAS") */
export const volatileBoardTex = () => ctex("volatileBoardTexHD", 768, 768, (g) => {
  g.fillStyle = "#1a0f2e"; g.fillRect(0, 0, 768, 768);
  g.strokeStyle = "#ff4757"; g.lineWidth = 14;
  g.strokeRect(10, 10, 748, 748);
  g.strokeStyle = "#ffd43b"; g.lineWidth = 8; g.setLineDash([24, 18]);
  g.beginPath(); g.moveTo(30, 110); g.lineTo(738, 110); g.stroke();
  g.beginPath(); g.moveTo(30, 650); g.lineTo(738, 650); g.stroke();
  g.setLineDash([]);

  g.strokeStyle = "#00e5ff"; g.lineWidth = 14;
  g.beginPath();
  g.moveTo(50, 520);
  g.lineTo(170, 160);
  g.lineTo(290, 610);
  g.lineTo(430, 65);
  g.lineTo(570, 680);
  g.lineTo(710, 90);
  g.stroke();

  g.fillStyle = "#ff4757";
  g.fillRect(54, 150, 660, 145);
  g.strokeStyle = "#241726"; g.lineWidth = 8;
  g.strokeRect(54, 150, 660, 145);
  g.fillStyle = "#ffe66d"; g.textAlign = "center";
  fitText(g, "TANPA AUTO REJECTION!", 384, 214, 620, 48);
  g.fillStyle = "#ffffff";
  fitText(g, "NAIK & TURUN DRASTIS", 384, 270, 620, 38);
});

// ===============================================================================================================
// HERO SET 1: SPLIT STAGE ARENA — SAHAM VS KRIPTO (Hook & Outro Comparison Stage)
// ===============================================================================================================
export const buildSplitSet = () => {
  const g = new THREE.Group();
  const b = new Batch();

  const floorM = lam("splitFloor", () => ({ map: rep(marbleTileTex(), 3, 3) }));
  const grassM = lam("splitGrass", () => ({ map: rep(grassHD(), 4, 4) }));
  const curbM = lam("splitCurb", () => ({ map: stoneHD("splitCurbHD") }));
  const plinthLeftM = lam("splitPlinthL", () => ({ color: "#1f4e3d" }));
  const plinthRightM = lam("splitPlinthR", () => ({ color: "#2c1b47" }));
  const towerWallM = lam("splitTowerWall", () => ({ color: "#dce6f2" }));
  const towerGlassM = lam("splitTowerGlass", () => ({ color: "#2980b9" }));
  const goldM = lam("splitGold", () => ({ color: "#f1c40f" }));
  const btcFaceM = lam("splitBtcFace", () => ({ map: btcCoinTex() }));
  const purpleM = lam("splitPurple", () => ({ color: "#8e44ad" }));
  const cyanM = lam("splitCyan", () => ({ color: "#00d2d3" }));
  const woodM = lam("splitWood", () => ({ map: beamHD() }));

  const signSahamM = lam("splitSignSaham", () => ({
    map: plinthSignTex("SAHAM (BEI)", "MODAL PERUSAHAAN", "#1b4d3e", "#2ecc71"),
  }));
  const signKriptoM = lam("splitSignKripto", () => ({
    map: plinthSignTex("KRIPTO (24/7)", "ASET DIGITAL", "#3c1e6e", "#ffd43b"),
  }));
  const bannerVsM = lam("splitBannerVs", () => ({
    map: headerBannerTex("SAHAM VS KRIPTO", "APA BEDANYA? YUK BAHAS!", "#1e272e", "#ffd43b"),
  }));

  // Floor: Polished marble stage foreground + grassy park behind
  b.add(new THREE.BoxGeometry(20, 0.4, 9).translate(0, -0.2, 1.5), floorM);
  b.add(new THREE.BoxGeometry(28, 0.4, 16).translate(0, -0.22, -10.5), grassM);
  b.add(new THREE.BoxGeometry(12, 0.16, 3.6).translate(0, 0.04, -2.1), curbM);

  // Overhead Header Frame & Banner (width = 1.68m centered at x = 0)
  b.add(new THREE.BoxGeometry(0.14, 3.6, 0.14).translate(-1.85, 1.8, -3.20), woodM);
  b.add(new THREE.BoxGeometry(0.14, 3.6, 0.14).translate(1.85, 1.8, -3.20), woodM);
  b.add(new THREE.BoxGeometry(3.9, 0.16, 0.18).translate(0, 3.55, -3.20), woodM);
  b.add(new THREE.BoxGeometry(1.68, 0.44, 0.08).translate(0, 3.22, -3.12), bannerVsM);

  // ---- LEFT PLINTH: SAHAM CORPORATE SKYSCRAPER & GOLDEN CHART (x = -0.78, z = -2.20) ----
  const lx = -0.78, lz = -2.20;
  b.add(new THREE.BoxGeometry(1.32, 0.44, 1.24).translate(lx, 0.26, lz), plinthLeftM);
  // Corporate Skyscraper Tower model
  b.add(new THREE.BoxGeometry(0.74, 1.85, 0.64).translate(lx - 0.16, 1.40, lz - 0.05), towerWallM);
  b.add(new THREE.BoxGeometry(0.58, 1.65, 0.68).translate(lx - 0.16, 1.40, lz - 0.05), towerGlassM);
  b.add(new THREE.BoxGeometry(0.82, 0.12, 0.72).translate(lx - 0.16, 2.36, lz - 0.05), goldM);
  // 2 Rising Gold Profit Bars next to the tower
  b.add(new THREE.BoxGeometry(0.15, 0.65, 0.15).translate(lx + 0.30, 0.80, lz + 0.15), goldM);
  b.add(new THREE.BoxGeometry(0.15, 1.05, 0.15).translate(lx + 0.46, 1.00, lz + 0.15), goldM);
  // Elevated Signboard on Left Plinth (mounted above the tower at y = 2.68 so characters never block it!)
  b.add(new THREE.BoxGeometry(1.18, 0.48, 0.08).translate(lx - 0.05, 2.66, lz + 0.32), signSahamM);

  // ---- RIGHT PLINTH: KRIPTO BLOCKCHAIN MONUMENT & GIANT BITCOIN (x = +0.78, z = -2.20) ----
  const rx = 0.78, rz = -2.20;
  b.add(new THREE.BoxGeometry(1.32, 0.44, 1.24).translate(rx, 0.26, rz), plinthRightM);
  // Blockchain stacked cyber cubes
  b.add(new THREE.BoxGeometry(0.56, 0.56, 0.56).translate(rx + 0.22, 0.80, rz - 0.08), purpleM);
  b.add(new THREE.BoxGeometry(0.44, 0.44, 0.44).rotateY(0.45).translate(rx + 0.22, 1.32, rz - 0.08), cyanM);
  // Giant Golden Bitcoin Medallion with crisp "₿" face!
  b.add(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 24).rotateX(Math.PI / 2).translate(rx - 0.20, 1.42, rz + 0.08), goldM);
  b.add(new THREE.BoxGeometry(0.66, 0.66, 0.04).translate(rx - 0.20, 1.42, rz + 0.15), btcFaceM);
  // Elevated Signboard on Right Plinth (mounted at y = 2.66 so characters never block it!)
  b.add(new THREE.BoxGeometry(1.18, 0.48, 0.08).translate(rx + 0.05, 2.66, rz + 0.32), signKriptoM);

  // Framing background trees
  addTree(b, -2.65, 0, -4.8, 3.8, 11);
  addTree(b, 2.65, 0, -4.8, 3.9, 23);
  addTree(b, -3.1, 0, -8.8, 4.3, 37);
  addTree(b, 3.1, 0, -8.8, 4.1, 49);

  b.build(g, true);

  // ---- Motivated HDR Glowing Accents (NOINK Bloom Layer) ----
  const goldGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.0, 0.8), fog: false });
  const cyanGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.4, 2.8), fog: false });

  const sahamStrip = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.05, 0.05), goldGlow);
  sahamStrip.position.set(lx, 0.50, lz + 0.64);
  sahamStrip.layers.set(NOINK);
  g.add(sahamStrip);

  const kriptoStrip = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.05, 0.05), cyanGlow);
  kriptoStrip.position.set(rx, 0.50, rz + 0.64);
  kriptoStrip.layers.set(NOINK);
  g.add(kriptoStrip);

  const btcRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.03, 10, 28), cyanGlow);
  btcRing.position.set(rx - 0.20, 1.42, rz + 0.10);
  btcRing.layers.set(NOINK);
  g.add(btcRing);

  return g;
};

// ===============================================================================================================
// HERO SET 2: AULA BURSA EFEK INDONESIA (BEI & OJK HALL + 09:00-16:00 OPERATIONAL CLOCK)
// ===============================================================================================================
export const buildBursaSet = () => {
  const g = new THREE.Group();
  const b = new Batch();

  const floorM = lam("bursaFloor", () => ({ map: rep(marbleTileTex(), 3, 3) }));
  const wallM = lam("bursaWall", () => ({ color: "#f3ece0" }));
  const woodM = lam("bursaWood", () => ({ map: rep(beamHD(), 2, 1) }));
  const deskM = lam("bursaDesk", () => ({ map: planksHD() }));
  const greenM = lam("bursaGreen", () => ({ color: "#1b4d3e" }));
  const goldM = lam("bursaGold", () => ({ color: "#e6b450" }));
  const glassM = lam("bursaGlass", () => ({ color: "#2980b9" }));
  const skyPaneM = lam("bursaSkyPane", () => ({ color: "#88c8f2" }));
  const clockM = lam("bursaClock", () => ({ map: bursaClockTex() }));
  const tickerM = lam("bursaTicker", () => ({
    map: headerBannerTex("BURSA EFEK INDONESIA", "IHSG +1.85% • DIAWASI OJK & BEI", "#0f2e24", "#2ecc71"),
  }));
  const ojkSignM = lam("bursaOjkSign", () => ({
    map: plinthSignTex("PENGAWAS OJK & BEI", "RESMI & TERDAFTAR", "#78281f", "#ffe66d"),
  }));

  // Marble floor & back/side walls
  b.add(new THREE.BoxGeometry(16, 0.3, 12).translate(0, -0.15, -1.0), floorM);
  b.add(new THREE.BoxGeometry(11.0, 5.8, 0.28).translate(0, 2.9, -3.65), wallM);
  b.add(new THREE.BoxGeometry(11.0, 1.25, 0.36).translate(0, 0.62, -3.55), woodM);
  b.add(new THREE.BoxGeometry(0.28, 5.8, 6.5).translate(-2.35, 2.9, -0.8), wallM);
  b.add(new THREE.BoxGeometry(0.28, 5.8, 6.5).translate(2.35, 2.9, -0.8), wallM);

  for (const px of [-1.85, 0.0, 1.85]) {
    b.add(new THREE.BoxGeometry(0.26, 4.6, 0.22).translate(px, 2.3, -3.48), woodM);
  }

  // ---- Overhead Glowing BEI Stock Ticker Board (x = 0.0, y = 3.22, z = -3.32, width = 1.68m) ----
  b.add(new THREE.BoxGeometry(1.68, 0.46, 0.12).translate(0, 3.22, -3.32), tickerM);

  // ---- Tall Sunlit Exchange Window on Back-Left Wall (x = -0.95, y = 2.30, z = -3.46) ----
  b.add(new THREE.BoxGeometry(1.18, 1.60, 0.08).translate(-0.95, 2.30, -3.48), skyPaneM);
  b.add(new THREE.BoxGeometry(1.32, 0.10, 0.18).translate(-0.95, 1.48, -3.40), woodM);
  b.add(new THREE.BoxGeometry(1.32, 0.10, 0.18).translate(-0.95, 3.12, -3.40), woodM);

  // ---- Wall Clock & Operational Hours Board on Back-Right Wall (x = +0.86, y = 2.25, z = -3.40) ----
  b.add(new THREE.BoxGeometry(1.06, 1.32, 0.10).translate(0.86, 2.25, -3.40), clockM);

  // ---- Left Podium: Corporate Ownership Model & Bursa Bell (x = -0.88, z = -2.05) ----
  const lx = -0.88, lz = -2.05;
  b.add(new THREE.BoxGeometry(1.08, 0.88, 0.82).translate(lx, 0.44, lz), greenM);
  b.add(new THREE.BoxGeometry(1.16, 0.08, 0.88).translate(lx, 0.90, lz), goldM);
  // Miniature Corporate Office Tower ("Modal Perusahaan") on left podium
  b.add(new THREE.BoxGeometry(0.46, 0.92, 0.42).translate(lx - 0.18, 1.40, lz), glassM);
  b.add(new THREE.BoxGeometry(0.52, 0.08, 0.48).translate(lx - 0.18, 1.88, lz), goldM);
  // Golden Bursa Opening Bell on stand
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8).translate(lx + 0.24, 1.15, lz), woodM);
  b.add(new THREE.ConeGeometry(0.15, 0.24, 14).translate(lx + 0.24, 1.28, lz), goldM);

  // ---- Right Desk: Official OJK & BEI Supervision Desk (x = +0.76, z = -1.90) ----
  const dx = 0.76, dz = -1.90;
  b.add(new THREE.BoxGeometry(1.16, 0.86, 0.74).translate(dx, 0.43, dz), woodM);
  b.add(new THREE.BoxGeometry(1.24, 0.08, 0.82).translate(dx, 0.88, dz), deskM);
  // Front plaque "PENGAWAS OJK & BEI" centered cleanly on the desk
  b.add(new THREE.BoxGeometry(0.98, 0.44, 0.06).translate(dx, 0.50, dz + 0.39), ojkSignM);
  // Regulatory books & Gavel block on desk
  b.add(new THREE.BoxGeometry(0.26, 0.14, 0.20).translate(dx - 0.28, 0.99, dz), greenM);
  b.add(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 12).translate(dx + 0.04, 0.95, dz + 0.08), woodM);
  // Classic green banker's desk lamp on right corner of desk
  b.add(new THREE.CylinderGeometry(0.11, 0.14, 0.05, 12).translate(dx + 0.36, 0.94, dz - 0.10), goldM);
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.44, 8).translate(dx + 0.36, 1.18, dz - 0.10), goldM);
  b.add(new THREE.ConeGeometry(0.19, 0.14, 12).translate(dx + 0.30, 1.40, dz - 0.06), greenM);

  b.build(g, true);

  // ---- Motivated Glowing Bulb inside Banker Lamp & LED Ticker Glow Strip (NOINK) ----
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.4, 1.1), fog: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), bulbMat);
  bulb.position.set(dx + 0.30, 1.34, dz - 0.06);
  bulb.layers.set(NOINK);
  g.add(bulb);

  const greenGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 2.8, 1.2), fog: false });
  const tickerStrip = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.05, 0.05), greenGlow);
  tickerStrip.position.set(0, 2.97, -3.26);
  tickerStrip.layers.set(NOINK);
  g.add(tickerStrip);

  return g;
};

// ===============================================================================================================
// HERO SET 3: CYBER BLOCKCHAIN NODE LAB 24/7 (BTC, ETH, SOL Monuments + 24/7 Monitors + Blockchain Nodes)
// ===============================================================================================================
export const buildCryptoSet = () => {
  const g = new THREE.Group();
  const b = new Batch();

  const floorM = lam("cryFloor", () => ({ map: rep(cyberGridTex("#00e5ff", "#141829"), 3, 3) }));
  const wallM = lam("cryWall", () => ({ color: "#1b1f38" }));
  const trimM = lam("cryTrim", () => ({ color: "#2c2552" }));
  const darkMetalM = lam("cryMetal", () => ({ color: "#23283d" }));
  const monScreenM = lam("cryMonScreen", () => ({ map: cryptoMonitorTex() }));
  const nightPaneM = lam("cryNightPane", () => ({ color: "#120b29" }));
  const goldM = lam("cryGold", () => ({ color: "#f39c12" }));
  const btcFaceM = lam("cryBtcFace", () => ({ map: btcCoinTex() }));
  const cyanM = lam("cryCyan", () => ({ color: "#00d2d3" }));
  const purpleM = lam("cryPurple", () => ({ color: "#9b59b6" }));

  const banner24M = lam("cryBanner24", () => ({
    map: headerBannerTex("BLOCKCHAIN 24/7", "TANPA OTORITAS PUSAT • NON-STOP", "#1e133c", "#00e5ff"),
  }));
  const btcSignM = lam("cryBtcSign", () => ({
    map: plinthSignTex("BITCOIN", "BTC", "#b87300", "#ffd43b"),
  }));
  const ethSignM = lam("cryEthSign", () => ({
    map: plinthSignTex("ETHEREUM", "ETH", "#165278", "#38e8ff"),
  }));
  const solSignM = lam("crySolSign", () => ({
    map: plinthSignTex("SOLANA", "SOL", "#521b78", "#2ecc71"),
  }));

  // Cyber grid floor & walls
  b.add(new THREE.BoxGeometry(16, 0.3, 12).translate(0, -0.15, -1.0), floorM);
  b.add(new THREE.BoxGeometry(11.0, 5.8, 0.28).translate(0, 2.9, -3.65), wallM);
  b.add(new THREE.BoxGeometry(11.0, 1.10, 0.36).translate(0, 0.55, -3.55), trimM);
  b.add(new THREE.BoxGeometry(0.28, 5.8, 6.5).translate(-2.35, 2.9, -0.8), wallM);
  b.add(new THREE.BoxGeometry(0.28, 5.8, 6.5).translate(2.35, 2.9, -0.8), wallM);

  // ---- Overhead "BLOCKCHAIN 24/7" Banner (x = 0.0, y = 3.25, z = -3.32, width = 1.68m) ----
  b.add(new THREE.BoxGeometry(1.68, 0.46, 0.10).translate(0, 3.25, -3.32), banner24M);

  // ---- Moonlit Night Window on Back-Left Wall (x = -0.95, y = 2.25, z = -3.48) ----
  b.add(new THREE.BoxGeometry(1.18, 1.42, 0.08).translate(-0.95, 2.25, -3.48), nightPaneM);
  b.add(new THREE.BoxGeometry(1.30, 0.10, 0.18).translate(-0.95, 1.50, -3.40), darkMetalM);
  b.add(new THREE.BoxGeometry(1.30, 0.10, 0.18).translate(-0.95, 2.98, -3.40), darkMetalM);

  // ---- Left Cyber Trading Desk (x = -0.88, z = -1.95) ----
  const dx = -0.88, dz = -1.95;
  b.add(new THREE.BoxGeometry(1.12, 0.08, 0.68).translate(dx, 0.84, dz), darkMetalM);
  b.add(new THREE.BoxGeometry(0.10, 0.82, 0.60).translate(dx - 0.48, 0.41, dz), darkMetalM);
  b.add(new THREE.BoxGeometry(0.10, 0.82, 0.60).translate(dx + 0.48, 0.41, dz), darkMetalM);
  // Dual widescreen trading monitors on desk
  b.add(new THREE.BoxGeometry(0.52, 0.36, 0.05).rotateY(0.16).translate(dx - 0.25, 1.14, dz - 0.06), monScreenM);
  b.add(new THREE.BoxGeometry(0.52, 0.36, 0.05).rotateY(-0.10).translate(dx + 0.25, 1.14, dz - 0.06), monScreenM);

  // ---- Right 3 Crypto Pedestals safely inside 9:16 margins: BITCOIN (0.18), ETHEREUM (0.64), SOLANA (1.10) ----
  const pillars = [
    [0.18, -2.10, 1.05, btcSignM],
    [0.64, -2.10, 0.92, ethSignM],
    [1.10, -2.10, 0.82, solSignM],
  ] as const;
  for (const [px, pz, ph, signM] of pillars) {
    b.add(new THREE.BoxGeometry(0.42, ph, 0.42).translate(px, ph / 2, pz), darkMetalM);
    b.add(new THREE.BoxGeometry(0.40, 0.24, 0.05).translate(px, ph - 0.20, pz + 0.22), signM);
  }

  // ---- 3 Overhead Blockchain Cube Frames along Back Wall (y = 2.48, z = -3.15) ----
  for (const nx of [0.12, 0.64, 1.16]) {
    b.add(new THREE.BoxGeometry(0.32, 0.32, 0.32).rotateY(0.4).rotateX(0.3).translate(nx, 2.48, -3.15), purpleM);
  }

  b.build(g, true);

  // ---- Animated 3D Crypto Emblems Group (BTC Coin with "₿", ETH Octahedron, SOL Ring) ----
  const coinsGroup = new THREE.Group();

  // 1. BTC Golden Coin at (0.18, 1.42, -2.10)
  const btcGroup = new THREE.Group();
  btcGroup.position.set(0.18, 1.42, -2.10);
  const btcRim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 20).rotateX(Math.PI / 2), goldM);
  const btcFront = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.31, 0.03).translate(0, 0, 0.03), btcFaceM);
  btcGroup.add(btcRim, btcFront);
  coinsGroup.add(btcGroup);

  // 2. ETH Cyan Crystal Octahedron at (0.64, 1.28, -2.10)
  const ethMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.21, 0), cyanM);
  ethMesh.position.set(0.64, 1.28, -2.10);
  coinsGroup.add(ethMesh);

  // 3. SOL Neon Torus at (1.10, 1.16, -2.10)
  const solMesh = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 10, 24), purpleM);
  solMesh.position.set(1.10, 1.16, -2.10);
  coinsGroup.add(solMesh);

  g.add(coinsGroup);

  // HDR Glowing Laser Links between Blockchain Cubes & Desk Under-glow (NOINK)
  const cyanBeamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 2.5, 3.0), fog: false });
  const goldBeamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 2.0, 0.6), fog: false });

  const laserLink = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.04, 0.04), cyanBeamMat);
  laserLink.position.set(0.64, 2.48, -3.15);
  laserLink.layers.set(NOINK);
  g.add(laserLink);

  const deskNeon = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.04, 0.04), cyanBeamMat);
  deskNeon.position.set(dx, 0.82, dz + 0.33);
  deskNeon.layers.set(NOINK);
  g.add(deskNeon);

  const pillarNeon = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.04, 0.04), goldBeamMat);
  pillarNeon.position.set(0.64, 0.06, -1.86);
  pillarNeon.layers.set(NOINK);
  g.add(pillarNeon);

  return { root: g, coinsGroup };
};

// ===============================================================================================================
// HERO SET 4: AUTO REJECTION (ARA / ARB) & LAPORAN KEUANGAN VAULT (Saham Price Control & Fundamentals)
// ===============================================================================================================
export const buildAraSet = () => {
  const g = new THREE.Group();
  const b = new Batch();
  const m4 = new THREE.Matrix4();

  const floorM = lam("araFloor", () => ({ map: rep(planksHD(), 3, 3) }));
  const rugM = lam("araRug", () => ({ map: rugTex("#8f2d38", "#e0a84c") }));
  const wallM = lam("araWall", () => ({ color: "#efe4d2" }));
  const woodM = lam("araWood", () => ({ map: rep(beamHD(), 2, 1) }));
  const deskM = lam("araDesk", () => ({ map: planksHD() }));
  const boardM = lam("araBoard", () => ({ map: araBoardTex() }));
  const fundM = lam("araFund", () => ({ map: fundamentalTex() }));
  const greenM = lam("araGreen", () => ({ color: "#27ae60" }));
  const redM = lam("araRed", () => ({ color: "#c0392b" }));
  const goldM = lam("araGold", () => ({ color: "#e6b450" }));
  const sunsetPaneM = lam("araSunset", () => ({ color: "#ff9e5e" }));
  const headerM = lam("araHeader", () => ({
    map: headerBannerTex("MEKANISME AUTO REJECTION", "BATAS NAIK (ARA) & TURUN (ARB)", "#1b4d3e", "#ffe66d"),
  }));

  // Floor, rug, and back wall
  b.add(new THREE.BoxGeometry(16, 0.3, 12).translate(0, -0.15, -1.0), floorM);
  b.add(new THREE.BoxGeometry(4.8, 0.03, 3.4).translate(0, 0.015, -0.9), rugM);
  b.add(new THREE.BoxGeometry(11.0, 5.8, 0.28).translate(0, 2.9, -3.65), wallM);
  b.add(new THREE.BoxGeometry(11.0, 1.20, 0.36).translate(0, 0.60, -3.55), woodM);

  // Overhead Header Banner (x = 0.0, y = 3.25, z = -3.32, width = 1.68m)
  b.add(new THREE.BoxGeometry(1.68, 0.46, 0.10).translate(0, 3.25, -3.32), headerM);

  // Golden-hour window on back-right wall (x = +0.92, y = 2.30, z = -3.48)
  b.add(new THREE.BoxGeometry(1.22, 1.60, 0.08).translate(0.92, 2.30, -3.48), sunsetPaneM);
  b.add(new THREE.BoxGeometry(1.34, 0.10, 0.18).translate(0.92, 1.48, -3.40), woodM);
  b.add(new THREE.BoxGeometry(1.34, 0.10, 0.18).translate(0.92, 3.12, -3.40), woodM);

  // ---- Back-Left: 3D Auto Rejection Guardrail Rig (x = -0.66, z = -2.15, elevated so 100% inside 9:16 margin!) ----
  const gx = -0.66, gz = -2.15;
  b.add(new THREE.BoxGeometry(1.26, 0.68, 0.58).translate(gx, 0.34, gz), woodM);
  b.add(new THREE.BoxGeometry(1.22, 1.56, 0.10).translate(gx, 1.46, gz), boardM);
  // Physical 3D Top ARA Bumper Bar & Bottom ARB Bumper Bar protruding from frame
  b.add(new THREE.BoxGeometry(1.28, 0.11, 0.22).translate(gx, 2.18, gz + 0.08), greenM);
  b.add(new THREE.BoxGeometry(1.28, 0.11, 0.22).translate(gx, 0.74, gz + 0.08), redM);
  // 3D Green Stock Candlestick Bars rising and safely hitting the ARA top bumper
  b.add(new THREE.BoxGeometry(0.14, 0.58, 0.12).translate(gx - 0.30, 1.12, gz + 0.10), greenM);
  b.add(new THREE.BoxGeometry(0.14, 0.90, 0.12).translate(gx - 0.06, 1.36, gz + 0.10), greenM);
  b.add(new THREE.BoxGeometry(0.14, 1.24, 0.12).translate(gx + 0.20, 1.50, gz + 0.10), greenM);

  // ---- Back-Right: Corporate Fundamental & Laporan Keuangan Table (x = +0.76, z = -1.82) ----
  const tx = 0.76, tz = -1.82;
  const tableTop = new THREE.BoxGeometry(1.22, 0.09, 0.86);
  m4.makeRotationX(0.20);
  m4.setPosition(tx, 0.92, tz);
  b.add(tableTop, deskM, m4);
  for (const [lx, lz] of [[tx - 0.50, tz - 0.32], [tx + 0.50, tz - 0.32], [tx - 0.50, tz + 0.32], [tx + 0.50, tz + 0.32]]) {
    b.add(new THREE.BoxGeometry(0.08, 0.88, 0.08).translate(lx, 0.44, lz), woodM);
  }
  // Large tilted Laporan Keuangan sheet on table
  const sheetGeo = new THREE.BoxGeometry(0.96, 0.02, 0.68);
  m4.makeRotationX(0.20);
  m4.setPosition(tx - 0.06, 0.98, tz + 0.02);
  b.add(sheetGeo, fundM, m4);

  // Stacked Gold Bullion Bars & Brass Desk Lamp on right corner of table
  b.add(new THREE.BoxGeometry(0.20, 0.10, 0.13).translate(tx + 0.38, 1.04, tz - 0.16), goldM);
  b.add(new THREE.CylinderGeometry(0.12, 0.15, 0.05, 12).translate(tx + 0.40, 1.06, tz - 0.26), goldM);
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 0.46, 8).translate(tx + 0.40, 1.30, tz - 0.26), goldM);
  b.add(new THREE.ConeGeometry(0.19, 0.14, 12).translate(tx + 0.32, 1.52, tz - 0.20), greenM);

  b.build(g, true);

  // ---- Motivated Glowing Bulb & ARA Guardrail Laser Strip (NOINK) ----
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 2.4, 1.1), fog: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), bulbMat);
  bulb.position.set(tx + 0.32, 1.46, tz - 0.20);
  bulb.layers.set(NOINK);
  g.add(bulb);

  const araGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.8, 1.2), fog: false });
  const araBar = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.05, 0.05), araGlow);
  araBar.position.set(gx, 2.24, gz + 0.20);
  araBar.layers.set(NOINK);
  g.add(araBar);

  return g;
};

// ===============================================================================================================
// HERO SET 5: STORM ROOM VOLATILITAS EKSTREM KRIPTO (Rollercoaster Chart + Global Sentiment Radar)
// ===============================================================================================================
export const buildVolatileSet = () => {
  const g = new THREE.Group();
  const b = new Batch();
  const m4 = new THREE.Matrix4();

  const floorM = lam("volFloor", () => ({ map: rep(cyberGridTex("#ff4757", "#181028"), 3, 3) }));
  const wallM = lam("volWall", () => ({ color: "#23153c" }));
  const darkM = lam("volDark", () => ({ color: "#1c132e" }));
  const boardM = lam("volBoard", () => ({ map: volatileBoardTex() }));
  const greenM = lam("volGreen", () => ({ color: "#2ecc71" }));
  const redM = lam("volRed", () => ({ color: "#ff4757" }));
  const goldM = lam("volGold", () => ({ color: "#ffd43b" }));
  const cyanM = lam("volCyan", () => ({ color: "#00d2d3" }));
  const headerM = lam("volHeader", () => ({
    map: headerBannerTex("VOLATILITAS EKSTREM", "TANPA BATAS AUTO REJECTION!", "#8c1d2c", "#ffd43b"),
  }));
  const radarSignM = lam("volRadarSign", () => ({
    map: plinthSignTex("SENTIMEN PASAR", "LIKUIDITAS GLOBAL", "#381b5c", "#00e5ff"),
  }));

  // Floor & walls
  b.add(new THREE.BoxGeometry(16, 0.3, 12).translate(0, -0.15, -1.0), floorM);
  b.add(new THREE.BoxGeometry(11.0, 5.8, 0.28).translate(0, 2.9, -3.65), wallM);
  b.add(new THREE.BoxGeometry(0.28, 5.8, 6.5).translate(-2.35, 2.9, -0.8), wallM);
  b.add(new THREE.BoxGeometry(0.28, 5.8, 6.5).translate(2.35, 2.9, -0.8), wallM);

  // Overhead Warning Header Banner (x = 0.0, y = 3.28, z = -3.32, width = 1.68m)
  b.add(new THREE.BoxGeometry(1.68, 0.46, 0.10).translate(0, 3.28, -3.32), headerM);

  // ---- Back-Left: 3D Rollercoaster Spike & Crash Rig (x = -0.66, z = -2.15) ----
  const vx = -0.66, vz = -2.15;
  b.add(new THREE.BoxGeometry(1.26, 0.56, 0.58).translate(vx, 0.28, vz), darkM);
  b.add(new THREE.BoxGeometry(1.22, 1.56, 0.10).translate(vx, 1.34, vz), boardM);
  // Giant Green Pump Candlestick shooting WAY ABOVE the frame top (no ARA limit!)
  b.add(new THREE.BoxGeometry(0.18, 2.15, 0.16).translate(vx - 0.34, 1.55, vz + 0.12), greenM);
  b.add(new THREE.ConeGeometry(0.20, 0.36, 8).translate(vx - 0.34, 2.78, vz + 0.12), greenM);
  // Giant Red Crash Candlestick plunging down to the floor (no ARB limit!)
  const crashGeo = new THREE.BoxGeometry(0.18, 1.85, 0.16);
  m4.makeRotationZ(-0.16);
  m4.setPosition(vx + 0.28, 1.24, vz + 0.14);
  b.add(crashGeo, redM, m4);
  b.add(new THREE.ConeGeometry(0.20, 0.36, 8).rotateX(Math.PI).translate(vx + 0.42, 0.36, vz + 0.14), redM);

  // ---- Back-Right: Global Sentiment & Liquidity Globe Pedestal (x = +0.76, z = -2.05) ----
  const rx = 0.76, rz = -2.05;
  b.add(new THREE.BoxGeometry(1.06, 0.86, 0.74).translate(rx, 0.43, rz), darkM);
  b.add(new THREE.BoxGeometry(0.96, 0.44, 0.06).translate(rx, 0.48, rz + 0.39), radarSignM);
  // 3D Global Liquidity Sphere + Orbital Ring + Megaphone
  b.add(new THREE.SphereGeometry(0.36, 16, 12).translate(rx - 0.08, 1.38, rz), cyanM);
  b.add(new THREE.TorusGeometry(0.48, 0.032, 8, 24).rotateX(1.1).rotateY(0.3).translate(rx - 0.08, 1.38, rz), goldM);
  b.add(new THREE.ConeGeometry(0.16, 0.34, 12).rotateZ(-1.1).translate(rx + 0.32, 1.18, rz + 0.10), redM);

  // Overhead Siren Mount placed at (x = +0.92, y = 2.68, z = -1.65) so the center header banner is 100% unobstructed!
  b.add(new THREE.CylinderGeometry(0.02, 0.02, 1.10, 6).translate(0.92, 3.30, -1.65), darkM);
  b.add(new THREE.ConeGeometry(0.26, 0.18, 10).translate(0.92, 2.68, -1.65), darkM);

  b.build(g, true);

  // ---- Glowing Red Warning Beacon & Neon Spike/Crash Strips (NOINK) ----
  const sirenMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.6, 0.8, 1.2), fog: false });
  const siren = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 10), sirenMat);
  siren.position.set(0.92, 2.55, -1.65);
  siren.layers.set(NOINK);
  g.add(siren);

  const redNeon = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 0.5, 0.8), fog: false });
  const alertStrip = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.05, 0.05), redNeon);
  alertStrip.position.set(vx, 2.14, vz + 0.10);
  alertStrip.layers.set(NOINK);
  g.add(alertStrip);

  return g;
};
