import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tourHeroFallback from '../assets/tour-hero.svg'
import { Button, GoldButton, cn } from '../components/ui'
import { ROUTES } from '../routes/paths'

const APP_NAME = 'ChronoWalk'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`
const PANTHEON_PREVIEW_POSTER = '/waypoints/pantheon/ancient-poster.jpg'

function PlayIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 8.5v7l6-3.5-6-3.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-obsidian text-ivory">
      <div className="absolute inset-0">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-[center_35%]"
          onError={() => setHeroSrc(tourHeroFallback)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/35 via-obsidian/75 to-obsidian" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-safe pt-safe">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-gold/90">
          {APP_NAME}
        </p>

        <div className="mt-auto">
          <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight">
            Rome, as it once was.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ivory/80">
            GPS-guided audio stories, ancient reconstructions, and self-paced routes through the
            city&apos;s most legendary places.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <GoldButton
              fullWidth
              showArrow
              onClick={() => navigate(ROUTES.begin)}
            >
              Begin your journey
            </GoldButton>
            <Button
              variant="outline-dark"
              size="lg"
              fullWidth
              onClick={() => navigate(ROUTES.legacy)}
            >
              Try the free preview
            </Button>
          </div>

          <p className="mt-5 text-center text-sm text-ivory/70">
            22 places · self-paced · works offline
          </p>

          <section
            className="mt-8 overflow-hidden rounded-3xl border border-gold/25 bg-obsidian/50 backdrop-blur-sm"
            aria-label="Pantheon preview"
          >
            <div className="flex items-center gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gold/20">
                <img
                  src={PANTHEON_PREVIEW_POSTER}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 to-transparent" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold leading-tight">Hear the Pantheon</h2>
                <p className="mt-1 text-sm text-ivory/70">Free preview · 4 minutes</p>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                  'border border-gold/35 bg-gold/10 text-gold shadow-gold-glow'
                )}
                aria-hidden="true"
              >
                <PlayIcon className="h-6 w-6" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
