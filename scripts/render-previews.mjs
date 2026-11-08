import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const remTmp = process.env.REMOTION_TMP || "D:/remotion-tmp";
fs.mkdirSync(remTmp, { recursive: true });
process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP = remTmp;

const outDir = path.resolve("out/demo/previews");
fs.mkdirSync(outDir, { recursive: true });

const browserExecutable = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: "angle" };

const clips = [
  { name: "preview_1_hook", range: [0, 104] },
  { name: "preview_2_bursa", range: [315, 419] },
  { name: "preview_3_crypto", range: [985, 1089] },
  { name: "preview_4_auto_rejection", range: [1215, 1319] },
  { name: "preview_5_volatilitas", range: [1595, 1699] },
];

console.log("Bundling DemoShortWithCaptions with Remotion...");
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  publicDir: path.resolve("public"),
});

console.log("Selecting composition DemoShortWithCaptions...");
const composition = await selectComposition({
  serveUrl,
  id: "DemoShortWithCaptions",
  browserExecutable,
  chromiumOptions,
});

for (const clip of clips) {
  const t0 = Date.now();
  const outputLocation = path.join(outDir, `${clip.name}.mp4`);
  console.log(`Rendering ${clip.name} (frames ${clip.range[0]}..${clip.range[1]}) -> ${outputLocation}...`);
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    frameRange: clip.range,
    scale: 0.5,
    crf: 20,
    concurrency: 2,
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 120000,
  });
  console.log(`Finished ${clip.name} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

console.log("All demo preview clips rendered successfully!");
