import LandingPhoneFrame from '../LandingPhoneFrame.jsx'
import usePhoneArtboardScale from './usePhoneArtboardScale.js'

/**
 * iPhone frame that scales real 390×844 product UI to fill the bezel exactly.
 */
export default function LandingProductPhoneFrame({ label = 'ChronoWalk product demo', children }) {
  const { screenRef, scale } = usePhoneArtboardScale()

  return (
    <LandingPhoneFrame label={label} size="xl">
      <div ref={screenRef} className="cw-v4-phone-screen">
        <div
          className="cw-v4-phone-artboard"
          style={{ transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </LandingPhoneFrame>
  )
}
