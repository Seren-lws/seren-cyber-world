import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SoftAurora from '../components/SoftAurora.jsx'
import './IslandScene.css'

gsap.registerPlugin(ScrollTrigger)

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.max(0, Math.min(1, t))

const STARS = Array.from({ length: 36 }, (_, i) => ({
  t: `${(i * 37) % 96 + 2}%`,
  l: `${(i * 53) % 96 + 2}%`,
  s: (i % 3) + 2,
  d: (i % 5) * 0.6,
}))

const TREE_DOTS = [
  { rx: 150, ry: 80, sp: 0.4, ph: 0 },
  { rx: 120, ry: 64, sp: -0.32, ph: 1.5 },
  { rx: 178, ry: 92, sp: 0.26, ph: 3.0 },
  { rx: 100, ry: 54, sp: 0.5, ph: 4.2 },
  { rx: 162, ry: 72, sp: -0.22, ph: 2.2 },
  { rx: 134, ry: 88, sp: 0.36, ph: 5.0 },
]

export default function IslandScene() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const worldRef = useRef(null)
  const islandRef = useRef(null)
  const starsRef = useRef(null)
  const backRef = useRef(null)
  const glowRef = useRef(null)
  const floodRef = useRef(null)
  const guideRef = useRef(null)
  const treeDotRefs = useRef([])
  const entry = useRef(0)
  const zoom = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = window.innerWidth
    let H = window.innerHeight
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e) => {
      target.x = (e.clientX / W) * 2 - 1
      target.y = (e.clientY / H) * 2 - 1
    }
    if (!reduce) window.addEventListener('mousemove', onMove)
    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    let raf
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const t = now * 0.001
      cur.x += (target.x - cur.x) * 0.05
      cur.y += (target.y - cur.y) * 0.05
      const floatY = Math.sin(t * 0.7) * 16
      const ep = reduce ? 1 : entry.current
      const zp = reduce ? 0 : zoom.current

      if (backRef.current) backRef.current.style.transform = `scale(1.06) translate(${cur.x * -5}px, ${cur.y * -4}px)`
      if (starsRef.current) starsRef.current.style.transform = `translate(${cur.x * -9}px, ${cur.y * -6}px)`
      if (islandRef.current) islandRef.current.style.transform = `translate(${cur.x * 22}px, ${cur.y * 14 + floatY}px) rotateY(${cur.x * 6}deg) rotateZ(${cur.x * -1.5}deg)`
      if (glowRef.current) {
        const b = 0.5 + 0.5 * Math.sin(t * 0.6)
        glowRef.current.style.opacity = (0.28 + 0.32 * b).toFixed(3)
        glowRef.current.style.transform = `translate(-50%, -50%) translateY(${floatY * 0.7}px) scale(${(0.9 + 0.18 * b).toFixed(3)})`
      }
      TREE_DOTS.forEach((d, i) => {
        const el = treeDotRefs.current[i]
        if (!el) return
        const ang = t * d.sp + d.ph
        el.style.transform = `translate(${Math.cos(ang) * d.rx}px, ${Math.sin(ang) * d.ry}px)`
        el.style.opacity = (0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + d.ph))).toFixed(2)
      })

      // —— 进场：金光漫屏蒙太奇（从门那侧涌起 → 退去露出小岛） ——
      if (floodRef.current) {
        const fo = ep < 0.25 ? ep / 0.25 : ep < 0.6 ? 1 : 1 - (ep - 0.6) / 0.4
        floodRef.current.style.opacity = clamp01(fo).toFixed(3)
      }
      // —— 光点：金光退去后从门那侧飞到岛旁（镜头开始推进时淡出） ——
      if (guideRef.current) {
        const gp = clamp01((ep - 0.6) / 0.3)
        const gx = lerp(W * 0.3, W * 0.68, gp)
        const gy = lerp(H * 0.46, H * 0.48, gp) + Math.sin(t * 1.2) * 8
        const go = clamp01((ep - 0.65) / 0.2) * (1 - clamp01(zp / 0.4))
        guideRef.current.style.transform = `translate(${gx}px, ${gy}px)`
        guideRef.current.style.opacity = go.toFixed(2)
      }

      // —— 离场：以书为中心把整座岛推近放大 → 渐隐（露出底下的翻书页） ——
      if (worldRef.current) {
        const zt = clamp01((zp - 0.42) / 0.46)
        const ease = zt * zt
        const scale = 1 + 4.2 * ease
        const tx = -0.04 * W * ease
        const ty = -0.02 * H * ease
        worldRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${scale.toFixed(3)})`
      }
      if (pinRef.current) {
        const fade = 1 - clamp01((zp - 0.84) / 0.16)
        pinRef.current.style.opacity = fade.toFixed(3)
      }
    }
    raf = requestAnimationFrame(tick)

    const sts = []
    if (!reduce) {
      // 进场蒙太奇：小岛从下方滚入时播放
      sts.push(
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'top top',
          scrub: 0.6,
          onUpdate: (self) => (entry.current = self.progress),
        }),
      )
      // 悬停 + 镜头推进：小岛贴顶后，随滚动推进放大并渐隐
      sts.push(
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (self) => (zoom.current = self.progress),
        }),
      )
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      sts.forEach((s) => s.kill())
    }
  }, [])

  return (
    <section id="island" ref={sectionRef} className="is-scene">
      <div ref={pinRef} className="is-pin">
        <div ref={worldRef} className="is-world">
          <div ref={backRef} className="is-back" style={{ backgroundImage: 'url(/back.png)' }} aria-hidden="true" />
          <div className="is-aurora" aria-hidden="true">
            <SoftAurora speed={0.4} scale={1.6} brightness={0.85} color1="#9a6ed0" color2="#f4c08a" bandHeight={0.32} bandSpread={1.1} layerOffset={1.5} enableMouseInteraction={false} />
          </div>
          <div ref={starsRef} className="is-stars" aria-hidden="true">
            {STARS.map((s, i) => (
              <span key={i} className="is-star" style={{ top: s.t, left: s.l, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
            ))}
          </div>

          <div className="is-stage">
            <div ref={glowRef} className="is-glow" aria-hidden="true" />
            <div ref={islandRef} className="is-island-wrap">
              <img className="is-island" src="/island.png" alt="悬浮的小岛 · 我的小世界" />
              <div className="is-house-glow" aria-hidden="true" />
              {TREE_DOTS.map((d, i) => (
                <span key={i} ref={(el) => (treeDotRefs.current[i] = el)} className="is-treedot" aria-hidden="true" />
              ))}
              <div className="is-book" aria-hidden="true">
                <span className="is-book-page is-book-l" />
                <span className="is-book-page is-book-r" />
              </div>
            </div>
          </div>
        </div>

        <span ref={guideRef} className="is-guide" aria-hidden="true" />
        <div ref={floodRef} className="is-flood" aria-hidden="true" />
      </div>
    </section>
  )
}
