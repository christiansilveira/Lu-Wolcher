// Astrovia — Reels cinético (direção A). História de produto contada por interface, cortada em 124 BPM.
const W = 1080, H = 1920, CX = 540, FPS = 60
const BPM = 124, BEAT = 60 / BPM
const INK = '#0B0A0D', IVORY = '#EFEBE4', MAG = '#E2408F', MAG2 = '#C9327E', GREY = '#8D8893', PAPER = '#FFFFFF', SKY = '#DCDDF5'
const G = '"Space Grotesk", sans-serif', M = '"Space Mono", monospace', UI = 'Inter, sans-serif'

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a, b, k) => a + (b - a) * k
const seg = (u, a, d) => clamp((u - a) / d)
const eOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const eExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)))
const eIO = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const eQIO = (x) => { x = clamp(x); return x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2 }
const eBack = (x, k = 1.4) => { x = clamp(x); return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2) }
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const b2t = (b) => b * BEAT
const brl = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const out = document.getElementById('out').getContext('2d')
const frame = document.createElement('canvas'); frame.width = W; frame.height = H
const c = frame.getContext('2d')
const IMG = {}

/* ---------------- helpers ---------------- */
function T(s, x, y, f, col, o = {}) {
  c.save(); c.font = f; c.textAlign = o.a || 'left'; c.textBaseline = 'alphabetic'; c.letterSpacing = (o.ls || 0) + 'px'; c.globalAlpha *= o.al ?? 1
  if (o.stroke) { c.strokeStyle = col; c.lineWidth = o.stroke; c.lineJoin = 'round'; c.strokeText(s, x, y) } else { c.fillStyle = col; c.fillText(s, x, y) }
  c.restore()
}
function tw(s, f, ls = 0) { c.save(); c.font = f; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.restore(); return w }
function rr(x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r) }
function fill(col) { c.fillStyle = col; c.fillRect(-40, -40, W + 80, H + 80) }
function grid(col, a) { c.save(); c.globalAlpha = a; c.fillStyle = col; for (let i = 1; i < 6; i++) c.fillRect(Math.round((i * W) / 6), 0, 1, H); c.restore() }
function meta(col, l, r, y, a = 1) { T(l, 64, y, `400 22px ${M}`, col, { ls: 1, al: a }); T(r, W - 64, y, `400 22px ${M}`, col, { a: 'right', ls: 1, al: a }) }
function hline(x, y, w, col, k, h = 2) { if (k > 0) { c.fillStyle = col; c.fillRect(x, y, w * eExpo(k), h) } }
// palavra que sobe de dentro de uma máscara
function rise(s, x, y, f, size, col, k, o = {}) {
  if (k <= 0) return
  c.save(); c.beginPath(); c.rect(-W, y - size * 0.98, W * 3, size * 1.22); c.clip()
  T(s, x, y + (1 - eExpo(k)) * size * 1.1, f, col, { ...o, ls: (o.ls || 0) + (1 - eExpo(k)) * size * 0.06 }); c.restore()
}
function screen(im, x, y, w, h, r, sy = 0) {
  c.save(); rr(x, y, w, h, r); c.clip(); const s = w / im.width; c.drawImage(im, 0, sy, im.width, h / s, x, y, w, h); c.restore()
}
function star(x, y, r, col, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath()
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, q = i % 2 ? r * 0.26 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q) }
  c.closePath(); c.fill(); c.restore()
}
function card(x, y, w, h, r, col, sh = 0.18, blur = 50) { c.save(); c.shadowColor = `rgba(20,10,30,${sh})`; c.shadowBlur = blur; c.shadowOffsetY = blur * 0.45; c.fillStyle = col; rr(x, y, w, h, r); c.fill(); c.restore() }
function cursor(x, y, press = 0, a = 1) {
  if (a <= 0) return
  c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(1.6 - press * 0.15, 1.6 - press * 0.15)
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 10; c.shadowOffsetY = 4
  c.fillStyle = '#111'; c.strokeStyle = '#fff'; c.lineWidth = 2.2; c.lineJoin = 'round'
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 28); c.lineTo(7, 21); c.lineTo(12.5, 33); c.lineTo(17.5, 31); c.lineTo(12, 19.5); c.lineTo(21, 19.5); c.closePath(); c.stroke(); c.fill(); c.restore()
}
function ripple(x, y, k, col = '#fff') { if (k <= 0 || k >= 1) return; c.save(); c.strokeStyle = col; c.globalAlpha = 1 - k; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 14 + eOut(k) * 60, 0, 7); c.stroke(); c.restore() }
// caminho do cursor por pontos [beat, x, y]
function path(pts, b) {
  if (b <= pts[0][0]) return [pts[0][1], pts[0][2]]
  for (let i = 1; i < pts.length; i++) if (b <= pts[i][0]) { const k = eQIO((b - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])); return [lerp(pts[i - 1][1], pts[i][1], k), lerp(pts[i - 1][2], pts[i][2], k)] }
  const p = pts[pts.length - 1]; return [p[1], p[2]]
}

