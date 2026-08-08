/**
 * Launch Offer price display: scratched base price + highlighted promo + labels.
 * When the offer is inactive, renders the plain price.
 */

import { getLaunchOfferHeroPriceParts } from '../lib/launchOffer.js'
import './OfferPriceDisplay.css'

/** Hero / acquisition unlock CTA with scratched list price when Launch Offer is on. */
export function LaunchOfferUnlockCtaLabel({ fallback, short = false, onDark = false }) {
  const parts = getLaunchOfferHeroPriceParts()
  if (!parts) return fallback
  return (
    <span className="cw-offer-unlock-cta">
      <span className="cw-offer-unlock-cta__text">{short ? parts.prefixShort : parts.prefix}</span>
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
  const Tag = as
  const showOffer = Boolean(launchOffer && basePrice && price)

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

  const a11y = [basePrice, 'now', price, offerLabel, saveLabel].filter(Boolean).join(' · ')

  return (
    <Tag className={modifiers} data-testid="cw-offer-price" aria-label={a11y}>
      <span className="cw-offer-price__stack">
        <span className="cw-offer-price__was-wrap">
          <s className="cw-offer-price__was">{basePrice}</s>
          <span className="cw-offer-price__scratch" aria-hidden="true" />
        </span>
        <span className="cw-offer-price__now-wrap">
          <span className={`${priceClassName} cw-offer-price__now`.trim()}>{price}</span>
          {offerLabel || saveLabel ? (
            <span className="cw-offer-price__meta">
              {offerLabel ? <span className="cw-offer-price__label">{offerLabel}</span> : null}
              {saveLabel ? <span className="cw-offer-price__save">{saveLabel}</span> : null}
            </span>
          ) : null}
        </span>
      </span>
      {note ? <span className={noteClassName}>{note}</span> : null}
    </Tag>
  )
}
