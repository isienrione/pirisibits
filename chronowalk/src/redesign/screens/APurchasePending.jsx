import { Link } from 'react-router-dom'
import { T, F, S, R } from '../tokens.js'
import { TYPE, displayTitleStyle } from '../typography.js'
import { PrimaryButton, GhostButton, GoldSeam } from '../ui/index.js'
import { TRANSACTION_STEPS } from '../../lib/checkout.js'

/**
 * Purchase flow surface while Lemon Squeezy is pending — or the calm bridge
 * before opening a configured checkout. No decoration; editorial instructions only.
 */
export default function APurchasePending({
  tier = null,
  checkoutReady = false,
  busy = false,
  onContinueCheckout,
  onPreview,
}) {
  const priceLabel = tier?.price ?? null
  const tierLabel = tier?.tierLabel ?? tier?.eyebrow ?? null

  return (
    <main
      className="cw-grain"
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.warmWhite,
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        padding: `max(${S.xl}, env(safe-area-inset-top)) ${S.edge} max(${S.xl}, env(safe-area-inset-bottom))`,
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <p
          style={{
            ...TYPE.meta,
            color: T.muted,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          ChronoWalk · Rome
        </p>

        <h1 style={{ ...displayTitleStyle(34), color: T.warmWhite, marginTop: S.s }}>
          {checkoutReady ? 'Continue to checkout' : 'Checkout is almost ready'}
        </h1>

        <p
          style={{
            ...TYPE.body,
            color: T.muted,
            marginTop: S.m,
            maxWidth: 340,
          }}
        >
          {checkoutReady
            ? 'A secure Lemon Squeezy page will open next. After payment, your access link arrives by email.'
            : 'Payments are waiting on Lemon Squeezy confirmation. The journey below is already built — live checkout lights up when the store URL is set.'}
        </p>

        {(tierLabel || priceLabel) && (
          <div
            style={{
              marginTop: S.l,
              padding: `${S.m} 0`,
              borderTop: `1px solid ${T.muted}22`,
              borderBottom: `1px solid ${T.muted}22`,
            }}
          >
            <p style={{ ...TYPE.meta, color: T.ember, margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {tierLabel ?? 'Rome'}
            </p>
            {priceLabel ? (
              <p style={{ ...displayTitleStyle(28), color: T.warmWhite, marginTop: 6 }}>{priceLabel}</p>
            ) : null}
            {tier?.description ? (
              <p style={{ ...TYPE.body, color: T.muted, marginTop: S.s, fontSize: 14 }}>{tier.description}</p>
            ) : null}
          </div>
        )}

        <ol
          style={{
            listStyle: 'none',
            margin: `${S.l} 0 0`,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: S.m,
          }}
        >
          {TRANSACTION_STEPS.map((step, index) => (
            <li key={step.id} style={{ display: 'flex', gap: S.m, alignItems: 'flex-start' }}>
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: R.control,
                  border: `1px solid ${T.muted}44`,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  color: T.muted,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {index + 1}
              </span>
              <div>
                <p style={{ ...TYPE.ui, color: T.warmWhite, margin: 0, fontWeight: 500 }}>{step.title}</p>
                <p style={{ ...TYPE.body, color: T.muted, margin: '4px 0 0', fontSize: 14 }}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div style={{ marginTop: S.xl, display: 'flex', flexDirection: 'column', gap: S.m }}>
          {checkoutReady ? (
            <PrimaryButton onClick={onContinueCheckout} busy={busy} color={T.ember} glow={false}>
              Continue to secure checkout
            </PrimaryButton>
          ) : (
            <div
              role="status"
              style={{
                padding: S.m,
                borderRadius: R.card,
                border: `1px solid ${T.muted}28`,
                background: 'color-mix(in srgb, var(--charcoal, #1a1a1f) 55%, transparent)',
              }}
            >
              <p style={{ ...TYPE.ui, color: T.warmWhite, margin: 0, fontWeight: 500 }}>
                Lemon Squeezy pending
              </p>
              <p style={{ ...TYPE.body, color: T.muted, margin: '6px 0 0', fontSize: 14 }}>
                When confirmation arrives, set <code style={{ color: T.ember }}>VITE_LEMON_CHECKOUT_URL</code> (and
                the webhook). This button then becomes live checkout — no redesign required.
              </p>
              <div style={{ marginTop: S.m }}>
                <GoldSeam moment="loading" />
              </div>
            </div>
          )}

          {onPreview ? (
            <GhostButton onClick={onPreview}>Try the Pantheon free</GhostButton>
          ) : (
            <Link
              to="/preview"
              style={{
                ...TYPE.buttonQuiet,
                color: T.muted,
                textAlign: 'center',
                textDecoration: 'none',
                padding: S.m,
              }}
            >
              Try the Pantheon free
            </Link>
          )}

          <p style={{ ...TYPE.meta, color: T.muted, textAlign: 'center', margin: 0 }}>
            Already purchased?{' '}
            <Link to="/access" style={{ color: T.ember, textDecoration: 'none' }}>
              Restore access
            </Link>
          </p>

          {!checkoutReady ? (
            <p style={{ ...TYPE.meta, color: `${T.muted}99`, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              Local / staging: open{' '}
              <Link to="/access?token=dev" style={{ color: T.ember, textDecoration: 'none' }}>
                /access?token=dev
              </Link>{' '}
              when <code>VITE_ALLOW_DEV_ACCESS</code> is enabled.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