/* =========================================================
   1 · GANCHO (beats 0–8): "SUA AGENDA AINDA VIVE NO PAPEL?"
   ========================================================= */
const HOOK = [
  { t: 'SUA', at: 0, y: 700, s: 110, w: 500 },
  { t: 'AGENDA', at: 0.5, y: 900, s: 230, w: 700 },
  { t: 'AINDA', at: 1.5, y: 1030, s: 110, w: 500, x: 70 },
  { t: 'VIVE NO', at: 2, y: 1030, s: 110, w: 500, x: 1010, a: 'right' },
  { t: 'PAPEL?', at: 3, y: 1290, s: 270, w: 700, col: MAG },
]
function sHook(b) {
  fill(INK); grid(IVORY, 0.05)
  meta(IVORY, '(00) O PROBLEMA', 'ASTROVIA', 104, seg(b, 0, 0.5) * 0.7)
  const gl = b > 4.5 ? Math.max(0, Math.sin((b - 4.5) * Math.PI * 2)) * (b < 7 ? 1 : 0) : 0
  const drawWords = (dx, col) => HOOK.forEach((w, i) => {
    const k = seg(b, w.at, 0.45); if (k <= 0) return
    const f = `${w.w} ${w.s}px ${G}`, x = w.x ?? CX, a = w.a || (w.x ? 'left' : 'center')
    rise(w.t, x + dx, w.y, f, w.s, col || w.col || IVORY, k, { a, ls: -w.s * 0.04 })
  })
  // glitch: fatias deslocadas + separação de cor
  if (gl > 0.05) {
    for (let s = 0; s < 14; s++) {
      const y0 = 560 + s * 60, off = (rnd(Math.floor(b * 8) * 31 + s) - 0.5) * 140 * gl
      c.save(); c.beginPath(); c.rect(0, y0, W, 60); c.clip()
      c.globalCompositeOperation = 'lighter'; drawWords(off - 10 * gl, 'rgba(0,220,255,.9)'); drawWords(off + 10 * gl, 'rgba(255,40,140,.9)'); c.restore()
    }
  } else drawWords(0)
  // barras magenta disparando nos beats
  for (let i = 0; i < 9; i++) {
    const at = 4.5 + i * 0.28, k = seg(b, at, 0.35); if (k <= 0 || k >= 1) continue
    const y = 520 + rnd(i * 7) * 900, w = 140 + rnd(i * 3) * 380, dir = i % 2 ? 1 : -1
    const x = dir > 0 ? lerp(-w, W, eOut(k)) : lerp(W, -w, eOut(k))
    c.fillStyle = i % 3 ? MAG : IVORY; c.fillRect(x, y, w, 26 + rnd(i) * 30)
  }
  // colapso numa linha e abertura para o marfim
  const col = seg(b, 7, 0.5), op = seg(b, 7.5, 0.5)
  if (col > 0) { const hh = lerp(0, H / 2 + 20, eExpo(op)); c.fillStyle = MAG; c.fillRect(0, 960 - 2 - hh, W * eExpo(col), 4 + hh * 2); if (op > 0) { c.fillStyle = IVORY; c.fillRect(0, 960 - hh, W, hh * 2) } }
}

