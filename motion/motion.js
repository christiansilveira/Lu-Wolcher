// Motion Reels — Lu Wolcher. Tudo é função pura de t (segundos): render(t).
const W = 928, H = 580
const NAVY = '#1B2A63', DEEP = '#0C1230', NAVY2 = '#141C42', ROSE = '#DDB9B5', ROSE2 = '#B5817E', PEARL = '#FBF7F6', LAV = '#A3AEDB'
const SANS = 'Inter, sans-serif', SERIF = "'Bitstream Charter', 'DejaVu Serif', serif", MONO = "'DejaVu Sans Mono', monospace"

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a, b, k) => a + (b - a) * k
const eOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const eExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)))
const eIO = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const eBack = (x) => { x = clamp(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2) }
const seg = (u, a, d) => clamp((u - a) / d)
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')
const imgs = {}
const loadImg = (k, src) => new Promise((res) => { const i = new Image(); i.onload = () => { imgs[k] = i; res() }; i.src = src })

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r) }
function text(c, s, x, y, { font, color, align = 'left', base = 'alphabetic', ls = 0, alpha = 1 }) {
  c.save(); c.font = font; c.fillStyle = color; c.textAlign = align; c.textBaseline = base; c.globalAlpha = alpha
  if ('letterSpacing' in c) c.letterSpacing = ls + 'px'
  c.fillText(s, x, y); c.restore()
}

/* ---------------- Cenas ---------------- */
const SCENES = [
  { s: 0.0, d: 1.4, bg: DEEP, glow: '#2b3a8f', fn: sGrid },
  { s: 1.4, d: 2.4, bg: ROSE, glow: '#DDB9B5', fn: sTitle },
  { s: 3.8, d: 2.6, bg: PEARL, glow: '#8d9ad6', fn: sWords },
  { s: 6.4, d: 2.4, bg: NAVY2, glow: '#3a4aa8', fn: sServices },
  { s: 8.8, d: 2.4, bg: DEEP, glow: LAV, fn: sParticles },
  { s: 11.2, d: 2.2, bg: '#F6E3DF', glow: '#F6E3DF', fn: sBooking },
  { s: 13.4, d: 2.3, bg: DEEP, glow: ROSE, fn: sOutro },
]
const TOTAL = 15.7

function sGrid(c, u) {
  c.fillStyle = DEEP; c.fillRect(0, 0, W, H)
  const cols = 24, rows = 15
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = 20 + i * 40, y = 20 + j * 40
    const dist = Math.hypot(x - W / 2, y - H / 2) / 560
    const a = clamp((u * 1.6 - dist) * 2.2) * (0.35 + 0.35 * Math.sin(u * 6 + i * 1.7 + j * 0.9))
    c.fillStyle = `rgba(163,174,219,${a})`; c.fillRect(x - 1.5, y - 1.5, 3, 3)
  }
  // linha rosé: cai e abre
  const drop = eOut(seg(u, 0.1, 0.45)), open = eIO(seg(u, 0.55, 0.6))
  c.save(); c.shadowColor = ROSE; c.shadowBlur = 24; c.fillStyle = ROSE
  if (open < 1) c.fillRect(W / 2 - 1.5, H / 2 - 260 * drop, 3, 260 * drop)
  const lw = lerp(3, W, open)
  c.fillRect(W / 2 - lw / 2, H / 2 - 1.5 - open * 1.5, lw, 3 + open * 3)
  c.restore()
  text(c, 'ESTÉTICA AVANÇADA', 36, H - 30, { font: `500 12px ${MONO}`, color: ROSE, ls: 5, alpha: seg(u, 0.4, 0.4) * 0.8 })
}

