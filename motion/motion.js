// Astrovia — Reels 1080x1920. Tudo é função pura de t (segundos): window.render(t).
const W = 1080, H = 1920, CX = 540
const INK = '#0A0B10', OR = '#FF5A1F', PAPER = '#ECE8E1', BLUE = '#2340FF', WHITE = '#F7F5F0', GREEN = '#1F9D5A', MUTED = '#8A8C98'
const DISP = '"Inter Display", Inter, sans-serif', SANS = 'Inter, sans-serif', SERIF = "'Bitstream Charter', 'DejaVu Serif', serif", MONO = "'DejaVu Sans Mono', monospace"

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
const mixA = (a, b, k) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))) }
const mix = (a, b, k, m = 1) => `rgb(${mixA(a, b, k).map((v) => Math.round(v * m)).join(',')})`

const cv = document.getElementById('c')
const c = cv.getContext('2d')

/* ---------- helpers de desenho ---------- */
function T(s, x, y, o = {}) {
  c.save(); c.font = o.f; c.fillStyle = o.c || WHITE; c.textAlign = o.a || 'left'; c.textBaseline = o.b || 'alphabetic'
  c.globalAlpha *= o.al ?? 1; c.letterSpacing = (o.ls || 0) + 'px'
  if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.sw || 10; c.lineJoin = 'round'; c.strokeText(s, x, y) }
  if (o.outline) { c.strokeStyle = o.c; c.lineWidth = o.outline; c.strokeText(s, x, y) } else c.fillText(s, x, y)
  c.restore()
}
function tw(s, f, ls = 0) { c.save(); c.font = f; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.restore(); return w }
function rr(x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r) }
function bg(col) { c.fillStyle = col; c.fillRect(-W, -H, W * 3, H * 3) }
// linha que sobe de dentro de uma máscara
function rise(k, y, size, fn) {
  if (k <= 0) return
  c.save(); c.beginPath(); c.rect(-W, y - size * 1.0, W * 3, size * 1.32); c.clip()
  c.translate(0, (1 - eExpo(k)) * size * 1.25); fn(); c.restore()
}
// letras que sobem uma a uma, centralizado
function riseChars(s, y, f, size, col, u, st, stag, ls = 0, xc = CX) {
  const w = tw(s, f, ls); const x0 = xc - w / 2
  c.save(); c.beginPath(); c.rect(-W, y - size, W * 3, size * 1.3); c.clip()
  for (let i = 0; i < s.length; i++) {
    const k = eExpo(seg(u, st + i * stag, 0.5)); if (k <= 0) continue
    T(s[i], x0 + tw(s.slice(0, i), f, ls), y + (1 - k) * size * 1.2, { f, c: col, ls })
  }
  c.restore()
}
function brackets(m, L, col, lw = 4, a = 1) {
  c.save(); c.strokeStyle = col; c.lineWidth = lw; c.globalAlpha *= a
  ;[[m.x, m.y, 1, 1], [m.x + m.w, m.y, -1, 1], [m.x, m.y + m.h, 1, -1], [m.x + m.w, m.y + m.h, -1, -1]].forEach(([x, y, sx, sy]) => {
    c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke()
  })
  c.restore()
}

/* ---------- 00 · o problema ---------- */
function s1(u) {
  bg(INK)
  for (let i = 0; i < 20; i++) for (let j = 0; j < 36; j++) {
    const x = 46 + i * 52, y = 40 + j * 52
    const d = Math.hypot(x - CX, y - 960) / 1100
    const a = clamp((u * 1.8 - d) * 3) * (0.16 + 0.12 * Math.sin(u * 5 + i * 1.3 + j * 0.7))
    c.fillStyle = `rgba(247,245,240,${a})`; c.fillRect(x - 2, y - 2, 4, 4)
  }
  // ponto pulsando
  const pk = eOut(seg(u, 0, 0.35)), fr = (u * 1.4) % 1
  c.save(); c.shadowColor = OR; c.shadowBlur = 40; c.fillStyle = OR; c.beginPath(); c.arc(CX, 640, 11 * pk, 0, 7); c.fill(); c.restore()
  c.strokeStyle = `rgba(255,90,31,${(1 - fr) * 0.7 * (1 - seg(u, 1.3, 0.2))})`; c.lineWidth = 2; c.beginPath(); c.arc(CX, 640, 12 + fr * 130, 0, 7); c.stroke()
  // perguntas datilografadas e riscadas
  const L = ['agenda no caderno?', 'comanda no papel?', 'comissão na calculadora?'], f = `500 58px ${MONO}`
  const x0 = CX - tw(L[2], f) / 2
  L.forEach((s, i) => {
    const st = 0.2 + i * 0.36, n = Math.floor(clamp((u - st) / 0.28) * s.length), y = 860 + i * 104
    if (u < st) return
    const str = seg(u, st + 0.34, 0.14), part = s.slice(0, n)
    T(part, x0, y, { f, c: WHITE, al: 1 - 0.6 * str })
    if (n < s.length) { c.fillStyle = OR; c.fillRect(x0 + tw(part, f) + 6, y - 40, 26, 48) }
    if (str > 0) { c.fillStyle = OR; c.fillRect(x0 - 12, y - 19, (tw(s, f) + 24) * eOut(str), 8) }
  })
  // linha de varredura que vira o fundo laranja
  const ln = eExpo(seg(u, 1.42, 0.2)), open = eIO(seg(u, 1.6, 0.3))
  if (ln > 0) {
    c.save(); c.shadowColor = OR; c.shadowBlur = 50; c.fillStyle = OR
    const hh = lerp(3, H / 2 + 20, open); c.fillRect(CX - (W / 2) * ln, 960 - hh, W * ln, hh * 2); c.restore()
  }
}

