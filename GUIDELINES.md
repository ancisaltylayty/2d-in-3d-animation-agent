# Catatan Evaluasi dan Feedback Standar Mutu Animasi 2D-in-3D

Dokumen ini merupakan panduan baku standar mutu, protokol pemilihan model AI, arsitektur, dan alur kerja untuk pembuatan video animasi 2D-in-3D (Remotion + Three.js + Comic Billboards).

---

## 0. ATURAN MUTLAK PEMILIHAN MODEL AI (ARGON vs FLASH) — WAJIB DIPATUHI!

> [!CAUTION]
> **JANGAN PERNAH MENGGUNAKAN MODEL FLASH UNTUK MERANCANG 3D, MENULIS KODE VISUAL/KAMERA, ATAU MERENDER PREVIEW/STILLS TANPA PERSETUJUAN!**
> Pengalaman sesi sebelumnya membuktikan bahwa penggunaan model **Flash** untuk pembuatan aset 3D, penataan kamera 9:16, dan *staging* karakter menghasilkan kualitas visual yang buruk (karakter terpotong/clipping menembus objek, melayang, komposisi kaku, dan tidak sinematik).

### Protokol Wajib Setiap Sesi Baru:
1. **Selalu Sebutkan Model untuk Setiap Fase** di awal percakapan dan di setiap pergantian fase (**HARUS** menyebutkan secara eksplisit apakah fase tersebut memakai **ARGON** atau **Flash**).
2. **STOP Sebelum Memulai Pekerjaan yang Membutuhkan ARGON:**
   - Jika saat ini sesi sedang berjalan menggunakan **Flash**, agen **DILARANG KERAS** langsung menulis kode 3D (`build.ts`, `world.ts`, `cast.ts`, `story.ts`, `toon.ts`) atau menjalankan render preview!
   - Agen **WAJIB BERHENTI (STOP)** terlebih dahulu dan meminta pengguna mengganti model ke **ARGON** di menu *Model Selection*.
3. **Pembagian Tugas Model per Fase:**

| Fase / Tugas | Model Wajib | Alasan & Aturan Eksekusi |
| :--- | :---: | :--- |
| **Persiapan Awal** (Baca file, ekstrak JSON/SRT, cek durasi audio) | **Flash** / **ARGON** | Tugas administratif ringan. Jika masih di Flash, **WAJIB STOP** setelah selesai dan minta pindah ke **ARGON** sebelum masuk Fase 1. |
| **FASE 1: Look-dev Hero Stills** (Konsep 3D, `build.ts`, `toon.ts`, `lights.ts`, kamera, & render Hero Stills) | **WAJIB ARGON** | Butuh penalaran spasial 3D presisi tinggi, arah artistik, anti-clipping, dan komposisi 9:16. **DILARANG dikerjakan dengan Flash.** |
| **FASE 2: Motion & Beat Preview (1–3 Detik)** (Koreografi kamera, animasi karakter per beat, sync kata, & render cuplikan 1–3 dtk) | **WAJIB ARGON** | Butuh *timing* komedi/reaksi karakter, kehalusan kurva kamera, dan evaluasi gerakan. **DILARANG dikerjakan dengan Flash.** |
| **FASE 3: Full Final Render & Muxing** (Menjalankan command CLI render full video MP4 setelah seluruh kode 100% dikunci di Fase 2) | **Flash** *(Hemat)* | Karena seluruh kode 3D & animasi sudah dikunci oleh ARGON di Fase 1 & 2, eksekusi command terminal render penuh dapat diserahkan ke **Flash** agar hemat kuota. **Agen wajib memberi tahu pengguna untuk pindah ke Flash sebelum render final dimulai.** |

---

## 1. Empat Kaidah Emas (The 4 Golden Rules)

Setiap scene / beat animasi wajib mengimplementasikan 4 kaidah ini:

