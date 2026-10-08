// Astrovia Solutions — Reels 3D (Three.js). Cena 3D + tipografia por cima. window.render(t) é determinístico.
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { Font } from 'three/addons/loaders/FontLoader.js'
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const W = 1080, H = 1920, CX = 540, FPS = 60
const BG = '#050308', MAG = '#E2408F', MAG2 = '#FF5FA8', VIO = '#7B5CFF', TEAL = '#3DD9C5', WHITE = '#F3F0F7', MUTED = '#8B8798', LAV = '#EEEAF3'
const G = '"Space Grotesk", sans-serif', M = '"Space Mono", monospace', UI = 'Inter, sans-serif'

/* ---------- matemática ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a, b, k) => a + (b - a) * k
const seg = (u, a, d) => clamp((u - a) / d)
const eOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const eIn = (x) => Math.pow(clamp(x), 3)
const eExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)))
const eIO = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const eBack = (x) => { x = clamp(x); const k = 1.9; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2) }
const eBounce = (x) => { x = clamp(x); const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375 }
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const pad = (n) => String(n).padStart(2, '0')
const brl = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(k)))).join(',')})` }

/* ---------- 2D (tipografia e texturas de interface) ---------- */
const ovc = document.getElementById('ov'), outc = document.getElementById('out'), glc = document.getElementById('gl')
const ov = ovc.getContext('2d'), out = outc.getContext('2d')
let c = ov
const withC = (ctx, fn) => { const p = c; c = ctx; try { fn() } finally { c = p } }
function T(s, x, y, o = {}) {
  c.save(); c.font = o.f; c.textAlign = o.a || 'left'; c.textBaseline = 'alphabetic'
  c.globalAlpha *= o.al ?? 1; c.letterSpacing = (o.ls || 0) + 'px'
  let fill = o.c || WHITE
  if (o.grad) { const w = c.measureText(s).width, x0 = o.a === 'center' ? x - w / 2 : o.a === 'right' ? x - w : x; const g = c.createLinearGradient(x0, y, x0 + w, y); g.addColorStop(0, o.grad[0]); g.addColorStop(1, o.grad[1]); fill = g }
  if (o.shadow) { c.shadowColor = o.shadow; c.shadowBlur = o.sb || 30 }
  if (o.outline) { c.strokeStyle = fill; c.lineWidth = o.outline; c.lineJoin = 'round'; c.strokeText(s, x, y) } else { c.fillStyle = fill; c.fillText(s, x, y) }
  c.restore()
}
function tw(s, f, ls = 0) { c.save(); c.font = f; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.restore(); return w }
function fit(s, wgt, maxW, max, ls = 0) { return Math.min(max, (maxW / tw(s, `${wgt} 100px ${G}`, (ls * 100) / max)) * 100) }
function rr(x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r) }
function rise(k, y, size, fn) {
  if (k <= 0) return
  c.save(); c.beginPath(); c.rect(-W, y - size * 1.05, W * 3, size * 1.4); c.clip(); c.translate(0, (1 - eExpo(k)) * size * 1.25); fn(); c.restore()
}
function riseChars(s, y, f, size, u, st, stag, o = {}) {
  const ls = o.ls || 0, x0 = CX - tw(s, f, ls) / 2
  c.save(); c.beginPath(); c.rect(-W, y - size * 1.05, W * 3, size * 1.4); c.clip()
  for (let i = 0; i < s.length; i++) { const k = eExpo(seg(u, st + i * stag, 0.5)); if (k > 0) T(s[i], x0 + tw(s.slice(0, i), f, ls), y + (1 - k) * size * 1.2, { ...o, f, ls }) }
  c.restore()
}
function brackets(m, L, col, lw = 3) {
  c.save(); c.strokeStyle = col; c.lineWidth = lw
  ;[[m.x, m.y, 1, 1], [m.x + m.w, m.y, -1, 1], [m.x, m.y + m.h, 1, -1], [m.x + m.w, m.y + m.h, -1, -1]].forEach(([x, y, sx, sy]) => { c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke() })
  c.restore()
}
function label(s, x, y, col, al = 1, size = 26) {
  if (al <= 0) return
  c.save(); c.globalAlpha *= al; c.fillStyle = col; c.fillRect(x, y - size * 0.35, 46, 2); T(s, x + 66, y, { f: `400 ${size}px ${M}`, c: col, ls: size * 0.22 }); c.restore()
}
function bigNum(n, x, y, col) { T(n, x, y, { f: `700 360px ${G}`, c: col, outline: 2, a: 'right', ls: -10 }) }
function shade(y0, y1, col, a) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); c.fillStyle = g; c.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)) }
function pill(x, y, w, h, fill, stroke) { rr(x, y, w, h, h / 2); if (fill) { c.fillStyle = fill; c.fill() } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke() } }
function canvasTex(w, h, scale) { const cv = document.createElement('canvas'); cv.width = w * scale; cv.height = h * scale; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return { cv, ctx: cv.getContext('2d'), tex, w, h, scale } }
function paint(t, fn) { withC(t.ctx, () => { c.setTransform(t.scale, 0, 0, t.scale, 0, 0); c.clearRect(0, 0, t.w, t.h); fn() }); t.tex.needsUpdate = true }

/* ---------- renderer ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
renderer.setPixelRatio(1); renderer.setSize(W, H, false)
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H)
const rpass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera())
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.55, 0.82)
composer.addPass(rpass); composer.addPass(bloom); composer.addPass(new OutputPass())

const cam = (fov = 32) => new THREE.PerspectiveCamera(fov, W / H, 0.1, 200)
const col = (h) => new THREE.Color(h)
function gradTex(stops, w = 64, h = 512, radial) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d')
  const g = radial ? x.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, h * 0.8) : x.createLinearGradient(0, 0, 0, h)
  stops.forEach(([p, cc]) => g.addColorStop(p, cc)); x.fillStyle = g; x.fillRect(0, 0, w, h)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t
}
function keyLight(scene, color, intensity, pos, shadow = true, size = 8) {
  const l = new THREE.DirectionalLight(color, intensity); l.position.set(...pos)
  if (shadow) { l.castShadow = true; l.shadow.mapSize.set(2048, 2048); const s = l.shadow.camera; s.left = -size; s.right = size; s.top = size; s.bottom = -size; s.near = 0.5; s.far = 60; l.shadow.bias = -0.0004; l.shadow.radius = 6 }
  scene.add(l); return l
}
function shadowFloor(scene, y, op) { const m = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: op })); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; scene.add(m); return m }
const spriteTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv) })()
function bokeh(scene, n, spread, colors, seed = 1) {
  const g = new THREE.BufferGeometry(), p = [], cl = []
  for (let i = 0; i < n; i++) { p.push((rnd(i * 3 + seed) - 0.5) * spread[0], (rnd(i * 5 + seed) - 0.5) * spread[1], -rnd(i * 7 + seed) * spread[2] - 2); const k = col(colors[i % colors.length]); cl.push(k.r, k.g, k.b) }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3))
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, map: spriteTex, vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }))
  scene.add(pts); return pts
}
// textura de interface montada em um "cartão" físico (corpo arredondado + tela)
function uiCard(w, h, r, texSize, bodyColor = '#ffffff', depth = 0.08) {
  const grp = new THREE.Group()
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, depth, 6, r), new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 }))
  body.castShadow = true; grp.add(body)
  const t = canvasTex(texSize[0], texSize[1], 1.5)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t.tex, transparent: true, toneMapped: false }))
  face.position.z = depth / 2 + 0.002; grp.add(face)
  grp.userData.t = t; return grp
}

/* =====================================================================
   CENA 1 · o problema (campo de peças escuras sob luz magenta)
   ===================================================================== */
