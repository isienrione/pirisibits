import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { parseAccessToken, validateAccessToken } from '../../lib/access'
import { grantAccess } from '../../lib/config'
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

function readProductIdFromSearch(searchParams) {
  return (
    searchParams.get('product_id')
    || searchParams.get('productId')
    || searchParams.get('tier')
    || ''
  ).trim() || null
}

export default function AccessScreen({ onValidated }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = parseAccessToken(`?${searchParams.toString()}`)
  const productId = readProductIdFromSearch(searchParams)
  const [status, setStatus] = useState(token ? 'validating' : 'idle')
  const [manualToken, setManualToken] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('idle')
      return undefined
    }

    let cancelled = false
    setStatus('validating')

    validateAccessToken(token).then((result) => {
      if (cancelled) return

      if (result.ok) {
        grantAccess(productId)
        track(TRACK_EVENTS.PURCHASE, {
          source: result.source ?? 'token',
          product_id: productId ?? undefined,
        })
        setStatus('success')
        onValidated?.()
        return
      }

      setStatus('error')
    })

    return () => {
      cancelled = true
    }
  }, [token, productId, onValidated])

  const handleManualSubmit = (event) => {
    event.preventDefault()
    const trimmed = manualToken.trim()
    if (!trimmed) return
    navigate(`/access?token=${encodeURIComponent(trimmed)}`, { replace: true })
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
          body="Opening Rome for you…"
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
              After purchase, we email you a personal link. Open it on this phone to return to Rome.
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
              From your email
            </label>
            <input
              id="access-token"
              name="access-token"
              type="text"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              placeholder="Paste from your email"
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
        </>
      ) : null}

      <p style={{ marginTop: 28, fontSize: 'var(--fs-meta)', color: 'var(--muted-warm)' }}>
        Haven&apos;t purchased yet?{' '}
        <Link to="/landing" style={{ color: 'var(--ember)', textDecoration: 'none' }}>
          Unlock Rome
        </Link>
      </p>
    </AccessShell>
  )
}
