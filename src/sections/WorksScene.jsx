import './WorksScene.css'

// 闪烁小星（固定分布，稳定不抖）—— 与「我和AI」同款
const STARS = Array.from({ length: 30 }, (_, i) => ({
  top: (i * 67) % 100,
  left: (i * 41 + 13) % 100,
  s: 1 + (i % 3),
  d: (i % 8) * 0.4,
}))

export default function WorksScene() {
  return (
    <section id="works" className="wk-scene">
      <div className="wk-stars" aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="wk-star"
            style={{ top: `${s.top}%`, left: `${s.left}%`, width: `${s.s}px`, height: `${s.s}px`, animationDelay: `${s.d}s` }}
          />
        ))}
      </div>
    </section>
  )
}
