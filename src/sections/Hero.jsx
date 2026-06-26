import { useEffect, useRef } from 'react'
import BlurText from '../components/BlurText.jsx'
import './Hero.css'

const lerp = (a, b, t) => a + (b - a) * t

// 门洞发光中心 / 月亮位置（图里的大致比例）
const DOOR = { x: 0.3, y: 0.42 }
const MOON = { x: 0.85, y: 0.19 }

const FIREFLIES = [
  { x: 0.2, y: 0.55, door: false, fx: 1.0, fy: 0.7, ph: 0 },
  { x: 0.16, y: 0.66, door: true, fx: 0.8, fy: 1.0, ph: 1.4 },
  { x: 0.27, y: 0.5, door: true, fx: 1.2, fy: 0.6, ph: 2.6 },
  { x: 0.31, y: 0.72, door: false, fx: 0.7, fy: 0.9, ph: 0.7 },
  { x: 0.1, y: 0.78, door: false, fx: 1.1, fy: 0.8, ph: 3.2 },
  { x: 0.24, y: 0.6, door: true, fx: 0.9, fy: 1.1, ph: 4.0 },
]

export default function Hero() {
  const backRef = useRef(null)
  const midRef = useRef(null)
  const frontRef = useRef(null)
  const glowRef = useRef(null)
  const moonRef = useRef(null)
  const ffRefs = useRef([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let W = window.innerWidth
    let H = window.innerHeight
    const target = { x: 0, y: 0, px: W / 2, py: H / 2 }
    const cur = { x: 0, y: 0 }

    const onMove = (e) => {
      target.x = (e.clientX / W) * 2 - 1
      target.y = (e.clientY / H) * 2 - 1
      target.px = e.clientX
      target.py = e.clientY
    }
    window.addEventListener('mousemove', onMove)
    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    let raf
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const t = now * 0.001
      cur.x += (target.x - cur.x) * 0.06
      cur.y += (target.y - cur.y) * 0.06

      if (backRef.current) backRef.current.style.transform = `scale(1.06) translate(${cur.x * -8}px, ${cur.y * -6}px)`
      if (midRef.current) midRef.current.style.transform = `perspective(1300px) scale(1.08) translate(${cur.x * -16}px, ${cur.y * -11}px) rotateY(${cur.x * 1.5}deg)`
      if (frontRef.current) frontRef.current.style.transform = `scale(1.12) translate(${cur.x * -34}px, ${cur.y * -22}px)`

      const dx = W * DOOR.x
      const dy = H * DOOR.y
      const dist = Math.hypot(target.px - dx, target.py - dy)
      const near = Math.max(0, 1 - dist / 230)
      if (glowRef.current) {
        const base = 0.62 + 0.12 * Math.sin(t * 1.5)
        glowRef.current.style.opacity = (base + near * 0.45).toFixed(3)
        glowRef.current.style.transform = `translate(${cur.x * -16}px, ${cur.y * -11}px)`
      }

      // 月亮柔光：缓缓呼吸
      if (moonRef.current) {
        const breath = 0.5 + 0.5 * Math.sin(t * 0.8)
        moonRef.current.style.opacity = (0.28 + 0.32 * breath).toFixed(3)
        moonRef.current.style.transform = `translate(${cur.x * -8}px, ${cur.y * -6}px) scale(${(0.9 + 0.18 * breath).toFixed(3)})`
      }

      FIREFLIES.forEach((f, i) => {
        const el = ffRefs.current[i]
        if (!el) return
        let x = W * f.x + Math.sin(t * f.fx + f.ph) * 16 + cur.x * -28
        let y = H * f.y + Math.cos(t * f.fy + f.ph) * 14 + cur.y * -18
        if (f.door && near > 0.04) {
          x = lerp(x, dx, near * 0.55)
          y = lerp(y, dy, near * 0.55)
        }
        el.style.transform = `translate(${x}px, ${y}px)`
        el.style.opacity = (0.45 + 0.55 * Math.abs(Math.sin(t * 1.6 + f.ph))).toFixed(2)
      })
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <header className="hero">
      <div ref={backRef} className="hp-layer hp-back" style={{ backgroundImage: 'url(/hero-back.png)' }} />
      <div ref={moonRef} className="hp-moonglow" aria-hidden="true" />
      <div ref={midRef} className="hp-layer hp-mid" style={{ backgroundImage: 'url(/hero-mid.png)' }} />
      <div ref={glowRef} className="hp-doorglow" aria-hidden="true" />
      <div ref={frontRef} className="hp-layer hp-front" style={{ backgroundImage: 'url(/hero-front.png)' }} />
      {FIREFLIES.map((f, i) => (
        <span key={i} ref={(el) => (ffRefs.current[i] = el)} className="hp-firefly" aria-hidden="true" />
      ))}

      <nav className="hero-nav">
        <span className="hero-brand">Seren · 林晚声</span>
        <div className="hero-links">
          <a href="#who">我是谁</a>
          <a href="#journey">我和 AI</a>
          <a href="#works">作品集</a>
        </div>
      </nav>

      <div className="hero-center">
        <h1 className="hero-title">
          <BlurText text="Seren’s Cyber World" by="word" stagger={0.32} duration={1.7} />
        </h1>
        <p className="hero-subtitle">
          <BlurText text="林晚声的赛博世界" by="char" delay={1.3} stagger={0.12} duration={1.4} />
        </p>
      </div>

      <a href="#who" className="hero-scroll" aria-label="向下">
        <span className="hero-scroll-arrow">⌄</span>
        <span className="hero-scroll-text">往下，翻开这本书</span>
      </a>
    </header>
  )
}
