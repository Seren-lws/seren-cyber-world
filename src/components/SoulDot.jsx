import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './SoulDot.css'

gsap.registerPlugin(ScrollTrigger)

const TRAIL = 16

// 代表「你」的小白点：在「我是谁」右侧浮游、带拖尾，
// 往下滚时飘向中央、淡出，刚好接上「我和 AI」里那颗白色粒子。
export default function SoulDot() {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const trailRefs = useRef([])

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let fadeIn
    let travel

    const build = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      gsap.set(outer, { opacity: 0, x: 0, y: 0 })

      fadeIn = ScrollTrigger.create({
        trigger: '#who',
        start: 'top 75%',
        end: 'top 25%',
        scrub: true,
        onUpdate: (self) => {
          outer.style.opacity = Math.min(1, self.progress * 1.4).toFixed(3)
        },
      })

      travel = gsap.timeline({
        scrollTrigger: { trigger: '#journey', start: 'top bottom', end: 'top 35%', scrub: true },
      })
      travel.to(outer, { x: W * 0.5 - W * 0.72, y: -H * 0.06, opacity: 0, ease: 'none' })
    }

    build()

    // —— 拖尾：每帧跟随小白点真实屏幕位置 ——
    const pts = Array.from({ length: TRAIL }, () => ({ x: -50, y: -50 }))
    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = inner.getBoundingClientRect()
      let tx = r.left + r.width / 2
      let ty = r.top + r.height / 2
      const lead = parseFloat(getComputedStyle(outer).opacity) || 0
      for (let i = 0; i < TRAIL; i++) {
        const p = pts[i]
        p.x += (tx - p.x) * 0.22
        p.y += (ty - p.y) * 0.22
        const node = trailRefs.current[i]
        if (node) {
          node.style.transform = `translate(${p.x}px, ${p.y}px)`
          node.style.opacity = (lead * (1 - (i + 1) / (TRAIL + 1)) * 0.6).toFixed(3)
        }
        tx = p.x
        ty = p.y
      }
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      fadeIn && fadeIn.kill()
      if (travel) {
        travel.scrollTrigger && travel.scrollTrigger.kill()
        travel.kill()
      }
      gsap.set(outer, { clearProps: 'transform,opacity' })
      build()
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      fadeIn && fadeIn.kill()
      if (travel) {
        travel.scrollTrigger && travel.scrollTrigger.kill()
        travel.kill()
      }
    }
  }, [])

  return (
    <>
      {Array.from({ length: TRAIL }, (_, i) => (
        <div
          key={i}
          className="soul-trail-node"
          aria-hidden="true"
          ref={(el) => (trailRefs.current[i] = el)}
          style={{ width: `${Math.max(2.5, 9 - i * 0.5)}px`, height: `${Math.max(2.5, 9 - i * 0.5)}px` }}
        />
      ))}
      <div className="soul-dot" ref={outerRef} aria-hidden="true">
        <div className="soul-dot-inner" ref={innerRef} />
      </div>
    </>
  )
}
