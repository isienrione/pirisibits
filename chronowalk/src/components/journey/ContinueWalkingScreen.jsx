import { useState } from 'react'
import tourHeroFallback from '../../assets/tour-hero.svg'
import { formatDistanceToNext, formatWalkingTime } from '../../content/journeyProgress'
import { BronzeButton } from '../ui'

export default function ContinueWalkingScreen({
  destination,
  heroImage,
  distanceMeters,
  stopNumber,
  totalStops,
  isLastStop = false,
  onContinue,
}) {
  const [imageSrc, setImageSrc] = useState(heroImage ?? tourHeroFallback)
  const distanceLabel = formatDistanceToNext(distanceMeters)
  const walkingTimeLabel = formatWalkingTime(distanceMeters)
  const progressPercent = totalStops > 0 ? Math.round((stopNumber / totalStops) * 100) : 0

  return (
    <div
      className="min-h-dvh bg-ivory text-deep-slate paper-texture"
      data-testid="continue-walking-screen"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pb-safe pt-safe sm:px-8">
        <p className="text-eyebrow uppercase text-bronze">Continue walking</p>

        <div className="mt-10">
          <p className="text-sm font-medium text-soft-slate">Journey progress</p>
          <p className="mt-2 font-display text-2xl font-semibold leading-tight">
            {stopNumber} of {totalStops}
          </p>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-parchment"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Journey progress"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-bronze via-bronze to-bronze-dark transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {isLastStop ? (
          <div className="mt-14">
            <h1 className="font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight sm:text-5xl">
              Tour complete
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-soft-slate">
              You have visited every stop on this route. Continue to see your journey
              summary.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-parchment/80 bg-parchment/40 shadow-plaque-lg">
              <img
                src={imageSrc}
                alt=""
                className="aspect-[4/3] w-full object-cover"
                onError={() => {
                  if (imageSrc !== tourHeroFallback) {
                    setImageSrc(tourHeroFallback)
                  }
                }}
              />
            </div>

            <p className="mt-10 text-sm font-medium uppercase tracking-[0.16em] text-bronze">
              Next destination
            </p>
            <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight sm:text-[2.75rem]">
              {destination?.title ?? 'Next landmark'}
            </h1>

            {distanceLabel || walkingTimeLabel ? (
              <p className="mt-5 text-lg text-soft-slate">
                {[distanceLabel, walkingTimeLabel].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </>
        )}

        <div className="mt-auto pt-12">
          <BronzeButton fullWidth size="lg" onClick={onContinue}>
            Continue
          </BronzeButton>
        </div>
      </div>
    </div>
  )
}
