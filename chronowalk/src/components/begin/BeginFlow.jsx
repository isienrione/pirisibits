import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJourney, useTourManifest } from '../../hooks/useJourney'
import { requestLocationAccess } from '../../lib/locationAccess'
import { track, TRACK_EVENTS } from '../../lib/track'
import { getDaySummaries, getFirstWaypointIndexForDay } from '../../lib/tour'

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

function DaySelectView({ days, selectedDay, onSelectDay, onContinue }) {
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
        }}
      >
        Which day of Rome?
      </h1>
      <p style={{ marginTop: 12, fontSize: 'var(--fs-secondary)', lineHeight: 1.55, color: 'var(--muted-warm)' }}>
        Two walks. Pick the day you are starting today — you can return for the other anytime.
      </p>

      <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
        {days.map((day) => {
          const selected = selectedDay === day.day

          return (
            <button
              key={day.day}
              type="button"
              onClick={() => onSelectDay(day.day)}
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
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: selected ? 'var(--ember)' : 'var(--muted-warm)',
                }}
              >
                Day {day.day}
              </span>
              <span
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 500,
                }}
              >
                {day.title}
              </span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
                {day.stopCount} stops · starts at {day.start}
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!selectedDay}
        style={{
          marginTop: 28,
          width: '100%',
          padding: '16px 20px',
          border: 'none',
          borderRadius: 999,
          background: selectedDay ? 'var(--accent)' : 'color-mix(in srgb, var(--muted-warm) 35%, var(--ink))',
          color: selectedDay ? 'var(--bone)' : 'var(--muted-warm)',
          fontSize: 'var(--fs-body)',
          fontWeight: 600,
          cursor: selectedDay ? 'pointer' : 'not-allowed',
        }}
      >
        Continue
      </button>
    </BeginShell>
  )
}

function LocationPromptView({ day, onEnable, onSkip, busy }) {
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
        Day {day.day} · {day.title}
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
  const { manifest, loading, error } = useTourManifest()
  const [step, setStep] = useState('day')
  const [selectedDay, setSelectedDay] = useState(null)
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <BeginShell>
        <p style={{ margin: 0, color: 'var(--muted-warm)' }}>Loading Rome…</p>
      </BeginShell>
    )
  }

  if (error || !manifest) {
    return (
      <BeginShell>
        <p style={{ margin: 0, color: '#e88a8a' }}>Could not load the Rome tour. Try again shortly.</p>
      </BeginShell>
    )
  }

  const days = getDaySummaries(manifest)
  const activeDay = days.find((day) => day.day === selectedDay)

  const startJourney = () => {
    const waypointIndex = getFirstWaypointIndexForDay(manifest, selectedDay)
    begin({ dayNumber: selectedDay, waypointIndex })
    track(TRACK_EVENTS.JOURNEY_BEGIN, { day_number: selectedDay, waypoint_index: waypointIndex })
    navigate('/journey', { replace: true })
  }

  const handleEnableLocation = async () => {
    setBusy(true)
    await requestLocationAccess()
    setBusy(false)
    startJourney()
  }

  if (step === 'location' && activeDay) {
    return (
      <LocationPromptView
        day={activeDay}
        busy={busy}
        onEnable={handleEnableLocation}
        onSkip={startJourney}
      />
    )
  }

  return (
    <DaySelectView
      days={days}
      selectedDay={selectedDay}
      onSelectDay={setSelectedDay}
      onContinue={() => {
        if (!selectedDay) return
        setStep('location')
      }}
    />
  )
}
