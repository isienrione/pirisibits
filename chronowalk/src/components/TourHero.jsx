import { useMemo, useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import { getWaypointGeo } from '../data/waypointGeo'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import { Button, GlassPanel, MediaHero, cn } from './ui'

const APP_NAME = 'ChronoWalk'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

const VALUE_PROPOSITION =
  'Walk through Rome with place-aware audio, guided stories, and visual reconstructions of the ancient city.'

const TOUR_STATS = [
  { id: 'gps', label: 'GPS guided', accent: 'text-gold' },
  { id: 'audio', label: 'Audio stories', accent: 'text-terracotta' },
  { id: 'reveals', label: 'Historical reveals', accent: 'text-sky-blue' },
]

function StatPill({ label, accent }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-limestone/50 bg-warm-white/80 px-3 py-1.5',
        'text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-deep-slate backdrop-blur-sm'
      )}
    >
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full bg-current', accent)} aria-hidden="true" />
      {label}
    </span>
  )
}

function PreviewStopsList({ stops }) {
  return (
    <ol className="mt-4 space-y-2">
      {stops.map((stop, index) => (
        <li
          key={stop.id}
          className="flex items-center gap-3 rounded-2xl border border-limestone/50 bg-warm-white/60 px-3 py-2.5 backdrop-blur-sm"
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

function TourHero({ tour, singleWaypointId, onStartTour }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  const stops = useMemo(
    () =>
      tour.stopIds.map((id, index) => ({
        id,
        index: index + 1,
        title: getWaypointGeo(id)?.title ?? id,
      })),
    [tour.stopIds]
  )

  const handleHeroError = () => {
    if (heroSrc !== tourHeroFallback) {
      setHeroSrc(tourHeroFallback)
    }
  }

  if (singleWaypointId) {
    const title = getWaypointGeo(singleWaypointId)?.title ?? singleWaypointId

    return (
      <div className="relative min-h-screen bg-gradient-to-b from-warm-white via-sand/50 to-limestone/30">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-end px-4 pb-safe pt-safe sm:px-6">
          <GlassPanel className="rounded-3xl p-6 shadow-glass-lg sm:p-8">
            <p className="text-eyebrow uppercase text-terracotta">{APP_NAME}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-deep-slate">
              Debug: {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-soft-slate">
              Single-stop test mode. Add{' '}
              <span className="font-medium text-deep-slate">?debugGeo=true</span> to fake GPS at this
              landmark.
            </p>
            <Button size="lg" fullWidth className="mt-6" onClick={onStartTour}>
              Start Tour
            </Button>
          </GlassPanel>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-warm-white">
      <MediaHero
        src={heroSrc}
        alt=""
        aspect="screen"
        rounded="frame"
        gradient="strong"
        zoom
        fadeIn
        objectPosition="center 38%"
        onError={handleHeroError}
        className="w-full"
      >
        <div className="absolute inset-x-0 bottom-0 flex min-h-full flex-col justify-end px-5 pb-6 pt-28 sm:px-8 sm:pb-8">
          <div className="animate-fade-in-soft">
            <p className="text-eyebrow uppercase text-gold/95">{APP_NAME}</p>

            <h1 className="mt-3 max-w-xl font-display text-[2rem] font-semibold leading-[1.08] tracking-tight text-warm-white sm:text-4xl lg:text-[2.75rem]">
              {tour.title}
            </h1>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-warm-white/88 sm:text-[1.05rem]">
              {VALUE_PROPOSITION}
            </p>
          </div>
        </div>
      </MediaHero>

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-safe sm:px-6 lg:max-w-3xl">
        <GlassPanel className="-mt-6 rounded-3xl border-warm-white/40 bg-warm-white/88 p-6 shadow-glass-lg backdrop-blur-glass sm:p-8 lg:p-9">
          <div className="flex flex-wrap gap-2">
            {TOUR_STATS.map((stat) => (
              <StatPill key={stat.id} label={stat.label} accent={stat.accent} />
            ))}
          </div>

          <p className="mt-4 text-sm text-soft-slate">
            <span className="font-semibold text-deep-slate">{stops.length} stops</span>
            <span className="text-limestone"> · </span>
            <span className="text-soft-slate">{tour.subtitle}</span>
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" fullWidth className="sm:flex-1" onClick={onStartTour}>
              Start Tour
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              className="sm:flex-1"
              aria-expanded={previewOpen}
              onClick={() =>
                setPreviewOpen((open) => {
                  if (!open) triggerHaptic(HAPTIC_KIND.SOFT_TAP)
                  return !open
                })
              }
            >
              {previewOpen ? 'Hide stops' : 'Preview stops'}
            </Button>
          </div>

          {previewOpen ? (
            <div className="mt-2 animate-fade-in-soft border-t border-limestone/50 pt-4">
              <p className="text-eyebrow uppercase text-terracotta">Your route</p>
              <PreviewStopsList stops={stops} />
            </div>
          ) : null}

          <p className="mt-6 text-center text-[0.7rem] leading-relaxed text-soft-slate/90 sm:text-xs">
            Your tour begins at the Colosseum — walk there to unlock your first story. Location is
            used only to guide you between stops.
          </p>
        </GlassPanel>

        <div className="h-6 shrink-0 sm:h-8" aria-hidden="true" />
      </div>
    </div>
  )
}

export default TourHero
