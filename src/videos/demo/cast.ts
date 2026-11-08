// 2D Character Cast & Cartoon Effect Cards for "Perbedaan Saham vs Kripto".
// Uses 3x supersampled (1800x3000) lit cardShade sprites, contact/cast shadow blobs, and NOINK layer 3.
// Follows skill/references/reports/motion.md & Gold Benchmark kosan/cast.ts:
// - Bouncy walk cycles ("march" / "stroll" with 4.8% height bob & weight-shift sway)
// - Hop / jump arcs with crouch anticipation on celebration & shock beats
// - 4-frame half/shut/shut/half blinks timed 2 frames (LEAD = 2/FPS) before expression swaps
// - Popping 2D FX cards (fxBurst, fxStars, fxCreak, fxMoneyFly, fxCryptoSwarm, fxBadge)
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxShadow, fxContact, fxBurst, fxStars, fxCreak,
  Outfit, FrontOpts, SideOpts, INK,
  PAK_BUDI_OUTFIT, BRO_KEVIN_OUTFIT, PAK_DARMA_OUTFIT, BANG_NIK_OUTFIT,
} from "./toon";
import { FPS, SHOTS, clamp01, smooth, WorldState } from "./story";
import { LightName } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
const ROOTS = new Set<THREE.Object3D>();

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}

export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    } else {
      this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0;
    }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;

const tier = (d: number): [number, number, number] =>
  d < 8.5 ? [1800, 3000, 3.0] : d < 14 ? [1080, 1800, 1.8] : [480, 800, 0.8];

const SUN = new THREE.Vector3(0.5, 0.75, 0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: LightName = "golden";

const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- blinks, expression swaps & micro-motion helpers ----------------
const LEAD = 2 / FPS;
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 48 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const liveTilt = (t: number, seed: number, amp = 2.6) => q(amp * Math.sin(t * 3.2 + seed), 30);
const liveHead = (t: number, seed: number, amp = 4.0) => q(amp * Math.sin(t * 2.4 + seed * 1.7) + (amp * 0.4) * Math.cos(t * 4.1 + seed), 30);

/** Parabolic hop/jump arc with a 3-frame crouch anticipation */
const hopY = (t: number, t0: number, dur = 0.42, height = 0.16): number => {
  const dt = t - t0;
  if (dt < -0.08 || dt > dur) return 0;
  if (dt < 0) return -0.025 * Math.sin(((dt + 0.08) / 0.08) * Math.PI);
  const u = dt / dur;
  return height * 4 * u * (1 - u);
};

type Who = { i: number; o: Outfit; okey: string };
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, side: boolean, mirror: boolean, fo: FrontOpts, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const m = side && mirror, light = light2D(cam, m), seed = ((who.i * 5 + 3) % 7) + 1;
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror: m,
    draw: (p) => (side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

const CONTACT: Record<LightName, [number, number, number]> = {
  space: [0.18, 0.16, 0.32],
  night: [0.18, 0.16, 0.30],
  golden: [0.24, 0.20, 0.33],
  day: [0.20, 0.21, 0.33],
};
const TAIL: [number, number, number] = [0.38, 0.36, 0.56];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");

const blob = (out: Stage, x: number, _y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  const el = Math.asin(Math.min(0.99, Math.max(0.15, SUN.y)));
  const len = Math.min(2.2, Math.max(0.5, 1.4 / Math.tan(el))) * sc, h = len + 0.5 * sc, c = 0.3 * h;
  const tc = hexOf(TAIL, k);
  out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: 0.022, z: z + oz * 0.03 * sc, w: 0.54 * sc, h: 0.42 * sc, flat: true, rot });
};

// ---------------- 2D Cartoon FX Cards ----------------

/** Flying Rupiah Money Notes & Gold Coins Card (520x520) */
const fxMoneyFly = (p: Pen, phase: number) => {
  const g = p.g;
  const bills = [
    [130, 260, -0.28, "#2ecc71"],
    [260, 150, 0.16, "#27ae60"],
    [380, 250, 0.34, "#2ecc71"],
  ] as const;
  for (let i = 0; i < bills.length; i++) {
    const [bx, by, rot, col] = bills[i];
    const y = by - ((phase * 95 + i * 40) % 110);
    const x = bx + Math.sin(phase * 4 + i * 2) * 16;
    g.save();
    g.translate(x, y);
    g.rotate(rot + Math.sin(phase * 3 + i) * 0.12);
    g.fillStyle = col;
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.beginPath();
    g.roundRect(-62, -32, 124, 64, 10);
    g.fill(); g.stroke();
    g.fillStyle = "#fff8e7";
    g.beginPath();
    g.arc(0, 0, 18, 0, Math.PI * 2);
    g.fill(); g.stroke();
    g.fillStyle = INK;
    g.font = "900 22px 'Segoe UI', Arial, sans-serif";
    g.textAlign = "center";
    g.fillText("Rp", 0, 8);
    g.restore();
  }
  for (const [cx, cy, off] of [[185, 360, 0.5], [335, 350, 1.8], [260, 95, 3.1]] as const) {
    const y = cy + Math.sin(phase * 5 + off) * 14;
    g.fillStyle = "#ffd43b";
    g.strokeStyle = INK;
    g.lineWidth = 7;
    g.beginPath();
    g.arc(cx, y, 22, 0, Math.PI * 2);
    g.fill(); g.stroke();
  }
};

