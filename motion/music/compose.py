"""Trilha original Astrovia (~20 s, 124 BPM, Lá menor). Livre para uso em anúncios: tudo é sintetizado aqui.
Uso: python3 compose.py  -> astrovia-theme.wav + beats.json (marcações para sincronizar o vídeo)
"""
import json
import os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
BPM = 124
BEAT = 60 / BPM
BAR = BEAT * 4
BARS = 10
DUR = BAR * BARS + 1.2
N = int(DUR * SR)
rng = np.random.default_rng(7)
here = os.path.dirname(os.path.abspath(__file__))


def t_arr(sec):
    return np.arange(int(sec * SR)) / SR


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def lp(x, f, q=0.707):
    return sosfilt(butter(2, f / (SR / 2), 'low', output='sos'), x)


def hp(x, f):
    return sosfilt(butter(2, f / (SR / 2), 'high', output='sos'), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)


def saw(f, t, ph=0):
    return 2 * ((f * t + ph) % 1) - 1


def adsr(n, a, d, s, r, sus_len):
    env = np.zeros(n)
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    S = max(0, int(sus_len * SR) - A - D)
    seg = np.concatenate([np.linspace(0, 1, A, False), np.linspace(1, s, D, False), np.full(S, s), np.linspace(s, 0, R)])
    env[: min(n, len(seg))] = seg[:n]
    return env


def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * gain


def reverb_ir(sec, decay, seed):
    r = np.random.default_rng(seed)
    t = t_arr(sec)
    ir = r.standard_normal(len(t)) * np.exp(-t / decay)
    ir = lp(ir, 7000)
    return ir / np.sqrt(np.sum(ir ** 2))


L = np.zeros(N)
Rr = np.zeros(N)
pad_bus = np.zeros(N)
bass_bus = np.zeros(N)
arp_bus = np.zeros(N)
drum_bus = np.zeros(N)
fx_bus = np.zeros(N)

# Am – F – C – G  (i – VI – III – VII)
CHORDS = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 60, 64, 67], [55, 59, 62, 67]]
ROOTS = [45, 41, 48, 43]
DROP = 2  # compasso em que entra a batida
BREAK = 7  # compasso de respiro antes do impacto final
END = 9  # compasso da assinatura

# ---------- pad (supersaw filtrado) ----------
for b in range(BARS):
    ch = CHORDS[b % 4]
    t = t_arr(BAR + 1.0)
    x = np.zeros(len(t))
    for m in ch:
        for k, det in enumerate(np.linspace(-0.11, 0.11, 7)):
            x += saw(hz(m + det), t, rng.random()) * (0.8 if k in (0, 6) else 1)
    cutoff = 900 if b < DROP else (2600 if b not in (BREAK,) else 1400)
    if b >= END:
        cutoff = 1800
    x = lp(x, cutoff) * adsr(len(t), 0.25, 0.4, 0.8, 1.0, BAR) / 28
    place(pad_bus, x, b * BAR)

# ---------- arpejo em 16 avos ----------
pattern = [0, 2, 1, 3, 2, 1, 3, 0, 1, 3, 2, 0, 3, 1, 2, 3]
for b in range(BARS):
    ch = CHORDS[b % 4]
    for s in range(16):
        if b < 1 and s % 2:
            continue
        m = ch[pattern[s]] + 12 + (12 if s % 8 == 7 else 0)
        t = t_arr(0.35)
        x = (saw(hz(m), t) * 0.6 + np.sign(np.sin(2 * np.pi * hz(m) * t)) * 0.4)
        x = lp(x, 3200 if b >= DROP else 1700) * np.exp(-t * 14) * 0.11
        place(arp_bus, x, b * BAR + s * BEAT / 4, 0.7 if s % 4 else 1.0)

# ---------- baixo (sub + saw, colcheias no contratempo) ----------
for b in range(DROP, BARS):
    if b == BREAK or b > END:
        continue
    r = ROOTS[b % 4]
    for e in range(8):
        if e % 2 == 0:
            continue
        t = t_arr(BEAT / 2)
        x = np.sin(2 * np.pi * hz(r) * t) * 0.9 + lp(saw(hz(r), t), 500) * 0.35
        x *= adsr(len(t), 0.005, 0.08, 0.7, 0.05, BEAT / 2 - 0.05)
        place(bass_bus, x * 0.5, b * BAR + e * BEAT / 2)


# ---------- bateria ----------
def kick():
    t = t_arr(0.45)
    f = 45 + 110 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t * 300) * 0.25
    return np.tanh((x + click) * 1.6)


