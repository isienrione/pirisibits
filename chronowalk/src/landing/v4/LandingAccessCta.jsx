import { LANDING_CONTENT } from '../landingData.js'

/**
 * High-visibility access CTA for returning purchasers.
 */
export default function LandingAccessCta({ className = '' }) {
  const { accessHref, accessLinkLabel } = LANDING_CONTENT.pricing
  if (!accessHref) return null

  return (
    <div className={`cw-v4-access-cta${className ? ` ${className}` : ''}`}>
      <p className="cw-v4-access-cta__eyebrow">Already purchased?</p>
      <a href={accessHref} className="cw-v4-access-cta__button">
        {accessLinkLabel?.replace(/^Already purchased\?\s*/i, '') || 'Open your access link'}
      </a>
      <p className="cw-v4-access-cta__note">Use the link from your purchase email to open your walk.</p>
    </div>
  )
}
