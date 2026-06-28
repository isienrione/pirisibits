import { useMemo, useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import { TOUR_PREVIEW_HIGHLIGHTS, FREE_PREVIEW_ANCIENT_POSTER } from '../data/freePreview'
import { getWaypointGeo } from '../data/waypointGeo'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import { Button, GlassPanel } from './ui'

const APP_NAME = 'ChronoWalk'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

const PILLARS = [
  {
    id: 'pace',
    title: 'Your pace',
    body: 'Finish in an afternoon or spread the walk across several days — pause anytime and pick up where you left off.',
  },
  {
    id: 'audio',
    title: 'Expert companion',
    body: 'Layered audio stories, context, and fun facts about what you are actually looking at — like a brilliant guide in your pocket.',
  },
  {
    id: 'reveals',
    title: 'See ancient Rome',
    body: 'Before-and-after reconstructions at every landmark so ruins come alive under the same sky you see today.',
  },
]

function PreviewHighlightsList({ expanded }) {
  const stops = useMemo(
    () =>
      TOUR_PREVIEW_HIGHLIGHTS.map((item) => ({
        ...item,
        title: getWaypointGeo(item.id)?.title ?? item.id,
      })),
    []
  )

  const visible = expanded ? stops : stops.slice(0, 4)

  return (
    <ol className="mt-4 space-y-2">
      {visible.map((stop, index) => (
        <li
          key={stop.id}
          className="flex items-start gap-3 rounded-2xl border border-limestone/60 bg-warm-white/70 px-3 py-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-deep-slate">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-deep-slate">{stop.title}</p>
            <p className="text-xs text-soft-slate">{stop.tour}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function TourIntroScreen({ onTryFreePreview, onViewTours }) {
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)
  const [previewExpanded, setPreviewExpanded] = useState(false)

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
          <p className="text-eyebrow uppercase text-terracotta">{APP_NAME}</p>
          <h1 className="mt-3 font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-deep-slate sm:text-4xl">
            A detailed, entertaining self-guided audio tour of Rome
          </h1>
          <p className="mt-4 text-base leading-relaxed text-soft-slate sm:text-[1.05rem]">
            Walk the city on your own schedule with ChronoWalk as your expert companion — always
            ready with layered stories, historical context, and the kind of fun knowledge that makes
            every ruin feel alive.
          </p>

          <ul className="mt-6 space-y-4">
            {PILLARS.map((pillar) => (
              <li
                key={pillar.id}
                className="rounded-2xl border border-limestone/60 bg-sand/30 px-4 py-3.5"
              >
                <p className="text-sm font-semibold text-deep-slate">{pillar.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-soft-slate">{pillar.body}</p>
              </li>
            ))}
          </ul>

          <section className="mt-8 border-t border-limestone/60 pt-6" aria-label="Tour preview">
            <p className="text-eyebrow uppercase text-terracotta">What you will walk</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-deep-slate">
              Two routes, twenty landmarks
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-soft-slate">
              The Roman Forum cluster and a city-wide loop through the Colosseum, centro storico,
              fountains, piazzas, and the Tiber.
            </p>

            <PreviewHighlightsList expanded={previewExpanded} />

            {TOUR_PREVIEW_HIGHLIGHTS.length > 4 ? (
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-terracotta underline-offset-2 hover:underline"
                onClick={() => {
                  triggerHaptic(HAPTIC_KIND.SOFT_TAP)
                  setPreviewExpanded((open) => !open)
                }}
              >
                {previewExpanded ? 'Show fewer highlights' : `Show all ${TOUR_PREVIEW_HIGHLIGHTS.length} highlights`}
              </button>
            ) : null}
          </section>

          <section
            className="mt-8 overflow-hidden rounded-3xl border border-gold/35 bg-gradient-to-br from-gold/[0.08] to-terracotta/[0.06]"
            aria-label="Free preview"
          >
            <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[11rem]">
                <img
                  src={FREE_PREVIEW_ANCIENT_POSTER}
                  alt="Ancient reconstruction of the Colosseum exterior"
                  className="h-full w-full object-cover object-center"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-deep-slate/40 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-deep-slate/10"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col justify-center px-5 py-5 sm:px-6">
                <p className="text-eyebrow uppercase text-terracotta">Try before you buy</p>
                <h2 className="mt-2 font-display text-lg font-semibold text-deep-slate">
                  Taste the Colosseum for free
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-soft-slate">
                  Experience the exterior reconstruction and hear the opening audio story — no purchase
                  required. See why travelers love walking with ChronoWalk.
                </p>
                <Button
                  size="lg"
                  fullWidth
                  className="mt-4"
                  onClick={() => {
                    triggerHaptic(HAPTIC_KIND.SUCCESS)
                    onTryFreePreview()
                  }}
                >
                  Try a bit for free
                </Button>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              fullWidth
              className="sm:flex-1"
              onClick={() => {
                triggerHaptic(HAPTIC_KIND.SOFT_TAP)
                onViewTours()
              }}
            >
              See tours &amp; pricing
            </Button>
          </div>
        </GlassPanel>

        <div className="h-6 shrink-0 sm:h-8" aria-hidden="true" />
      </div>
    </div>
  )
}

export default TourIntroScreen
