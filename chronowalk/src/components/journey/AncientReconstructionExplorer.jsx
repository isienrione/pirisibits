import { useCallback, useEffect, useState } from 'react'
import { BottomSheet, cn } from '../ui'
import { usePannableZoom } from '../../hooks/usePannableZoom'
import { HAPTIC_KIND, triggerHaptic } from '../../utils/haptics'

function HotspotMarker({ hotspot, showLabel, onSelect }) {
  return (
    <button
      type="button"
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${hotspot.x * 100}%`, top: `${hotspot.y * 100}%` }}
      aria-label={hotspot.title}
      onClick={(event) => {
        event.stopPropagation()
        triggerHaptic(HAPTIC_KIND.SOFT_TAP)
        onSelect(hotspot)
      }}
    >
      <span className="relative flex h-8 w-8 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-gold/20 motion-safe:animate-pulse"
          aria-hidden="true"
        />
        <span className="relative h-2.5 w-2.5 rounded-full border border-gold/80 bg-gold/90 shadow-gold-glow" />
      </span>
      {showLabel && hotspot.label ? (
        <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ivory/70">
          {hotspot.label}
        </span>
      ) : null}
    </button>
  )
}

function ExplorationFallback({ stopTitle }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-obsidian px-10 text-center text-ivory">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
        Ancient Rome
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold">{stopTitle}</h1>
      <p className="mt-6 max-w-sm text-base leading-relaxed text-ivory/65">
        The reconstruction view is being prepared for this landmark.
      </p>
    </div>
  )
}

export default function AncientReconstructionExplorer({
  stopTitle,
  imageUrl,
  hotspots = [],
  showLabels = true,
  onContinue,
}) {
  const { transform, bind, reset } = usePannableZoom({ minScale: 1, maxScale: 4 })
  const [selectedHotspot, setSelectedHotspot] = useState(null)
  const labelsVisible = showLabels && transform.scale >= 1.15

  const closeHotspot = useCallback(() => {
    setSelectedHotspot(null)
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
      reset()
    }
  }, [reset])

  if (!imageUrl) {
    return <ExplorationFallback stopTitle={stopTitle} />
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-obsidian text-ivory"
      data-testid="ancient-reconstruction-explorer"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 pt-safe">
        <button
          type="button"
          onClick={onContinue}
          className="pointer-events-auto mt-4 min-h-11 rounded-full px-3 text-sm font-medium text-ivory/55 transition hover:text-ivory"
        >
          Continue journey
        </button>
        <button
          type="button"
          onClick={reset}
          className="pointer-events-auto mt-4 min-h-11 rounded-full px-3 text-sm font-medium text-ivory/45 transition hover:text-ivory/80"
          aria-label="Reset view"
        >
          Reset
        </button>
      </div>

      <div
        data-testid="reconstruction-canvas"
        className="absolute inset-0 flex items-center justify-center"
        {...bind}
      >
        <div
          className="relative will-change-transform"
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          }}
        >
          <img
            src={imageUrl}
            alt={`Ancient reconstruction of ${stopTitle}`}
            className="max-h-none w-[100vw] max-w-none select-none object-cover sm:w-[100vmin]"
            draggable={false}
            referrerPolicy="no-referrer"
          />

          {hotspots.map((hotspot) => (
            <HotspotMarker
              key={hotspot.id}
              hotspot={hotspot}
              showLabel={labelsVisible}
              onSelect={setSelectedHotspot}
            />
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_42%,rgba(8,8,8,0.45)_100%)]"
        aria-hidden="true"
      />

      <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-8 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-center text-xs font-medium tracking-[0.22em] text-ivory/40 uppercase">
        Pinch to explore
      </p>

      {selectedHotspot ? (
        <div
          className="absolute inset-0 z-30 bg-black/35"
          aria-hidden="true"
          onClick={closeHotspot}
        />
      ) : null}

      <div className={cn('absolute inset-0 z-40', selectedHotspot ? '' : 'pointer-events-none')}>
        <BottomSheet
          open={Boolean(selectedHotspot)}
          onHandleClick={closeHotspot}
          handleLabel="Close context"
          ariaLabelledBy="reconstruction-hotspot-title"
          ariaDescribedBy="reconstruction-hotspot-body"
          onEscape={closeHotspot}
          cinematic
        >
          {selectedHotspot ? (
            <>
              {selectedHotspot.label ? (
                <p className="text-eyebrow uppercase text-bronze">{selectedHotspot.label}</p>
              ) : null}
              <h2
                id="reconstruction-hotspot-title"
                className="mt-2 font-display text-2xl font-semibold leading-tight text-deep-slate"
              >
                {selectedHotspot.title}
              </h2>
              {selectedHotspot.era ? (
                <p className="mt-2 text-sm text-soft-slate">{selectedHotspot.era}</p>
              ) : null}
              <p
                id="reconstruction-hotspot-body"
                className="mt-5 text-base leading-relaxed text-deep-slate/90"
              >
                {selectedHotspot.body}
              </p>
            </>
          ) : null}
        </BottomSheet>
      </div>
    </div>
  )
}
