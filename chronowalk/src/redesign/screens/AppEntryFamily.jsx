import { useCallback, useEffect, useRef, useState } from 'react'
import { isBundleSku } from '../../lib/launchSkus.js'
import { readAccessEntitlement, readDeviceCredential } from '../../lib/accessSession.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'
import WalkTogetherPanel from '../ui/WalkTogetherPanel.jsx'
import { T, F } from '../tokens.js'
import { APP_ENTRY_FAMILY_PHASE } from './appEntryFamilyPhase.js'

function classifyResolvedBundle(bundle) {
  if (bundle?.role === 'owner' || bundle?.isOwner) {
    // Organizer invite UI needs server seat inventory — incomplete views are not ready.
    if (!Array.isArray(bundle.seats)) return null
    return APP_ENTRY_FAMILY_PHASE.ORGANIZER
  }
  if (bundle?.role === 'member') {
    return APP_ENTRY_FAMILY_PHASE.MEMBER
  }
  if (bundle && isBundleSku(bundle.purchasedProductId) && !bundle.isOwner) {
    return APP_ENTRY_FAMILY_PHASE.MEMBER
  }
  return null
}

/**
 * Optional Couple/Family invite step during app entry.
 * Bundle type and seats come from the verified purchase — no client tier selector.
 *
 * Organizers see Walk together management. Verified members and solo buyers skip
 * once via an effect (never during render).
 */
export default function AppEntryFamily({ onSkip }) {
  const family = useOptionalFamilyWalk()
  const refreshBundle = family?.refreshBundle
  const [phase, setPhase] = useState(APP_ENTRY_FAMILY_PHASE.RESOLVING)
  const [resolveError, setResolveError] = useState(null)
  const [retryToken, setRetryToken] = useState(0)
  const finishedRef = useRef(false)

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    onSkip?.()
  }, [onSkip])

  const resolveEntry = useCallback(async () => {
    setResolveError(null)

    if (typeof refreshBundle !== 'function') {
      // Outside provider: nothing to manage — advance safely.
      return APP_ENTRY_FAMILY_PHASE.SOLO
    }

    const credential = readDeviceCredential()
    if (!credential) {
      const entitlement = readAccessEntitlement()
      if (isBundleSku(entitlement?.purchasedProductId)) {
        return APP_ENTRY_FAMILY_PHASE.ERROR
      }
      return APP_ENTRY_FAMILY_PHASE.SOLO
    }

    try {
      const next = await refreshBundle()
      const fromBundle = classifyResolvedBundle(next)
      if (fromBundle) return fromBundle

      const entitlement = readAccessEntitlement()
      if (isBundleSku(entitlement?.purchasedProductId)) {
        // Bundle SKU on device but server did not return an organizer/member view.
        if (entitlement.role === 'member') return APP_ENTRY_FAMILY_PHASE.MEMBER
        if (entitlement.role === 'owner') return APP_ENTRY_FAMILY_PHASE.ERROR
        return APP_ENTRY_FAMILY_PHASE.ERROR
      }

      return APP_ENTRY_FAMILY_PHASE.SOLO
    } catch (err) {
      const entitlement = readAccessEntitlement()
      if (isBundleSku(entitlement?.purchasedProductId)) {
        setResolveError(err?.message || 'bundle_load_failed')
        return APP_ENTRY_FAMILY_PHASE.ERROR
      }
      return APP_ENTRY_FAMILY_PHASE.SOLO
    }
  }, [refreshBundle])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const nextPhase = await resolveEntry()
      if (cancelled) return
      setPhase(nextPhase)
    })()

    return () => {
      cancelled = true
    }
  }, [resolveEntry, retryToken])

  // Members / solo / invalid: advance exactly once after resolve — never during render.
  useEffect(() => {
    if (
      phase === APP_ENTRY_FAMILY_PHASE.MEMBER ||
      phase === APP_ENTRY_FAMILY_PHASE.SOLO ||
      phase === APP_ENTRY_FAMILY_PHASE.INVALID
    ) {
      finishOnce()
    }
  }, [phase, finishOnce])

  if (
    phase === APP_ENTRY_FAMILY_PHASE.MEMBER ||
    phase === APP_ENTRY_FAMILY_PHASE.SOLO ||
    phase === APP_ENTRY_FAMILY_PHASE.INVALID
  ) {
    return null
  }

  if (phase === APP_ENTRY_FAMILY_PHASE.RESOLVING) {
    return (
      <div
        data-testid="app-entry-family"
        data-phase="resolving"
        style={shellStyle}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>Loading your bundle…</p>
      </div>
    )
  }

  if (phase === APP_ENTRY_FAMILY_PHASE.ERROR) {
    return (
      <div
        data-testid="app-entry-family"
        data-phase="error"
        style={shellStyle}
        role="alert"
      >
        <h1
          style={{
            margin: 0,
            fontFamily: F.display,
            fontSize: 28,
            fontWeight: 500,
          }}
        >
          Couldn’t load your walking party
        </h1>
        <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5, color: T.muted }}>
          Check your connection and try again. You can continue into the tour and invite people
          later from Settings → Walk together.
        </p>
        {resolveError ? (
          <p style={{ marginTop: 8, fontSize: 13, color: T.muted }}>{String(resolveError)}</p>
        ) : null}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            data-testid="app-entry-family-retry"
            onClick={() => {
              setPhase(APP_ENTRY_FAMILY_PHASE.RESOLVING)
              setRetryToken((value) => value + 1)
            }}
            style={primaryButtonStyle}
          >
            Retry
          </button>
          <button
            type="button"
            data-testid="app-entry-family-continue-without"
            onClick={finishOnce}
            style={secondaryButtonStyle}
          >
            Continue without inviting
          </button>
        </div>
      </div>
    )
  }

  // Verified organizer — show invite management (no client tier selector).
  return (
    <div
      data-testid="app-entry-family"
      data-phase="organizer"
      style={{
        ...shellStyle,
        overflowY: 'auto',
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
        Invite someone to your shared tour.
      </h1>
      <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5, color: T.muted }}>
        Create invitations now, or skip and manage them later from Settings → Walk together.
      </p>

      <div style={{ marginTop: 24, flex: 1 }}>
        <WalkTogetherPanel variant="entry" showContinue onContinue={finishOnce} />
      </div>

      <button type="button" onClick={finishOnce} style={secondaryButtonStyle}>
        Skip for now
      </button>
    </div>
  )
}

const shellStyle = {
  height: '100%',
  minHeight: 0,
  padding: '48px 24px 32px',
  fontFamily: F.body,
  color: T.warmWhite,
  background: T.obsidian,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  overscrollBehavior: 'contain',
}

const primaryButtonStyle = {
  width: '100%',
  minHeight: 48,
  border: 'none',
  borderRadius: 12,
  background: T.ember,
  color: T.obsidian,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: F.body,
}

const secondaryButtonStyle = {
  width: '100%',
  marginTop: 16,
  padding: '12px',
  minHeight: 44,
  border: 'none',
  background: 'transparent',
  color: T.muted,
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: F.body,
}
