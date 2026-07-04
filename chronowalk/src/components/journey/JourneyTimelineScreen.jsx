import { useMemo, useRef } from 'react'
import tourHeroFallback from '../../assets/tour-hero.svg'
import { TIMELINE_MOMENT_KINDS } from '../../content/launchJourneyTimeline'
import JourneyExplorerMap from './JourneyExplorerMap'
import { JOURNEY_STATES } from '../../state/journeyState'
import { cn } from '../ui'

const MOMENT_LABELS = {
  [TIMELINE_MOMENT_KINDS.WALKING]: 'Walking',
  [TIMELINE_MOMENT_KINDS.ARRIVAL]: 'Arrived',
  [TIMELINE_MOMENT_KINDS.AUDIO]: 'Listened',
  [TIMELINE_MOMENT_KINDS.THRESHOLD]: 'Threshold',
  [TIMELINE_MOMENT_KINDS.PHOTO]: 'Captured',
}

function TimelineMarker({ kind, isSelected }) {
  return (
    <span
      className={cn(
        'relative z-10 mt-1.5 flex h-3.5 w-3.5 shrink-0 rounded-full border-2',
        isSelected
          ? 'border-bronze bg-bronze shadow-plaque'
          : kind === TIMELINE_MOMENT_KINDS.PHOTO
            ? 'border-bronze/60 bg-bronze/25'
            : kind === TIMELINE_MOMENT_KINDS.AUDIO
              ? 'border-bronze/45 bg-parchment'
              : 'border-parchment bg-ivory'
      )}
      aria-hidden="true"
    />
  )
}

function MomentCard({ moment, isSelected, onSelect }) {
  const showImage =
    moment.imageUrl &&
    [TIMELINE_MOMENT_KINDS.ARRIVAL, TIMELINE_MOMENT_KINDS.PHOTO].includes(moment.kind)

  return (
    <button
      type="button"
      id={`timeline-moment-${moment.id}`}
      onClick={() => onSelect(moment)}
      className={cn(
        'min-w-0 flex-1 rounded-[1.5rem] border px-5 py-4 text-left transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze/50',
        isSelected
          ? 'border-bronze/45 bg-parchment/70 shadow-plaque'
          : 'border-parchment/90 bg-ivory/80 hover:border-bronze/30 hover:bg-parchment/35'
      )}
      aria-current={isSelected ? 'step' : undefined}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bronze">
        {MOMENT_LABELS[moment.kind] ?? 'Moment'}
      </p>
      <p className="mt-2 font-display text-xl font-semibold leading-snug text-deep-slate sm:text-2xl">
        {moment.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-soft-slate sm:text-base">{moment.body}</p>

      {showImage ? (
        <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-parchment/80">
          <img
            src={moment.imageUrl}
            alt=""
            className="aspect-[16/10] w-full object-cover"
            onError={(event) => {
              if (event.currentTarget.src !== tourHeroFallback) {
                event.currentTarget.src = tourHeroFallback
              }
            }}
          />
        </div>
      ) : null}
    </button>
  )
}

export default function JourneyTimelineScreen({
  intro,
  routeLabel,
  monuments = [],
  moments = [],
  manifest,
  completedStopIds = [],
  currentStopId,
  selectedStopId,
  onSelectStop,
  onBack,
  onViewPassport,
}) {
  const momentRefs = useRef({})

  const mapStopIds = useMemo(
    () => monuments.map((monument) => monument.id),
    [monuments]
  )

  const handleSelectMoment = (moment) => {
    onSelectStop?.(moment.stopId)
    momentRefs.current[moment.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  return (
    <div
      className="min-h-dvh bg-ivory text-deep-slate paper-texture"
      data-testid="journey-timeline-screen"
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 pb-safe pt-safe sm:px-8">
        <header>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 min-h-11 text-sm font-medium text-soft-slate transition hover:text-deep-slate"
          >
            Back to your letter
          </button>

          <p className="mt-8 text-eyebrow uppercase text-bronze">Journey timeline</p>
          <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight sm:text-4xl">
            The path you walked
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-soft-slate sm:text-lg">
            {intro}
          </p>
        </header>

        <section className="mt-10" aria-label="Walking route map">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-deep-slate">Your route</h2>
            <p className="text-sm text-soft-slate">{routeLabel}</p>
          </div>

          <JourneyExplorerMap
            className="min-h-[18rem]"
            manifest={manifest}
            currentStopId={currentStopId}
            completedStopIds={completedStopIds}
            nextStopId={null}
            journeyState={JOURNEY_STATES.WALKING}
            selectedStopId={selectedStopId}
            onSelectStop={onSelectStop}
            visibleStopIds={mapStopIds}
          />
        </section>

        {monuments.length ? (
          <section className="mt-8" aria-label="Visited monuments">
            <h2 className="font-display text-lg font-semibold text-deep-slate">Monuments visited</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {monuments.map((monument) => {
                const isSelected = monument.id === selectedStopId

                return (
                  <button
                    key={monument.id}
                    type="button"
                    onClick={() => onSelectStop?.(monument.id)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition',
                      isSelected
                        ? 'border-bronze bg-bronze text-ivory'
                        : 'border-parchment bg-parchment/50 text-deep-slate hover:border-bronze/35'
                    )}
                    aria-pressed={isSelected}
                  >
                    {monument.title}
                  </button>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-12 flex-1 pb-8" aria-label="Key moments">
          <h2 className="font-display text-lg font-semibold text-deep-slate">Key moments</h2>

          <ol className="relative mt-6 space-y-0">
            <div
              className="absolute bottom-4 left-[0.42rem] top-4 w-px bg-gradient-to-b from-bronze/45 via-parchment to-transparent"
              aria-hidden="true"
            />

            {moments.map((moment) => {
              const isSelected = moment.stopId === selectedStopId

              return (
                <li
                  key={moment.id}
                  ref={(node) => {
                    momentRefs.current[moment.id] = node
                  }}
                  className="relative flex gap-5 pb-8 last:pb-0"
                >
                  <TimelineMarker kind={moment.kind} isSelected={isSelected} />
                  <MomentCard
                    moment={moment}
                    isSelected={isSelected}
                    onSelect={handleSelectMoment}
                  />
                </li>
              )
            })}
          </ol>
        </section>

        {onViewPassport ? (
          <footer className="pb-8">
            <button
              type="button"
              onClick={onViewPassport}
              className="text-sm font-medium tracking-[0.08em] text-bronze underline decoration-bronze/30 underline-offset-4 transition hover:text-bronze-dark"
            >
              Your passport
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
