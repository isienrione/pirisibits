import { Link } from 'react-router-dom'
import { JourneyLayout, JourneyPrimaryButton } from './JourneyLayout.jsx'

export default function DayCompleteScreen({
  actTitle,
  actPromise,
  onContinue,
  busy = false,
}) {
  return (
    <JourneyLayout
      eyebrow="Day complete"
      title="The ancient city rests"
      subtitle={actPromise ?? 'Acts I–IV are behind you. The living city waits for another morning.'}
    >
      <p style={{ margin: '20px 0 0', fontSize: 'var(--fs-secondary)', color: 'var(--muted-warm)', lineHeight: 1.5 }}>
        {actTitle ? `You finished ${actTitle}.` : 'You finished the Forum and the market.'} Take the evening.
        Rome keeps your place — Acts V and VI begin when you return.
      </p>

      <div style={{ marginTop: 28 }}>
        <JourneyPrimaryButton onClick={onContinue} disabled={busy}>
          Continue to the living city
        </JourneyPrimaryButton>
      </div>

      <Link
        to="/journal"
        style={{
          display: 'inline-block',
          marginTop: 16,
          marginRight: 16,
          color: 'var(--ember)',
          fontSize: 'var(--fs-secondary)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Open journal
      </Link>

      <Link
        to="/letter"
        style={{
          display: 'inline-block',
          marginTop: 16,
          color: 'var(--ember)',
          fontSize: 'var(--fs-secondary)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Read your letter
      </Link>
    </JourneyLayout>
  )
}
