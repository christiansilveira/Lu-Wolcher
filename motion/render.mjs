// Uso: node render.mjs [fps=30] [out=out.mp4] [only=<t em segundos p/ PNG de teste>]
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const dir = path.dirname(fileURLToPath(import.meta.url))
const fps = +process.argv[2] || 30, out = process.argv[3] || 'out.mp4', only = process.argv[4]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } })
pg.on('pageerror', (e) => console.error('PAGEERR', e.message))
await pg.goto('file://' + dir + '/index.html'); await pg.evaluate(() => window.ready)
if (only) {
  for (const t of only.split(',')) { await pg.evaluate((t) => window.render(t), +t); await pg.screenshot({ path: `frame_${t}.png` }) }
  await b.close(); process.exit(0)
}
const total = await pg.evaluate(() => window.TOTAL), n = Math.round(total * fps)
const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] })
for (let i = 0; i < n; i++) {
  await pg.evaluate((t) => window.render(t), i / fps)
  const buf = await pg.screenshot({ type: 'jpeg', quality: 95 })
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
}
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close(); console.log('ok', out, n, 'frames')
