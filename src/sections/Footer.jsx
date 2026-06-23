import Reveal from '../components/Reveal.jsx'
import './Footer.css'

export default function Footer() {
  return (
    <footer id="contact" className="footer">
      <Reveal className="footer-inner" stagger={0.13}>
        <p className="footer-line">夜还长，故事才刚开始。</p>
        <p className="footer-sub">如果你也喜欢这个赛博世界，来找我聊聊。</p>
        <div className="footer-links">
          <a href="https://github.com/Seren-lws" target="_blank" rel="noreferrer">GitHub</a>
          <span className="footer-sep">·</span>
          <a href="mailto:zhangtongtong37@gmail.com">Email</a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} 林晚声 · Seren&rsquo;s Cyber World</p>
      </Reveal>
    </footer>
  )
}
