"""Upscale x4 (Real-ESRGAN realesr-general-x4v3, SRVGGNetCompact) de uma pasta de PNGs.
Uso: python3 upscale.py <entrada_dir> <saida_dir> [denoise 0..1]
"""
import os, sys, numpy as np, torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image
torch.set_num_threads(4)

class SRVGG(nn.Module):
    def __init__(s, nf=64, nc=32, up=4):
        super().__init__(); s.up = up
        b = [nn.Conv2d(3, nf, 3, 1, 1), nn.PReLU(nf)]
        for _ in range(nc): b += [nn.Conv2d(nf, nf, 3, 1, 1), nn.PReLU(nf)]
        b += [nn.Conv2d(nf, 3 * up * up, 3, 1, 1)]
        s.body = nn.ModuleList(b); s.ps = nn.PixelShuffle(up)
    def forward(s, x):
        o = x
        for m in s.body: o = m(o)
        return s.ps(o) + F.interpolate(x, scale_factor=s.up, mode='nearest')

here = os.path.dirname(os.path.abspath(__file__))
sd = torch.load(os.path.join(here, 'models/realesr-general-x4v3.pth'), map_location='cpu')
sd = sd.get('params', sd)
net = SRVGG(); net.load_state_dict(sd); net.eval()
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.endswith('.png') or os.path.exists(os.path.join(dst, f)): continue
    a = np.asarray(Image.open(os.path.join(src, f)).convert('RGB'), dtype=np.float32) / 255
    x = torch.from_numpy(a).permute(2, 0, 1)[None]
    with torch.no_grad(): y = net(x)
    y = (y[0].permute(1, 2, 0).clamp(0, 1).numpy() * 255 + 0.5).astype(np.uint8)
    Image.fromarray(y).save(os.path.join(dst, f), compress_level=1)
print('ok', dst)