/* ---------- CHEGA. ---------- */
function s2(u) {
  bg(OR)
  const f = `900 262px ${DISP}`, ls = -10, word = 'CHEGA.', w = tw(word, f, ls), x0 = CX - w / 2, by = 1050
  const dx = x0 + tw('CHEGA', f, ls) + tw('.', f, ls) / 2 + ls / 2, dy = by - 262 * 0.075
  const z = Math.pow(90, eIn(seg(u, 1.15, 0.5)))
  c.save(); c.translate(dx, dy); c.scale(z, z); c.translate(-dx, -dy)
  c.fillStyle = 'rgba(10,11,16,.07)'; for (let x = 0; x <= W; x += 135) c.fillRect(x, 0, 2, H)
  T('PARA SALÕES, CLÍNICAS E BARBEARIAS', CX, 760, { f: `600 30px ${MONO}`, c: INK, a: 'center', ls: 2, al: seg(u, 0.25, 0.3) })
  for (let i = 0; i < word.length; i++) {
    const k = seg(u, 0.02 + i * 0.05, 0.42); if (k <= 0) continue
    const yy = by - (1 - eBack(k)) * 700
    T(word[i], x0 + tw(word.slice(0, i), f, ls), yy, { f, c: INK, ls })
  }
  const rv = eOut(seg(u, 0.5, 0.45)), sf = `italic 400 104px ${SERIF}`
  c.save(); c.beginPath(); c.rect(0, 1080, W * rv, 160); c.clip()
  T('de improviso.', CX, 1190, { f: sf, c: INK, a: 'center' }); c.restore()
  c.restore()
  if (u > 1.6) bg(INK)
}

/* ---------- Astrovia + campo de voxels ---------- */
function s3(u) {
  bg(INK)
  const g = c.createRadialGradient(CX, 1250, 20, CX, 1250, 700); g.addColorStop(0, 'rgba(255,90,31,.22)'); g.addColorStop(1, 'rgba(10,11,16,0)')
  c.fillStyle = g; c.fillRect(0, 0, W, H)
  const N = 16, TW = 62, TH = 31, ox = CX, oy = 1260, amp = eOut(seg(u, 0, 0.9))
  for (let sum = 0; sum <= 2 * N - 2; sum++) for (let i = 0; i < N; i++) {
    const j = sum - i; if (j < 0 || j >= N) continue
    const d = Math.hypot(i - 7.5, j - 7.5), wv = 0.5 + 0.5 * Math.sin(d * 0.75 - u * 4.4)
    const h = (10 + 90 * wv) * amp + 6, kh = wv * amp
    const sx = ox + (i - j) * TW / 2, sy = oy + (i + j) * TH / 2 - N * TH / 2
    const top = sy - h
    const face = (pts, col) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], n) => (n ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill() }
    face([[sx - TW / 2, top], [sx, top + TH / 2], [sx, sy + TH / 2], [sx - TW / 2, sy]], mix('#1B2C9E', OR, kh, 0.62))
    face([[sx + TW / 2, top], [sx, top + TH / 2], [sx, sy + TH / 2], [sx + TW / 2, sy]], mix('#1B2C9E', OR, kh, 0.42))
    face([[sx, top - TH / 2], [sx + TW / 2, top], [sx, top + TH / 2], [sx - TW / 2, top]], mix('#2B47FF', '#FF7A3D', kh, 1))
  }
  // órbita
  const ok = eOut(seg(u, 0.35, 0.7))
  c.save(); c.translate(CX, 540); c.rotate(-0.12); c.strokeStyle = `rgba(247,245,240,${0.28 * ok})`; c.lineWidth = 2
  c.beginPath(); c.ellipse(0, 0, 500 * ok, 120 * ok, 0, 0, 7); c.stroke()
  const a = u * 2.4; c.shadowColor = OR; c.shadowBlur = 30; c.fillStyle = OR; c.globalAlpha = ok
  c.beginPath(); c.arc(Math.cos(a) * 500 * ok, Math.sin(a) * 120 * ok, 12, 0, 7); c.fill(); c.restore()
  T('APRESENTANDO', CX, 380, { f: `600 30px ${MONO}`, c: WHITE, a: 'center', ls: 8, al: seg(u, 0.1, 0.3) * 0.7 })
  riseChars('ASTROVIA', 590, `900 156px ${DISP}`, 156, WHITE, u, 0.2, 0.045, -4)
  rise(seg(u, 0.75, 0.6), 690, 70, () => T('gestão que trabalha por você', CX, 690, { f: `italic 400 60px ${SERIF}`, c: OR, a: 'center' }))
  T('AGENDA  ·  CAIXA  ·  COMISSÕES  ·  CLIENTES  ·  RELATÓRIOS', CX, 1600, { f: `500 25px ${MONO}`, c: WHITE, a: 'center', ls: 1, al: seg(u, 1.0, 0.4) * 0.75 })
}

