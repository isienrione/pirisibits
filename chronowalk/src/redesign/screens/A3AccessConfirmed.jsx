import { useContext } from 'react'
import { T, F } from '../tokens.js'
import { Vignette, GoldSeam } from '../ui/index.js'
import { colosseumNow } from '../images.js'
import { RedesignNavCtx } from '../nav.js'

/**
 * Purchase / tour unlock ceremony — Gold Seam draw-down marks the key turning.
 * Documented moments: purchaseSuccess (primary) + tourUnlocked (same screen).
 */
export default function A3AccessConfirmed({ onContinue }) {
  const { navigate } = useContext(RedesignNavCtx)

  return (
    <div
      style={{
        background: T.obsidian,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: F.body,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${colosseumNow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          filter: 'brightness(0.04) saturate(0.3)',
        }}
      />
      <Vignette />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          marginLeft: -20,
          top: 0,
          bottom: '28%',
          width: 40,
          background:
            'radial-gradient(ellipse at top, color-mix(in srgb, var(--gold, #d4af37) 22%, transparent) 0%, transparent 72%)',
          pointerEvents: 'none',
          animation: 'cwGoldSeamBreathe 3.2s ease-in-out infinite',
        }}
        aria-hidden
      />

      <GoldSeam moment="purchaseSuccess" />

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '0 32px max(72px, calc(env(safe-area-inset-bottom) + 48px))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 36,
            fontWeight: 300,
            color: T.warmWhite,
            lineHeight: 1.1,
            marginBottom: 16,
            textShadow: '0 2px 24px rgba(0,0,0,0.8)',
          }}
        >
          Rome is yours.
        </h1>

        <p
          style={{
            fontSize: 15,
            color: T.muted,
            lineHeight: 1.65,
            marginBottom: 36,
            maxWidth: 280,
          }}
        >
          Your access link is in your email — it works on any phone.
        </p>

        <button
          type="button"
          onClick={() => (onContinue ? onContinue() : navigate('B1'))}
          style={{
            width: '100%',
            padding: '15px',
            background: T.ember,
            color: T.obsidian,
            borderRadius: 12,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 15,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 0 28px rgba(212, 175, 55, 0.4)',
          }}
        >
          Begin setup
        </button>
      </div>
    </div>
  )
}
