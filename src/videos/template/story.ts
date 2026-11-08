// Timeline of "Perbedaan Saham vs Kripto": 16 shots & 42+ multi-angle camera beats
// locked to Suara original/Saham & crypto.srt (2121 frames @ 30 fps = 70.65 s).
// Camera grammar from skill/references/reports/motion.md & Gold Benchmark kosan/story.ts:
// - Continuous slow push-ins (0.22-0.35%/f, 0.65%/f punch on emphasis words)
// - Symmetric smootherstep glides (18-26 f)
// - Hard cuts on dramatic reframes (Macro Prop Inserts, Low-Angle Dutch Tilts, High-Angle Cranes)
// - 7-frame sign-flipping impact kicks on punchline words; 4-frame white flash after hook (FLASH_AT = 97).
import { LightName } from "./lights";

export const FPS = 30;
export const TOTAL = 2121;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export type ShotDef = {
  id: number;
  a: number;
  b: number;
  light: LightName;
  sunAz?: number;
  sunEl?: number;
};

// 16 Shots locked to Suara original/Saham & crypto.srt
export const SHOTS: ShotDef[] = [
  { id: 1,  a: 0,    b: 54,   light: "golden", sunAz: 52, sunEl: 38 }, // 0.0-1.8s: "Ini saham, ini kripto." (HERO 1 at f=35)
  { id: 2,  a: 54,   b: 99,   light: "golden", sunAz: 50, sunEl: 38 }, // 1.8-3.3s: "Sini aku jelasin bedanya." -> FLASH_AT 97
  { id: 3,  a: 99,   b: 215,  light: "day",    sunAz: 56, sunEl: 44 }, // 3.3-7.2s: "Saham adalah bukti kepemilikan atas sebagian modal sebuah perusahaan"
  { id: 4,  a: 215,  b: 290,  light: "day",    sunAz: 54, sunEl: 43 }, // 7.2-9.7s: "yang terdaftar di Bursa Efek. Di Indonesia,"
  { id: 5,  a: 290,  b: 412,  light: "day",    sunAz: 58, sunEl: 45 }, // 9.7-13.7s: "aktivitas pasar saham diawasi oleh OJK dan BEI dengan waktu..." (HERO 2 at f=355)
  { id: 6,  a: 412,  b: 513,  light: "day",    sunAz: 55, sunEl: 44 }, // 13.7-17.1s: "perdagangan yang mengikuti jam operasional bursa di hari kerja."
  { id: 7,  a: 513,  b: 647,  light: "night",  sunAz: 46, sunEl: 36 }, // 17.1-21.6s: "Sedangkan kripto adalah aset digital yang menggunakan teknologi blockchain dan"
  { id: 8,  a: 647,  b: 796,  light: "night",  sunAz: 48, sunEl: 36 }, // 21.6-26.5s: "bersifat terdesentralisasi tanpa otoritas pusat yang mengatur seluruh transaksinya."
  { id: 9,  a: 796,  b: 990,  light: "night",  sunAz: 44, sunEl: 35 }, // 26.5-33.0s: "Menariknya, perdagangan kripto bisa dilakukan kapan saja, 24 jam sehari & 7 hari seminggu."
  { id: 10, a: 990,  b: 1123, light: "night",  sunAz: 48, sunEl: 37 }, // 33.0-37.4s: "Contohnya seperti Bitcoin, Ethereum, dan Solana. Dari sisi pergerakan" (HERO 3 at f=1050)
  { id: 11, a: 1123, b: 1397, light: "golden", sunAz: 52, sunEl: 39 }, // 37.4-46.6s: "harga, saham cenderung memiliki mekanisme pengendalian seperti auto rejection..." (HERO 4 at f=1250)
  { id: 12, a: 1397, b: 1529, light: "golden", sunAz: 54, sunEl: 40 }, // 46.6-51.0s: "harga saham juga dipengaruhi oleh kinerja keuangan dan kondisi perusahaan."
  { id: 13, a: 1529, b: 1728, light: "space",  sunAz: 48, sunEl: 36 }, // 51.0-57.6s: "Sedangkan kripto punya pergerakan harga yang jauh lebih fluktuatif tanpa batas auto rejection..." (HERO 5 at f=1630)
  { id: 14, a: 1728, b: 1924, light: "space",  sunAz: 46, sunEl: 36 }, // 57.6-64.1s: "Nilainya bisa berubah drastis karena dipengaruhi sentimen pasar, tren komunitas, hingga likuiditas global."
  { id: 15, a: 1924, b: 2052, light: "golden", sunAz: 52, sunEl: 40 }, // 64.1-68.4s: "Jadi, siapa nih yang habis gajian langsung kepikiran buat investasi saham?"
  { id: 16, a: 2052, b: TOTAL, light: "golden", sunAz: 54, sunEl: 42 }, // 68.4-70.7s: "Komen AI kalau mau buat video kayak gini"
];