/** Floating Crypto Coins Card (BTC, ETH, SOL tokens orbiting on a 520x520 canvas) */
const fxCryptoSwarm = (p: Pen, phase: number) => {
  const g = p.g;
  const coins = [
    [140, 220, "#f39c12", "#ffd43b", "₿", 0.0],
    [265, 135, "#00a8ff", "#70e8ff", "◆", 2.1],
    [380, 230, "#8e44ad", "#2ecc71", "S", 4.2],
  ] as const;
  for (const [cx, cy, outer, inner, sym, off] of coins) {
    const x = cx + Math.sin(phase * 3.5 + off) * 14;
    const y = cy + Math.cos(phase * 4.5 + off) * 16;
    g.fillStyle = outer;
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.beginPath();
    g.arc(x, y, 42, 0, Math.PI * 2);
    g.fill(); g.stroke();

    g.fillStyle = inner;
    g.beginPath();
    g.arc(x, y, 30, 0, Math.PI * 2);
    g.fill(); g.stroke();

    g.fillStyle = INK;
    g.font = "900 32px 'Segoe UI', Arial, sans-serif";
    g.textAlign = "center";
    g.fillText(sym, x, y + 11);
  }
};

/** Comic Floating Price / Alert Badge (560x260) — auto-fits text with generous internal padding so it NEVER overflows the box! */
const fxBadge = (p: Pen, text: string, sub: string, bg: string, fg: string) => {
  const g = p.g;
  g.fillStyle = INK;
  g.beginPath();
  g.roundRect(24, 34, 512, 196, 28);
  g.fill();

  g.fillStyle = bg;
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.beginPath();
  g.roundRect(16, 22, 512, 196, 28);
  g.fill();
  g.stroke();

  g.fillStyle = fg;
  g.textAlign = "center";

  // Auto-fit main heading within max width 456 px
  let mainSz = 50;
  g.font = `900 ${mainSz}px 'Segoe UI', Arial, sans-serif`;
  while (g.measureText(text).width > 456 && mainSz > 26) {
    mainSz -= 2;
    g.font = `900 ${mainSz}px 'Segoe UI', Arial, sans-serif`;
  }
  g.fillText(text, 272, 112);

  // Auto-fit subtitle within max width 456 px
  let subSz = 31;
  g.font = `800 ${subSz}px 'Segoe UI', Arial, sans-serif`;
  while (g.measureText(sub).width > 456 && subSz > 18) {
    subSz -= 2;
    g.font = `800 ${subSz}px 'Segoe UI', Arial, sans-serif`;
  }
  g.fillText(sub, 272, 174);
};

// ---------------- Character Roster ----------------
const WHO_BUDI: Who  = { i: 1, o: PAK_BUDI_OUTFIT,  okey: "budi" };
const WHO_KEVIN: Who = { i: 2, o: BRO_KEVIN_OUTFIT, okey: "kevin" };
const WHO_DARMA: Who = { i: 3, o: PAK_DARMA_OUTFIT, okey: "darma" };
const WHO_NIK: Who   = { i: 4, o: BANG_NIK_OUTFIT,  okey: "bangnik" };