function mkHook() {
  const scene = new THREE.Scene(); scene.background = col(BG); scene.fog = new THREE.FogExp2(BG, 0.075)
  scene.environment = env; scene.environmentIntensity = 0.15
  const N = 30, mesh = new THREE.InstancedMesh(new RoundedBoxGeometry(0.92, 1, 0.92, 3, 0.1), new THREE.MeshStandardMaterial({ color: '#17131f', roughness: 0.3, metalness: 0.4 }), N * N)
  scene.add(mesh)
  const l1 = new THREE.PointLight(MAG, 90, 16, 1.6), l2 = new THREE.PointLight(VIO, 70, 16, 1.6); scene.add(l1, l2)
  scene.add(new THREE.HemisphereLight('#2a1e4a', '#000000', 0.5))
  const camera = cam(34), d = new THREE.Object3D()
  return {
    scene, camera, bloom: [0.7, 0.6, 0.6],
    update(u) {
      let k = 0
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = i - N / 2, z = j - N / 2, h = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(x * 0.45 + u * 1.3) * Math.cos(z * 0.38 - u * 1.1))
        d.position.set(x, h - 0.5, z); d.updateMatrix(); mesh.setMatrixAt(k++, d.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      l1.position.set(Math.sin(u * 0.9) * 4, 1.4, -2 + Math.cos(u * 0.7) * 3); l2.position.set(-Math.sin(u * 0.8) * 5, 1.8, -5)
      camera.position.set(0.4, 3.0 - u * 0.25, 8.5 - u * 1.4); camera.lookAt(0, -0.2, -3)
    },
    overlay(u) {
      shade(560, 1250, 'rgba(5,3,8,A)', 0); c.fillStyle = 'rgba(5,3,8,.55)'; c.fillRect(0, 560, W, 560)
      const L = ['agenda no caderno?', 'comanda no papel?', 'comissão na calculadora?'], f = `400 56px ${M}`, x0 = CX - tw(L[2], f) / 2
      L.forEach((s, i) => {
        const st = 0.2 + i * 0.36, n = Math.floor(clamp((u - st) / 0.28) * s.length), y = 720 + i * 112
        if (u < st) return
        const str = seg(u, st + 0.34, 0.14), part = s.slice(0, n)
        T(part, x0, y, { f, c: WHITE, al: 1 - 0.6 * str })
        if (n < s.length) { c.fillStyle = MAG; c.fillRect(x0 + tw(part, f) + 6, y - 42, 28, 52) }
        if (str > 0) { c.save(); c.shadowColor = MAG; c.shadowBlur = 16; c.fillStyle = MAG; c.fillRect(x0 - 12, y - 20, (tw(s, f) + 24) * eOut(str), 8); c.restore() }
      })
      const ln = eExpo(seg(u, 1.5, 0.2)), open = eIO(seg(u, 1.68, 0.32))
      if (ln > 0) { const hh = lerp(3, H / 2 + 20, open), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, MAG); g.addColorStop(1, VIO); c.save(); c.shadowColor = MAG; c.shadowBlur = 50; c.fillStyle = g; c.fillRect(CX - (W / 2) * ln, 960 - hh, W * ln, hh * 2); c.restore() }
    },
  }
}

/* =====================================================================
   CENA 2 · CHEGA. (letras 3D de verniz preto caindo no estúdio magenta)
   ===================================================================== */
let FONT3D
function mkChega() {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, '#F0559C'], [0.55, '#C93C9E'], [1, '#6D45E8']])
  scene.environment = env; scene.environmentIntensity = 0.9
  keyLight(scene, '#ffffff', 2.4, [3, 9, 6], true, 6); scene.add(new THREE.HemisphereLight('#ffd0e8', '#5a2bd0', 1.0))
  shadowFloor(scene, 0, 0.32)
  const mat = new THREE.MeshPhysicalMaterial({ color: '#0b0910', roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 })
  const word = 'CHEGA.', size = 1, res = FONT3D.data.resolution, letters = []
  let x = 0
  for (const ch of word) {
    const g = new TextGeometry(ch, { font: FONT3D, size, depth: 0.42, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.022, bevelSegments: 4 })
    g.computeBoundingBox(); const bb = g.boundingBox, cx = (bb.max.x + bb.min.x) / 2
    g.translate(-cx, 0, -0.21)
    const m = new THREE.Mesh(g, mat); m.castShadow = true; m.userData.x = x + cx; scene.add(m); letters.push(m)
    x += (FONT3D.data.glyphs[ch].ha / res) * size * 0.97
  }
  letters.forEach((m) => (m.userData.x -= x / 2))
  const dot = letters[letters.length - 1]
  const camera = cam(26), base = new THREE.Vector3(0, 1.0, 19.5)
  return {
    scene, camera, bloom: [0.25, 0.4, 0.9],
    update(u) {
      letters.forEach((m, i) => {
        const k = seg(u, 0.02 + i * 0.06, 0.55)
        m.position.set(m.userData.x, lerp(7, 0, eBounce(k)), 0); m.visible = k > 0
        m.rotation.set(0, (1 - eOut(k)) * 0.6 * (rnd(i) - 0.5), (1 - eOut(k)) * 1.2 * (rnd(i + 3) - 0.5))
      })
      const z = eIn(seg(u, 1.12, 0.5))
      const tgt = new THREE.Vector3(dot.position.x, 0.1, 0.25)
      camera.position.lerpVectors(new THREE.Vector3(base.x + Math.sin(u * 2) * 0.05, base.y, base.z - u * 0.6), tgt, z)
      camera.lookAt(lerp(0, tgt.x, z), lerp(0.5, 0.1, z), 0)
    },
    overlay(u) {
      label('PARA SALÕES, CLÍNICAS E BARBEARIAS', 90, 520, BG, seg(u, 0.25, 0.3) * (1 - seg(u, 1.1, 0.1)), 28)
      const s2 = fit('DE IMPROVISO.', 700, 940, 140, -4)
      if (u < 1.15) rise(seg(u, 0.55, 0.45), 1310, s2, () => T('DE IMPROVISO.', CX, 1310, { f: `700 ${s2}px ${G}`, c: BG, a: 'center', ls: -4, outline: 3 }))
      if (u > 1.55) { c.fillStyle = `rgba(5,3,8,${seg(u, 1.55, 0.1)})`; c.fillRect(0, 0, W, H) }
    },
  }
}

/* =====================================================================
   CENA 3 · ASTROVIA (onda de peças 3D + esfera cromada em órbita)
   ===================================================================== */
function mkHero() {
  const scene = new THREE.Scene(); scene.background = col(BG); scene.fog = new THREE.Fog(BG, 24, 48)
  scene.environment = env; scene.environmentIntensity = 0.55
  const N = 26, mesh = new THREE.InstancedMesh(new RoundedBoxGeometry(0.94, 1, 0.94, 3, 0.09), new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.15 }), N * N)
  mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh)
  keyLight(scene, '#ffe2f0', 2.2, [8, 18, 6], true, 18); scene.add(new THREE.HemisphereLight('#7b5cff', '#120822', 0.7))
  const rim = new THREE.PointLight(MAG, 260, 30, 1.5); rim.position.set(-6, 5, -8); scene.add(rim)
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.6, 96, 64), new THREE.MeshPhysicalMaterial({ color: '#ffe6f2', metalness: 1, roughness: 0.06, envMapIntensity: 1.4 }))
  sphere.castShadow = true; scene.add(sphere)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.035, 16, 200), new THREE.MeshBasicMaterial({ color: col(MAG2).multiplyScalar(2.2), toneMapped: false })); scene.add(ring)
  const sat = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), new THREE.MeshBasicMaterial({ color: col('#ffffff').multiplyScalar(3), toneMapped: false })); scene.add(sat)
  const camera = cam(30), d = new THREE.Object3D(), cA = col('#140c30'), cB = col(VIO), cC = col(MAG2), tmp = new THREE.Color()
  return {
    scene, camera, bloom: [0.55, 0.5, 0.82],
    update(u) {
      const amp = eOut(seg(u, 0, 1.0)); let k = 0
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = i - N / 2 + 0.5, z = j - N / 2 + 0.5, dd = Math.hypot(x, z), wv = 0.5 + 0.5 * Math.sin(dd * 0.55 - u * 3.6)
        const h = 0.3 + 3.0 * wv * amp * (1 - clamp(dd / 18) * 0.5)
        d.position.set(x, h / 2, z); d.scale.set(1, h, 1); d.updateMatrix(); mesh.setMatrixAt(k, d.matrix)
        const q = wv * amp; tmp.copy(cA).lerp(cB, clamp(q * 1.6)).lerp(cC, clamp(q * 1.6 - 0.6)); mesh.setColorAt(k++, tmp)
      }
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true
      const sk = eBack(seg(u, 0.3, 0.8)); sphere.scale.setScalar(Math.max(0.001, sk)); sphere.position.set(0, 5.6 + Math.sin(u * 2) * 0.15, 0)
      ring.position.copy(sphere.position); ring.rotation.set(1.25 + Math.sin(u) * 0.05, 0.2, u * 0.4); ring.scale.setScalar(Math.max(0.001, eOut(seg(u, 0.5, 0.7))))
      const a = u * 2.2; sat.position.set(Math.cos(a) * 2.7, 0, Math.sin(a) * 2.7).applyEuler(ring.rotation).add(sphere.position); sat.visible = u > 0.6
      const az = 0.75 + u * 0.12; camera.position.set(Math.sin(az) * 30, 21, Math.cos(az) * 30); camera.lookAt(0, 6.5, 0)
    },
    overlay(u) {
      shade(0, 900, 'rgba(5,3,8,A)', 0.75)
      label('APRESENTANDO', 90, 300, WHITE, seg(u, 0.1, 0.3) * 0.8, 28)
      const sz = fit('SOLUTIONS', 700, 900, 170, -4)
      riseChars('ASTROVIA', 480, `700 ${sz}px ${G}`, sz, u, 0.2, 0.045, { c: WHITE, ls: -4 })
      rise(seg(u, 0.55, 0.5), 480 + sz * 0.92, sz, () => T('SOLUTIONS', CX, 480 + sz * 0.92, { f: `700 ${sz}px ${G}`, c: 'rgba(243,240,247,.6)', a: 'center', ls: -4, outline: 2.5 }))
      rise(seg(u, 0.85, 0.5), 740, 48, () => T('gestão que trabalha por você', CX, 740, { f: `500 50px ${G}`, grad: [TEAL, MAG2], a: 'center' }))
    },
  }
}

