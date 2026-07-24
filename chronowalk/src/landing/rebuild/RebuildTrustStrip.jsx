import { REBUILD_TRUST_STRIP } from '../rebuildCopy.js'

export default function RebuildTrustStrip() {
  return (
    <aside className="cw-rb-trust" aria-label="Product trust points">
      <ul className="cw-rb-trust__list cw-rb-wrap">
        {REBUILD_TRUST_STRIP.map((item) => (
          <li key={item} className="cw-rb-trust__item">
            {item}
          </li>
        ))}
      </ul>
    </aside>
  )
}
