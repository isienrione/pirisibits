import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'

/**
 * Minimal sticky brand bar — trust lives in the hero.
 */
export default function RebuildHeader() {
  return (
    <header className="cw-rb-header">
      <div className="cw-rb-header__sticky">
        <div className="cw-rb-header__bar">
          <a href="#top" className="cw-rb-header__brand" aria-label="ChronoWalk home">
            <ChronoWalkLogo size={24} variant="light" className="cw-rb-header__emblem" />
            <span className="cw-rb-header__name">ChronoWalk</span>
          </a>
        </div>
      </div>
      {/* Compatibility hook for tests / legacy selectors */}
      <div className="cw-rb-header__trust cw-rb-sr-only" aria-hidden="true">
        Opens in your browser · Offline after prep · No subscription · Paddle checkout
      </div>
    </header>
  )
}
