import { useEffect, useState } from 'react'
import { formatConfigPrice, loadAppConfig } from '../lib/config'
import { loadRomeManifest } from '../content/manifest.js'

const ROME_PRICE_FALLBACK = loadRomeManifest().product?.priceFallbackCents
  ?? loadRomeManifest().price_fallback_cents
  ?? 1499

export function usePrice() {
  const [price, setPrice] = useState({
    label: formatConfigPrice(ROME_PRICE_FALLBACK, 'EUR'),
    cents: ROME_PRICE_FALLBACK,
    currency: 'EUR',
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
        checkoutUrl: config.checkout_url,
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return price
}
