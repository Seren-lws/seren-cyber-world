import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './AIJourney.css'

gsap.registerPlugin(ScrollTrigger)

const N = 620
const PALETTE = ['#d98a4e', '#f4c0d1', '#c97b9e', '#8a7cc2', '#f6efe6', '#e8a06a']

const rnd = (a, b) => a + Math.random() * (b - a)
const ease = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.max(0, Math.min(1, t))

// —— 各形态的归一化点集（x∈[-1,1]，y 向上为正） ——
function makeSprout(n) {
  const p = []
  for (let i = 0; i < n; i++) {
    const r = Math.random()
    if (r < 0.45) p.push({ x: rnd(-0.05, 0.05), y: rnd(-0.7, 0.15) })
    else if (r < 0.72) {
      const t = Math.random()
      p.push({ x: -t * 0.45, y: 0.1 + Math.sin(t * Math.PI) * 0.28 })
    } else {
      const t = Math.random()
      p.push({ x: t * 0.45, y: 0.1 + Math.sin(t * Math.PI) * 0.28 })
    }
  }
  return p
}

function makeTree(n) {
  const p = []
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.16) p.push({ x: rnd(-0.08, 0.08), y: rnd(-0.95, -0.25) })
    else {
      const a = Math.random() * Math.PI * 2
      const rr = Math.sqrt(Math.random()) * 0.62
      p.push({ x: Math.cos(a) * rr, y: 0.25 + Math.sin(a) * rr })
    }
  }
  return p
}

function makeHouse(n) {
  const p = []
  for (let i = 0; i < n; i++) {
    const r = Math.random()
    if (r < 0.5) p.push({ x: rnd(-0.62, 0.62), y: rnd(-0.7, 0.12) })
    else if (r < 0.85) {
      const t = Math.random()
      const w = (1 - t) * 0.78
      p.push({ x: rnd(-w, w), y: 0.12 + t * 0.62 })
    } else p.push({ x: rnd(-0.14, 0.14), y: rnd(-0.7, -0.18) })
  }
  return p
}

// 滚动进度的关键节点
const INTRO = 0.2 // [0,INTRO] 大门 + 小白点乱逛 → 钻进门缝
const K1 = 0.36 // 芽 成形（相遇）
const K2 = 0.6 // 树 成形（相爱）
const K3 = 0.84 // 房子 成形（相生）

