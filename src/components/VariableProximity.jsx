import { useRef, useEffect } from 'react'
import './VariableProximity.css'

// 鼠标靠近时，文字逐字「变粗 + 微微放大」并平滑回弹。
// 中文宋体非可变字体，这里用多档字重 + 缩放近似无级变化，效果一致且稳定。
export default function VariableProximity({
  text,
  containerRef,
  radius = 90,
  fromWeight = 350,
  toWeight = 700,
  fromScale = 1,
  toScale = 1.12,
  className = '',
}) {
  const letterRefs = useRef([])
  const stateRef = useRef([])
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const onMove = (e) => {
      const c = containerRef?.current
      if (!c) return
      const r = c.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    window.addEventListener('mousemove', onMove)

    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const c = containerRef?.current
      if (!c) return
      const cr = c.getBoundingClientRect()
      letterRefs.current.forEach((el, i) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2 - cr.left
        const cy = rect.top + rect.height / 2 - cr.top
        const d = Math.hypot(mouseRef.current.x - cx, mouseRef.current.y - cy)

        let f = 0
        if (d < radius) f = Math.exp(-((d / (radius / 2)) ** 2) / 2)

        const tw = fromWeight + (toWeight - fromWeight) * f
        const ts = fromScale + (toScale - fromScale) * f
        const cur = stateRef.current[i] || (stateRef.current[i] = { w: fromWeight, s: fromScale })
        cur.w += (tw - cur.w) * 0.2
        cur.s += (ts - cur.s) * 0.2

        const w = Math.round(cur.w)
        el.style.fontWeight = w
        el.style.fontVariationSettings = `'wght' ${w}`
        el.style.transform = `scale(${cur.s.toFixed(3)})`
      })
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [containerRef, radius, fromWeight, toWeight, fromScale, toScale])

  const chars = Array.from(text)
  return (
    <span className={`var-prox ${className}`} aria-label={text}>
      {chars.map((ch, i) =>
        ch === ' ' ? (
          <span key={i}>&nbsp;</span>
        ) : (
          <span
            key={i}
            className="var-prox-ch"
            aria-hidden="true"
            ref={(el) => (letterRefs.current[i] = el)}
          >
            {ch}
          </span>
        ),
      )}
    </span>
  )
}
