import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const remTmp = process.env.REMOTION_TMP || "D:/remotion-tmp";
fs.mkdirSync(remTmp, { recursive: true });
process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP = remTmp;

const outDir = path.resolve("out/demo/stills");
fs.mkdirSync(outDir, { recursive: true });

const browserExecutable = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: "angle" };

// 5 Key Hero Stills
const stills = [
  { frame: 35, name: "hero_f35_split" },
  { frame: 355, name: "hero_f355_bursa" },
  { frame: 1050, name: "hero_f1050_crypto" },
  { frame: 1250, name: "hero_f1250_ara" },
  { frame: 1630, name: "hero_f1630_volatile" },
];

console.log("Bundling DemoShort with Remotion...");
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  publicDir: path.resolve("public"),
});

console.log("Selecting composition DemoShort...");
const composition = await selectComposition({
  serveUrl,
  id: "DemoShort",
  browserExecutable,
  chromiumOptions,
});

for (const s of stills) {
  const outputLocation = path.join(outDir, `${s.name}.jpg`);
  console.log(`Rendering still frame ${s.frame} -> ${outputLocation}...`);
  await renderStill({
    composition,
    serveUrl,
    output: outputLocation,
    frame: s.frame,
    imageFormat: "jpeg",
    jpegQuality: 95,
    browserExecutable,
    chromiumOptions,
  });
}

console.log("All demo stills rendered successfully!");
