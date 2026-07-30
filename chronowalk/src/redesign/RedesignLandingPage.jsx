/**
 * Production landing - Figma A1 design wired to checkout + preview routes.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasAccess } from '../lib/config.js'
import { openCheckout } from '../lib/checkout.js'
import { usePrice } from '../hooks/usePrice.js'
import CheckoutConsentDialog from '../components/legal/CheckoutConsentDialog.jsx'
import A1LandingHero from './screens/A1LandingHero.jsx'

export default function RedesignLandingPage() {
  const navigate = useNavigate()
  const { label } = usePrice()
  const [consentOpen, setConsentOpen] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)

  const handlePurchase = () => {
    setConsentOpen(true)
  }

  const handleConsentConfirm = async () => {
    setCheckoutBusy(true)
    const result = await openCheckout({ tierId: 'rome-complete', source: 'redesign_landing' })
    setCheckoutBusy(false)
    setConsentOpen(false)
    if (!result.ok) {
      navigate('/purchase?tier=rome-complete')
    }
  }

  const handlePreviewStory = () => {
    navigate('/preview')
  }

  const handleTryFree = () => {
    if (hasAccess()) {
      navigate('/tour')
      return
    }
    navigate('/preview')
  }

  return (
    <div className="redesign-app-shell">
      <A1LandingHero
        priceLabel={label}
        onPurchase={handlePurchase}
        onPreview={handleTryFree}
        onPreviewStory={handlePreviewStory}
      />
      <CheckoutConsentDialog
        open={consentOpen}
        tierLabel="Roma Eterna"
        priceLabel={label}
        busy={checkoutBusy}
        onConfirm={handleConsentConfirm}
        onCancel={() => {
          if (!checkoutBusy) setConsentOpen(false)
        }}
      />
    </div>
  )
}
