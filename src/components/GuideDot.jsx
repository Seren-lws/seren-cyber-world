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
      const hero = { x: W * 0.56, y: H * 0.46 }
      const hand = { x: W * 0.5, y: H * 0.62 }
      const beside = { x: W * 0.5 + 170, y: H * 0.42 }
      const into = { x: W * 0.5, y: H * 0.5 }

      gsap.set(el, { x: hero.x, y: hero.y, autoAlpha: 1 })

      // 阶段一：首页里随滚动向下走 → 交接点
      sts.push(
        ScrollTrigger.create({
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress
            gsap.set(el, { x: lerp(hero.x, hand.x, p), y: lerp(hero.y, hand.y, p), autoAlpha: 1 })
          },
        }),
      )

      // 阶段二：第二页（书的场景，钉住）里 → 走到书旁 → 钻进书 → 隐去
      sts.push(
        ScrollTrigger.create({
          trigger: '.ws-scene',
          start: 'top top',
          end: '+=3000',
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress
            let x, y, o
            if (p < 0.2) {
              const t = p / 0.2
              x = lerp(hand.x, beside.x, t)
              y = lerp(hand.y, beside.y, t)
              o = 1
            } else if (p < 0.44) {
              const t = (p - 0.2) / 0.24
              x = lerp(beside.x, into.x, t)
              y = lerp(beside.y, into.y, t)
              o = 1 - clamp01((p - 0.32) / 0.12)
            } else {
              x = into.x
              y = into.y
              o = 0
            }
            gsap.set(el, { x, y, autoAlpha: o })
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