/* =========================================================
   2 · MARCA (beats 8–16): ASTRO / VIA + cápsula com tela real
   ========================================================= */
function sBrand(b) {
  const u = b - 8
  fill(IVORY); grid(INK, 0.08)
  meta(INK, '(01) ASTROVIA SOLUTIONS', 'CURITIBA — BR', 104, seg(u, 0.2, 0.6))
  hline(64, 132, W - 128, INK, seg(u, 0, 0.8))
  rise('ASTRO', 40, 640, `700 370px ${G}`, 370, INK, seg(u, 0, 0.5), { ls: -26 })
  rise('VIA', W - 40, 980, `700 370px ${G}`, 370, INK, seg(u, 0.5, 0.5), { ls: -26, a: 'right' })
  // cápsula: cresce, a tela rola; no fim vira a tela cheia (zoom)
  const zk = eQIO(seg(u, 6.3, 1.7))
  const gk = eExpo(seg(u, 1, 0.8))
  const bx = lerp(64, 0, zk), by = lerp(700, 0, zk), bw = lerp(330, W, zk), bh0 = lerp(560, H, zk), br = lerp(165, 0, zk)
  const bh = bh0 * (zk > 0 ? 1 : gk), byy = by + (bh0 - bh) / 2
  if (bh > 1) {
    c.save(); rr(bx, byy, bw, bh, br); c.clip(); c.fillStyle = INK; c.fillRect(bx, byy, bw, bh)
    const im = IMG.booking, s = bw / im.width, sy = 300 + u * 40 * (1 - zk)
    c.globalAlpha = 1 - zk; c.drawImage(im, 0, sy, im.width, bh / s, bx, byy, bw, bh); c.restore()
  }
  star(560, 1150, 34 * eBack(seg(u, 2, 0.5), 2.2), MAG, u * 0.8)
  ;['Sites, sistemas e', 'automações com', 'gesto próprio.'].forEach((s, i) => rise(s, 560, 1250 + i * 62, `500 52px ${G}`, 52, i === 2 ? MAG : INK, seg(u, 2.2 + i * 0.4, 0.5), { ls: -1 }))
  hline(64, 1520, W - 128, INK, seg(u, 3.4, 0.8))
  ;[['SITES', '01'], ['SISTEMAS', '02'], ['AUTOMAÇÃO & IA', '03']].forEach(([s, k], i) => {
    const kk = seg(u, 3.8 + i * 0.5, 0.5), y = 1590 + i * 70; if (kk <= 0) return
    T(k, 64, y, `400 22px ${M}`, GREY, { al: kk }); rise(s, 150, y, `500 40px ${G}`, 40, INK, kk, { ls: -0.5 })
    T('↗', W - 64 - (1 - eExpo(kk)) * 40, y, `400 36px ${G}`, INK, { a: 'right', al: kk })
  })
  meta(INK, 'SCROLL ↓', '©2026', 1850, seg(u, 1, 0.6))
}

/* =========================================================
   3 · VARREDURA (beats 16–22): a tela real sendo "lida"
   ========================================================= */
