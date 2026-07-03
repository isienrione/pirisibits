import { JOURNEY_PATH } from '../../data/romePacing.js'
import { JourneyLayout, JourneyPrimaryButton } from './JourneyLayout.jsx'

const PATH_OPTIONS = [
  {
    id: JOURNEY_PATH.A,
    title: 'Through the Forum gate',
    description: 'Titus’ arch first — the triumph route into the Forum.',
  },
  {
    id: JOURNEY_PATH.B,
    title: 'Up the Palatine',
    description: 'Climb the emperors’ hill before the Forum opens below.',
  },
]

export default function PathChoiceScreen({ onChoose, busy = false }) {
  return (
    <JourneyLayout
      eyebrow="Act II fork"
      title="Two doors into ancient Rome"
      subtitle="Choose your path at the piazza. You can still visit the other hill later."
    >
      <div style={{ display: 'grid', gap: 12 }}>
        {PATH_OPTIONS.map((option) => (
          <JourneyPrimaryButton key={option.id} onClick={() => onChoose(option.id)} disabled={busy}>
            <span style={{ display: 'block', fontWeight: 600 }}>{option.title}</span>
            <span
              style={{
                display: 'block',
                marginTop: 6,
                fontSize: 'var(--fs-secondary)',
                fontWeight: 400,
                lineHeight: 1.45,
                opacity: 0.9,
              }}
            >
              {option.description}
            </span>
          </JourneyPrimaryButton>
        ))}
      </div>
    </JourneyLayout>
  )
}
