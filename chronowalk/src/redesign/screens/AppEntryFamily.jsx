import { useState } from 'react'
import { T, F } from '../tokens.js'
import { FAMILY_TIERS } from '../../lib/familyWalk.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'

/** Optional couple/family invite codes during app entry. */
export default function AppEntryFamily({ onSkip }) {
  const family = useOptionalFamilyWalk()
  const [tier, setTier] = useState('couple')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [bundle, setBundle] = useState(null)

  if (!family) {
    onSkip?.()
    return null
  }

  const openInvites = (bundle?.seats ?? []).filter((s) => s.status === 'open')

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const next = await family.setupBundle(tier, name.trim() || 'Leader')
      setBundle(next)
    } catch (err) {
      setError(err?.code || err?.message || 'unknown')
    } finally {
      setBusy(false)
    }
  }

  if (bundle) {
    return (
      <div
        data-testid="app-entry-family"
        style={{
          height: '100%',
          padding: '48px 24px 32px',
          fontFamily: F.body,
          color: T.warmWhite,
          background: T.obsidian,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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
          }}
        >
          Share these with your walkers.
        </h1>
        <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5, color: T.muted }}>
          Each code unlocks the tour on one phone at chronowalk.com/invite.
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
          onClick={() => onSkip?.()}
          style={{
            width: '100%',
            marginTop: 'auto',
            padding: '14px',
            border: 'none',
            borderRadius: 999,
            background: T.ember,
            color: T.obsidian,
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          Continue to your walk
        </button>
      </div>
    )
  }

  return (
    <div
      data-testid="app-entry-family"
      style={{
        height: '100%',
        padding: '48px 24px 32px',
        fontFamily: F.body,
        color: T.warmWhite,
        background: T.obsidian,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
        <span
          style={{
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: T.muted,
          }}
        >
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

      <div style={{ marginTop: 'auto', display: 'grid', gap: 10, paddingTop: 24 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void create()}
          style={{
            width: '100%',
            padding: '14px',
            border: 'none',
            borderRadius: 999,
            background: T.ember,
            color: T.obsidian,
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
          onClick={() => onSkip?.()}
          style={{
            width: '100%',
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
    </div>
  )
}
