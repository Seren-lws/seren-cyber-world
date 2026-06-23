import { useState } from 'react'
import { projects } from '../data/projects.js'
import Reveal from '../components/Reveal.jsx'
import './Projects.css'

const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Projects() {
  const [active, setActive] = useState(null)
  const sel = projects.find((p) => p.id === active)

  return (
    <section id="works" className="section works">
      <Reveal stagger={0.14}>
        <p className="eyebrow">Works</p>
        <h2 className="section-title">项目作品集</h2>
        <p className="works-lead">两个月里，和 AI 一起搭出的 7 个小世界 —— 它们都绕着我转。</p>
      </Reveal>

      <Reveal y={56} duration={1.2}>
      {reduce ? (
        <div className="works-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="orbit-stage">
          <div className="orbit">
            {projects.map((p, i) => (
              <div
                key={p.id}
                className="orbit-item"
                style={{ '--a': `${(360 / projects.length) * i}deg` }}
              >
                <div className="tile-pos">
                  <div className="tile-spin">
                    <button
                      className={`tile ${active === p.id ? 'is-active' : ''}`}
                      onClick={() => setActive(active === p.id ? null : p.id)}
                      aria-label={p.name}
                    >
                      <span className="tile-icon">{p.icon}</span>
                      <span className="tile-name">{p.name}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="orbit-core">
            <span className="orbit-core-dot" />
            <span className="orbit-core-text">我</span>
          </div>
        </div>
      )}
      </Reveal>

      {sel && (
        <div className="work-detail">
          <div className="work-detail-card">
            <span className="work-detail-icon">{sel.icon}</span>
            <div className="work-detail-body">
              <h3>{sel.name}</h3>
              <p className="work-detail-zh">{sel.zh}</p>
              <p className="work-detail-tag">{sel.tagline}</p>
              <a className="work-detail-link" href={sel.url} target="_blank" rel="noreferrer">
                去看看 →
              </a>
            </div>
            <button className="work-detail-close" onClick={() => setActive(null)} aria-label="关闭">
              ×
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function ProjectCard({ p }) {
  return (
    <a className="work-card" href={p.url} target="_blank" rel="noreferrer">
      <span className="tile-icon">{p.icon}</span>
      <h3>{p.name}</h3>
      <p>{p.tagline}</p>
    </a>
  )
}
