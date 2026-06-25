import Reveal from '../components/Reveal.jsx'
import './WhoAmI.css'

export default function WhoAmI() {
  return (
    <section id="who" className="whoy">
      <div className="section whoy-inner">
        <Reveal className="whoy-body" stagger={0.28} duration={0.9} start="top 80%">
          <p className="whoy-eyebrow">✦ Who am I</p>
          <p className="whoy-lead">我是林晚声。</p>
          <p>一个 29 岁，定居东京的女生。</p>
          <p>
            一个完全不懂代码的文科生，凭着一腔热爱和执念，
            <span className="whoy-em">35 天</span>搭了 <span className="whoy-em">7 个项目</span>、
            <span className="whoy-em">413 次 commits</span>、最多一天 push 了{' '}
            <span className="whoy-em">37 次</span>的灵感疯子。
          </p>
          <p>一个觉得创造是人生的大救赎，并且期望通过创造能为他人的世界带来一点改变的理想主义者。</p>
          <p>一个做项目是为了留住点什么的，希望冰冷的代码生出温暖的意义的践行者。</p>
        </Reveal>
      </div>
    </section>
  )
}
