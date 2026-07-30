import { useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import TourIntroContent from './TourIntroContent'

const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

/** Standalone intro screen — scrolls to catalog when embedded in TourLanding. */
function TourIntroScreen({ onTryFreePreview, onViewTours }) {
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  const handleHeroError = () => {
    if (heroSrc !== tourHeroFallback) {
      setHeroSrc(tourHeroFallback)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bone">
      <div className="absolute inset-x-0 top-0 h-[min(58vh,36rem)] sm:h-[min(62vh,38rem)]">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-[center_38%]"
          onError={handleHeroError}
        />
        <div
          className="absolute inset-0 bg-[color-mix(in_srgb,var(--bone)_72%,transparent)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[color-mix(in_srgb,var(--ink)_45%,transparent)]"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-safe pt-safe sm:px-6 lg:max-w-3xl">
        <div className="h-[min(30vh,12rem)] shrink-0 sm:h-[min(34vh,14rem)]" aria-hidden="true" />

        <div className="bg-ink900 rounded-card rounded-3xl p-6 sm:p-8 lg:p-10">
          <TourIntroContent onTryFreePreview={onTryFreePreview} onViewTours={onViewTours} />
        </div>

        <div className="h-6 shrink-0 sm:h-8" aria-hidden="true" />
      </div>
    </div>
  )
}

export default TourIntroScreen
