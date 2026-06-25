import SoftAurora from '../components/SoftAurora.jsx'
import BlurText from '../components/BlurText.jsx'
import './Hero.css'

const STARS = [
  { top: '16%', left: '24%', d: 0 },
  { top: '12%', left: '52%', d: 1.2 },
  { top: '22%', left: '68%', d: 0.6 },
  { top: '30%', left: '40%', d: 1.8 },
  { top: '38%', left: '60%', d: 0.9 },
  { top: '18%', left: '82%', d: 2.1 },
  { top: '44%', left: '30%', d: 1.5 },
]

export default function Hero() {
  return (
    <header className="hero">
      <img className="hero-cover" src="/hero.png" alt="夜空下仰望星空的女孩 · 鎏金线插画" />

      <div className="hero-soft" aria-hidden="true">
        <SoftAurora
          speed={0.5}
          scale={1.4}
          brightness={0.9}
          color1="#fde374"
          color2="#8a5fd6"
          bandHeight={0.6}
          bandSpread={0.85}
          layerOffset={1.5}
          enableMouseInteraction={true}
          mouseInfluence={0.2}
        />
      </div>

      <div className="hero-moonglow" aria-hidden="true" />

      <div className="hero-stars" aria-hidden="true">
        {STARS.map((s, i) => (
          <span key={i} className="tw" style={{ top: s.top, left: s.left, animationDelay: `${s.d}s` }} />
        ))}
        <span className="hero-you" />
      </div>

      <nav className="hero-nav">
        <span className="hero-brand">Seren · 林晚声</span>
        <div className="hero-links">
          <a href="#who">我是谁</a>
          <a href="#journey">我和 AI</a>
          <a href="#works">作品集</a>
        </div>
      </nav>

      <div className="hero-center">
        <h1 className="hero-title">
          <BlurText text="Seren’s Cyber World" by="word" stagger={0.34} duration={1.8} />
        </h1>
        <p className="hero-subtitle">
          <BlurText text="林晚声的赛博世界" by="char" delay={1.6} stagger={0.12} duration={1.4} />
        </p>
      </div>

      <a href="#who" className="hero-scroll" aria-label="向下">
        <span className="hero-scroll-arrow">⌄</span>
        <span className="hero-scroll-text">往下，翻开这本书</span>
      </a>
    </header>
  )
}
