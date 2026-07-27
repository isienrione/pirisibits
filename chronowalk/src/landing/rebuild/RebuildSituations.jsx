import { REBUILD_SITUATIONS } from '../rebuildCopy.js'

/**
 * Situation chips — interactive cards for day-type selection.
 * @param {{ onAction?: (actionId: string) => void }} props
 */
export default function RebuildSituations({ onAction }) {
  const copy = REBUILD_SITUATIONS

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-situations cw-rb-surface--light"
      aria-labelledby="situations-heading"
    >
      <div className="cw-rb-wrap">
        <header>
          <h2 id="situations-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
        </header>

        <ul className="cw-rb-situations__grid">
          {copy.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="cw-rb-situations__chip"
                onClick={() => onAction?.(item.action)}
              >
                <span className="cw-rb-situations__chip-title">{item.title}</span>
                <span className="cw-rb-situations__chip-support">{item.support}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="cw-rb-situations__note">{copy.ticketNote}</p>
      </div>
    </section>
  )
}
