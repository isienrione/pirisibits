import { Link } from 'react-router-dom'
import { T, F } from '../tokens.js'
import { PrimaryButton, GhostButton, Seam } from '../ui/index.js'
import { TRANSACTION_STEPS } from '../../lib/checkout.js'
import OfferPriceDisplay from '../../landing/OfferPriceDisplay.jsx'
import '../../components/legal/legal.css'
import { useT } from '../../i18n/I18nProvider.jsx'

const metaStyle = {
  fontFamily: F.body,
  fontWeight: 400,
  fontSize: 12,
  lineHeight: 1.4,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  margin: 0,
}

const bodyStyle = {
  fontFamily: F.body,
  fontWeight: 400,
  fontSize: 15,
  lineHeight: 1.55,
  margin: 0,
}

const uiStyle = {
  fontFamily: F.body,
  fontWeight: 500,
  fontSize: 14,
  lineHeight: 1.4,
  margin: 0,
}

function displayTitle(size) {
  return {
    fontFamily: F.display,
    fontWeight: 300,
    fontSize: size,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    margin: 0,
  }
}

/**
 * Purchase flow surface while Paddle credentials are pending - or the calm bridge
 * before opening a configured checkout. No decoration; editorial instructions only.
 */
export default function APurchasePending({
  tier = null,
  checkoutReady = false,
  stagingAllowed = false,
  busy = false,
  onContinueCheckout,
  onStagingCheckout,
  onPreview,
}) {
  const t = useT()
  const priceLabel = tier?.price ?? null
  const basePriceLabel = tier?.launchOffer ? tier?.basePrice ?? null : null
  const offerLabel = tier?.launchOffer ? tier?.offerLabel ?? null : null
  const saveLabel = tier?.launchOffer ? tier?.saveLabel ?? null : null
  const tierLabel = tier?.tierLabel ?? tier?.eyebrow ?? tier?.name ?? null
  const checkoutEnabled = checkoutReady && !busy

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
        padding: 'max(40px, env(safe-area-inset-top)) 24px max(40px, env(safe-area-inset-bottom))',
      }}
    >
      <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <p style={{ ...metaStyle, color: T.muted }}>{t('purchase.pending.brand')}</p>

        <h1 style={{ ...displayTitle(34), color: T.warmWhite, marginTop: 12 }}>
          {checkoutReady
            ? t('purchase.pending.readyTitle')
            : t('purchase.pending.waitTitle')}
        </h1>

        <p style={{ ...bodyStyle, color: T.muted, marginTop: 16, maxWidth: 340 }}>
          {checkoutReady
            ? t('purchase.pending.readyBody')
            : t('purchase.pending.waitBody')}
        </p>

        {(tierLabel || priceLabel) && (
          <div
            style={{
              marginTop: 24,
              padding: '16px 0',
              borderTop: `1px solid ${T.muted}22`,
              borderBottom: `1px solid ${T.muted}22`,
            }}
          >
            <p style={{ ...metaStyle, color: T.ember, letterSpacing: '0.12em' }}>
              {tierLabel ?? t('purchase.pending.rome')}
            </p>
            {priceLabel ? (
              <div style={{ marginTop: 6 }}>
                <OfferPriceDisplay
                  as="p"
                  className="cw-purchase-pending__price"
                  priceClassName="cw-purchase-pending__price-now"
                  price={priceLabel}
                  basePrice={basePriceLabel}
                  offerLabel={offerLabel}
                  saveLabel={saveLabel}
                  launchOffer={Boolean(basePriceLabel)}
                  onDark
                />
              </div>
            ) : null}
            <p style={{ ...bodyStyle, color: T.muted, marginTop: 6, fontSize: 13 }}>
              {t('consent.taxInclusive')}
            </p>
            {tier?.description ? (
              <p style={{ ...bodyStyle, color: T.muted, marginTop: 12, fontSize: 14 }}>{tier.description}</p>
            ) : null}
          </div>
        )}

        <ol
          style={{
            listStyle: 'none',
            margin: '24px 0 0',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {TRANSACTION_STEPS.map((step, index) => (
            <li key={step.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  borderRadius: 8,
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
                <p style={{ ...uiStyle, color: T.warmWhite }}>
                  {t(`purchase.step.${step.id}.title`)}
                </p>
                <p style={{ ...bodyStyle, color: T.muted, margin: '4px 0 0', fontSize: 14 }}>
                  {t(`purchase.step.${step.id}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {checkoutReady ? (
            <PrimaryButton
              onClick={onContinueCheckout}
              disabled={!checkoutEnabled}
              color={T.ember}
            >
              {t('checkout.consent.continue')}
            </PrimaryButton>
          ) : (
            <div
              role="status"
              style={{
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${T.muted}28`,
                background: 'color-mix(in srgb, #1a1a1f 55%, transparent)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <p style={{ ...uiStyle, color: T.warmWhite }}>
                {t('purchase.pending.setupTitle')}
              </p>
              <p style={{ ...bodyStyle, color: T.muted, margin: '6px 0 0', fontSize: 14 }}>
                {t('purchase.pending.setupBody')}
              </p>
              <div style={{ marginTop: 16, height: 12, position: 'relative' }}>
                <Seam variant="horizontal" style={{ position: 'relative', left: 0, right: 0 }} />
              </div>
            </div>
          )}

          {!checkoutReady && stagingAllowed && onStagingCheckout ? (
            <GhostButton onClick={onStagingCheckout} style={{ opacity: busy ? 0.7 : 1 }}>
              {t('purchase.pending.devUnlock')}
            </GhostButton>
          ) : null}

          {onPreview ? (
            <GhostButton onClick={onPreview}>{t('purchase.pending.preview')}</GhostButton>
          ) : (
            <Link
              to="/preview"
              style={{
                fontFamily: F.body,
                fontSize: 14,
                color: T.muted,
                textAlign: 'center',
                textDecoration: 'none',
                padding: 16,
              }}
            >
              {t('purchase.pending.preview')}
            </Link>
          )}

          <p style={{ ...metaStyle, color: T.muted, textAlign: 'center', textTransform: 'none', letterSpacing: 0 }}>
            {t('purchase.pending.already')}{' '}
            <Link to="/access" style={{ color: T.ember, textDecoration: 'none' }}>
              {t('purchase.pending.restore')}
            </Link>
          </p>

          {!checkoutReady && stagingAllowed ? (
            <p
              style={{
                ...metaStyle,
                color: `${T.muted}99`,
                textAlign: 'center',
                textTransform: 'none',
                letterSpacing: 0,
                lineHeight: 1.5,
              }}
            >
              {t('purchase.pending.devNote')}
            </p>
          ) : null}

          {!checkoutReady && !stagingAllowed ? (
            <p
              style={{
                ...metaStyle,
                color: `${T.muted}99`,
                textAlign: 'center',
                textTransform: 'none',
                letterSpacing: 0,
                lineHeight: 1.5,
              }}
            >
              {t('purchase.pending.noFree')}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