function sTitle(c, u) {
  c.fillStyle = ROSE; c.fillRect(0, 0, W, H)
  // formas suaves ao fundo
  c.save(); c.globalAlpha = 0.5; const g = c.createRadialGradient(W * 0.8, H * 0.1, 10, W * 0.8, H * 0.1, 420)
  g.addColorStop(0, '#F6E3DF'); g.addColorStop(1, 'rgba(246,227,223,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore()
  const punch = 1 + 0.025 * eOut(seg(u, 1.9, 0.5))
  c.save(); c.translate(W / 2, H / 2); c.scale(punch, punch); c.translate(-W / 2, -H / 2)
  const lines = [{ t: 'LU', size: 190, y: 235 }, { t: 'WOLCHER', size: 150, y: 395 }]
  lines.forEach((ln, li) => {
    c.font = `900 ${ln.size}px ${SANS}`; if ('letterSpacing' in c) c.letterSpacing = '-4px'
    const total = c.measureText(ln.t).width
    let x = W / 2 - total / 2
    c.save(); c.beginPath(); c.rect(0, ln.y - ln.size * 0.85, W, ln.size * 1.0); c.clip()
    ;[...ln.t].forEach((ch, i) => {
      const k = eExpo(seg(u, 0.12 + li * 0.2 + i * 0.045, 0.55))
      c.fillStyle = NAVY; c.font = `900 ${ln.size}px ${SANS}`
      c.fillText(ch, x, ln.y + (1 - k) * ln.size * 1.1)
      x += c.measureText(ch).width
    })
    c.restore()
  })
  const k = eOut(seg(u, 1.05, 0.5))
  c.fillStyle = NAVY; c.fillRect(W / 2 - 260 * k, 436, 520 * k, 3)
  text(c, 'estética avançada', W / 2, 500, { font: `italic 400 44px ${SERIF}`, color: NAVY, align: 'center', alpha: seg(u, 1.2, 0.5) })
  c.restore()
}

function sWords(c, u) {
  const W3 = [
    { t: 'CUIDADO', cap: 'atenção em cada detalhe', bg: PEARL, fg: NAVY },
    { t: 'TÉCNICA', cap: 'protocolos avançados', bg: NAVY, fg: PEARL },
    { t: 'CARINHO', cap: 'do primeiro ao último passo', bg: ROSE, fg: NAVY },
  ]
  const per = 0.86, i = Math.min(2, Math.floor(u / per)), lu = u - i * per, w = W3[i]
  c.fillStyle = w.bg; c.fillRect(0, 0, W, H)
  const k = eExpo(seg(lu, 0, 0.3))
  c.save(); c.translate(W / 2, H / 2 - 10); const sc = lerp(1.35, 1, k); c.scale(sc, sc)
  text(c, w.t, 0, 52, { font: `900 156px ${SANS}`, color: w.fg, align: 'center', ls: -3, alpha: clamp(lu * 14) })
  c.restore()
  text(c, w.cap, W / 2, H / 2 + 110, { font: `italic 400 34px ${SERIF}`, color: w.fg, align: 'center', alpha: seg(lu, 0.2, 0.3) })
  // colchetes de enquadramento
  const b = eOut(seg(lu, 0.05, 0.35)), m = lerp(150, 70, b), L = 46
  c.strokeStyle = w.fg; c.lineWidth = 5; c.globalAlpha = 0.9
  ;[[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
    c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke()
  })
  c.globalAlpha = 1
  if (lu < 0.06) { c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, 0, W, H) }
}

function sServices(c, u) {
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, NAVY2); g.addColorStop(1, '#0C1230')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  text(c, 'TRATAMENTOS', 60, 70, { font: `600 15px ${MONO}`, color: ROSE, ls: 6, alpha: seg(u, 0, 0.3) })
  c.fillStyle = ROSE; c.fillRect(60, 86, 840 * eOut(seg(u, 0.05, 0.6)), 2)
  const items = ['Limpeza de Pele', 'Microagulhamento', 'Radiofrequência Facial', 'Drenagem Linfática', 'Lash Lifting', 'Design de Sobrancelhas']
  const active = u < 1.0 ? -1 : Math.min(items.length - 1, Math.floor((u - 1.0) / 0.2))
  items.forEach((name, i) => {
    const k = eOut(seg(u, 0.2 + i * 0.12, 0.45)), y = 112 + i * 74
    const on = i === active
    c.save(); c.globalAlpha = k; c.translate((1 - k) * 90, 0)
    if (on) { c.fillStyle = ROSE; rr(c, 50, y, 860, 62, 31); c.fill() } else { c.strokeStyle = 'rgba(163,174,219,.25)'; c.lineWidth = 1.5; rr(c, 50, y, 860, 62, 31); c.stroke() }
    text(c, String(i + 1).padStart(2, '0'), 84, y + 39, { font: `600 18px ${MONO}`, color: on ? NAVY : ROSE })
    text(c, name, 150, y + 42, { font: `700 32px ${SANS}`, color: on ? NAVY : PEARL, ls: -0.5 })
    text(c, '→', 870, y + 41, { font: `600 28px ${SANS}`, color: on ? NAVY : LAV, align: 'right', alpha: on ? 1 : 0.5 })
    c.restore()
  })
}

