import { useEffect, useMemo, useState } from 'react'
import tourHeroFallback from '../assets/tour-hero.svg'
import { getWaypointGeo } from '../data/waypointGeo'
import { useImageLoadState } from '../hooks/useImageLoadState'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import { Button, FadeImage, GlassPanel, cn, motionCardRise, typeBody, typeBodySm, typeBodySmMuted, typeCaption, typeEyebrow, typeHero, typeHeroSm, typeSectionTitleSm } from './ui'

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
        'inline-flex items-center rounded-full border border-limestone/80 bg-warm-white/75 px-3.5 py-2',
        typeCaption,
        'font-medium uppercase tracking-[0.1em] text-deep-slate shadow-sm backdrop-blur-sm'
      )}
    >
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full bg-current', accent)} aria-hidden="true" />
      {label}
    </span>
  )
}

function PreviewStopsList({ stops }) {
  return (
    <ol className="mt-5 space-y-3">
      {stops.map((stop, index) => (
        <li
          key={stop.id}
          className="flex items-center gap-3 rounded-2xl border border-limestone/60 bg-warm-white/70 px-4 py-3"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-caption font-medium text-deep-slate">
            {index + 1}
          </span>
          <span className={typeBodySm}>{stop.title}</span>
        </li>
      ))}
    </ol>
  )
}

function TourHero({ tour, singleWaypointId, onStartTour }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)
  const heroStatus = useImageLoadState(heroSrc)

  const stops = useMemo(
    () =>
      tour.stopIds.map((id, index) => ({
        id,
        index: index + 1,
        title: getWaypointGeo(id)?.title ?? id,
      })),
    [tour.stopIds]
  )

  useEffect(() => {
    if (heroStatus === 'error' && heroSrc !== tourHeroFallback) {
      setHeroSrc(tourHeroFallback)
    }
  }, [heroStatus, heroSrc])

  if (singleWaypointId) {
    const title = getWaypointGeo(singleWaypointId)?.title ?? singleWaypointId

    return (
      <div className="relative min-h-screen bg-gradient-to-b from-warm-white via-sand/50 to-limestone/30">
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-end px-4 pb-safe pt-safe sm:px-6">
          <GlassPanel className="rounded-3xl p-8 shadow-glass-lg sm:p-10">
            <p className={typeEyebrow}>{APP_NAME}</p>
            <h1 className={cn(typeHeroSm, 'mt-4')}>
              Debug: {title}
            </h1>
            <p className={cn(typeBodySmMuted, 'mt-5')}>
              Single-stop test mode. Add{' '}
              <span className="font-medium text-deep-slate">?debugGeo=true</span> to fake GPS at this
              landmark.
            </p>
            <Button size="lg" fullWidth className="mt-8" onClick={onStartTour}>
              Start Tour
            </Button>
          </GlassPanel>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-warm-white">
      <div className="absolute inset-x-0 top-0 h-[min(72vh,42rem)] bg-gradient-to-br from-sand via-limestone/40 to-warm-white sm:h-[min(76vh,44rem)]">
        <FadeImage
          src={heroSrc}
          className="h-full w-full"
          imgClassName="h-full w-full object-cover object-[center_38%]"
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

        <GlassPanel className={cn('rounded-3xl p-8 shadow-glass-lg sm:p-10 lg:p-12', motionCardRise)}>
          <p className={typeEyebrow}>{APP_NAME}</p>

          <h1 className={cn(typeHero, 'mt-4')}>
            {tour.title}
          </h1>

          <p className={cn(typeBody, 'mt-6 text-soft-slate')}>
            {VALUE_PROPOSITION}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {TOUR_STATS.map((stat) => (
              <StatPill key={stat.id} label={stat.label} accent={stat.accent} />
            ))}
          </div>

          <p className={cn(typeBodySmMuted, 'mt-6')}>
            <span className="font-medium text-deep-slate">{stops.length} stops</span>
            <span className="text-limestone"> · </span>
            <span>{tour.subtitle}</span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            <div className="mt-8 border-t border-limestone/50 pt-6">
              <p className={typeEyebrow}>Your route</p>
              <PreviewStopsList stops={stops} />
            </div>
          ) : null}

          <p className={cn(typeCaption, 'mt-8 text-center leading-relaxed')}>
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