const CARD3 = { x: 140, y: 360, w: 800, h: 1300, sy: 200 }
const CALLOUTS = [
  { at: 1.0, y0: 605, y1: 761, label: 'COPY QUE VENDE', side: 1 },
  { at: 2.0, y0: 899, y1: 1193, label: 'HORÁRIO LIVRE · TEMPO REAL', side: -1 },
  { at: 3.0, y0: 1237, y1: 1617, label: 'WHATSAPP + INSTAGRAM', side: 1 },
]
function sScan(b) {
  const u = b - 16
  fill(INK)
  c.save(); c.globalAlpha = 0.18; c.fillStyle = IVORY; for (let x = 36; x < W; x += 48) for (let y = 36; y < H; y += 48) c.fillRect(x, y, 2, 2); c.restore()
  const dot = Math.floor(b * 2) % 2 ? 1 : 0.3
  c.fillStyle = MAG; c.globalAlpha = dot; c.beginPath(); c.arc(76, 97, 8, 0, 7); c.fill(); c.globalAlpha = 1
  T('SCANNING', 96, 104, `400 22px ${M}`, IVORY, { ls: 3 }); T('LU WOLCHER — ESTÉTICA AVANÇADA', W - 64, 104, `400 22px ${M}`, GREY, { a: 'right', ls: 1 })
  const { x, y, w, h, sy } = CARD3, im = IMG.booking, s = w / im.width
  const ek = eExpo(seg(u, 0, 0.6)), sc = lerp(1.35, 1, ek)
  c.save(); c.translate(CX, 1010); c.scale(sc, sc); c.translate(-CX, -1010)
  card(x, y, w, h, 46, '#000', 0.6, 80)
  c.save(); rr(x, y, w, h, 46); c.clip(); c.drawImage(im, 0, sy, im.width, h / s, x, y, w, h)
  // varredura
  const sk = seg(u, 0.4, 3.4), sy2 = lerp(y - 60, y + h + 60, eIO(sk))
  if (sk > 0 && sk < 1) {
    c.fillStyle = 'rgba(226,64,143,.10)'; c.fillRect(x, y, w, sy2 - y)
    const g = c.createLinearGradient(0, sy2 - 140, 0, sy2); g.addColorStop(0, 'rgba(226,64,143,0)'); g.addColorStop(1, 'rgba(226,64,143,.55)'); c.fillStyle = g; c.fillRect(x, sy2 - 140, w, 140)
    c.fillStyle = '#fff'; c.fillRect(x, sy2 - 2, w, 3)
  }
  c.restore(); c.restore()
  // callouts
  CALLOUTS.forEach((co, i) => {
    const k = seg(u, co.at, 0.4); if (k <= 0) return
    const pad = 14, bx = x + 26, bw = w - 52, by = co.y0 - pad, bh = co.y1 - co.y0 + pad * 2, L = 36 * eExpo(k)
    c.save(); c.strokeStyle = MAG; c.lineWidth = 4; c.shadowColor = MAG; c.shadowBlur = 16
    ;[[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]].forEach(([px, py, sx, sy_]) => { c.beginPath(); c.moveTo(px, py + sy_ * L); c.lineTo(px, py); c.lineTo(px + sx * L, py); c.stroke() })
    c.restore()
    const f = `400 21px ${M}`, lw = tw(co.label, f, 2) + 44, lx = co.side > 0 ? bx + bw - lw + 10 : bx - 10, ly = by - 26
    c.save(); c.globalAlpha = eOut(k); c.translate(0, (1 - eExpo(k)) * 20); c.fillStyle = MAG; rr(lx, ly, lw, 48, 24); c.fill()
    T(co.label, lx + 22, ly + 32, f, '#fff', { ls: 2 }); c.restore()
  })
  // selo final estilo HUD
  const hk = seg(u, 4.2, 0.4)
  if (hk > 0) {
    const bw = 820, bh = 150, bx = CX - bw / 2, by = 900 - bh / 2, s2 = eBack(hk, 2)
    c.save(); c.translate(CX, 900); c.scale(s2, s2); c.translate(-CX, -900)
    c.shadowColor = MAG; c.shadowBlur = 60; c.fillStyle = 'rgba(11,10,13,.92)'; rr(bx, by, bw, bh, 18); c.fill(); c.shadowBlur = 0
    c.strokeStyle = MAG; c.lineWidth = 4; rr(bx, by, bw, bh, 18); c.stroke()
    for (let i = 0; i < 6; i++) { c.fillStyle = MAG; c.fillRect(bx - 70 + (i % 2) * 20, by + 20 + i * 20, 40, 8); c.fillRect(bx + bw + 30 - (i % 2) * 20, by + 20 + i * 20, 40, 8) }
    T('✓  AGENDADO EM 3 TOQUES', CX, 900 + 16, `700 52px ${G}`, '#fff', { a: 'center', ls: 1 })
    c.restore()
  }
}

/* =========================================================
   4 · MONTADOR (beats 22–30): cursor monta um agendamento
   ========================================================= */
