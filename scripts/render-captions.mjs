import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const remTmp = process.env.REMOTION_TMP || "D:/remotion-tmp";
fs.mkdirSync(remTmp, { recursive: true });
process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP = remTmp;

const outDir = path.resolve("out/demo");
fs.mkdirSync(outDir, { recursive: true });

const browserExecutable = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: "angle" };

console.log("Bundling Demo caption compositions with Remotion...");
const serveUrl = await bundle({
  entryPoint: path.resolve("src/index.ts"),
  publicDir: path.resolve("public"),
});

// 1. Render Transparent WebM (VP9 + Alpha)
console.log("\nSelecting composition DemoCaptionOverlay (Transparent)...");
const compTrans = await selectComposition({
  serveUrl,
  id: "DemoCaptionOverlay",
  browserExecutable,
  chromiumOptions,
});

const webmOutput = path.join(outDir, "Demo_Captions_Transparent.webm");
console.log(`Rendering Transparent WebM (${compTrans.durationInFrames} frames) -> ${webmOutput}...`);
const t0 = Date.now();
await renderMedia({
  composition: compTrans,
  serveUrl,
  codec: "vp9",
  outputLocation: webmOutput,
  concurrency: 4,
  browserExecutable,
  chromiumOptions,
  timeoutInMilliseconds: 300000,
  onProgress: ({ renderedFrames, encodedFrames, progress }) => {
    if (renderedFrames % 500 === 0 || progress === 1) {
      console.log(`WebM Progress: ${(progress * 100).toFixed(1)}% (${renderedFrames}/${compTrans.durationInFrames})`);
    }
  },
});
console.log(`WebM render completed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// 2. Render Green Screen MP4 (Chroma Key)
console.log("\nSelecting composition DemoCaptionGreenScreen (Green Screen)...");
const compGreen = await selectComposition({
  serveUrl,
  id: "DemoCaptionGreenScreen",
  browserExecutable,
  chromiumOptions,
});

const greenOutput = path.join(outDir, "Demo_Captions_GreenScreen.mp4");
console.log(`Rendering Green Screen MP4 (${compGreen.durationInFrames} frames) -> ${greenOutput}...`);
const t1 = Date.now();
await renderMedia({
  composition: compGreen,
  serveUrl,
  codec: "h264",
  outputLocation: greenOutput,
  crf: 18,
  concurrency: 4,
  browserExecutable,
  chromiumOptions,
  timeoutInMilliseconds: 300000,
  onProgress: ({ renderedFrames, encodedFrames, progress }) => {
    if (renderedFrames % 500 === 0 || progress === 1) {
      console.log(`Green Screen Progress: ${(progress * 100).toFixed(1)}% (${renderedFrames}/${compGreen.durationInFrames})`);
    }
  },
});
console.log(`Green Screen render completed in ${((Date.now() - t1) / 1000).toFixed(1)}s`);

// 3. Composite with Final Video via ffmpeg
const finalVideo = path.join(outDir, "Demo_Video_Final.mp4");
const fullWithCaptions = path.join(outDir, "Demo_Video_Final_With_Captions.mp4");
if (fs.existsSync(finalVideo) && fs.existsSync(greenOutput)) {
  console.log(`\nMuxing final video with captions via ffmpeg -> ${fullWithCaptions}...`);
  const ffmpegCmd = `ffmpeg -y -i "${finalVideo}" -i "${greenOutput}" -filter_complex "[1:v]colorkey=0x00FF00:0.3:0.1[ck];[0:v][ck]overlay=0:0[v]" -map "[v]" -map 0:a -c:v libx264 -crf 18 -preset fast -c:a copy "${fullWithCaptions}"`;
  execSync(ffmpegCmd, { stdio: "inherit" });
  console.log(`Composite video ready -> ${fullWithCaptions}`);
}

console.log("\nAll caption renders successfully finished!");
