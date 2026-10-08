// Astrovia — Reels editorial (v4). Menos elementos, movimento lento, foco óptico e material real.
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

const W = 1080, H = 1920, CX = 540, FPS = 60
const BG = '#060509', IVORY = '#ECE7E1', MUTED = '#8E8996', MAG = '#E2408F', TEAL = '#3DD9C5', VIO = '#7B5CFF'
const G = '"Space Grotesk", sans-serif', M = '"Space Mono", monospace'

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const lerp = (a, b, k) => a + (b - a) * k
const seg = (u, a, d) => clamp((u - a) / d)
const eIO = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
const eOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const eQuint = (x) => 1 - Math.pow(1 - clamp(x), 5)
const eSine = (x) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2
const rnd = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

/* ---------- 2D: tipografia ---------- */
const ovc = document.getElementById('ov'), outc = document.getElementById('out'), glc = document.getElementById('gl')
const c = ovc.getContext('2d'), out = outc.getContext('2d')
// revelação editorial: desfoque → nítido, espaçamento que assenta, leve subida
function say(s, x, y, o, k, kOut = 0) {
  const a = eOut(k) * (1 - eIO(kOut)); if (a <= 0.001) return
  const blur = (1 - eQuint(k)) * 14 + eIO(kOut) * 10, size = o.size
  c.save(); c.globalAlpha = a
  c.font = `${o.w || 400} ${size}px ${o.mono ? M : G}`; c.textAlign = o.a || 'left'; c.textBaseline = 'alphabetic'
  c.letterSpacing = `${(o.ls || 0) + (1 - eQuint(k)) * size * 0.12}px`
  if (blur > 0.3) c.filter = `blur(${blur.toFixed(2)}px)`
  let fill = o.c || IVORY
  if (o.grad) { const w = c.measureText(s).width, x0 = o.a === 'center' ? x - w / 2 : x; const g = c.createLinearGradient(x0, 0, x0 + w, 0); o.grad.forEach((cc, i) => g.addColorStop(i / (o.grad.length - 1), cc)); fill = g }
  c.fillStyle = fill; c.fillText(s, x, y + (1 - eQuint(k)) * size * 0.25)
  c.restore()
}
function rule(x, y, w, k, kOut = 0) {
  const ww = w * eQuint(k) * (1 - eIO(kOut)); if (ww <= 0.5) return
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, TEAL); g.addColorStop(0.5, MAG); g.addColorStop(1, VIO)
  c.fillStyle = g; c.fillRect(x, y, ww, 2)
}

/* ---------- renderer + pós ---------- */
const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1); renderer.setSize(W, H, false)
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1
renderer.outputColorSpace = THREE.SRGBColorSpace
RectAreaLightUniformsLib.init()
const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H)
const rpass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera())
const bokeh = new BokehPass(rpass.scene, rpass.camera, { focus: 10, aperture: 0.002, maxblur: 0.01 })
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.3, 0.6, 0.9)
composer.addPass(rpass); composer.addPass(bokeh); composer.addPass(bloom); composer.addPass(new OutputPass())

const cam = (fov) => new THREE.PerspectiveCamera(fov, W / H, 0.1, 300)
const col = (h) => new THREE.Color(h)
const spriteTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv) })()

// poeira cósmica fora de foco (eco da galáxia do site, bem discreta)
function dust(scene, n, spread, seed, opacity = 0.5, size = 0.12) {
  const g = new THREE.BufferGeometry(), p = [], cl = []
  const pal = [col('#ffffff'), col('#ffffff'), col('#ffd1e6'), col('#c9bcff'), col('#b8fff4')]
  for (let i = 0; i < n; i++) { p.push((rnd(i * 3 + seed) - 0.5) * spread[0], (rnd(i * 5 + seed) - 0.5) * spread[1], (rnd(i * 7 + seed) - 0.5) * spread[2]); const k = pal[i % pal.length]; cl.push(k.r, k.g, k.b) }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3))
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, map: spriteTex, vertexColors: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }))
  scene.add(pts); return pts
}