/* =====================================================================
   CENA 4 · agenda (tela física flutuando, notificação em primeiro plano)
   ===================================================================== */
const ST = { conf: { bg: '#ECE8FF', bar: '#6B4CFF' }, now: { bg: '#FFE4F0', bar: MAG }, done: { bg: '#DFF6F2', bar: '#14A893' }, wait: { bg: '#EFEFF3', bar: '#9A97A8' } }
const BLOCKS = [
  [0, 9, 1.5, 'Limpeza de Pele', 'Ana R.', 'done'], [0, 11, 1, 'Protocolo Glow', 'Bruna S.', 'flip'], [0, 13, 1, 'Radiofrequência', 'Paula M.', 'conf'], [0, 14.5, 1, 'Microagulhamento', 'Lia C.', 'wait'],
  [1, 9.5, 1, 'Microagulhamento', 'Rita F.', 'done'], [1, 11, 1.5, 'Drenagem', 'Júlia P.', 'now'], [1, 13, 1, 'Lash Lifting', 'Gabi T.', 'conf'],
  [2, 9, 1, 'Massagem', 'Sofia L.', 'done'], [2, 10.5, 1, 'Drenagem', 'Duda A.', 'conf'], [2, 12, 1.5, 'Modeladora', 'Bia N.', 'conf'], [2, 14.5, 1, 'Sobrancelha', 'Lu K.', 'wait'], [1, 15, 1, 'Limpeza de Pele', 'Carla M.', 'new'],
]
function drawAgenda(u) {
  c.fillStyle = '#fff'; rr(0, 0, 920, 890, 40); c.fill()
  c.translate(-80, -630)
  T('Hoje', 122, 712, { f: `800 40px ${UI}`, c: BG }); T('terça, 14 de outubro', 122 + tw('Hoje ', `800 40px ${UI}`), 712, { f: `500 26px ${UI}`, c: MUTED })
  c.fillStyle = MAG; rr(758, 676, 200, 46, 23); c.fill(); T('13 hoje', 858, 708, { f: `700 22px ${UI}`, c: '#fff', a: 'center' })
  const colX = (k) => 200 + k * 262, colW = 250, y0 = 818, rowH = 82
  ;[['Amanda', '#6B4CFF'], ['Juliana', MAG], ['Camila', '#14A893']].forEach(([n, cc], k) => { c.fillStyle = cc; c.beginPath(); c.arc(colX(k) + 22, 762, 20, 0, 7); c.fill(); T(n[0], colX(k) + 22, 770, { f: `800 20px ${UI}`, c: '#fff', a: 'center' }); T(n, colX(k) + 52, 771, { f: `700 24px ${UI}`, c: BG }) })
  for (let h = 0; h < 8; h++) { const y = y0 + h * rowH; c.fillStyle = '#EFEDF4'; c.fillRect(190, y, 790, 2); T(`${9 + h}:00`, 104, y + 8, { f: `400 22px ${M}`, c: MUTED }) }
  BLOCKS.forEach(([cl, st, dur, title, cli, status], b) => {
    const isNew = status === 'new', k = isNew ? seg(u, 1.55, 0.35) : seg(u, 0.4 + b * 0.055, 0.35); if (k <= 0) return
    const x = colX(cl) + 4, y = y0 + (st - 9) * rowH + 4, w = colW - 8, h = dur * rowH - 8
    const s = ST[status === 'flip' || isNew ? 'conf' : status]; let bgc = s.bg, bar = s.bar
    if (status === 'flip') { const f = seg(u, 1.85, 0.25); bgc = mix(ST.conf.bg, ST.now.bg, f); bar = mix(ST.conf.bar, ST.now.bar, f) }
    c.save(); c.globalAlpha = clamp(k * 2); c.translate(x, y); c.scale(1, lerp(0.4, 1, eBack(k)))
    if (isNew) { c.shadowColor = MAG; c.shadowBlur = 24 + 14 * Math.sin(u * 12) }
    c.fillStyle = bgc; rr(0, 0, w, h, 14); c.fill(); c.shadowBlur = 0
    if (isNew) { c.strokeStyle = MAG; c.lineWidth = 3; rr(0, 0, w, h, 14); c.stroke() }
    c.fillStyle = bar; rr(0, 0, 7, h, [14, 0, 0, 14]); c.fill()
    T(title, 18, 32, { f: `700 22px ${UI}`, c: BG, ls: -0.6 }); T(cli, 18, 58, { f: `500 20px ${UI}`, c: '#5E5A6E' })
    c.fillStyle = bar; c.beginPath(); c.arc(w - 18, 22, 6, 0, 7); c.fill()
    if (status === 'flip' && u > 1.85) { const p = (u * 1.6) % 1; c.strokeStyle = `rgba(226,64,143,${1 - p})`; c.lineWidth = 2; c.beginPath(); c.arc(w - 18, 22, 6 + p * 14, 0, 7); c.stroke() }
    c.restore()
  })
  const ny = y0 + (11.3 + u * 0.12 - 9) * rowH
  if (u > 0.8) { c.globalAlpha = seg(u, 0.8, 0.3); c.fillStyle = MAG; c.fillRect(190, ny - 1.5, 790, 3); c.beginPath(); c.arc(190, ny, 8, 0, 7); c.fill(); c.globalAlpha = 1 }
}
function drawToast(u) {
  const pr = (u * 1.5) % 1
  c.fillStyle = '#0b0910'; rr(0, 0, 780, 108, 54); c.fill(); c.strokeStyle = 'rgba(243,240,247,.14)'; c.lineWidth = 2; rr(1, 1, 778, 106, 53); c.stroke()
  c.fillStyle = MAG; c.beginPath(); c.arc(64, 56, 12, 0, 7); c.fill()
  c.strokeStyle = `rgba(226,64,143,${1 - pr})`; c.beginPath(); c.arc(64, 56, 12 + pr * 16, 0, 7); c.stroke()
  T('Novo agendamento pelo site', 102, 48, { f: `700 31px ${G}`, c: WHITE }); T('Carla M.  ·  Limpeza de Pele  ·  15:00', 102, 84, { f: `400 25px ${G}`, c: WHITE, al: 0.7 }); T('agora', 740, 48, { f: `400 20px ${M}`, c: TEAL, a: 'right' })
}
function mkAgenda() {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, '#2E1A6E'], [0.6, '#170D3A'], [1, '#0A0618']])
  scene.environment = env; scene.environmentIntensity = 0.6
  keyLight(scene, '#ffffff', 1.6, [-4, 6, 9], true, 6); scene.add(new THREE.HemisphereLight('#c9b8ff', '#1a0a30', 0.9))
  const rim = new THREE.PointLight(MAG, 120, 20, 1.5); rim.position.set(5, 3, -3); scene.add(rim)
  bokeh(scene, 60, [26, 40, 18], [MAG, VIO, TEAL, '#ffffff'], 3)
  const card = uiCard(4.6, 4.45, 0.2, [920, 890]); scene.add(card)
  const backs = [-0.05, 0.045].map((r, i) => { const m = new THREE.Mesh(new RoundedBoxGeometry(4.6, 4.45, 0.04, 4, 0.2), new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.12 + i * 0.05, roughness: 0.2 })); m.rotation.z = r; m.position.z = -0.35 - i * 0.3; scene.add(m); return m })
  const toast = uiCard(3.9, 0.54, 0.27, [780, 108], '#0b0910', 0.05); scene.add(toast)
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.35 })); shadowCatcher.position.z = -1.2; shadowCatcher.receiveShadow = true; scene.add(shadowCatcher)
  const camera = cam(30); camera.setViewOffset(W, H, 0, -150, W, H)
  return {
    scene, camera, bloom: [0.18, 0.4, 0.98],
    update(u) {
      paint(card.userData.t, () => drawAgenda(u)); paint(toast.userData.t, () => drawToast(u))
      const pk = seg(u, 0.05, 0.7), sc = lerp(0.82, 1, eBack(pk))
      card.scale.setScalar(sc); card.position.set(0, lerp(-1.4, 0, eOut(pk)), 0); card.rotation.set(lerp(0.32, 0.06, eOut(pk)) - u * 0.01, lerp(-0.45, 0.14, eIO(seg(u, 0, 2.6))), 0)
      backs.forEach((m, i) => { m.position.y = card.position.y; m.rotation.y = card.rotation.y * 0.8; m.scale.setScalar(sc) })
      const tk = seg(u, 1.15, 0.5); toast.visible = tk > 0
      toast.position.set(0, lerp(3.6, 2.18, eBack(tk)) + card.position.y, lerp(1.8, 0.75, eOut(tk))); toast.rotation.copy(card.rotation); toast.rotation.x -= 0.04
      camera.position.set(lerp(2.2, -1.4, eIO(u / 2.6)), lerp(-0.9, 0.8, eIO(u / 2.6)), lerp(18.5, 17, eIO(u / 2.6))); camera.lookAt(0, 0, 0)
    },
    overlay(u) {
      shade(0, 620, 'rgba(10,6,24,A)', 0.6)
      bigNum('01', 1010, 470, 'rgba(243,240,247,.13)')
      label('AGENDA INTELIGENTE', 90, 250, WHITE, seg(u, 0, 0.3) * 0.85, 28)
      rise(seg(u, 0.05, 0.5), 380, 120, () => T('Sua agenda,', 84, 380, { f: `700 ${fit('Sua agenda,', 700, 900, 124, -4)}px ${G}`, c: WHITE, ls: -4 }))
      rise(seg(u, 0.17, 0.5), 480, 80, () => T('organizada sozinha.', 88, 480, { f: `500 ${fit('organizada sozinha.', 500, 900, 82, -2)}px ${G}`, grad: [TEAL, MAG2], ls: -2 }))
    },
  }
}

