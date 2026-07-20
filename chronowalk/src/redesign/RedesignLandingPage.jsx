/**
 * Production landing — Figma A1 design wired to checkout + preview routes.
 */
import { useNavigate } from 'react-router-dom'
import { hasAccess } from '../lib/config.js'
import { openCheckout } from '../lib/checkout.js'
import { usePrice } from '../hooks/usePrice.js'
import A1LandingHero from './screens/A1LandingHero.jsx'

export default function RedesignLandingPage() {
  const navigate = useNavigate()
  const { label } = usePrice()

  const handlePurchase = async () => {
    const result = await openCheckout({ tierId: 'rome-complete', source: 'redesign_landing' })
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
    </div>
  )
}
