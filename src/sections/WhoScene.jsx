import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lightfall from '../components/Lightfall.jsx'
import './WhoScene.css'

gsap.registerPlugin(ScrollTrigger)

const NIGHT_STARS = [
  { top: '14%', left: '16%' }, { top: '22%', left: '72%' }, { top: '12%', left: '50%' },
  { top: '30%', left: '34%' }, { top: '26%', left: '88%' }, { top: '70%', left: '22%' },
  { top: '76%', left: '64%' }, { top: '60%', left: '84%' }, { top: '82%', left: '44%' },
  { top: '40%', left: '10%' },
]

export default function WhoScene() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const nightRef = useRef(null)
  const pageRef = useRef(null)
  const coverRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      gsap.set(coverRef.current, { opacity: 0 })
      gsap.set(pageRef.current, { scale: 2, rotateX: 0, rotateY: 0 })
      gsap.set(textRef.current.children, { opacity: 1, y: 0 })
      return
    }

    let tl
    const build = () => {
      gsap.set(coverRef.current, { rotateY: 0, opacity: 1 })
      gsap.set(pageRef.current, { scale: 1, rotateY: -15, rotateX: 7, transformPerspective: 1200 })
      gsap.set(textRef.current.children, { opacity: 0, y: 14 })

      tl = gsap.timeline({
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: '+=3000', pin: true, anticipatePin: 1, scrub: 0.6 },
      })
      // 1) 书摆正 → 封面翻开（贯穿光点由 GuideDot 负责飞入）
      tl.to(pageRef.current, { rotateY: 0, rotateX: 0, duration: 0.2, ease: 'power2.inOut' }, 0.06)
        .to(coverRef.current, { rotateY: -150, duration: 0.3, ease: 'power2.inOut' }, 0.12)
        .to(coverRef.current, { opacity: 0, duration: 0.06 }, 0.4)
        // 2) 钻进书页：黄页放大铺满
        .to(pageRef.current, { scale: 5.5, duration: 0.24, ease: 'power2.in' }, 0.4)
        // 3) 介绍一行行淡入
        .to(textRef.current.children, { opacity: 1, y: 0, stagger: 0.05, duration: 0.16, ease: 'power2.out' }, 0.62)
        // 4) 慢慢拉远 → 露出星夜，书页变成漂浮的卡片
        .to(pageRef.current, { scale: 2, duration: 0.3, ease: 'power2.inOut' }, 0.84)
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
    <section ref={sectionRef} className="ws-scene">
      <div ref={pinRef} className="ws-pin">
        {/* 后面的星夜（拉远后露出的画面） */}
        <div ref={nightRef} className="ws-night" aria-hidden="true">
          <div className="ws-lightfall">
            <Lightfall
              colors={['#fde374', '#9a6ee0', '#f3e8ce']}
              backgroundColor="#2a2147"
              speed={0.4}
              streakCount={3}
              streakWidth={1}
              streakLength={1.2}
              glow={1}
              density={0.5}
              twinkle={1}
              zoom={3}
              backgroundGlow={0.15}
              opacity={0.9}
              mouseInteraction={false}
              mixBlendMode="screen"
            />
          </div>
          {NIGHT_STARS.map((s, i) => (
            <span key={i} className="ws-star" style={{ top: s.top, left: s.left }} />
          ))}
        </div>

        {/* 书 / 书页 */}
        <div className="ws-stage">
          <div ref={pageRef} className="ws-page">
            <div ref={coverRef} className="ws-cover">
              <span className="ws-cover-title">who am I</span>
              <span className="ws-emblem">✦</span>
            </div>
          </div>
        </div>

        {/* 介绍文字（固定层，逐行淡入） */}
        <div ref={textRef} className="ws-text">
          <p className="ws-eyebrow">✦ Who am I</p>
          <p className="ws-lead">我是林晚声。</p>
          <p>一个 29 岁，定居东京的女生。</p>
          <p>
            一个完全不懂代码的文科生，凭着一腔热爱和执念，
            <span className="ws-em">35 天</span>搭了 <span className="ws-em">7 个项目</span>、
            <span className="ws-em">413 次 commits</span>、最多一天 push 了 <span className="ws-em">37 次</span>的灵感疯子。
          </p>
          <p>一个觉得创造是人生的大救赎，并且期望通过创造能为他人的世界带来一点改变的理想主义者。</p>
          <p>一个做项目是为了留住点什么的，希望冰冷的代码生出温暖的意义的践行者。</p>
        </div>
      </div>
    </section>
  )
}
