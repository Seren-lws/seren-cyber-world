import './ShinyText.css'

// 纯 CSS 版 Shiny Text：一道光带斜扫过文字，循环（中间留停顿）。
export default function ShinyText({
  text,
  speed = 4.5,
  spread = 120,
  color = '#e9d4b8',
  edge = '#caa066',
  shineColor = '#fffaf0',
  className = '',
}) {
  const style = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 34%, ${edge} 44%, ${shineColor} 50%, ${edge} 56%, ${color} 66%, ${color} 100%)`,
    backgroundSize: '220% auto',
    animationDuration: `${speed}s`,
  }
  return (
    <span className={`shiny-text ${className}`} style={style}>
      {text}
    </span>
  )
}
