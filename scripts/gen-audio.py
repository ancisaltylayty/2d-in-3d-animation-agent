#!/usr/bin/env python3
"""
Procedural SFX + Voiceover Master Mix Generator for:
"Perbedaan Saham vs Kripto" (2121 frames @ 30 fps = 70.700 s).

Uses the reference DSP & procedural synthesis modules in `skill/templates/audio/`
(`dsp.py`, `sfx_gen.py`, `instruments.py`) to synthesize:
1. Voice stem (`public/saham_vo.mp3` decoded at 48 kHz stereo, gain adjusted).
2. Frame-accurate procedural SFX stem locked to `story.ts` (16 shots, 42+ beats, and KICKS):
   - Camera whooshes on glides & cuts
   - 4-frame White Flash reverse swell + sub boom at FLASH_AT = 97 (3.23s)
   - Impact kicks / sub thuds on punchline words & hard angle cuts
   - Gavel wood strike at Pak Darma's OJK desk (f=354 & f=360)
   - Bell rings / chimes on Bursa opening & Wall clock (f=142, f=412)
   - Futuristic cyber beeps, laser telemetry, and crypto coin clinks (f=513, f=985, f=1050)
   - Stock Auto Rejection safety bumper metallic thud (f=1226, f=1260)
   - Volatile rollercoaster ascending click + wind storm swell + dramatic crash drop (f=1595, f=1638, f=1668)
   - Cash register ka-ching & money flutter on "habis gajian" (f=1973)
3. Master BS.1770-4 loudness normalization to -15.0 LUFS & true-peak limiting (<= -1.2 dBTP).
   Outputs `public/saham_mix.wav`.
"""
import os
import sys
import subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_TPL = os.path.join(ROOT, "skill", "templates", "audio")
sys.path.insert(0, AUDIO_TPL)

from dsp import (
    SR, TAU, ns, tt, rng, dbg, lp, hp, bp, peq, shelf, reson,
    colored, smooth_noise, ramp, fades, phase, modal, pan, st, place, widen,
    make_ir, convolve_st, integrated, momentary_max, true_peak, read_wav, write_wav,
)
import sfx_gen as G
import instruments as I

FPS = 30.0
TOTAL_FRAMES = 2121
DUR = TOTAL_FRAMES / FPS  # 70.700 s
N = ns(DUR)
TARGET_LUFS = -15.0
CEIL_DBTP = -1.2
SFX_DB = -5.5

def fr(f):
    return float(f) / FPS

# ---------------------------------------------------------------- 1. Load Voiceover
def load_voice():
    mp3_path = os.path.join(ROOT, "public", "saham_vo.mp3")
    tmp_wav = os.path.join(ROOT, "public", "_saham_voice_48k.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", mp3_path, "-ar", str(SR), "-ac", "2", tmp_wav],
        check=True,
    )
    x, sr = read_wav(tmp_wav)
    try:
        os.remove(tmp_wav)
    except OSError:
        pass
    out = np.zeros((2, N))
    m = min(N, x.shape[1])
    out[:, :m] = x[:, :m]
    return out

# ---------------------------------------------------------------- 2. Procedural SFX Generators
RNG = np.random.default_rng(42)

