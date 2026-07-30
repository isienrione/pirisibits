import { Link } from 'react-router-dom'
import { JourneyLayout, JourneyPrimaryButton } from './JourneyLayout.jsx'

export default function RestScreen({ title, subtitle, onResume, busy = false }) {
  return (
    <JourneyLayout eyebrow="Rest" title={title} subtitle={subtitle}>
      <p style={{ margin: '20px 0 0', fontSize: 'var(--fs-secondary)', color: 'var(--muted-warm)', lineHeight: 1.5 }}>
        Find shade. Sit. The Forum can wait - resume when you are ready.
      </p>

      <div style={{ marginTop: 28 }}>
        <JourneyPrimaryButton onClick={onResume} disabled={busy}>
          Resume walking
        </JourneyPrimaryButton>
      </div>

      <Link
        to="/journal"
        style={{
          display: 'inline-block',
          marginTop: 16,
          color: 'var(--ember)',
          fontSize: 'var(--fs-secondary)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Open journal
      </Link>
    </JourneyLayout>
  )
}