/* ---------- celular: titânio, vidro e tela real que rola ---------- */
const SHOT = {}
async function loadShot(name) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `shots/${name}-full.jpg` })
  const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true
  t.userData = { h: img.height }; return t
}
const maskTex = (() => { const cv = document.createElement('canvas'); cv.width = 462; cv.height = 1000; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 462, 1000); x.fillStyle = '#fff'; x.beginPath(); x.roundRect(0, 0, 462, 1000, 58); x.fill(); return new THREE.CanvasTexture(cv) })()
function phone(shotName) {
  const grp = new THREE.Group(), w = 2.2, h = 4.5, d = 0.24
  const ti = new THREE.MeshPhysicalMaterial({ color: '#6a6870', metalness: 1, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 })
  grp.add(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 10, 0.32), ti))
  const glass = new THREE.Mesh(new RoundedBoxGeometry(w - 0.05, h - 0.05, 0.02, 8, 0.3), new THREE.MeshPhysicalMaterial({ color: '#000000', roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02 }))
  glass.position.z = d / 2 - 0.005; grp.add(glass)
  const src = SHOT[shotName], tex = src.clone(); tex.needsUpdate = true; tex.userData = src.userData
  const sw = w - 0.2, sh = sw / 0.462
  const vis = 1688 / tex.userData.h; tex.repeat.set(1, vis); tex.offset.set(0, 1 - vis)
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.8, roughness: 0.06, metalness: 0, alphaMap: maskTex, transparent: true, toneMapped: false }))
  scr.position.z = d / 2 + 0.008; grp.add(scr)
  const ish = new THREE.Shape(); { const iw = 0.5, ih = 0.15, r = 0.075; ish.moveTo(-iw / 2 + r, -ih / 2); ish.lineTo(iw / 2 - r, -ih / 2); ish.absarc(iw / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2); ish.lineTo(-iw / 2 + r, ih / 2); ish.absarc(-iw / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5) }
  const island = new THREE.Mesh(new THREE.ShapeGeometry(ish, 24), new THREE.MeshPhysicalMaterial({ color: '#020203', roughness: 0.15, clearcoat: 1 }))
  island.position.set(0, sh / 2 - 0.16, d / 2 + 0.012); grp.add(island)
  ;[[-1, 0.9, 0.42], [-1, 0.35, 0.42], [1, 0.6, 0.7]].forEach(([s, y, l]) => { const b = new THREE.Mesh(new RoundedBoxGeometry(0.05, l, 0.09, 3, 0.02), ti); b.position.set(s * (w / 2 + 0.012), y, 0); grp.add(b) })
  grp.userData = { tex, vis, scroll(f) { const s = clamp(f) * (1 - vis); tex.offset.y = 1 - vis - s } }
  return grp
}
function studio(scene, rimColor = MAG) {
  scene.environment = env; scene.environmentIntensity = 0.55
  const key = new THREE.RectAreaLight('#ffffff', 5, 6, 9); key.position.set(4, 6, 8); key.lookAt(0, 0, 0); scene.add(key)
  const rim = new THREE.RectAreaLight(rimColor, 9, 2, 12); rim.position.set(-6, 2, -4); rim.lookAt(0, 0, 0); scene.add(rim)
  const rim2 = new THREE.RectAreaLight('#9d8cff', 5, 2, 12); rim2.position.set(6, -1, -5); rim2.lookAt(0, 0, 0); scene.add(rim2)
  scene.add(new THREE.AmbientLight('#ffffff', 0.08))
}

/* =====================================================================
   1 · abertura — "Nem todo sistema precisa parecer um sistema."
   ===================================================================== */
function mkOpen() {
  const scene = new THREE.Scene(); scene.background = col(BG)
  const d = dust(scene, 900, [30, 50, 40], 1, 0.55, 0.16)
  const camera = cam(40)
  return {
    scene, camera, dof: [9, 0.004, 0.012], bloom: [0.35, 0.6, 0.6],
    update(u) { camera.position.set(Math.sin(u * 0.3) * 0.3, 0, 22 - u * 1.2); d.rotation.y = u * 0.03 },
    overlay(u) {
      const out_ = seg(u, 2.95, 0.45)
      rule(96, 820, 120, seg(u, 0.25, 0.8), out_)
      say('Nem todo sistema', 96, 960, { size: 82, w: 400, ls: -2 }, seg(u, 0.5, 0.9), out_)
      say('precisa parecer', 96, 1060, { size: 82, w: 400, ls: -2 }, seg(u, 0.75, 0.9), out_)
      say('um sistema.', 96, 1160, { size: 82, w: 500, ls: -2, grad: [TEAL, MAG] }, seg(u, 1.05, 0.9), out_)
    },
  }
}

