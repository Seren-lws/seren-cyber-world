import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './FloodTransition.css'

gsap.registerPlugin(ScrollTrigger)

// 漫色上涌：淡姜黄从底部涌上盖过夜空；代表「你」的金色光点一路向下沉入黄页。
const STARS = [
  { top: '18%', left: '22%' },
  { top: '26%', left: '70%' },
  { top: '40%', left: '46%' },
  { top: '14%', left: '54%' },
  { top: '34%', left: '82%' },
]

export default function FloodTransition() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const yellowRef = useRef(null)
  const guideRef = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      gsap.set(yellowRef.current, { scaleY: 1 })
      gsap.set(guideRef.current, { opacity: 0 })
      return
    }

    let tl

    const build = () => {
      const H = window.innerHeight
      gsap.set(yellowRef.current, { scaleY: 0, transformOrigin: '50% 100%' })
      gsap.set(guideRef.current, { opacity: 0, y: -H * 0.36, scale: 1 })

      tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=1200',
          pin: pinRef.current,
          scrub: 0.6,
        },
      })
      tl.to(guideRef.current, { opacity: 1, duration: 0.08 }, 0)
        .to(guideRef.current, { y: H * 0.3, ease: 'none', duration: 0.62 }, 0)
        .to(yellowRef.current, { scaleY: 1, ease: 'power2.inOut', duration: 0.6 }, 0.12)
        .to(guideRef.current, { opacity: 0, scale: 0.3, duration: 0.16 }, 0.6)
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
    <section ref={sectionRef} className="flood-seg">
      <div ref={pinRef} className="flood-pin">
        <div className="flood-purple" aria-hidden="true">
          {STARS.map((s, i) => (
            <span key={i} className="flood-star" style={{ top: s.top, left: s.left }} />
          ))}
        </div>
        <div ref={yellowRef} className="flood-yellow" aria-hidden="true" />
        <span ref={guideRef} className="flood-guide" aria-hidden="true" />
      </div>
    </section>
  )
}