export const XFADE: Record<number, number> = { 5: 6, 7: 6, 11: 6, 13: 6, 15: 8 };
export const FLASH_AT = 97;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) {
      return [
        { id: s.id - 1, alpha: 1 },
        { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) },
      ];
    }
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

export type WorldState = {
  id: number;
  f: number;
  t: number;
  u: number;
  setKind: "split" | "bursa" | "crypto" | "ara" | "volatile";
  showStars: boolean;
  showMoon: boolean;
  coinRot: number;
};

export const worldState = (id: number, f: number): WorldState => {
  const s = SHOTS[id - 1];
  const u = clamp01((f - s.a) / Math.max(1, s.b - s.a));
  const t = f / FPS;

  let setKind: WorldState["setKind"] = "split";
  let showStars = false;
  let showMoon = false;

  if (id === 1 || id === 2 || id === 15 || id === 16) {
    setKind = "split";
    showStars = id >= 15;
  } else if (id >= 3 && id <= 6) {
    setKind = "bursa";
  } else if (id >= 7 && id <= 10) {
    setKind = "crypto";
    showStars = true;
    showMoon = true;
  } else if (id === 11 || id === 12) {
    setKind = "ara";
  } else {
    setKind = "volatile";
    showStars = true;
    showMoon = true;
  }

  return {
    id,
    f,
    t,
    u,
    setKind,
    showStars,
    showMoon,
    coinRot: t * 2.4,
  };
};

// ---------------- Reference Camera Engine ----------------
export type CamPose = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<CamPose> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

const mix = (a: CamPose, b: CamPose, k: number): CamPose => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): CamPose => ({ fov: 38, roll: 0, ...c });
const run = (keys: Key[], f: number): CamPose => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 22)));
  }
  return cur;
};
const T = (f: number) => f / FPS;

/** Push-in factor since f0: subject grows ~rate per frame; `punch` raises it for the first n frames */
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 28) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 7, (n - i - 0.5) / 7));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<CamPose> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<CamPose> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });

// ---- 42+ Multi-Angle Beat Framings (Extreme Scale Contrast: Wide <-> Macro Prop Insert <-> OTS <-> Low-Angle Dutch <-> High-Angle Crane) ----
// Shot 1 (0..54): Tight Low-Angle Dutch MCU on Pak Budi & Saham Tower -> Fast whip-glide to HERO 1 (f=35) Split Arena ("Ini saham, ini kripto.")
const S1a = (f: number) => dolly([-0.68, 1.16, 2.95], [-0.62, 1.38, -0.68], pushK(f, 0, 0.0035, 0.007, 16), { fov: 35, roll: -0.06 });
const S1b = (f: number) => dolly([0.0, 1.76, 5.95], [0.0, 1.32, -1.25], pushK(f, 18, 0.0024, 0.006, 20), { fov: 39, roll: 0.015 });

// Shot 2 (54..99): Hard cut to tight OTS/MCU on Bang Nik ("Sini aku jelasin bedanya.") -> Dutch snap-zoom into White Flash at 97!
const S2a = (f: number) => dolly([0.24, 1.48, 3.05], [0.0, 1.40, -0.52], pushK(f, 54, 0.0032, 0.0065, 18), { fov: 35, roll: -0.045 });
const S2b = (f: number) => dolly([-0.18, 1.38, 2.45], [0.0, 1.44, -0.45], pushK(f, 74, 0.0038, 0.0085, 22), { fov: 32, roll: 0.065 });

