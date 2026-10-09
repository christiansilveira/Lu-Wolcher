"""Corta/retima os clipes do Grok (EDL), faz upscale x4 com IA e gera as placas 1080x1920 (24 fps).
Uso: python3 prep.py   -> plate/<plano>/0001.jpg ...
"""
import os, subprocess, shutil
here = os.path.dirname(os.path.abspath(__file__))
FPS = 24
# plano: (clipe, início_src, fim_src, quadros_de_saída)
EDL = [
    ('s1', 'explosao', 0.00, 0.70, 110),   # ameaça: asteroide rachando em câmera lenta
    ('s2', 'drone', 0.00, 3.00, 72),       # agente Astrovia
    ('s3', 'decolagem', 0.00, 1.80, 43),   # decolagem
    ('s4a', 'batalha', 1.25, 2.83, 38),    # batalha: alvo 1
    ('s4b', 'explosao', 0.70, 1.60, 22),   # close: alvo 2
    ('s4c', 'batalha', 4.00, 6.04, 50),    # batalha: alvos 3 e 4
    ('s5a', 'chefao', 0.25, 2.75, 30),     # chefão: rachaduras (2x)
    ('s5b', 'chefao', 2.75, 4.17, 28),     # chefão: explosão
    ('s6', 'lua', 0.00, 6.04, 182),        # assinatura
]
run = lambda *a: subprocess.run(a, check=True)
for name, clip, a, b, n in EDL:
    seq, up, plate = (os.path.join(here, d, name) for d in ('seq', 'up', 'plate'))
    if os.path.isdir(plate) and len(os.listdir(plate)) >= n:
        continue
    k = n / FPS / (b - a)  # >1 = câmera lenta
    vf = f'setpts={k:.5f}*(PTS-STARTPTS),' + (f'minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1' if k > 1.15 else f'fps={FPS}')
    shutil.rmtree(seq, ignore_errors=True); os.makedirs(seq)
    run('ffmpeg', '-v', 'error', '-ss', str(a), '-t', str(b - a + 0.2), '-i', os.path.join(here, 'src', clip + '.mp4'), '-vf', vf, '-frames:v', str(n), '-start_number', '1', os.path.join(seq, '%04d.png'))
    got = len(os.listdir(seq))
    if got < n:  # completa repetindo o último quadro
        for i in range(got + 1, n + 1): shutil.copy(os.path.join(seq, f'{got:04d}.png'), os.path.join(seq, f'{i:04d}.png'))
    run('python3', os.path.join(here, 'upscale.py'), seq, up)
    os.makedirs(plate, exist_ok=True)
    run('ffmpeg', '-v', 'error', '-y', '-i', os.path.join(up, '%04d.png'), '-vf', 'scale=1080:-2:flags=lanczos,crop=1080:1920', '-q:v', '2', '-start_number', '1', os.path.join(plate, '%04d.jpg'))
    print(name, n, 'ok', flush=True)
print('pronto')
