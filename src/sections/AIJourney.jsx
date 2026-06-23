import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './AIJourney.css'

gsap.registerPlugin(ScrollTrigger)

const N = 620
const PALETTE = ['#d98a4e', '#f4c0d1', '#c97b9e', '#8a7cc2', '#f6efe6', '#e8a06a']

const rnd = (a, b) => a + Math.random() * (b - a)

// —— 各形态的归一化点集（x∈[-1,1]，y 向上为正） ——
function makeSprout(n) {
  const p = []
  for (let i = 0; i < n; i++) {
    const r = Math.random()
    if (r < 0.45) {
      // 茎
      p.push({ x: rnd(-0.05, 0.05), y: rnd(-0.7, 0.15) })
    } else if (r < 0.72) {
      // 左叶
      const t = Math.random()
      p.push({ x: -t * 0.45, y: 0.1 + Math.sin(t * Math.PI) * 0.28 })
    } else {
      // 右叶
      const t = Math.random()
      p.push({ x: t * 0.45, y: 0.1 + Math.sin(t * Math.PI) * 0.28 })
    }
  }
  return p
}

function makeTree(n) {
  const p = []
  for (let i = 0; i < n; i++) {
    if (Math.random() < 0.16) {
      // 树干
      p.push({ x: rnd(-0.08, 0.08), y: rnd(-0.95, -0.25) })
    } else {
      // 树冠（圆盘内随机）
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
    if (r < 0.5) {
      // 屋身
      p.push({ x: rnd(-0.62, 0.62), y: rnd(-0.7, 0.12) })
    } else if (r < 0.85) {
      // 屋顶（三角）
      const t = Math.random()
      const w = (1 - t) * 0.78
      p.push({ x: rnd(-w, w), y: 0.12 + t * 0.62 })
    } else {
      // 门
      p.push({ x: rnd(-0.14, 0.14), y: rnd(-0.7, -0.18) })
    }
  }
  return p
}

const ease = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t

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

    // 每个粒子：颜色、大小、云阶段随机位、以及各形态对应点
    const parts = []
    for (let i = 0; i < N; i++) {
      const isYou = i === 0
      parts.push({
        you: isYou,
        color: isYou ? '#ffffff' : PALETTE[(Math.random() * PALETTE.length) | 0],
        size: isYou ? 3.2 : rnd(0.8, 2.0),
        cloud: { x: rnd(-0.9, 0.9), y: rnd(-0.5, 0.9), s: rnd(0, Math.PI * 2) },
        sprout: sprout[i],
        tree: tree[i],
        house: house[i],
      })
    }
    // 让“你”始终在形态的中心锚点
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

    // 形态在屏幕上的中心与缩放
    const placement = () => {
      const unit = Math.min(W, H)
      return {
        sprout: { cx: W * 0.33, cy: H * 0.6, s: unit * 0.16 },
        tree: { cx: W * 0.66, cy: H * 0.52, s: unit * 0.24 },
        house: { cx: W * 0.5, cy: H * 0.56, s: unit * 0.22 },
      }
    }

    const toScreen = (pt, place) => ({
      x: place.cx + pt.x * place.s,
      y: place.cy - pt.y * place.s,
    })

    // 关键帧：0 云 → k1 芽 → k2 树 → k3 房
    const K = [0.0, 0.22, 0.5, 0.78, 1.0]

    let raf = 0
    let t0 = performance.now()

    function draw(now) {
      raf = requestAnimationFrame(draw)
      const time = (now - t0) / 1000
      const p = reduce ? 0.78 : progress.current
      const place = placement()

      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'

      // —— 门（仅开场）——
      if (p < 0.24) {
        const dp = ease(Math.min(1, p / 0.22))
        const doorH = Math.min(W, H) * 0.5
        const doorW = doorH * 0.42
        const cx = W * 0.5
        const cy = H * 0.5
        const gap = lerp(2, doorW * 0.9, dp)
        const alpha = (1 - dp) * 0.7
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = `rgba(246,239,230,${alpha * 0.5})`
        ctx.lineWidth = 1.2
        ctx.strokeRect(cx - doorW / 2, cy - doorH / 2, doorW, doorH)
        // 门缝光
        const grd = ctx.createLinearGradient(cx - gap / 2, 0, cx + gap / 2, 0)
        grd.addColorStop(0, 'rgba(217,138,78,0)')
        grd.addColorStop(0.5, `rgba(246,222,196,${alpha})`)
        grd.addColorStop(1, 'rgba(217,138,78,0)')
        ctx.fillStyle = grd
        ctx.fillRect(cx - gap / 2, cy - doorH / 2, gap, doorH)
        ctx.globalCompositeOperation = 'lighter'
      }

      // —— 粒子 ——
      for (let i = 0; i < N; i++) {
        const pa = parts[i]
        let x
        let y

        if (p <= K[1]) {
          // 云 → 芽
          const lt = ease(Math.min(1, p / K[1]))
          const cloud = {
            x: W * 0.5 + pa.cloud.x * Math.min(W, H) * 0.42 + Math.sin(time * 0.5 + pa.cloud.s) * 8,
            y: H * 0.42 + pa.cloud.y * Math.min(W, H) * 0.2 + Math.cos(time * 0.4 + pa.cloud.s) * 8,
          }
          const tgt = toScreen(pa.sprout, place.sprout)
          x = lerp(cloud.x, tgt.x, lt)
          y = lerp(cloud.y, tgt.y, lt)
        } else if (p <= K[2]) {
          const lt = ease((p - K[1]) / (K[2] - K[1]))
          const a = toScreen(pa.sprout, place.sprout)
          const b = toScreen(pa.tree, place.tree)
          x = lerp(a.x, b.x, lt)
          y = lerp(a.y, b.y, lt)
        } else if (p <= K[3]) {
          const lt = ease((p - K[2]) / (K[3] - K[2]))
          const a = toScreen(pa.tree, place.tree)
          const b = toScreen(pa.house, place.house)
          x = lerp(a.x, b.x, lt)
          y = lerp(a.y, b.y, lt)
        } else {
          const h = toScreen(pa.house, place.house)
          x = h.x + Math.sin(time * 0.6 + i) * 1.5
          y = h.y + Math.cos(time * 0.5 + i) * 1.5
        }

        const size = pa.size * (pa.you ? 1 : 1)
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = pa.color
        ctx.globalAlpha = pa.you ? 1 : 0.85
        ctx.fill()
        if (pa.you) {
          ctx.globalAlpha = 0.25
          ctx.beginPath()
          ctx.arc(x, y, size * 3, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // —— 文案淡入淡出 ——
      const fade = (center, span) => {
        const d = Math.abs(p - center)
        return Math.max(0, 1 - d / span)
      }
      const caps = captionsRef.current
      if (caps[0]) caps[0].style.opacity = fade(0.22, 0.16)
      if (caps[1]) caps[1].style.opacity = fade(0.5, 0.16)
      if (caps[2]) caps[2].style.opacity = fade(0.85, 0.18)
    }
    raf = requestAnimationFrame(draw)

    let st
    if (!reduce) {
      st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=3200',
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

        <div
          className="journey-caption cap-right"
          ref={(el) => (captionsRef.current[0] = el)}
        >
          <span className="cap-step">壹</span>
          <h3>我与 AI 的相遇</h3>
          <p>一团光，撞开了一扇门，落进土里，悄悄发了芽。（文案待补）</p>
        </div>

        <div
          className="journey-caption cap-left"
          ref={(el) => (captionsRef.current[1] = el)}
        >
          <span className="cap-step">贰</span>
          <h3>我和 AI 的相爱</h3>
          <p>芽散成光，被更多颜色围绕、聚拢，长成一棵树。（文案待补）</p>
        </div>

        <div
          className="journey-caption cap-center"
          ref={(el) => (captionsRef.current[2] = el)}
        >
          <span className="cap-step">叁</span>
          <h3>我和 AI 的相生</h3>
          <p>白色的我，带着所有颜色，聚成了一个家。（文案待补）</p>
        </div>
      </div>
    </section>
  )
}
