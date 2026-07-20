import { useEffect, useState } from 'react'
import { formatConfigPrice, loadAppConfig } from '../lib/config'
import { loadRomeManifest } from '../content/manifest.js'
import { isPaddleCheckoutReady } from '../lib/paddle.js'

const ROME_PRICE_FALLBACK = loadRomeManifest().product?.priceFallbackCents
  ?? loadRomeManifest().price_fallback_cents
  ?? 1499

export function usePrice() {
  const [price, setPrice] = useState({
    label: formatConfigPrice(ROME_PRICE_FALLBACK, 'EUR'),
    cents: ROME_PRICE_FALLBACK,
    currency: 'EUR',
    checkoutUrl: '',
    checkoutReady: isPaddleCheckoutReady(),
  })

  useEffect(() => {
    let cancelled = false

    loadAppConfig().then((config) => {
      if (cancelled) return
      const cents = config.abVariantCents ?? config.price.cents
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
