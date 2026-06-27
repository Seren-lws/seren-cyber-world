import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import BlurText from '../components/BlurText.jsx'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.max(0, Math.min(1, t))

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
  const heroRef = useRef(null)
  const stageRef = useRef(null)
  const bloomRef = useRef(null)
  const uiRef = useRef(null)
  const backRef = useRef(null)
  const midRef = useRef(null)
  const frontRef = useRef(null)
  const glowRef = useRef(null)
  const moonRef = useRef(null)
  const ffRefs = useRef([])
  const guideRef = useRef(null)
  const prog = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
    if (!reduce) window.addEventListener('mousemove', onMove)
    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // —— 推门进入：滚动钉住首页，镜头朝门推进 + 门口炸光 ——
    let st
    if (!reduce) {
      st = ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: '+=1100',
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => {
          prog.current = self.progress
        },
      })
    }

    let raf
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const t = now * 0.001
      cur.x += (target.x - cur.x) * 0.06
      cur.y += (target.y - cur.y) * 0.06
      const p = reduce ? 0 : prog.current

      if (backRef.current) backRef.current.style.transform = `scale(1.06) translate(${cur.x * -8}px, ${cur.y * -6}px)`
      if (midRef.current) midRef.current.style.transform = `perspective(1300px) scale(1.08) translate(${cur.x * -16}px, ${cur.y * -11}px) rotateY(${cur.x * 1.5}deg)`
      if (frontRef.current) frontRef.current.style.transform = `scale(1.12) translate(${cur.x * -34}px, ${cur.y * -22}px)`

      const dx = W * DOOR.x
      const dy = H * DOOR.y
      const dist = Math.hypot(target.px - dx, target.py - dy)
      const near = Math.max(0, 1 - dist / 230)
      if (glowRef.current) {
        const base = 0.62 + 0.12 * Math.sin(t * 1.5)
        glowRef.current.style.opacity = (base + near * 0.45 + p * 0.6).toFixed(3)
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

      // —— 转场四步：①光点飞入门 → ②镜头朝门推进 → ③前景UI淡出 → ④门口炸光吞屏 ——
      // ① 「你」这颗光点从标题旁飞进门里，在门口被吸收 —— 进门后才触发后面的推进+炸光
      if (guideRef.current) {
        const gp = clamp01(p / 0.3)
        const ge = 1 - Math.pow(1 - gp, 2) // easeOut
        const sx = W * 0.64
        const sy = H * 0.46
        const gx = lerp(sx, dx, ge)
        const gy = lerp(sy, dy, ge) - Math.sin(ge * Math.PI) * 38 // 飞行途中微微拱起
        const idle = Math.sin(t * 1.6) * 6 * (1 - gp) // 待命时轻轻浮动
        const ga = p < 0.24 ? 1 : 1 - clamp01((p - 0.24) / 0.07) // 进门一刻淡灭（被吸收）
        guideRef.current.style.transform = `translate(${gx}px, ${gy + idle}px)`
        guideRef.current.style.opacity = ga.toFixed(3)
      }
      // ② 镜头朝门推进（光点进门后才开始）
      if (stageRef.current) {
        const zp = clamp01((p - 0.3) / 0.7)
        const ez = 1 - Math.pow(1 - zp, 2)
        stageRef.current.style.transform = `scale(${(1 + 1.5 * ez).toFixed(4)})`
      }
      // ③ 前景 UI 淡出
      if (uiRef.current) {
        uiRef.current.style.opacity = (1 - clamp01((p - 0.2) / 0.3)).toFixed(3)
      }
      // ④ 门口炸光吞屏
      if (bloomRef.current) {
        const bp = clamp01((p - 0.34) / 0.66)
        const be = bp * bp // easeIn，越炸越快
        bloomRef.current.style.transform = `translate(-50%, -50%) scale(${(be * 110).toFixed(2)})`
        bloomRef.current.style.opacity = clamp01(bp * 1.5).toFixed(3)
      }
    }
    raf = requestAnimationFrame(tick)

    const refreshId = setTimeout(() => ScrollTrigger.refresh(), 300)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(refreshId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      if (st) st.kill()
    }
  }, [])

  return (
    <header className="hero" ref={heroRef}>
      <div className="hp-stage" ref={stageRef}>
        <div ref={backRef} className="hp-layer hp-back" style={{ backgroundImage: 'url(/hero-back.png)' }} />
        <div ref={moonRef} className="hp-moonglow" aria-hidden="true" />
        <div ref={midRef} className="hp-layer hp-mid" style={{ backgroundImage: 'url(/hero-mid.png)' }} />
        <div ref={glowRef} className="hp-doorglow" aria-hidden="true" />
        <div ref={frontRef} className="hp-layer hp-front" style={{ backgroundImage: 'url(/hero-front.png)' }} />
        {FIREFLIES.map((f, i) => (
          <span key={i} ref={(el) => (ffRefs.current[i] = el)} className="hp-firefly" aria-hidden="true" />
        ))}
      </div>

      {/* 「你」这颗光点 —— 飞进门里，触发推门进入 */}
      <span ref={guideRef} className="hp-guide" aria-hidden="true" />

      {/* 门口炸开的暖金光 —— 推门进入的那一下 */}
      <div ref={bloomRef} className="hp-bloom" aria-hidden="true" />

      <div className="hp-ui" ref={uiRef}>
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
      </div>
    </header>
  )
}
