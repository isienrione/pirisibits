import LandingPhoneFrame from './LandingPhoneFrame.jsx'

/** Fits a full 390×844 app screen inside the landing phone frame. */
export default function LandingPhoneViewport({ label, children }) {
  return (
    <LandingPhoneFrame label={label}>
      <div className="cw-landing-phone__screen cw-landing-phone__screen--live">
        <div className="cw-landing-phone__viewport">{children}</div>
      </div>
    </LandingPhoneFrame>
  )
}
