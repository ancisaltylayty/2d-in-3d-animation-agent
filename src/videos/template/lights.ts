// Light presets per environment for "Perbedaan Saham vs Kripto":
// - "golden": Split Arena & Auto Rejection Vault (warm brass spotlight + golden ambient)
// - "day": Aula Bursa Efek Indonesia / BEI & OJK (bright institutional daylight + warm wood bounce)
// - "night": Cyber Blockchain Node Lab 24/7 (deep indigo-violet night + cyan/gold neon contrast)
// - "space": Storm Room Volatilitas Ekstrem Kripto (dramatic magenta-violet storm + crimson/neon contrast)
type C3 = [number, number, number];
export type LightName = "space" | "night" | "golden" | "day";

export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string;
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;
  bias: number; normalBias: number;
};

export const LIGHTS: Record<LightName, LightPreset> = {
  space: {
    az: 50, el: 40,
    lit: [1.55, 1.40, 1.50], shade: [0.26, 0.24, 0.44], lift: [0.05, 0.05, 0.13], lambert: 0.35, sideK: 0.84, term: 0.18,
    charTint: [1.0, 0.95, 0.98], charShade: 0.86, charGrad: 0.09, bodyGrad: 0.21, sideTint: [0.86, 0.84, 0.98],
    blob: [0.50, 0.44, 0.66], actorShadow: true,
    top: "#160c30", hor: "#7e308c", skyCurve: [0.05, 0.55, 0.85], fog: "#3c1a66", fogNear: 35, fogFar: 340, sunDisc: "#ffd8ff",
    sunCol: "#ffe8f8", sunI: 3.2, sky: "#d0bcf8", ground: "#543678", hemiI: 0.62,
    bias: -0.00025, normalBias: 0.015,
  },
  night: {
    az: 46, el: 38,
    lit: [1.54, 1.38, 1.06], shade: [0.27, 0.27, 0.46], lift: [0.05, 0.06, 0.14], lambert: 0.35, sideK: 0.82, term: 0.16,
    charTint: [1.0, 0.95, 0.90], charShade: 0.87, charGrad: 0.09, bodyGrad: 0.21, sideTint: [0.86, 0.88, 0.98],
    blob: [0.54, 0.52, 0.68], actorShadow: true,
    top: "#141032", hor: "#5e3894", skyCurve: [0.05, 0.55, 0.9], fog: "#382068", fogNear: 32, fogFar: 280, sunDisc: "#fff0d8",
    sunCol: "#ffd89a", sunI: 3.4, sky: "#c4b8f4", ground: "#5e4c46", hemiI: 0.62,
    bias: -0.0003, normalBias: 0.018,
  },
  golden: {
    az: 52, el: 38,
    lit: [1.56, 1.28, 0.86], shade: [0.31, 0.27, 0.38], lift: [0.05, 0.05, 0.11], lambert: 0.35, sideK: 0.82, term: 0.15,
    charTint: [1.0, 0.92, 0.80], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.22, sideTint: [0.9, 0.86, 0.95],
    blob: [0.64, 0.60, 0.72], actorShadow: true,
    top: "#5a3d7a", hor: "#ffca82", skyCurve: [0.05, 0.6, 1.0], fog: "#e5a87e", fogNear: 35, fogFar: 300, sunDisc: "#ffcf9e",
    sunCol: "#ffbc78", sunI: 3.5, sky: "#e6c4b8", ground: "#9a7a68", hemiI: 0.58,
    bias: -0.0003, normalBias: 0.018,
  },
  day: {
    az: 64, el: 46,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: true,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.9, sky: "#dcecff", ground: "#b49a78", hemiI: 0.56,
    bias: -0.00025, normalBias: 0.015,
  },
};

export type WorldLook = {
  sky: { c: string[]; e: number[] };
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;
  sat: number;
  cloud: { lit: string; mid: string; shade: string };
};

export const LOOK: Record<LightName, WorldLook> = {
  space: {
    sky: { c: ["#8e3892", "#682684", "#461b70", "#29114e", "#15092e"], e: [0, 4, 10, 22, 42] },
    water: { near: "#4a2478", mid: "#361a62", far: "#241048", crest: "#e288d8", trough: "#1c0b3a", glint: "#ffe0ff", shade: [0.46, 0.42, 0.68] },
    cloud: { lit: "#f2b8ec", mid: "#b66cc8", shade: "#683892" },
    bounce: [0.03, 0.01, 0.04],
    sat: 1.12,
  },
  night: {
    sky: { c: ["#6a3b9c", "#4e2a82", "#341c64", "#1e1146", "#100828"], e: [0, 4, 10, 22, 42] },
    water: { near: "#3a1e62", mid: "#28134a", far: "#1b0b36", crest: "#ffcf8a", trough: "#14082a", glint: "#ffe6b8", shade: [0.42, 0.38, 0.62] },
    cloud: { lit: "#e6b0f0", mid: "#9c60b8", shade: "#522c78" },
    bounce: [0.03, 0.02, 0.03],
    sat: 1.1,
  },
  golden: {
    sky: { c: ["#ffd292", "#f6a56e", "#ce7768", "#8e5874", "#4d3866"], e: [0, 3, 7, 13, 24] },
    water: { near: "#e58962", mid: "#c76c5b", far: "#82485c", crest: "#ffd39b", trough: "#6a3b52", glint: "#ffe6be", shade: [0.55, 0.42, 0.58] },
    cloud: { lit: "#ffe0b2", mid: "#f09872", shade: "#92556c" },
    bounce: [0.06, 0.02, -0.02],
    sat: 1.1,
  },
  day: {
    sky: { c: ["#b8d0ec", "#82aedf", "#4f8bc6", "#3e7fd2", "#2b68be"], e: [0, 4, 10, 22, 42] },
    water: { near: "#3e90ac", mid: "#2b6e95", far: "#235a84", crest: "#c8e6f2", trough: "#1a4668", glint: "#ffffff", shade: [0.48, 0.68, 0.78] },
    cloud: { lit: "#ffffff", mid: "#d9e4f0", shade: "#9bb2cc" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
};
