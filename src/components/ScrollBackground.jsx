import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ScrollBackground.css'

gsap.registerPlugin(ScrollTrigger)

// 贯穿全站的背景：随滚动在各「场景」颜色间缓缓晕染。
// 底层 dusk 常亮，其余层按所属区块进出视口淡入淡出，形成连贯过渡。
const SCENES = [
  {
    id: 'purple',
    sel: '#who',
    grad: 'linear-gradient(180deg, #d98a6e 0%, #c97b9e 24%, #7a5a8e 52%, #3a2856 80%, #221836 100%)',
  },
  { id: 'night', sel: '#journey', grad: 'linear-gradient(180deg, #1e1540 0%, #120d28 100%)' },
  { id: 'violet', sel: '#works', grad: 'linear-gradient(180deg, #2b2150 0%, #181433 100%)' },
  { id: 'deep', sel: '#contact', grad: 'linear-gradient(180deg, #14101e 0%, #0b0916 100%)' },
]

export default function ScrollBackground() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const triggers = []
    SCENES.forEach(({ id, sel }) => {
      const section = document.querySelector(sel)
      const layer = root.querySelector(`[data-layer="${id}"]`)
      if (!section || !layer) return

      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress
          let o
          if (p < 0.3) o = p / 0.3
          else if (p > 0.7) o = (1 - p) / 0.3
          else o = 1
          layer.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3)
        },
      })
      triggers.push(st)
    })

    return () => triggers.forEach((t) => t.kill())
  }, [])

  return (
    <div className="scroll-bg" ref={rootRef} aria-hidden="true">
      <div className="sbg-layer sbg-base" />
      {SCENES.map((s) => (
        <div key={s.id} className="sbg-layer" data-layer={s.id} style={{ background: s.grad, opacity: 0 }} />
      ))}
    </div>
  )
}