def clap():
    t = t_arr(0.3)
    nz = bp(rng.standard_normal(len(t)), 900, 3500)
    env = sum(np.exp(-np.clip(t - d, 0, None) * 60) * (t >= d) for d in (0, 0.011, 0.022)) + np.exp(-t * 14) * 0.6
    return nz * env * 0.35


def hat(open_=False):
    t = t_arr(0.25 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (16 if open_ else 70)) * 0.18


K = kick()
duck = np.ones(N)
for b in range(DROP, BARS):
    if b == BREAK or b > END:
        continue
    for q in range(4):
        at = b * BAR + q * BEAT
        place(drum_bus, K, at, 0.95)
        i = int(at * SR)
        d = np.linspace(0, 1, int(0.22 * SR)) ** 0.6
        duck[i:i + len(d)] = np.minimum(duck[i:i + len(d)], 0.25 + 0.75 * d)
        place(drum_bus, hat(q % 2 == 1), at + BEAT / 2)
        if q in (1, 3):
            place(drum_bus, clap(), at)
    if b in (5,):
        for s in range(4):
            place(drum_bus, clap() * 0.5, b * BAR + 3 * BEAT + s * BEAT / 4)

# ---------- efeitos: subidas, impactos, varredura reversa ----------
def riser(sec):
    t = t_arr(sec)
    k = t / sec
    nz = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    for lo in range(0, len(t), 2048):
        seg_ = nz[lo:lo + 2048]
        c = 300 + 9000 * k[lo] ** 2
        out[lo:lo + 2048] = bp(seg_, c * 0.7, min(c * 1.4, 20000))
    sweep = saw(200 * 2 ** (k * 3), t) * 0.15
    return (out * 0.5 + lp(sweep, 4000)) * k ** 2


def impact():
    t = t_arr(2.6)
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 9)) * t) * np.exp(-t * 2.2)
    crash = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 1.8) * 0.35
    return np.tanh(boom * 1.4) * 0.9 + crash


place(fx_bus, riser(BAR * DROP - 0.02), 0, 0.6)
place(fx_bus, impact(), DROP * BAR, 0.9)
place(fx_bus, riser(BAR), BREAK * BAR, 0.6)
place(fx_bus, impact(), (BREAK + 1) * BAR, 0.8)
place(fx_bus, impact(), END * BAR, 0.7)

# ---------- mix ----------
pad_bus *= np.where(np.arange(N) / SR >= DROP * BAR, duck, 1)
bass_bus *= duck
ir_l, ir_r = reverb_ir(3.2, 0.9, 1), reverb_ir(3.2, 0.9, 2)


def delay(x, sec, fb, mix):
    d = int(sec * SR)
    y = x.copy()
    for k in range(1, 5):
        y[d * k:] += x[:-d * k] * (fb ** k) if d * k < len(x) else 0
    return y * mix


arp_l = arp_bus + delay(arp_bus, BEAT * 0.75, 0.45, 0.6)
arp_r = arp_bus + delay(arp_bus, BEAT * 0.5, 0.45, 0.6)
wet_l = fftconvolve(pad_bus * 0.6 + arp_bus * 0.5 + fx_bus * 0.3, ir_l)[:N]
wet_r = fftconvolve(pad_bus * 0.6 + arp_bus * 0.5 + fx_bus * 0.3, ir_r)[:N]
L = pad_bus + arp_l * 0.8 + bass_bus + drum_bus + fx_bus + wet_l * 0.35
Rr = pad_bus + arp_r * 0.8 + bass_bus + drum_bus + fx_bus + wet_r * 0.35
mixed = np.stack([L, Rr], 1)
fade = np.ones(N)
fl = int(1.0 * SR)
fade[-fl:] = np.linspace(1, 0, fl) ** 2
mixed *= fade[:, None]
mixed = np.tanh(mixed * 1.25) / np.tanh(1.25)
mixed /= np.max(np.abs(mixed)) / 0.89

pcm = (mixed * 32767).astype(np.int16)
import wave
with wave.open(os.path.join(here, 'astrovia-theme.wav'), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

beats = {'bpm': BPM, 'beat': BEAT, 'bar': BAR, 'drop': DROP * BAR, 'break': BREAK * BAR, 'impact2': (BREAK + 1) * BAR, 'end': END * BAR, 'duration': DUR}
json.dump(beats, open(os.path.join(here, 'beats.json'), 'w'), indent=1)
print(beats)
