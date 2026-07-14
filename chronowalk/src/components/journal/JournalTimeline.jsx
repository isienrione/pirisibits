function StatusDot({ status }) {
  const styles = {
    completed: {
      background: 'var(--discovery)',
      border: '2px solid var(--discovery)',
    },
    current: {
      background: 'var(--bone)',
      border: '2px solid var(--discovery)',
      boxShadow: '0 0 0 4px color-mix(in srgb, var(--discovery) 18%, transparent)',
    },
    upcoming: {
      background: 'var(--bone)',
      border: '2px solid color-mix(in srgb, var(--ink) 18%, transparent)',
    },
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        flexShrink: 0,
        ...styles[status],
      }}
    />
  )
}

function TimelineEntry({ entry }) {
  const statusLabel =
    entry.status === 'completed'
      ? 'Completed'
      : entry.status === 'current'
        ? 'Current stop'
        : entry.optional
          ? 'Optional on another path'
          : 'Ahead'

  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '12px 1fr',
        gap: 14,
        alignItems: 'start',
        padding: '10px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
        <StatusDot status={entry.status} />
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h2)',
            lineHeight: 1.2,
            color: entry.status === 'upcoming' ? 'color-mix(in srgb, var(--ink) 72%, var(--bone))' : 'var(--ink)',
          }}
        >
          {entry.title}
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 'var(--fs-meta)',
            color: 'color-mix(in srgb, var(--ink) 55%, var(--bone))',
          }}
        >
          {statusLabel}
        </p>
      </div>
    </li>
  )
}

export default function JournalTimeline({ acts }) {
  return (
    <div style={{ display: 'grid', gap: 28 }}>
      {acts.map((act) => (
        <section key={act.id}>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-caption)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'color-mix(in srgb, var(--ink) 50%, var(--bone))',
            }}
          >
            Act {act.numeral}
          </p>
          <h2
            style={{
              margin: '6px 0 0',
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 500,
              color: 'var(--ink)',
            }}
          >
            {act.title}
          </h2>

          <div
            style={{
              marginTop: 12,
              paddingLeft: 4,
              borderLeft: '2px solid color-mix(in srgb, var(--ink) 12%, var(--bone))',
            }}
          >
            <ul style={{ margin: 0, padding: '0 0 0 18px', listStyle: 'none' }}>
              {act.entries.map((entry) => (
                <TimelineEntry key={entry.id} entry={entry} />
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  )
}
