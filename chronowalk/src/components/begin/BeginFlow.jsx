import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  JOURNEY_PACE,
  PACE_OPTIONS,
  PACE_ORIENTATION,
  getPaceOption,
} from '../../data/romePacing'
import { useV2Journey } from '../../hooks/useV2Journey'
import { requestLocationAccess } from '../../lib/locationAccess'
import { track, TRACK_EVENTS } from '../../lib/track'

function ResumePromptView({ onContinue, onStartFresh }) {
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
        Welcome back
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
        Rome kept your place
      </h1>
      <p style={{ marginTop: 12, fontSize: 'var(--fs-secondary)', lineHeight: 1.55, color: 'var(--muted-warm)' }}>
        Pick up where you left off, or begin again from the Colosseum.
      </p>

      <button
        type="button"
        onClick={onContinue}
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
          cursor: 'pointer',
        }}
      >
        Continue your walk
      </button>

      <button
        type="button"
        onClick={onStartFresh}
        style={{
          marginTop: 12,
          width: '100%',
          padding: '14px 18px',
          border: 'none',
          borderRadius: 999,
          background: 'transparent',
          color: 'var(--muted-warm)',
          fontSize: 'var(--fs-secondary)',
          cursor: 'pointer',
        }}
      >
        Start fresh
      </button>
    </BeginShell>
  )
}

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
                  ? 'color-mix(in srgb, var(--city-rome) 18%, var(--obsidian))'
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

function LocationPromptView({ pace, onEnable, onSkip, onContinueAnyway, busy, locationDenied = false }) {
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
        {locationDenied ? 'Location access is off' : 'Enable location for GPS guidance'}
      </h1>
      <p style={{ marginTop: 12, fontSize: 'var(--fs-secondary)', lineHeight: 1.55, color: 'var(--muted-warm)' }}>
        {locationDenied
          ? 'You can still walk Rome, but arrivals will not auto-detect until location is enabled for this site in your browser settings.'
          : 'ChronoWalk uses your location only while the tour is active · to detect arrivals and guide you between stops.'}
      </p>

      {!locationDenied ? (
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
      ) : (
        <p style={{ marginTop: 20, fontSize: 'var(--fs-secondary)', lineHeight: 1.55, color: 'var(--muted-warm)' }}>
          Use the map for bearings, or tap &ldquo;I&apos;ve arrived&rdquo; at each stop when you are there.
        </p>
      )}

      {locationDenied ? (
        <button
          type="button"
          onClick={onContinueAnyway}
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
          Continue without location
        </button>
      ) : (
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
      )}

      {!locationDenied ? (
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
      ) : (
        <button
          type="button"
          onClick={onEnable}
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
          {busy ? 'Requesting access…' : 'Try location again'}
        </button>
      )}
    </BeginShell>
  )
}

export default function BeginFlow() {
  const navigate = useNavigate()
  const { begin, resume, reset, isResumable } = useV2Journey()
  const [step, setStep] = useState(() => (isResumable ? 'resume' : 'pace'))
  const [selectedPace, setSelectedPace] = useState(JOURNEY_PACE.CLASSIC)
  const [busy, setBusy] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)

  const activePace = getPaceOption(selectedPace)

  const startJourney = () => {
    begin({ pace: selectedPace, waypointIndex: 0 })
    track(TRACK_EVENTS.JOURNEY_BEGIN, { pace: selectedPace, waypoint_index: 0 })
    navigate('/journey', { replace: true })
  }

  const handleContinueWalk = () => {
    resume()
    track(TRACK_EVENTS.RESUME, { source: 'begin_flow' })
    navigate('/journey', { replace: true })
  }

  const handleStartFresh = () => {
    reset()
    setStep('pace')
  }

  const handleEnableLocation = async () => {
    setBusy(true)
    const result = await requestLocationAccess()
    setBusy(false)

    if (result === 'granted') {
      setLocationDenied(false)
      startJourney()
      return
    }

    setLocationDenied(true)
    track(TRACK_EVENTS.GPS_FALLBACK_USED, { source: 'begin_flow', result })
  }

  if (step === 'resume') {
    return <ResumePromptView onContinue={handleContinueWalk} onStartFresh={handleStartFresh} />
  }

  if (step === 'location') {
    return (
      <LocationPromptView
        pace={activePace}
        busy={busy}
        locationDenied={locationDenied}
        onEnable={handleEnableLocation}
        onSkip={startJourney}
        onContinueAnyway={startJourney}
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
