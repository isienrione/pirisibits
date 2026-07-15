import LandingPhoneFrame from './LandingPhoneFrame.jsx'

/**
 * Fits a full 390×844 app artboard inside the phone frame.
 * Content is authored at phone pixels, then scaled to the shell width.
 */
export default function LandingPhoneViewport({ label, size = 'md', children }) {
  return (
    <LandingPhoneFrame label={label} size={size}>
      <div className="cw-landing-phone__stage">
        <div className="cw-landing-phone__artboard">{children}</div>
      </div>
    </LandingPhoneFrame>
  )
}
