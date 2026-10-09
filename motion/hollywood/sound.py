"""Desenho de som estilo trailer para o filme 'Agentes Astrovia' (24 s) + narração.
Uso: python3 sound.py  -> mix.wav (48 kHz estéreo, -14 LUFS)
"""
import os
import subprocess
import wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 24.0
N = int(DUR * SR)
here = os.path.dirname(os.path.abspath(__file__))
vo_dir = os.path.join(here, '..', 'robots', 'audio')
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)

HITS = [10.04, 11.04, 12.2, 13.1]
BOOM = 15.6
CUTS = [4.6, 7.6, 9.4, 11.0, 11.9, 14.0]


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def flt(x, kind, f):
    return sosfilt(butter(2, np.array(f) / (SR / 2), kind, output='sos'), x)


def put(x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    if i < 0:
        x, i = x[-i:], 0
    j = min(N, i + len(x))
    L[i:j] += x[: j - i] * g * np.sqrt(0.5 * (1 - pan))
    R[i:j] += x[: j - i] * g * np.sqrt(0.5 * (1 + pan))


def env(n, a, r):
    e = np.ones(n)
    A, Rr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:A] = np.linspace(0, 1, A)
    e[-Rr:] *= np.linspace(1, 0, Rr)
    return e


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def saw(f, tt):
    ph = np.cumsum(np.broadcast_to(f, tt.shape)) / SR
    return 2 * (ph % 1) - 1


def braam(sec, f0=43.65, g=1.0):
    """'BRAAAM' de trailer: metais graves desafinados com filtro abrindo."""
    tt = t_(sec)
    x = sum(saw(f0 * m * (1 + d), tt) for m in (1, 2, 3) for d in (-0.006, 0, 0.007)) / 9
    out = np.zeros_like(x)
    for s in range(0, len(x), 2048):
        k = s / len(x)
        c = 180 + 1400 * np.sin(np.pi * min(1, k * 1.6)) ** 2
        out[s:s + 2048] = flt(x[s:s + 2048], 'low', c)
    sub = np.sin(2 * np.pi * f0 / 2 * tt) * 0.6
    return np.tanh((out * 1.8 + sub) * env(len(tt), 0.08, sec * 0.7) * 1.5) * g


def whoosh(sec, f0, f1, g=1.0):
    x = noise(sec)
    out = np.zeros_like(x)
    n = len(x)
    for s in range(0, n, 1024):
        k = s / n
        c = f0 + (f1 - f0) * np.sin(np.pi * k) ** 2
        out[s:s + 1024] = flt(x[s:s + 1024], 'band', [max(60, c * 0.6), min(20000, c * 1.6)])
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * g


def riser(sec, g=1.0):
    tt = t_(sec)
    k = tt / sec
    tone = np.sin(2 * np.pi * np.cumsum(120 + 1600 * k ** 2) / SR) * 0.25
    shep = sum(np.sin(2 * np.pi * np.cumsum(f * 2 ** (k * 1.5)) / SR) for f in (110, 220, 440)) * 0.08
    return (flt(noise(sec), 'high', 1200) * 0.35 + tone + shep) * k ** 2.4 * g


def boom(sec, f0=50, g=1.0, crackle=0.5):
    tt = t_(sec)
    f = f0 + 100 * np.exp(-tt * 14)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (3.4 / sec))
    cr = flt(noise(sec), 'band', [700, 6000]) * np.exp(-tt * 6) * crackle
    rumble = flt(noise(sec), 'low', 200) * np.exp(-tt * (2.0 / sec)) * 0.9
    return np.tanh((body + cr + rumble) * 1.5) * g


def hit(sec=3.0, g=1.0):
    """Impacto de trailer: bumbo grave + prato reverso curto + corpo metálico."""
    tt = t_(sec)
    kick = np.sin(2 * np.pi * np.cumsum(32 + 120 * np.exp(-tt * 18)) / SR) * np.exp(-tt * 1.6)
    metal = sum(np.sin(2 * np.pi * f * tt) for f in (97, 151, 233, 377)) * np.exp(-tt * 2.5) * 0.12
    crash = flt(noise(sec), 'high', 2500) * np.exp(-tt * 2.2) * 0.25
    return np.tanh((kick * 1.4 + metal + crash) * 1.3) * g


def laser():
    tt = t_(0.3)
    f = 2600 * np.exp(-tt * 9) + 260
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.5
    return flt(x, 'band', [250, 7000]) * np.exp(-tt * 8)


def chime():
    tt = t_(0.9)
    x = (np.sin(2 * np.pi * 1318.5 * tt) + 0.6 * np.sin(2 * np.pi * 1975.5 * tt)) * np.exp(-tt * 5)
    x2 = np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt * 5)
    o = x.copy()
    o[int(0.09 * SR):] += x2[: len(o) - int(0.09 * SR)]
    return o * 0.5


def beep(f, sec=0.12):
    tt = t_(sec)
    return flt(np.sin(2 * np.pi * f * tt) * env(len(tt), 0.004, 0.05), 'band', [400, 4000])


# ---------- cama: drone grave contínuo + pulso de tensão ----------
tt = t_(DUR)
bed = flt(noise(DUR), 'low', 160) * 0.5 + np.sin(2 * np.pi * 41.2 * tt) * 0.22 + np.sin(2 * np.pi * 61.7 * tt) * 0.1
bed *= env(N, 0.8, 1.2) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.25 * tt))
bed[int(16.0 * SR):int(16.45 * SR)] *= np.linspace(1, 0.05, int(0.45 * SR))  # silêncio antes do logo
put(bed, 0, 0.32)
for k in range(int(14.0 / 0.97)):  # batimento de tensão (cada 0,97 s) até o chefão
    at = 0.2 + k * 0.97
    tk = t_(0.5)
    put(np.sin(2 * np.pi * np.cumsum(48 + 60 * np.exp(-tk * 25)) / SR) * np.exp(-tk * 7), at, 0.22 + 0.12 * (at / 14))