// Shot 3 (99..215): Bursa Efek establishing -> Hard cut Macro Insert on Corporate Podium & Bursa Bell -> OTS Two-Shot
const S3a = (f: number) => dolly([-0.48, 1.72, 5.45], [-0.08, 1.35, -1.25], pushK(f, 99, 0.0026), { fov: 39, roll: -0.03 });
const S3b = (f: number) => dolly([-0.68, 1.44, 2.35], [-0.88, 1.38, -2.05], pushK(f, 142, 0.0032, 0.007, 22), { fov: 33, roll: 0.05 });
const S3c = (f: number) => dolly([0.42, 1.54, 4.15], [-0.15, 1.38, -0.85], pushK(f, 180, 0.0028), { fov: 36, roll: -0.035 });

// Shot 4 (215..290): Low heroic tilt up at BEI Ticker -> Glide to Two-Shot ("terdaftar di Bursa Efek. Di Indonesia,")
const S4a = (f: number) => dolly([-0.55, 1.08, 4.25], [-0.05, 1.85, -1.75], pushK(f, 215, 0.003, 0.006, 20), { fov: 37, roll: -0.055 });
const S4b = (f: number) => dolly([0.45, 1.58, 4.65], [0.02, 1.38, -1.05], pushK(f, 252, 0.0026, 0.0055, 22), { fov: 37, roll: 0.035 });

// Shot 5 (290..412): OTS behind Pak Budi -> HERO 2 (f=355) Bursa Hall Two-Shot ("diawasi oleh OJK dan BEI") -> Hard cut Macro ECU on Pak Darma Gavel & OJK Desk -> Whip-glide up to Wall Clock!
const S5a = (f: number) => dolly([-0.68, 1.58, 3.85], [0.32, 1.38, -1.05], pushK(f, 290, 0.0028), { fov: 37, roll: -0.04 });
const S5b = (f: number) => dolly([0.08, 1.74, 5.75], [0.0, 1.35, -1.25], pushK(f, 322, 0.0022), { fov: 39, roll: 0.015 });
const S5c = (f: number) => dolly([0.54, 1.36, 2.38], [0.58, 1.24, -1.05], pushK(f, 360, 0.0035, 0.0075, 20), { fov: 33, roll: -0.055 });
const S5d = (f: number) => dolly([0.48, 2.08, 2.65], [0.86, 2.22, -3.35], pushK(f, 390, 0.0032, 0.0065, 20), { fov: 34, roll: 0.045 });

// Shot 6 (412..513): Macro hold on 09:00-16:00 Operational Wall Clock -> Pull back to High-Angle Two-Shot ("jam operasional bursa di hari kerja.")
const S6a = (f: number) => dolly([0.42, 2.05, 2.85], [0.86, 2.15, -3.25], pushK(f, 412, 0.0028, 0.006, 24), { fov: 34, roll: 0.045 });
const S6b = (f: number) => dolly([-0.38, 1.68, 4.85], [0.05, 1.38, -1.05], pushK(f, 458, 0.0026), { fov: 38, roll: -0.035 });

// Shot 7 (513..647): Low Dutch push-in on Bro Kevin & Bitcoin -> Hard cut Macro Crane up to 3D Blockchain Cubes & Laser Link
const S7a = (f: number) => dolly([0.52, 1.12, 3.65], [-0.22, 1.38, -0.75], pushK(f, 513, 0.003, 0.0065, 26), { fov: 36, roll: -0.06 });
const S7b = (f: number) => dolly([-0.15, 2.15, 2.85], [0.58, 2.42, -3.05], pushK(f, 582, 0.0032, 0.007, 24), { fov: 34, roll: 0.055 });

// Shot 8 (647..796): Wide diagonal cyber framing -> Hard cut ECU on Bro Kevin's Phone ("tanpa otoritas pusat") -> Lateral glide across nodes
const S8a = (f: number) => dolly([-0.82, 1.68, 5.15], [0.10, 1.36, -1.15], pushK(f, 647, 0.0025), { fov: 39, roll: 0.035 });
const S8b = (f: number) => dolly([0.12, 1.46, 2.55], [-0.32, 1.42, -0.52], pushK(f, 700, 0.0034, 0.0075, 24), { fov: 32, roll: -0.06 });
const S8c = (f: number) => zoom([-0.25, 1.62, 4.85], [0.15, 1.38, -1.10], 37, pushK(f, 752, 0.0026), { roll: 0.035 });

