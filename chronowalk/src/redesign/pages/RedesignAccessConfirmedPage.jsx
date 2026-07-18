import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getJourneySnapshot, JOURNEY_STATES } from '../../state/journey.js'
import { FAMILY_TIERS } from '../../lib/familyWalk.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import A3AccessConfirmed from '../screens/A3AccessConfirmed.jsx'
import { T, F } from '../tokens.js'

function FamilyInviteStep({ onSkip, onDone }) {
  const family = useOptionalFamilyWalk()
  const [tier, setTier] = useState('couple')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [bundle, setBundle] = useState(null)

  if (!family) {
    onSkip()
    return null
  }

  const openInvites = (bundle?.seats ?? []).filter((s) => s.status === 'open')

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const next = await family.setupBundle(tier, name.trim() || 'Leader')
      setBundle(next)
      onDone?.(next)
    } catch (err) {
      setError(err?.code || err?.message || 'unknown')
    } finally {
      setBusy(false)
    }
  }

  if (bundle) {
    return (
      <div style={{ padding: '48px 24px 32px', fontFamily: F.body, color: T.warmWhite }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T.muted,
          }}
        >
          Invite codes
        </p>
        <h1
          style={{
            margin: '10px 0 0',
            fontFamily: F.display,
            fontSize: 28,
            fontWeight: 500,
            color: T.warmWhite,
          }}
        >
          Share these with your walkers.
        </h1>
        <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5, color: T.muted }}>
          Each code unlocks the tour on one phone. They open chronowalk.com/invite and enter the code.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', display: 'grid', gap: 10 }}>
          {openInvites.map((seat) => (
            <li
              key={seat.inviteCode || seat.id}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                background: `${T.warmWhite}10`,
                border: `1px solid ${T.warmWhite}18`,
                fontFamily: F.mono || F.body,
                fontSize: 20,
                letterSpacing: '0.18em',
                textAlign: 'center',
              }}
            >
              {seat.inviteCode}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onSkip}
          style={{
            width: '100%',
            padding: '14px',
            border: 'none',
            borderRadius: 999,
            background: T.ember,
            color: T.warmWhite,
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Continue setup
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 24px 32px', fontFamily: F.body, color: T.warmWhite }}>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: T.muted,
        }}
      >
        Walking with someone?
      </p>
      <h1
        style={{
          margin: '10px 0 0',
          fontFamily: F.display,
          fontSize: 28,
          fontWeight: 500,
        }}
      >
        Invite your partner or family.
      </h1>
      <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5, color: T.muted }}>
        Create invite codes now, or skip and do it later from Settings.
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {Object.values(FAMILY_TIERS).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setTier(option.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              borderRadius: 12,
              border: `1.5px solid ${tier === option.id ? T.ember : `${T.warmWhite}22`}`,
              background: tier === option.id ? `${T.ember}22` : 'transparent',
              color: T.warmWhite,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 600 }}>{option.label}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{option.blurb}</div>
          </button>
        ))}
      </div>

      <label style={{ display: 'grid', gap: 8, marginTop: 18 }}>
        <span style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted }}>
          Your name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex"
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            border: `1px solid ${T.warmWhite}22`,
            background: `${T.ink}88`,
            color: T.warmWhite,
            fontSize: 15,
          }}
        />
      </label>

      {error ? (
        <p style={{ color: 'var(--ember)', fontSize: 14, marginTop: 12 }}>
          Could not create invites. You can try again from Settings.
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void create()}
        style={{
          width: '100%',
          marginTop: 20,
          padding: '14px',
          border: 'none',
          borderRadius: 999,
          background: T.ember,
          color: T.warmWhite,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? 'Creating…' : 'Create invite codes'}
      </button>
      <button
        type="button"
        onClick={onSkip}
        style={{
          width: '100%',
          marginTop: 12,
          padding: '12px',
          border: 'none',
          background: 'transparent',
          color: T.muted,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Skip for now
      </button>
    </div>
  )
}

export default function RedesignAccessConfirmedPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('confirmed')

  const goNext = () => {
    const { state } = getJourneySnapshot()
    const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE
    navigate(inProgress ? '/journey' : '/setup', { replace: true })
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        {step === 'family' ? (
          <FamilyInviteStep onSkip={goNext} onDone={() => {}} />
        ) : (
          <A3AccessConfirmed
            onContinue={() => setStep('family')}
          />
        )}
      </div>
    </RedesignRouteShell>
  )
}
