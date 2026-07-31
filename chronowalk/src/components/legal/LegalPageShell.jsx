import { Link } from 'react-router-dom'
import GoldSeam from '../../landing/GoldSeam.jsx'
import LandingSiteFooter from '../../landing/LandingSiteFooter.jsx'
import '../../landing/ChronoWalkLanding.v2.css'
import './legal.css'

/**
 * Standalone long-form reading shell for legal / contact pages.
 * Daylight surface + site footer (Paddle navigation requirements).
 */
export default function LegalPageShell({ children }) {
  return (
    <div className="cw-legal-page">
      <main className="cw-legal-page__main">
        <Link to="/" className="cw-legal-page__back">
          ← Back to ChronoWalk
        </Link>
        {children}
        <div style={{ marginTop: '2.5rem' }}>
          <GoldSeam variant="act" />
        </div>
      </main>
      <LandingSiteFooter pricingHref="/#pricing" landingPrefix="/" />
    </div>
  )
}