/* ---------- 01 · agenda ---------- */
const ST = {
  conf: { bg: '#E6EAFF', bar: BLUE }, now: { bg: '#FFE7DE', bar: OR },
  done: { bg: '#E2F4EA', bar: GREEN }, wait: { bg: '#EFF0F4', bar: '#9AA0B4' },
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
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2E4CFF'); g.addColorStop(1, '#152BC9'); c.fillStyle = g; c.fillRect(-W, -H, W * 3, H * 3)
  ;[[160, 420, 600], [960, 1500, 760]].forEach(([x, y, r]) => { const q = c.createRadialGradient(x, y, 10, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.16)'); q.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = q; c.fillRect(0, 0, W, H) })
  T('AGENDA INTELIGENTE', 90, 250, { f: `600 28px ${MONO}`, c: WHITE, ls: 5, al: seg(u, 0, 0.3) * 0.85 })
  rise(seg(u, 0.05, 0.5), 375, 108, () => T('Sua agenda,', 82, 375, { f: `900 122px ${DISP}`, c: WHITE, ls: -3 }))
  rise(seg(u, 0.17, 0.5), 470, 86, () => T('organizada sozinha.', 90, 470, { f: `italic 400 86px ${SERIF}`, c: WHITE }))
  // cartões de fundo
  const pk = seg(u, 0.22, 0.6), sc = lerp(0.9, 1, eBack(pk)), oy = (1 - eOut(pk)) * 160
  c.save(); c.globalAlpha = clamp(pk * 3)
  c.translate(CX, 1080 + oy); c.scale(sc, sc); c.translate(-CX, -1080)
  ;[[-0.05, 0.1], [0.04, 0.16]].forEach(([r, a]) => { c.save(); c.translate(CX, 1080); c.rotate(r); c.fillStyle = `rgba(255,255,255,${a})`; rr(-460, -440, 920, 900, 40); c.fill(); c.restore() })
  c.save(); c.shadowColor = 'rgba(0,10,60,.45)'; c.shadowBlur = 90; c.shadowOffsetY = 40; c.fillStyle = '#fff'; rr(80, 630, 920, 890, 40); c.fill(); c.restore()
  T('Hoje', 122, 712, { f: `800 40px ${SANS}`, c: INK })
  T('terça, 14 de outubro', 122 + tw('Hoje ', `800 40px ${SANS}`), 712, { f: `500 26px ${SANS}`, c: MUTED })
  c.fillStyle = OR; rr(758, 676, 200, 46, 23); c.fill(); T('13 hoje', 858, 708, { f: `700 22px ${SANS}`, c: '#fff', a: 'center' })
  const colX = (k) => 200 + k * 262, colW = 250, y0 = 818, rowH = 82
  ;[['Amanda', BLUE], ['Juliana', '#B98B88'], ['Camila', GREEN]].forEach(([n, col], k) => {
    c.fillStyle = col; c.beginPath(); c.arc(colX(k) + 22, 762, 20, 0, 7); c.fill()
    T(n[0], colX(k) + 22, 770, { f: `800 20px ${SANS}`, c: '#fff', a: 'center' }); T(n, colX(k) + 52, 771, { f: `700 24px ${SANS}`, c: INK })
  })
  for (let h = 0; h < 8; h++) {
    const y = y0 + h * rowH; c.fillStyle = '#EEF0F4'; c.fillRect(190, y, 790, 2)
    T(`${9 + h}:00`, 104, y + 8, { f: `500 22px ${MONO}`, c: MUTED })
  }
  BLOCKS.forEach(([col, st, dur, title, cli, status], b) => {
    const isNew = status === 'new'
    const k = isNew ? seg(u, 1.55, 0.35) : seg(u, 0.55 + b * 0.055, 0.35); if (k <= 0) return
    const x = colX(col) + 4, y = y0 + (st - 9) * rowH + 4, w = colW - 8, h = dur * rowH - 8
    const s = ST[status === 'flip' || isNew ? 'conf' : status]; let bgc = s.bg, bar = s.bar
    if (status === 'flip') { const f = seg(u, 1.85, 0.25); bgc = mix(ST.conf.bg, ST.now.bg, f); bar = mix(ST.conf.bar, ST.now.bar, f) }
    c.save(); c.globalAlpha = clamp(k * 2); c.translate(x, y); c.scale(1, lerp(0.4, 1, eBack(k)))
    if (isNew) { c.shadowColor = OR; c.shadowBlur = 30 + 20 * Math.sin(u * 12) }
    c.fillStyle = bgc; rr(0, 0, w, h, 14); c.fill(); c.shadowBlur = 0
    if (isNew) { c.strokeStyle = OR; c.lineWidth = 3; rr(0, 0, w, h, 14); c.stroke() }
    c.fillStyle = bar; rr(0, 0, 7, h, [14, 0, 0, 14]); c.fill()
    T(title, 18, 32, { f: `700 22px ${SANS}`, c: INK, ls: -0.6 }); T(cli, 18, 58, { f: `500 20px ${SANS}`, c: '#5E6170' })
    c.fillStyle = bar; c.beginPath(); c.arc(w - 18, 22, 6, 0, 7); c.fill()
    if (status === 'flip' && u > 1.85) { const p = (u * 1.6) % 1; c.strokeStyle = `rgba(255,90,31,${1 - p})`; c.lineWidth = 2; c.beginPath(); c.arc(w - 18, 22, 6 + p * 14, 0, 7); c.stroke() }
    c.restore()
  })
  const ny = y0 + (11.3 + u * 0.12 - 9) * rowH
  if (u > 0.9) { c.globalAlpha = seg(u, 0.9, 0.3); c.fillStyle = OR; c.fillRect(190, ny - 1.5, 790, 3); c.beginPath(); c.arc(190, ny, 8, 0, 7); c.fill(); c.globalAlpha = 1 }
  c.restore()
  // notificação
  const tk = seg(u, 1.2, 0.45)
  if (tk > 0) {
    const ty = lerp(520, 588, eBack(tk)), pr = (u * 1.5) % 1
    c.save(); c.globalAlpha = clamp(tk * 3); c.shadowColor = 'rgba(0,0,30,.5)'; c.shadowBlur = 50; c.shadowOffsetY = 20
    c.fillStyle = INK; rr(150, ty - 50, 780, 104, 52); c.fill(); c.shadowColor = 'transparent'
    c.fillStyle = OR; c.beginPath(); c.arc(214, ty + 2, 12, 0, 7); c.fill()
    c.strokeStyle = `rgba(255,90,31,${1 - pr})`; c.lineWidth = 2; c.beginPath(); c.arc(214, ty + 2, 12 + pr * 16, 0, 7); c.stroke()
    T('Novo agendamento pelo site', 252, ty - 6, { f: `700 31px ${SANS}`, c: WHITE })
    T('Carla M.  ·  Limpeza de Pele  ·  15:00', 252, ty + 32, { f: `500 25px ${SANS}`, c: WHITE, al: 0.7 })
    T('agora', 890, ty - 6, { f: `500 20px ${MONO}`, c: WHITE, a: 'right', al: 0.5 })
    c.restore()
  }
}

/* ---------- 02 · comanda ---------- */
function s5(u) {
  bg(PAPER)
  c.fillStyle = 'rgba(10,11,16,.05)'; for (let y = 0; y < H; y += 64) c.fillRect(0, y, W, 1)
  T('CAIXA + COMISSÃO AUTOMÁTICA', 90, 250, { f: `600 28px ${MONO}`, c: INK, ls: 4, al: seg(u, 0, 0.3) * 0.75 })
  rise(seg(u, 0.05, 0.5), 375, 104, () => T('Fechou a comanda?', 86, 375, { f: `900 94px ${DISP}`, c: INK, ls: -3 }))
  rise(seg(u, 0.17, 0.5), 465, 80, () => T('a comissão já está pronta.', 90, 465, { f: `italic 400 64px ${SERIF}`, c: OR }))
  const pk = seg(u, 0.15, 0.5), shake = u > 1.6 && u < 1.8 ? Math.sin(u * 90) * 7 * (1 - seg(u, 1.6, 0.2)) : 0
  c.save(); c.globalAlpha = clamp(pk * 3); c.translate(shake, (1 - eBack(pk)) * 140)
  const X = 150, Y = 560, Wd = 780, Hd = 820
  c.save(); c.shadowColor = 'rgba(10,11,16,.22)'; c.shadowBlur = 70; c.shadowOffsetY = 30; c.fillStyle = '#fff'
  c.beginPath(); c.moveTo(X + 24, Y); c.arcTo(X + Wd, Y, X + Wd, Y + Hd, 24); c.lineTo(X + Wd, Y + Hd)
  for (let x = X + Wd; x > X; x -= 30) { c.lineTo(x - 15, Y + Hd + 16); c.lineTo(x - 30, Y + Hd) }
  c.arcTo(X, Y, X + Wd, Y, 24); c.closePath(); c.fill(); c.restore()
  T('COMANDA #0428', 190, 628, { f: `600 25px ${MONO}`, c: MUTED, ls: 2 }); T('14/10 · 15:42', 890, 628, { f: `500 25px ${MONO}`, c: MUTED, a: 'right' })
  T('Carla Mendes', 190, 690, { f: `800 46px ${SANS}`, c: INK })
  const dash = (y) => { c.save(); c.setLineDash([10, 10]); c.strokeStyle = '#D9D6CF'; c.lineWidth = 2; c.beginPath(); c.moveTo(190, y); c.lineTo(890, y); c.stroke(); c.restore() }
  dash(730)
  ;[['Limpeza de Pele Profunda', 'com Amanda', 180], ['Design de Sobrancelhas', 'com Bianca', 70], ['Sérum Vitamina C', 'produto · home care', 189]].forEach(([n, s, p], i) => {
    const k = eOut(seg(u, 0.4 + i * 0.13, 0.3)); if (k <= 0) return
    const y = 795 + i * 92; c.save(); c.globalAlpha *= k; c.translate((1 - k) * -50, 0)
    T(n, 190, y, { f: `700 33px ${SANS}`, c: INK, ls: -0.5 }); T(s, 190, y + 34, { f: `500 25px ${SANS}`, c: MUTED })
    T(`R$ ${brl(p)}`, 890, y, { f: `700 33px ${SANS}`, c: INK, a: 'right' }); c.restore()
  })
  dash(1085)
  T('Total', 190, 1150, { f: `600 30px ${SANS}`, c: MUTED })
  T(`R$ ${brl(Math.round(439 * eExpo(seg(u, 0.85, 0.6))))}`, 890, 1158, { f: `900 68px ${DISP}`, c: INK, a: 'right', ls: -2 })
  ;['Pix', 'Cartão', 'Dinheiro'].forEach((m, i) => {
    const k = seg(u, 1.0 + i * 0.06, 0.25); if (k <= 0) return
    const on = i === 0 && u > 1.32, x = 190 + i * 240
    c.save(); c.globalAlpha *= k; c.fillStyle = on ? INK : '#F1EFEA'; rr(x, 1200, 220, 66, 33); c.fill()
    T(m, x + 110, 1243, { f: `700 26px ${SANS}`, c: on ? '#fff' : INK, a: 'center' }); c.restore()
  })
  T('2 profissionais  ·  1 pagamento', 190, 1335, { f: `500 26px ${MONO}`, c: MUTED, al: seg(u, 1.3, 0.3) })
  // carimbo
  const sk = seg(u, 1.55, 0.22)
  if (sk > 0) {
    c.save(); c.translate(770, 668); c.rotate(-0.16); const s = lerp(2.6, 1, eOut(sk)); c.scale(s, s); c.globalAlpha = clamp(sk * 3) * 0.95
    c.strokeStyle = OR; c.lineWidth = 7; rr(-140, -62, 280, 124, 14); c.stroke()
    T('PAGO', 0, 34, { f: `900 96px ${DISP}`, c: OR, a: 'center', ls: 2 }); c.restore()
  }
  c.restore()
  // comissões
  ;[['Amanda', BLUE, 72], ['Bianca', '#8E6F86', 31.5]].forEach(([n, col, v], i) => {
    const k = seg(u, 1.85 + i * 0.15, 0.4); if (k <= 0) return
    const y = 1440 + i * 96 + (1 - eBack(k)) * 60
    c.save(); c.globalAlpha = clamp(k * 3); c.fillStyle = INK; rr(150, y, 780, 80, 40); c.fill()
    c.fillStyle = col; c.beginPath(); c.arc(194, y + 40, 20, 0, 7); c.fill(); T(n[0], 194, y + 48, { f: `800 20px ${SANS}`, c: '#fff', a: 'center' })
    T(n, 230, y + 51, { f: `700 32px ${SANS}`, c: '#fff' }); T('comissão', 230 + tw(n + '  ', `700 32px ${SANS}`), y + 50, { f: `500 24px ${MONO}`, c: '#fff', al: 0.6 })
    T(`+ R$ ${brl(v)}`, 900, y + 52, { f: `800 34px ${SANS}`, c: OR, a: 'right' }); c.restore()
  })
}

/* ---------- 03 · relatórios ---------- */
function s6(u) {
  bg(INK)
  const q = c.createRadialGradient(950, 300, 10, 950, 300, 900); q.addColorStop(0, 'rgba(35,64,255,.35)'); q.addColorStop(1, 'rgba(10,11,16,0)'); c.fillStyle = q; c.fillRect(0, 0, W, H)
  T('RELATÓRIOS EM TEMPO REAL', 90, 250, { f: `600 28px ${MONO}`, c: WHITE, ls: 5, al: seg(u, 0, 0.3) * 0.75 })
  rise(seg(u, 0.05, 0.4), 340, 40, () => T('Faturamento do mês', 90, 340, { f: `600 38px ${SANS}`, c: WHITE, al: 0.7 }))
  rise(seg(u, 0.1, 0.5), 510, 160, () => T(`R$ ${Math.round(48920 * eExpo(seg(u, 0.15, 1.2))).toLocaleString('pt-BR')}`, 82, 510, { f: `900 162px ${DISP}`, c: WHITE, ls: -6 }))
  const ck = seg(u, 0.6, 0.3)
  if (ck > 0) { c.save(); c.globalAlpha = ck; c.fillStyle = OR; rr(90, 550, 150, 50, 25); c.fill(); T('▲ 18%', 165, 585, { f: `800 26px ${SANS}`, c: INK, a: 'center' }); T('vs. mês anterior', 262, 585, { f: `500 28px ${MONO}`, c: WHITE, al: 0.7 }); c.restore() }
  const panel = (x, y, w, h, k) => { c.globalAlpha = clamp(k * 2); c.fillStyle = '#14161F'; rr(x, y + (1 - eOut(k)) * 80, w, h, 32); c.fill(); c.globalAlpha = 1; return (1 - eOut(k)) * 80 }
  // anel
  let o = panel(70, 660, 430, 540, seg(u, 0.25, 0.5))
  const rk = eOut(seg(u, 0.45, 1.0)), pct = Math.round(78 * rk)
  c.lineCap = 'round'; c.lineWidth = 30; c.strokeStyle = '#262A38'; c.beginPath(); c.arc(285, 900 + o, 135, 0, 7); c.stroke()
  if (rk > 0) { c.save(); c.shadowColor = OR; c.shadowBlur = 30; c.strokeStyle = OR; c.beginPath(); c.arc(285, 900 + o, 135, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.78 * rk); c.stroke(); c.restore() }
  c.lineCap = 'butt'
  T(`${pct}%`, 285, 925 + o, { f: `900 76px ${DISP}`, c: WHITE, a: 'center', ls: -2 })
  T('clientes que voltaram', 285, 1105 + o, { f: `italic 400 38px ${SERIF}`, c: WHITE, a: 'center', al: 0.85 })
  T('TAXA DE RETORNO', 285, 1155 + o, { f: `500 24px ${MONO}`, c: WHITE, a: 'center', ls: 3, al: 0.65 })
  // barras
  o = panel(520, 660, 490, 540, seg(u, 0.35, 0.5))
  T('Atendimentos / semana', 552, 724 + o, { f: `600 29px ${SANS}`, c: WHITE, al: 0.7 })
  const vals = [0.42, 0.55, 0.48, 0.66, 0.6, 0.74, 0.69, 0.94]
  vals.forEach((v, i) => {
    const k = eOut(seg(u, 0.55 + i * 0.06, 0.5)), bh = v * 340 * k, x = 560 + i * 55
    if (bh < 1) return
    c.fillStyle = i === 7 ? OR : 'rgba(247,245,240,.85)'; rr(x, 1150 + o - bh, 38, bh, [8, 8, 0, 0]); c.fill()
  })
  const tk = seg(u, 1.25, 0.3)
  if (tk > 0) { const y = 1150 - 0.94 * 340 - 64 + (1 - eOut(tk)) * 20; c.save(); c.globalAlpha = tk; c.fillStyle = WHITE; rr(905, y, 92, 48, 24); c.fill(); T('126', 951, y + 33, { f: `800 24px ${SANS}`, c: INK, a: 'center' }); c.restore() }
  // linha
  o = panel(70, 1220, 940, 320, seg(u, 0.45, 0.5))
  T('Agendamentos online · 30 dias', 110, 1284 + o, { f: `600 29px ${SANS}`, c: WHITE, al: 0.7 })
  const P = []; for (let i = 0; i < 30; i++) P.push([110 + i * (860 / 29), 1500 + o - (40 + i * 4.2 + 30 * Math.sin(i * 0.9) + 18 * Math.sin(i * 2.3))])
  const lk = eIO(seg(u, 0.7, 1.1)) * 29, n = Math.floor(lk), fr = lk - n
  if (lk > 0) {
    const pts = P.slice(0, n + 1); if (n < 29) pts.push([lerp(P[n][0], P[n + 1][0], fr), lerp(P[n][1], P[n + 1][1], fr)])
    const gr = c.createLinearGradient(0, 1300, 0, 1520); gr.addColorStop(0, 'rgba(255,90,31,.35)'); gr.addColorStop(1, 'rgba(255,90,31,0)')
    c.fillStyle = gr; c.beginPath(); c.moveTo(pts[0][0], 1510 + o); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(pts.at(-1)[0], 1510 + o); c.fill()
    c.save(); c.shadowColor = OR; c.shadowBlur = 20; c.strokeStyle = OR; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke()
    const [ex, ey] = pts.at(-1); c.fillStyle = WHITE; c.beginPath(); c.arc(ex, ey, 9, 0, 7); c.fill(); c.restore()
  }
}

/* ---------- 04 · e muito mais (campo de fluxo) ---------- */
const FEATS = ['LEMBRETE NO WHATSAPP', 'AGENDAMENTO ONLINE', 'CLUBE DE ASSINATURA', 'FIDELIDADE', 'AVALIAÇÕES', 'MODO TV', 'LUCRO REAL']
function splitMid(s) { const sp = [...s].map((ch, i) => (ch === ' ' ? i : -1)).filter((i) => i > 0); const m = sp.reduce((b, i) => (Math.abs(i - s.length / 2) < Math.abs(b - s.length / 2) ? i : b), sp[0]); return [s.slice(0, m), s.slice(m + 1)] }
function s7(u) {
  bg(INK)
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = seg(u, 0, 0.3)
  for (let p = 0; p < 700; p++) {
    let x = (rnd(p) * (W + 200) + u * (80 + rnd(p + 7) * 160)) % (W + 200) - 100, y = rnd(p + 1000) * H
    const r = rnd(p + 2000), col = r < 0.12 ? '255,90,31' : r < 0.2 ? '80,110,255' : '247,245,240'
    c.strokeStyle = `rgba(${col},${0.25 + rnd(p + 3000) * 0.45})`; c.lineWidth = 1 + rnd(p + 4000) * 1.8
    c.beginPath(); c.moveTo(x, y)
    for (let s = 0; s < 12; s++) {
      const a = Math.sin(x * 0.0035 + u * 0.9) * 1.7 + Math.cos(y * 0.0042 - u * 0.7) * 1.7
      x += Math.cos(a) * 15; y += Math.sin(a) * 15; c.lineTo(x, y)
    }
    c.stroke()
  }
  c.restore()
  const v = c.createRadialGradient(CX, 960, 50, CX, 960, 620); v.addColorStop(0, 'rgba(10,11,16,.85)'); v.addColorStop(1, 'rgba(10,11,16,0)'); c.fillStyle = v; c.fillRect(0, 0, W, H)
  T('e ainda:', CX, 700, { f: `italic 400 72px ${SERIF}`, c: OR, a: 'center', al: seg(u, 0, 0.2) })
  if (u < 0.05) return
  const per = 0.3, i = Math.min(FEATS.length - 1, Math.floor((u - 0.05) / per)), lu = u - 0.05 - i * per
  const word = FEATS[i], parts = word.length > 11 && word.includes(' ') ? splitMid(word) : [word]
  const base = Math.max(...parts.map((p) => tw(p, `900 100px ${DISP}`, -3))), size = Math.min(210, (900 / base) * 100)
  const f = `900 ${size}px ${DISP}`, sc = lerp(1.18, 1, eExpo(seg(lu, 0, 0.14))), lh = size * 0.95
  const y0 = 960 - ((parts.length - 1) * lh) / 2 + size * 0.36
  c.save(); c.translate(CX, 960); c.scale(sc, sc); c.translate(-CX, -960)
  const style = i % 3
  if (style === 1) { c.fillStyle = OR; c.fillRect(0, y0 - size * 0.92, W, parts.length * lh + size * 0.2) }
  parts.forEach((p, k) => T(p, CX, y0 + k * lh, { f, c: style === 1 ? INK : WHITE, a: 'center', ls: -3, outline: style === 2 ? 3 : 0 }))
  if (style === 2) brackets({ x: 70, y: y0 - size - 30, w: 940, h: parts.length * lh + 70 }, 50, OR, 5)
  c.restore()
  T(`${pad(i + 1)} / ${pad(FEATS.length)}`, CX, 1300, { f: `600 32px ${MONO}`, c: WHITE, a: 'center', ls: 4, al: 0.55 })
}

/* ---------- 05 · tudo junto (explosão) ---------- */
function s8(u) {
  bg(PAPER)
  const k = eOut(seg(u, 0, 0.55)), cy = 820
  c.save(); c.lineCap = 'round'
  for (let i = 0; i < 900; i++) {
    const a = rnd(i) * Math.PI * 2, r1 = 80 + rnd(i + 9) * 70, len = (60 + Math.pow(rnd(i + 5), 1.6) * 640) * k * (1 + 0.12 * Math.sin(u * 9 + i))
    c.strokeStyle = `rgba(10,11,16,${0.3 + rnd(i + 3) * 0.6})`; c.lineWidth = 0.8 + rnd(i + 2) * 2.4
    c.beginPath(); c.moveTo(CX + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(CX + Math.cos(a) * (r1 + len), cy + Math.sin(a) * (r1 + len)); c.stroke()
  }
  c.restore()
  const cr = 62 * k * (1 + 0.06 * Math.sin(u * 14))
  if (cr > 1) {
    c.save(); c.shadowColor = BLUE; c.shadowBlur = 80
    const gc = c.createRadialGradient(CX - 15, cy - 15, 5, CX, cy, cr); gc.addColorStop(0, '#9FB1FF'); gc.addColorStop(0.5, BLUE); gc.addColorStop(1, '#0E1FA8')
    c.fillStyle = gc; c.beginPath(); c.arc(CX, cy, cr, 0, 7); c.fill(); c.restore()
  }
  rise(seg(u, 0.15, 0.45), 1390, 130, () => T('TUDO EM', CX, 1390, { f: `900 136px ${DISP}`, c: INK, a: 'center', ls: -4, stroke: PAPER, sw: 22 }))
  rise(seg(u, 0.25, 0.45), 1525, 130, () => T('UM SÓ LUGAR.', CX, 1525, { f: `900 136px ${DISP}`, c: INK, a: 'center', ls: -4, stroke: PAPER, sw: 22 }))
}

/* ---------- final ---------- */
function s9(u) {
  bg(INK)
  const q = c.createRadialGradient(CX, 1000, 10, CX, 1000, 800); q.addColorStop(0, 'rgba(255,90,31,.16)'); q.addColorStop(1, 'rgba(10,11,16,0)'); c.fillStyle = q; c.fillRect(0, 0, W, H)
  const f = `800 168px ${DISP}`, ls = -6, w = tw('Astrovia', f, ls), gap = 64, x0 = CX - (w + gap) / 2 + gap, by = 980
  const dk = eOut(seg(u, 0, 0.3)), mv = eIO(seg(u, 0.3, 0.55)), dx = lerp(CX, x0 - 40, mv), dy = by - 60
  c.save(); c.shadowColor = OR; c.shadowBlur = 50; c.fillStyle = OR; c.beginPath(); c.arc(dx, dy, 26 * dk, 0, 7); c.fill(); c.restore()
  const rv = eOut(seg(u, 0.38, 0.6))
  if (rv > 0) { c.save(); c.beginPath(); c.rect(x0 - 10, by - 200, (w + 30) * rv, 260); c.clip(); T('Astrovia', x0, by, { f, c: WHITE, ls }); c.restore() }
  T('para salões, clínicas e barbearias', CX, 750, { f: `italic 400 52px ${SERIF}`, c: OR, a: 'center', al: seg(u, 0.9, 0.4) })
  const lk = eOut(seg(u, 0.8, 0.6)); c.fillStyle = 'rgba(247,245,240,.25)'; c.fillRect(CX - 440 * lk, 1040, 880 * lk, 2)
  T('AGENDA · COMANDAS · COMISSÕES · RELATÓRIOS', CX, 1095, { f: `500 25px ${MONO}`, c: WHITE, a: 'center', ls: 2, al: seg(u, 0.95, 0.4) * 0.75 })
  const ck = seg(u, 1.2, 0.5)
  if (ck > 0) {
    const cf = `800 48px ${SANS}`, label = 'Quero para minha empresa  →', cw = tw(label, cf) + 130, s = eBack(ck)
    c.save(); c.translate(CX, 1320); c.scale(s, s); c.globalAlpha = clamp(ck * 3)
    c.shadowColor = OR; c.shadowBlur = 40 + 25 * Math.sin(u * 5); c.fillStyle = OR; rr(-cw / 2, -64, cw, 128, 64); c.fill(); c.shadowBlur = 0
    T(label, 0, 17, { f: cf, c: INK, a: 'center' }); c.restore()
  }
  T('CHAME NO DIRECT', CX, 1460, { f: `600 30px ${MONO}`, c: WHITE, a: 'center', ls: 6, al: seg(u, 1.5, 0.4) * 0.8 })
  // light leak
  const lp = seg(u, 2.05, 0.8), b = Math.sin(lp * Math.PI)
  if (b > 0) {
    c.save(); c.globalCompositeOperation = 'screen'
    const gx = W + 100 - lp * 600, gy = H - lp * 900, g = c.createRadialGradient(gx, gy, 10, gx, gy, 1500)
    g.addColorStop(0, `rgba(255,160,90,${0.95 * b})`); g.addColorStop(0.35, `rgba(255,90,31,${0.6 * b})`); g.addColorStop(1, 'rgba(255,90,31,0)')
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore()
  }
}

/* ---------- timeline ---------- */
const S = [
  { s: 0.0, d: 1.9, dark: 1, lab: '00 / O PROBLEMA', fn: s1 },
  { s: 1.9, d: 1.7, dark: 0, lab: '00 / O PROBLEMA', fn: s2 },
  { s: 3.6, d: 2.4, dark: 1, lab: '— / APRESENTANDO', fn: s3 },
  { s: 6.0, d: 2.6, dark: 1, lab: '01 / AGENDA', fn: s4, wipe: '#2E4CFF' },
  { s: 8.6, d: 2.6, dark: 0, lab: '02 / CAIXA', fn: s5, wipe: PAPER },
  { s: 11.2, d: 2.2, dark: 1, lab: '03 / RELATÓRIOS', fn: s6, wipe: INK },
  { s: 13.4, d: 2.2, dark: 1, lab: '04 / E MUITO MAIS', fn: s7, flash: 1 },
  { s: 15.6, d: 1.0, dark: 0, lab: '05 / TUDO JUNTO', fn: s8, flash: 1 },
  { s: 16.6, d: 2.9, dark: 1, lab: 'ASTROVIA SOLUTIONS', fn: s9, flash: 1 },
]
const TOTAL = 19.5, FPS = 60

function hud(t, dark, lab) {
  const col = dark ? '247,245,240' : '10,11,16', f = `500 24px ${MONO}`
  c.save(); c.globalAlpha = seg(t, 0.15, 0.4)
  brackets({ x: 46, y: 46, w: W - 92, h: H - 92 }, 34, `rgba(${col},.5)`, 3)
  T('ASTROVIA — SISTEMA DE GESTÃO', 84, 108, { f, c: `rgba(${col},.7)`, ls: 3 })
  const fr = Math.floor(t * FPS), tc = `00:00:${pad(Math.floor(t))}:${pad(fr % FPS)}`
  T(tc, 996, 108, { f, c: `rgba(${col},.7)`, a: 'right' })
  const rx = 996 - tw(tc, f) - 24; T('REC', rx, 108, { f, c: `rgba(${col},.7)`, a: 'right' })
  if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = OR; c.beginPath(); c.arc(rx - tw('REC', f) - 16, 101, 7, 0, 7); c.fill() }
  T(lab, 84, 1842, { f, c: `rgba(${col},.7)`, ls: 3 })
  T('©2026', 996, 1842, { f, c: `rgba(${col},.7)`, a: 'right', ls: 3 })
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
  c.save(); c.shadowColor = OR; c.shadowBlur = 30; c.strokeStyle = OR; c.lineWidth = 6; c.beginPath(); c.moveTo(0, y + 160); c.lineTo(W, y - 160); c.stroke(); c.restore()
}

window.render = function (t) {
  t = clamp(t, 0, TOTAL - 1e-6)
  let idx = 0; S.forEach((s, i) => { if (t >= s.s) idx = i })
  const sc = S[idx], nx = S[idx + 1], u = t - sc.s
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'
  c.save(); const z = 1 + 0.035 * seg(u, 0, sc.d); c.translate(CX, 960); c.scale(z, z); c.translate(-CX, -960)
  sc.fn(u); c.restore()
  if (nx && nx.wipe && t > nx.s - 0.34) wipe(nx.wipe, (t - (nx.s - 0.34)) / 0.34)
  if (sc.flash && u < 0.1) { c.fillStyle = `rgba(255,255,255,${0.85 * (1 - u / 0.1)})`; c.fillRect(0, 0, W, H) }
  const dark = nx && nx.wipe && t > nx.s - 0.17 ? nx.dark : sc.dark
  hud(t, dark, sc.lab)
  // grão + vinheta
  c.save(); c.globalAlpha = 0.07; c.globalCompositeOperation = 'overlay'
  const gp = c.createPattern(grain[Math.floor(t * FPS) % 4], 'repeat'); c.fillStyle = gp; c.fillRect(0, 0, W, H); c.restore()
  const v = c.createRadialGradient(CX, 960, 600, CX, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = v; c.fillRect(0, 0, W, H)
}

window.TOTAL = TOTAL
window.FPS = FPS
window.ready = Promise.all([`900 100px ${DISP}`, `800 100px ${DISP}`, `italic 400 50px ${SERIF}`, `500 20px ${MONO}`, `700 20px ${SANS}`].map((f) => document.fonts.load(f))).then(() => { window.render(0); return true })