/* =====================================================================
   2 · o produto — um celular, a tela real rolando, a luz passando no vidro
   ===================================================================== */
function mkHero() {
  const scene = new THREE.Scene(); scene.background = col(BG); studio(scene)
  const p = phone('booking'); scene.add(p)
  const d = dust(scene, 500, [30, 40, 30], 7, 0.35, 0.14); d.position.z = -14
  const camera = cam(26)
  return {
    scene, camera, dof: [12, 0.0016, 0.01], bloom: [0.12, 0.5, 1.0],
    update(u) {
      const k = u / 4.8
      p.rotation.set(0.06 - k * 0.05, lerp(-0.42, 0.3, eIO(k)), lerp(0.04, -0.02, eIO(k)))
      p.position.set(0, lerp(-0.25, 0.15, eSine(k)), 0)
      p.userData.scroll(eIO(seg(u, 0.9, 3.4)) * 0.42)
      scene.environmentRotation.set(0, u * 0.35, 0)
      camera.position.set(lerp(0.5, -0.4, eIO(k)), 0.2, lerp(14.6, 13.4, eIO(k))); camera.lookAt(0, -0.55, 0); this.dof[0] = camera.position.length()
    },
    overlay(u) {
      const o = seg(u, 4.3, 0.5)
      say('CASE  01', 96, 1600, { size: 22, mono: true, ls: 6, c: MUTED }, seg(u, 0.9, 0.8), o)
      say('Lu Wolcher', 96, 1680, { size: 60, w: 500, ls: -1 }, seg(u, 1.05, 0.9), o)
      say('Estética Avançada  ·  Curitiba', 96, 1735, { size: 28, w: 400, c: MUTED }, seg(u, 1.25, 0.9), o)
    },
  }
}

/* =====================================================================
   3 · o sistema — três telas em profundidade, câmera em travelling e troca de foco
   ===================================================================== */
function mkSystem() {
  const scene = new THREE.Scene(); scene.background = col(BG); studio(scene, '#c04ab0')
  const ps = [phone('inicio'), phone('agenda'), phone('booking')]
  ps[0].position.set(-1.45, -0.4, 0.6); ps[1].position.set(0.5, -0.6, -2.4); ps[2].position.set(2.9, -0.35, -5.8)
  ps.forEach((p, i) => { p.rotation.set(0.02, 0.32, 0); scene.add(p) })
  const d = dust(scene, 500, [30, 40, 30], 11, 0.3, 0.14); d.position.z = -16
  const camera = cam(30)
  return {
    scene, camera, dof: [14, 0.0022, 0.012], bloom: [0.12, 0.5, 1.0],
    update(u) {
      const k = u / 4.4
      ps[0].userData.scroll(eIO(seg(u, 0.4, 3.4)) * 0.18); ps[1].userData.scroll(eIO(seg(u, 0.8, 3.2)) * 0.32); ps[2].userData.scroll(0.55 + eIO(seg(u, 0.6, 3.4)) * 0.2)
      ps.forEach((p, i) => (p.position.y = [-0.4, -0.6, -0.35][i] + Math.sin(u * 0.9 + i * 1.7) * 0.06))
      scene.environmentRotation.set(0, 1.2 + u * 0.3, 0)
      camera.position.set(lerp(-3.4, 1.4, eIO(k)), lerp(0.4, 0.1, eIO(k)), lerp(17, 15.8, eIO(k))); camera.lookAt(lerp(-0.8, 1.4, eIO(k)), -0.2, -1.5)
      const target = [ps[0], ps[1], ps[2]][0].position, f = eIO(seg(u, 1.4, 1.6)), f2 = eIO(seg(u, 3.0, 1.0))
      const fp = new THREE.Vector3().copy(ps[0].position).lerp(ps[1].position, f).lerp(ps[2].position, f2 * 0.6)
      this.dof[0] = camera.position.distanceTo(fp)
    },
    overlay(u) {
      const o = seg(u, 3.95, 0.45)
      say('Do agendamento', 96, 300, { size: 66, w: 400, ls: -1.5 }, seg(u, 0.3, 0.9), o)
      say('ao caixa.', 96, 380, { size: 66, w: 400, ls: -1.5, c: MUTED }, seg(u, 0.55, 0.9), o)
      say('AGENDA   ·   CAIXA   ·   COMISSÕES   ·   FIDELIDADE', CX, 1740, { size: 20, mono: true, ls: 4, c: MUTED, a: 'center' }, seg(u, 1.4, 0.9), o)
    },
  }
}

