/**
 * Modern iPhone-style device frame for landing showcase mockups.
 * Slim bezel + Dynamic Island — not a capsule cartoon.
 */
export default function LandingPhoneFrame({ label, children }) {
  return (
    <div className="cw-landing-phone" aria-label={label}>
      <div className="cw-landing-phone__shell">
        <div className="cw-landing-phone__island" aria-hidden>
          <span className="cw-landing-phone__island-lens" />
        </div>
        <div className="cw-landing-phone__screen">{children}</div>
      </div>
    </div>
  )
}