// Shot 9 (796..990): Desk-level Macro Insert on Dual 24/7 Trading Monitors -> Whip-glide to Bro Kevin jumping ("24 jam sehari & 7 hari seminggu!") -> Low Heroic Dutch
const S9a = (f: number) => dolly([-0.48, 1.24, 2.35], [-0.88, 1.14, -1.95], pushK(f, 796, 0.0032, 0.007, 24), { fov: 33, roll: -0.05 });
const S9b = (f: number) => dolly([0.42, 1.54, 4.45], [-0.08, 1.42, -0.95], pushK(f, 858, 0.0028, 0.0065, 26), { fov: 37, roll: 0.045 });
const S9c = (f: number) => dolly([-0.34, 1.08, 2.95], [-0.22, 1.48, -0.55], pushK(f, 928, 0.0035, 0.0075, 26), { fov: 34, roll: -0.065 });

// Shot 10 (990..1123): Macro Prop Insert sweeping across BTC/ETH/SOL pedestals -> Crane pull-back to HERO 3 (f=1050) Wide Cyber Lab -> Hard cut Low-Angle Dutch Close-Up on Bro Kevin & Bitcoin!
const S10a = (f: number) => dolly([0.66, 1.38, 2.35], [0.64, 1.28, -2.08], pushK(f, 985, 0.0032, 0.007, 20), { fov: 34, roll: 0.05 });
const S10b = (f: number) => dolly([-0.08, 1.74, 5.75], [0.02, 1.34, -1.25], pushK(f, 1020, 0.0022), { fov: 39, roll: -0.015 });
const S10c = (f: number) => dolly([-0.52, 1.12, 2.65], [-0.44, 1.42, -0.52], pushK(f, 1064, 0.0035, 0.0075, 22), { fov: 33, roll: 0.065 });

// Shot 11 (1123..1397): ARA Set reveal -> HERO 4 (f=1250) Auto Rejection Two-Shot -> Hard cut High-Angle Macro Insert on 3D Green Bars hitting ARA Guardrail -> High-angle crane onto Laporan Keuangan Table!
const S11a = (f: number) => dolly([-0.68, 1.58, 4.85], [-0.15, 1.36, -1.15], pushK(f, 1123, 0.0026), { fov: 38, roll: -0.035 });
const S11b = (f: number) => dolly([0.08, 1.76, 5.80], [0.0, 1.34, -1.25], pushK(f, 1210, 0.0022), { fov: 39, roll: 0.015 });
const S11c = (f: number) => dolly([-0.82, 2.05, 1.85], [-0.66, 1.66, -2.10], pushK(f, 1260, 0.0034, 0.0075, 22), { fov: 34, roll: -0.05 });
const S11d = (f: number) => dolly([0.92, 2.38, 1.95], [0.76, 1.02, -1.80], pushK(f, 1294, 0.003, 0.0065, 22), { fov: 34, roll: 0.045 });
const S11e = (f: number) => dolly([0.42, 1.62, 4.65], [0.05, 1.38, -1.05], pushK(f, 1348, 0.0025), { fov: 37, roll: -0.03 });

// Shot 12 (1397..1529): High-angle macro insert on Laporan Keuangan Table -> Low heroic push-in on Pak Budi & Calculator
const S12a = (f: number) => dolly([0.88, 2.38, 2.05], [0.76, 0.98, -1.78], pushK(f, 1397, 0.003, 0.0065, 24), { fov: 34, roll: 0.045 });
const S12b = (f: number) => dolly([0.18, 1.38, 3.15], [0.42, 1.40, -0.52], pushK(f, 1456, 0.0032, 0.007, 26), { fov: 34, roll: -0.045 });

// Shot 13 (1529..1728): Storm Room Dutch tilt -> HERO 5 (f=1630) Shocked Bro Kevin + Giant Rollercoaster Chart -> High-Angle Whip-Zoom onto Giant Spike & Crash -> Hard cut ECU on terrified Bro Kevin!
const S13a = (f: number) => dolly([-0.75, 1.18, 4.35], [-0.25, 1.45, -1.25], pushK(f, 1529, 0.003, 0.0065, 26), { fov: 38, roll: -0.065 });
const S13b = (f: number) => dolly([-0.08, 1.74, 5.75], [0.0, 1.34, -1.22], pushK(f, 1595, 0.0022), { fov: 39, roll: -0.02 });
const S13c = (f: number) => dolly([-0.78, 2.24, 1.95], [-0.66, 1.68, -2.10], pushK(f, 1638, 0.0034, 0.0075, 20), { fov: 35, roll: -0.08 });
const S13d = (f: number) => dolly([-0.36, 1.52, 2.38], [-0.36, 1.45, -0.52], pushK(f, 1668, 0.0038, 0.0085, 24), { fov: 31, roll: 0.085 });

