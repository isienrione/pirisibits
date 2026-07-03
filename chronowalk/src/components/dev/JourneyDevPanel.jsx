import { useState } from 'react'
import { isDevPanelEnabled } from '../../config/env.js'
import { grantAccess, revokeAccess } from '../../lib/config'
import { useJourney, useTourManifest } from '../../hooks/useJourney'
import { useJourneyStep } from '../../hooks/useJourneyStep'
import { buildEffectiveSequence } from '../../content/optionalPromotion.js'
import { JOURNEY_STATES } from '../../state/journey'
import { readDevSimulateGps, setDevSimulateGps } from './devTools.js'

const STATE_BUTTONS = Object.values(JOURNEY_STATES)

export default function JourneyDevPanel() {
  const { state, context, transition, reset, begin, jumpToSequence, states } = useJourney()
  const { manifest } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds
  )
  const [sequenceInput, setSequenceInput] = useState(String(context.currentSequenceIndex))
  const [simulateGps, setSimulateGps] = useState(readDevSimulateGps)

  if (!isDevPanelEnabled()) return null

  const sequence = manifest
    ? buildEffectiveSequence(manifest, context.path, context.promotedOptionalIds)
    : []
  const maxSequenceIndex = Math.max(0, sequence.length - 1)

  const currentLabel =
    step?.type === 'waypoint'
      ? step.record?.title ?? step.id
      : step?.type === 'transit'
        ? `Transit ${step.id}`
        : '—'

  const handleJump = () => {
    const parsed = Number.parseInt(sequenceInput, 10)
    if (Number.isNaN(parsed)) return
    jumpToSequence(Math.min(Math.max(0, parsed), maxSequenceIndex))
  }

  const handleToggleSimulateGps = () => {
    const next = !simulateGps
    setSimulateGps(next)
    setDevSimulateGps(next)
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 8,
        bottom: 96,
        zIndex: 9999,
        width: 'min(92vw, 18rem)',
        padding: 12,
        borderRadius: 'var(--r-card)',
        background: 'color-mix(in srgb, var(--ink) 92%, transparent)',
        border: '1px solid color-mix(in srgb, var(--ember) 35%, transparent)',
        color: 'var(--warm-white)',
        fontSize: 'var(--fs-meta)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <p style={{ margin: 0, fontWeight: 600 }}>Journey dev panel</p>
      <p style={{ margin: '6px 0 0', opacity: 0.8 }}>
        State: <strong>{state}</strong>
      </p>
      <p style={{ margin: '4px 0 0', opacity: 0.8 }}>
        Step: <strong>{currentLabel}</strong> (seq {context.currentSequenceIndex}, path {context.path})
      </p>

      <div style={{ marginTop: 10 }}>
        <label style={{ display: 'block', marginBottom: 4, opacity: 0.85 }}>
          Jump to sequence (0–{maxSequenceIndex})
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="number"
            min={0}
            max={maxSequenceIndex}
            value={sequenceInput}
            onChange={(event) => setSequenceInput(event.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid color-mix(in srgb, var(--warm-white) 25%, transparent)',
              background: 'color-mix(in srgb, var(--ink) 70%, transparent)',
              color: 'var(--warm-white)',
            }}
          />
          <button type="button" onClick={handleJump}>
            Jump
          </button>
        </div>
        {sequence[Number.parseInt(sequenceInput, 10)] ? (
          <p style={{ margin: '4px 0 0', opacity: 0.7 }}>
            → {sequence[Number.parseInt(sequenceInput, 10)]}
          </p>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {STATE_BUTTONS.map((nextState) => (
          <button
            key={nextState}
            type="button"
            onClick={() => transition(nextState)}
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: '1px solid color-mix(in srgb, var(--warm-white) 25%, transparent)',
              background:
                state === nextState
                  ? 'color-mix(in srgb, var(--ember) 35%, transparent)'
                  : 'transparent',
              color: 'var(--warm-white)',
              fontSize: 11,
            }}
          >
            {nextState}
          </button>
        ))}
      </div>
      <p style={{ margin: '10px 0 0', opacity: 0.75 }}>
        <a href="/begin" style={{ color: 'var(--ember)' }}>
          Open begin flow
        </a>
        {' · '}
        <a href="/landing" style={{ color: 'var(--ember)' }}>
          Open landing
        </a>
        {' · '}
        <a href="/welcome" style={{ color: 'var(--ember)' }}>
          Open welcome flow
        </a>
        {' · '}
        <a href="/map" style={{ color: 'var(--ember)' }}>
          Open map
        </a>
        {' · '}
        <a href="/journal" style={{ color: 'var(--ember)' }}>
          Open journal
        </a>
        {' · '}
        <a href="/letter" style={{ color: 'var(--ember)' }}>
          Open letter
        </a>
        {' · '}
        <a href="/settings" style={{ color: 'var(--ember)' }}>
          Open settings
        </a>
        {' · '}
        <a href="/threshold-demo" style={{ color: 'var(--ember)' }}>
          Open threshold demo
        </a>
        {' · '}
        <a href="/access?token=dev" style={{ color: 'var(--ember)' }}>
          Dev access link
        </a>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={() => grantAccess()}>
          Grant access
        </button>
        <button type="button" onClick={() => revokeAccess()}>
          Revoke access
        </button>
        <button type="button" onClick={() => begin({ pace: 'classic', waypointIndex: 0 })}>
          Begin day 1
        </button>
        <button type="button" onClick={handleToggleSimulateGps}>
          {simulateGps ? 'GPS: simulated' : 'GPS: live'}
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  )
}
