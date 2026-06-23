import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// 滚动到视口时，内容从「下方 + 透明」柔柔浮现。
// stagger > 0 时，会让直接子元素依次错开出现。
export default function Reveal({
  children,
  y = 48,
  duration = 1.1,
  delay = 0,
  stagger = 0,
  start = 'top 82%',
  className = '',
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = stagger > 0 ? el.children : el
    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start, once: true },
      })
    }, el)

    return () => ctx.revert()
  }, [y, duration, delay, stagger, start])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
