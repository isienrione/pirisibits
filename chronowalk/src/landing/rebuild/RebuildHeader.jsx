import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'

/**
 * Compact rebuild header — logo + ChronoWalk wordmark only (no CTA).
 */
export default function RebuildHeader() {
  return (
    <header className="cw-rb-header cw-rb-surface--dark">
      <div className="cw-rb-header__inner">
        <a href="#top" className="cw-rb-header__brand" aria-label="ChronoWalk home">
          <ChronoWalkLogo size={32} variant="dark" className="cw-rb-header__emblem" />
          <span className="cw-rb-header__name">ChronoWalk</span>
        </a>
      </div>
    </header>
  )
}