/* =====================================================================
   CENA 5 · comanda (papel físico com curvatura, sombra e fichas de comissão)
   ===================================================================== */
function drawReceipt(u) {
  const X = 0, Y = 0, Wd = 780, Hd = 820
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(X + 24, Y); c.arcTo(X + Wd, Y, X + Wd, Y + Hd, 24); c.lineTo(X + Wd, Y + Hd)
  for (let x = X + Wd; x > X; x -= 30) { c.lineTo(x - 15, Y + Hd + 16); c.lineTo(x - 30, Y + Hd) }
  c.arcTo(X, Y, X + Wd, Y, 24); c.closePath(); c.fill()
  c.translate(-150, -560)
  T('COMANDA #0428', 190, 628, { f: `400 25px ${M}`, c: MUTED, ls: 2 }); T('14/10 · 15:42', 890, 628, { f: `400 25px ${M}`, c: MUTED, a: 'right' })
  T('Carla Mendes', 190, 690, { f: `800 46px ${UI}`, c: BG })
  const dash = (y) => { c.save(); c.setLineDash([10, 10]); c.strokeStyle = '#DCD8E3'; c.lineWidth = 2; c.beginPath(); c.moveTo(190, y); c.lineTo(890, y); c.stroke(); c.restore() }
  dash(730)
  ;[['Limpeza de Pele Profunda', 'com Amanda', 180], ['Design de Sobrancelhas', 'com Bianca', 70], ['Sérum Vitamina C', 'produto · home care', 189]].forEach(([n, s, p], i) => {
    const k = eOut(seg(u, 0.4 + i * 0.13, 0.3)); if (k <= 0) return
    const y = 795 + i * 92; c.save(); c.globalAlpha *= k; c.translate((1 - k) * -50, 0)
    T(n, 190, y, { f: `700 33px ${UI}`, c: BG, ls: -0.5 }); T(s, 190, y + 34, { f: `500 25px ${UI}`, c: MUTED }); T(`R$ ${brl(p)}`, 890, y, { f: `700 33px ${UI}`, c: BG, a: 'right' }); c.restore()
  })
  dash(1085)
  T('Total', 190, 1150, { f: `600 30px ${UI}`, c: MUTED }); T(`R$ ${brl(Math.round(439 * eExpo(seg(u, 0.85, 0.6))))}`, 890, 1158, { f: `700 68px ${G}`, c: BG, a: 'right', ls: -2 })
  ;['Pix', 'Cartão', 'Dinheiro'].forEach((m, i) => {
    const k = seg(u, 1.0 + i * 0.06, 0.25); if (k <= 0) return
    const on = i === 0 && u > 1.32, x = 190 + i * 240
    c.save(); c.globalAlpha *= k; c.fillStyle = on ? BG : '#F2F0F5'; rr(x, 1200, 220, 66, 33); c.fill(); T(m, x + 110, 1243, { f: `700 26px ${UI}`, c: on ? '#fff' : BG, a: 'center' }); c.restore()
  })
  T('2 profissionais  ·  1 pagamento', 190, 1335, { f: `400 26px ${M}`, c: MUTED, al: seg(u, 1.3, 0.3) })
  const sk = seg(u, 1.55, 0.22)
  if (sk > 0) {
    c.save(); c.translate(770, 668); c.rotate(-0.16); const s = lerp(2.6, 1, eOut(sk)); c.scale(s, s); c.globalAlpha = clamp(sk * 3) * 0.92
    c.strokeStyle = MAG; c.lineWidth = 7; rr(-140, -62, 280, 124, 14); c.stroke(); T('PAGO', 0, 32, { f: `700 92px ${G}`, c: MAG, a: 'center', ls: 2 }); c.restore()
  }
}
function drawChip(n, cc, v) {
  c.fillStyle = '#0b0910'; rr(0, 0, 780, 88, 44); c.fill()
  c.fillStyle = cc; c.beginPath(); c.arc(46, 44, 22, 0, 7); c.fill(); T(n[0], 46, 52, { f: `800 22px ${UI}`, c: '#fff', a: 'center' })
  T(n, 86, 55, { f: `700 34px ${G}`, c: '#fff' }); T('comissão', 86 + tw(n + '  ', `700 34px ${G}`), 54, { f: `400 25px ${M}`, c: '#fff', al: 0.6 })
  T(`+ R$ ${brl(v)}`, 748, 56, { f: `700 36px ${G}`, c: TEAL, a: 'right' })
}
function mkComanda() {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, '#F6F2FA'], [0.55, LAV], [1, '#DCD3EA']])
  scene.environment = env; scene.environmentIntensity = 0.8
  const key = keyLight(scene, '#ffffff', 2.0, [-3, 8, 7], true, 6); key.shadow.radius = 10
  scene.add(new THREE.HemisphereLight('#ffffff', '#c9b8e8', 1.0))
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.18 })); catcher.position.z = -0.8; catcher.receiveShadow = true; scene.add(catcher)
  const t = canvasTex(780, 836, 1.6)
  const pg = new THREE.PlaneGeometry(3.9, 4.18, 40, 40), pos = pg.attributes.position
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) / 1.95, y = pos.getY(i) / 2.09; pos.setZ(i, -0.18 * x * x + 0.06 * Math.sin(y * 2.4) + 0.05 * y) }
  pg.computeVertexNormals()
  const paper = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: t.tex, transparent: true, alphaTest: 0.5, roughness: 0.85, side: THREE.DoubleSide }))
  paper.castShadow = true; scene.add(paper)
  const chips = [['Amanda', '#6B4CFF', 72], ['Bianca', MAG, 31.5]].map(([n, cc, v]) => { const ch = uiCard(3.9, 0.44, 0.22, [780, 88], '#0b0910', 0.06); paint(ch.userData.t, () => drawChip(n, cc, v)); scene.add(ch); return ch })
  const camera = cam(30); camera.setViewOffset(W, H, 0, -110, W, H)
  return {
    scene, camera, bloom: [0.08, 0.3, 1.0],
    update(u) {
      paint(t, () => drawReceipt(u))
      const pk = seg(u, 0.05, 0.6), shake = u > 1.6 && u < 1.8 ? Math.sin(u * 90) * 0.03 * (1 - seg(u, 1.6, 0.2)) : 0
      paper.position.set(shake, lerp(-3, 0.3, eBack(pk)), 0); paper.rotation.set(lerp(-0.5, 0.08, eOut(pk)), lerp(0.5, -0.12, eIO(u / 2.6)), lerp(0.12, -0.03, eOut(pk)))
      chips.forEach((ch, i) => {
        const k = seg(u, 1.85 + i * 0.15, 0.45); ch.visible = k > 0
        ch.position.set(0, -2.45 - i * 0.56, lerp(3.5, 0.7, eBack(k))); ch.rotation.set(0.05, paper.rotation.y * 0.6, 0)
      })
      camera.position.set(lerp(-1.8, 1.2, eIO(u / 2.6)), lerp(0.6, -0.3, eIO(u / 2.6)), 21); camera.lookAt(0, -0.5, 0)
    },
    overlay(u) {
      bigNum('02', 1010, 470, 'rgba(5,3,8,.09)')
      label('CAIXA + COMISSÃO AUTOMÁTICA', 90, 250, BG, seg(u, 0, 0.3) * 0.75, 28)
      rise(seg(u, 0.05, 0.5), 375, 100, () => T('Fechou a comanda?', 84, 375, { f: `700 ${fit('Fechou a comanda?', 700, 910, 104, -4)}px ${G}`, c: BG, ls: -4 }))
      rise(seg(u, 0.17, 0.5), 462, 64, () => T('a comissão já está pronta.', 88, 462, { f: `500 ${fit('a comissão já está pronta.', 500, 900, 66, -1)}px ${G}`, grad: [MAG, VIO], ls: -1 }))
    },
  }
}

