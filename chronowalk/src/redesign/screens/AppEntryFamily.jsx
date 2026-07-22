import { useEffect, useState } from 'react'
import { isBundleSku } from '../../lib/launchSkus.js'
import { readAccessEntitlement } from '../../lib/accessSession.js'
import { readPurchasedTier } from '../../lib/pendingPurchase.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'
import WalkTogetherPanel from '../ui/WalkTogetherPanel.jsx'
import { T, F } from '../tokens.js'

/**
 * Optional Couple/Family invite step during app entry.
 * Bundle type and seats come from the verified purchase — no client tier selector.
 */
export default function AppEntryFamily({ onSkip }) {
  const family = useOptionalFamilyWalk()
  const entitlement = readAccessEntitlement()
  const purchased =
    entitlement?.purchasedProductId || family?.purchasedProductId || readPurchasedTier()
  const isBundle = isBundleSku(purchased)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!family) {
      onSkip?.()
      return undefined
    }
    if (!isBundle) {
      onSkip?.()
      return undefined
    }
    let cancelled = false
    family
      .refreshBundle()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [family, isBundle, onSkip])

  if (!family || !isBundle) return null

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
        {ready ? (
          <WalkTogetherPanel variant="entry" showContinue onContinue={onSkip} />
        ) : (
          <p style={{ margin: 0, color: T.muted, fontSize: 14 }}>Loading your bundle…</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSkip?.()}
        style={{
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
        }}
      >
        Skip for now
      </button>
    </div>
  )
}
