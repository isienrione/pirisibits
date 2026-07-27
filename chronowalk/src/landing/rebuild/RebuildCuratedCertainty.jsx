import { REBUILD_CURATED } from '../rebuildCopy.js'

const COLUMNS = [
  {
    title: 'Essential places',
    body: 'ChronoWalk gathers the landmarks that matter most for understanding Rome’s continuous story.',
  },
  {
    title: 'A route between them',
    body: 'Follow a suggested journey when you want certainty, or choose another stop when Rome pulls you elsewhere.',
  },
  {
    title: 'The story that connects them',
    body: 'Narration and Then vs Now reconstructions tie each place to the next—without locking your day to a fixed schedule.',
  },
]

/**
 * Curated certainty — text-only three-column/step visual (no third-party logos).
 */
export default function RebuildCuratedCertainty() {
  const copy = REBUILD_CURATED

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-curated cw-rb-surface--light"
      aria-labelledby="curated-certainty-heading"
    >
      <div className="cw-rb-wrap">
        <header>
          <h2 id="curated-certainty-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.body}</p>
        </header>

        <div className="cw-rb-curated__columns">
          {COLUMNS.map((col) => (
            <div key={col.title} className="cw-rb-curated__col">
              <h3 className="cw-rb-curated__col-title">{col.title}</h3>
              <p className="cw-rb-curated__col-body">{col.body}</p>
            </div>
          ))}
        </div>

        <p className="cw-rb-curated__secondary">{copy.secondary}</p>
      </div>
    </section>
  )
}