def sfx_whoosh(dur=0.38, center_freq=650, pan_pos=0.0):
    n = ns(dur)
    t = tt(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    noise = colored(n, RNG, -2.5)
    lo = max(60, center_freq * 0.5)
    hi = min(SR * 0.45, center_freq * 1.8)
    w = bp(noise, lo, hi) * env
    return pan(w, pan_pos)

def sfx_kick(dur=0.32, f0=120, f1=38):
    n = ns(dur)
    t = tt(dur)
    env = np.exp(-t * 14.0)
    f_inst = f1 + (f0 - f1) * np.exp(-t * 28.0)
    phi = 2 * np.pi * np.cumsum(f_inst) / SR
    sine = np.sin(phi) * env
    click = np.exp(-t * 180.0) * colored(n, RNG, 2.0)
    hit = sine * 0.85 + click * 0.25
    return st(hit)

def sfx_flash(dur=0.95):
    t = tt(dur)
    out = np.zeros(len(t))
    rise_dur = 0.45
    n_rise = int(rise_dur * SR)
    t_rise = t[:n_rise]
    rise_env = (t_rise / rise_dur) ** 3
    noise_rise = colored(n_rise, RNG, -2.0)
    rise_noise = bp(noise_rise, 350, 2200) * rise_env
    out[:n_rise] += rise_noise * 0.7
    
    n_tail = len(t) - n_rise
    t_tail = np.linspace(0, n_tail / SR, n_tail, endpoint=False)
    tail_env = np.exp(-t_tail * 4.5)
    sub = np.sin(2 * np.pi * (55 * np.exp(-t_tail * 8.0)) * t_tail) * tail_env * 0.9
    sparkle = lp(colored(n_tail, RNG, 1.0), 4500) * tail_env * 0.2
    out[n_rise:] += sub + sparkle
    return st(out)

def sfx_gavel(dur=0.45):
    n = ns(dur)
    t = tt(dur)
    crack = np.exp(-t * 120.0) * colored(n, RNG, 4.0)
    res = (np.sin(2 * np.pi * 380 * t) * 0.5 + np.sin(2 * np.pi * 820 * t) * 0.3) * np.exp(-t * 22.0)
    thud = np.sin(2 * np.pi * 95 * t) * np.exp(-t * 18.0) * 0.7
    return pan(crack * 0.4 + res * 0.4 + thud * 0.6, 0.25)

def sfx_bell(dur=1.2, f_bell=1180):
    n = ns(dur)
    t = tt(dur)
    strike = np.exp(-t * 140.0) * colored(n, RNG, 5.0) * 0.3
    m1 = np.sin(2 * np.pi * f_bell * t) * np.exp(-t * 3.2)
    m2 = np.sin(2 * np.pi * (f_bell * 1.58) * t) * np.exp(-t * 4.5) * 0.45
    m3 = np.sin(2 * np.pi * (f_bell * 2.32) * t) * np.exp(-t * 6.0) * 0.25
    return pan(strike + (m1 + m2 + m3) * 0.65, -0.3)

def sfx_clink(dur=0.6, f0=2200):
    n = ns(dur)
    t = tt(dur)
    body = (np.sin(2 * np.pi * f0 * t) * 0.6 + np.sin(2 * np.pi * (f0 * 1.76) * t) * 0.4) * np.exp(-t * 12.0)
    click = np.exp(-t * 200.0) * colored(n, RNG, 6.0) * 0.25
    return st(body + click)

def sfx_cyber_beep(dur=0.35, f=1480):
    t = tt(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    tone = np.sin(2 * np.pi * f * t) * env
    chirp = np.sin(2 * np.pi * (f * 1.4) * t) * (env ** 2) * 0.3
    return pan(tone + chirp, 0.2)

def sfx_kaching(dur=0.85):
    n = ns(dur)
    t = tt(dur)
    mech = np.exp(-t * 80.0) * colored(n, RNG, 2.0) * 0.5
    bell1 = np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 6.5) * 0.5
    bell2 = np.sin(2 * np.pi * 2640 * t) * np.exp(-t * 8.5) * 0.4
    coins = lp(colored(n, RNG, 4.0), 5500) * np.exp(-t * 9.0) * 0.3
    return pan(mech + bell1 + bell2 + coins, -0.2)

# ---------------------------------------------------------------- 3. Assemble Procedural Track
def generate_sfx():
    sfx = np.zeros((2, N))
    
    def put(start_sec, mono_or_st_wave, gain_db=0.0):
        if mono_or_st_wave.ndim == 1:
            w = st(mono_or_st_wave)
        else:
            w = mono_or_st_wave
        w = w * (10 ** (gain_db / 20.0))
        i0 = ns(start_sec)
        i1 = min(N, i0 + w.shape[1])
        L = i1 - i0
        if L > 0:
            sfx[:, i0:i1] += w[:, :L]

    # --- Shot 1: Split Hook
    put(0.00, sfx_whoosh(0.32, 550, pan_pos=-0.4), -6.0)
    put(fr(18), sfx_whoosh(0.35, 750, pan_pos=0.0), -5.0)
    put(fr(36), sfx_kick(0.34, 110, 42), -3.0)  # "kripto."
    put(fr(38), sfx_clink(0.5, 2400), -8.0)     # Golden coin clink
    
    # --- Shot 2: Hook transition & Flash
    put(fr(54), sfx_whoosh(0.28, 900, pan_pos=0.2), -6.0)
    put(fr(74), sfx_whoosh(0.32, 1100, pan_pos=0.0), -5.0)
    put(fr(97) - 0.45, sfx_flash(0.95), -2.5)   # FLASH_AT = 97
    
    # --- Shot 3: Bursa Efek Hall
    put(fr(99), sfx_whoosh(0.38, 600, pan_pos=-0.2), -7.0)
    put(fr(142), sfx_bell(0.9, 1050), -7.0)     # Opening bell insert
    
    # --- Shot 4: BEI Ticker
    put(fr(215), sfx_whoosh(0.35, 800, pan_pos=0.0), -6.0)
    put(fr(252), sfx_cyber_beep(0.25, 1250), -12.0)
    
    # --- Shot 5: Pengawasan OJK & BEI
    put(fr(290), sfx_whoosh(0.34, 650, pan_pos=0.3), -7.0)
    put(fr(354), sfx_kick(0.35, 115, 38), -3.0) # "OJK dan BEI"
    put(fr(360), sfx_gavel(0.45), -4.0)         # OJK Gavel strike
    put(fr(390), sfx_whoosh(0.30, 950, pan_pos=0.3), -6.0) # Whip up to clock
    
    # --- Shot 6: Jam Bursa
    put(fr(412), sfx_bell(1.1, 1320), -8.0)     # Clock chime
    put(fr(458), sfx_whoosh(0.35, 550, pan_pos=-0.2), -8.0)
    
    # --- Shot 7: Cyber Night Kripto
    put(fr(513), sfx_whoosh(0.38, 500, pan_pos=-0.3), -6.0)
    put(fr(582), sfx_cyber_beep(0.32, 1650), -10.0) # Blockchain cube link
    put(fr(619), sfx_kick(0.35, 110, 40), -3.5)      # "blockchain"
    
    # --- Shot 8: Terdesentralisasi
    put(fr(647), sfx_whoosh(0.34, 750, pan_pos=0.0), -7.0)
    put(fr(700), sfx_cyber_beep(0.28, 1450), -11.0)
    
    # --- Shot 9: 24/7 Trading
    put(fr(796), sfx_whoosh(0.32, 850, pan_pos=-0.3), -6.5)
    put(fr(858), sfx_whoosh(0.34, 950, pan_pos=0.2), -6.0)
    put(fr(906), sfx_kick(0.38, 130, 36), -2.5)     # "24 jam sehari"
    put(fr(928), sfx_clink(0.45, 2600), -8.0)
    
    # --- Shot 10: BTC, ETH, SOL Showcase
    put(fr(985), sfx_whoosh(0.35, 700, pan_pos=0.4), -7.0)
    put(fr(1020), sfx_kick(0.32, 110, 42), -4.0)    # "Bitcoin"
    put(fr(1021), sfx_clink(0.55, 2200), -7.0)      # BTC
    put(fr(1040), sfx_cyber_beep(0.25, 1850), -9.0) # ETH
    put(fr(1055), sfx_cyber_beep(0.25, 2150), -9.0) # SOL
    put(fr(1064), sfx_whoosh(0.28, 1100, pan_pos=-0.3), -6.0)
    
    # --- Shot 11: Auto Rejection
    put(fr(1123), sfx_whoosh(0.35, 600, pan_pos=0.0), -7.0)
    put(fr(1210), sfx_whoosh(0.32, 700, pan_pos=0.0), -6.5)
    put(fr(1226), sfx_kick(0.35, 120, 38), -3.0)    # "auto rejection"
    put(fr(1260), sfx_kick(0.28, 150, 65), -5.0)    # Bumper hit guardrail
    put(fr(1294), sfx_whoosh(0.30, 850, pan_pos=0.3), -6.0) # Top-down to table
    
    # --- Shot 12: Fundamental Perusahaan
    put(fr(1397), sfx_whoosh(0.34, 650, pan_pos=0.2), -7.0)
    put(fr(1456), sfx_clink(0.4, 1800), -9.0)
    
    # --- Shot 13: Volatilitas Ekstrem & Rollercoaster
    put(fr(1529), sfx_whoosh(0.38, 550, pan_pos=-0.4), -6.0)
    put(fr(1595), sfx_whoosh(0.36, 950, pan_pos=0.0), -5.0)
    put(fr(1615), sfx_kick(0.42, 135, 34), -2.0)    # "jauh lebih fluktuatif"
    put(fr(1638), sfx_whoosh(0.32, 1250, pan_pos=-0.3), -4.5) # Fast spike zoom
    put(fr(1668), sfx_kick(0.45, 140, 32), -2.0)    # Shock ECU hard snap
    
    # --- Shot 14: Sentimen Global
    put(fr(1728), sfx_whoosh(0.34, 750, pan_pos=0.3), -6.5)
    put(fr(1760), sfx_kick(0.35, 115, 38), -3.5)    # "berubah drastis"
    put(fr(1798), sfx_whoosh(0.35, 650, pan_pos=-0.2), -7.0)
    put(fr(1868), sfx_whoosh(0.38, 550, pan_pos=0.0), -7.0)
    
    # --- Shot 15: Outro Habis Gajian
    put(fr(1924), sfx_whoosh(0.35, 750, pan_pos=0.0), -6.0)
    put(fr(1973), sfx_kick(0.36, 120, 38), -3.0)    # "habis gajian"
    put(fr(1974), sfx_kaching(0.85), -4.5)           # Money register ka-ching!
    
    # --- Shot 16: Call to Action Komen AI
    put(fr(2052), sfx_whoosh(0.30, 1050, pan_pos=0.1), -5.5)
    put(fr(2053), sfx_kick(0.40, 130, 36), -2.5)    # "Komen AI"
    put(fr(2060), sfx_bell(0.9, 1480), -7.5)        # Celebration burst chime
    
    return sfx

# ---------------------------------------------------------------- 4. Master Mix & Normalization
def main():
    print("Loading voiceover stem...")
    voice = load_voice()
    
    print("Generating procedural frame-accurate SFX stem...")
    sfx = generate_sfx()
    
    # Mix stems: Voice priority + motivated SFX beds
    mix = voice * 0.95 + sfx * 0.55
    
    # Apply soft limiter & loudness normalization to target -15 LUFS
    print("Normalizing master mix to target loudness...")
    lufs = integrated(mix)
    print(f"Initial mix loudness: {lufs:.2f} LUFS")
    gain = 10 ** ((TARGET_LUFS - lufs) / 20.0)
    norm = mix * gain
    
    # Peak limiter (ensure <= -1.2 dBTP)
    tp = true_peak(norm)
    tp_db = 20 * np.log10(max(1e-9, tp))
    print(f"Normalized True Peak: {tp_db:.2f} dBTP")
    if tp_db > CEIL_DBTP:
        reduction = 10 ** ((CEIL_DBTP - tp_db) / 20.0)
        norm = norm * reduction
        print(f"Limiter applied: reduced by {tp_db - CEIL_DBTP:.2f} dB -> {20*np.log10(true_peak(norm)):.2f} dBTP")
    
    out_wav = os.path.join(ROOT, "public", "saham_mix.wav")
    print(f"Writing master audio file -> {out_wav}...")
    write_wav(out_wav, norm, SR)
    print("Master audio mix generated successfully!")

if __name__ == "__main__":
    main()
