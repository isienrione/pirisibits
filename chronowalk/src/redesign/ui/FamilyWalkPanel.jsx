import { useState } from 'react'
import { T, F } from '../tokens.js'
import { FAMILY_TIERS } from '../../lib/familyWalk.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'

function Toggle({ on, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? `color-mix(in srgb, ${T.ink} 72%, ${T.muted})` : `${T.muted}38`,
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: T.warmWhite,
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'left var(--d-feedback, 220ms) var(--ease-exit, cubic-bezier(0.22, 1, 0.36, 1))',
        }}
      />
    </button>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: `1px solid ${T.ink800}30`,
          background: T.warmWhite,
          fontFamily: F.body,
          fontSize: 15,
          color: T.ink,
        }}
      />
    </label>
  )
}

/**
 * Family / Couple bundle + shared-walk setup panel (Settings).
 */
export default function FamilyWalkPanel() {
  const family = useOptionalFamilyWalk()
  const [name, setName] = useState('')
  const [invite, setInvite] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [tier, setTier] = useState('couple')

  if (!family) return null

  const {
    bundle,
    session,
    busy,
    error,
    clearError,
    setupBundle,
    redeemInvite,
    startSharedWalk,
    joinSharedWalk,
    leaveSharedWalk,
    setSyncEnabled,
    setResumePolicy,
    syncEnabled,
    resumePolicy,
    isLeader,
  } = family

  const openInvites = (bundle?.seats ?? []).filter((s) => s.status === 'open')

  return (
    <section style={{ padding: '8px 0 4px' }} data-testid="family-walk-panel">
      <p
        style={{
          margin: '0 0 10px',
          fontSize: 12,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: T.muted,
        }}
      >
        Family walk
      </p>

      {!bundle ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>
            Unlock Rome once, invite your people, then optionally keep audio in sync so nobody gets lost on pause.
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            {Object.values(FAMILY_TIERS).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTier(option.id)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 10,
                  border: `1.5px solid ${tier === option.id ? T.ember : `${T.ink800}28`}`,
                  background: tier === option.id ? `${T.ember}14` : T.warmWhite,
                  cursor: 'pointer',
                  fontFamily: F.body,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{option.label}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{option.blurb}</div>
              </button>
            ))}
          </div>

          <Field label="Your name" value={name} onChange={setName} placeholder="Alex" />

          <button
            type="button"
            disabled={busy}
            onClick={() => void setupBundle(tier, name || 'Leader')}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 12,
              border: 'none',
              background: T.ember,
              color: T.obsidian,
              fontWeight: 600,
              fontFamily: F.body,
              cursor: 'pointer',
            }}
          >
            Create {FAMILY_TIERS[tier].label.toLowerCase()} bundle
          </button>

          <div style={{ height: 1, background: `${T.muted}28` }} />

          <Field label="Have an invite code?" value={invite} onChange={setInvite} placeholder="ABC123" />
          <button
            type="button"
            disabled={busy || !invite.trim()}
            onClick={() => void redeemInvite(invite.trim(), name || 'Walker')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              border: `1px solid ${T.ink800}30`,
              background: 'transparent',
              color: T.ink,
              fontFamily: F.body,
              cursor: 'pointer',
            }}
          >
            Join with invite code
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>
            {bundle.tier === 'couple' ? 'Couple' : 'Family'} bundle ·{' '}
            {bundle.seats.filter((s) => s.status === 'claimed').length}/{bundle.seatLimit} seats claimed
            {bundle.isOwner ? ' · you are the organizer' : ''}
          </p>

          {openInvites.length > 0 ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: `${T.ember}10`,
                border: `1px solid ${T.ember}28`,
              }}
            >
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 12,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Open invite codes
              </p>
              {openInvites.map((seat) => (
                <p key={seat.id} style={{ margin: '0 0 4px', fontSize: 15, color: T.ink, fontFamily: F.body }}>
                  <strong style={{ letterSpacing: '0.12em' }}>{seat.inviteCode}</strong>
                  <span style={{ color: T.muted }}> · {seat.label}</span>
                </p>
              ))}
              <p style={{ margin: '8px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.45 }}>
                Share a code so each walker unlocks Rome on their own phone.
              </p>
            </div>
          ) : null}

          {!session ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void startSharedWalk('leader')}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 12,
                  border: 'none',
                  background: T.ember,
                  color: T.obsidian,
                  fontWeight: 600,
                  fontFamily: F.body,
                  cursor: 'pointer',
                }}
              >
                Start shared walk (you lead)
              </button>
              <Field label="Or join today’s walk code" value={joinCode} onChange={setJoinCode} placeholder="XK7P2" />
              <button
                type="button"
                disabled={busy || !joinCode.trim()}
                onClick={() => void joinSharedWalk(joinCode.trim())}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: `1px solid ${T.ink800}30`,
                  background: 'transparent',
                  color: T.ink,
                  fontFamily: F.body,
                  cursor: 'pointer',
                }}
              >
                Join shared walk
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 12,
                padding: 14,
                borderRadius: 14,
                background: T.warmWhite,
                border: `1px solid ${T.ink800}22`,
              }}
              data-testid="family-walk-session"
            >
              <p style={{ margin: 0, fontSize: 14, color: T.ink }}>
                Walk code <strong style={{ letterSpacing: '0.14em' }}>{session.joinCode}</strong>
                {isLeader ? ' · you are Leader' : ' · following'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, color: T.ink }}>Synced tour</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.4 }}>
                    Off = everyone listens independently
                  </p>
                </div>
                <Toggle
                  on={syncEnabled}
                  onToggle={() => void setSyncEnabled(!syncEnabled)}
                  label="Synced tour"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, color: T.ink }}>Only leader resumes</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.4 }}>
                    Anyone can still pause for all
                  </p>
                </div>
                <Toggle
                  on={resumePolicy === 'leader'}
                  onToggle={() => void setResumePolicy(resumePolicy === 'leader' ? 'anyone' : 'leader')}
                  label="Only leader resumes"
                />
              </div>

              <button
                type="button"
                onClick={leaveSharedWalk}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 10,
                  border: 'none',
                  background: `${T.ink800}12`,
                  color: T.muted,
                  fontFamily: F.body,
                  cursor: 'pointer',
                }}
              >
                Leave shared walk
              </button>
            </div>
          )}
        </div>
      )}

      {error ? (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: T.actI }} onClick={clearError}>
          {error === 'resume_leader_only'
            ? 'Only the leader can resume for everyone right now.'
            : error === 'invite_already_claimed'
              ? 'That invite was already used on another phone.'
              : error === 'invite_not_found'
                ? 'Invite code not found.'
                : error === 'session_not_found'
                  ? 'Walk code not found or expired.'
                  : String(error)}
        </p>
      ) : null}
    </section>
  )
}