/* =====================================================================
   4 · manifesto — "Produtos digitais com gesto próprio."
   ===================================================================== */
function mkStatement() {
  const scene = new THREE.Scene(); scene.background = col(BG)
  const d = dust(scene, 900, [30, 50, 40], 21, 0.5, 0.16)
  const camera = cam(40)
  return {
    scene, camera, dof: [9, 0.004, 0.012], bloom: [0.35, 0.6, 0.6],
    update(u) { camera.position.set(0, Math.sin(u * 0.4) * 0.2, 18 - u * 1.3); d.rotation.y = -u * 0.03 },
    overlay(u) {
      const o = seg(u, 2.45, 0.4)
      rule(CX - 60, 840, 120, seg(u, 0.15, 0.8), o)
      say('Produtos digitais', CX, 980, { size: 84, w: 400, ls: -2, a: 'center' }, seg(u, 0.35, 0.9), o)
      say('com gesto próprio.', CX, 1080, { size: 84, w: 500, ls: -2, a: 'center', grad: [TEAL, MAG, VIO] }, seg(u, 0.7, 0.9), o)
    },
  }
}

/* =====================================================================
   5 · assinatura — galáxia do site, ASTROVIA, convite
   ===================================================================== */
function mkSign() {
  const scene = new THREE.Scene(); scene.background = col(BG)
  const N = 60000, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3), cl = new Float32Array(N * 3), sc = new Float32Array(N), rA = new Float32Array(N), aA = new Float32Array(N)
  const inner = col('#ffe3f1'), mid = col(MAG), mid2 = col(VIO), outer = col(TEAL), tmp = new THREE.Color()
  for (let i = 0; i < N; i++) {
    const r = Math.pow(rnd(i), 1.4) * 9, arm = (i % 3) / 3 * Math.PI * 2
    rA[i] = r; aA[i] = arm + r * 0.9
    const sg = (n) => (rnd(n) < 0.5 ? 1 : -1)
    p.set([Math.pow(rnd(i + 1e5), 3) * sg(i + 2e5) * (0.25 + r * 0.12), Math.pow(rnd(i + 3e5), 3) * sg(i + 4e5) * (0.4 - r * 0.03), Math.pow(rnd(i + 5e5), 3) * sg(i + 6e5) * (0.25 + r * 0.12)], i * 3)
    const q = r / 9; tmp.copy(inner).lerp(rnd(i + 7e5) < 0.5 ? mid : mid2, clamp(q * 2.2)); if (q > 0.55 && rnd(i + 8e5) < 0.3) tmp.lerp(outer, 0.7)
    cl.set([tmp.r, tmp.g, tmp.b], i * 3); sc[i] = 10 + rnd(i + 9e5) * 26
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(cl, 3)); g.setAttribute('aScale', new THREE.BufferAttribute(sc, 1)); g.setAttribute('aR', new THREE.BufferAttribute(rA, 1)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 1))
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: 3.0 }, uFade: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uSize; attribute vec3 aColor; attribute float aScale; attribute float aR; attribute float aA; varying vec3 vColor;
      void main(){ float ang = aA + uTime*(0.5/(aR*0.35+0.6)); vec3 p = vec3(cos(ang)*aR, 0.0, sin(ang)*aR) + position;
        vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uSize*aScale/(-mv.z); vColor = aColor; }`,
    fragmentShader: `uniform float uFade; varying vec3 vColor; void main(){ float d = length(gl_PointCoord-0.5); float a = pow(1.0-smoothstep(0.0,0.5,d),2.4); gl_FragColor = vec4(vColor*a*0.8*uFade, a*uFade); }`,
  })
  const gal = new THREE.Points(g, mat); gal.rotation.set(1.05, 0, 0.3); scene.add(gal)
  const camera = cam(36)
  return {
    scene, camera, dof: [16, 0.001, 0.006], bloom: [0.7, 0.7, 0.1],
    update(u) { mat.uniforms.uTime.value = u * 0.5; mat.uniforms.uFade.value = eIO(seg(u, 0, 1.2)) * 0.75; camera.position.set(0, -6 + u * 0.2, lerp(17, 15, eIO(u / 3.4))); camera.lookAt(0, -2.4, 0) },
    overlay(u) {
      say('ASTROVIA', CX, 900, { size: 64, w: 500, ls: 26, a: 'center' }, seg(u, 0.5, 1.1))
      rule(CX - 40, 960, 80, seg(u, 1.0, 0.8))
      say('Conheça nosso trabalho', CX, 1060, { size: 44, w: 400, a: 'center' }, seg(u, 1.3, 1.0))
      say('astrovia-solutions.vercel.app', CX, 1124, { size: 24, mono: true, ls: 2, c: MUTED, a: 'center' }, seg(u, 1.6, 1.0))
    },
  }
}

/* ---------- timeline: cortes por mergulho no preto ---------- */
let S = []
const TOTAL = 19.6
const grain = [...Array(4)].map((_, n) => { const g = document.createElement('canvas'); g.width = g.height = 256; const x = g.getContext('2d'), id = x.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = rnd(i * 0.37 + n * 991.3) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255 } x.putImageData(id, 0, 0); return g })

window.render = function (t) {
  t = clamp(t, 0, TOTAL - 1e-6)
  let idx = 0; S.forEach((s, i) => { if (t >= s.s) idx = i })
  const sc = S[idx], nx = S[idx + 1], u = t - sc.s, d = (nx ? nx.s : TOTAL) - sc.s
  sc.o.update(u)
  rpass.scene = bokeh.scene = sc.o.scene; rpass.camera = bokeh.camera = sc.o.camera
  const [focus, aperture, maxblur] = sc.o.dof; bokeh.uniforms.focus.value = focus; bokeh.uniforms.aperture.value = aperture; bokeh.uniforms.maxblur.value = maxblur
  ;[bloom.strength, bloom.radius, bloom.threshold] = sc.o.bloom
  composer.render()
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.globalAlpha = 1; c.filter = 'none'
  sc.o.overlay(u)
  // assinatura discreta fixa
  c.save(); c.globalAlpha = 0.45 * seg(t, 0.4, 1) * (1 - seg(t, S[S.length - 1].s, 0.6)); c.font = `500 20px ${G}`; c.letterSpacing = '9px'; c.fillStyle = IVORY; c.fillText('ASTROVIA', 96, 130); c.restore()
  out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'
  out.drawImage(glc, 0, 0); out.drawImage(ovc, 0, 0)
  // mergulho no preto entre cenas (entrada e saída suaves)
  const fade = Math.max(1 - eSine(seg(u, 0, 0.45)), nx ? eSine(seg(u, d - 0.45, 0.45)) : eSine(seg(u, d - 0.5, 0.5)) * 0)
  if (fade > 0.001) { out.fillStyle = `rgba(6,5,9,${fade})`; out.fillRect(0, 0, W, H) }
  out.save(); out.globalAlpha = 0.045; out.globalCompositeOperation = 'overlay'; out.fillStyle = out.createPattern(grain[Math.floor(t * FPS) % 4], 'repeat'); out.fillRect(0, 0, W, H); out.restore()
  const v = out.createRadialGradient(CX, 960, 650, CX, 960, 1300); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); out.fillStyle = v; out.fillRect(0, 0, W, H)
}

window.TOTAL = TOTAL
window.FPS = FPS
window.ready = (async () => {
  await Promise.all([`700 100px ${G}`, `500 100px ${G}`, `400 100px ${G}`, `400 20px ${M}`].map((f) => document.fonts.load(f)))
  for (const n of ['booking', 'inicio', 'agenda']) SHOT[n] = await loadShot(n)
  S = [
    { s: 0.0, o: mkOpen() },
    { s: 3.4, o: mkHero() },
    { s: 8.2, o: mkSystem() },
    { s: 12.6, o: mkStatement() },
    { s: 15.6, o: mkSign() },
  ]
  window.render(0); return true
})()