# ---------- ato 1: ameaça ----------
put(braam(4.2), 0.05, 0.55)
for k in range(8):
    put(beep(880 if k % 2 == 0 else 660), 0.5 + k * 0.48, 0.07, pan=-0.3 if k % 2 else 0.3)
for k in range(3):
    put(beep(1760, 0.06), 1.5 + k * 0.09, 0.08)  # trava do alvo

# ---------- cortes: whoosh + impacto ----------
for at in CUTS:
    put(whoosh(0.8, 300, 5000), at - 0.62, 0.32)
put(hit(3.0), 4.6, 0.65)
put(hit(2.2), 9.4, 0.45)
put(hit(2.0), 14.0, 0.4)

# ---------- ato 2: agente liga ----------
tk = t_(2.2)
put(np.sin(2 * np.pi * np.cumsum(140 + 700 * (tk / 2.2) ** 1.5) / SR) * env(len(tk), 0.05, 0.6) * 0.18, 5.45)
put(whoosh(1.8, 150, 3000), 5.55, 0.4)
put(flt(noise(2.0), 'band', [70, 300]) * env(int(2.0 * SR), 0.3, 0.5), 5.6, 0.3)
for i, at in enumerate((7.7, 8.15, 8.6)):  # decolagem: passagens com doppler
    put(whoosh(1.3, 200, 4200), at, 0.42, pan=(-0.6, 0.6, 0.0)[i])

# ---------- ato 3: batalha ----------
tk = t_(4.6)
put((flt(noise(4.6), 'band', [90, 420]) * 0.6 + np.sin(2 * np.pi * 92 * tk) * 0.2) * env(len(tk), 0.3, 0.4), 9.4, 0.25)
for i, h in enumerate(HITS):
    pan = (-0.4, 0.3, 0.5, -0.2)[i]
    for k in range(3):
        put(laser(), h - 0.32 + k * 0.08, 0.26, pan=pan + (k - 1) * 0.2)
    put(boom(1.6, 58 + i * 5, crackle=0.8), h, 0.55, pan=pan * 0.5)
    put(chime(), h + 0.08, 0.15, pan=-pan)

# ---------- ato 4: chefão ----------
put(riser(1.6), 14.0, 0.6)
for k in range(10):
    put(laser(), 14.05 + k * 0.15, 0.16, pan=(-0.5, 0.0, 0.5)[k % 3])
put(whoosh(0.5, 4000, 200)[::-1], BOOM - 0.5, 0.4)  # sucção antes da explosão
put(boom(4.0, 32, crackle=1.0), BOOM, 0.9)
put(hit(3.0), BOOM, 0.6)
put(flt(noise(3.0), 'low', 110) * np.exp(-t_(3.0) * 1.0), BOOM, 0.7)
tk = t_(1.6)
put(np.sin(2 * np.pi * 3520 * tk) * np.exp(-tk * 2.2) * 0.05, BOOM + 0.1)  # zumbido pós-explosão
c = chime()
put(c, 15.85, 0.2)
put(c, 15.98, 0.14)

# ---------- ato 5: assinatura ----------
put(hit(4.0), 16.4, 0.8)
put(braam(3.5, 32.7), 16.4, 0.45)
tk = t_(5.0)
pad = sum(np.sin(2 * np.pi * f * tk) for f in (130.8, 196.0, 261.6, 329.6)) * env(len(tk), 1.2, 2.0) * 0.05
put(flt(pad, 'low', 1800), 17.6, 1.0)
tk = t_(2.5)
put(sum(np.sin(2 * np.pi * f * tk) for f in (1046.5, 1318.5, 1568, 2093)) * np.exp(-tk * 1.4) * 0.07, 21.7, 0.8)

# ---------- espaço (reverb curto) ----------
ir = flt(rng.standard_normal(int(1.8 * SR)) * np.exp(-t_(1.8) * 3.2), 'low', 6000)
ir /= np.sqrt(np.sum(ir ** 2))
L = L + fftconvolve(L, ir)[:N] * 0.25
R = R + fftconvolve(R, ir)[:N] * 0.25


# ---------- narração ----------
def load_mp3(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-af', 'highpass=f=80,equalizer=f=3500:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768


vo = np.zeros(N)
for p, at in (('vo-a.mp3', 0.3), ('vo-b.mp3', 16.4)):
    x = load_mp3(os.path.join(vo_dir, p))
    i = int(at * SR)
    j = min(N, i + len(x))
    vo[i:j] += x[: j - i]
venv = np.convolve(np.abs(vo), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode='same')
duck = 1 - 0.65 * np.clip(venv / (np.max(venv) * 0.25 + 1e-9), 0, 1)
L = L * duck + vo * 1.2
R = R * duck + vo * 1.2
mix = np.stack([L, R], 1)
mix /= np.max(np.abs(mix)) / 0.89
fade = np.ones(N)
fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR))
mix *= fade[:, None]
pcm = (np.tanh(mix * 1.1) / np.tanh(1.1) * 32767 * 0.95).astype(np.int16)
with wave.open(os.path.join(here, 'mix-raw.wav'), 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(here, 'mix-raw.wav'), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-ar', str(SR), os.path.join(here, 'mix.wav')], check=True)
print('ok')
