import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { REBUILD_TRUST_CHIPS } from '../rebuildCopy.js'

/**
 * Compact brand bar + trust chips.
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
      <ul className="cw-rb-header__trust cw-rb-header__chips" aria-label="Product trust">
        {REBUILD_TRUST_CHIPS.map((chip) => (
          <li key={chip}>{chip}</li>
        ))}
      </ul>
    </header>
  )
}