1. **Grounding Fisik:**
   - Karakter atau objek **TIDAK BOLEH** melayang tanpa konteks di ruang hampa/kosong, dan **TIDAK BOLEH** *clipping* (menembus kasur/meja/dinding).
   - Wajib ada tumpuan fisik yang jelas: lantai kamar kos, ubin, meja kerja, kasur, bingkai pintu/jendela, dinding bertekstur, jalanan, trotoar, dsb.

2. **Motivated Lighting (Pencahayaan Berdasar Sumber Nyata):**
   - Cahaya harus berasal dari sumber nyata di dalam scene:
     - Lampu bohlam kuning gantung (warm incandescent),
     - Neon TL / LED tube putih/kebiruan,
     - Monitor glow / smartphone screen glow di malam hari,
     - Sinar matahari terik siang atau golden hour yang masuk lewat jendela / ventilasi,
     - Strong rim light untuk memisahkan karakter 2D dari latar 3D.
   - Kontras gelap-terang harus dramatis (dramatic chiaroscuro & shadow falloff).

3. **Aksi Karakter Nyata (Physical Comic Character Interaction):**
   - Karakter komik (2D bean-head billboards) wajib berinteraksi fisik secara nyata dengan lingkungannya:
     - Duduk di kasur atau kursi,
     - Menghitung lembaran uang / kalkulator / laptop,
     - Membuka pintu kamar, memegang kunci kos,
     - Menunjuk maket/denah kos-kosan,
     - Memegang cangkir kopi, memegang sapu, menyemprot nyamuk, dsb.
   - Ekspresi wajah dan gestur tubuh harus reaktif terhadap narasi.

4. **Kamera Engaging & Dinamis:**
   - Kamera **TIDAK BOLEH** statis atau diam.
   - Setiap beat wajib memiliki pergerakan kamera terencana:
     - Push-in dramatis (dolly in),
     - Orbit subtle mengelilingi karakter/objek,
     - Dutch tilt / crane move,
     - Parallax motion kuat antara foreground props, karakter, dan background 3D.

---

## 2. Arsitektur Modular (Ref: `src/videos/farthest/`)

Struktur folder proyek video (`src/videos/<nama_proyek>/`):
- `Bridge.tsx`: Entry point komposisi Remotion, Three.js canvas setup, post-processing stack (Ink, Lens Blur / DoF, Bloom, Color Grading).
- `story.ts`: Definisi shot/beat timeline (frames, kamera, lighting, timing suara dari JSON/SRT).
- `world.ts`: Lingkungan 3D utama, sky/ceiling, dinding, lantai, pencahayaan global/lokal, visual effects.
- `build.ts`: Model 3D prosedural & perabot detail (tanpa mengambang, proporsi skala manusia akurat).
- `cast.ts`: Karakter 2D bean-head billboard, props, ekspresi, dan pose dinamis yang terintegrasi dengan pencahayaan (`cardshade.ts`).
- `toon.ts`: Canvas2D procedural vector rendering untuk karakter bergaya komik.
- `lights.ts` & `shade.ts`: Setup directional light, point light, two-tone cel shading.
- `CaptionsOnly.tsx`: Dynamic kinetic subtitles/captions (individual comic chips, active word highlight `#ffd43b`, synced to word JSON).

---

## 3. Alur Checkpoint Bertahap (WAJIB STOP UNTUK APPROVAL)

- **FASE 1 (Look-dev Hero Stills) — [WAJIB MODEL: ARGON]:**
  - Buat konsep 3D dan render still frame / screenshot adegan kunci.
  - Evaluasi sendiri (self-check) setiap gambar: pastikan tidak ada karakter *clipping* menembus meja/kasur, tidak ada yang terpotong kamera, dan pencahayaan dramatis.
  - Tampilkan still preview kepada pengguna.
  - **STOP & TUNGGU PERSETUJUAN** mengenai gaya visual, proporsi, pencahayaan, dan palet warna.

