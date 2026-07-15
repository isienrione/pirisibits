import { useEffect, useRef } from 'react'
import LandingPhoneFrame from './LandingPhoneFrame.jsx'

const ART_WIDTH = 390

/**
 * Fits a full 390×844 app artboard inside the phone frame.
 * Scale is applied in JS — Vite/LightningCSS strips `scale(calc(100cqw / 390px))`.
 */
export default function LandingPhoneViewport({ label, size = 'md', children }) {
  const stageRef = useRef(null)
  const artboardRef = useRef(null)

  useEffect(() => {
    const stage = stageRef.current
    const artboard = artboardRef.current
    if (!stage || !artboard) return undefined

    const syncScale = () => {
      const width = stage.clientWidth
      if (!width) return
      artboard.style.transform = `scale(${width / ART_WIDTH})`
    }

    syncScale()

    if (typeof ResizeObserver === 'undefined') {
      return undefined
    }

    const observer = new ResizeObserver(syncScale)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  return (
    <LandingPhoneFrame label={label} size={size}>
      <div className="cw-landing-phone__stage" ref={stageRef}>
        <div className="cw-landing-phone__artboard" ref={artboardRef}>
          {children}
        </div>
      </div>
    </LandingPhoneFrame>
  )
}
