import { useState } from 'react'
import tourHeroFallback from '../../assets/tour-hero.svg'
import { BronzeButton } from '../ui'

function JourneyPanel({ journey }) {
  const [imageSrc, setImageSrc] = useState(journey.heroImage)

  return (
    <article
      className="overflow-hidden rounded-[2rem] border border-parchment/80 bg-ivory shadow-plaque-lg"
      data-testid={`explore-journey-${journey.id}`}
      aria-label={`${journey.city} journey`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/11]">
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover object-center"
          onError={() => {
            if (imageSrc !== tourHeroFallback) {
              setImageSrc(tourHeroFallback)
            }
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-deep-slate/70 via-deep-slate/10 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7 pt-16 sm:px-8 sm:pb-8">
          <h2 className="font-display text-[2.35rem] font-semibold leading-[1.02] tracking-tight text-ivory sm:text-5xl">
            {journey.city}
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ivory/78 sm:text-lg">
            {journey.line}
          </p>
        </div>
      </div>
    </article>
  )
}

export default function ExploreMoreScreen({
  title,
  subtitle,
  journeys = [],
  onBack,
  onReturnHome,
}) {
  return (
    <div
      className="min-h-dvh bg-ivory text-deep-slate paper-texture"
      data-testid="explore-more-screen"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 pb-safe pt-safe sm:px-8">
        <header>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 min-h-11 text-sm font-medium text-soft-slate transition hover:text-deep-slate"
          >
            Back to your passport
          </button>

          <p className="mt-8 text-eyebrow uppercase text-bronze">Explore more</p>
          <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-soft-slate sm:text-lg">
            {subtitle}
          </p>
        </header>

        <section className="mt-10 flex-1 space-y-8 pb-10 sm:space-y-10" aria-label="Featured journeys">
          {journeys.map((journey) => (
            <JourneyPanel key={journey.id} journey={journey} />
          ))}
        </section>

        {onReturnHome ? (
          <footer className="pb-8">
            <div className="w-full max-w-xs">
              <BronzeButton fullWidth size="lg" onClick={onReturnHome}>
                Return home
              </BronzeButton>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
