import { useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import { GlassPanel } from './ui'
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
    <div className="relative min-h-screen overflow-x-hidden bg-warm-white">
      <div className="absolute inset-x-0 top-0 h-[min(58vh,36rem)] sm:h-[min(62vh,38rem)]">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-[center_38%]"
          onError={handleHeroError}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-warm-white/10 via-warm-white/35 to-warm-white"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-deep-slate/50 via-deep-slate/5 to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-safe pt-safe sm:px-6 lg:max-w-3xl">
        <div className="h-[min(30vh,12rem)] shrink-0 sm:h-[min(34vh,14rem)]" aria-hidden="true" />

        <GlassPanel className="rounded-3xl p-6 shadow-glass-lg sm:p-8 lg:p-10">
          <TourIntroContent onTryFreePreview={onTryFreePreview} onViewTours={onViewTours} />
        </GlassPanel>

        <div className="h-6 shrink-0 sm:h-8" aria-hidden="true" />
      </div>
    </div>
  )
}

export default TourIntroScreen
