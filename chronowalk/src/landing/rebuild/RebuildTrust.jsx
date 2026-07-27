import { REBUILD_TRUST } from '../rebuildCopy.js'

/** Section 7 — elegant trust cards. */
export default function RebuildTrust() {
  const copy = REBUILD_TRUST

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-trust-cards cw-rb-surface--light"
      aria-labelledby="trust-heading"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <h2 id="trust-heading" className="cw-rb-title">
          {copy.headline}
        </h2>
        <ul className="cw-rb-trust-cards__grid">
          {copy.cards.map((card) => (
            <li key={card.title} className="cw-rb-trust-cards__card">
              <h3>{card.title}</h3>
              {card.body ? <p>{card.body}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
