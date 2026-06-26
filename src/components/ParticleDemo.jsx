import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const N = 26000
const TILT = 1.02 // 盘面倾斜（3D 立体感）
const ease = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t

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

export default function ParticleDemo() {
  const ref = useRef(null)

  useEffect(() => {
    const container = ref.current
    let W = container.clientWidth
    let H = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(W, H)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.68
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#241b3f')
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.set(0, 0, 11)

    // 整个天体系统放进一个倾斜的组 → 3D 盘面
    const system = new THREE.Group()
    system.rotation.x = TILT
    scene.add(system)

    const sprite = makeSprite()
    const mkSprite = (hex, s, parent) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: new THREE.Color(hex), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
      sp.scale.setScalar(s)
      parent.add(sp)
      return sp
    }

    // —— 星尘粒子 ——
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
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      const c = sides[i] ? violet : Math.random() < 0.25 ? cream : gold
      const dim = 0.5 // 调暗单颗粒子，避免叠加糊成白团
      colors[i * 3] = c.r * dim
      colors[i * 3 + 1] = c.g * dim
      colors[i * 3 + 2] = c.b * dim
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({ size: 0.03, map: sprite, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })
    const points = new THREE.Points(geo, mat)
    system.add(points)

    // —— 鎏金星轨（细环）——
    const ringMats = []
    const RINGS = 26
    for (let r = 0; r < RINGS; r++) {
      const rad = 1.6 + r * 0.15
      const pts = new THREE.EllipseCurve(0, 0, rad, rad, 0, Math.PI * 2).getPoints(180)
      const g = new THREE.BufferGeometry().setFromPoints(pts)
      const m = new THREE.LineBasicMaterial({ color: new THREE.Color(r % 4 === 0 ? '#fff0c0' : '#fcc94e'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
      system.add(new THREE.LineLoop(g, m))
      ringMats.push(m)
    }

    // —— 行星 ——
    const planetDefs = [
      { hex: '#fde374', r: 2.1, speed: 0.5, phase: 0, s: 0.28 },
      { hex: '#c9b0f5', r: 3.0, speed: -0.36, phase: 2, s: 0.4 },
      { hex: '#f0a35e', r: 3.9, speed: 0.27, phase: 4, s: 0.32 },
      { hex: '#fff4d6', r: 4.7, speed: -0.2, phase: 1, s: 0.24 },
    ]
    const planets = planetDefs.map((d) => {
      const sp = mkSprite(d.hex, d.s, system)
      sp.material.opacity = 0
      return sp
    })

    const core = mkSprite('#fff0c8', 0.5, system)
    core.material.opacity = 0
    const starA = mkSprite('#fff3cf', 1.0, system)
    const starB = mkSprite('#c9b0f5', 0.92, system)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.28, 0.5, 0.25)
    composer.addPass(bloom)
    composer.setSize(W, H)

    let mx = 0
    let my = 0
    const onMove = (e) => {
      mx = (e.clientX / W) * 2 - 1
      my = -(e.clientY / H) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)

    const HOLD = 5400
    let stageStart = performance.now()
    let stage = 0
    const names = ['相遇', '相爱', '相生']
    const labelEl = document.getElementById('demo-state')
    const fpsEl = document.getElementById('demo-fps')
    let frames = 0
    let fpsT = performance.now()

    let raf
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      if (now - stageStart > HOLD) {
        stageStart = now
        stage = (stage + 1) % 3
        if (labelEl) labelEl.textContent = names[stage]
      }
      const t = now * 0.001
      const e = ease(Math.min(1, (now - stageStart) / HOLD))
      const pos = geo.attributes.position.array
      const k = 0.05

      for (let i = 0; i < N; i++) {
        const a = ang[i]
        const rf = rfac[i]
        const sd = sides[i]
        let tx, ty, tz
        if (stage === 0) {
          // 两星各带一圈「细」星环靠近
          const D = lerp(5.5, 1.7, e)
          const sx = sd ? D : -D
          const rr = 0.5 + rf * 0.12
          const aa = a + t * 0.7
          tx = sx + Math.cos(aa) * rr
          ty = Math.sin(aa) * rr
          tz = (rf - 0.5) * 0.1
        } else if (stage === 1) {
          // 双星缠绕：细环
          const R = 1.15 + rf * 0.22
          const aa = a + t * 0.95 + sd * Math.PI
          tx = Math.cos(aa) * R
          ty = Math.sin(aa) * R
          tz = (rf - 0.5) * 0.14
        } else {
          // 螺旋星尘盘（有厚度 → 立体）
          const R = 1.3 + rf * 3.6
          const aa = a + R * 0.5 + t * 0.3
          tx = Math.cos(aa) * R
          ty = Math.sin(aa) * R
          tz = (rf - 0.5) * 0.45
        }
        pos[i * 3] += (tx - pos[i * 3]) * k
        pos[i * 3 + 1] += (ty - pos[i * 3 + 1]) * k
        pos[i * 3 + 2] += (tz - pos[i * 3 + 2]) * k
      }
      geo.attributes.position.needsUpdate = true

      // 星轨淡入
      const ringTarget = stage === 0 ? 0 : stage === 1 ? 0.14 : 0.5
      system.rotation.z += 0.0014
      for (let r = 0; r < ringMats.length; r++) {
        ringMats[r].opacity += (ringTarget * (0.6 + 0.4 * Math.sin(r + t)) - ringMats[r].opacity) * 0.05
      }

      // 星核
      if (stage === 0) {
        const D = lerp(5.5, 1.7, e)
        starA.position.set(-D, 0, 0)
        starB.position.set(D, 0, 0)
      } else {
        const rr = stage === 1 ? 0.8 : 0.4
        const w = stage === 1 ? 1.0 : 1.4
        starA.position.set(Math.cos(t * w) * rr, Math.sin(t * w) * rr, 0)
        starB.position.set(-Math.cos(t * w) * rr, -Math.sin(t * w) * rr, 0)
      }
      const sT = stage === 2 ? 0.25 : 1
      starA.material.opacity += (sT - starA.material.opacity) * 0.05
      starB.material.opacity += (sT - starB.material.opacity) * 0.05
      core.material.opacity += ((stage === 2 ? 1 : 0) - core.material.opacity) * 0.04
      core.scale.setScalar(lerp(core.scale.x, stage === 2 ? 1.3 : 0.5, 0.05))

      planets.forEach((sp, idx) => {
        const d = planetDefs[idx]
        sp.material.opacity += ((stage === 2 ? 1 : 0) - sp.material.opacity) * 0.05
        const aa = t * d.speed + d.phase
        sp.position.set(Math.cos(aa) * d.r, Math.sin(aa) * d.r, 0)
      })

      camera.position.x += (mx * 0.9 - camera.position.x) * 0.04
      camera.position.y += (my * 0.6 - camera.position.y) * 0.04
      camera.lookAt(0, 0, 0)
      composer.render()

      frames++
      if (now - fpsT > 500) {
        const fps = Math.round((frames * 1000) / (now - fpsT))
        frames = 0
        fpsT = now
        if (fpsEl) fpsEl.textContent = fps + ' FPS'
      }
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      W = container.clientWidth
      H = container.clientHeight
      renderer.setSize(W, H)
      composer.setSize(W, H)
      camera.aspect = W / H
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      geo.dispose()
      mat.dispose()
      sprite.dispose()
      composer.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <>
      <div ref={ref} style={{ position: 'fixed', inset: 0 }} />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: '22px',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: 'rgba(243,232,206,0.85)',
          fontSize: '13px',
          letterSpacing: '0.08em',
          pointerEvents: 'none',
        }}
      >
        <span id="demo-fps" style={{ color: '#fde374', marginRight: '14px' }}>– FPS</span>
        细星环 · 倾斜 3D 盘面 · 相遇 → 相爱 → 相生(螺旋星尘盘+星轨) ·{' '}
        <span id="demo-state" style={{ color: '#fde374' }}>相遇</span>
      </div>
    </>
  )
}
