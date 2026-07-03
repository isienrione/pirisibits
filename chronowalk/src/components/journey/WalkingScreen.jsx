import { JourneyLayout, JourneyPrimaryButton, JourneySecondaryButton } from './JourneyLayout.jsx'

export default function WalkingScreen({
  title,
  subtitle,
  distance,
  onSimulateArrival,
  onContinue,
  continueLabel = 'Continue',
  showContinue = false,
  busy = false,
}) {
  const distanceLabel =
    distance != null ? `${Math.round(distance)} m away` : 'Finding your position…'

  return (
    <JourneyLayout eyebrow="Walking" title={title} subtitle={subtitle}>
      <p style={{ margin: 0, fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>{distanceLabel}</p>

      {showContinue ? (
        <div style={{ marginTop: 28 }}>
          <JourneyPrimaryButton onClick={onContinue} disabled={busy}>
            {continueLabel}
          </JourneyPrimaryButton>
        </div>
      ) : null}

      {onSimulateArrival ? (
        <JourneySecondaryButton onClick={onSimulateArrival} disabled={busy}>
          I&apos;ve arrived
        </JourneySecondaryButton>
      ) : null}
    </JourneyLayout>
  )
}
