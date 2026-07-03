import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  JOURNEY_PACE,
  PACE_OPTIONS,
  PACE_ORIENTATION,
  getPaceOption,
} from '../../data/romePacing'
import { useJourney } from '../../hooks/useJourney'
import { requestLocationAccess } from '../../lib/locationAccess'
import { track, TRACK_EVENTS } from '../../lib/track'

function BeginShell({ children }) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        padding:
          'max(var(--edge), env(safe-area-inset-top)) var(--edge) max(var(--edge), env(safe-area-inset-bottom))',
        background: 'var(--obsidian)',
        color: 'var(--warm-white)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>{children}</div>
    </main>
  )
}

function PaceSelectView({ selectedPace, onSelectPace, onContinue }) {
  return (
    <BeginShell>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted-warm)',
        }}
      >
        Begin journey
      </p>
      <h1
        style={{
          margin: '8px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-title)',
          fontWeight: 500,
          lineHeight: 1.15,
          fontStyle: 'italic',
        }}
      >
        Rome is yours. How do you want to take it?
      </h1>

      <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
        {PACE_OPTIONS.map((option) => {
          const selected = selectedPace === option.id

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectPace(option.id)}
              style={{
                width: '100%',
                padding: '16px 18px',
                borderRadius: 16,
                border: selected
                  ? '1px solid color-mix(in srgb, var(--city-rome) 65%, transparent)'
                  : '1px solid color-mix(in srgb, var(--warm-white) 12%, transparent)',
                background: selected
                  ? 'linear-gradient(135deg, color-mix(in srgb, var(--city-rome) 24%, var(--ink)) 0%, color-mix(in srgb, var(--city-rome) 10%, var(--obsidian)) 100%)'
                  : 'color-mix(in srgb, var(--ink) 55%, transparent)',
                color: 'var(--warm-white)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 500,
                  }}
                >
                  {option.title}
                </span>
                {option.badge ? (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'color-mix(in srgb, var(--ember) 22%, transparent)',
                      color: 'var(--ember)',
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {option.badge}
                  </span>
                ) : null}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 8,
                  fontSize: 'var(--fs-secondary)',
                  lineHeight: 1.5,
                  color: 'var(--muted-warm)',
                }}
              >
                {option.description}
              </span>
            </button>
          )
        })}
      </div>

      <p
        style={{
          marginTop: 20,
          fontSize: 'var(--fs-meta)',
          lineHeight: 1.55,
          color: 'var(--muted-warm)',
          fontStyle: 'italic',
        }}
      >
        {PACE_ORIENTATION}
      </p>

      <button
        type="button"
        onClick={onContinue}
        style={{
          marginTop: 24,
          width: '100%',
          padding: '16px 20px',
          border: 'none',
          borderRadius: 999,
          background: 'var(--accent)',
          color: 'var(--bone)',
          fontSize: 'var(--fs-body)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Continue
      </button>
    </BeginShell>
  )
}

function LocationPromptView({ pace, onEnable, onSkip, busy }) {
  return (
    <BeginShell>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted-warm)',
        }}
      >
        {pace.title}
      </p>
      <h1
        style={{
          margin: '8px 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-title)',
          fontWeight: 500,
          lineHeight: 1.15,
        }}
      >
        Enable location for GPS guidance
      </h1>
      <p style={{ marginTop: 12, fontSize: 'var(--fs-secondary)', lineHeight: 1.55, color: 'var(--muted-warm)' }}>
        ChronoWalk uses your location only while the tour is active — to detect arrivals and guide you
        between stops.
      </p>

      <ul
        style={{
          margin: '24px 0 0',
          padding: 0,
          listStyle: 'none',
          display: 'grid',
          gap: 10,
          fontSize: 'var(--fs-secondary)',
          color: 'var(--muted-warm)',
        }}
      >
        <li>Stories unlock when you reach each landmark</li>
        <li>Walking directions stay in sync with your position</li>
        <li>You can pause or change this anytime in Settings</li>
      </ul>

      <button
        type="button"
        onClick={onEnable}
        disabled={busy}
        style={{
          marginTop: 28,
          width: '100%',
          padding: '16px 20px',
          border: 'none',
          borderRadius: 999,
          background: 'var(--accent)',
          color: 'var(--bone)',
          fontSize: 'var(--fs-body)',
          fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {busy ? 'Requesting access…' : 'Enable location & start'}
      </button>

      <button
        type="button"
        onClick={onSkip}
        disabled={busy}
        style={{
          marginTop: 12,
          width: '100%',
          padding: '14px 18px',
          border: 'none',
          borderRadius: 999,
          background: 'transparent',
          color: 'var(--muted-warm)',
          fontSize: 'var(--fs-secondary)',
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        Continue without enabling
      </button>
    </BeginShell>
  )
}

export default function BeginFlow() {
  const navigate = useNavigate()
  const { begin } = useJourney()
  const [step, setStep] = useState('pace')
  const [selectedPace, setSelectedPace] = useState(JOURNEY_PACE.CLASSIC)
  const [busy, setBusy] = useState(false)

  const activePace = getPaceOption(selectedPace)

  const startJourney = () => {
    begin({ pace: selectedPace, waypointIndex: 0 })
    track(TRACK_EVENTS.JOURNEY_BEGIN, { pace: selectedPace, waypoint_index: 0 })
    navigate('/journey', { replace: true })
  }

  const handleEnableLocation = async () => {
    setBusy(true)
    await requestLocationAccess()
    setBusy(false)
    startJourney()
  }

  if (step === 'location') {
    return (
      <LocationPromptView
        pace={activePace}
        busy={busy}
        onEnable={handleEnableLocation}
        onSkip={startJourney}
      />
    )
  }

  return (
    <PaceSelectView
      selectedPace={selectedPace}
      onSelectPace={setSelectedPace}
      onContinue={() => setStep('location')}
    />
  )
}