- **FASE 2 (Motion & Beat Preview 1–3 Detik) — [WAJIB MODEL: ARGON]:**
  - Setelah Fase 1 disetujui, rancang staging dan animasi per beat.
  - Render cuplikan video pendek (1–3 detik) per adegan utama.
  - **STOP & TUNGGU PERSETUJUAN** untuk me-review gerakan karakter, pencahayaan bergerak, dan dinamika kamera.

- **FASE 3 (Full Final Render) — [BOLEH MODEL: FLASH (Hemat)]:**
  - **STOP & BERI TAHU PENGGUNA** bahwa seluruh kode visual sudah terkunci dan pengguna dapat beralih ke model **Flash** sebelum proses *full render* dimulai.
  - Render keseluruhan video secara penuh (1080x1920 / 1440x2560 2K vertical MP4) dengan audio voiceover & background mix.

---

## 4. Standar Mutu Unggulan (Gold Benchmark Pelajaran Proyek Kos-Kosan)

Proyek video *"Kenapa Bisnis Kos-Kosan Sering Rugi?"* menjadi standar acuan mutu terbaik (*gold benchmark*) untuk seluruh proyek berikutnya. Terapkan poin-poin berikut di setiap sesi baru:

### A. Koreografi Kamera Multi-Angle per Beat (Ref: `skill/references/sheets`)
- **Jangan gunakan satu kamera statis untuk satu adegan panjang:** Dalam 1 shot berdurasi 4–6 detik, pecah menjadi 2–3 sub-angle dinamis (contoh: *Medium shot* saat bicara -> *Insert macro close-up* pada layar HP/kalkulator -> *Dutch tilt push-in* saat kaget).
- **Camera Kicks & Visual Impact:** Berikan entakan kamera instan (`kick` / screen shake) pada kata-kata pukulan (*punchline* seperti omzet besar, cicilan bank, biaya tak terduga).
- **Transisi White Flash:** Gunakan flash putih 3–5 frame saat ada pergantian realitas/kontras mendadak (misal: dari mimpi manis keuntungan ke kenyataan pahit sepi penyewa).

### B. Lingkungan 3D Spesifik (Dedicated Sets) untuk Setiap Mood
- Jangan menggunakan ruangan yang sama untuk karakter/situasi yang memiliki atmosfer berbeda.
- Jika ada karakter mistis, misterius, atau unik (misal: Kuntilanak, debt collector, dsb.), buatkan set 3D tersendiri dengan material dan pencahayaan yang kontras (misal: wallpaper terkelupas, ranjang kuno empat tiang, lampu ungu remang, jendela berpalang kayu).

### C. Layout Teks & Comic Badges Bebas Potong (Safe Margin 9:16)
- **Auto-Fit Text Loop:** Setiap kali menggambar teks di canvas billboard/badge (`toon.ts` / `cast.ts`), wajib gunakan loop pengukuran `ctx.measureText()` untuk otomatis mengecilkan ukuran font jika teks terlalu panjang, sehingga tidak pernah melebihi batas kotak.
- **Batas Horizontal Aman:** Di kamera vertikal 9:16, jangan meletakkan papan 3D melebihi lebar `1.8m` (center di `x = 0`). Seluruh badge komik harus berada di area sentral (`x` antara `-0.2` hingga `+0.25`).
- **Kebijakan Auto-Captions:** Utamakan kejernihan visual dan ekspresi karakter. Jika auto-caption dirasa menutupi elemen penting panggung 3D, gunakan sistem badge komik selektif (*punchline badges*) alih-alih subtitle kata-per-kata yang padat.

### D. Tata Suara Prosedural & Desain Audio Terpadu
- **Multi-layer SFX:** Setiap aksi visual (koin berjatuhan, pengetikan kalkulator, dengungan serangga, tawa hantu, whoosh kamera cepat) wajib memiliki efek suara yang sinkron dengan frame visual.
- **Audio Mastering:** Master audio (`kosan_mix.wav`) harus di-ducking secara otomatis saat vokal terdengar, dan dinormalisasi pada level `-14.0` hingga `-15.0 LUFS` dengan *True Peak* aman di bawah `-1.5 dBTP`.

