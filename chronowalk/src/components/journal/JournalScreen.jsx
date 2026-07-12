import { Link } from 'react-router-dom'
import {
  buildJournalTimeline,
  journalHeadline,
  pickJournalReflection,
  summarizeJournalProgress,
} from '../../content/journalTimeline.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { useV2Journey, useTourManifest } from '../../hooks/useV2Journey.js'
import JournalTimeline from './JournalTimeline.jsx'

function JournalLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        padding:
          'max(var(--edge), env(safe-area-inset-top)) var(--edge) max(var(--edge), env(safe-area-inset-bottom))',
        background: 'var(--bone)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>
        {eyebrow ? (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-caption)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'color-mix(in srgb, var(--ink) 45%, var(--bone))',
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h1
            style={{
              margin: eyebrow ? '8px 0 0' : 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-title)',
              fontWeight: 500,
              lineHeight: 1.15,
              color: 'var(--ink)',
            }}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p
            style={{
              marginTop: 12,
              fontSize: 'var(--fs-reflect)',
              lineHeight: 1.55,
              color: 'color-mix(in srgb, var(--ink) 68%, var(--bone))',
              fontStyle: 'italic',
            }}
          >
            {subtitle}
          </p>
        ) : null}
        <div style={{ marginTop: 28 }}>{children}</div>
        {footer ? <div style={{ marginTop: 32 }}>{footer}</div> : null}
      </div>
    </main>
  )
}

export default function JournalScreen() {
  const { state, context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()

  if (loading) {
    return <JournalLayout eyebrow="Journal" title="Gathering your path…" />
  }

  if (error || !manifest) {
    return (
      <JournalLayout
        eyebrow="Journal"
        title="Journal unavailable"
        subtitle={error?.message ?? 'Manifest did not load.'}
      />
    )
  }

  const timeline = buildJournalTimeline(manifest, {
    path: context.path,
    sequenceIndex: context.currentSequenceIndex,
    completedWaypointIds: context.completedWaypointIds,
  })
  const summary = summarizeJournalProgress(timeline)
  const reflection = pickJournalReflection(manifest, summary.completed)
  const title = journalHeadline(summary)

  return (
    <JournalLayout eyebrow="Journal" title={title} subtitle={reflection}>
      <p
        className="num"
        style={{
          margin: '0 0 20px',
          fontSize: 'var(--fs-meta)',
          color: 'color-mix(in srgb, var(--ink) 55%, var(--bone))',
        }}
      >
        {summary.completed} of {summary.total} stops heard
      </p>

      <JournalTimeline acts={timeline} />

      <div style={{ display: 'grid', gap: 12 }}>
        {state !== JOURNEY_STATES.IDLE ? (
          <Link
            to="/journey"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px 20px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--bone)',
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Return to walk
          </Link>
        ) : (
          <Link
            to="/begin"
            style={{
              display: 'block',
              width: '100%',
              padding: '16px 20px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--bone)',
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Begin journey
          </Link>
        )}

        <Link
          to="/map"
          style={{
            display: 'block',
            textAlign: 'center',
            color: 'color-mix(in srgb, var(--ink) 60%, var(--bone))',
            fontSize: 'var(--fs-secondary)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Open map
        </Link>

        <Link
          to="/letter"
          style={{
            display: 'block',
            textAlign: 'center',
            color: 'color-mix(in srgb, var(--ink) 60%, var(--bone))',
            fontSize: 'var(--fs-secondary)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Open letter
        </Link>
      </div>
    </JournalLayout>
  )
}
