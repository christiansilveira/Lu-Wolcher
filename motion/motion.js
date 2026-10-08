// Astrovia Solutions — Reels 1080x1920 na identidade do site. Tudo é função pura de t: window.render(t).
const W = 1080, H = 1920, CX = 540
const BG = '#050308', MAG = '#E2408F', MAG2 = '#FF5FA8', VIO = '#7B5CFF', VIOD = '#2B1866', TEAL = '#3DD9C5'
const WHITE = '#F3F0F7', MUTED = '#8B8798', LAV = '#EEEAF3', CARD = '#0E0B16'
const G = '"Space Grotesk", sans-serif', M = '"Space Mono", monospace', UI = 'Inter, sans-serif'

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a, b, k) => a + (b - a) * k
const seg = (u, a, d) => clamp((u - a) / d)
const eOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const eIn = (x) => Math.pow(clamp(x), 3)
const eExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)))
const eIO = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const eBack = (x) => { x = clamp(x); const k = 1.9; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2) }
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const pad = (n) => String(n).padStart(2, '0')
const brl = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})` }

const cv = document.getElementById('c')
const c = cv.getContext('2d')

/* ---------- helpers ---------- */
function T(s, x, y, o = {}) {
  c.save(); c.font = o.f; c.textAlign = o.a || 'left'; c.textBaseline = 'alphabetic'
  c.globalAlpha *= o.al ?? 1; c.letterSpacing = (o.ls || 0) + 'px'
  const fill = o.grad ? gradFor(s, x, y, o) : o.c || WHITE
  if (o.halo) { c.strokeStyle = o.halo; c.lineWidth = o.hw || 16; c.lineJoin = 'round'; c.strokeText(s, x, y) }
  if (o.outline) { c.strokeStyle = fill; c.lineWidth = o.outline; c.lineJoin = 'round'; c.strokeText(s, x, y) } else { c.fillStyle = fill; c.fillText(s, x, y) }
  c.restore()
}
function gradFor(s, x, y, o) {
  const w = c.measureText(s).width, x0 = o.a === 'center' ? x - w / 2 : o.a === 'right' ? x - w : x
  const g = c.createLinearGradient(x0, y, x0 + w, y); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); return g
}
function tw(s, f, ls = 0) { c.save(); c.font = f; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.restore(); return w }
// maior tamanho (até max) para caber em maxW
function fit(s, wgt, maxW, max, ls = 0) { return Math.min(max, (maxW / tw(s, `${wgt} 100px ${G}`, ls * 100 / max)) * 100) }
function rr(x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r) }
function fillBg(col) { c.fillStyle = col; c.fillRect(-W, -H, W * 3, H * 3) }
function rise(k, y, size, fn) {
  if (k <= 0) return
  c.save(); c.beginPath(); c.rect(-W, y - size * 1.05, W * 3, size * 1.4); c.clip()
  c.translate(0, (1 - eExpo(k)) * size * 1.25); fn(); c.restore()
}
function riseChars(s, y, f, size, u, st, stag, o = {}) {
  const ls = o.ls || 0, x0 = CX - tw(s, f, ls) / 2
  c.save(); c.beginPath(); c.rect(-W, y - size * 1.05, W * 3, size * 1.4); c.clip()
  for (let i = 0; i < s.length; i++) {
    const k = eExpo(seg(u, st + i * stag, 0.5)); if (k <= 0) continue
    T(s[i], x0 + tw(s.slice(0, i), f, ls), y + (1 - k) * size * 1.2, { ...o, f, ls })
  }
  c.restore()
}
function brackets(m, L, col, lw = 3) {
  c.save(); c.strokeStyle = col; c.lineWidth = lw
  ;[[m.x, m.y, 1, 1], [m.x + m.w, m.y, -1, 1], [m.x, m.y + m.h, 1, -1], [m.x + m.w, m.y + m.h, -1, -1]].forEach(([x, y, sx, sy]) => {
    c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke()
  })
  c.restore()
}
// rótulo do site: "—— 01 · SOBRE"
function label(s, x, y, col, al = 1, size = 26) {
  c.save(); c.globalAlpha *= al; c.fillStyle = col; c.fillRect(x, y - size * 0.35, 46, 2)
  T(s, x + 66, y, { f: `400 ${size}px ${M}`, c: col, ls: size * 0.22 }); c.restore()
}
function bigNum(n, x, y, col) { T(n, x, y, { f: `700 360px ${G}`, c: col, outline: 2, a: 'right', ls: -10 }) }
function glow(x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0))
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2)
}
// céu estrelado (assinatura do site)
function stars(u, n = 260, a = 1) {
  for (let i = 0; i < n; i++) {
    const x = rnd(i * 3.1) * W, y = (rnd(i * 7.7) * H + u * (6 + rnd(i) * 14)) % H
    const tw_ = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(u * (2 + rnd(i + 5) * 4) + i))
    const r = rnd(i + 9), col = r < 0.15 ? '61,217,197' : r < 0.28 ? '255,95,168' : '243,240,247'
    c.fillStyle = `rgba(${col},${a * tw_ * (0.25 + rnd(i + 2) * 0.6)})`
    const s = 1 + rnd(i + 4) * 2.2; c.fillRect(x, y, s, s)
  }
}
// galáxia espiral (o hero WebGL do site)
function galaxy(cx, cy, R, rot, tilt, k, n = 2600, alpha = 1) {
  if (k <= 0) return
  c.save(); c.globalCompositeOperation = 'lighter'
  glow(cx, cy, R * 0.55 * k, 'rgba(226,64,143,A)', 0.55 * alpha)
  glow(cx, cy, R * 0.18 * k, 'rgba(255,230,245,A)', 0.9 * alpha)
  for (let i = 0; i < n; i++) {
    const t = Math.pow(rnd(i), 0.75), arm = i % 2
    const ang = arm * Math.PI + t * 4.6 + (rnd(i + 11) - 0.5) * (0.9 - t * 0.5) + rot * (1.6 - t * 0.9)
    const r = t * R * k * (0.92 + rnd(i + 21) * 0.16)
    const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * tilt
    const q = rnd(i + 31)
    let col = t < 0.22 ? '255,214,236' : t < 0.6 ? (q < 0.6 ? '226,64,143' : '123,92,255') : q < 0.45 ? '61,217,197' : q < 0.7 ? '243,240,247' : '190,80,200'
    c.fillStyle = `rgba(${col},${alpha * (0.25 + rnd(i + 41) * 0.6) * (1 - t * 0.35)})`
    const s = 0.8 + rnd(i + 51) * (t < 0.3 ? 2.6 : 2)
    c.fillRect(x, y, s, s)
  }
  c.restore()
}
// ícone da marca: galáxia com anel
function logoIcon(cx, cy, s, rot, k = 1) {
  if (k <= 0) return
  galaxy(cx, cy, s, rot, 0.62, k, 700)
  c.save(); c.translate(cx, cy); c.rotate(-0.5); c.strokeStyle = `rgba(243,240,247,${0.85 * k})`; c.lineWidth = Math.max(2, s * 0.06)
  c.beginPath(); c.ellipse(0, 0, s * 0.42 * k, s * 0.3 * k, 0, 0, 7); c.stroke()
  c.fillStyle = MAG2; c.beginPath(); c.arc(0, 0, s * 0.14 * k, 0, 7); c.fill(); c.restore()
}

/* ---------- 00 · o problema ---------- */
function s1(u) {
  fillBg(BG); stars(u, 220, seg(u, 0, 0.6))
  logoIcon(CX, 600, 120, u * 1.2, eBack(seg(u, 0.05, 0.5)))
  const L = ['agenda no caderno?', 'comanda no papel?', 'comissão na calculadora?'], f = `400 56px ${M}`
  const x0 = CX - tw(L[2], f) / 2
  L.forEach((s, i) => {
    const st = 0.2 + i * 0.36, n = Math.floor(clamp((u - st) / 0.28) * s.length), y = 860 + i * 108
    if (u < st) return
    const str = seg(u, st + 0.34, 0.14), part = s.slice(0, n)
    T(part, x0, y, { f, c: WHITE, al: 1 - 0.6 * str })
    if (n < s.length) { c.fillStyle = MAG; c.fillRect(x0 + tw(part, f) + 6, y - 42, 28, 52) }
    if (str > 0) { c.fillStyle = MAG; c.fillRect(x0 - 12, y - 20, (tw(s, f) + 24) * eOut(str), 8) }
  })
  const ln = eExpo(seg(u, 1.42, 0.2)), open = eIO(seg(u, 1.6, 0.3))
  if (ln > 0) {
    const hh = lerp(3, H / 2 + 20, open), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, MAG); g.addColorStop(1, VIO)
    c.save(); c.shadowColor = MAG; c.shadowBlur = 50; c.fillStyle = g; c.fillRect(CX - (W / 2) * ln, 960 - hh, W * ln, hh * 2); c.restore()
  }
}

/* ---------- CHEGA. ---------- */
function s2(u) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, MAG); g.addColorStop(1, VIO); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3)
  const word = 'CHEGA.', ls = -12, size = fit(word, 700, 960, 290, ls), f = `700 ${size}px ${G}`, w = tw(word, f, ls), x0 = CX - w / 2, by = 1030
  const dx = x0 + tw('CHEGA', f, ls) + tw('.', f, ls) / 2 + ls / 2, dy = by - size * 0.07
  const z = Math.pow(90, eIn(seg(u, 1.15, 0.5)))
  c.save(); c.translate(dx, dy); c.scale(z, z); c.translate(-dx, -dy)
  stars(u, 120, 0.6)
  label('PARA SALÕES, CLÍNICAS E BARBEARIAS', 90, 740, BG, seg(u, 0.25, 0.3), 26)
  for (let i = 0; i < word.length; i++) {
    const k = seg(u, 0.02 + i * 0.05, 0.42); if (k <= 0) continue
    T(word[i], x0 + tw(word.slice(0, i), f, ls), by - (1 - eBack(k)) * 700, { f, c: BG, ls })
  }
  const s2z = fit('DE IMPROVISO.', 700, 960, 140, -4)
  rise(seg(u, 0.5, 0.45), 1180, s2z, () => T('DE IMPROVISO.', CX, 1180, { f: `700 ${s2z}px ${G}`, c: BG, a: 'center', ls: -4, outline: 3 }))
  c.restore()
  if (u > 1.6) fillBg(BG)
}

/* ---------- Astrovia + galáxia ---------- */
function s3(u) {
  fillBg(BG); stars(u, 260)
  const gk = eOut(seg(u, 0, 1.0))
  galaxy(CX, 1260, 540, u * 0.55, 0.42, gk, 4200)
  const ok = eOut(seg(u, 0.4, 0.7))
  c.save(); c.translate(CX, 1260); c.strokeStyle = `rgba(243,240,247,${0.22 * ok})`; c.lineWidth = 2
  c.beginPath(); c.ellipse(0, 0, 470 * ok, 230 * ok, -0.18, 0, 7); c.stroke()
  const a = u * 2.2; c.rotate(-0.18); c.shadowColor = MAG; c.shadowBlur = 30; c.fillStyle = MAG2; c.globalAlpha = ok
  c.beginPath(); c.arc(Math.cos(a) * 470 * ok, Math.sin(a) * 230 * ok, 12, 0, 7); c.fill(); c.restore()
  label('APRESENTANDO', 90, 400, WHITE, seg(u, 0.1, 0.3) * 0.75)
  const sz = fit('SOLUTIONS', 700, 900, 170, -4)
  riseChars('ASTROVIA', 590, `700 ${sz}px ${G}`, sz, u, 0.2, 0.045, { c: WHITE, ls: -4 })
  rise(seg(u, 0.55, 0.5), 590 + sz * 0.92, sz, () => T('SOLUTIONS', CX, 590 + sz * 0.92, { f: `700 ${sz}px ${G}`, c: 'rgba(243,240,247,.55)', a: 'center', ls: -4, outline: 2.5 }))
  rise(seg(u, 0.85, 0.5), 860, 48, () => T('gestão que trabalha por você', CX, 860, { f: `500 50px ${G}`, grad: [TEAL, MAG2], a: 'center' }))
  T('AGENDA · CAIXA · COMISSÕES · CLIENTES · RELATÓRIOS', CX, 1680, { f: `400 24px ${M}`, c: WHITE, a: 'center', ls: 1, al: seg(u, 1.1, 0.4) * 0.7 })
}

/* ---------- 01 · agenda ---------- */
const ST = {
  conf: { bg: '#ECE8FF', bar: '#6B4CFF' }, now: { bg: '#FFE4F0', bar: MAG },
  done: { bg: '#DFF6F2', bar: '#14A893' }, wait: { bg: '#EFEFF3', bar: '#9A97A8' },
}
const BLOCKS = [
  [0, 9, 1.5, 'Limpeza de Pele', 'Ana R.', 'done'], [0, 11, 1, 'Protocolo Glow', 'Bruna S.', 'flip'],
  [0, 13, 1, 'Radiofrequência', 'Paula M.', 'conf'], [0, 14.5, 1, 'Microagulhamento', 'Lia C.', 'wait'],
  [1, 9.5, 1, 'Microagulhamento', 'Rita F.', 'done'], [1, 11, 1.5, 'Drenagem', 'Júlia P.', 'now'],
  [1, 13, 1, 'Lash Lifting', 'Gabi T.', 'conf'], [2, 9, 1, 'Massagem', 'Sofia L.', 'done'],
  [2, 10.5, 1, 'Drenagem', 'Duda A.', 'conf'], [2, 12, 1.5, 'Modeladora', 'Bia N.', 'conf'],
  [2, 14.5, 1, 'Sobrancelha', 'Lu K.', 'wait'], [1, 15, 1, 'Limpeza de Pele', 'Carla M.', 'new'],
]
function s4(u) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2B1866'); g.addColorStop(1, '#0E0824'); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3)
  glow(980, 260, 700, 'rgba(226,64,143,A)', 0.35); glow(80, 1700, 700, 'rgba(61,217,197,A)', 0.14); stars(u, 140, 0.7)
  bigNum('01', 1010, 470, 'rgba(243,240,247,.13)')
  label('AGENDA INTELIGENTE', 90, 250, WHITE, seg(u, 0, 0.3) * 0.8, 28)
  rise(seg(u, 0.05, 0.5), 380, 120, () => T('Sua agenda,', 84, 380, { f: `700 ${fit('Sua agenda,', 700, 900, 124, -4)}px ${G}`, c: WHITE, ls: -4 }))
  rise(seg(u, 0.17, 0.5), 480, 80, () => T('organizada sozinha.', 88, 480, { f: `500 ${fit('organizada sozinha.', 500, 900, 82, -2)}px ${G}`, grad: [TEAL, MAG2], ls: -2 }))
  const pk = seg(u, 0.22, 0.6), sc = lerp(0.9, 1, eBack(pk)), oy = (1 - eOut(pk)) * 160
  c.save(); c.globalAlpha = clamp(pk * 3)
  c.translate(CX, 1080 + oy); c.scale(sc, sc); c.translate(-CX, -1080)
  ;[[-0.05, 0.08], [0.04, 0.13]].forEach(([r, a]) => { c.save(); c.translate(CX, 1080); c.rotate(r); c.fillStyle = `rgba(243,240,247,${a})`; rr(-460, -440, 920, 900, 40); c.fill(); c.restore() })
  c.save(); c.shadowColor = 'rgba(10,0,40,.6)'; c.shadowBlur = 90; c.shadowOffsetY = 40; c.fillStyle = '#fff'; rr(80, 630, 920, 890, 40); c.fill(); c.restore()
  T('Hoje', 122, 712, { f: `800 40px ${UI}`, c: BG })
  T('terça, 14 de outubro', 122 + tw('Hoje ', `800 40px ${UI}`), 712, { f: `500 26px ${UI}`, c: MUTED })
  c.fillStyle = MAG; rr(758, 676, 200, 46, 23); c.fill(); T('13 hoje', 858, 708, { f: `700 22px ${UI}`, c: '#fff', a: 'center' })
  const colX = (k) => 200 + k * 262, colW = 250, y0 = 818, rowH = 82
  ;[['Amanda', '#6B4CFF'], ['Juliana', MAG], ['Camila', '#14A893']].forEach(([n, col], k) => {
    c.fillStyle = col; c.beginPath(); c.arc(colX(k) + 22, 762, 20, 0, 7); c.fill()
    T(n[0], colX(k) + 22, 770, { f: `800 20px ${UI}`, c: '#fff', a: 'center' }); T(n, colX(k) + 52, 771, { f: `700 24px ${UI}`, c: BG })
  })
  for (let h = 0; h < 8; h++) {
    const y = y0 + h * rowH; c.fillStyle = '#EFEDF4'; c.fillRect(190, y, 790, 2)
    T(`${9 + h}:00`, 104, y + 8, { f: `400 22px ${M}`, c: MUTED })
  }
  BLOCKS.forEach(([col, st, dur, title, cli, status], b) => {
    const isNew = status === 'new'
    const k = isNew ? seg(u, 1.55, 0.35) : seg(u, 0.55 + b * 0.055, 0.35); if (k <= 0) return
    const x = colX(col) + 4, y = y0 + (st - 9) * rowH + 4, w = colW - 8, h = dur * rowH - 8
    const s = ST[status === 'flip' || isNew ? 'conf' : status]; let bgc = s.bg, bar = s.bar
    if (status === 'flip') { const f = seg(u, 1.85, 0.25); bgc = mix(ST.conf.bg, ST.now.bg, f); bar = mix(ST.conf.bar, ST.now.bar, f) }
    c.save(); c.globalAlpha = clamp(k * 2); c.translate(x, y); c.scale(1, lerp(0.4, 1, eBack(k)))
    if (isNew) { c.shadowColor = MAG; c.shadowBlur = 30 + 20 * Math.sin(u * 12) }
    c.fillStyle = bgc; rr(0, 0, w, h, 14); c.fill(); c.shadowBlur = 0
    if (isNew) { c.strokeStyle = MAG; c.lineWidth = 3; rr(0, 0, w, h, 14); c.stroke() }
    c.fillStyle = bar; rr(0, 0, 7, h, [14, 0, 0, 14]); c.fill()
    T(title, 18, 32, { f: `700 22px ${UI}`, c: BG, ls: -0.6 }); T(cli, 18, 58, { f: `500 20px ${UI}`, c: '#5E5A6E' })
    c.fillStyle = bar; c.beginPath(); c.arc(w - 18, 22, 6, 0, 7); c.fill()
    if (status === 'flip' && u > 1.85) { const p = (u * 1.6) % 1; c.strokeStyle = `rgba(226,64,143,${1 - p})`; c.lineWidth = 2; c.beginPath(); c.arc(w - 18, 22, 6 + p * 14, 0, 7); c.stroke() }
    c.restore()
  })
  const ny = y0 + (11.3 + u * 0.12 - 9) * rowH
  if (u > 0.9) { c.globalAlpha = seg(u, 0.9, 0.3); c.fillStyle = MAG; c.fillRect(190, ny - 1.5, 790, 3); c.beginPath(); c.arc(190, ny, 8, 0, 7); c.fill(); c.globalAlpha = 1 }
  c.restore()
  const tk = seg(u, 1.2, 0.45)
  if (tk > 0) {
    const ty = lerp(520, 590, eBack(tk)), pr = (u * 1.5) % 1
    c.save(); c.globalAlpha = clamp(tk * 3); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 20
    c.fillStyle = BG; rr(150, ty - 52, 780, 108, 54); c.fill(); c.shadowColor = 'transparent'
    c.strokeStyle = 'rgba(243,240,247,.12)'; c.lineWidth = 2; rr(150, ty - 52, 780, 108, 54); c.stroke()
    c.fillStyle = MAG; c.beginPath(); c.arc(214, ty + 2, 12, 0, 7); c.fill()
    c.strokeStyle = `rgba(226,64,143,${1 - pr})`; c.beginPath(); c.arc(214, ty + 2, 12 + pr * 16, 0, 7); c.stroke()
    T('Novo agendamento pelo site', 252, ty - 6, { f: `700 31px ${G}`, c: WHITE })
    T('Carla M.  ·  Limpeza de Pele  ·  15:00', 252, ty + 32, { f: `400 25px ${G}`, c: WHITE, al: 0.7 })
    T('agora', 890, ty - 6, { f: `400 20px ${M}`, c: TEAL, a: 'right' })
    c.restore()
  }
}

/* ---------- 02 · comanda ---------- */
function s5(u) {
  fillBg(LAV)
  c.fillStyle = 'rgba(5,3,8,.05)'; for (let y = 0; y < H; y += 64) c.fillRect(0, y, W, 1)
  glow(1000, 200, 600, 'rgba(226,64,143,A)', 0.18); glow(60, 1750, 650, 'rgba(123,92,255,A)', 0.2)
  bigNum('02', 1010, 470, 'rgba(5,3,8,.1)')
  label('CAIXA + COMISSÃO AUTOMÁTICA', 90, 250, BG, seg(u, 0, 0.3) * 0.75, 28)
  rise(seg(u, 0.05, 0.5), 375, 100, () => T('Fechou a comanda?', 84, 375, { f: `700 ${fit('Fechou a comanda?', 700, 910, 104, -4)}px ${G}`, c: BG, ls: -4 }))
  rise(seg(u, 0.17, 0.5), 462, 64, () => T('a comissão já está pronta.', 88, 462, { f: `500 ${fit('a comissão já está pronta.', 500, 900, 66, -1)}px ${G}`, grad: [MAG, VIO], ls: -1 }))
  const pk = seg(u, 0.15, 0.5), shake = u > 1.6 && u < 1.8 ? Math.sin(u * 90) * 7 * (1 - seg(u, 1.6, 0.2)) : 0
  c.save(); c.globalAlpha = clamp(pk * 3); c.translate(shake, (1 - eBack(pk)) * 140)
  const X = 150, Y = 560, Wd = 780, Hd = 820
  c.save(); c.shadowColor = 'rgba(43,24,102,.25)'; c.shadowBlur = 70; c.shadowOffsetY = 30; c.fillStyle = '#fff'
  c.beginPath(); c.moveTo(X + 24, Y); c.arcTo(X + Wd, Y, X + Wd, Y + Hd, 24); c.lineTo(X + Wd, Y + Hd)
  for (let x = X + Wd; x > X; x -= 30) { c.lineTo(x - 15, Y + Hd + 16); c.lineTo(x - 30, Y + Hd) }
  c.arcTo(X, Y, X + Wd, Y, 24); c.closePath(); c.fill(); c.restore()
  T('COMANDA #0428', 190, 628, { f: `400 25px ${M}`, c: MUTED, ls: 2 }); T('14/10 · 15:42', 890, 628, { f: `400 25px ${M}`, c: MUTED, a: 'right' })
  T('Carla Mendes', 190, 690, { f: `800 46px ${UI}`, c: BG })
  const dash = (y) => { c.save(); c.setLineDash([10, 10]); c.strokeStyle = '#DCD8E3'; c.lineWidth = 2; c.beginPath(); c.moveTo(190, y); c.lineTo(890, y); c.stroke(); c.restore() }
  dash(730)
  ;[['Limpeza de Pele Profunda', 'com Amanda', 180], ['Design de Sobrancelhas', 'com Bianca', 70], ['Sérum Vitamina C', 'produto · home care', 189]].forEach(([n, s, p], i) => {
    const k = eOut(seg(u, 0.4 + i * 0.13, 0.3)); if (k <= 0) return
    const y = 795 + i * 92; c.save(); c.globalAlpha *= k; c.translate((1 - k) * -50, 0)
    T(n, 190, y, { f: `700 33px ${UI}`, c: BG, ls: -0.5 }); T(s, 190, y + 34, { f: `500 25px ${UI}`, c: MUTED })
    T(`R$ ${brl(p)}`, 890, y, { f: `700 33px ${UI}`, c: BG, a: 'right' }); c.restore()
  })
  dash(1085)
  T('Total', 190, 1150, { f: `600 30px ${UI}`, c: MUTED })
  T(`R$ ${brl(Math.round(439 * eExpo(seg(u, 0.85, 0.6))))}`, 890, 1158, { f: `700 68px ${G}`, c: BG, a: 'right', ls: -2 })
  ;['Pix', 'Cartão', 'Dinheiro'].forEach((m, i) => {
    const k = seg(u, 1.0 + i * 0.06, 0.25); if (k <= 0) return
    const on = i === 0 && u > 1.32, x = 190 + i * 240
    c.save(); c.globalAlpha *= k; c.fillStyle = on ? BG : '#F2F0F5'; rr(x, 1200, 220, 66, 33); c.fill()
    T(m, x + 110, 1243, { f: `700 26px ${UI}`, c: on ? '#fff' : BG, a: 'center' }); c.restore()
  })
  T('2 profissionais  ·  1 pagamento', 190, 1335, { f: `400 26px ${M}`, c: MUTED, al: seg(u, 1.3, 0.3) })
  const sk = seg(u, 1.55, 0.22)
  if (sk > 0) {
    c.save(); c.translate(770, 668); c.rotate(-0.16); const s = lerp(2.6, 1, eOut(sk)); c.scale(s, s); c.globalAlpha = clamp(sk * 3) * 0.95
    c.strokeStyle = MAG; c.lineWidth = 7; rr(-140, -62, 280, 124, 14); c.stroke()
    T('PAGO', 0, 32, { f: `700 92px ${G}`, c: MAG, a: 'center', ls: 2 }); c.restore()
  }
  c.restore()
  ;[['Amanda', '#6B4CFF', 72], ['Bianca', MAG, 31.5]].forEach(([n, col, v], i) => {
    const k = seg(u, 1.85 + i * 0.15, 0.4); if (k <= 0) return
    const y = 1440 + i * 96 + (1 - eBack(k)) * 60
    c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = BG; rr(150, y, 780, 80, 40); c.fill()
    c.fillStyle = col; c.beginPath(); c.arc(194, y + 40, 20, 0, 7); c.fill(); T(n[0], 194, y + 48, { f: `800 20px ${UI}`, c: '#fff', a: 'center' })
    T(n, 230, y + 51, { f: `700 32px ${G}`, c: '#fff' }); T('comissão', 230 + tw(n + '  ', `700 32px ${G}`), y + 50, { f: `400 24px ${M}`, c: '#fff', al: 0.6 })
    T(`+ R$ ${brl(v)}`, 900, y + 52, { f: `700 34px ${G}`, c: TEAL, a: 'right' }); c.restore()
  })
}

/* ---------- 03 · relatórios ---------- */
function s6(u) {
  fillBg(BG); glow(980, 300, 900, 'rgba(123,92,255,A)', 0.32); glow(100, 1500, 700, 'rgba(226,64,143,A)', 0.14); stars(u, 160, 0.6)
  bigNum('03', 1010, 470, 'rgba(243,240,247,.1)')
  label('RELATÓRIOS EM TEMPO REAL', 90, 250, WHITE, seg(u, 0, 0.3) * 0.75, 28)
  rise(seg(u, 0.05, 0.4), 340, 40, () => T('Faturamento do mês', 90, 340, { f: `500 40px ${G}`, c: WHITE, al: 0.75 }))
  rise(seg(u, 0.1, 0.5), 505, 150, () => T(`R$ ${Math.round(48920 * eExpo(seg(u, 0.15, 1.2))).toLocaleString('pt-BR')}`, 82, 505, { f: `700 150px ${G}`, c: WHITE, ls: -6 }))
  const ck = seg(u, 0.6, 0.3)
  if (ck > 0) { c.save(); c.globalAlpha = ck; c.fillStyle = MAG; rr(90, 550, 150, 50, 25); c.fill(); T('▲ 18%', 165, 585, { f: `700 26px ${UI}`, c: '#fff', a: 'center' }); T('vs. mês anterior', 262, 585, { f: `400 28px ${M}`, c: WHITE, al: 0.7 }); c.restore() }
  const panel = (x, y, w, h, k) => {
    const o = (1 - eOut(k)) * 80; c.globalAlpha = clamp(k * 2); c.fillStyle = CARD; rr(x, y + o, w, h, 32); c.fill()
    c.strokeStyle = 'rgba(243,240,247,.08)'; c.lineWidth = 2; rr(x, y + o, w, h, 32); c.stroke(); c.globalAlpha = 1; return o
  }
  let o = panel(70, 660, 430, 540, seg(u, 0.25, 0.5))
  const rk = eOut(seg(u, 0.45, 1.0)), pct = Math.round(78 * rk)
  c.lineCap = 'round'; c.lineWidth = 30; c.strokeStyle = '#211B30'; c.beginPath(); c.arc(285, 900 + o, 135, 0, 7); c.stroke()
  if (rk > 0) {
    const rg = c.createLinearGradient(150, 760, 420, 1040); rg.addColorStop(0, MAG2); rg.addColorStop(1, VIO)
    c.save(); c.shadowColor = MAG; c.shadowBlur = 30; c.strokeStyle = rg; c.beginPath(); c.arc(285, 900 + o, 135, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.78 * rk); c.stroke(); c.restore()
  }
  c.lineCap = 'butt'
  T(`${pct}%`, 285, 925 + o, { f: `700 76px ${G}`, c: WHITE, a: 'center', ls: -2 })
  T('clientes que voltaram', 285, 1105 + o, { f: `500 34px ${G}`, c: WHITE, a: 'center', al: 0.9 })
  T('TAXA DE RETORNO', 285, 1155 + o, { f: `400 23px ${M}`, c: TEAL, a: 'center', ls: 3, al: 0.85 })
  o = panel(520, 660, 490, 540, seg(u, 0.35, 0.5))
  T('Atendimentos / semana', 552, 724 + o, { f: `500 29px ${G}`, c: WHITE, al: 0.75 })
  ;[0.42, 0.55, 0.48, 0.66, 0.6, 0.74, 0.69, 0.94].forEach((v, i) => {
    const bh = v * 340 * eOut(seg(u, 0.55 + i * 0.06, 0.5)), x = 560 + i * 55; if (bh < 1) return
    if (i === 7) { const bg = c.createLinearGradient(0, 1150 - bh, 0, 1150); bg.addColorStop(0, MAG2); bg.addColorStop(1, VIO); c.fillStyle = bg } else c.fillStyle = 'rgba(243,240,247,.85)'
    rr(x, 1150 + o - bh, 38, bh, [8, 8, 0, 0]); c.fill()
  })
  const tk = seg(u, 1.25, 0.3)
  if (tk > 0) { const y = 1150 - 0.94 * 340 - 64 + (1 - eOut(tk)) * 20; c.save(); c.globalAlpha = tk; c.fillStyle = WHITE; rr(905, y, 92, 48, 24); c.fill(); T('126', 951, y + 33, { f: `700 24px ${UI}`, c: BG, a: 'center' }); c.restore() }
  o = panel(70, 1220, 940, 320, seg(u, 0.45, 0.5))
  T('Agendamentos online · 30 dias', 110, 1284 + o, { f: `500 29px ${G}`, c: WHITE, al: 0.75 })
  const P = []; for (let i = 0; i < 30; i++) P.push([110 + i * (860 / 29), 1500 + o - (40 + i * 4.2 + 30 * Math.sin(i * 0.9) + 18 * Math.sin(i * 2.3))])
  const lk = eIO(seg(u, 0.7, 1.1)) * 29, n = Math.floor(lk), fr = lk - n
  if (lk > 0) {
    const pts = P.slice(0, n + 1); if (n < 29) pts.push([lerp(P[n][0], P[n + 1][0], fr), lerp(P[n][1], P[n + 1][1], fr)])
    const gr = c.createLinearGradient(0, 1300, 0, 1520); gr.addColorStop(0, 'rgba(226,64,143,.35)'); gr.addColorStop(1, 'rgba(226,64,143,0)')
    c.fillStyle = gr; c.beginPath(); c.moveTo(pts[0][0], 1510 + o); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(pts.at(-1)[0], 1510 + o); c.fill()
    const lg = c.createLinearGradient(110, 0, 970, 0); lg.addColorStop(0, TEAL); lg.addColorStop(1, MAG2)
    c.save(); c.shadowColor = MAG; c.shadowBlur = 20; c.strokeStyle = lg; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke()
    const [ex, ey] = pts.at(-1); c.fillStyle = WHITE; c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fill(); c.restore()
  }
}

/* ---------- 04 · e muito mais ---------- */
const FEATS = ['LEMBRETE NO WHATSAPP', 'AGENDAMENTO ONLINE', 'CLUBE DE ASSINATURA', 'FIDELIDADE', 'AVALIAÇÕES', 'MODO TV', 'LUCRO REAL']
function splitMid(s) { const sp = [...s].map((ch, i) => (ch === ' ' ? i : -1)).filter((i) => i > 0); const m = sp.reduce((b, i) => (Math.abs(i - s.length / 2) < Math.abs(b - s.length / 2) ? i : b), sp[0]); return [s.slice(0, m), s.slice(m + 1)] }
function s7(u) {
  fillBg(BG)
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = seg(u, 0, 0.3)
  for (let p = 0; p < 700; p++) {
    let x = (rnd(p) * (W + 200) + u * (80 + rnd(p + 7) * 160)) % (W + 200) - 100, y = rnd(p + 1000) * H
    const r = rnd(p + 2000), col = r < 0.15 ? '226,64,143' : r < 0.25 ? '123,92,255' : r < 0.31 ? '61,217,197' : '243,240,247'
    c.strokeStyle = `rgba(${col},${0.25 + rnd(p + 3000) * 0.45})`; c.lineWidth = 1 + rnd(p + 4000) * 1.8
    c.beginPath(); c.moveTo(x, y)
    for (let s = 0; s < 12; s++) {
      const a = Math.sin(x * 0.0035 + u * 0.9) * 1.7 + Math.cos(y * 0.0042 - u * 0.7) * 1.7
      x += Math.cos(a) * 15; y += Math.sin(a) * 15; c.lineTo(x, y)
    }
    c.stroke()
  }
  c.restore()
  glow(CX, 960, 640, 'rgba(5,3,8,A)', 0.88)
  T('e ainda:', CX, 700, { f: `500 64px ${G}`, grad: [TEAL, MAG2], a: 'center', al: seg(u, 0, 0.2) })
  if (u < 0.05) return
  const per = 0.3, i = Math.min(FEATS.length - 1, Math.floor((u - 0.05) / per)), lu = u - 0.05 - i * per
  const word = FEATS[i], parts = word.length > 11 && word.includes(' ') ? splitMid(word) : [word]
  const size = Math.min(...parts.map((p) => fit(p, 700, 920, 200, -4))), f = `700 ${size}px ${G}`
  const sc = lerp(1.18, 1, eExpo(seg(lu, 0, 0.14))), lh = size * 0.98, y0 = 960 - ((parts.length - 1) * lh) / 2 + size * 0.36
  c.save(); c.translate(CX, 960); c.scale(sc, sc); c.translate(-CX, -960)
  const style = i % 3
  if (style === 1) { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, MAG); g.addColorStop(1, VIO); c.fillStyle = g; c.fillRect(0, y0 - size * 0.92, W, parts.length * lh + size * 0.22) }
  parts.forEach((p, k) => T(p, CX, y0 + k * lh, { f, c: style === 1 ? BG : WHITE, a: 'center', ls: -4, outline: style === 2 ? 3 : 0 }))
  if (style === 2) brackets({ x: 60, y: y0 - size - 34, w: 960, h: parts.length * lh + 80 }, 50, TEAL, 5)
  c.restore()
  T(`${pad(i + 1)} / ${pad(FEATS.length)}`, CX, 1300, { f: `400 32px ${M}`, c: WHITE, a: 'center', ls: 4, al: 0.6 })
}

/* ---------- 05 · tudo junto (salto no hiperespaço) ---------- */
function s8(u) {
  fillBg(BG)
  const k = eOut(seg(u, 0, 0.5)), cy = 800
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'
  for (let i = 0; i < 700; i++) {
    const a = rnd(i) * Math.PI * 2, sp = 0.4 + rnd(i + 5) * 1.6
    const d = ((rnd(i + 9) + u * sp * 0.9) % 1), r1 = 60 + d * d * 1300, len = (20 + d * 260) * k
    const r = rnd(i + 3), col = r < 0.2 ? '226,64,143' : r < 0.32 ? '61,217,197' : r < 0.42 ? '123,92,255' : '243,240,247'
    c.strokeStyle = `rgba(${col},${(0.2 + d * 0.8) * k})`; c.lineWidth = 0.8 + d * 3
    c.beginPath(); c.moveTo(CX + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(CX + Math.cos(a) * (r1 + len), cy + Math.sin(a) * (r1 + len)); c.stroke()
  }
  c.restore()
  logoIcon(CX, cy, 150, u * 2.5, eBack(seg(u, 0, 0.45)))
  glow(CX, 1480, 640, 'rgba(5,3,8,A)', 0.92)
  const sz = fit('UM SÓ LUGAR.', 700, 940, 150, -4)
  rise(seg(u, 0.15, 0.45), 1390, sz, () => T('TUDO EM', CX, 1390, { f: `700 ${sz}px ${G}`, c: WHITE, a: 'center', ls: -4 }))
  rise(seg(u, 0.25, 0.45), 1390 + sz, sz, () => T('UM SÓ LUGAR.', CX, 1390 + sz, { f: `700 ${sz}px ${G}`, c: WHITE, a: 'center', ls: -4, outline: 3 }))
}

/* ---------- final ---------- */
function s9(u) {
  fillBg(BG); stars(u, 260)
  galaxy(CX, 980, 720, u * 0.3, 0.38, 1, 1800, 0.35)
  logoIcon(CX, 520, 110, u * 1.4, eBack(seg(u, 0.05, 0.5)))
  const sz = fit('SOLUTIONS', 700, 860, 160, -4)
  riseChars('ASTROVIA', 820, `700 ${sz}px ${G}`, sz, u, 0.2, 0.04, { c: WHITE, ls: -4 })
  rise(seg(u, 0.5, 0.5), 820 + sz * 0.92, sz, () => T('SOLUTIONS', CX, 820 + sz * 0.92, { f: `700 ${sz}px ${G}`, c: 'rgba(243,240,247,.55)', a: 'center', ls: -4, outline: 2.5 }))
  rise(seg(u, 0.8, 0.45), 1090, 46, () => T('sistemas para salões, clínicas e barbearias', CX, 1090, { f: `500 ${fit('sistemas para salões, clínicas e barbearias', 500, 900, 44)}px ${G}`, grad: [TEAL, MAG2], a: 'center' }))
  const ck = seg(u, 1.1, 0.5)
  if (ck > 0) {
    const cf = `700 32px ${M}`, lab = 'QUERO ESSE SISTEMA  →', cw = tw(lab, cf, 5) + 120, s = eBack(ck)
    c.save(); c.translate(CX, 1300); c.scale(s, s); c.globalAlpha = clamp(ck * 3)
    c.shadowColor = 'rgba(226,64,143,.8)'; c.shadowBlur = 40 + 25 * Math.sin(u * 5); c.fillStyle = WHITE; rr(-cw / 2, -58, cw, 116, 58); c.fill(); c.shadowBlur = 0
    T(lab, 0, 11, { f: cf, c: BG, a: 'center', ls: 5 }); c.restore()
  }
  const gk = seg(u, 1.3, 0.5)
  if (gk > 0) {
    const cf = `400 28px ${M}`, lab = 'CHAMAR NO WHATSAPP  →', cw = tw(lab, cf, 5) + 110
    c.save(); c.globalAlpha = gk; c.translate(0, (1 - eOut(gk)) * 30); c.strokeStyle = 'rgba(243,240,247,.25)'; c.lineWidth = 2; rr(CX - cw / 2, 1395, cw, 100, 50); c.stroke()
    T(lab, CX, 1455, { f: cf, c: WHITE, a: 'center', ls: 5, al: 0.85 }); c.restore()
  }
  const dk = seg(u, 1.55, 0.4)
  if (dk > 0) {
    const f = `400 22px ${M}`, lab = 'DISPONÍVEL PARA NOVOS PROJETOS', w = tw(lab, f, 4)
    c.save(); c.globalAlpha = dk; c.fillStyle = TEAL; c.shadowColor = TEAL; c.shadowBlur = 14 + 8 * Math.sin(u * 6)
    c.beginPath(); c.arc(CX - w / 2 - 22, 1592, 7, 0, 7); c.fill(); c.restore()
    T(lab, CX + 12, 1600, { f, c: WHITE, a: 'center', ls: 4, al: dk * 0.6 })
  }
  // clarão de nebulosa
  const lp = seg(u, 2.05, 0.8), b = Math.sin(lp * Math.PI)
  if (b > 0) {
    c.save(); c.globalCompositeOperation = 'screen'
    const gx = W + 100 - lp * 700, gy = H - lp * 1000, g = c.createRadialGradient(gx, gy, 10, gx, gy, 1500)
    g.addColorStop(0, `rgba(255,170,215,${0.9 * b})`); g.addColorStop(0.35, `rgba(226,64,143,${0.6 * b})`); g.addColorStop(0.7, `rgba(123,92,255,${0.3 * b})`); g.addColorStop(1, 'rgba(123,92,255,0)')
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore()
  }
}

/* ---------- timeline ---------- */
const S = [
  { s: 0.0, d: 1.9, dark: 1, lab: '00 · O PROBLEMA', fn: s1 },
  { s: 1.9, d: 1.7, dark: 0, lab: '00 · O PROBLEMA', fn: s2 },
  { s: 3.6, d: 2.4, dark: 1, lab: '— · APRESENTANDO', fn: s3 },
  { s: 6.0, d: 2.6, dark: 1, lab: '01 · AGENDA', fn: s4, wipe: '#2B1866' },
  { s: 8.6, d: 2.6, dark: 0, lab: '02 · CAIXA', fn: s5, wipe: LAV },
  { s: 11.2, d: 2.2, dark: 1, lab: '03 · RELATÓRIOS', fn: s6, wipe: BG },
  { s: 13.4, d: 2.2, dark: 1, lab: '04 · E MUITO MAIS', fn: s7, flash: 1 },
  { s: 15.6, d: 1.0, dark: 1, lab: '05 · TUDO JUNTO', fn: s8, flash: 1 },
  { s: 16.6, d: 2.9, dark: 1, lab: 'ASTROVIA SOLUTIONS', fn: s9, flash: 1 },
]
const TOTAL = 19.5, FPS = 60

function hud(t, dark, lab) {
  const col = dark ? '243,240,247' : '5,3,8', f = `400 22px ${M}`
  c.save(); c.globalAlpha = seg(t, 0.15, 0.4)
  brackets({ x: 46, y: 46, w: W - 92, h: H - 92 }, 34, `rgba(${col},.4)`, 2)
  T('ASTROVIA · CURITIBA / BR', 84, 110, { f, c: `rgba(${col},.75)`, ls: 4 })
  const fr = Math.floor(t * FPS), tc = `00:${pad(Math.floor(t))}:${pad(fr % FPS)}`
  T(tc, 996, 110, { f, c: `rgba(${col},.75)`, a: 'right' })
  const rx = 996 - tw(tc, f) - 22; T('REC', rx, 110, { f, c: `rgba(${col},.75)`, a: 'right' })
  if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = MAG; c.beginPath(); c.arc(rx - tw('REC', f) - 16, 103, 7, 0, 7); c.fill() }
  T(lab, 84, 1846, { f, c: `rgba(${col},.75)`, ls: 3 })
  T('astrovia-solutions.vercel.app', 996, 1846, { f: `400 20px ${M}`, c: `rgba(${col},.6)`, a: 'right' })
  c.restore()
}

const grain = [...Array(4)].map((_, n) => {
  const g = document.createElement('canvas'); g.width = g.height = 256; const x = g.getContext('2d'), id = x.createImageData(256, 256)
  for (let i = 0; i < id.data.length; i += 4) { const v = rnd(i * 0.37 + n * 991.3) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255 }
  x.putImageData(id, 0, 0); return g
})

function wipe(col, p) {
  const y = lerp(H + 260, -260, eIO(p))
  c.fillStyle = col; c.beginPath(); c.moveTo(0, y + 160); c.lineTo(W, y - 160); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill()
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, TEAL); g.addColorStop(0.5, MAG); g.addColorStop(1, VIO)
  c.save(); c.shadowColor = MAG; c.shadowBlur = 30; c.strokeStyle = g; c.lineWidth = 6; c.beginPath(); c.moveTo(0, y + 160); c.lineTo(W, y - 160); c.stroke(); c.restore()
}

window.render = function (t) {
  t = clamp(t, 0, TOTAL - 1e-6)
  let idx = 0; S.forEach((s, i) => { if (t >= s.s) idx = i })
  const sc = S[idx], nx = S[idx + 1], u = t - sc.s
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'
  c.save(); const z = 1 + 0.035 * seg(u, 0, sc.d); c.translate(CX, 960); c.scale(z, z); c.translate(-CX, -960)
  sc.fn(u); c.restore()
  if (nx && nx.wipe && t > nx.s - 0.34) wipe(nx.wipe, (t - (nx.s - 0.34)) / 0.34)
  if (sc.flash && u < 0.1) { c.fillStyle = `rgba(255,220,240,${0.85 * (1 - u / 0.1)})`; c.fillRect(0, 0, W, H) }
  const dark = nx && nx.wipe && t > nx.s - 0.17 ? nx.dark : sc.dark
  hud(t, dark, sc.lab)
  c.save(); c.globalAlpha = 0.07; c.globalCompositeOperation = 'overlay'
  c.fillStyle = c.createPattern(grain[Math.floor(t * FPS) % 4], 'repeat'); c.fillRect(0, 0, W, H); c.restore()
  const v = c.createRadialGradient(CX, 960, 600, CX, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = v; c.fillRect(0, 0, W, H)
}

window.TOTAL = TOTAL
window.FPS = FPS
window.ready = Promise.all([`700 100px ${G}`, `500 100px ${G}`, `400 100px ${G}`, `400 20px ${M}`, `700 20px ${M}`, `700 20px ${UI}`].map((f) => document.fonts.load(f))).then(() => { window.render(0); return true })
