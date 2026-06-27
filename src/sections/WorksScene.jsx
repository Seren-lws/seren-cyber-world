import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects } from '../data/projects'
import './WorksScene.css'

gsap.registerPlugin(ScrollTrigger)

const STARS = Array.from({ length: 40 }, (_, i) => ({
  top: (i * 67 + 11) % 100,
  left: (i * 41 + 13) % 100,
  s: 1 + (i % 3),
  d: (i % 8) * 0.4,
}))

const SPARKLES = Array.from({ length: 15 }, (_, i) => ({
  x: 20 + ((i * 43 + 7) % 60),
  y: 8 + ((i * 31 + 13) % 55),
  s: 2 + (i % 3),
  d: (i * 0.7) % 4,
  dur: 2.5 + (i % 4) * 0.6,
}))

const TRAIL_N = 14
const ORBIT_R = 360
const GAP = 900
const SCROLL = 14000

const P = {
  treeIn: 0.06,
  orbitStart: 0.08,
  orbitEnd: 0.20,
  flyEnd: 0.26,
  projStart: 0.26,
  projEnd: 0.94,
  fadeOut: 0.97,
}

export default function WorksScene() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const trackRef = useRef(null)
  const treeRef = useRef(null)
  const glowRef = useRef(null)
  const dotRef = useRef(null)
  const lineRef = useRef(null)
  const trailRefs = useRef([])
  const nodeRefs = useRef([])
  const stemRefs = useRef([])
  const cardRefs = useRef([])
  const prog = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    const treeCX = vw / 2
    const treeCY = vh / 2
    const N = projects.length
    const maxShift = N * GAP

    const clamp01 = (t) => Math.max(0, Math.min(1, t))
    const win = (x, a, b) => clamp01((x - a) / (b - a))
    const lerp = (a, b, t) => a + (b - a) * t
    const ease = (t) => t * t * (3 - 2 * t)

    const trailPts = Array.from({ length: TRAIL_N }, () => ({
      x: treeCX + ORBIT_R,
      y: treeCY,
    }))

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end: `+=${SCROLL}`,
      pin: pinRef.current,
      anticipatePin: 1,
      scrub: 0.6,
      onUpdate: (self) => { prog.current = self.progress },
    })

    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const p = prog.current

      // ── 树淡入 ──
      const treeA = ease(win(p, 0, P.treeIn))
      treeRef.current.style.opacity = treeA.toFixed(3)
      treeRef.current.style.transform =
        `translate(-50%, -50%) scale(${lerp(0.88, 1, treeA).toFixed(3)})`
      glowRef.current.style.opacity = treeA.toFixed(3)

      // ── 轨道平移 ──
      const shiftT = win(p, P.projStart, P.projEnd)
      const shiftX = shiftT * maxShift
      trackRef.current.style.transform = `translateX(${-shiftX}px)`

      // ── 光点坐标（轨道坐标系） ──
      let dotX, dotY

      if (p < P.orbitStart) {
        dotX = treeCX + ORBIT_R
        dotY = treeCY
      } else if (p < P.orbitEnd) {
        const t = win(p, P.orbitStart, P.orbitEnd)
        const angle = t * Math.PI * 2
        dotX = treeCX + Math.cos(angle) * ORBIT_R
        dotY = treeCY - Math.sin(angle) * ORBIT_R
      } else if (p < P.flyEnd) {
        const t = ease(win(p, P.orbitEnd, P.flyEnd))
        dotX = lerp(treeCX + ORBIT_R, treeCX + ORBIT_R + 200, t)
        dotY = treeCY
      } else {
        const t = win(p, P.projStart, P.projEnd)
        dotX = treeCX + ORBIT_R + 200 + t * N * GAP
        dotY = treeCY
      }

      const dotVis = win(p, P.orbitStart - 0.015, P.orbitStart)
        * (1 - win(p, P.fadeOut, 1))
      dotRef.current.style.transform =
        `translate(${dotX - 7}px, ${dotY - 7}px)`
      dotRef.current.style.opacity = dotVis.toFixed(3)

      // ── 拖尾 ──
      let tx = dotX, ty = dotY
      for (let i = 0; i < TRAIL_N; i++) {
        const pt = trailPts[i]
        pt.x += (tx - pt.x) * 0.14
        pt.y += (ty - pt.y) * 0.14
        const nd = trailRefs.current[i]
        if (nd) {
          nd.style.transform =
            `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%)`
          nd.style.opacity =
            (dotVis * (1 - (i + 1) / (TRAIL_N + 1)) * 0.6).toFixed(3)
        }
        tx = pt.x
        ty = pt.y
      }

      // ── 发光线 ──
      if (p >= P.orbitEnd) {
        const lineW = Math.max(0, dotX - treeCX)
        const lineA = win(p, P.orbitEnd, P.flyEnd)
          * (1 - win(p, P.fadeOut, 1))
        lineRef.current.style.left = `${treeCX}px`
        lineRef.current.style.top = `${treeCY - 1}px`
        lineRef.current.style.width = `${lineW}px`
        lineRef.current.style.opacity = lineA.toFixed(3)
      } else {
        lineRef.current.style.opacity = '0'
      }

      // ── 节点 + 竖线 + 卡片 ──
      for (let i = 0; i < N; i++) {
        const cx = treeCX + (i + 1) * GAP
        const cardA = ease(win(dotX, cx - 150, cx + 50))
        const fadeA = cardA * (1 - win(p, P.fadeOut, 1))

        const node = nodeRefs.current[i]
        if (node) {
          node.style.left = `${cx}px`
          node.style.top = `${treeCY}px`
          node.style.opacity = fadeA.toFixed(3)
        }

        const stem = stemRefs.current[i]
        if (stem) {
          const isAbove = i % 2 === 0
          const stemH = vh * 0.06
          stem.style.left = `${cx}px`
          if (isAbove) {
            stem.style.top = `${treeCY - stemH}px`
            stem.style.height = `${stemH}px`
          } else {
            stem.style.top = `${treeCY}px`
            stem.style.height = `${stemH}px`
          }
          stem.style.opacity = (fadeA * 0.6).toFixed(3)
        }

        const card = cardRefs.current[i]
        if (card) {
          card.style.opacity = fadeA.toFixed(3)
          card.style.transform =
            `translateX(-50%) translateY(${lerp(24, 0, cardA)}px)`
        }
      }
    }

    raf = requestAnimationFrame(tick)
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 300)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(refreshTimer)
      st.kill()
    }
  }, [])

  return (
    <section id="works" ref={sectionRef} className="wk-scene">
      <div ref={pinRef} className="wk-pin">
        <div className="wk-stars" aria-hidden="true">
          {STARS.map((s, i) => (
            <span key={i} className="wk-star"
              style={{
                top: `${s.top}%`, left: `${s.left}%`,
                width: `${s.s}px`, height: `${s.s}px`,
                animationDelay: `${s.d}s`,
              }}
            />
          ))}
        </div>

        <div ref={trackRef} className="wk-track">
          <div ref={glowRef} className="wk-tree-glow" aria-hidden="true" />
          <div ref={treeRef} className="wk-tree">
            <img src="/tree.png" alt="" draggable="false" />
            <div className="wk-tree-flow" aria-hidden="true" />
            {SPARKLES.map((sp, i) => (
              <span key={`sp${i}`} className="wk-sparkle" aria-hidden="true"
                style={{
                  left: `${sp.x}%`, top: `${sp.y}%`,
                  width: `${sp.s}px`, height: `${sp.s}px`,
                  animationDelay: `${sp.d}s`,
                  '--dur': `${sp.dur}s`,
                }}
              />
            ))}
          </div>

          <div ref={lineRef} className="wk-line" />

          {Array.from({ length: TRAIL_N }, (_, i) => (
            <div key={`t${i}`} className="wk-trail" aria-hidden="true"
              ref={(el) => (trailRefs.current[i] = el)}
              style={{
                width: `${Math.max(3, 10 - i * 0.5)}px`,
                height: `${Math.max(3, 10 - i * 0.5)}px`,
              }}
            />
          ))}

          <div ref={dotRef} className="wk-dot">
            <div className="wk-dot-core" />
          </div>

          {projects.map((proj, i) => (
            <div key={`nd-${proj.id}`} className="wk-node"
              ref={(el) => (nodeRefs.current[i] = el)}
            />
          ))}

          {projects.map((proj, i) => (
            <div key={`st-${proj.id}`} className="wk-stem"
              ref={(el) => (stemRefs.current[i] = el)}
            />
          ))}

          {projects.map((proj, i) => (
            <div key={proj.id}
              ref={(el) => (cardRefs.current[i] = el)}
              className={`wk-card ${i % 2 === 0 ? 'wk-card-above' : 'wk-card-below'}`}
              style={{ left: `calc(50vw + ${(i + 1) * GAP}px)` }}
            >
              <div className="wk-card-img">
                <span className="wk-card-icon">{proj.icon}</span>
              </div>
              <h3 className="wk-card-name">{proj.name}</h3>
              <p className="wk-card-tagline">{proj.tagline}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