/* =====================================================================
   CENA 6 · relatórios (gráfico 3D de cerâmica + anel de neon)
   ===================================================================== */
function mkDash() {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, '#1d1240'], [0.5, '#0b0717'], [1, '#050308']])
  scene.environment = env; scene.environmentIntensity = 0.35
  keyLight(scene, '#ffffff', 1.4, [4, 10, 6], true, 8); scene.add(new THREE.HemisphereLight('#9d8cff', '#000000', 0.6))
  const mrim = new THREE.PointLight(MAG, 50, 20, 1.4); mrim.position.set(-3, 3, 2); scene.add(mrim)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#0d0a16', roughness: 0.18, metalness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor)
  const vals = [0.42, 0.55, 0.48, 0.66, 0.6, 0.74, 0.69, 0.94]
  const white = new THREE.MeshPhysicalMaterial({ color: '#cfc9da', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.1 })
  const hot = new THREE.MeshStandardMaterial({ color: MAG, emissive: MAG, emissiveIntensity: 1.6, roughness: 0.25 })
  const bars = vals.map((v, i) => { const m = new THREE.Mesh(new RoundedBoxGeometry(0.62, 1, 0.62, 4, 0.08), i === 7 ? hot : white); m.castShadow = m.receiveShadow = true; m.position.x = -3.0 + i * 0.86; scene.add(m); return m })
  const track = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.16, 24, 160), new THREE.MeshStandardMaterial({ color: '#211a33', roughness: 0.4, metalness: 0.3 }))
  track.position.set(0, 6.6, -1.2); scene.add(track)
  const arcMat = new THREE.MeshStandardMaterial({ color: MAG2, emissive: MAG, emissiveIntensity: 2.2, roughness: 0.2 })
  let arc = null
  const camera = cam(30); camera.setViewOffset(W, H, 0, -170, W, H)
  const proj = new THREE.Vector3()
  return {
    scene, camera, bloom: [0.5, 0.45, 0.92],
    update(u) {
      bars.forEach((m, i) => { const h = Math.max(0.02, vals[i] * 4.6 * eOut(seg(u, 0.4 + i * 0.06, 0.6))); m.scale.y = h; m.position.y = h / 2 })
      const rk = eOut(seg(u, 0.4, 1.0)); if (arc) { scene.remove(arc); arc.geometry.dispose() }
      if (rk > 0.002) { arc = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.17, 24, 160, Math.PI * 2 * 0.78 * rk), arcMat); arc.position.copy(track.position); arc.rotation.z = Math.PI / 2; arc.scale.x = -1; scene.add(arc) } else arc = null
      const az = -0.12 + u * 0.08; camera.position.set(Math.sin(az) * 27, 5.5, Math.cos(az) * 27); camera.lookAt(0, 4.0, 0)
      camera.updateMatrixWorld(); proj.copy(track.position).project(camera); this.ring = [(proj.x + 1) / 2 * W, (1 - proj.y) / 2 * H]
    },
    overlay(u) {
      shade(0, 700, 'rgba(5,3,8,A)', 0.55)
      bigNum('03', 1010, 470, 'rgba(243,240,247,.1)')
      label('RELATÓRIOS EM TEMPO REAL', 90, 250, WHITE, seg(u, 0, 0.3) * 0.8, 28)
      rise(seg(u, 0.05, 0.4), 340, 40, () => T('Faturamento do mês', 90, 340, { f: `500 40px ${G}`, c: WHITE, al: 0.75 }))
      rise(seg(u, 0.1, 0.5), 505, 150, () => T(`R$ ${Math.round(48920 * eExpo(seg(u, 0.15, 1.2))).toLocaleString('pt-BR')}`, 82, 505, { f: `700 150px ${G}`, c: WHITE, ls: -6 }))
      const ck = seg(u, 0.6, 0.3)
      if (ck > 0) { c.save(); c.globalAlpha = ck; pill(90, 550, 150, 50, MAG); T('▲ 18%', 165, 585, { f: `700 26px ${UI}`, c: '#fff', a: 'center' }); T('vs. mês anterior', 262, 585, { f: `400 28px ${M}`, c: WHITE, al: 0.75 }); c.restore() }
      if (this.ring) { const [x, y] = this.ring, a = seg(u, 0.5, 0.4); T(`${Math.round(78 * eOut(seg(u, 0.4, 1.0)))}%`, x, y + 24, { f: `700 72px ${G}`, c: WHITE, a: 'center', al: a, ls: -2, shadow: 'rgba(0,0,0,.6)' }); T('VOLTARAM', x, y + 64, { f: `400 22px ${M}`, c: TEAL, a: 'center', ls: 4, al: a }) }
      const lk = seg(u, 1.1, 0.4)
      if (lk > 0) { c.save(); c.globalAlpha = lk; pill(620, 1560, 380, 64, 'rgba(11,9,16,.85)', 'rgba(243,240,247,.15)'); c.fillStyle = MAG; c.beginPath(); c.arc(656, 1592, 8, 0, 7); c.fill(); T('126 atendimentos / semana', 680, 1601, { f: `500 25px ${G}`, c: WHITE }); c.restore() }
    },
  }
}


/* =====================================================================
   CENA · case Lu Wolcher (telas reais do sistema em celulares 3D)
   ===================================================================== */
