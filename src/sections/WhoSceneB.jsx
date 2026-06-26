import { useEffect, useRef } from 'react'
import SoftAurora from '../components/SoftAurora.jsx'
import './WhoSceneB.css'

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

export default function WhoSceneB() {
  const islandRef = useRef(null)
  const starsRef = useRef(null)
  const glowRef = useRef(null)
  const backRef = useRef(null)
  const treeDotRefs = useRef([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let W = window.innerWidth
    let H = window.innerHeight
    const target = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e) => {
      target.x = (e.clientX / W) * 2 - 1
      target.y = (e.clientY / H) * 2 - 1
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
      cur.x += (target.x - cur.x) * 0.05
      cur.y += (target.y - cur.y) * 0.05
      const floatY = Math.sin(t * 0.7) * 16

      if (islandRef.current) {
        islandRef.current.style.transform = `translate(${cur.x * 22}px, ${cur.y * 14 + floatY}px) rotateY(${cur.x * 6}deg) rotateZ(${cur.x * -1.5}deg)`
      }
      TREE_DOTS.forEach((d, i) => {
        const el = treeDotRefs.current[i]
        if (!el) return
        const ang = t * d.sp + d.ph
        el.style.transform = `translate(${Math.cos(ang) * d.rx}px, ${Math.sin(ang) * d.ry}px)`
        el.style.opacity = (0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + d.ph))).toFixed(2)
      })
      if (backRef.current) {
        backRef.current.style.transform = `scale(1.06) translate(${cur.x * -5}px, ${cur.y * -4}px)`
      }
      if (starsRef.current) {
        starsRef.current.style.transform = `translate(${cur.x * -9}px, ${cur.y * -6}px)`
      }
      if (glowRef.current) {
        const b = 0.5 + 0.5 * Math.sin(t * 0.6)
        glowRef.current.style.opacity = (0.28 + 0.32 * b).toFixed(3)
        glowRef.current.style.transform = `translate(-50%, -50%) translateY(${floatY * 0.7}px) scale(${(0.9 + 0.18 * b).toFixed(3)})`
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="wb-scene">
      <div ref={backRef} className="wb-back" style={{ backgroundImage: 'url(/back.png)' }} aria-hidden="true" />
      <div className="wb-aurora" aria-hidden="true">
        <SoftAurora speed={0.4} scale={1.6} brightness={0.85} color1="#9a6ed0" color2="#f4c08a" bandHeight={0.32} bandSpread={1.1} layerOffset={1.5} enableMouseInteraction={false} />
      </div>
      <div ref={starsRef} className="wb-stars" aria-hidden="true">
        {STARS.map((s, i) => (
          <span key={i} className="wb-star" style={{ top: s.t, left: s.l, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
        ))}
      </div>
      <div className="wb-stage">
        <div ref={glowRef} className="wb-glow" aria-hidden="true" />
        <div ref={islandRef} className="wb-island-wrap">
          <img className="wb-island" src="/island.png" alt="悬浮的小岛" />
          <div className="wb-house-glow" aria-hidden="true" />
          {TREE_DOTS.map((d, i) => (
            <span key={i} ref={(el) => (treeDotRefs.current[i] = el)} className="wb-treedot" aria-hidden="true" />
          ))}
        </div>
      </div>
      <p className="wb-hint">Plan B · 悬浮小岛（透明 island.png）</p>
    </div>
  )
}
