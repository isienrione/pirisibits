import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import tourHeroFallback from '../assets/tour-hero.svg'
import { getLaunchTourDetail } from '../content/launchTourDetail'
import { formatUsd } from '../data/tourProducts'
import { buildRouteOverviewModel } from '../utils/routeOverviewProjection'
import {
  BronzeButton,
  Button,
  MediaPlayerControls,
  ParchmentCard,
  cn,
} from '../components/ui'
import { metaLabel } from '../components/ui/styles'
import { purchasePath, ROUTES } from '../routes/paths'
import { hex } from '../design/tokens.js'

const STOP_COLORS = {
  selected: hex.ember,
  default: '#A8742A',
  muted: '#C9B89A',
}

function TourRoutePreview({ model, selectedStopId }) {
  if (!model.stops.length) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-[2rem] border border-parchment/80 bg-parchment/30 text-sm text-soft-slate">
        Route preview loading…
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${model.width} ${model.height}`}
      className="aspect-[16/10] w-full rounded-[2rem] border border-parchment/80 bg-gradient-to-b from-parchment/40 to-ivory shadow-plaque"
      role="img"
      aria-label="Tour route preview"
    >
      {model.fullRoutePath ? (
        <path
          d={model.fullRoutePath}
          fill="none"
          stroke="#A8742A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.28"
        />
      ) : null}
      {model.stops.map((stop) => {
        const isSelected = stop.id === selectedStopId
        return (
          <g key={stop.id}>
            {isSelected ? (
              <circle cx={stop.x} cy={stop.y} r="14" fill={hex.ember} fillOpacity="0.18" />
            ) : null}
            <circle
              cx={stop.x}
              cy={stop.y}
              r={isSelected ? 7 : 5}
              fill={isSelected ? STOP_COLORS.selected : STOP_COLORS.default}
              stroke={hex.bone}
              strokeWidth="2"
            />
          </g>
        )
      })}
    </svg>
  )
}

function TourRouteTimeline({ stops, selectedStopId, onSelectStop }) {
  return (
    <div className="relative">
      <div
        className="absolute bottom-4 left-[1.125rem] top-4 w-px bg-parchment"
        aria-hidden="true"
      />
      <ol className="space-y-3">
        {stops.map((stop) => {
          const isSelected = stop.id === selectedStopId
          return (
            <li key={stop.id}>
              <button
                type="button"
                onClick={() => onSelectStop(stop.id)}
                className={cn(
                  'relative flex w-full items-center gap-4 rounded-[1.5rem] border px-4 py-4 text-left transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory',
                  isSelected
                    ? 'border-bronze/35 bg-parchment/35 shadow-plaque'
                    : 'border-parchment/70 bg-ivory hover:border-bronze/25 hover:bg-parchment/15'
                )}
              >
                <span
                  className={cn(
                    'relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold',
                    isSelected
                      ? 'border-gold/40 bg-gold/15 text-bronze'
                      : 'border-parchment bg-ivory text-deep-slate'
                  )}
                >
                  {stop.number}
                </span>
                {stop.heroImage ? (
                  <img
                    src={stop.heroImage}
                    alt=""
                    aria-hidden="true"
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div
                    className="h-14 w-14 shrink-0 rounded-2xl bg-parchment/60"
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold leading-tight text-deep-slate">
                    {stop.title}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function PreviewAudioPlayer({ preview }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    audio.play().then(
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    )
  }

  const stopPlayback = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setIsPlaying(false)
  }

  return (
    <ParchmentCard className="overflow-hidden p-0" texture>
      <div className="flex items-center gap-4 px-6 py-5 sm:px-7">
        <MediaPlayerControls
          theme="light"
          isPlaying={isPlaying}
          onToggle={togglePlayback}
          onStop={stopPlayback}
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold text-deep-slate">{preview.title}</p>
          <p className="mt-1 text-sm text-soft-slate">{preview.durationLabel}</p>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={preview.src}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
      />
    </ParchmentCard>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[1.25rem] border border-parchment/80 bg-ivory/90 px-4 py-4 text-center shadow-sm">
      <p className={cn(metaLabel, 'text-bronze')}>{label}</p>
      <p className="mt-2 font-display text-xl font-semibold text-deep-slate">{value}</p>
    </div>
  )
}

export default function TourDetailPage() {
  const navigate = useNavigate()
  const { destinationId } = useParams()
  const detail = useMemo(
    () => (destinationId ? getLaunchTourDetail(destinationId) : null),
    [destinationId]
  )
  const [heroSrc, setHeroSrc] = useState(tourHeroFallback)
  const [selectedStopId, setSelectedStopId] = useState(null)

  useEffect(() => {
    if (detail?.heroImage) {
      setHeroSrc(detail.heroImage)
    }
    if (detail?.stops[0]?.id) {
      setSelectedStopId(detail.stops[0].id)
    }
  }, [detail])

  const routeModel = useMemo(() => {
    if (!detail) return null
    return buildRouteOverviewModel({
      tour: detail.tour,
      stops: detail.stops.map((stop) => ({
        id: stop.id,
        title: stop.shortTitle,
        landmark: stop.landmark,
        status: stop.id === selectedStopId ? 'current' : 'upcoming',
      })),
      width: 400,
      height: 250,
    })
  }, [detail, selectedStopId])

  if (!detail) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ivory px-6">
        <p className="text-sm text-soft-slate">This journey is not available yet.</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-ivory text-deep-slate paper-texture">
      <div className="relative">
        <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/11]">
          <img
            src={heroSrc}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-[center_38%]"
            onError={() => {
              if (heroSrc !== tourHeroFallback) {
                setHeroSrc(tourHeroFallback)
              }
            }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/20 to-deep-slate/10"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-8 pt-24 sm:px-8">
            <p className={cn(metaLabel, 'text-bronze')}>{detail.subtitle}</p>
            <h1 className="mt-3 font-display text-[3.5rem] font-semibold leading-[0.95] tracking-tight sm:text-6xl">
              {detail.title}
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-soft-slate">{detail.tagline}</p>
          </div>
        </div>

        <div className="absolute left-0 top-0 px-6 pt-safe sm:px-8">
          <Button
            variant="ghost"
            size="md"
            className="-ml-2 rounded-full border border-ivory/70 bg-ivory/75 px-4 text-deep-slate backdrop-blur-sm"
            onClick={() => navigate(ROUTES.begin)}
          >
            ← Back
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pb-safe sm:px-8">
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Duration" value={detail.stats.duration} />
          <StatCard label="Distance" value={detail.stats.distance} />
          <StatCard label="Walking" value={detail.stats.walkingTime} />
          <StatCard label="Stops" value={detail.stats.visitStops} />
        </div>

        <section className="mt-10" aria-label="Route preview">
          <h2 className="font-display text-2xl font-semibold text-deep-slate">Your route</h2>
          <p className="mt-2 max-w-prose text-base leading-relaxed text-soft-slate">
            {detail.description}
          </p>
          <div className="mt-6">
            {routeModel ? (
              <TourRoutePreview model={routeModel} selectedStopId={selectedStopId} />
            ) : null}
          </div>
        </section>

        <section className="mt-10" aria-label="Preview story">
          <h2 className="font-display text-2xl font-semibold text-deep-slate">Preview story</h2>
          <div className="mt-4">
            <PreviewAudioPlayer preview={detail.previewAudio} />
          </div>
        </section>

        <section className="mt-10" aria-label="Route timeline">
          <h2 className="font-display text-2xl font-semibold text-deep-slate">Timeline</h2>
          <p className="mt-2 text-sm text-soft-slate">Tap a place to highlight it on the route.</p>
          <div className="mt-5">
            <TourRouteTimeline
              stops={detail.stops}
              selectedStopId={selectedStopId}
              onSelectStop={setSelectedStopId}
            />
          </div>
        </section>

        <div className="sticky bottom-0 mt-10 border-t border-parchment/80 bg-ivory/95 py-6 backdrop-blur-sm">
          <p className="text-center font-display text-3xl font-semibold text-deep-slate">
            {formatUsd(detail.priceUsd)}
          </p>
          <BronzeButton
            size="lg"
            fullWidth
            className="mt-4"
            onClick={() => navigate(purchasePath(destinationId))}
          >
            Purchase journey
          </BronzeButton>
        </div>
      </div>
    </div>
  )
}