const SVC = [['Limpeza de Pele', 180], ['Protocolo Glow', 220], ['Microagulhamento', 350], ['Radiofrequência', 240], ['Design de Sobrancelhas', 70], ['Lash Lifting', 160]]
const TILE = (i) => ({ x: 686, y: 520 + i * 118, w: 330, h: 102 })
const SLOT = (i) => ({ x: 98, y: 640 + i * 116, w: 544, h: 96 })
function sBuild(b) {
  const u = b - 22
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, MAG); g.addColorStop(1, MAG2); c.fillStyle = g; c.fillRect(0, 0, W, H)
  c.save(); c.globalAlpha = 0.12; c.fillStyle = '#fff'; for (let i = 1; i < 6; i++) c.fillRect(Math.round((i * W) / 6), 0, 1, H); c.restore()
  meta('#fff', '(02) EXPERIÊNCIA', 'AGENDAMENTO ONLINE', 104, 0.8)
  T('Do clique', 64, 1720, `700 96px ${G}`, '#fff', { ls: -4, al: seg(u, 6.6, 0.3) }); T('à confirmação.', 64, 1812, `700 96px ${G}`, INK, { ls: -4, al: seg(u, 6.8, 0.3) })
  c.translate(CX, 300); c.scale(1.06, 1.06); c.translate(-CX + 6, -300 + 10)
  // campo digitando
  const pk = eExpo(seg(u, 0, 0.6)), up = eQIO(seg(u, 1.5, 0.6))
  const pw = lerp(140, 760, pk), py = lerp(880, 300, up)
  card(CX - pw / 2, py - 56, pw, 112, 56, '#fff', 0.25, 40)
  const full = 'Monte seu atendimento', n = Math.floor(clamp((u - 0.4) / 1.0) * full.length), txt = full.slice(0, n)
  c.save(); rr(CX - pw / 2, py - 56, pw, 112, 56); c.clip()
  T(txt, CX - 300, py + 15, `500 42px ${G}`, INK, { ls: -0.5 })
  if (Math.floor(b * 4) % 2 === 0 || n < full.length) { c.fillStyle = MAG; c.fillRect(CX - 300 + tw(txt, `500 42px ${G}`, -0.5) + 4, py - 24, 4, 50) }
  c.restore()
  if (u < 1.6) return
  // painel
  const ak = eExpo(seg(u, 1.6, 0.6))
  c.save(); c.globalAlpha = ak; c.translate(0, (1 - ak) * 80)
  card(70, 430, 600, 1020, 40, '#fff', 0.25, 60)
  T('Seu agendamento', 104, 510, `700 40px ${G}`, INK, { ls: -1 }); T('Lu Wolcher · Estética Avançada', 104, 556, `400 22px ${M}`, GREY)
  for (let i = 0; i < 2; i++) { const s = SLOT(i); c.save(); c.setLineDash([10, 10]); c.strokeStyle = '#D9D4DE'; c.lineWidth = 2; rr(s.x, s.y, s.w, s.h, 22); c.stroke(); c.restore() }
  SVC.forEach(([nm, pr], i) => {
    const t = TILE(i), k = eExpo(seg(u, 1.8 + i * 0.12, 0.5)); if (k <= 0) return
    c.save(); c.translate((1 - k) * 120, 0); c.globalAlpha *= k
    card(t.x, t.y, t.w, t.h, 26, '#fff', 0.2, 30)
    c.fillStyle = '#FBE3EE'; c.beginPath(); c.arc(t.x + 46, t.y + t.h / 2, 24, 0, 7); c.fill(); star(t.x + 46, t.y + t.h / 2, 13, MAG)
    T(nm.length > 16 ? nm.slice(0, 14) + '…' : nm, t.x + 84, t.y + 46, `600 24px ${UI}`, INK); T(`R$ ${pr}`, t.x + 84, t.y + 78, `500 22px ${UI}`, GREY)
    c.restore()
  })
  c.restore()
  // cursor arrasta dois serviços + escolhe horário + confirma
  const T0 = TILE(0), T4 = TILE(4), S0 = SLOT(0), S1 = SLOT(1)
  const P = [[2.3, 980, 1700], [2.8, T0.x + 150, T0.y + 50], [3.0, T0.x + 150, T0.y + 50], [3.6, S0.x + 270, S0.y + 48], [3.85, T4.x + 150, T4.y + 50], [4.05, T4.x + 150, T4.y + 50], [4.6, S1.x + 270, S1.y + 48], [5.3, 330, 1053], [5.5, 330, 1053], [6.2, 370, 1340], [6.4, 370, 1340], [7.4, 760, 1600]]
  const [mx, my] = path(P, u)
  const drag = (s0, s1) => u >= s0 && u < s1
  const placed = [u >= 3.6, u >= 4.6]
  ;[[0, S0, 3.6], [4, S1, 4.6]].forEach(([ti, s, at], j) => {
    if (!placed[j]) return
    const k = eBack(seg(u, at, 0.3), 2), [nm, pr] = SVC[ti]
    c.save(); c.translate(s.x + s.w / 2, s.y + s.h / 2); c.scale(k, k); c.translate(-(s.x + s.w / 2), -(s.y + s.h / 2))
    c.fillStyle = '#FBE3EE'; rr(s.x, s.y, s.w, s.h, 22); c.fill(); star(s.x + 44, s.y + s.h / 2, 14, MAG)
    T(nm, s.x + 76, s.y + 57, `600 24px ${UI}`, INK); T(`R$ ${pr},00`, s.x + s.w - 22, s.y + 57, `600 24px ${UI}`, INK, { a: 'right' }); c.restore()
  })
  // fantasma arrastado
  ;[[0, 3.0, 3.6], [4, 4.05, 4.6]].forEach(([ti, s0, s1]) => {
    if (!drag(s0, s1)) return
    const t = TILE(ti); c.save(); c.globalAlpha = 0.95; c.translate(mx - 150, my - 50); c.rotate(-0.05)
    card(0, 0, t.w, t.h, 26, '#fff', 0.35, 50); star(46, t.h / 2, 13, MAG); T(SVC[ti][0].slice(0, 15), 84, 60, `600 24px ${UI}`, INK); c.restore()
  })
  // horários
  if (u >= 4.8) {
    const hk = eExpo(seg(u, 4.8, 0.5)); T('Quinta, 9 de outubro', 104, 940, `500 24px ${M}`, GREY, { al: hk })
    ;['14:00', '15:00', '16:30'].forEach((h, i) => {
      const x = 98 + i * 186, on = i === 1 && u >= 5.5
      c.save(); c.globalAlpha = hk; c.fillStyle = on ? INK : '#F3F0F5'; rr(x, 1010, 170, 86, 43); c.fill()
      T(h, x + 85, 1065, `600 32px ${UI}`, on ? '#fff' : INK, { a: 'center' }); c.restore()
    })
    const tot = (u >= 3.6 ? 180 : 0) + (u >= 4.6 ? 70 : 0)
    T('Total', 104, 1200, `500 28px ${UI}`, GREY, { al: hk }); T(`R$ ${brl(tot)}`, 636, 1206, `700 56px ${G}`, INK, { a: 'right', al: hk, ls: -1 })
    const ok = u >= 6.4, bp = u >= 6.3 && u < 6.5 ? 0.96 : 1
    c.save(); c.globalAlpha = hk; c.translate(370, 1340); c.scale(bp, bp); c.fillStyle = ok ? '#1F9D5A' : INK; rr(-272, -54, 544, 108, 54); c.fill()
    T(ok ? '✓  Agendado · Qui, 15:00' : 'Confirmar agendamento', 0, 12, `600 34px ${UI}`, '#fff', { a: 'center' }); c.restore()
  }
  ripple(T0.x + 150, T0.y + 50, seg(u, 2.85, 0.4)); ripple(T4.x + 150, T4.y + 50, seg(u, 3.9, 0.4)); ripple(330, 1053, seg(u, 5.35, 0.4)); ripple(370, 1340, seg(u, 6.25, 0.4), MAG)
  const press = drag(3.0, 3.6) || drag(4.05, 4.6) || (u > 5.35 && u < 5.55) || (u > 6.25 && u < 6.45) ? 1 : 0
  cursor(mx, my, press, seg(u, 2.2, 0.2))
}

