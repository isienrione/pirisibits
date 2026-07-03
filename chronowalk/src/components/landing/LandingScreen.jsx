import { Link } from 'react-router-dom'
import Threshold from '../Threshold'
import { THRESHOLD_DEMO_WAYPOINT } from '../../data/thresholdDemo'
import { usePrice } from '../../hooks/usePrice'
import { buildCheckoutUrl, getHost, getHostLabel } from '../../lib/host'
import { track, TRACK_EVENTS } from '../../lib/track'

const INCLUDED = [
  '22 locations across 2 days',
  'Place-aware audio at every stop',
  'Press-and-hold reconstructions',
  'Walking directions between landmarks',
  'Your journey journal and letter',
]

const FEATURES = [
  { id: 'gps', label: 'GPS guided' },
  { id: 'audio', label: 'Audio stories' },
  { id: 'reveals', label: 'Visual reveals' },
]

function FeatureRow() {
  return (
    <ul
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        margin: '24px 0 0',
        padding: 0,
        listStyle: 'none',
      }}
    >
      {FEATURES.map(({ id, label }) => (
        <li
          key={id}
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 'var(--fs-caption)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted-warm)',
          }}
        >
          <span
            style={{
              display: 'block',
              width: 40,
              height: 40,
              margin: '0 auto 8px',
              borderRadius: '50%',
              border: '1px solid color-mix(in srgb, var(--warm-white) 18%, transparent)',
            }}
          />
          {label}
        </li>
      ))}
    </ul>
  )
}

export default function LandingScreen() {
  const { label, cents, checkoutUrl } = usePrice()
  const hostLabel = getHostLabel()
  const checkoutReady = Boolean(checkoutUrl)

  const handlePurchase = () => {
    const url = buildCheckoutUrl(checkoutUrl, {
      host: getHost(),
      abVariantCents: cents,
    })

    if (!url) return

    track(TRACK_EVENTS.CHECKOUT_OPEN, { price_cents: cents })
    window.location.assign(url)
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--obsidian)',
        color: 'var(--warm-white)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <section
        aria-label="Try the threshold"
        style={{
          position: 'relative',
          height: 'min(58vh, 32rem)',
          borderBottom: '1px solid color-mix(in srgb, var(--warm-white) 8%, transparent)',
        }}
      >
        <Threshold
          waypoint={THRESHOLD_DEMO_WAYPOINT}
          nowAmbienceUrl={THRESHOLD_DEMO_WAYPOINT.nowAmbience}
          thenSoundscapeUrl={THRESHOLD_DEMO_WAYPOINT.thenSoundscape}
          embedded
          active
        />
      </section>

      <section
        style={{
          padding:
            'var(--gap-l) var(--edge) max(var(--gap-xl), env(safe-area-inset-bottom))',
        }}
      >
        {hostLabel ? (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-caption)',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ember)',
            }}
          >
            Recommended by {hostLabel}
          </p>
        ) : null}

        <p
          style={{
            margin: hostLabel ? '10px 0 0' : 0,
            fontSize: 'var(--fs-caption)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted-warm)',
          }}
        >
          ChronoWalk · Rome
        </p>

        <h1
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-title)',
            fontWeight: 500,
            lineHeight: 1.12,
          }}
        >
          Walk where Rome
          <br />
          still breathes.
        </h1>

        <p
          style={{
            marginTop: 12,
            fontSize: 'var(--fs-secondary)',
            lineHeight: 1.55,
            color: 'var(--muted-warm)',
            maxWidth: '28rem',
          }}
        >
          Twenty-two places. Two days. Stories and reconstructions that unlock exactly where you
          stand.
        </p>

        <FeatureRow />

        <div
          style={{
            marginTop: 28,
            padding: '18px 16px',
            borderRadius: 'var(--r-card)',
            background: 'color-mix(in srgb, var(--ink) 70%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warm-white) 10%, transparent)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 'var(--fs-caption)',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ember)',
            }}
          >
            Included
          </p>
          <ul
            style={{
              margin: '12px 0 0',
              padding: 0,
              listStyle: 'none',
              display: 'grid',
              gap: 10,
            }}
          >
            {INCLUDED.map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  gap: 10,
                  fontSize: 'var(--fs-secondary)',
                  lineHeight: 1.45,
                }}
              >
                <span aria-hidden="true" style={{ color: 'var(--verdigris)' }}>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={handlePurchase}
          disabled={!checkoutReady}
          style={{
            marginTop: 28,
            width: '100%',
            padding: '16px 20px',
            border: 'none',
            borderRadius: 999,
            background: checkoutReady ? 'var(--accent)' : 'color-mix(in srgb, var(--muted-warm) 35%, var(--ink))',
            color: checkoutReady ? 'var(--bone)' : 'var(--muted-warm)',
            fontSize: 'var(--fs-body)',
            fontWeight: 600,
            cursor: checkoutReady ? 'pointer' : 'not-allowed',
          }}
        >
          Unlock Rome — {label}
        </button>

        {!checkoutReady ? (
          <p
            style={{
              marginTop: 10,
              fontSize: 'var(--fs-meta)',
              color: 'var(--muted-warm)',
              textAlign: 'center',
            }}
          >
            Checkout is not configured yet. Set <code>VITE_LEMON_CHECKOUT_URL</code> in{' '}
            <code>.env.local</code>.
          </p>
        ) : null}

        <p
          style={{
            marginTop: 16,
            fontSize: 'var(--fs-meta)',
            textAlign: 'center',
            color: 'var(--muted-warm)',
          }}
        >
          Already purchased?{' '}
          <Link to="/access" style={{ color: 'var(--ember)', textDecoration: 'none' }}>
            Restore access
          </Link>
        </p>

        <p
          style={{
            marginTop: 20,
            fontSize: 'var(--fs-caption)',
            lineHeight: 1.5,
            color: 'color-mix(in srgb, var(--muted-warm) 85%, transparent)',
            textAlign: 'center',
          }}
        >
          Location is used only while your tour is active. You can pause anytime.
        </p>
      </section>
    </div>
  )
}
