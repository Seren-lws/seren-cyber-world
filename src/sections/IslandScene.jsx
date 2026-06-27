import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SoftAurora from '../components/SoftAurora.jsx'
import './IslandScene.css'

gsap.registerPlugin(ScrollTrigger)

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
  const bookRef = useRef(null)
  const bloomRef = useRef(null)
  const treeDotRefs = useRef([])
  const entry = useRef(0)
  const zoom = useRef(0)
  const origin = useRef({ x: 0, y: 0 })

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

    // 计算「书」在钉住时的屏幕位置 —— 作为镜头推进的焦点 & 金光漫开的起点
    const computeOrigin = () => {
      if (!pinRef.current || !bookRef.current) return
      const pr = pinRef.current.getBoundingClientRect()
      const br = bookRef.current.getBoundingClientRect()
      const x = br.left + br.width / 2 - pr.left
      const y = br.top + br.height / 2 - pr.top
      origin.current = { x, y }
      if (worldRef.current) worldRef.current.style.transformOrigin = `${x}px ${y}px`
      if (bloomRef.current) {
        bloomRef.current.style.left = `${x}px`
        bloomRef.current.style.top = `${y}px`
      }
    }

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      computeOrigin()
    }
    window.addEventListener('resize', onResize)
    const originId = setTimeout(computeOrigin, 350)

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

      // 进场：金光漫屏（承接首页门口炸光 → 快速铺满 → 退去露出小岛）
      if (floodRef.current) {
        const fo = ep < 0.12 ? ep / 0.12 : ep < 0.62 ? 1 : 1 - (ep - 0.62) / 0.38
        floodRef.current.style.opacity = clamp01(fo).toFixed(3)
      }

      // 离场：镜头推进到书 → 金光从书漫开吞屏（接进翻书页）
      if (worldRef.current) {
        const pushE = clamp01((zp - 0.12) / 0.56)
        const ease = pushE * pushE
        worldRef.current.style.transform = `scale(${(1 + 7.5 * ease).toFixed(3)})`
      }
      if (bookRef.current) {
        // 静止时保留 CSS 呼吸脉冲；推进时接管，书越来越亮
        if (zp < 0.06) {
          bookRef.current.style.filter = ''
        } else {
          const glowUp = clamp01((zp - 0.1) / 0.45)
          bookRef.current.style.filter = `drop-shadow(0 0 ${(6 + 22 * glowUp).toFixed(1)}px rgba(253, 227, 116, ${(0.7 + 0.3 * glowUp).toFixed(2)}))`
        }
      }
      if (bloomRef.current) {
        const bp = clamp01((zp - 0.55) / 0.4)
        const be = bp * bp
        bloomRef.current.style.transform = `translate(-50%, -50%) scale(${(be * 150).toFixed(2)})`
        bloomRef.current.style.opacity = clamp01(bp * 1.5).toFixed(3)
      }
    }
    raf = requestAnimationFrame(tick)

    const sts = []
    if (!reduce) {
      // 进场金光（小岛滚入时）
      sts.push(
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'top top',
          scrub: 0.6,
          onUpdate: (self) => (entry.current = self.progress),
        }),
      )
      // 镜头推进 + 金光漫开（钉住后随滚动）
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
      clearTimeout(originId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      sts.forEach((s) => s.kill())
    }
  }, [])

  return (
    <section ref={sectionRef} id="island" className="is-scene">
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
              {/* 岛上会发光的书 —— 镜头推进的焦点（滚动到这里，钻进书里） */}
              <div ref={bookRef} className="is-book" aria-hidden="true">
                <span className="is-book-page is-book-l" />
                <span className="is-book-page is-book-r" />
              </div>
            </div>
          </div>
        </div>

        <div ref={floodRef} className="is-flood" aria-hidden="true" />
        {/* 镜头推进到书后，从书那里漫开吞屏的金光（接进翻书页） */}
        <div ref={bloomRef} className="is-bookbloom" aria-hidden="true" />
      </div>
    </section>
  )
}
