import { useEffect, useState } from 'react'
import { formatConfigPrice, loadAppConfig } from '../lib/config.js'
import { LANDING_PRICE_FALLBACK_CENTS, LANDING_PRICE_FALLBACK_LABEL } from './landingData.js'

/** Landing-only price hook — avoids importing the full Rome manifest at module scope. */
export function useLandingPrice() {
  const [price, setPrice] = useState({
    label: LANDING_PRICE_FALLBACK_LABEL,
    cents: LANDING_PRICE_FALLBACK_CENTS,
    currency: 'USD',
    checkoutUrl: '',
  })

  useEffect(() => {
    let cancelled = false

    loadAppConfig().then((config) => {
      if (cancelled) return
      const cents = config.abVariantCents ?? config.price.cents
      const currency = config.price.currency ?? 'USD'
      setPrice({
        cents,
        currency,
        label: formatConfigPrice(cents, currency),
        checkoutUrl: config.checkout_url,
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return price
}