// Shot 14 (1728..1924): Macro Prop Insert on Global Sentiment & Liquidity Sphere -> Two-shot with Bang Nik -> Crane pull-back on "likuiditas global"
const S14a = (f: number) => dolly([0.56, 1.48, 2.55], [0.76, 1.28, -2.02], pushK(f, 1728, 0.0032, 0.007, 24), { fov: 33, roll: -0.055 });
const S14b = (f: number) => dolly([-0.42, 1.56, 4.25], [0.05, 1.38, -0.85], pushK(f, 1798, 0.0028, 0.006, 26), { fov: 36, roll: 0.045 });
const S14c = (f: number) => zoom([0.18, 1.82, 5.45], [0.0, 1.36, -1.15], 38, pushK(f, 1868, 0.0025), { roll: -0.035 });

// Shot 15 (1924..2052): Return to Split Stage -> Hard cut Close-Up on Pak Budi & Flying Money ("habis gajian langsung kepikiran buat investasi saham?")
const S15a = (f: number) => dolly([-0.38, 1.68, 5.25], [-0.05, 1.36, -1.05], pushK(f, 1924, 0.0026), { fov: 38, roll: -0.03 });
const S15b = (f: number) => dolly([-0.42, 1.48, 2.85], [-0.54, 1.42, -0.54], pushK(f, 1973, 0.0034, 0.0075, 24), { fov: 33, roll: 0.05 });

// Shot 16 (2052..2121): Final CTA punch push-in on Bang Nik ("Komen AI kalau mau buat video kayak gini!")
const S16a = (f: number) => dolly([0.16, 1.50, 3.25], [0.0, 1.40, -0.48], pushK(f, 2052, 0.0035, 0.008, 28), { fov: 34, roll: 0.045 });

const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: S1a },              // Tight Low-Angle Dutch MCU on Pak Budi & Saham Tower
    { f: 18, dur: 15, s: S1b },    // Fast whip-glide to Hero 1 Split Arena (f=35)
  ],
  2: [
    { f: 54, cut: true, s: S2a },  // Hard cut to tight MCU on Bang Nik
    { f: 74, dur: 14, s: S2b },    // Snap zoom + Dutch tilt into White Flash at 97!
  ],
  3: [
    { f: 99, s: S3a },
    { f: 142, cut: true, s: S3b }, // Hard cut Macro Insert on Corporate Podium & Bursa Bell
    { f: 180, dur: 20, s: S3c },
  ],
  4: [
    { f: 215, s: S4a },
    { f: 252, dur: 20, s: S4b },
  ],
  5: [
    { f: 290, s: S5a },
    { f: 322, dur: 18, s: S5b },   // Settles into Hero 2 Bursa Hall Two-Shot at f=355
    { f: 360, cut: true, s: S5c }, // Hard cut Macro ECU on Pak Darma Gavel & OJK Desk
    { f: 390, dur: 15, s: S5d },   // Whip-glide up to 09:00-16:00 Wall Clock
  ],
  6: [
    { f: 412, s: S6a },
    { f: 458, dur: 20, s: S6b },
  ],
  7: [
    { f: 513, s: S7a },
    { f: 582, cut: true, s: S7b }, // Hard cut Macro Crane on 3D Blockchain Cubes
  ],
  8: [
    { f: 647, s: S8a },
    { f: 700, cut: true, s: S8b }, // Hard cut ECU on Bro Kevin's Phone
    { f: 752, dur: 20, s: S8c },
  ],
  9: [
    { f: 796, s: S9a },            // Desk-level Macro Insert on Dual 24/7 Monitors
    { f: 858, dur: 20, s: S9b },
    { f: 928, cut: true, s: S9c }, // Hard cut Low Heroic Dutch on jumping Bro Kevin
  ],
  10: [
    { f: 990, s: S10a },           // Macro Prop Insert sweeping across BTC/ETH/SOL pedestals
    { f: 1020, dur: 18, s: S10b }, // Smootherstep crane pull-back to Hero 3 Wide Cyber Lab (f=1050)
    { f: 1064, cut: true, s: S10c }, // Hard cut Low-Angle Dutch Close-Up on Bro Kevin & Bitcoin
  ],
  11: [
    { f: 1123, s: S11a },
    { f: 1210, dur: 20, s: S11b }, // Settles into Hero 4 Auto Rejection Two-Shot (f=1250)
    { f: 1260, cut: true, s: S11c }, // Hard cut Macro Insert on 3D Green Bars hitting ARA Guardrail
    { f: 1294, dur: 16, s: S11d }, // Whip-glide top-down onto Laporan Keuangan Table
    { f: 1348, dur: 20, s: S11e },
  ],
  12: [
    { f: 1397, s: S12a },
    { f: 1456, cut: true, s: S12b },
  ],
  13: [
    { f: 1529, s: S13a },
    { f: 1595, dur: 18, s: S13b }, // Settles into Hero 5 Storm Room Wide (f=1630)
    { f: 1638, dur: 14, s: S13c }, // Whip-zoom up Giant Green Pump Spike & Red Crash Arrow
    { f: 1668, cut: true, s: S13d }, // Hard snap-cut ECU on terrified Bro Kevin ("tanpa batas auto rejection!")
  ],
  14: [
    { f: 1728, s: S14a },          // Macro Insert on Global Sentiment & Liquidity Sphere
    { f: 1798, dur: 20, s: S14b },
    { f: 1868, dur: 20, s: S14c },
  ],
  15: [
    { f: 1924, s: S15a },
    { f: 1973, cut: true, s: S15b },
  ],
  16: [
    { f: 2052, s: S16a },
  ],
};

