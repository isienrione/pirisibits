import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  claimFamilySeat,
  normalizeBundleInviteCode,
  writeLastBundleInviteCode,
} from '../../lib/familyWalk.js'
import { getAppHomePath, isAppEntryComplete } from '../../lib/appEntry.js'
import { isResumableJourney } from '../../state/journey.js'

function destinationAfterInvite() {
  return getAppHomePath({
    resumable: isResumableJourney(),
    entryComplete: isAppEntryComplete(),
  })
}

function InviteForm({ initialCode }) {
  const navigate = useNavigate()
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')
  const [status, setStatus] = useState(initialCode ? 'ready' : 'idle')
  const [error, setError] = useState(null)

  // Persist the bundle invite code so a Home Screen / shortcut launch can
  // restore access without requiring the user to re-enter it.
  useEffect(() => {
    if (!initialCode) return
    writeLastBundleInviteCode(initialCode)
  }, [initialCode])

  const redeem = async (event) => {
    event?.preventDefault?.()
    const inviteCode = normalizeBundleInviteCode(code)
    if (!inviteCode) return

    setStatus('claiming')
    setError(null)
    try {
      await claimFamilySeat({ inviteCode, displayName: name.trim() || 'Walker' })
      setStatus('success')
      navigate(destinationAfterInvite(), { replace: true })
    } catch (err) {
      setStatus('error')
      setError(err?.code || err?.message || 'invite_not_found')
    }
  }

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
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--fs-caption)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted-warm)',
          }}
        >
          Family invite
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
          Join their Rome walk.
        </h1>
        <p
          style={{
            marginTop: 12,
            fontSize: 'var(--fs-secondary)',
            lineHeight: 1.55,
            color: 'var(--muted-warm)',
          }}
        >
          Enter the invite code from your partner or family · it unlocks the tour on this phone.
        </p>

        <form onSubmit={redeem} style={{ marginTop: 28, display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span
              style={{
                fontSize: 'var(--fs-caption)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted-warm)',
              }}
            >
              Invite code
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="paste invite code"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-card)',
                border: '1px solid color-mix(in srgb, var(--warm-white) 14%, transparent)',
                background: 'color-mix(in srgb, var(--ink) 70%, transparent)',
                color: 'var(--warm-white)',
                fontSize: 'var(--fs-secondary)',
                letterSpacing: '0.12em',
                // Visual only · does not mutate React state / submitted secret.
                textTransform: 'uppercase',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: 8 }}>
            <span
              style={{
                fontSize: 'var(--fs-caption)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted-warm)',
              }}
            >
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-card)',
                border: '1px solid color-mix(in srgb, var(--warm-white) 14%, transparent)',
                background: 'color-mix(in srgb, var(--ink) 70%, transparent)',
                color: 'var(--warm-white)',
                fontSize: 'var(--fs-secondary)',
              }}
            />
          </label>

          {error ? (
            <p style={{ margin: 0, color: 'var(--ember)', fontSize: 'var(--fs-secondary)' }}>
              {error === 'invite_already_claimed'
                ? 'That code was already used.'
                : error === 'invite_not_found' || error === 'invalid'
                  ? 'We could not find that invite code.'
                  : 'Could not join with that code. Try again.'}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === 'claiming' || !code.trim()}
            style={{
              width: '100%',
              padding: '14px 18px',
              border: 'none',
              borderRadius: 999,
              background: 'var(--accent)',
              color: 'var(--bone)',
              fontSize: 'var(--fs-body)',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: status === 'claiming' || !code.trim() ? 0.6 : 1,
            }}
          >
            {status === 'claiming' ? 'Joining…' : 'Join the walk'}
          </button>
        </form>

        <p style={{ marginTop: 28, fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
          Have a purchase email link instead?{' '}
          <Link to="/access" style={{ color: 'var(--ember)', textDecoration: 'none' }}>
            Restore access
          </Link>
        </p>
      </div>
    </main>
  )
}

export function InvitePage() {
  const [searchParams] = useSearchParams()
  // Preserve URL secret as-is (trim only). Never destructively uppercase ·
  // secrets are lowercase hex; CSS may style the field as uppercase visually.
  // Remount when the query code changes so URL loads stay non-destructive.
  const codeFromUrl = (searchParams.get('code') ?? '').trim()
  return <InviteForm key={codeFromUrl || 'manual'} initialCode={codeFromUrl} />
}
