// Uso: node render.mjs [saida.mp4]            -> vídeo completo (60fps)
//      node render.mjs --frames 1.2,4.5,8.0    -> PNGs de teste (frame_<t>.png)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] })
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } })
pg.on('pageerror', (e) => console.error('PAGEERR', e.message))
await pg.goto(process.env.URL || 'http://127.0.0.1:8765/index.html')
await pg.evaluate(() => window.ready)
const grab = (t, type) => pg.evaluate(async ([t, type]) => { await window.render(t); return document.getElementById('out').toDataURL(type, 0.95).split(',')[1] }, [t, type])

if (args[0] === '--frames') {
  const { writeFileSync } = await import('node:fs')
  for (const t of args[1].split(',')) writeFileSync(path.join(dir, `frame_${t}.png`), Buffer.from(await grab(+t, 'image/png'), 'base64'))
} else {
  const out = path.resolve(dir, args[0] || 'astrovia-reels.mp4')
  const { TOTAL, FPS } = await pg.evaluate(() => ({ TOTAL: window.TOTAL, FPS: window.FPS }))
  const n = Math.round(TOTAL * FPS)
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '15', '-preset', 'slow', '-profile:v', 'high', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] })
  for (let i = 0; i < n; i++) {
    const buf = Buffer.from(await grab(i / FPS, 'image/jpeg'), 'base64')
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r))
  console.log('ok', out, n, 'frames')
}
await b.close()