// Impact kicks on punchline words & hard angle cuts
const KICKS: [number, number][] = [
  [0.60, 0.85],  // whip-glide to Split Arena (f=18)
  [1.20, 0.95],  // "kripto." (f=36)
  [1.80, 0.90],  // cut to Bang Nik MCU (f=54)
  [3.23, 1.45],  // FLASH_AT (f=97)
  [11.80, 1.15], // "OJK dan BEI" (f=354)
  [12.00, 0.95], // cut to Pak Darma Gavel ECU (f=360)
  [20.62, 1.15], // "blockchain" (f=619)
  [23.33, 1.00], // "tanpa otoritas pusat" (f=700)
  [30.20, 1.25], // "24 jam sehari" (f=906)
  [34.00, 1.05], // "Bitcoin" (f=1020)
  [35.47, 0.95], // cut to Bro Kevin Dutch CU (f=1064)
  [40.86, 1.20], // "auto rejection" (f=1226)
  [42.00, 1.00], // cut to ARA Guardrail Macro (f=1260)
  [53.84, 1.40], // "jauh lebih fluktuatif" (f=1615)
  [55.60, 1.35], // hard cut ECU "tanpa batas auto rejection!" (f=1668)
  [58.68, 1.30], // "berubah drastis" (f=1760)
  [65.76, 1.15], // "habis gajian" (f=1973)
  [68.42, 1.25], // "Komen AI" (f=2053)
];

export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};

export const camAt = (id: number, f: number): CamPose => {
  const c = run(CAMS[id] ?? CAMS[1], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return {
    ...c,
    look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m],
    roll: c.roll + a * 0.004,
  };
};

export const dofAt = (f: number): { cInf: number; focus?: (frame: number) => V3 } => {
  const s = shotAt(f);
  // Shallow DOF (cInf 10.5..11.5) on close-ups & macro prop inserts; crisp DOF (cInf 4.5) on wide/hero shots
  if (
    (s.id === 1 && f < 18) ||
    s.id === 2 ||
    (s.id === 3 && f >= 142 && f < 180) ||
    (s.id === 5 && f >= 360) ||
    (s.id === 6 && f < 458) ||
    (s.id === 7 && f >= 582) ||
    (s.id === 8 && f >= 700 && f < 752) ||
    (s.id === 9 && (f < 858 || f >= 928)) ||
    (s.id === 10 && (f < 1020 || f >= 1064)) ||
    (s.id === 11 && f >= 1260 && f < 1348) ||
    s.id === 12 ||
    (s.id === 13 && f >= 1638) ||
    (s.id === 14 && f < 1798) ||
    (s.id === 15 && f >= 1973) ||
    s.id === 16
  ) {
    return { cInf: 10.8 };
  }
  return { cInf: 4.5, focus: () => [0.0, 1.35, -0.85] };
};
