/**
 * Restrained Launch Offer price display: struck base + primary promo + label.
 * When the offer is inactive, renders the plain price.
 */

export default function OfferPriceDisplay({
  price,
  basePrice = null,
  offerLabel = null,
  launchOffer = false,
  className = '',
  priceClassName = '',
  note = null,
  noteClassName = '',
  as = 'div',
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

  return (
    <Tag className={`${className} cw-offer-price`.trim()}>
      <span className="cw-offer-price__stack">
        <s className="cw-offer-price__was">{basePrice}</s>
        <span className={`${priceClassName} cw-offer-price__now`.trim()}>{price}</span>
        {offerLabel ? <span className="cw-offer-price__label">{offerLabel}</span> : null}
      </span>
      {note ? <span className={noteClassName}>{note}</span> : null}
    </Tag>
  )
}
