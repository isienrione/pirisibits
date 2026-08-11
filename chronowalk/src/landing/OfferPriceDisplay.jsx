/**
 * Launch Offer price display: scratched base price + highlighted promo + labels.
 * When the offer is inactive, renders the plain price.
 */

import { getLaunchOfferHeroPriceParts } from '../lib/launchOffer.js'
import { useI18n } from '../i18n/I18nProvider.jsx'
import { localizeLandingPriceCopy } from './getLocalizedLanding.js'
import './OfferPriceDisplay.css'

function localizeOfferBadges(offerLabel, saveLabel, t) {
  const displayOfferLabel = offerLabel ? t('offer.launch') : null
  const amount = typeof saveLabel === 'string' ? saveLabel.match(/€[\d.,]+/)?.[0] : null
  const displaySaveLabel = saveLabel
    ? amount
      ? t('offer.save', { amount })
      : saveLabel
    : null
  return { displayOfferLabel, displaySaveLabel }
}

/** Hero / acquisition unlock CTA with scratched list price when Launch Offer is on. */
export function LaunchOfferUnlockCtaLabel({ fallback, short = false, onDark = false }) {
  const { locale } = useI18n()
  const parts = getLaunchOfferHeroPriceParts()
  if (!parts) return fallback
  return (
    <span className="cw-offer-unlock-cta">
      <span className="cw-offer-unlock-cta__text">
        {localizeLandingPriceCopy(short ? parts.prefixShort : parts.prefix, locale)}
      </span>
      <span className="cw-offer-unlock-cta__dot" aria-hidden="true">
        ·
      </span>
      <OfferPriceDisplay
        price={parts.price}
        basePrice={parts.basePrice}
        launchOffer
        inline
        onDark={onDark}
        className="cw-offer-unlock-cta__price"
      />
    </span>
  )
}

export default function OfferPriceDisplay({
  price,
  basePrice = null,
  offerLabel = null,
  saveLabel = null,
  launchOffer = false,
  className = '',
  priceClassName = '',
  note = null,
  noteClassName = '',
  as = 'div',
  compact = false,
  inline = false,
  onDark = false,
}) {
  const { t } = useI18n()
  const Tag = as
  const showOffer = Boolean(launchOffer && basePrice && price)
  const { displayOfferLabel, displaySaveLabel } = localizeOfferBadges(offerLabel, saveLabel, t)

  if (!showOffer) {
    return (
      <Tag className={className}>
        <span className={priceClassName}>{price}</span>
        {note ? <span className={noteClassName}>{note}</span> : null}
      </Tag>
    )
  }

  const modifiers = [
    'cw-offer-price',
    compact ? 'cw-offer-price--compact' : '',
    inline ? 'cw-offer-price--inline' : '',
    onDark ? 'cw-offer-price--on-dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const a11y = [basePrice, t('offer.now'), price, displayOfferLabel, displaySaveLabel]
    .filter(Boolean)
    .join(' · ')

  return (
    <Tag className={modifiers} data-testid="cw-offer-price" aria-label={a11y}>
      <span className="cw-offer-price__stack">
        <span className="cw-offer-price__was-wrap">
          <s className="cw-offer-price__was">{basePrice}</s>
          <span className="cw-offer-price__scratch" aria-hidden="true" />
        </span>
        <span className="cw-offer-price__now-wrap">
          <span className={`${priceClassName} cw-offer-price__now`.trim()}>{price}</span>
          {displayOfferLabel || displaySaveLabel ? (
            <span className="cw-offer-price__meta">
              {displayOfferLabel ? (
                <span className="cw-offer-price__label">{displayOfferLabel}</span>
              ) : null}
              {displaySaveLabel ? (
                <span className="cw-offer-price__save">{displaySaveLabel}</span>
              ) : null}
            </span>
          ) : null}
        </span>
      </span>
      {note ? <span className={noteClassName}>{note}</span> : null}
    </Tag>
  )
}
