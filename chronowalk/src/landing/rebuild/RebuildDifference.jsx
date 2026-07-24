import { REBUILD_DIFFERENCE } from '../rebuildCopy.js'

/**
 * Comparison table — typical guides vs ChronoWalk.
 */
export default function RebuildDifference() {
  const copy = REBUILD_DIFFERENCE

  return (
    <section
      id="difference"
      className="cw-rb-section cw-rb-diff cw-rb-surface--light"
      aria-labelledby="difference-heading"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <header>
          <h2 id="difference-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
        </header>

        <table className="cw-rb-diff__table">
          <caption className="cw-rb-sr-only">Typical audio guides compared with ChronoWalk</caption>
          <thead>
            <tr>
              <th scope="col">Typical</th>
              <th scope="col">ChronoWalk</th>
            </tr>
          </thead>
          <tbody>
            {copy.rows.map((row) => (
              <tr key={row.chronowalk}>
                <td>{row.typical}</td>
                <td>{row.chronowalk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
