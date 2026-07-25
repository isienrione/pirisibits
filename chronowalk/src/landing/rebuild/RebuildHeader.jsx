import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'

/**
 * Overlay header — logo only; brand wordmark lives in the hero.
 */
export default function RebuildHeader() {
  return (
    <header className="cw-rb-header">
      <div className="cw-rb-header__inner">
        <a href="#top" className="cw-rb-header__brand" aria-label="ChronoWalk home">
          <ChronoWalkLogo size={28} variant="dark" className="cw-rb-header__emblem" />
        </a>
      </div>
    </header>
  )
}