/* =========================================================
   5 · TEMPO REAL (beats 30–36): notificações voando
   ========================================================= */
const NOTI = [
  ['Novo agendamento', 'Carla M. · Limpeza de Pele · Qui 15:00', 'C', MAG],
  ['Pix recebido', 'R$ 250,00 · Comanda #0428', '$', '#1F9D5A'],
  ['Comissão calculada', 'Amanda  + R$ 72,00', 'A', '#6B4CFF'],
  ['Lembrete enviado', 'WhatsApp · 1 dia antes do horário', '✓', '#25A55F'],
  ['Nova avaliação  ★★★★★', '“Minha pele nunca esteve tão bonita!”', 'R', '#E6A23C'],
]
function sLive(b) {
  const u = b - 30
  fill(SKY); grid(INK, 0.07)
  meta(INK, '(03) TEMPO REAL', 'TUDO NUM SÓ LUGAR', 104, 0.8)
  rise('Enquanto você', 64, 300, `700 92px ${G}`, 92, INK, seg(u, 0, 0.5), { ls: -4 })
  rise('atende, o sistema', 64, 392, `700 92px ${G}`, 92, INK, seg(u, 0.25, 0.5), { ls: -4 })
  rise('trabalha.', 64, 484, `700 92px ${G}`, 92, MAG, seg(u, 0.5, 0.5), { ls: -4 })
  const exit = eQIO(seg(u, 5.4, 0.6))
  NOTI.forEach(([t1, t2, ic, col], i) => {
    const k = seg(u, 0.8 + i * 0.8, 0.5); if (k <= 0) return
    const side = i % 2 ? 1 : -1, y = 620 + i * 230 + exit * (H + 200), x = 70 + (i % 2) * 60
    const e = eBack(k, 1.6), rot = (1 - eOut(k)) * side * 0.25 + side * 0.025
    c.save(); c.translate(x + 440 + side * (1 - eExpo(k)) * 900, y + 80); c.rotate(rot); c.translate(-440, -80)
    card(0, 0, 880, 170, 34, '#fff', 0.22, 50)
    c.fillStyle = col; c.beginPath(); c.arc(80, 85, 44, 0, 7); c.fill(); T(ic, 80, 100, `700 40px ${UI}`, '#fff', { a: 'center' })
    T(t1, 150, 72, `700 34px ${UI}`, INK); T(t2, 150, 118, `500 27px ${UI}`, '#5E5A6E'); T('agora', 840, 72, `400 22px ${M}`, GREY, { a: 'right' })
    c.restore()
  })
}