// ---------------- Stage Characters & 2D Effects Across All 16 Shots ----------------
export const stage = (ws: WorldState, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const { id, f, t } = ws;
  LNAME = SHOTS[id - 1].light;
  findSun(cam, SUN);

  const addChar = (
    who: Who,
    x: number,
    y: number,
    z: number,
    fo: FrontOpts,
    scale = 0.84,
    side = false,
    mirror = false,
    so: SideOpts = {}
  ) => {
    out.places.push(person(cam, who, x, y, z, side, mirror, fo, so, scale));
    blob(out, x, y, z, scale * 0.95);
  };

  if (id === 1) {
    // Shot 1 (0..54, HERO 1 at f=35): "Ini saham, ini kripto."
    // Pak Budi (Saham Investor) on Left, Bang Nik (Host) in Center, Bro Kevin (Crypto Trader) on Right
    addChar(WHO_BUDI, -0.68, 0, -0.58, {
      mode: "stand",
      phase: q(t * 1.1, 20),
      expr: "smile",
      blink: lidAt(t, 1, [0.34]),
      tilt: liveTilt(t, 1, 2.8) + 3,
      headTilt: liveHead(t, 1, 4.0) + 3,
      prop: "cert",
      wave: q(Math.sin(t * 4.2), 10),
      look: 1,
      facing: 1,
    }, 0.82);

    const hopNik = hopY(t, 0.95, 0.36, 0.12);
    addChar(WHO_NIK, 0.0, hopNik, -0.46, {
      mode: "stand",
      phase: q(t * 1.4, 20),
      expr: t < 1.0 ? "grin" : "laugh",
      blink: lidAt(t, 4, [1.0]),
      tilt: liveTilt(t, 4, 3.4),
      headTilt: liveHead(t, 4, 4.6),
      prop: "mic",
      wave: q(Math.sin(t * 5.2), 10),
      look: t < 0.8 ? -1 : 1,
      facing: 1,
    }, 0.85);

    addChar(WHO_KEVIN, 0.68, 0, -0.58, {
      mode: "stand",
      phase: q(t * 1.2, 20),
      expr: "grin",
      blink: lidAt(t, 2, [1.20]),
      tilt: liveTilt(t, 2, 3.0) - 3,
      headTilt: liveHead(t, 2, 4.2) - 4,
      prop: "btc",
      wave: q(Math.cos(t * 4.5), 10),
      look: -1,
      facing: -1,
    }, 0.82);

    out.fx.push({
      key: "fx|badge|s1",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "SAHAM VS KRIPTO", "KENALI PERBEDAANNYA!", "#ffd43b", INK),
      x: 0.0, y: 2.02 + Math.sin(t * 3.8) * 0.03, z: -0.95,
      w: 0.78, h: 0.36,
    });
  } else if (id === 2) {
    // Shot 2 (54..99): "Sini aku jelasin bedanya." -> White Flash at 97!
    addChar(WHO_BUDI, -0.68, 0, -0.60, {
      mode: "stand",
      phase: q(t * 1.0, 20),
      expr: "smile",
      blink: lidAt(t, 1),
      tilt: liveTilt(t, 1, 2.4),
      headTilt: liveHead(t, 1, 3.5),
      prop: "cert",
      look: 1,
      facing: 1,
    }, 0.81);

    const hopNik = hopY(t, 2.55, 0.40, 0.15);
    addChar(WHO_NIK, 0.0, hopNik, -0.45, {
      mode: f >= 74 ? "march" : "stand",
      phase: q(t * 2.0, 20),
      expr: t < 2.5 - LEAD ? "grin" : "laugh",
      blink: lidAt(t, 4, [2.5]),
      tilt: liveTilt(t, 4, 3.8) + 4,
      headTilt: liveHead(t, 4, 5.0) - 4,
      prop: f >= 72 ? "point_up" : "mic",
      wave: q(Math.sin(t * 6.0), 10),
      facing: 1,
    }, 0.85);

    addChar(WHO_KEVIN, 0.68, 0, -0.60, {
      mode: "stand",
      phase: q(t * 1.1, 20),
      expr: "grin",
      blink: lidAt(t, 2),
      tilt: liveTilt(t, 2, 2.6),
      headTilt: liveHead(t, 2, 3.8),
      prop: "btc",
      look: -1,
      facing: -1,
    }, 0.81);

    if (f >= 74 && f <= 97) {
      const bt = q(clamp01((f - 74) / 22), 20);
      out.fx.push({
        key: `fx|burst|s2|${bt}`,
        cw: 500, ch: 500,
        draw: (p) => fxBurst(p, bt, "#ffd43b", 12, 36, 235),
        x: 0.08, y: 2.04, z: -0.55,
        w: 0.76, h: 0.76,
      });
    }
  } else if (id === 3) {
    // Shot 3 (99..215): "Saham adalah bukti kepemilikan atas sebagian modal sebuah perusahaan"
    const walkU = clamp01((f - 99) / 32);
    const bx = -0.68 + 0.24 * smooth(walkU);
    addChar(WHO_BUDI, bx, 0, -0.52, {
      mode: walkU < 0.95 ? "march" : "stand",
      phase: q(t * 1.8, 20),
      expr: t < 5.5 - LEAD ? "smile" : "grin",
      blink: lidAt(t, 1, [5.5]),
      tilt: liveTilt(t, 1, 3.0) + 3,
      headTilt: liveHead(t, 1, 4.4) - 3,
      prop: "cert",
      wave: q(Math.sin(t * 4.5), 10),
      look: 1,
      facing: 1,
    }, 0.84);

    addChar(WHO_DARMA, 0.54, 0, -0.56, {
      mode: "stand",
      phase: q(t * 1.0, 20),
      expr: "smile",
      blink: lidAt(t, 3),
      tilt: liveTilt(t, 3, 2.5),
      headTilt: liveHead(t, 3, 3.8),
      prop: "pointer",
      wave: q(Math.cos(t * 3.8), 10),
      look: -1,
      facing: -1,
    }, 0.84);

    out.fx.push({
      key: "fx|badge|kepemilikan",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "BUKTI KEPEMILIKAN", "MODAL PERUSAHAAN RIIL", "#2ecc71", "#ffffff"),
      x: -0.05, y: 1.98 + Math.sin(t * 3.5) * 0.04, z: -0.95,
      w: 0.78, h: 0.36,
    });
  } else if (id === 4) {
    // Shot 4 (215..290): "...yang terdaftar di Bursa Efek. Di Indonesia,"
    addChar(WHO_BUDI, -0.46, 0, -0.54, {
      mode: "stand",
      phase: q(t * 1.1, 20),
      expr: "grin",
      blink: lidAt(t, 1, [8.06]),
      tilt: liveTilt(t, 1, 2.8),
      headTilt: liveHead(t, 1, 4.2),
      prop: "cert",
      wave: q(Math.sin(t * 4.2), 10),
      look: 1,
      facing: 1,
    }, 0.84);

    addChar(WHO_DARMA, 0.48, 0, -0.54, {
      mode: "stand",
      phase: q(t * 1.05, 20),
      expr: "smile",
      blink: lidAt(t, 3, [8.40]),
      tilt: liveTilt(t, 3, 2.6),
      headTilt: liveHead(t, 3, 4.0),
      prop: "gavel",
      wave: q(Math.cos(t * 4.0), 10),
      look: -1,
      facing: -1,
    }, 0.84);

    out.fx.push({
      key: "fx|badge|bei",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "TERDAFTAR DI BEI", "BURSA EFEK INDONESIA", "#1b4d3e", "#ffe66d"),
      x: 0.0, y: 2.02 + Math.sin(t * 3.6) * 0.04, z: -0.95,
      w: 0.78, h: 0.36,
    });
  } else if (id === 5) {
    // Shot 5 (290..412, HERO 2 at f=355): "aktivitas pasar saham diawasi oleh OJK dan BEI..."
    const walkBudi = clamp01((f - 290) / 28);
    const bx5 = -0.68 + 0.16 * smooth(walkBudi);
    addChar(WHO_BUDI, bx5, 0, -0.55, {
      mode: walkBudi < 0.95 ? "march" : "stand",
      phase: q(t * 1.4, 20),
      expr: "smile",
      blink: lidAt(t, 1, [11.80]),
      tilt: liveTilt(t, 1, 2.6) + 2,
      headTilt: liveHead(t, 1, 4.0) + 3,
      prop: "cert",
      wave: q(Math.sin(t * 4.0), 10),
      look: 1,
      facing: 1,
    }, 0.84);

    const hopDarma = hopY(t, 11.80, 0.38, 0.13) + hopY(t, 12.10, 0.32, 0.10);
    addChar(WHO_DARMA, 0.48, hopDarma, -0.52, {
      mode: "stand",
      phase: q(t * 1.5, 20),
      expr: t < 11.80 - LEAD ? "stern" : "grin",
      blink: lidAt(t, 3, [11.80, 12.48]),
      tilt: liveTilt(t, 3, 3.4) - 3,
      headTilt: liveHead(t, 3, 4.6) - 3,
      prop: "gavel",
      wave: q(Math.sin(t * 5.8), 10),
      look: -1,
      facing: -1,
    }, 0.85);

    if (f >= 354 && f <= 378) {
      const bt = q(clamp01((f - 354) / 22), 20);
      out.fx.push({
        key: `fx|burst|s5|${bt}`,
        cw: 500, ch: 500,
        draw: (p) => fxBurst(p, bt, "#ffd43b", 10, 32, 220),
        x: 0.48, y: 1.98, z: -0.62,
        w: 0.68, h: 0.68,
      });
    }

    out.fx.push({
      key: "fx|badge|ojk",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "DIAWASI OJK & BEI", "AMAN & TEREGULASI RESMI", "#f39c12", "#ffffff"),
      x: 0.0, y: 1.98 + Math.sin(t * 3.6) * 0.03, z: -0.92,
      w: 0.78, h: 0.36,
    });
  } else if (id === 6) {
    // Shot 6 (412..513): "...mengikuti jam operasional bursa di hari kerja."
    addChar(WHO_BUDI, -0.46, 0, -0.54, {
      mode: "stand",
      phase: q(t * 1.0, 20),
      expr: "smile",
      blink: lidAt(t, 1, [15.20]),
      tilt: liveTilt(t, 1, 2.6),
      headTilt: liveHead(t, 1, 3.8),
      prop: "kopi",
      wave: q(Math.sin(t * 3.8), 10),
      look: 1,
      facing: 1,
    }, 0.84);

    addChar(WHO_DARMA, 0.46, 0, -0.54, {
      mode: "stand",
      phase: q(t * 1.05, 20),
      expr: "smile",
      blink: lidAt(t, 3, [16.36]),
      tilt: liveTilt(t, 3, 2.6),
      headTilt: liveHead(t, 3, 4.0),
      prop: "pointer",
      wave: q(Math.cos(t * 4.2), 10),
      look: -1,
      facing: -1,
    }, 0.84);

    out.fx.push({
      key: "fx|badge|jamkerja",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "JAM BURSA: HARI KERJA", "SENIN - JUMAT (09:00 - 16:00)", "#2980b9", "#ffffff"),
      x: 0.04, y: 1.96 + Math.sin(t * 3.4) * 0.03, z: -0.92,
      w: 0.78, h: 0.36,
    });
  } else if (id === 7) {
    // Shot 7 (513..647): "Sedangkan kripto adalah aset digital yang menggunakan teknologi blockchain"
    const walkU = clamp01((f - 513) / 34);
    const kx = 0.48 - 0.72 * smooth(walkU);
    const hopK = hopY(t, 20.62, 0.40, 0.14);
    addChar(WHO_KEVIN, kx, hopK, -0.52, {
      mode: walkU < 0.95 ? "march" : "stand",
      phase: q(t * 1.9, 20),
      expr: t < 20.62 - LEAD ? "grin" : "laugh",
      blink: lidAt(t, 2, [17.54, 20.62]),
      tilt: liveTilt(t, 2, 3.4) + 3,
      headTilt: liveHead(t, 2, 4.8) - 3,
      prop: "btc",
      wave: q(Math.sin(t * 5.2), 10),
      look: 1,
      facing: 1,
    }, 0.85);

    out.fx.push({
      key: "fx|badge|blockchain",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "ASET DIGITAL KRIPTO", "TEKNOLOGI BLOCKCHAIN", "#8e44ad", "#ffd43b"),
      x: 0.12, y: 1.98 + Math.sin(t * 3.8) * 0.04, z: -0.92,
      w: 0.78, h: 0.36,
    });
  } else if (id === 8) {
    // Shot 8 (647..796): "bersifat terdesentralisasi tanpa otoritas pusat yang mengatur seluruh transaksinya."
    addChar(WHO_KEVIN, -0.32, 0, -0.52, {
      mode: "stand",
      phase: q(t * 1.2, 20),
      expr: t < 23.42 - LEAD ? "grin" : "laugh",
      blink: lidAt(t, 2, [22.08, 23.76]),
      tilt: liveTilt(t, 2, 3.2),
      headTilt: liveHead(t, 2, 4.6),
      prop: "phone",
      wave: q(Math.sin(t * 4.8), 10),
      look: 1,
      facing: 1,
    }, 0.85);

    out.fx.push({
      key: "fx|badge|decentral",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "TERDESENTRALISASI", "TANPA OTORITAS PUSAT!", "#00a8ff", "#ffffff"),
      x: 0.14, y: 1.96 + Math.sin(t * 3.6) * 0.04, z: -0.90,
      w: 0.78, h: 0.36,
    });
  } else if (id === 9) {
    // Shot 9 (796..990): "Menariknya, perdagangan kripto bisa dilakukan kapan saja, 24 jam sehari & 7 hari seminggu."
    const jump1 = hopY(t, 30.20, 0.44, 0.17);
    const jump2 = hopY(t, 31.88, 0.40, 0.14);
    const excited = f >= 862;
    addChar(WHO_KEVIN, -0.26, jump1 + jump2, -0.50, {
      mode: excited ? "march" : "stand",
      phase: q(t * (excited ? 2.2 : 1.2), 20),
      expr: excited ? "laugh" : "grin",
      blink: lidAt(t, 2, [30.20, 31.88]),
      tilt: liveTilt(t, 2, excited ? 4.4 : 2.8) + (excited ? 4 : 0),
      headTilt: liveHead(t, 2, 5.0),
      prop: excited ? "point_up" : "btc",
      wave: q(Math.sin(t * 6.0), 10),
      facing: 1,
    }, 0.85);

    out.fx.push({
      key: "fx|badge|247",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "BUKA 24 JAM / 7 HARI!", "TRADING NON-STOP KAPAN SAJA", "#2ecc71", "#ffffff"),
      x: 0.16, y: 1.96 + Math.sin(t * 4.2) * 0.04, z: -0.88,
      w: 0.78, h: 0.36,
    });
  } else if (id === 10) {
    // Shot 10 (990..1123, HERO 3 at f=1050): "Contohnya seperti Bitcoin, Ethereum, dan Solana."
    const hopK10 = hopY(t, 35.47, 0.40, 0.15);
    addChar(WHO_KEVIN, -0.44, hopK10, -0.52, {
      mode: f >= 1064 ? "march" : "stand",
      phase: q(t * 1.5, 20),
      expr: "laugh",
      blink: lidAt(t, 2, [34.02, 35.47]),
      tilt: liveTilt(t, 2, 3.4) + 3,
      headTilt: liveHead(t, 2, 4.6) + 3,
      prop: "btc",
      wave: q(Math.sin(t * 5.2), 10),
      look: 1,
      facing: 1,
    }, 0.84);

    const cp = q(t, 15);
    out.fx.push({
      key: `fx|crypto|${cp}`,
      cw: 520, ch: 520,
      draw: (p) => fxCryptoSwarm(p, cp),
      x: 0.42, y: 2.02, z: -1.10,
      w: 0.72, h: 0.72,
    });

    out.fx.push({
      key: "fx|badge|btcehtsol",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "BTC • ETH • SOLANA", "KOIN KRIPTO POPULER", "#f39c12", INK),
      x: -0.04, y: 1.98 + Math.sin(t * 3.5) * 0.03, z: -0.92,
      w: 0.76, h: 0.35,
    });
  } else if (id === 11) {
    // Shot 11 (1123..1397, HERO 4 at f=1250): "saham cenderung memiliki mekanisme pengendalian seperti auto rejection..."
    const hopD11 = hopY(t, 40.86, 0.38, 0.13);
    addChar(WHO_DARMA, -0.48, hopD11, -0.54, {
      mode: "stand",
      phase: q(t * 1.3, 20),
      expr: t < 40.86 - LEAD ? "stern" : "smile",
      blink: lidAt(t, 3, [40.86, 42.62]),
      tilt: liveTilt(t, 3, 3.0) + 3,
      headTilt: liveHead(t, 3, 4.4) + 3,
      prop: "pointer",
      wave: q(Math.sin(t * 5.0), 10),
      look: 1,
      facing: 1,
    }, 0.85);

    const hopB11 = hopY(t, 42.00, 0.36, 0.12);
    addChar(WHO_BUDI, 0.48, hopB11, -0.54, {
      mode: "stand",
      phase: q(t * 1.2, 20),
      expr: "grin",
      blink: lidAt(t, 1, [41.12, 42.00]),
      tilt: liveTilt(t, 1, 2.8) - 2,
      headTilt: liveHead(t, 1, 4.2) - 3,
      prop: "cert",
      wave: q(Math.cos(t * 4.4), 10),
      look: -1,
      facing: -1,
    }, 0.84);

    out.fx.push({
      key: "fx|badge|ara",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "ADA AUTO REJECTION!", "BATAS AMAN NAIK & TURUN", "#1e824c", "#ffffff"),
      x: 0.0, y: 1.98 + Math.sin(t * 3.6) * 0.03, z: -0.92,
      w: 0.78, h: 0.36,
    });
  } else if (id === 12) {
    // Shot 12 (1397..1529): "harga saham juga dipengaruhi oleh kinerja keuangan dan kondisi perusahaan."
    addChar(WHO_DARMA, -0.50, 0, -0.56, {
      mode: "stand",
      phase: q(t * 1.0, 20),
      expr: "smile",
      blink: lidAt(t, 3),
      tilt: liveTilt(t, 3, 2.5),
      headTilt: liveHead(t, 3, 3.8),
      prop: "gavel",
      look: 1,
      facing: 1,
    }, 0.84);

    const hopBudi = hopY(t, 48.44, 0.38, 0.13);
    addChar(WHO_BUDI, 0.44, hopBudi, -0.50, {
      mode: "stand",
      phase: q(t * 1.25, 20),
      expr: "laugh",
      blink: lidAt(t, 1, [48.44]),
      tilt: liveTilt(t, 1, 3.0),
      headTilt: liveHead(t, 1, 4.4),
      prop: "calc",
      wave: q(Math.sin(t * 4.8), 10),
      look: -1,
      facing: -1,
    }, 0.85);

    out.fx.push({
      key: "fx|badge|kinerja",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "KINERJA KEUANGAN", "LABA & FUNDAMENTAL BISNIS", "#f39c12", "#ffffff"),
      x: 0.0, y: 1.96 + Math.sin(t * 3.5) * 0.03, z: -0.92,
      w: 0.78, h: 0.36,
    });
  } else if (id === 13) {
    // Shot 13 (1529..1728, HERO 5 at f=1630): "Sedangkan kripto punya pergerakan harga yang jauh lebih fluktuatif tanpa batas auto rejection..."
    const shockHop = hopY(t, 53.84, 0.42, 0.18) + hopY(t, 55.56, 0.38, 0.14);
    addChar(WHO_KEVIN, -0.36, shockHop, -0.52, {
      mode: "stand",
      phase: q(t * 1.8, 20),
      expr: t < 53.5 - LEAD ? "nervous" : "shock",
      blink: lidAt(t, 2, [53.84, 55.56]),
      tilt: liveTilt(t, 2, 4.5) - 5,
      headTilt: liveHead(t, 2, 5.8) - 4,
      prop: "phone",
      wave: q(Math.sin(t * 7.5), 10),
      look: 1,
      facing: 1,
    }, 0.85);

    addChar(WHO_BUDI, 0.52, 0, -0.56, {
      mode: "stand",
      phase: q(t * 1.1, 20),
      expr: "shock",
      blink: lidAt(t, 1, [54.62]),
      tilt: liveTilt(t, 1, 3.0) + 4,
      headTilt: liveHead(t, 1, 4.2) + 4,
      prop: "cert",
      look: -1,
      facing: -1,
    }, 0.83);

    // Circling dizzy stars above shocked Bro Kevin
    const st = q(t * 0.9, 20);
    out.fx.push({
      key: `fx|stars|s13|${st}`,
      cw: 420, ch: 210,
      draw: (p) => fxStars(p, st),
      x: -0.44, y: 1.88, z: -0.48,
      w: 0.52, h: 0.26,
    });

    out.fx.push({
      key: "fx|badge|fluktuatif",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "FLUKTUATIF EKSTREM!", "TANPA BATAS AUTO REJECTION", "#ff4757", "#ffffff"),
      x: 0.14, y: 2.16 + Math.sin(t * 4.8) * 0.04, z: -0.92,
      w: 0.78, h: 0.36,
    });
  } else if (id === 14) {
    // Shot 14 (1728..1924): "Nilainya bisa berubah drastis karena dipengaruhi sentimen pasar, tren komunitas, hingga likuiditas global."
    addChar(WHO_KEVIN, -0.48, 0, -0.54, {
      mode: "stand",
      phase: q(t * 1.3, 20),
      expr: t < 60.28 - LEAD ? "shock" : "nervous",
      blink: lidAt(t, 2, [58.68, 60.28]),
      tilt: liveTilt(t, 2, 3.6) - 3,
      headTilt: liveHead(t, 2, 4.8),
      prop: "phone",
      wave: q(Math.sin(t * 5.2), 10),
      look: 1,
      facing: 1,
    }, 0.84);

    const walkU = clamp01((f - 1785) / 28);
    const nx = 0.82 - 0.36 * smooth(walkU);
    addChar(WHO_NIK, nx, 0, -0.50, {
      mode: walkU < 0.95 ? "march" : "stand",
      phase: q(t * 1.8, 20),
      expr: "grin",
      blink: lidAt(t, 4, [61.66]),
      tilt: liveTilt(t, 4, 3.0),
      headTilt: liveHead(t, 4, 4.4),
      prop: "mic",
      wave: q(Math.cos(t * 4.6), 10),
      look: -1,
      facing: -1,
    }, 0.84);

    const ct = q(t, 15);
    out.fx.push({
      key: `fx|creak|s14|${ct}`,
      cw: 300, ch: 300,
      draw: (p) => fxCreak(p, ct),
      x: -0.48, y: 1.95, z: -0.50,
      w: 0.45, h: 0.45,
    });

    out.fx.push({
      key: "fx|badge|sentimen",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "SENTIMEN & HYPE PASAR", "TREN KOMUNITAS & GLOBAL", "#8e44ad", "#ffd43b"),
      x: 0.04, y: 1.98 + Math.sin(t * 3.8) * 0.04, z: -0.92,
      w: 0.78, h: 0.36,
    });
  } else if (id === 15) {
    // Shot 15 (1924..2052): "Jadi, siapa nih yang habis gajian langsung kepikiran buat investasi saham?"
    const hopBudi = hopY(t, 65.76, 0.44, 0.16);
    addChar(WHO_BUDI, -0.58, hopBudi, -0.54, {
      mode: "stand",
      phase: q(t * 1.4, 20),
      expr: "laugh",
      blink: lidAt(t, 1, [65.76]),
      tilt: liveTilt(t, 1, 3.2) + 3,
      headTilt: liveHead(t, 1, 4.5),
      prop: "cert",
      wave: q(Math.sin(t * 5.2), 10),
      look: 1,
      facing: 1,
    }, 0.84);

    addChar(WHO_NIK, 0.0, 0, -0.46, {
      mode: "stand",
      phase: q(t * 1.3, 20),
      expr: "grin",
      blink: lidAt(t, 4, [67.26]),
      tilt: liveTilt(t, 4, 3.0),
      headTilt: liveHead(t, 4, 4.4),
      prop: "mic",
      wave: q(Math.sin(t * 4.8), 10),
      facing: 1,
    }, 0.85);

    addChar(WHO_KEVIN, 0.58, 0, -0.54, {
      mode: "stand",
      phase: q(t * 1.2, 20),
      expr: "smile",
      blink: lidAt(t, 2),
      tilt: liveTilt(t, 2, 2.8) - 3,
      headTilt: liveHead(t, 2, 4.0),
      prop: "btc",
      wave: q(Math.cos(t * 4.5), 10),
      look: -1,
      facing: -1,
    }, 0.84);

    const mp = q(t, 15);
    out.fx.push({
      key: `fx|money|s15|${mp}`,
      cw: 520, ch: 520,
      draw: (p) => fxMoneyFly(p, mp),
      x: -0.52, y: 2.02, z: -0.58,
      w: 0.68, h: 0.68,
    });

    out.fx.push({
      key: "fx|badge|gajian",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "HABIS GAJIAN?", "INVESTASI SAHAM ATAU KRIPTO?", "#2ecc71", "#ffffff"),
      x: 0.04, y: 1.98 + Math.sin(t * 3.8) * 0.03, z: -0.92,
      w: 0.78, h: 0.36,
    });
  } else {
    // Shot 16 (2052..2121): "Komen AI kalau mau buat video kayak gini"
    addChar(WHO_BUDI, -0.62, 0, -0.56, {
      mode: "stand",
      phase: q(t * 1.2, 20),
      expr: "laugh",
      blink: lidAt(t, 1),
      tilt: liveTilt(t, 1, 2.8),
      headTilt: liveHead(t, 1, 4.0),
      prop: "cert",
      wave: q(Math.sin(t * 5.5), 10),
      look: 1,
      facing: 1,
    }, 0.83);

    const hopCta = hopY(t, 68.76, 0.42, 0.16);
    addChar(WHO_NIK, 0.0, hopCta, -0.44, {
      mode: "stand",
      phase: q(t * 1.8, 20),
      expr: "laugh",
      blink: lidAt(t, 4, [68.76]),
      tilt: liveTilt(t, 4, 3.8) + 4,
      headTilt: liveHead(t, 4, 5.0),
      prop: "point_up",
      wave: q(Math.sin(t * 6.2), 10),
      facing: 1,
    }, 0.86);

    addChar(WHO_KEVIN, 0.62, 0, -0.56, {
      mode: "stand",
      phase: q(t * 1.2, 20),
      expr: "laugh",
      blink: lidAt(t, 2),
      tilt: liveTilt(t, 2, 2.8),
      headTilt: liveHead(t, 2, 4.0),
      prop: "btc",
      wave: q(Math.cos(t * 5.5), 10),
      look: -1,
      facing: -1,
    }, 0.83);

    out.fx.push({
      key: "fx|badge|komenai",
      cw: 560, ch: 260,
      draw: (p) => fxBadge(p, "KOMEN 'AI' DI BAWAH!", "MAU BIKIN VIDEO KAYAK GINI?", "#ff4757", "#ffffff"),
      x: 0.0, y: 2.02 + Math.sin(t * 4.5) * 0.04, z: -0.88,
      w: 0.78, h: 0.36,
    });

    if (f >= 2060 && f <= 2100) {
      const bt = q(clamp01((f - 2060) / 36), 20);
      out.fx.push({
        key: `fx|burst|s16|${bt}`,
        cw: 500, ch: 500,
        draw: (p) => fxBurst(p, bt, "#ffd43b", 12, 36, 235),
        x: 0.0, y: 2.05, z: -0.52,
        w: 0.76, h: 0.76,
      });
    }
  }

  return out;
};
