/**
 * Landing-only chrome around the walking companion - matches the photo-5
 * map guidance scene (audio tip + shell tabs) without changing product UI.
 */
export default function LandingDemoWalkShell({ children }) {
  return (
    <div className="cw-v4-walk-shell" data-testid="landing-demo-walk-shell">
      <div className="cw-v4-walk-shell__stage">{children}</div>

      <div className="cw-v4-walk-shell__audio-tip" aria-hidden>
        <span className="cw-v4-walk-shell__audio-icon" aria-hidden>
          ♪
        </span>
        <p>
          The chapter is ready when you arrive at the stop
          <span className="cw-v4-walk-shell__audio-link"> Learn more ›</span>
        </p>
      </div>

      <nav className="cw-v4-walk-shell__tabs" aria-hidden>
        <span>My tour</span>
        <span>Stops</span>
        <span className="is-active">Map</span>
        <span>Journal</span>
      </nav>
    </div>
  )
}