/* =========================================================
   6 · MANIFESTO (beats 36–40): FEITO SOB MEDIDA.
   ========================================================= */
function sMani(b) {
  const u = b - 36
  fill(INK); grid(IVORY, 0.05)
  const words = ['FEITO', 'SOB', 'MEDIDA.']
  words.forEach((w, i) => {
    const k = seg(u, i * 0.5, 0.4), f = `700 290px ${G}`, y = 780 + i * 270
    const out_ = (Math.floor(u * 2) + i) % 2 === 1 && u > 1.6
    rise(w, CX, y, f, 290, i === 2 ? MAG : IVORY, k, { a: 'center', ls: -18, stroke: out_ ? 3 : 0 })
  })
  star(CX + 380, 520, 46 * eBack(seg(u, 1.4, 0.5), 2.2), MAG, u * 1.4)
  meta(IVORY, 'SISTEMAS · SITES · AUTOMAÇÃO', '(04)', 1850, 0.6)
}

/* =========================================================
   7 · FINAL (beats 40–46): Conheça nosso trabalho ↗
   ========================================================= */
function sEnd(b) {
  const u = b - 40
  fill(IVORY); grid(INK, 0.08)
  meta(INK, '(05) PRÓXIMO PROJETO', 'DISPONÍVEL ●', 104, seg(u, 0, 0.5))
  hline(64, 132, W - 128, INK, seg(u, 0, 0.8))
  rise('Conheça', 48, 760, `700 250px ${G}`, 250, INK, seg(u, 0, 0.45), { ls: -16 })
  rise('nosso', 48, 990, `700 250px ${G}`, 250, INK, seg(u, 0.5, 0.45), { ls: -16 })
  rise('trabalho', 48, 1220, `700 250px ${G}`, 250, MAG, seg(u, 1, 0.45), { ls: -16 })
  const ak = eExpo(seg(u, 1.5, 0.5)); if (ak > 0) T('↗', W - 60 + (1 - ak) * -260, 990 + (1 - ak) * 260, `400 200px ${G}`, MAG, { a: 'right', al: ak })
  hline(64, 1400, W - 128, INK, seg(u, 2, 0.8))
  const url = 'astrovia-solutions.vercel.app', n = Math.floor(clamp((u - 2.2) / 1.2) * url.length)
  T(url.slice(0, n), 64, 1480, `500 46px ${G}`, INK, { ls: -1 })
  if (n < url.length && u > 2.2) { c.fillStyle = MAG; c.fillRect(64 + tw(url.slice(0, n), `500 46px ${G}`, -1) + 4, 1440, 4, 50) }
  T('Sites · Sistemas · Automação & IA', 64, 1540, `400 26px ${M}`, GREY, { al: seg(u, 3, 0.5) })
  const pk = eBack(seg(u, 3.4, 0.5), 1.6)
  if (pk > 0) { c.save(); c.translate(CX, 1700); c.scale(pk, pk); c.fillStyle = INK; rr(-(W - 128) / 2, -60, W - 128, 120, 60); c.fill(); T('A S T R O V I A', 0, 15, `500 34px ${G}`, IVORY, { a: 'center', ls: 6 }); c.restore() }
}

