import { useEffect, useState } from 'react'
import { formatConfigPrice, loadAppConfig } from '../lib/config.js'
import {
  formatEurFromCents,
  getEffectivePriceCents,
  isLaunchOfferActive,
} from '../lib/launchOffer.js'
import { isPaddleCheckoutReady } from '../lib/paddle.js'
import { LANDING_PRICE_FALLBACK_CENTS, LANDING_PRICE_FALLBACK_LABEL } from './landingData.js'

function resolveLandingDisplayCents(configCents) {
  // Sticky / journey CTAs anchor on Roma Eterna (recommended), not cheapest Historica.
  if (isLaunchOfferActive()) {
    return getEffectivePriceCents('rome-complete', LANDING_PRICE_FALLBACK_CENTS)
  }
  return configCents ?? LANDING_PRICE_FALLBACK_CENTS
}

/** Landing-only price hook - avoids importing the full Rome manifest at module scope. */
export function useLandingPrice() {
  const initialCents = resolveLandingDisplayCents(LANDING_PRICE_FALLBACK_CENTS)
  const [price, setPrice] = useState({
    label: isLaunchOfferActive()
      ? formatEurFromCents(initialCents)
      : LANDING_PRICE_FALLBACK_LABEL,
    cents: initialCents,
    currency: 'EUR',
    checkoutUrl: '',
    checkoutReady: isPaddleCheckoutReady(),
  })

  useEffect(() => {
    let cancelled = false

    loadAppConfig().then((config) => {
      if (cancelled) return
      const configCents = config.abVariantCents ?? config.price.cents
      const cents = resolveLandingDisplayCents(configCents)
      const currency = config.price.currency ?? 'EUR'
      setPrice({
        cents,
        currency,
        label: formatConfigPrice(cents, currency),
        checkoutUrl: config.checkout_url ?? '',
        checkoutReady:
          typeof config.checkout_ready === 'boolean'
            ? config.checkout_ready
            : isPaddleCheckoutReady(undefined, config.paddle_prices),
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return price
}
