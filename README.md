# 🎬 2D-in-3D Animation Framework (Comic Shorts Engine)

[![Remotion](https://img.shields.io/badge/Remotion-4.0+-blue.svg)](https://www.remotion.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r187-black.svg)](https://threejs.org)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Framework otomasi pembuatan **video animasi vertikal (9:16, 1080x1920 @ 30 fps) bergaya 2D-in-3D Comic**. 
Seluruh dunia 3D, set panggung, props, tekstur marmer/kayu/grid, dan karakter komik 2.5D dibuat secara **prosedural murni berbasis kode (Zero External 3D Models / No Heavy FBX/Blender files)**.

---

## ✨ Fitur Utama

1. **🎨 100% Procedural Sets & Materials:**
   - Seluruh dunia panggung 3D dirakit menggunakan Three.js `BufferGeometryUtils.mergeGeometries` dan hand-painted `Canvas2D` procedural textures (marmer, kayu balok, neon grid, rumput, langit gradien 5-stop).
2. **🧍 Karakter 2.5D Lit Sprites:**
   - Karakter komik digambar pada kanvas supersampled 3x (1800x3000), disinari secara real-time via `MeshLambertMaterial` kustom (`cardShade`), memiliki bayangan kontak elips dinamis (`blobMaterial`), dan mendukung sinkronisasi kedipan mata 4-frame (`lidAt`), lompatan parabola (`hopY`), dan siklus jalan (`march`/`stroll`).
3. **🎥 Dynamic Camera Grammar:**
   - Koreografi kamera sinematik: pergantian kontras skala ekstrem (*Wide Two-Shot* $\leftrightarrow$ *Hard Cut Macro Prop Insert* $\leftrightarrow$ *Heroic Dutch Tilt* $\leftrightarrow$ *High-Angle Crane*), kurva *smootherstep glide*, *7-frame camera kicks* pada punchline dialog, dan *4-frame White Flash transition*.
4. **🔊 Procedural Audio SFX DSP:**
   - Generator efek suara berbasis kode Python (`scripts/gen-audio.py`) untuk menghasilkan *camera whooshes*, *sub thuds / impact kicks*, *gavel strikes*, *bell chimes*, *telemetry beeps*, dan *cash register ka-ching* yang otomatis ter-normalisasi ke standar siaran **-15.0 LUFS**.
5. **💬 Standard Subtitle Overlay (Ref Channel):**
   - Font Poppins Bold 900 putih murni (`#ffffff`) dengan outline hitam tegas (`7px #000000`), micro-pop 1.12x, 1–2 kata per ketukan suara, tanpa background chip hitam tebal. Mendukung output *Transparent WebM* dan *Green Screen MP4*.

---

## 🏛️ Arsitektur Proyek

```text
2d-in-3d-animation-framework/
├── GUIDELINES.md                 # 4 Kaidah Emas, arsitektur pencahayaan & aturan kamera
├── public/                       # Aset audio voiceover & file master mix
│   └── demo_vo.mp3
├── scripts/                      # Tooling render Remotion & audio procedural
│   ├── gen-chunks.py             # Pemotong kata SRT menjadi chunk 1-2 kata
│   ├── gen-audio.py              # Generator procedural audio DSP & SFX
│   ├── render-stills.mjs         # Render 5 Hero Stills (Fase 1: Look-dev)
│   ├── render-previews.mjs       # Render 5 Beat Previews 3.5 detik (Fase 2: Motion)
│   ├── render-video.mjs          # Render video penuh 3D (Fase 3: Clean Render)
│   └── render-captions.mjs       # Render WebM transparan, Green Screen & Final Mux
├── skill/                        # DSP Audio primitives & Style Bible referensi
│   ├── references/               # Contact sheets & laporan bedah gaya visual
│   └── templates/audio/          # Modul dsp.py, instruments.py, sfx_gen.py
└── src/
    ├── index.ts                  # Entry point Remotion
    ├── Root.tsx                  # Registrasi komposisi video & overlay
    └── videos/
        ├── demo/                 # Proyek contoh lengkap siap render
        │   ├── build.ts          # Set panggung 3D prosedural
        │   ├── cast.ts           # Karakter 2D, bayangan & animasi ones
        │   ├── story.ts          # Timeline, kamera multi-angle & camera kicks
        │   ├── lights.ts         # Preset pencahayaan (golden, day, night, space)
        │   ├── toon.ts           # Outfit, ekspresi wajah, anatomi kartun
        │   ├── world.ts          # Three.js world loop & shader postprocessing
        │   └── Bridge.tsx        # Jembatan Remotion-Three & layers
        └── template/             # Cetak biru bersih untuk membuat video baru
```

---

## 🚀 Memulai (Quickstart)

### 1. Prasyarat Sistem
- **Node.js:** Versi 18 atau lebih baru.
- **Python:** Versi 3.10 atau lebih baru (dengan modul `numpy`, `scipy`).
- **Google Chrome:** Terinstal di sistem (digunakan oleh headless Chromium Remotion).
- **FFmpeg:** Terinstal dan ada di PATH sistem.

### 2. Instalasi Dependensi
```bash
git clone https://github.com/username/2d-in-3d-animation-framework.git
cd 2d-in-3d-animation-framework
npm install
```

### 3. Membuka Remotion Studio (Preview Interaktif)
Jalankan studio untuk melihat dan mengedit animasi secara langsung di browser:
```bash
npm run studio
```
Buka browser di `http://localhost:3000` untuk memilih komposisi `DemoShort` atau `DemoShortWithCaptions`.

---

## 🛠️ Alur Produksi 3 Fase

Framework ini menerapkan alur produksi bertahap yang disiplin:

### Fase 1: Look-dev Hero Stills
Render gambar diam (stills) resolusi penuh untuk menguji pencahayaan, safe margin 9:16, dan grounding fisik sebelum menganimasikan:
```bash
npm run render:stills
```
*Output: `out/demo/stills/*.jpg`*

### Fase 2: Motion & Beat Previews
Render potongan video pendek (1–3.5 detik) per adegan utama untuk menguji kelancaran gerakan kamera, *Camera Kicks*, dan akting karakter:
```bash
npm run render:previews
```
*Output: `out/demo/previews/*.mp4`*

### Fase 3: Full Final Render
1. **Sintesis Audio SFX Master:**
   ```bash
   npm run render:audio
   ```
   *Menghasilkan `public/demo_mix.wav` yang ter-normalisasi -15.0 LUFS.*

2. **Render Video 3D Penuh:**
   ```bash
   npm run render:video
   ```
   *Menghasilkan `out/demo/Demo_Video_Final.mp4`.*

3. **Render Caption & Komposisi Akhir:**
   ```bash
   npm run render:captions
   ```
   *Menghasilkan:*
   - `out/demo/Demo_Captions_Transparent.webm` (VP9 + Alpha Channel)
   - `out/demo/Demo_Captions_GreenScreen.mp4` (Chroma Key Green Screen)
   - `out/demo/Demo_Video_Final_With_Captions.mp4` (Video Final Lengkap Siap Upload!)

---

## 📖 Kaidah Baku Animasi (4 Kaidah Emas)

Baca dokumen lengkap di [**`GUIDELINES.md`**](GUIDELINES.md) untuk mempelajari:
1. **Physical Grounding:** Karakter tidak boleh melayang dan wajib memiliki bayangan kontak berlapis.
2. **Motivated Lighting:** Cahaya harus bersumber dari lampu bohlam, LED tube, atau jendela nyata pada layer `NOINK`.
3. **Physical Character Action:** Karakter berinteraksi dengan lingkungannya menggunakan props 2.5D.
4. **Dynamic Multi-Angle Camera:** Memecah setiap beat (4–6 detik) menjadi 2–3 sub-angle kontras tinggi dengan dorongan *continuous push-in*.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi **MIT** — silakan gunakan, modifikasi, dan adaptasikan secara bebas untuk kebutuhan produksi animasi Anda. Lihat [LICENSE](LICENSE) untuk detail lengkap.