/* ---------------- montagem ---------------- */
const SCENES = [[0, sHook], [8, sBrand], [16, sScan], [22, sBuild], [30, sLive], [36, sMani], [40, sEnd]]
const TOTAL = b2t(47)
function drawAt(t) {
  const b = t / BEAT
  let idx = 0; SCENES.forEach(([s], i) => { if (b >= s) idx = i })
  const [s0, fn] = SCENES[idx], u = b - s0
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'
  // "punch" de câmera em cada corte
  const p = 1 + 0.035 * (1 - eOut(seg(u, 0, 0.6)))
  c.translate(CX, 960); c.scale(p, p); c.translate(-CX, -960)
  fn(b)
}
const grain = [...Array(4)].map((_, n) => { const g = document.createElement('canvas'); g.width = g.height = 256; const x = g.getContext('2d'), id = x.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = rnd(i * 0.37 + n * 991.3) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255 } x.putImageData(id, 0, 0); return g })

// motion blur: média de sub-quadros (obturador 180°)
const SUB = 4
window.render = function (t) {
  t = clamp(t, 0, TOTAL - 1e-6)
  out.globalCompositeOperation = 'source-over'
  for (let i = 0; i < SUB; i++) {
    drawAt(Math.max(0, t - (i / SUB) * (0.5 / FPS)))
    out.globalAlpha = 1 / (i + 1); out.drawImage(frame, 0, 0)
  }
  out.globalAlpha = 0.05; out.globalCompositeOperation = 'overlay'; out.fillStyle = out.createPattern(grain[Math.floor(t * FPS) % 4], 'repeat'); out.fillRect(0, 0, W, H)
  out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'
}
window.TOTAL = TOTAL
window.FPS = FPS
const load = (k, s) => new Promise((r) => { const i = new Image(); i.onload = () => { IMG[k] = i; r() }; i.src = s })
window.ready = Promise.all([load('booking', '../shots/booking-full.jpg'), ...[`700 100px ${G}`, `500 100px ${G}`, `400 100px ${G}`, `400 20px ${M}`, `600 20px ${UI}`, `700 20px ${UI}`].map((f) => document.fonts.load(f))]).then(() => { window.render(0); return true })
