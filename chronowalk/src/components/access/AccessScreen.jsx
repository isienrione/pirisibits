import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { parseAccessToken, validateAccessToken } from '../../lib/access'
import { applyPurchaseUnlock } from '../../lib/pendingPurchase.js'
import { requestAccessEmail } from '../../lib/requestAccessEmail.js'
import { track, TRACK_EVENTS } from '../../lib/track'

function AccessShell({ children }) {
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

function StatusMessage({ title, body, tone = 'muted' }) {
  const color =
    tone === 'error' ? '#e88a8a' : tone === 'success' ? 'var(--verdigris)' : 'var(--muted-warm)'

  return (
    <div style={{ marginTop: 24 }}>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h2)',
          fontWeight: 500,
        }}
      >
        {title}
      </p>
      <p style={{ marginTop: 10, fontSize: 'var(--fs-secondary)', lineHeight: 1.55, color }}>{body}</p>
    </div>
  )
}

export default function AccessScreen({ onValidated, forceValidateToken = null }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = forceValidateToken || parseAccessToken(`?${searchParams.toString()}`)
  const [manualToken, setManualToken] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendOrderId, setResendOrderId] = useState('')
  const [resendBusy, setResendBusy] = useState(false)
  const [resendMessage, setResendMessage] = useState(null)
  // Async claim outcome only - idle/validating are derived from token presence.
  const [outcome, setOutcome] = useState(null)
  const [outcomeForToken, setOutcomeForToken] = useState(token)

  // When the claim token identity changes, clear the prior outcome during render
  // (React-recommended prop→state sync) instead of syncing inside an effect.
  if (outcomeForToken !== token) {
    setOutcomeForToken(token)
    setOutcome(null)
  }

  const status = !token ? 'idle' : outcome == null ? 'validating' : outcome

  useEffect(() => {
    if (!token) return undefined

    let cancelled = false

    // Always validate the presented URL/manual claim - unrelated local cw_access
    // state must never short-circuit an invalid/rotated token.
    validateAccessToken(token).then((result) => {
      if (cancelled) return

      if (result.ok) {
        const unlock = applyPurchaseUnlock({
          // Redeem persists the credential; keep apply resilient for mocks/tests.
          token: result.deviceCredential ?? null,
          productId: result.productId ?? null,
          purchasedProductId: result.purchasedProductId ?? null,
          contentProductId: result.contentProductId ?? null,
          seatLimit: result.seatLimit ?? null,
          role: result.role ?? null,
          bundleStatus: result.bundleStatus ?? null,
        })
        track(TRACK_EVENTS.PURCHASE, {
          source: result.source ?? 'token',
          tier: unlock.tier,
        })
        setOutcome('success')
        onValidated?.({ token, productId: unlock.tier })
        return
      }

      setOutcome('error')
    })

    return () => {
      cancelled = true
    }
  }, [token, onValidated])

  const handleManualSubmit = (event) => {
    event.preventDefault()
    const trimmed = manualToken.trim()
    if (!trimmed) return
    navigate(`/access?token=${encodeURIComponent(trimmed)}`, { replace: true })
  }

  const handleResendSubmit = async (event) => {
    event.preventDefault()
    if (resendBusy) return
    setResendBusy(true)
    setResendMessage(null)
    try {
      const result = await requestAccessEmail({
        email: resendEmail,
        orderId: resendOrderId,
      })
      setResendMessage(result.message)
    } finally {
      setResendBusy(false)
    }
  }

  return (
    <AccessShell>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted-warm)',
        }}
      >
        Your ticket
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
        Welcome back, traveler.
      </h1>

      {status === 'validating' ? (
        <StatusMessage
          title="Confirming your purchase…"
          body="One moment while we unlock Rome on this device."
        />
      ) : null}

      {status === 'success' ? (
        <StatusMessage
          tone="success"
          title="Rome is ready."
          body="Opening your tour…"
        />
      ) : null}

      {status === 'error' ? (
        <StatusMessage
          tone="error"
          title="This link is not valid."
          body="Open the access link from your purchase confirmation email, or paste your token below."
        />
      ) : null}

      {status === 'idle' || status === 'error' ? (
        <>
          {status === 'idle' ? (
            <p
              style={{
                marginTop: 16,
                fontSize: 'var(--fs-secondary)',
                lineHeight: 1.55,
                color: 'var(--muted-warm)',
              }}
            >
              After purchase, open the personal link from your email on this phone - or paste it
              below. This screen is for returning buyers only, not checkout.
            </p>
          ) : null}

          <form onSubmit={handleManualSubmit} style={{ marginTop: 28 }}>
            <label
              htmlFor="access-token"
              style={{
                display: 'block',
                fontSize: 'var(--fs-caption)',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--muted-warm)',
              }}
            >
              Enter the access code from your email
            </label>
            <input
              id="access-token"
              name="access-token"
              type="text"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="Paste the code you received here"
              autoComplete="off"
              style={{
                marginTop: 10,
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--r-card)',
                border: '1px solid color-mix(in srgb, var(--warm-white) 14%, transparent)',
                background: 'color-mix(in srgb, var(--ink) 70%, transparent)',
                color: 'var(--warm-white)',
                fontSize: 'var(--fs-secondary)',
              }}
            />
            <button
              type="submit"
              style={{
                marginTop: 14,
                width: '100%',
                padding: '14px 18px',
                border: 'none',
                borderRadius: 999,
                background: 'var(--accent)',
                color: 'var(--bone)',
                fontSize: 'var(--fs-body)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Enter Rome
            </button>
          </form>

          <section style={{ marginTop: 36 }} aria-labelledby="access-resend-heading">
            <h2
              id="access-resend-heading"
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 500,
              }}
            >
              Didn&apos;t get your access email?
            </h2>
            <p
              style={{
                marginTop: 10,
                fontSize: 'var(--fs-secondary)',
                lineHeight: 1.55,
                color: 'var(--muted-warm)',
              }}
            >
              Use the same email as your Paddle receipt and the order id that starts with{' '}
              <code style={{ color: 'var(--warm-white)' }}>txn_</code>. Check Junk / Other on
              Microsoft addresses.
            </p>
            <form onSubmit={handleResendSubmit} style={{ marginTop: 20 }}>
              <label
                htmlFor="access-resend-email"
                style={{
                  display: 'block',
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted-warm)',
                }}
              >
                Purchase email
              </label>
              <input
                id="access-resend-email"
                name="access-resend-email"
                type="email"
                autoComplete="email"
                value={resendEmail}
                onChange={(event) => setResendEmail(event.target.value)}
                placeholder="you@outlook.com"
                required
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 'var(--r-card)',
                  border: '1px solid color-mix(in srgb, var(--warm-white) 14%, transparent)',
                  background: 'color-mix(in srgb, var(--ink) 70%, transparent)',
                  color: 'var(--warm-white)',
                  fontSize: 'var(--fs-secondary)',
                }}
              />
              <label
                htmlFor="access-resend-order"
                style={{
                  display: 'block',
                  marginTop: 16,
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted-warm)',
                }}
              >
                Paddle order id
              </label>
              <input
                id="access-resend-order"
                name="access-resend-order"
                type="text"
                autoComplete="off"
                value={resendOrderId}
                onChange={(event) => setResendOrderId(event.target.value)}
                placeholder="txn_…"
                required
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 'var(--r-card)',
                  border: '1px solid color-mix(in srgb, var(--warm-white) 14%, transparent)',
                  background: 'color-mix(in srgb, var(--ink) 70%, transparent)',
                  color: 'var(--warm-white)',
                  fontSize: 'var(--fs-secondary)',
                }}
              />
              <button
                type="submit"
                disabled={resendBusy}
                style={{
                  marginTop: 14,
                  width: '100%',
                  padding: '14px 18px',
                  border: '1px solid color-mix(in srgb, var(--warm-white) 22%, transparent)',
                  borderRadius: 999,
                  background: 'transparent',
                  color: 'var(--warm-white)',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 600,
                  cursor: resendBusy ? 'wait' : 'pointer',
                  opacity: resendBusy ? 0.7 : 1,
                }}
              >
                {resendBusy ? 'Sending…' : 'Email me a fresh access link'}
              </button>
            </form>
            {resendMessage ? (
              <p
                role="status"
                style={{
                  marginTop: 14,
                  fontSize: 'var(--fs-secondary)',
                  lineHeight: 1.55,
                  color: 'var(--verdigris)',
                }}
              >
                {resendMessage}
              </p>
            ) : null}
          </section>
        </>
      ) : null}

      <p style={{ marginTop: 28, fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
        Joining a partner or family?{' '}
        <Link to="/invite" style={{ color: 'var(--ember)', textDecoration: 'none' }}>
          Enter an invite code
        </Link>
      </p>
      <p style={{ marginTop: 12, fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
        Haven&apos;t purchased yet?{' '}
        <Link to="/#pricing" style={{ color: 'var(--ember)', textDecoration: 'none' }}>
          See Rome packages
        </Link>
      </p>
      <p style={{ marginTop: 12, fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
        Trying the free sample?{' '}
        <Link to="/preview" style={{ color: 'var(--ember)', textDecoration: 'none' }}>
          Hear the Pantheon
        </Link>
      </p>
    </AccessShell>
  )
}