let SHOTS = {}
async function loadShot(name) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `shots/${name}.jpg` })
  const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; const x = cv.getContext('2d')
  x.beginPath(); x.roundRect(0, 0, 780, 1688, 96); x.clip(); x.drawImage(img, 0, 0, 780, 1688)
  x.fillStyle = '#000'; x.beginPath(); x.roundRect(390 - 120, 26, 240, 70, 35); x.fill()
  const g = x.createLinearGradient(0, 0, 780, 1688); g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 780, 1688)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t
}
function phone(tex) {
  const grp = new THREE.Group(), w = 2.2, h = 4.76
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.22, 8, 0.3), new THREE.MeshPhysicalMaterial({ color: '#2a2830', metalness: 0.85, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.2 }))
  body.castShadow = true; grp.add(body)
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), new THREE.MeshBasicMaterial({ color: '#000' })); bezel.position.z = 0.111; grp.add(bezel)
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, (w - 0.16) * 1688 / 780), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); scr.position.z = 0.113; grp.add(scr)
  return grp
}
function mkCase() {
  const scene = new THREE.Scene(); scene.background = gradTex([[0, '#DCE0F6'], [0.55, '#F7EEEC'], [1, '#EBCFCB']])
  scene.environment = env; scene.environmentIntensity = 0.9
  const key = keyLight(scene, '#ffffff', 2.2, [-4, 9, 8], true, 7); key.shadow.radius = 12
  scene.add(new THREE.HemisphereLight('#ffffff', '#d9b8b4', 1.1))
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.16 })); catcher.position.z = -2.2; catcher.receiveShadow = true; scene.add(catcher)
  const ph = [phone(SHOTS.inicio), phone(SHOTS.booking), phone(SHOTS.agenda)]; ph.forEach((p) => scene.add(p))
  const camera = cam(30); camera.setViewOffset(W, H, 0, -170, W, H)
  return {
    scene, camera, bloom: [0.05, 0.3, 1.0],
    update(u) {
      ph.forEach((p, i) => {
        const k = eOut(seg(u, 0.1 + (i === 1 ? 0 : 0.15), 0.8)), side = i - 1
        p.position.set(side * lerp(1.2, 2.05, eIO(seg(u, 0.4, 0.9))), lerp(-7, 0, k) + (i === 1 ? 0.35 : -0.1) + Math.sin(u * 1.4 + i) * 0.05, i === 1 ? 0.6 : -0.9)
        p.rotation.set(lerp(0.5, 0.04, k), side * -0.42 + (1 - k) * side * -0.3, side * 0.04)
      })
      camera.position.set(lerp(-1.4, 1.2, eIO(u / 2.8)), lerp(-0.5, 0.4, eIO(u / 2.8)), 19.5); camera.lookAt(0, 0, 0)
    },
    overlay(u) {
      const N1 = '#1B2A63'
      label('CASE · LU WOLCHER ESTÉTICA AVANÇADA', 90, 250, N1, seg(u, 0, 0.3) * 0.85, 26)
      rise(seg(u, 0.05, 0.5), 370, 110, () => T('A Lu Wolcher', 84, 370, { f: `700 ${fit('A Lu Wolcher', 700, 900, 116, -4)}px ${G}`, c: N1, ls: -4 }))
      rise(seg(u, 0.15, 0.5), 480, 110, () => T('já é Astrovia.', 84, 480, { f: `700 ${fit('já é Astrovia.', 700, 900, 116, -4)}px ${G}`, grad: [MAG, VIO], ls: -4 }))
      rise(seg(u, 1.0, 0.5), 1640, 50, () => T('Estética avançada. Gestão também.', CX, 1640, { f: `500 ${fit('Estética avançada. Gestão também.', 500, 920, 52)}px ${G}`, c: N1, a: 'center' }))
      T('SITE DE AGENDAMENTO  ·  PAINEL  ·  AGENDA', CX, 1705, { f: `400 23px ${M}`, c: N1, a: 'center', ls: 3, al: seg(u, 1.3, 0.4) * 0.7 })
    },
  }
}

/* =====================================================================
   CENA 7 · e muito mais (campo de partículas 3D)
   ===================================================================== */
