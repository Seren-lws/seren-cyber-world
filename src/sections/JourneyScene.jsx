import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import './JourneyScene.css'

gsap.registerPlugin(ScrollTrigger)

const N = 26000
const TILT = 1.02
const R = 2.8 // 系统左右偏移
const ease = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.max(0, Math.min(1, t))

// 背景随滚动渐变：相遇(冷紫) → 相爱(暖紫) → 相生(暖金调)
const BG = [
  { p: 0.12, a: [20, 24, 60], b: [13, 16, 44], c: [9, 11, 30] }, // 相遇 冷蓝紫
  { p: 0.5, a: [60, 24, 70], b: [38, 16, 50], c: [22, 10, 36] }, // 相爱 品红紫
  { p: 0.88, a: [66, 50, 28], b: [44, 32, 22], c: [24, 17, 14] }, // 相生 暖金
]
const lerpC = (a, b, t) => [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
const rgb = (a) => `rgb(${a[0]},${a[1]},${a[2]})`
function interpBg(p) {
  let k0 = BG[0]
  let k1 = BG[0]
  if (p <= BG[0].p) { k0 = k1 = BG[0] } else if (p >= BG[2].p) { k0 = k1 = BG[2] } else {
    for (let i = 0; i < BG.length - 1; i++) {
      if (p >= BG[i].p && p <= BG[i + 1].p) { k0 = BG[i]; k1 = BG[i + 1]; break }
    }
  }
  const t = k1.p === k0.p ? 0 : (p - k0.p) / (k1.p - k0.p)
  const a = lerpC(k0.a, k1.a, t)
  const b = lerpC(k0.b, k1.b, t)
  const c = lerpC(k0.c, k1.c, t)
  return `radial-gradient(130% 100% at 50% 40%, ${rgb(a)} 0%, ${rgb(b)} 60%, ${rgb(c)} 100%)`
}

// 画布自身的背景色随滚动流动（Bloom 让画布不透明，所以直接驱动 scene.background）
const BGC = [
  { p: 0.12, c: [0.06, 0.07, 0.2] }, // 相遇 冷蓝紫
  { p: 0.5, c: [0.18, 0.07, 0.22] }, // 相爱 品红紫
  { p: 0.88, c: [0.2, 0.15, 0.09] }, // 相生 暖金
]
function bgColorAt(p) {
  let k0 = BGC[0]
  let k1 = BGC[0]
  if (p <= BGC[0].p) { k0 = k1 = BGC[0] } else if (p >= BGC[2].p) { k0 = k1 = BGC[2] } else {
    for (let i = 0; i < BGC.length - 1; i++) {
      if (p >= BGC[i].p && p <= BGC[i + 1].p) { k0 = BGC[i]; k1 = BGC[i + 1]; break }
    }
  }
  const t = k1.p === k0.p ? 0 : (p - k0.p) / (k1.p - k0.p)
  return [lerp(k0.c[0], k1.c[0], t), lerp(k0.c[1], k1.c[1], t), lerp(k0.c[2], k1.c[2], t)]
}

const JR_STARS = [
  { t: '8%', l: '12%', s: 2, d: 0 }, { t: '14%', l: '34%', s: 3, d: 1.2 }, { t: '10%', l: '60%', s: 2, d: 0.6 },
  { t: '18%', l: '82%', s: 3, d: 1.8 }, { t: '24%', l: '6%', s: 2, d: 0.9 }, { t: '28%', l: '48%', s: 2, d: 2.1 },
  { t: '22%', l: '92%', s: 2, d: 1.5 }, { t: '34%', l: '24%', s: 3, d: 0.3 }, { t: '38%', l: '72%', s: 2, d: 1.0 },
  { t: '44%', l: '14%', s: 2, d: 2.4 }, { t: '46%', l: '88%', s: 3, d: 0.7 }, { t: '52%', l: '40%', s: 2, d: 1.7 },
  { t: '56%', l: '66%', s: 2, d: 0.4 }, { t: '60%', l: '8%', s: 3, d: 2.0 }, { t: '64%', l: '94%', s: 2, d: 1.1 },
  { t: '68%', l: '30%', s: 2, d: 0.5 }, { t: '72%', l: '54%', s: 3, d: 1.9 }, { t: '70%', l: '78%', s: 2, d: 0.8 },
  { t: '80%', l: '18%', s: 2, d: 2.3 }, { t: '84%', l: '46%', s: 3, d: 0.2 }, { t: '82%', l: '70%', s: 2, d: 1.4 },
  { t: '88%', l: '88%', s: 2, d: 1.0 }, { t: '90%', l: '10%', s: 2, d: 0.6 }, { t: '40%', l: '58%', s: 2, d: 2.2 },
  { t: '16%', l: '46%', s: 2, d: 1.3 }, { t: '54%', l: '26%', s: 2, d: 0.9 }, { t: '76%', l: '40%', s: 2, d: 1.6 },
  { t: '30%', l: '64%', s: 2, d: 0.1 },
]

// 背景闪烁小星（固定分布，稳定不抖）
const STARS = Array.from({ length: 30 }, (_, i) => ({
  top: (i * 67) % 100,
  left: (i * 41 + 13) % 100,
  s: 1 + (i % 3),
  d: (i % 8) * 0.4,
}))

function makeSprite() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.3, 'rgba(255,255,255,0.55)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

export default function JourneyScene() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const mountRef = useRef(null)
  const capRefs = useRef([])
  const progress = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mount = mountRef.current
    let W = mount.clientWidth
    let H = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(W, H)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.68
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0.055, 0.03, 0.12) // 非常深的紫
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.set(0, 0, 11)

    const system = new THREE.Group()
    system.rotation.x = TILT
    scene.add(system)

    const sprite = makeSprite()
    const mkSprite = (hex, s) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: new THREE.Color(hex), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
      sp.scale.setScalar(s)
      system.add(sp)
      return sp
    }

    const ang = new Float32Array(N)
    const rfac = new Float32Array(N)
    const sides = new Uint8Array(N)
    for (let i = 0; i < N; i++) {
      ang[i] = Math.random() * Math.PI * 2
      rfac[i] = Math.random()
      sides[i] = Math.random() < 0.5 ? 0 : 1
    }
    const positions = new Float32Array(N * 3)
    const colors = new Float32Array(N * 3)
    const gold = new THREE.Color('#fde374')
    const violet = new THREE.Color('#b388f0')
    const cream = new THREE.Color('#fff4d6')
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      const c = sides[i] ? violet : Math.random() < 0.25 ? cream : gold
      colors[i * 3] = c.r * 0.5
      colors[i * 3 + 1] = c.g * 0.5
      colors[i * 3 + 2] = c.b * 0.5
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({ size: 0.03, map: sprite, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })
    const points = new THREE.Points(geo, mat)
    system.add(points)

    const ringMats = []
    for (let r = 0; r < 26; r++) {
      const rad = 1.6 + r * 0.15
      const pts = new THREE.EllipseCurve(0, 0, rad, rad, 0, Math.PI * 2).getPoints(180)
      const g = new THREE.BufferGeometry().setFromPoints(pts)
      const m = new THREE.LineBasicMaterial({ color: new THREE.Color(r % 4 === 0 ? '#fff0c0' : '#fcc94e'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
      system.add(new THREE.LineLoop(g, m))
      ringMats.push(m)
    }

    const planetDefs = [
      { hex: '#fde374', r: 2.1, speed: 0.5, phase: 0, s: 0.28 },
      { hex: '#c9b0f5', r: 3.0, speed: -0.36, phase: 2, s: 0.4 },
      { hex: '#f0a35e', r: 3.9, speed: 0.27, phase: 4, s: 0.32 },
      { hex: '#fff4d6', r: 4.7, speed: -0.2, phase: 1, s: 0.24 },
    ]
    const planets = planetDefs.map((d) => {
      const sp = mkSprite(d.hex, d.s)
      sp.material.opacity = 0
      return sp
    })
    const core = mkSprite('#fff0c8', 0.5)
    core.material.opacity = 0
    const starA = mkSprite('#fff3cf', 1.0)
    const starB = mkSprite('#c9b0f5', 0.92)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.28, 0.5, 0.25)
    composer.addPass(bloom)
    composer.setSize(W, H)

    let mx = 0
    let my = 0
    const onMove = (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1
      my = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)

    const win = (x, a, b) => clamp01((x - a) / (b - a))
    const bell = (x, a, b) => {
      const t = win(x, a, b)
      return Math.sin(t * Math.PI)
    }

    let raf
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const t = now * 0.001
      const p = reduce ? 0.88 : progress.current

      // —— 由滚动进度决定：第几幕 / 左右位置 / 是否散开飞 ——
      let stage = 0
      let sub = 0
      let sysXT = R
      let transition = false
      let dir = 0
      if (p < 0.3) {
        stage = 0
        sub = p / 0.3
        sysXT = R
      } else if (p < 0.42) {
        transition = true
        dir = -1
        sysXT = lerp(R, -R, win(p, 0.3, 0.42))
      } else if (p < 0.66) {
        stage = 1
        sysXT = -R
      } else if (p < 0.78) {
        transition = true
        dir = 1
        sysXT = lerp(-R, R, win(p, 0.66, 0.78))
      } else {
        stage = 2
        sysXT = R
      }

      const pos = geo.attributes.position.array
      const k = 0.06
      for (let i = 0; i < N; i++) {
        const a = ang[i]
        const rf = rfac[i]
        const sd = sides[i]
        let tx, ty, tz
        if (transition) {
          tx = dir * (2.5 + rf * 4.5)
          ty = Math.sin(a * 2.3) * (2 + rf * 3.5)
          tz = Math.cos(a * 1.7) * (2 + rf * 3)
        } else if (stage === 0) {
          const D = lerp(5.5, 1.7, ease(sub))
          const sx = sd ? D : -D
          const rr = 0.5 + rf * 0.12
          const aa = a + t * 0.7
          tx = sx + Math.cos(aa) * rr
          ty = Math.sin(aa) * rr
          tz = (rf - 0.5) * 0.1
        } else if (stage === 1) {
          const Rr = 1.15 + rf * 0.22
          const aa = a + t * 0.95 + sd * Math.PI
          tx = Math.cos(aa) * Rr
          ty = Math.sin(aa) * Rr
          tz = (rf - 0.5) * 0.14
        } else {
          const Rr = 1.3 + rf * 3.6
          const aa = a + Rr * 0.5 + t * 0.3
          tx = Math.cos(aa) * Rr
          ty = Math.sin(aa) * Rr
          tz = (rf - 0.5) * 0.45
        }
        pos[i * 3] += (tx - pos[i * 3]) * k
        pos[i * 3 + 1] += (ty - pos[i * 3 + 1]) * k
        pos[i * 3 + 2] += (tz - pos[i * 3 + 2]) * k
      }
      geo.attributes.position.needsUpdate = true

      system.position.x += (sysXT - system.position.x) * 0.08
      system.rotation.z += 0.0012

      const ringsOn = win(p, 0.66, 0.82) * 0.5
      for (let r = 0; r < ringMats.length; r++) {
        ringMats[r].opacity += (ringsOn * (0.6 + 0.4 * Math.sin(r + t)) - ringMats[r].opacity) * 0.06
      }

      if (p < 0.3) {
        const D = lerp(5.5, 1.7, ease(sub))
        starA.position.set(-D, 0, 0)
        starB.position.set(D, 0, 0)
      } else {
        const rr = stage === 2 ? 0.4 : 0.8
        const w = stage === 2 ? 1.4 : 1.0
        starA.position.set(Math.cos(t * w) * rr, Math.sin(t * w) * rr, 0)
        starB.position.set(-Math.cos(t * w) * rr, -Math.sin(t * w) * rr, 0)
      }
      const starsOn = 1 - win(p, 0.66, 0.8)
      starA.material.opacity += (starsOn - starA.material.opacity) * 0.06
      starB.material.opacity += (starsOn - starB.material.opacity) * 0.06
      const a3 = win(p, 0.72, 0.86)
      core.material.opacity += (a3 - core.material.opacity) * 0.05
      core.scale.setScalar(lerp(core.scale.x, 0.5 + a3 * 0.9, 0.05))
      planets.forEach((sp, idx) => {
        const d = planetDefs[idx]
        sp.material.opacity += (a3 - sp.material.opacity) * 0.05
        const aa = t * d.speed + d.phase
        sp.position.set(Math.cos(aa) * d.r, Math.sin(aa) * d.r, 0)
      })

      camera.position.x += (mx * 0.5 - camera.position.x) * 0.04
      camera.position.y += (my * 0.4 - camera.position.y) * 0.04
      camera.lookAt(0, 0, 0)
      composer.render()

      // 文案：相遇(左) / 相爱(右) / 相生(左)
      const caps = capRefs.current
      if (caps[0]) caps[0].style.opacity = (clamp01(1 - win(p, 0.26, 0.36)) * (p < 0.3 ? 1 : 1)).toFixed(2)
      if (caps[1]) caps[1].style.opacity = (win(p, 0.4, 0.46) * (1 - win(p, 0.62, 0.7))).toFixed(2)
      if (caps[2]) caps[2].style.opacity = win(p, 0.78, 0.86).toFixed(2)
    }
    raf = requestAnimationFrame(tick)

    let st
    let refreshTimer
    if (!reduce) {
      st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=6000',
        pin: pinRef.current,
        anticipatePin: 1,
        scrub: 0.6,
        onUpdate: (self) => (progress.current = self.progress),
      })
      // three.js 画布较重，延迟刷新一次，确保钉住距离算对
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300)
    }

    const onResize = () => {
      W = mount.clientWidth
      H = mount.clientHeight
      renderer.setSize(W, H)
      composer.setSize(W, H)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(refreshTimer)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      st && st.kill()
      geo.dispose()
      mat.dispose()
      sprite.dispose()
      composer.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  const caps = [
    { side: 'left', step: '壹', zh: '我与 AI 的相遇' },
    { side: 'right', step: '贰', zh: '我和 AI 的相爱' },
    { side: 'left', step: '叁', zh: '我和 AI 的相生' },
  ]

  return (
    <section id="journey" ref={sectionRef} className="jr-scene">
      <div ref={pinRef} className="jr-pin">
        <div className="jr-stars" aria-hidden="true">
          {JR_STARS.map((s, i) => (
            <span
              key={i}
              className="jr-star"
              style={{ top: s.t, left: s.l, width: `${s.s}px`, height: `${s.s}px`, animationDelay: `${s.d}s` }}
            />
          ))}
        </div>
        <div ref={mountRef} className="jr-canvas" />
        {caps.map((c, i) => (
          <div
            key={i}
            ref={(el) => (capRefs.current[i] = el)}
            className={`jr-cap jr-cap-${c.side}`}
          >
            <span className="jr-step">{c.step}</span>
            <h3>{c.zh}</h3>
            <p>（文案待补）</p>
          </div>
        ))}
      </div>
    </section>
  )
}
