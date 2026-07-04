import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FREE_PREVIEW_ANCIENT_POSTER } from '../data/freePreview'
import { loadRomeTourManifest } from '../content/romeTourManifest'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import tourHeroFallback from '../assets/tour-hero.svg'
import { Button, GoldButton, cn } from '../components/ui'
import { ROUTES } from '../routes/paths'

const APP_NAME = 'ChronoWalk'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

export default function LandingPage() {
  const navigate = useNavigate()
  const manifest = useMemo(() => loadRomeTourManifest(), [])
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  const stopCount = manifest.stops.length

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
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/30 via-obsidian/70 to-obsidian" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-2xl flex-col px-6 pb-safe pt-safe">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-gold/90">
          {APP_NAME}
        </p>

        <div className="mt-auto">
          <h1 className="font-display text-[2.75rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            Rome, as it once was.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ivory/80">
            Walk the city at your pace with place-aware audio stories and cinematic reconstructions
            that bring ancient landmarks back to life.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <GoldButton
              fullWidth
              showArrow
              onClick={() => {
                triggerHaptic(HAPTIC_KIND.SUCCESS)
                navigate(ROUTES.begin)
              }}
            >
              Begin your journey
            </GoldButton>
            <Button
              variant="outline-dark"
              size="lg"
              fullWidth
              onClick={() => {
                triggerHaptic(HAPTIC_KIND.SOFT_TAP)
                navigate(ROUTES.legacy)
              }}
            >
              Try the free preview
            </Button>
          </div>

          <p className="mt-5 text-center text-sm text-ivory/70">
            {stopCount} places · self-paced · works offline
          </p>

          <section
            className="mt-8 overflow-hidden rounded-3xl border border-gold/30 bg-obsidian/40 backdrop-blur-sm"
            aria-label="Colosseum preview"
          >
            <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[10rem]">
                <img
                  src={FREE_PREVIEW_ANCIENT_POSTER}
                  alt="Ancient reconstruction of the Colosseum"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center px-5 py-5">
                <p className="text-eyebrow uppercase text-gold/90">Start here</p>
                <h2 className="mt-2 font-display text-lg font-semibold">The Colosseum</h2>
                <p className="mt-2 text-sm leading-relaxed text-ivory/70">
                  Your journey begins at Rome&apos;s greatest amphitheatre — unlock the first story
                  when you arrive.
                </p>
              </div>
            </div>
          </section>

          <p className="mt-8 pb-4 text-center text-sm text-ivory/65">
            <Link to={ROUTES.legacy} className="underline-offset-2 hover:underline">
              Open classic tour experience
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
