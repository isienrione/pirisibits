import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { REBUILD_TRUST_STRIP } from '../rebuildCopy.js'

/**
 * Compact sticky brand bar + non-sticky trust line.
 * Emblem + wordmark are a single horizontal unit (never stacked).
 */
export default function RebuildHeader() {
  return (
    <header className="cw-rb-header">
      <div className="cw-rb-header__sticky">
        <div className="cw-rb-header__bar">
          <a href="#top" className="cw-rb-header__brand" aria-label="ChronoWalk home">
            <ChronoWalkLogo size={26} variant="dark" className="cw-rb-header__emblem" />
            <span className="cw-rb-header__name">ChronoWalk</span>
          </a>
        </div>
      </div>
      <p className="cw-rb-header__trust">{REBUILD_TRUST_STRIP}</p>
    </header>
  )
}
