# placas rápidas (lanczos, sem IA) só para conferir layout/tempos: plate_tmp/
import os, subprocess, importlib.util, sys
spec = importlib.util.spec_from_file_location('p', 'prep.py')
src = open('prep.py').read().split('run = lambda')[0]
exec(src)
for name, clip, a, b, n in EDL:
    d = f'plate_tmp/{name}'; os.makedirs(d, exist_ok=True)
    k = n / FPS / (b - a)
    vf = f'setpts={k:.5f}*(PTS-STARTPTS),' + 'fps=24' + ',scale=1080:-2:flags=lanczos,crop=1080:1920'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a), '-t', str(b - a + 0.2), '-i', f'src/{clip}.mp4', '-vf', vf, '-frames:v', str(n), '-q:v', '4', '-start_number', '1', f'{d}/%04d.jpg'], check=True)
    print(name, len(os.listdir(d)))
