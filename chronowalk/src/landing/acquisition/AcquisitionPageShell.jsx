import { useEffect } from 'react'
import LandingSiteFooter from '../LandingSiteFooter.jsx'
import AcquisitionHeader from './AcquisitionHeader.jsx'
import { trackAcquisitionPageView } from './acquisitionAnalytics.js'
import '../ChronoWalkLanding.css'
import '../ChronoWalkLanding.v2.css'
import '../ChronoWalkLanding.v4.css'
import './AcquisitionPages.css'

/**
 * Shared shell for focused Ads acquisition pages.
 * Homepage ChronoWalkLanding remains the canonical complete sales journey.
 * Document title / canonical / OG tags come from DocumentSeo + pageMeta.
 */
export default function AcquisitionPageShell({
  landingPageType,
  children,
  headerPrimaryCta,
  headerPrimaryTo,
  onHeaderPrimaryClick,
  showHowItWorksLink = true,
}) {
  useEffect(() => {
    trackAcquisitionPageView(landingPageType)
  }, [landingPageType])

  return (
    <div className="cw-landing cw-landing--premium cw-landing--v4 cw-acq">
      <AcquisitionHeader
        primaryCta={headerPrimaryCta}
        primaryTo={headerPrimaryTo}
        onPrimaryClick={onHeaderPrimaryClick}
        showHowItWorks={showHowItWorksLink}
      />
      <main id="main" className="cw-acq-main">
        {children}
      </main>
      <LandingSiteFooter pricingHref="/#pricing" landingPrefix="/" />
    </div>
  )
}
