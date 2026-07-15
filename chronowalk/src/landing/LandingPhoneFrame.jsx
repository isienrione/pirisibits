/**
 * Realistic iPhone Pro–style device frame for landing showcase mockups.
 * Titanium edge, hardware buttons, Dynamic Island, home indicator.
 */
export default function LandingPhoneFrame({ label, children, size = 'md' }) {
  return (
    <div className={`cw-landing-phone cw-landing-phone--${size}`} aria-label={label}>
      <div className="cw-landing-phone__shell">
        <span className="cw-landing-phone__btn cw-landing-phone__btn--silent" aria-hidden />
        <span className="cw-landing-phone__btn cw-landing-phone__btn--vol-up" aria-hidden />
        <span className="cw-landing-phone__btn cw-landing-phone__btn--vol-down" aria-hidden />
        <span className="cw-landing-phone__btn cw-landing-phone__btn--power" aria-hidden />

        <div className="cw-landing-phone__bezel">
          <div className="cw-landing-phone__island" aria-hidden>
            <span className="cw-landing-phone__island-lens" />
            <span className="cw-landing-phone__island-mic" />
          </div>
          <div className="cw-landing-phone__screen">{children}</div>
          <span className="cw-landing-phone__home" aria-hidden />
        </div>
      </div>
    </div>
  )
}
