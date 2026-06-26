import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './GuideDot.css'

gsap.registerPlugin(ScrollTrigger)

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.max(0, Math.min(1, t))

// 贯穿全站的「你」——从首页一路向下，走到书旁，钻进书里。整条视觉引导线。
export default function GuideDot() {
  const elRef = useRef(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el, { autoAlpha: 0 })
      return
    }

    const sts = []
    const build = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      const hero = { x: W * 0.62, y: H * 0.45 }
      // 门会随滚动上移，所以落点取它上移途中的位置（斜上方），让光点"追上门"
      const door = { x: W * 0.3, y: H * 0.22 }

      gsap.set(el, { x: hero.x, y: hero.y, autoAlpha: 1 })

      // 首页：滚动初段，光点从标题旁快速斜上飞、追上正在上移的门，进门淡出
      sts.push(
        ScrollTrigger.create({
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
          onUpdate: (self) => {
            const p = self.progress
            const e = clamp01(p / 0.22)
            const ease = 1 - Math.pow(1 - e, 2)
            const o = 1 - clamp01((p - 0.18) / 0.14)
            gsap.set(el, { x: lerp(hero.x, door.x, ease), y: lerp(hero.y, door.y, ease), autoAlpha: o })
          },
        }),
      )
    }

    build()

    const onResize = () => {
      sts.forEach((s) => s.kill())
      sts.length = 0
      build()
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      sts.forEach((s) => s.kill())
    }
  }, [])

  return (
    <span ref={elRef} className="guide-dot" aria-hidden="true">
      <span className="guide-dot-core" />
    </span>
  )
}
