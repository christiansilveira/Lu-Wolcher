"""Desenho de som do filme 'Agentes Astrovia' (23 s): efeitos sintetizados + narração.
Uso: python3 sfx.py  -> mix.wav (48 kHz estéreo)
"""
import os
import subprocess
import wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 23.0
N = int(DUR * SR)
here = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(3)
L = np.zeros(N)
R = np.zeros(N)


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def flt(x, kind, f):
    return sosfilt(butter(2, np.array(f) / (SR / 2), kind, output='sos'), x)


def put(x, at, g=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    j = min(N, i + len(x))
    L[i:j] += x[: j - i] * g * np.sqrt(0.5 * (1 - pan))
    R[i:j] += x[: j - i] * g * np.sqrt(0.5 * (1 + pan))


def env(n, a, r):
    e = np.ones(n)
    A, Rr = int(a * SR), int(r * SR)
    e[:A] = np.linspace(0, 1, A)
    e[-Rr:] *= np.linspace(1, 0, Rr)
    return e


def noise(sec):
    return rng.standard_normal(int(sec * SR))


# ---------- ambiente: zumbido grave do espaço ----------
t = t_(DUR)
amb = flt(noise(DUR), 'low', 180) * 0.6 + np.sin(2 * np.pi * 41 * t) * 0.25 + np.sin(2 * np.pi * 61.7 * t) * 0.12
amb *= env(N, 1.5, 1.5) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.13 * t))
put(amb, 0, 0.35)

# ---------- alarme do HUD (cena 1) ----------
for k in range(9):
    tt = t_(0.16)
    f = 880 if k % 2 == 0 else 660
    b = np.sin(2 * np.pi * f * tt) * env(len(tt), 0.005, 0.06)
    put(flt(b, 'band', [400, 3000]), 0.45 + k * 0.48, 0.10, pan=-0.3 if k % 2 else 0.3)


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
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * k ** 2) / SR) * 0.25
    return (flt(noise(sec), 'high', 1500) * 0.4 + tone) * k ** 2.2 * g


def boom(sec, f0=55, g=1.0, crackle=0.5):
    tt = t_(sec)
    f = f0 + 90 * np.exp(-tt * 14)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * (3.2 / sec * 1.2))
    cr = flt(noise(sec), 'band', [800, 6000]) * np.exp(-tt * 7) * crackle
    rumble = flt(noise(sec), 'low', 220) * np.exp(-tt * (2.2 / sec)) * 0.8
    return np.tanh((body + cr + rumble) * 1.4) * g


def laser():
    tt = t_(0.28)
    f = 2400 * np.exp(-tt * 9) + 300
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.5
    return flt(x, 'band', [250, 7000]) * np.exp(-tt * 9)


def chime():
    tt = t_(0.9)
    x = (np.sin(2 * np.pi * 1318.5 * tt) + 0.6 * np.sin(2 * np.pi * 1975.5 * tt)) * np.exp(-tt * 5)
    x2 = np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt * 5)
    out = x.copy()
    out[int(0.09 * SR):] += x2[: len(out) - int(0.09 * SR)]
    return out * 0.5


# cortes com "swell"
for at in (5.0, 8.0, 16.0):
    put(whoosh(0.9, 300, 4000), at - 0.75, 0.35)
# decolagem dos drones
for i, at in enumerate((5.3, 5.65, 6.0)):
    put(whoosh(1.6, 200, 3500), at, 0.45, pan=-0.4 + i * 0.4)
    tt = t_(1.4)
    whine = np.sin(2 * np.pi * np.cumsum(300 + 900 * (tt / 1.4)) / SR) * env(len(tt), 0.05, 0.6) * 0.12
    put(whine, at, 1.0, pan=-0.4 + i * 0.4)
# caças passando (doppler)
for a, b_ in ((6.3, 1.3), (10.2, 1.2)):
    tt = t_(b_)
    k = tt / b_
    f = 180 * (1.3 - 0.6 * k)
    eng = flt(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + noise(b_) * 0.5, 'band', [120, 3500])
    eng *= np.sin(np.pi * k) ** 2
    for s in range(len(eng)):
        pass
    put(eng * 0.9, a, 0.5, pan=-0.8)
    put(eng * 0.9, a + 0.05, 0.5, pan=0.8)
# zumbido de motor na perseguição
tt = t_(8.0)
hum = (flt(noise(8.0), 'band', [80, 400]) * 0.6 + np.sin(2 * np.pi * 92 * tt) * 0.2) * env(len(tt), 0.4, 0.8)
put(hum, 8.0, 0.25)
# alvos: laser → explosão → plim
HITS = [8.5, 9.2, 9.9, 10.6, 11.3, 12.0, 12.7]
for i, h in enumerate(HITS):
    pan = (-0.5, 0.0, 0.5)[i % 3]
    put(laser(), h - 0.2, 0.32, pan=pan)
    put(boom(1.4, 60 + i * 4, crackle=0.7), h, 0.42, pan=pan * 0.5)
    put(chime(), h + 0.06, 0.16, pan=-pan)
# chefão: carga, tiro triplo, mega explosão
put(riser(0.85), 14.1, 0.55)
for k, p in enumerate((-0.5, 0.0, 0.5)):
    put(laser(), 14.72 + k * 0.03, 0.35, pan=p)
put(boom(3.2, 38, crackle=1.0), 14.95, 0.7)
put(flt(noise(2.5), 'low', 120) * np.exp(-t_(2.5) * 1.2), 14.95, 0.6)
c = chime()
put(c, 15.25, 0.22)
put(c, 15.38, 0.16)
# impacto de trailer sob "Astrovia" + brilho final
put(boom(3.0, 34, crackle=0.2), 16.25, 0.55)
put(riser(1.2, 0.5)[::-1] * 0.6, 16.3, 0.4)
tt = t_(2.5)
shimmer = sum(np.sin(2 * np.pi * f * tt) for f in (1046.5, 1318.5, 1568, 2093)) * np.exp(-tt * 1.4) * 0.08
put(shimmer, 21.4, 0.8)

# reverb curto (espaço)
ir = rng.standard_normal(int(1.6 * SR)) * np.exp(-t_(1.6) * 3.5)
ir = flt(ir, 'low', 6000)
ir /= np.sqrt(np.sum(ir ** 2))
L = L + fftconvolve(L, ir)[:N] * 0.25
R = R + fftconvolve(R, ir)[:N] * 0.25


# ---------- narração ----------
def load_mp3(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-af', 'highpass=f=80,equalizer=f=3500:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768


vo = np.zeros(N)
for p, at in (('vo-a.mp3', 0.3), ('vo-b.mp3', 16.4)):
    x = load_mp3(os.path.join(here, p))
    i = int(at * SR)
    j = min(N, i + len(x))
    vo[i:j] += x[: j - i]
# ducking: efeitos abaixam quando ela fala
venv = np.convolve(np.abs(vo), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode='same')
duck = 1 - 0.7 * np.clip(venv / (np.max(venv) * 0.25 + 1e-9), 0, 1)
L = L * duck + vo * 1.15
R = R * duck + vo * 1.15
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
