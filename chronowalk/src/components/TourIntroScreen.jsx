import { useMemo, useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import { FREE_PREVIEW_ANCIENT_POSTER } from '../data/freePreview'
import { HEART_OF_ANCIENT_ROME_TOUR } from '../data/heart-of-ancient-rome-tour'
import { ROMAN_FORUM_TOUR } from '../data/roman-forum-tour'
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

function TourRouteStopList({ stopIds }) {
  const stops = useMemo(
    () =>
      stopIds.map((id) => ({
        id,
        title: getWaypointGeo(id)?.title ?? id,
      })),
    [stopIds]
  )

  return (
    <ol className="mt-3 space-y-2">
      {stops.map((stop, index) => (
        <li
          key={stop.id}
          className="flex items-center gap-3 rounded-2xl border border-limestone/60 bg-warm-white/70 px-3 py-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-deep-slate">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-deep-slate">{stop.title}</span>
        </li>
      ))}
    </ol>
  )
}

function TourIntroScreen({ onTryFreePreview, onViewTours }) {
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  const handleHeroError = () => {
    if (heroSrc !== tourHeroFallback) {
      setHeroSrc(tourHeroFallback)
    }
  }

  const forumStopCount = ROMAN_FORUM_TOUR.stopIds.length
  const cityLoopStopCount = HEART_OF_ANCIENT_ROME_TOUR.stopIds.length
  const totalStops = forumStopCount + cityLoopStopCount

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
              Two routes, {totalStops} landmarks
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-soft-slate">
              The Roman Forum tour covers every stop inside the Forum cluster. The Heart of Ancient
              Rome loop takes you through the Colosseum, Capitoline Hill, and the rest of the city.
            </p>

            <div className="mt-6 space-y-6">
              <div className="rounded-3xl border border-limestone/60 bg-sand/20 px-4 py-4 sm:px-5">
                <p className="text-eyebrow uppercase text-terracotta">Roman Forum</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-deep-slate">
                  Forum cluster · {forumStopCount} stops
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-soft-slate">
                  Arch of Titus, Basilica of Maxentius, Via Sacra, Temple of Vesta, the Rostra,
                  Temple of Saturn, Curia Julia, and Arch of Septimius Severus — the full Forum
                  cluster walk.
                </p>
                <TourRouteStopList stopIds={ROMAN_FORUM_TOUR.stopIds} />
              </div>

              <div className="rounded-3xl border border-limestone/60 bg-sand/20 px-4 py-4 sm:px-5">
                <p className="text-eyebrow uppercase text-terracotta">Heart of Ancient Rome</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-deep-slate">
                  City loop · {cityLoopStopCount} stops
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-soft-slate">
                  The grand walking loop — Colosseum and Capitoline Hill through centro storico to
                  Castel Sant&apos;Angelo, Circus Maximus, and the Appian Way. Everything outside the
                  Forum cluster.
                </p>
                <TourRouteStopList stopIds={HEART_OF_ANCIENT_ROME_TOUR.stopIds} />
              </div>
            </div>
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
                  Experience the exterior reconstruction and hear the opening audio story from the city
                  loop — no purchase required.
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