function sParticles(c, u) {
  c.fillStyle = DEEP; c.fillRect(0, 0, W, H)
  const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 380); g.addColorStop(0, 'rgba(221,185,181,.18)'); g.addColorStop(1, 'rgba(12,18,48,0)')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  c.save(); c.globalCompositeOperation = 'lighter'
  const N = 900
  for (let i = 0; i < N; i++) {
    const a0 = rnd(i) * Math.PI * 2, band = rnd(i + 900), r0 = 150 + band * 90 + rnd(i + 1800) * 14
    const arrive = eOut(seg(u, rnd(i + 2700) * 0.45, 0.8))
    const r = lerp(520 + rnd(i + 3600) * 200, r0, arrive) * (1 + 0.04 * Math.sin(u * 3 + i))
    const a = a0 + u * (0.6 + band * 0.9) * (i % 2 ? 1 : -0.6)
    const x = W / 2 + Math.cos(a) * r * 1.35, y = H / 2 + Math.sin(a) * r * 0.62
    const sz = 1 + rnd(i + 4500) * 2.4
    const col = i % 3 === 0 ? '221,185,181' : i % 3 === 1 ? '163,174,219' : '251,247,246'
    c.fillStyle = `rgba(${col},${0.25 + 0.55 * arrive})`; c.beginPath(); c.arc(x, y, sz, 0, 6.283); c.fill()
  }
  c.restore()
  const rev = seg(u, 0.5, 0.7)
  c.save(); c.beginPath(); c.rect(0, H / 2 - 50, W * eOut(rev), 100); c.clip()
  text(c, 'Realce sua beleza', W / 2, H / 2 + 20, { font: `italic 400 76px ${SERIF}`, color: PEARL, align: 'center' })
  c.restore()
  text(c, 'PELE  ·  BRILHO  ·  CONFIANÇA', W / 2, H / 2 + 72, { font: `500 16px ${MONO}`, color: ROSE, align: 'center', ls: 6, alpha: seg(u, 1.2, 0.4) })
}

function sBooking(c, u) {
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#F6E3DF'); g.addColorStop(1, '#E6E9F6')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  text(c, 'AGENDAMENTO ONLINE', W / 2, 62, { font: `600 15px ${MONO}`, color: NAVY, align: 'center', ls: 6, alpha: seg(u, 0, 0.3) })
  const pop = eBack(seg(u, 0.05, 0.5)), cx = W / 2, cw = 560, ch = 430, cy = 90
  c.save(); c.translate(cx, cy + ch / 2); c.scale(pop, pop); c.translate(-cx, -(cy + ch / 2))
  c.shadowColor = 'rgba(27,42,99,.28)'; c.shadowBlur = 50; c.shadowOffsetY = 24
  c.fillStyle = '#fff'; rr(c, cx - cw / 2, cy, cw, ch, 28); c.fill(); c.shadowColor = 'transparent'
  const x0 = cx - cw / 2 + 36
  text(c, 'Escolha seu horário', x0, cy + 62, { font: `800 30px ${SANS}`, color: NAVY, ls: -0.5 })
  const chip = (x, y, w, h, label, sel, a, font = `700 20px ${SANS}`) => {
    c.save(); c.globalAlpha = a
    c.fillStyle = sel ? NAVY : '#EEF0FA'; rr(c, x, y, w, h, h / 2); c.fill()
    text(c, label, x + w / 2, y + h / 2 + 7, { font, color: sel ? '#fff' : NAVY, align: 'center' }); c.restore()
  }
  chip(x0, cy + 90, 488, 46, 'Limpeza de Pele Profunda', false, seg(u, 0.35, 0.3), `700 20px ${SANS}`)
  const days = ['SEG 14', 'TER 15', 'QUA 16', 'QUI 17']
  days.forEach((d, i) => chip(x0 + i * 124, cy + 160, 112, 54, d, u > 0.95 && i === 2, seg(u, 0.55 + i * 0.07, 0.3), `800 19px ${SANS}`))
  const times = ['09:00', '10:30', '14:00', '16:30']
  times.forEach((t, i) => chip(x0 + i * 124, cy + 232, 112, 50, t, u > 1.3 && i === 1, seg(u, 0.85 + i * 0.07, 0.3), `800 19px ${SANS}`))
  // botão
  const press = u > 1.55 && u < 1.68 ? 0.95 : 1, ok = u > 1.7
  c.save(); c.translate(cx, cy + 358); c.scale(press, press)
  c.fillStyle = ok ? '#2f9e6b' : NAVY; rr(c, -244, -34, 488, 68, 34); c.fill()
  text(c, ok ? '✓  Horário confirmado' : 'Confirmar agendamento', 0, 9, { font: `800 24px ${SANS}`, color: '#fff', align: 'center' })
  c.restore(); c.restore()
  // cursor
  const pts = [[0.55, W - 110, H - 100], [0.95, x0 + 2 * 124 + 56, cy + 188], [1.32, x0 + 1 * 124 + 56, cy + 258], [1.58, cx, cy + 358], [2.2, cx + 40, cy + 380]]
  let px = pts[0][1], py = pts[0][2]
  for (let i = 1; i < pts.length; i++) if (u >= pts[i - 1][0]) { const k = eIO(seg(u, pts[i - 1][0], pts[i][0] - pts[i - 1][0])); px = lerp(pts[i - 1][1], pts[i][1], k); py = lerp(pts[i - 1][2], pts[i][2], k) }
  c.save(); c.globalAlpha = seg(u, 0.5, 0.2); c.translate(px, py); c.fillStyle = '#111'; c.strokeStyle = '#fff'; c.lineWidth = 2
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.lineTo(8, 23); c.lineTo(14, 36); c.lineTo(19, 34); c.lineTo(13, 21); c.lineTo(23, 21); c.closePath(); c.fill(); c.stroke(); c.restore()
}