function particleMat(size) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: size } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uSize; attribute vec3 aColor; attribute float aScale; attribute vec3 aSeed; varying vec3 vColor;
      void main(){ vec3 p = position; float t = uTime;
        p.x += sin(p.y*0.35 + t*0.9 + aSeed.x)*1.4; p.y += cos(p.x*0.3 - t*0.7 + aSeed.y)*1.2; p.z += sin(p.x*0.2 + p.y*0.2 + t*0.6)*1.0;
        vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uSize*aScale/(-mv.z); vColor = aColor; }`,
    fragmentShader: `varying vec3 vColor; void main(){ float d = length(gl_PointCoord-0.5); float a = pow(1.0-smoothstep(0.0,0.5,d),2.2); gl_FragColor = vec4(vColor*a, a); }`,
  })
}
const FEATS = ['LEMBRETE NO WHATSAPP', 'AGENDAMENTO ONLINE', 'CLUBE DE ASSINATURA', 'FIDELIDADE', 'AVALIAÇÕES', 'MODO TV', 'LUCRO REAL']
const splitMid = (s) => { const sp = [...s].map((ch, i) => (ch === ' ' ? i : -1)).filter((i) => i > 0); const m = sp.reduce((b, i) => (Math.abs(i - s.length / 2) < Math.abs(b - s.length / 2) ? i : b), sp[0]); return [s.slice(0, m), s.slice(m + 1)] }
function mkFeats() {
  const scene = new THREE.Scene(); scene.background = col(BG)
  const N = 26000, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), cl = new Float32Array(N * 3), sc = new Float32Array(N), sd = new Float32Array(N * 3)
  const pal = [col('#ffffff'), col('#ffffff'), col(MAG2), col(VIO), col(TEAL)]
  for (let i = 0; i < N; i++) {
    p[i * 3] = (rnd(i) - 0.5) * 18; p[i * 3 + 1] = (rnd(i + 1e4) - 0.5) * 30; p[i * 3 + 2] = -rnd(i + 2e4) * 26 + 2
    const k = pal[Math.floor(rnd(i + 3e4) * pal.length)]; cl.set([k.r * 0.8, k.g * 0.8, k.b * 0.8], i * 3); sc[i] = 20 + rnd(i + 4e4) * 60; sd.set([rnd(i + 5e4) * 6, rnd(i + 6e4) * 6, 0], i * 3)
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(cl, 3)); g.setAttribute('aScale', new THREE.BufferAttribute(sc, 1)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 3))
  const mat = particleMat(1.0); scene.add(new THREE.Points(g, mat))
  const camera = cam(40)
  return {
    scene, camera, bloom: [1.0, 0.6, 0.25],
    update(u) { mat.uniforms.uTime.value = 3 + u * 1.3; camera.position.set(Math.sin(u * 0.4) * 0.6, 0, 9 - u * 2.2); camera.rotation.z = u * 0.05 },
    overlay(u) {
      c.save(); const g2 = c.createRadialGradient(CX, 960, 50, CX, 960, 640); g2.addColorStop(0, 'rgba(5,3,8,.82)'); g2.addColorStop(1, 'rgba(5,3,8,0)'); c.fillStyle = g2; c.fillRect(0, 0, W, H); c.restore()
      T('e ainda:', CX, 700, { f: `500 64px ${G}`, grad: [TEAL, MAG2], a: 'center', al: seg(u, 0, 0.2) })
      if (u < 0.05) return
      const per = 0.3, i = Math.min(FEATS.length - 1, Math.floor((u - 0.05) / per)), lu = u - 0.05 - i * per
      const word = FEATS[i], parts = word.length > 11 && word.includes(' ') ? splitMid(word) : [word]
      const size = Math.min(...parts.map((pp) => fit(pp, 700, 920, 200, -4))), f = `700 ${size}px ${G}`
      const s = lerp(1.18, 1, eExpo(seg(lu, 0, 0.14))), lh = size * 0.98, y0 = 960 - ((parts.length - 1) * lh) / 2 + size * 0.36
      c.save(); c.translate(CX, 960); c.scale(s, s); c.translate(-CX, -960)
      const style = i % 3
      if (style === 1) { const gg = c.createLinearGradient(0, 0, W, 0); gg.addColorStop(0, MAG); gg.addColorStop(1, VIO); c.fillStyle = gg; c.fillRect(0, y0 - size * 0.92, W, parts.length * lh + size * 0.22) }
      parts.forEach((pp, k) => T(pp, CX, y0 + k * lh, { f, c: style === 1 ? BG : WHITE, a: 'center', ls: -4, outline: style === 2 ? 3 : 0 }))
      if (style === 2) brackets({ x: 60, y: y0 - size - 34, w: 960, h: parts.length * lh + 80 }, 50, TEAL, 5)
      c.restore()
      T(`${pad(i + 1)} / ${pad(FEATS.length)}`, CX, 1300, { f: `400 32px ${M}`, c: WHITE, a: 'center', ls: 4, al: 0.65 })
    },
  }
}

/* =====================================================================
   CENA 8 · salto (rastros 3D em direção à câmera)
   ===================================================================== */
function mkWarp() {
  const scene = new THREE.Scene(); scene.background = col(BG)
  const N = 1800, g = new THREE.BufferGeometry(), p = new Float32Array(N * 6), cl = new Float32Array(N * 6)
  const pal = [col('#ffffff'), col('#ffffff'), col(MAG2), col(VIO), col(TEAL)]
  for (let i = 0; i < N; i++) { const k = pal[i % pal.length]; cl.set([k.r, k.g, k.b, k.r * 0.1, k.g * 0.1, k.b * 0.1], i * 6) }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(cl, 3))
  scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })))
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.5, 48, 32), new THREE.MeshBasicMaterial({ color: col(MAG2).multiplyScalar(3), toneMapped: false })); core.position.z = -40; scene.add(core)
  const camera = cam(50)
  return {
    scene, camera, bloom: [1.3, 0.7, 0.2],
    update(u) {
      const sp = 40 + eIn(seg(u, 0, 1)) * 60
      for (let i = 0; i < N; i++) {
        const a = rnd(i) * Math.PI * 2, r = 1.2 + rnd(i + 7) * 9, z = -60 + ((rnd(i + 3) * 60 + u * sp * (0.7 + rnd(i + 9) * 0.6)) % 62), len = 0.6 + (z + 60) / 60 * 6
        p.set([Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(a) * r, Math.sin(a) * r, z - len], i * 6)
      }
      g.attributes.position.needsUpdate = true; core.scale.setScalar(1 + u * 3); camera.position.set(0, 0, 4); camera.rotation.z = u * 0.4
    },
    overlay(u) {
      const g2 = c.createLinearGradient(0, 1150, 0, 1750); g2.addColorStop(0, 'rgba(5,3,8,0)'); g2.addColorStop(0.4, 'rgba(5,3,8,.8)'); g2.addColorStop(1, 'rgba(5,3,8,.8)'); c.fillStyle = g2; c.fillRect(0, 1150, W, 600)
      const sz = fit('UM SÓ LUGAR.', 700, 940, 150, -4)
      rise(seg(u, 0.12, 0.45), 1390, sz, () => T('TUDO EM', CX, 1390, { f: `700 ${sz}px ${G}`, c: WHITE, a: 'center', ls: -4 }))
      rise(seg(u, 0.22, 0.45), 1390 + sz, sz, () => T('UM SÓ LUGAR.', CX, 1390 + sz, { f: `700 ${sz}px ${G}`, c: WHITE, a: 'center', ls: -4, outline: 3 }))
    },
  }
}

/* =====================================================================
   CENA 9 · final (galáxia WebGL como no site)
   ===================================================================== */
function mkOutro() {
  const scene = new THREE.Scene(); scene.background = col(BG)
  const N = 70000, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), cl = new Float32Array(N * 3), sc = new Float32Array(N), rA = new Float32Array(N), aA = new Float32Array(N)
  const inner = col('#ffd2ea'), mid = col(MAG), mid2 = col(VIO), outer = col(TEAL), tmp = new THREE.Color()
  for (let i = 0; i < N; i++) {
    const r = Math.pow(rnd(i), 1.4) * 9, arm = (i % 3) / 3 * Math.PI * 2, spin = r * 0.9
    const rr_ = Math.pow(rnd(i + 1e5), 3) * (rnd(i + 2e5) < 0.5 ? 1 : -1) * (0.25 + r * 0.12)
    rA[i] = r; aA[i] = arm + spin
    p.set([rr_, Math.pow(rnd(i + 3e5), 3) * (rnd(i + 4e5) < 0.5 ? 1 : -1) * (0.4 - r * 0.03), Math.pow(rnd(i + 5e5), 3) * (rnd(i + 6e5) < 0.5 ? 1 : -1) * (0.25 + r * 0.12)], i * 3)
    const q = r / 9; tmp.copy(inner).lerp(rnd(i + 7e5) < 0.5 ? mid : mid2, clamp(q * 2.2)); if (q > 0.55 && rnd(i + 8e5) < 0.35) tmp.lerp(outer, 0.8)
    cl.set([tmp.r, tmp.g, tmp.b], i * 3); sc[i] = (10 + rnd(i + 9e5) * 28) * (q < 0.1 ? 1.6 : 1)
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(cl, 3)); g.setAttribute('aScale', new THREE.BufferAttribute(sc, 1)); g.setAttribute('aR', new THREE.BufferAttribute(rA, 1)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: 2.6 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uSize; attribute vec3 aColor; attribute float aScale; attribute float aR; attribute float aA; varying vec3 vColor;
      void main(){ float ang = aA + uTime*(0.55/(aR*0.35+0.6)); vec3 p = vec3(cos(ang)*aR, 0.0, sin(ang)*aR) + position;
        vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uSize*aScale/(-mv.z); vColor = aColor; }`,
    fragmentShader: `varying vec3 vColor; void main(){ float d = length(gl_PointCoord-0.5); float a = pow(1.0-smoothstep(0.0,0.5,d),2.4); gl_FragColor = vec4(vColor*a*1.1, a); }`,
  })
  const gal = new THREE.Points(g, mat); gal.rotation.set(0.95, 0, 0.25); scene.add(gal)
  const camera = cam(38)
  return {
    scene, camera, bloom: [1.1, 0.65, 0.12],
    update(u) { mat.uniforms.uTime.value = 2 + u * 0.8; gal.scale.setScalar(lerp(0.6, 1, eOut(seg(u, 0, 1.2)))); camera.position.set(0, -1.5 + u * 0.15, lerp(19, 15.5, eOut(u / 2.9))); camera.lookAt(0, 1.6, 0) },
    overlay(u) {
      shade(560, 1150, 'rgba(5,3,8,A)', 0); c.fillStyle = 'rgba(5,3,8,.35)'; c.fillRect(0, 560, W, 600)
      const sz = fit('SOLUTIONS', 700, 860, 160, -4)
      riseChars('ASTROVIA', 780, `700 ${sz}px ${G}`, sz, u, 0.15, 0.04, { c: WHITE, ls: -4, shadow: 'rgba(5,3,8,.6)' })
      rise(seg(u, 0.45, 0.5), 780 + sz * 0.92, sz, () => T('SOLUTIONS', CX, 780 + sz * 0.92, { f: `700 ${sz}px ${G}`, c: 'rgba(243,240,247,.65)', a: 'center', ls: -4, outline: 2.5 }))
      rise(seg(u, 0.75, 0.45), 1060, 46, () => T('sistemas para salões, clínicas e barbearias', CX, 1060, { f: `500 ${fit('sistemas para salões, clínicas e barbearias', 500, 900, 44)}px ${G}`, grad: [TEAL, MAG2], a: 'center' }))
      const ck = seg(u, 1.05, 0.5)
      if (ck > 0) { const cf = `700 32px ${M}`, lab = 'QUERO ESSE SISTEMA  →', cw = tw(lab, cf, 5) + 120, s = eBack(ck); c.save(); c.translate(CX, 1300); c.scale(s, s); c.globalAlpha = clamp(ck * 3); c.shadowColor = 'rgba(226,64,143,.8)'; c.shadowBlur = 40 + 25 * Math.sin(u * 5); pill(-cw / 2, -58, cw, 116, WHITE); c.shadowBlur = 0; T(lab, 0, 11, { f: cf, c: BG, a: 'center', ls: 5 }); c.restore() }
      const gk = seg(u, 1.25, 0.5)
      if (gk > 0) { const cf = `400 28px ${M}`, lab = 'CHAMAR NO WHATSAPP  →', cw = tw(lab, cf, 5) + 110; c.save(); c.globalAlpha = gk; c.translate(0, (1 - eOut(gk)) * 30); pill(CX - cw / 2, 1395, cw, 100, 'rgba(5,3,8,.55)', 'rgba(243,240,247,.28)'); T(lab, CX, 1455, { f: cf, c: WHITE, a: 'center', ls: 5, al: 0.9 }); c.restore() }
      const dk = seg(u, 1.5, 0.4)
      if (dk > 0) { const f = `400 22px ${M}`, lab = 'DISPONÍVEL PARA NOVOS PROJETOS', w = tw(lab, f, 4); c.save(); c.globalAlpha = dk; c.fillStyle = TEAL; c.shadowColor = TEAL; c.shadowBlur = 14 + 8 * Math.sin(u * 6); c.beginPath(); c.arc(CX - w / 2 - 22 + 12, 1592, 7, 0, 7); c.fill(); c.restore(); T(lab, CX + 12, 1600, { f, c: WHITE, a: 'center', ls: 4, al: dk * 0.7 }) }
      const lp = seg(u, 2.1, 0.8), b = Math.sin(lp * Math.PI)
      if (b > 0) { c.save(); c.globalCompositeOperation = 'screen'; const gx = W + 100 - lp * 700, gy = H - lp * 1000, g3 = c.createRadialGradient(gx, gy, 10, gx, gy, 1500); g3.addColorStop(0, `rgba(255,170,215,${0.85 * b})`); g3.addColorStop(0.35, `rgba(226,64,143,${0.55 * b})`); g3.addColorStop(0.7, `rgba(123,92,255,${0.25 * b})`); g3.addColorStop(1, 'rgba(123,92,255,0)'); c.fillStyle = g3; c.fillRect(0, 0, W, H); c.restore() }
    },
  }
}

