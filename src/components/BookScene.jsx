import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './BookScene.css'

gsap.registerPlugin(ScrollTrigger)

// 滚动驱动：一本鎏金书在夜空正中，滚动时光点飞入、书翻开、内页放大铺满 → 进入「我是谁」。
const STARS = [
  { top: '20%', left: '18%' }, { top: '30%', left: '74%' }, { top: '16%', left: '58%' },
  { top: '44%', left: '30%' }, { top: '36%', left: '84%' }, { top: '60%', left: '20%' },
  { top: '66%', left: '70%' },
]

export default function BookScene() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const skyRef = useRef(null)
  const stageRef = useRef(null)
  const coverRef = useRef(null)
  const dotRef = useRef(null)
  const labelRef = useRef(null)
  const fillRef = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      gsap.set(coverRef.current, { rotateY: -150 })
      gsap.set(labelRef.current, { opacity: 1 })
      gsap.set(fillRef.current, { scaleY: 1, transformOrigin: '50% 100%' })
      gsap.set(dotRef.current, { opacity: 0 })
      return
    }

    let tl
    const build = () => {
      gsap.set(coverRef.current, { rotateY: 0 })
      gsap.set(labelRef.current, { opacity: 0 })
      gsap.set(fillRef.current, { scaleY: 0, transformOrigin: '50% 100%' })
      gsap.set(dotRef.current, { opacity: 1, x: 0, y: 0, scale: 1 })
      gsap.set(stageRef.current, { scale: 1 })
      gsap.set(skyRef.current, { opacity: 1 })

      tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: '+=2100', pin: true, anticipatePin: 1, scrub: 0.6 },
      })
      // 1) 光点飘向书 → 翻开 → 飞入
      tl.to(dotRef.current, { x: -150, y: -10, duration: 0.2, ease: 'power1.inOut' }, 0)
        .to(coverRef.current, { rotateY: -152, duration: 0.4, ease: 'power2.inOut' }, 0.16)
        .to(dotRef.current, { x: -210, y: 0, opacity: 0, scale: 0.2, duration: 0.16, ease: 'power1.in' }, 0.4)
        .to(labelRef.current, { opacity: 1, duration: 0.18 }, 0.46)
        // 2) 书页放大（先放大）
        .to(stageRef.current, { scale: 1.5, duration: 0.24, ease: 'power2.in' }, 0.52)
        // 3) 放大结束后，黄色从底部漫上来（不重叠）
        .to(skyRef.current, { opacity: 0, duration: 0.2 }, 0.8)
        .to(fillRef.current, { scaleY: 1, duration: 0.2, ease: 'power2.inOut' }, 0.8)
    }
    build()

    const onResize = () => {
      tl && tl.scrollTrigger && tl.scrollTrigger.kill()
      tl && tl.kill()
      build()
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      tl && tl.scrollTrigger && tl.scrollTrigger.kill()
      tl && tl.kill()
    }
  }, [])

  return (
    <section ref={sectionRef} className="book-scene">
      <div ref={pinRef} className="book-pin">
        <div ref={skyRef} className="book-sky" aria-hidden="true">
          {STARS.map((s, i) => (
            <span key={i} className="book-star" style={{ top: s.top, left: s.left }} />
          ))}
        </div>

        <div ref={stageRef} className="book-stage">
          <div className="book">
            <div className="book-page">
              <span ref={labelRef} className="book-page-label">✦ 我是谁</span>
            </div>
            <div ref={coverRef} className="book-cover">
              <span className="book-emblem">✦</span>
              <span className="book-cover-title">晚声</span>
              <span className="book-tape book-tape-tr" />
              <span className="book-tape book-tape-bl" />
            </div>
          </div>
          <span ref={dotRef} className="book-dot" aria-hidden="true" />
        </div>

        <div ref={fillRef} className="book-fill" aria-hidden="true" />
      </div>
    </section>
  )
}
