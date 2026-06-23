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

// 滚动进度分段：开场 → (聚成芽·相遇) → 散开飞 → (聚成树·相爱) → 散开飞 → (聚成房·相生)
const P = {
  introEnd: 0.13,
  assembleEnd: 0.24,
  sproutHoldEnd: 0.37,
  t1ScatterEnd: 0.45,
  treeFormEnd: 0.53,
  treeHoldEnd: 0.67,
  t2ScatterEnd: 0.75,
  houseFormEnd: 0.83,
}

export default function AIJourney() {
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const canvasRef = useRef(null)
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
        size: isYou ? 3 : rnd(0.8, 2.0),
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
        sprout: { cx: W * 0.34, cy: H * 0.58, s: unit * 0.17 },
        tree: { cx: W * 0.66, cy: H * 0.52, s: unit * 0.24 },
        house: { cx: W * 0.5, cy: H * 0.56, s: unit * 0.22 },
      }
    }
    const toScreen = (pt, place) => ({ x: place.cx + pt.x * place.s, y: place.cy - pt.y * place.s })
    const scatterPos = (pa) => ({ x: W * 0.5 + pa.seed.x * W * 0.52, y: H * 0.5 + pa.seed.y * H * 0.52 })

    // 「门口」位置（之后铺门图时对齐），粒子从这里涌出
    const doorPos = () => ({ x: W * 0.27, y: H * 0.5 })

    // 小白点的乱逛（开场），之后飞向门口淡出
    function introDot(p) {
      const t = clamp01(p / P.introEnd)
      const baseX = W * 0.68
      const baseY = H * 0.5
      const wx = baseX + Math.sin(t * 9.0) * W * 0.13 + Math.cos(t * 15.0) * W * 0.05
      const wy = baseY + Math.cos(t * 6.5) * H * 0.24 + Math.sin(t * 12.0) * H * 0.09
      const d = doorPos()
      const enter = ease(clamp01((t - 0.72) / 0.28))
      const x = lerp(wx, d.x, enter)
      const y = lerp(wy, d.y, enter)
      const alpha = 1 - ease(clamp01((t - 0.86) / 0.14))
      return { x, y, alpha }
    }

    // 与上一屏 SoulDot 一致的拖尾
    const TRAIL = 16
    const trail = Array.from({ length: TRAIL }, () => ({ x: -50, y: -50 }))

    function drawDotWithTail(x, y, alpha) {
      // 更新拖尾（每节追前一节）
      let tx = x
      let ty = y
      for (let i = 0; i < TRAIL; i++) {
        const pt = trail[i]
        pt.x += (tx - pt.x) * 0.22
        pt.y += (ty - pt.y) * 0.22
        const a = alpha * (1 - (i + 1) / (TRAIL + 1)) * 0.6
        const r = Math.max(1.3, 4.5 - i * 0.25)
        ctx.globalAlpha = a
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        tx = pt.x
        ty = pt.y
      }
      // 头部 + 光晕
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.globalAlpha = alpha * 0.3
      ctx.beginPath()
      ctx.arc(x, y, 16, 0, Math.PI * 2)
      ctx.fillStyle = '#cdbcf7'
      ctx.fill()
      ctx.globalAlpha = 1
    }

    function particlePos(pa, p, place) {
      const d = doorPos()
      if (p <= P.assembleEnd) {
        // 从门口涌出 → 芽
        const lt = ease(clamp01((p - P.introEnd) / (P.assembleEnd - P.introEnd)))
        const from = { x: d.x + pa.seed.x * 26, y: d.y + pa.seed.y * 40 }
        const to = toScreen(pa.sprout, place.sprout)
        return { x: lerp(from.x, to.x, lt), y: lerp(from.y, to.y, lt), a: lt }
      }
      if (p <= P.sproutHoldEnd) return { ...toScreen(pa.sprout, place.sprout), a: 1 }
      if (p <= P.treeFormEnd) {
        // 芽 → 散开 → 树
        const lt = clamp01((p - P.sproutHoldEnd) / (P.treeFormEnd - P.sproutHoldEnd))
        const a = toScreen(pa.sprout, place.sprout)
        const b = toScreen(pa.tree, place.tree)
        const sc = scatterPos(pa)
        if (lt < 0.5) {
          const k = ease(lt * 2)
          return { x: lerp(a.x, sc.x, k), y: lerp(a.y, sc.y, k), a: 1 }
        }
        const k = ease((lt - 0.5) * 2)
        return { x: lerp(sc.x, b.x, k), y: lerp(sc.y, b.y, k), a: 1 }
      }
      if (p <= P.treeHoldEnd) return { ...toScreen(pa.tree, place.tree), a: 1 }
      if (p <= P.houseFormEnd) {
        // 树 → 散开 → 房子
        const lt = clamp01((p - P.treeHoldEnd) / (P.houseFormEnd - P.treeHoldEnd))
        const a = toScreen(pa.tree, place.tree)
        const b = toScreen(pa.house, place.house)
        const sc = scatterPos(pa)
        if (lt < 0.5) {
          const k = ease(lt * 2)
          return { x: lerp(a.x, sc.x, k), y: lerp(a.y, sc.y, k), a: 1 }
        }
        const k = ease((lt - 0.5) * 2)
        return { x: lerp(sc.x, b.x, k), y: lerp(sc.y, b.y, k), a: 1 }
      }
      return { ...toScreen(pa.house, place.house), a: 1 }
    }

    let raf = 0
    const t0 = performance.now()

    function draw(now) {
      raf = requestAnimationFrame(draw)
      const time = (now - t0) / 1000
      const p = reduce ? 0.9 : progress.current
      const place = placement()

      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'

      if (p < P.introEnd) {
        const d = introDot(p)
        drawDotWithTail(d.x, d.y, d.alpha)
      } else {
        for (let i = 0; i < N; i++) {
          const pa = parts[i]
          const pos = particlePos(pa, p, place)
          let x = pos.x
          let y = pos.y
          if (p > P.houseFormEnd) {
            x += Math.sin(time * 0.6 + i) * 1.5
            y += Math.cos(time * 0.5 + i) * 1.5
          }
          ctx.beginPath()
          ctx.arc(x, y, pa.size, 0, Math.PI * 2)
          ctx.fillStyle = pa.color
          ctx.globalAlpha = (pa.you ? 1 : 0.85) * Math.min(1, pos.a)
          ctx.fill()
          if (pa.you && pos.a > 0.05) {
            ctx.globalAlpha = 0.3 * Math.min(1, pos.a)
            ctx.beginPath()
            ctx.arc(x, y, pa.size * 4, 0, Math.PI * 2)
            ctx.fillStyle = '#ffffff'
            ctx.fill()
          }
          ctx.globalAlpha = 1
        }
      }
    }
    raf = requestAnimationFrame(draw)

    let st
    if (!reduce) {
      st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=4200',
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
      </div>
    </section>
  )
}
