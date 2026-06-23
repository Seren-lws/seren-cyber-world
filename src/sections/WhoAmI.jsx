import Reveal from '../components/Reveal.jsx'
import LightRays from '../components/LightRays.jsx'
import './WhoAmI.css'

export default function WhoAmI() {
  return (
    <section id="who" className="who">
      <div className="who-rays" aria-hidden="true">
        <LightRays
          raysOrigin="top-left"
          raysColor="#d6c8fb"
          raysSpeed={0.9}
          lightSpread={1.5}
          rayLength={3.1}
          fadeDistance={1.9}
          saturation={1.05}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.06}
          distortion={0.05}
        />
      </div>

      <div className="section who-inner">
        <Reveal stagger={0.16}>
          <p className="eyebrow">Who am I</p>
        </Reveal>

        <Reveal className="who-body" stagger={0.3} duration={0.9} start="top 78%">
          <p className="who-lead">我是林晚声。</p>
          <p>一个 29 岁，定居东京的女生。</p>
          <p>
            一个完全不懂代码的文科生，凭着一腔热爱和执念，
            <span className="who-em">35 天</span>搭了 <span className="who-em">7 个项目</span>、
            <span className="who-em">413 次 commits</span>、最多一天 push 了{' '}
            <span className="who-em">37 次</span>的灵感疯子。
          </p>
          <p>一个觉得创造是人生的大救赎，并且期望通过创造能为他人的世界带来一点改变的理想主义者。</p>
          <p>一个做项目是为了留住点什么的，希望冰冷的代码生出温暖的意义的践行者。</p>
        </Reveal>
      </div>
    </section>
  )
}
