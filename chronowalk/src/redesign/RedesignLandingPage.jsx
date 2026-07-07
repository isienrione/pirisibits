/**
 * Production landing — Figma A1 design wired to checkout + preview routes.
 */
import { useNavigate } from 'react-router-dom'
import { buildCheckoutUrl, getHost } from '../lib/host.js'
import { hasAccess } from '../lib/config.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import { usePrice } from '../hooks/usePrice.js'
import A1LandingHero from './screens/A1LandingHero.jsx'

export default function RedesignLandingPage() {
  const navigate = useNavigate()
  const { cents, checkoutUrl } = usePrice()

  const handlePurchase = () => {
    const url = buildCheckoutUrl(checkoutUrl, {
      host: getHost(),
      abVariantCents: cents,
    })
    if (!url) {
      navigate('/access')
      return
    }
    track(TRACK_EVENTS.CHECKOUT_OPEN, { price_cents: cents })
    window.location.assign(url)
  }

  const handlePreviewStory = () => {
    navigate('/preview')
  }

  const handleTryFree = () => {
    if (hasAccess()) {
      navigate('/tour')
      return
    }
    navigate('/access')
  }

  return (
    <div className="redesign-app-shell">
      <A1LandingHero
        onPurchase={handlePurchase}
        onPreview={handleTryFree}
        onPreviewStory={handlePreviewStory}
      />
    </div>
  )
}
