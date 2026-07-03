import { useEffect, useState } from 'react'
import { formatConfigPrice, loadAppConfig } from './config'

export function usePrice() {
  const [price, setPrice] = useState({ label: '€17', cents: 1700, currency: 'EUR' })

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
