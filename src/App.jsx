import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Hero from './sections/Hero.jsx'
import IslandScene from './sections/IslandScene.jsx'
import WhoScene from './sections/WhoScene.jsx'
import JourneyScene from './sections/JourneyScene.jsx'

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

    // 暴露给「点击书→金光扩散→翻书页」的转场用
    window.__lenis = lenis

    return () => {
      gsap.ticker.remove(ticker)
      lenis.destroy()
      delete window.__lenis
    }
  }, [])

  return (
    <>
      <Hero />
      <IslandScene />
      <WhoScene />
      <JourneyScene />
    </>
  )
}