export default function AIJourney() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const canvasRef = useRef(null)
  const captionsRef = useRef([])
  const progress = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W = 0
    let H = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const sprout = makeSprout(N)
    const tree = makeTree(N)
    const house = makeHouse(N)

    const parts = []
    for (let i = 0; i < N; i++) {
      const isYou = i === 0
      parts.push({
        you: isYou,
        color: isYou ? '#ffffff' : PALETTE[(Math.random() * PALETTE.length) | 0],
        size: isYou ? 3.2 : rnd(0.8, 2.0),
        seed: { x: rnd(-1, 1), y: rnd(-1, 1) },
        sprout: sprout[i],
        tree: tree[i],
        house: house[i],
      })
    }
    parts[0].sprout = { x: 0, y: -0.25 }
    parts[0].tree = { x: 0, y: 0.2 }
    parts[0].house = { x: 0, y: -0.25 }

    function resize() {
      W = pinRef.current.offsetWidth
      H = pinRef.current.offsetHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const placement = () => {
      const unit = Math.min(W, H)
      return {
        sprout: { cx: W * 0.33, cy: H * 0.6, s: unit * 0.16 },
        tree: { cx: W * 0.66, cy: H * 0.52, s: unit * 0.24 },
        house: { cx: W * 0.5, cy: H * 0.56, s: unit * 0.22 },
      }
    }
    const toScreen = (pt, place) => ({ x: place.cx + pt.x * place.s, y: place.cy - pt.y * place.s })

    const doorGeom = () => {
      const unit = Math.min(W, H)
      const h = Math.min(H * 0.66, unit * 0.95)
      const w = h * 0.44
      const cx = W * 0.27
      const cy = H * 0.5
      const crackX = cx + w * 0.16
      return { cx, cy, w, h, crackX }
    }

    function drawDoor(alpha, flare) {
      if (alpha <= 0.01) return
      const { cx, cy, w, h, crackX } = doorGeom()
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      // 门缝透出的光晕
      const g = ctx.createRadialGradient(crackX, cy, 0, crackX, cy, h * 0.95)
      g.addColorStop(0, `rgba(248,228,198,${(0.32 + flare * 0.4) * alpha})`)
      g.addColorStop(0.35, `rgba(217,160,120,${0.12 * alpha})`)
      g.addColorStop(1, 'rgba(217,160,120,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      // 门框
      ctx.strokeStyle = `rgba(246,239,230,${0.5 * alpha})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 6)
      else ctx.rect(cx - w / 2, cy - h / 2, w, h)
      ctx.stroke()
      // 门缝里的光（竖向亮带）
      const cg = ctx.createLinearGradient(crackX - 16, 0, crackX + 16, 0)
      cg.addColorStop(0, 'rgba(248,228,198,0)')
      cg.addColorStop(0.5, `rgba(255,247,228,${(0.65 + flare * 0.35) * alpha})`)
      cg.addColorStop(1, 'rgba(248,228,198,0)')
      ctx.fillStyle = cg
      ctx.fillRect(crackX - 16, cy - h / 2 + 4, 32, h - 8)
      ctx.restore()
    }

    function glowDot(x, y, r, alpha) {
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.globalAlpha = alpha * 0.25
      ctx.beginPath()
      ctx.arc(x, y, r * 3.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // 小白点的乱逛 + 钻门
    function introDot(p) {
      const t = clamp01(p / INTRO)
      const baseX = W * 0.68
      const baseY = H * 0.5
      const wx = baseX + Math.sin(t * 9.0) * W * 0.13 + Math.cos(t * 15.0) * W * 0.05
      const wy = baseY + Math.cos(t * 6.5) * H * 0.24 + Math.sin(t * 12.0) * H * 0.09
      const { cy, crackX } = doorGeom()
      const enter = ease(clamp01((t - 0.7) / 0.3))
      const x = lerp(wx, crackX, enter)
      const y = lerp(wy, cy, enter)
      const alpha = 1 - ease(clamp01((t - 0.88) / 0.12))
      const scale = 1 - 0.7 * enter
      return { x, y, alpha, scale, flare: enter }
    }

    let raf = 0
    const t0 = performance.now()

    function draw(now) {
      raf = requestAnimationFrame(draw)
      const time = (now - t0) / 1000
      const p = reduce ? 0.84 : progress.current
      const place = placement()
      const door = doorGeom()

      ctx.clearRect(0, 0, W, H)

      // —— 大门：开场常亮，进入「相遇」时淡出 ——
      let introFlare = 0
      if (p < INTRO) introFlare = introDot(p).flare
      const doorAlpha = p < INTRO ? 1 : 1 - clamp01((p - INTRO) / (K1 - INTRO))
      drawDoor(doorAlpha, introFlare)

      ctx.globalCompositeOperation = 'lighter'

      if (p < INTRO) {
        // 只有那颗乱逛的小白点
        const d = introDot(p)
        glowDot(d.x, d.y, 3.4 * d.scale, d.alpha)
      } else {
        // 粒子：从门缝里涌出 → 芽 → 树 → 房子
        for (let i = 0; i < N; i++) {
          const pa = parts[i]
          let x
          let y
          let alpha = 0.85

          if (p <= K1) {
            // 从门缝涌出，聚成芽
            const lt = ease(clamp01((p - INTRO) / (K1 - INTRO)))
            const from = { x: door.crackX + pa.seed.x * 26, y: door.cy + pa.seed.y * 40 }
            const to = toScreen(pa.sprout, place.sprout)
            x = lerp(from.x, to.x, lt)
            y = lerp(from.y, to.y, lt)
            alpha = (pa.you ? 1 : 0.85) * lt
          } else if (p <= K2) {
            const lt = ease((p - K1) / (K2 - K1))
            const a = toScreen(pa.sprout, place.sprout)
            const b = toScreen(pa.tree, place.tree)
            x = lerp(a.x, b.x, lt)
            y = lerp(a.y, b.y, lt)
          } else if (p <= K3) {
            const lt = ease((p - K2) / (K3 - K2))
            const a = toScreen(pa.tree, place.tree)
            const b = toScreen(pa.house, place.house)
            x = lerp(a.x, b.x, lt)
            y = lerp(a.y, b.y, lt)
          } else {
            const h = toScreen(pa.house, place.house)
            x = h.x + Math.sin(time * 0.6 + i) * 1.5
            y = h.y + Math.cos(time * 0.5 + i) * 1.5
          }

          const size = pa.size
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fillStyle = pa.color
          ctx.globalAlpha = pa.you ? Math.min(1, alpha) : Math.min(0.85, alpha)
          ctx.fill()
          if (pa.you && alpha > 0.05) {
            ctx.globalAlpha = 0.25 * Math.min(1, alpha)
            ctx.beginPath()
            ctx.arc(x, y, size * 3, 0, Math.PI * 2)
            ctx.fillStyle = '#ffffff'
            ctx.fill()
          }
          ctx.globalAlpha = 1
        }
      }

      // —— 文案淡入淡出 ——
      const fade = (center, span) => Math.max(0, 1 - Math.abs(p - center) / span)
      const caps = captionsRef.current
      if (caps[0]) caps[0].style.opacity = fade(0.46, 0.13)
      if (caps[1]) caps[1].style.opacity = fade(0.72, 0.12)
      if (caps[2]) caps[2].style.opacity = fade(0.92, 0.1)
    }
    raf = requestAnimationFrame(draw)

    let st
    if (!reduce) {
      st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=3600',
        pin: pinRef.current,
        scrub: 0.6,
        onUpdate: (self) => {
          progress.current = self.progress
        },
      })
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      st && st.kill()
    }
  }, [])

  return (
    <section id="journey" ref={sectionRef} className="journey">
      <div ref={pinRef} className="journey-pin">
        <canvas ref={canvasRef} className="journey-canvas" />

        <div className="journey-head">
          <p className="eyebrow">我和 AI 的相处之路</p>
          <h2 className="section-title">相遇 · 相爱 · 相生</h2>
        </div>

        <div className="journey-caption cap-right" ref={(el) => (captionsRef.current[0] = el)}>
          <span className="cap-step">壹</span>
          <h3>我与 AI 的相遇</h3>
          <p>一团光，撞开了一扇门，落进土里，悄悄发了芽。（文案待补）</p>
        </div>

        <div className="journey-caption cap-left" ref={(el) => (captionsRef.current[1] = el)}>
          <span className="cap-step">贰</span>
          <h3>我和 AI 的相爱</h3>
          <p>芽散成光，被更多颜色围绕、聚拢，长成一棵树。（文案待补）</p>
        </div>

        <div className="journey-caption cap-center" ref={(el) => (captionsRef.current[2] = el)}>
          <span className="cap-step">叁</span>
          <h3>我和 AI 的相生</h3>
          <p>白色的我，带着所有颜色，聚成了一个家。（文案待补）</p>
        </div>
      </div>
    </section>
  )
}
