import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tourHeroFallback from '../assets/tour-hero.svg'
import { BronzeButton, Button, ParchmentCard, cn } from '../components/ui'
import { metaLabel } from '../components/ui/styles'
import { getLandingTrustStats } from '../content/tourProductTruth.js'
import { loadRomeManifest } from '../content/manifest.js'
import { ROUTES, settingsPath } from '../routes/paths'

const LOGO_SRC = '/brand/chronowalk-logo.png'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`
const PANTHEON_PREVIEW_POSTER = '/waypoints/pantheon/ancient-poster.jpg'

const SUPPORTING_COPY =
  'Walk the eternal city as it stood under emperors - every stone restored, every moment waiting to be lived.'

const TRUST_STATS = getLandingTrustStats(loadRomeManifest())

export default function LandingPage() {
  const navigate = useNavigate()
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  return (
    <div className="min-h-dvh overflow-x-hidden bg-ivory text-deep-slate paper-texture">
      <div className="relative h-dvh min-h-[32rem] w-full">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
          onError={() => setHeroSrc(tourHeroFallback)}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-deep-slate/25 via-transparent to-ivory"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/20 to-transparent"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col px-6 pt-safe">
          <div className="flex items-start justify-between gap-4">
            <img
              src={LOGO_SRC}
              alt="ChronoWalk"
              className="h-auto w-[min(52vw,11rem)] drop-shadow-[0_4px_24px_rgba(28,28,28,0.35)]"
            />
            <button
              type="button"
              onClick={() => navigate(settingsPath())}
              className="mt-1 min-h-11 rounded-full px-3 text-sm font-medium text-ivory/80 transition hover:text-ivory"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="relative -mt-16 mx-auto max-w-lg px-6 pb-safe sm:max-w-2xl sm:px-8">
        <h1 className="font-display text-[3.25rem] font-semibold leading-[0.98] tracking-tight sm:text-[3.75rem]">
          Rome,
          <br />
          as it once was.
        </h1>

        <p className="mt-6 max-w-md text-lg leading-relaxed text-soft-slate sm:text-xl">
          {SUPPORTING_COPY}
        </p>

        <div className="mt-10 flex flex-col gap-4">
          <BronzeButton size="lg" fullWidth onClick={() => navigate(ROUTES.begin)}>
            Begin your journey
          </BronzeButton>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate(ROUTES.legacy)}
          >
            Try the free preview
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {TRUST_STATS.map((stat) => (
            <div key={stat.id} className="flex flex-col gap-1">
              <p className={cn(metaLabel, 'text-bronze')}>{stat.label}</p>
            </div>
          ))}
        </div>

        <ParchmentCard className="mt-12 overflow-hidden p-0 shadow-plaque-lg" texture>
          <div className="relative aspect-[4/3] w-full">
            <img
              src={PANTHEON_PREVIEW_POSTER}
              alt="Ancient reconstruction of the Pantheon"
              className="h-full w-full object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-deep-slate/35 via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>
          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <h2 className="font-display text-2xl font-semibold leading-tight text-deep-slate">
              Hear the Pantheon
            </h2>
            <p className="mt-2 text-sm font-medium text-soft-slate">4 minutes</p>
            <BronzeButton
              size="lg"
              fullWidth
              className="mt-6"
              onClick={() => navigate(ROUTES.legacy)}
            >
              Preview Story
            </BronzeButton>
          </div>
        </ParchmentCard>
      </div>
    </div>
  )
}
