import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tourHeroFallback from '../assets/tour-hero.svg'
import { LAUNCH_DESTINATIONS } from '../content/launchDestinations'
import { Button, cn } from '../components/ui'
import { metaLabel } from '../components/ui/styles'
import { ROUTES, tourDetailPath } from '../routes/paths'

function DestinationCard({ destination, onSelect }) {
  const [heroSrc, setHeroSrc] = useState(destination.heroImage)

  return (
    <button
      type="button"
      disabled={!destination.available}
      onClick={() => onSelect(destination)}
      className={cn(
        'group w-full overflow-hidden rounded-[2rem] border border-parchment/80 bg-ivory text-left shadow-plaque-lg transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory',
        destination.available
          ? 'hover:border-bronze/35 hover:shadow-plaque-lg active:scale-[0.995]'
          : 'cursor-default opacity-80'
      )}
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden sm:aspect-[16/10]">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            'h-full w-full object-cover transition duration-500',
            destination.available ? 'group-hover:scale-[1.02]' : 'grayscale-[0.15]'
          )}
          onError={() => {
            if (heroSrc !== tourHeroFallback) {
              setHeroSrc(tourHeroFallback)
            }
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-deep-slate/55 via-deep-slate/10 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className={cn(metaLabel, 'text-gold/90')}>{destination.subtitle}</p>
          <h2 className="mt-2 font-display text-4xl font-semibold leading-none tracking-tight text-ivory sm:text-5xl">
            {destination.city}
          </h2>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-7">
        <p className={cn(metaLabel, 'text-bronze')}>{destination.placeCount} places</p>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-soft-slate">
          {destination.description}
        </p>
      </div>
    </button>
  )
}

export default function TourSelectionPage() {
  const navigate = useNavigate()

  const handleSelect = (destination) => {
    if (!destination.available) return
    navigate(tourDetailPath(destination.id))
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-ivory text-deep-slate paper-texture">
      <div className="mx-auto max-w-2xl px-6 pb-safe pt-safe sm:px-8">
        <Button
          variant="ghost"
          size="md"
          className="-ml-2 self-start rounded-full px-4 text-soft-slate hover:text-deep-slate"
          onClick={() => navigate(ROUTES.home)}
        >
          ← Back
        </Button>

        <header className="mt-4">
          <p className={cn(metaLabel, 'text-bronze')}>ChronoWalk</p>
          <h1 className="mt-3 font-display text-[2.5rem] font-semibold leading-[1.02] tracking-tight sm:text-5xl">
            Choose your journey
          </h1>
        </header>

        <div className="mt-10 space-y-8 pb-8 sm:mt-12 sm:space-y-10">
          {LAUNCH_DESTINATIONS.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
