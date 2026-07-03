import { JourneyLayout } from './JourneyLayout.jsx'

export default function ApproachingScreen({ waypointName, approachLine, distance }) {
  return (
    <JourneyLayout
      eyebrow="Approaching"
      title={waypointName}
      subtitle={approachLine}
    >
      {distance != null ? (
        <p style={{ margin: 0, fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
          {Math.round(distance)} m away
        </p>
      ) : null}
    </JourneyLayout>
  )
}
