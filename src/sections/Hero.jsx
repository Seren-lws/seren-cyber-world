import Iridescence from '../components/Iridescence.jsx'
import BlurText from '../components/BlurText.jsx'
import './Hero.css'

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-aurora">
        <Iridescence color={[1, 1, 1]} speed={0.7} amplitude={0.3} mouseReact={true} />
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
          <BlurText text="Seren’s Cyber World" by="word" stagger={0.32} duration={1.7} />
        </h1>
        <p className="hero-subtitle">
          <BlurText text="林晚声的赛博世界" by="char" delay={1.3} stagger={0.12} duration={1.4} />
        </p>
      </div>

      <a href="#who" className="hero-scroll" aria-label="向下滚动">
        <span className="hero-scroll-arrow">⌄</span>
        <span className="hero-scroll-text">往下，看看我们一起走过的路</span>
      </a>
    </header>
  )
}
