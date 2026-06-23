import './BlurText.css'

// Blur 进场：文字按词/字拆开，依次从「模糊+下移」聚焦浮现。
export default function BlurText({
  text,
  by = 'word',
  delay = 0,
  stagger = 0.12,
  duration = 0.8,
  className = '',
}) {
  const parts = by === 'char' ? Array.from(text) : text.split(' ')
  return (
    <span className={`blur-text ${className}`} aria-label={text}>
      {parts.map((p, i) => (
        <span key={i}>
          <span
            className="blur-text-part"
            aria-hidden="true"
            style={{
              animationDelay: `${delay + i * stagger}s`,
              animationDuration: `${duration}s`,
            }}
          >
            {p}
          </span>
          {by === 'word' && i < parts.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  )
}