/* ---------- timeline ---------- */
let S = []
const TOTAL = 22.6
function hud(t, dark, lab) {
  const cc = dark ? '243,240,247' : '5,3,8', f = `400 22px ${M}`
  c.save(); c.globalAlpha = seg(t, 0.15, 0.4)
  brackets({ x: 46, y: 46, w: W - 92, h: H - 92 }, 34, `rgba(${cc},.4)`, 2)
  T('ASTROVIA · CURITIBA / BR', 84, 110, { f, c: `rgba(${cc},.75)`, ls: 4 })
  const fr = Math.floor(t * FPS), tc = `00:${pad(Math.floor(t))}:${pad(fr % FPS)}`
  T(tc, 996, 110, { f, c: `rgba(${cc},.75)`, a: 'right' })
  const rx = 996 - tw(tc, f) - 22; T('REC', rx, 110, { f, c: `rgba(${cc},.75)`, a: 'right' })
  if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = MAG; c.beginPath(); c.arc(rx - tw('REC', f) - 16, 103, 7, 0, 7); c.fill() }
  T(lab, 84, 1846, { f, c: `rgba(${cc},.75)`, ls: 3 }); T('astrovia-solutions.vercel.app', 996, 1846, { f: `400 20px ${M}`, c: `rgba(${cc},.6)`, a: 'right' })
  c.restore()
}
const grain = [...Array(4)].map((_, n) => { const g = document.createElement('canvas'); g.width = g.height = 256; const x = g.getContext('2d'), id = x.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = rnd(i * 0.37 + n * 991.3) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255 } x.putImageData(id, 0, 0); return g })
// cortina diagonal: cobre (p 0→1) no fim da cena e descobre no começo da próxima
function curtain(colr, p, leaving) {
  const y = leaving ? lerp(H + 260, -260, eIO(p)) : lerp(H + 260, -260, eIO(p))
  c.fillStyle = colr; c.beginPath()
  if (!leaving) { c.moveTo(0, y + 160); c.lineTo(W, y - 160); c.lineTo(W, H + 400); c.lineTo(0, H + 400) } else { c.moveTo(0, -400); c.lineTo(W, -400); c.lineTo(W, y - 160); c.lineTo(0, y + 160) }
  c.closePath(); c.fill()
  const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, TEAL); g.addColorStop(0.5, MAG); g.addColorStop(1, VIO)
  c.save(); c.shadowColor = MAG; c.shadowBlur = 30; c.strokeStyle = g; c.lineWidth = 6; c.beginPath(); c.moveTo(0, y + 160); c.lineTo(W, y - 160); c.stroke(); c.restore()
}

window.render = function (t) {
  t = clamp(t, 0, TOTAL - 1e-6)
  let idx = 0; S.forEach((s, i) => { if (t >= s.s) idx = i })
  const sc = S[idx], nx = S[idx + 1], u = t - sc.s
  sc.o.update(u)
  rpass.scene = sc.o.scene; rpass.camera = sc.o.camera
  ;[bloom.strength, bloom.radius, bloom.threshold] = sc.o.bloom
  composer.render()
  ov.setTransform(1, 0, 0, 1, 0, 0); ov.clearRect(0, 0, W, H); c = ov; c.globalAlpha = 1
  sc.o.overlay(u)
  const W2 = 0.34
  if (nx && nx.wipe && t > nx.s - W2) curtain(nx.wipe, (t - (nx.s - W2)) / W2, false)
  if (sc.wipe && u < W2) curtain(sc.wipe, u / W2, true)
  if (sc.flash && u < 0.1) { c.fillStyle = `rgba(255,220,240,${0.85 * (1 - u / 0.1)})`; c.fillRect(0, 0, W, H) }
  hud(t, sc.dark, sc.lab)
  out.globalCompositeOperation = 'source-over'; out.globalAlpha = 1
  out.drawImage(glc, 0, 0); out.drawImage(ovc, 0, 0)
  out.save(); out.globalAlpha = 0.06; out.globalCompositeOperation = 'overlay'; out.fillStyle = out.createPattern(grain[Math.floor(t * FPS) % 4], 'repeat'); out.fillRect(0, 0, W, H); out.restore()
  const v = out.createRadialGradient(CX, 960, 620, CX, 960, 1260); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.4)'); out.fillStyle = v; out.fillRect(0, 0, W, H)
}

window.TOTAL = TOTAL
window.FPS = FPS
window.ready = (async () => {
  await Promise.all([`700 100px ${G}`, `500 100px ${G}`, `400 100px ${G}`, `400 20px ${M}`, `700 20px ${M}`, `700 20px ${UI}`, `800 20px ${UI}`].map((f) => document.fonts.load(f)))
  for (const n of ['booking', 'inicio', 'agenda']) SHOTS[n] = await loadShot(n)
  FONT3D = await new Promise((res, rej) => new TTFLoader().load('fonts/space-grotesk-latin-700-normal.woff', (j) => res(new Font(j)), undefined, rej))
  S = [
    { s: 0.0, dark: 1, lab: '00 · O PROBLEMA', o: mkHook() },
    { s: 2.0, dark: 0, lab: '00 · O PROBLEMA', o: mkChega() },
    { s: 3.7, dark: 1, lab: '— · APRESENTANDO', o: mkHero() },
    { s: 6.3, dark: 1, lab: '01 · AGENDA', o: mkAgenda(), wipe: '#170D3A' },
    { s: 8.9, dark: 0, lab: '02 · CAIXA', o: mkComanda(), wipe: LAV },
    { s: 11.5, dark: 1, lab: '03 · RELATÓRIOS', o: mkDash(), wipe: BG },
    { s: 13.7, dark: 0, lab: '04 · CASE', o: mkCase(), wipe: '#F7EEEC' },
    { s: 16.5, dark: 1, lab: '05 · E MUITO MAIS', o: mkFeats(), flash: 1 },
    { s: 18.7, dark: 1, lab: '06 · TUDO JUNTO', o: mkWarp(), flash: 1 },
    { s: 19.7, dark: 1, lab: 'ASTROVIA SOLUTIONS', o: mkOutro(), flash: 1 },
  ]
  window.render(0); return true
})()
