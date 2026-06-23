import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ScrollBackground from './components/ScrollBackground.jsx'
import SoulDot from './components/SoulDot.jsx'
import Hero from './sections/Hero.jsx'
import WhoAmI from './sections/WhoAmI.jsx'
import AIJourney from './sections/AIJourney.jsx'
import Projects from './sections/Projects.jsx'
import Footer from './sections/Footer.jsx'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })

    lenis.on('scroll', ScrollTrigger.update)
    const ticker = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(ticker)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <ScrollBackground />
      <SoulDot />
      <div className="content">
        <Hero />
        <WhoAmI />
        <AIJourney />
        <Projects />
        <Footer />
      </div>
    </>
  )
}
