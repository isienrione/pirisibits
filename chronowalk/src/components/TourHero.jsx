import { useMemo, useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import { getWaypointGeo } from '../data/waypointGeo'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import { BronzeButton, Button, GlassPanel, EditorialTitle, cn } from './ui'
import OfflineDownloadPanel from './offline/OfflineDownloadPanel'

const APP_NAME = 'ChronoWalk'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

const VALUE_PROPOSITION =
  'Walk through Rome with place-aware audio, guided stories, and visual reconstructions of the ancient city.'

const TOUR_STATS = [
  { id: 'gps', label: 'GPS guided', accent: 'text-gold' },
  { id: 'audio', label: 'Audio stories', accent: 'text-bronze' },
  { id: 'reveals', label: 'Historical reveals', accent: 'text-sky-blue' },
]

function StatPill({ label, accent }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-parchment/80 bg-ivory/80 px-3 py-1.5',
        'text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-deep-slate shadow-sm backdrop-blur-sm'
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
          className="flex items-center gap-3 rounded-2xl border border-parchment/70 bg-ivory/80 px-3 py-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-parchment text-xs font-bold text-deep-slate">
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
      <div className="relative min-h-screen bg-gradient-to-b from-ivory via-parchment/50 to-limestone/30">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-end px-4 pb-safe pt-safe sm:px-6">
          <GlassPanel className="rounded-3xl p-6 shadow-plaque-lg sm:p-8">
            <p className="text-eyebrow uppercase text-bronze">{APP_NAME}</p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-deep-slate">
              Debug: {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-soft-slate">
              Single-stop test mode. Add{' '}
              <span className="font-medium text-deep-slate">?debugGeo=true</span> to fake GPS at this
              landmark.
            </p>
            <BronzeButton size="lg" fullWidth className="mt-6" onClick={onStartTour}>
              Start Tour
            </BronzeButton>
          </GlassPanel>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ivory paper-texture">
      <div className="absolute inset-x-0 top-0 h-[min(72vh,42rem)] sm:h-[min(76vh,44rem)]">
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
        <div className="h-[min(46vh,20rem)] shrink-0 sm:h-[min(50vh,24rem)]" aria-hidden="true" />

        <GlassPanel className="rounded-3xl p-6 shadow-plaque-lg sm:p-8 lg:p-10" grain>
          <EditorialTitle eyebrow={APP_NAME} size="lg" subtitle={VALUE_PROPOSITION}>
            {tour.title}
          </EditorialTitle>

          <div className="mt-5 flex flex-wrap gap-2">
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
            <BronzeButton size="lg" fullWidth className="sm:flex-1" onClick={onStartTour}>
              Start Tour
            </BronzeButton>
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
            <div className="mt-2 border-t border-parchment/70 pt-4">
              <p className="text-eyebrow uppercase text-bronze">Your route</p>
              <PreviewStopsList stops={stops} />
            </div>
          ) : null}

          <div className="mt-6">
            <OfflineDownloadPanel tour={tour} compact />
          </div>

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
