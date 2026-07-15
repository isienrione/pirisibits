/**
 * CSS-only iPhone-style device frame for landing showcase mockups.
 */
export default function LandingPhoneFrame({ label, children }) {
  return (
    <div className="cw-landing-phone" aria-label={label}>
      <div className="cw-landing-phone__shell">
        <div className="cw-landing-phone__notch" aria-hidden />
        <div className="cw-landing-phone__screen">{children}</div>
        <div className="cw-landing-phone__bar" aria-hidden />
      </div>
    </div>
  )
}
