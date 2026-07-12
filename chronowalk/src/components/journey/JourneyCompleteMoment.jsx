import { useState } from 'react'
import tourHeroFallback from '../../assets/tour-hero.svg'
import { GoldButton } from '../ui'

export default function JourneyCompleteMoment({
  headline,
  subline,
  heroImage,
  onViewSummary,
}) {
  const [imageSrc, setImageSrc] = useState(heroImage ?? tourHeroFallback)

  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-[#080808] text-ivory"
      data-testid="journey-complete-moment"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0">
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="h-[58vh] w-full object-cover object-[center_42%] sm:h-[62vh]"
          onError={() => {
            if (imageSrc !== tourHeroFallback) {
              setImageSrc(tourHeroFallback)
            }
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#080808]/10 via-[#080808]/45 to-[#080808]"
          aria-hidden="true"
        />
      </div>

      <div className="relative flex min-h-dvh flex-col justify-end px-8 pb-safe pt-[48vh] sm:px-12">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-ivory sm:text-[3.5rem] sm:leading-[1.04]">
            {headline}
          </h1>

          {subline ? (
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-ivory/68 sm:mt-10 sm:text-xl sm:leading-relaxed">
              {subline}
            </p>
          ) : null}

          <div className="mt-16 w-full max-w-xs sm:mt-20">
            <GoldButton fullWidth showArrow onClick={onViewSummary}>
              View Summary
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  )
}