function sOutro(c, u) {
  c.fillStyle = DEEP; c.fillRect(0, 0, W, H)
  const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 480); g.addColorStop(0, 'rgba(221,185,181,.35)'); g.addColorStop(1, 'rgba(12,18,48,0)')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  const k = eOut(seg(u, 0.1, 0.8)), s = lerp(0.88, 1, k), lw = 640, lh = lw * 215 / 716
  c.save(); c.translate(W / 2, H / 2 - 10); c.scale(s, s); c.globalAlpha = k
  if ('filter' in c) c.filter = `blur(${(1 - k) * 14}px)`
  c.drawImage(imgs.markLight, -lw / 2, -lh / 2, lw, lh); c.restore()
  if (u < 0.3) { c.fillStyle = `rgba(255,255,255,${0.9 * (1 - u / 0.3)})`; c.fillRect(0, 0, W, H) }
}

/* ---------------- Render ---------------- */
function hex(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) }
function mix(a, b, k) { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})` }

function wipe(c, bg, p) {
  const x = lerp(-120, W + 120, eIO(p)), sk = 90
  c.fillStyle = bg; c.beginPath(); c.moveTo(0, 0); c.lineTo(x + sk, 0); c.lineTo(x - sk, H); c.lineTo(0, H); c.closePath(); c.fill()
}

window.render = function (t) {
  t = clamp(t, 0, TOTAL)
  let idx = 0; SCENES.forEach((sc, i) => { if (t >= sc.s) idx = i })
  const sc = SCENES[idx], nx = SCENES[idx + 1]
  ctx.setTransform(2, 0, 0, 2, 0, 0)
  sc.fn(ctx, t - sc.s)
  if (nx && t > nx.s - 0.28) wipe(ctx, nx.bg, (t - (nx.s - 0.28)) / 0.28)

  // brilho ambiente (cor da cena atual com transição suave)
  const cur = sc.glow, prev = idx > 0 ? SCENES[idx - 1].glow : sc.glow
  const col = mix(prev, cur, eIO(seg(t - sc.s, 0, 0.4)))
  const glow = document.getElementById('glow'); glow.style.background = col
  document.getElementById('lid').style.setProperty('--c', col)

  // câmera
  const p = t / TOTAL
  const ry = lerp(-20, -6, eIO(p)) + Math.sin(t * 0.9) * 1.2
  const rx = lerp(20, 12, eIO(p)) + Math.cos(t * 0.7) * 0.8
  const sca = lerp(0.92, 1.0, eIO(p)), ty = lerp(40, -20, eIO(p))
  document.getElementById('laptop').style.transform = `translateY(${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(-2deg) scale(${sca})`
  document.getElementById('glare').style.backgroundPosition = ''
  document.getElementById('glare').style.transform = `translateX(${Math.sin(t * 0.6) * 60}px)`

  // cabeçalho e CTA
  const head = document.getElementById('head')
  head.style.opacity = eOut(seg(t, 0.5, 0.6)) * (1 - seg(t, 13.1, 0.3)); head.style.transform = `translateY(${(1 - eOut(seg(t, 0.5, 0.6))) * -20}px)`
  const cta = document.getElementById('cta'), ck = eBack(seg(t, 14.0, 0.6))
  cta.style.opacity = clamp(ck); cta.style.transform = `translateX(-50%) translateY(${(1 - clamp(ck)) * 60}px) scale(${1 + 0.02 * Math.sin(Math.max(0, t - 14.6) * 5)})`
}

window.ready = Promise.all([loadImg('markLight', 'assets/mark-light.png'), document.fonts.ready]).then(() => { window.render(0); return true })
window.TOTAL = TOTAL
