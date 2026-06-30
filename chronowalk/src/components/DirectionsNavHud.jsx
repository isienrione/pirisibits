import { useState } from 'react'
import { LOCATION_STATUS } from '../hooks/useGeoLocation'
import { estimateWalkMinutes } from '../utils/tourStats'
import { buildGoogleMapsDirectionsUrl } from '../utils/walkingDirections'
import DirectionsStepsSheet from './DirectionsStepsSheet'
import { formatStepDistance } from './DirectionsStepList'
import {
  Button,
  GlassPanel,
  GoldButton,
  IconButton,
  LoadingPanel,
  cn,
  metaLabel,
} from './ui'

function LocateIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function CompassIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="m12 7 2 5-5 2-2-5 5-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function GpsStatusPill({ locationStatus }) {
  if (!locationStatus || locationStatus === LOCATION_STATUS.DENIED) return null

  const isGood = locationStatus === LOCATION_STATUS.GRANTED
  const isWaiting = locationStatus === LOCATION_STATUS.WAITING

  return (
    <GlassPanel className="pointer-events-none inline-flex items-center gap-2 rounded-full px-3 py-1.5 shadow-plaque">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isGood ? 'bg-olive' : isWaiting ? 'bg-gold' : 'bg-soft-slate'
        )}
        aria-hidden="true"
      />
      <span className="text-xs font-semibold text-deep-slate">
        {isGood
          ? 'Good GPS signal'
          : isWaiting
            ? 'Finding GPS…'
            : 'GPS signal weak'}
      </span>
    </GlassPanel>
  )
}

function DirectionsNavHud({
  destinationTitle,
  directions,
  loading,
  error,
  currentStepIndex = 0,
  routeProgress = 0,
  locationStatus,
  routingOrigin,
  routingDestination,
  onClose,
  onRecenter,
  onOpenExternalMaps,
  hasBottomNav = false,
}) {
  const [stepsOpen, setStepsOpen] = useState(false)

  const stepCount = directions?.steps?.length ?? 0
  const stepLabel = stepCount
    ? `Step ${Math.min(currentStepIndex + 1, stepCount)} of ${stepCount}`
    : 'Loading route'

  const distanceM = directions?.distanceM ?? 0
  const walkMinutes = estimateWalkMinutes(distanceM)
  const progressPercent = Math.round(Math.min(100, Math.max(0, routeProgress * 100)))
  const mapsUrl = buildGoogleMapsDirectionsUrl(routingOrigin, routingDestination)
  const bottomOffset = hasBottomNav
    ? 'max(var(--bottom-stack-inset), env(safe-area-inset-bottom))'
    : undefined

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[45] px-4 pt-safe"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto flex w-full max-w-md items-start justify-between gap-2">
          <GlassPanel className="pointer-events-auto px-3 py-2 shadow-plaque-lg">
            <p className={cn(metaLabel, 'text-bronze')}>Walking guide</p>
            <p className="text-sm font-semibold text-deep-slate">{stepLabel}</p>
          </GlassPanel>

          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <GpsStatusPill locationStatus={locationStatus} />
            <div className="flex gap-2">
              {onRecenter ? (
                <IconButton
                  variant="solid"
                  size="md"
                  label="Center map on your location"
                  onClick={onRecenter}
                  className="border-parchment/80 bg-ivory shadow-plaque"
                >
                  <LocateIcon className="h-5 w-5" />
                </IconButton>
              ) : null}
              <IconButton
                variant="solid"
                size="md"
                label="Map compass"
                className="border-parchment/80 bg-ivory shadow-plaque"
                aria-hidden="true"
                tabIndex={-1}
              >
                <CompassIcon className="h-5 w-5" />
              </IconButton>
              {onClose ? (
                <IconButton
                  variant="solid"
                  size="md"
                  label="Exit walking directions"
                  onClick={onClose}
                  className="border-parchment/80 bg-ivory shadow-plaque"
                >
                  <CloseIcon className="h-5 w-5" />
                </IconButton>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] px-4 pb-safe"
        style={{ paddingBottom: bottomOffset }}
      >
        <div className="mx-auto w-full max-w-md">
          <GlassPanel className="pointer-events-auto shadow-plaque-lg">
            <div className="p-4">
              <p className={cn(metaLabel, 'text-bronze')}>Walk to</p>
              <p className="mt-0.5 font-display text-lg font-semibold leading-tight text-deep-slate">
                {destinationTitle ?? 'Destination'}
              </p>

              {loading ? (
                <LoadingPanel label="Loading walking directions…" className="mt-4 min-h-[4.5rem]" />
              ) : error ? (
                <p className="mt-3 text-sm leading-relaxed text-soft-slate">{error}</p>
              ) : (
                <>
                  <div className="mt-2 flex items-center gap-2 text-sm text-soft-slate">
                    {distanceM > 0 ? (
                      <span className="font-semibold text-deep-slate">
                        {formatStepDistance(distanceM)}
                      </span>
                    ) : null}
                    {distanceM > 0 && walkMinutes ? (
                      <span className="text-limestone">·</span>
                    ) : null}
                    {walkMinutes ? <span>{walkMinutes} min walk</span> : null}
                  </div>

                  <div
                    className="mt-4 h-1.5 overflow-hidden rounded-full bg-limestone/60"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Walking route progress"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-bronze motion-reduce:transition-none transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-parchment/60 px-4 pb-4 pt-3">
              {error && mapsUrl ? (
                <Button
                  fullWidth
                  onClick={() => onOpenExternalMaps?.(mapsUrl)}
                >
                  Open in Google Maps
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <GoldButton
                    fullWidth
                    showArrow
                    disabled={!stepCount}
                    onClick={() => setStepsOpen(true)}
                  >
                    View steps
                  </GoldButton>
                  {onClose ? (
                    <Button variant="text" fullWidth onClick={onClose}>
                      Back to tour map
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      <DirectionsStepsSheet
        open={stepsOpen}
        onClose={() => setStepsOpen(false)}
        destinationTitle={destinationTitle}
        steps={directions?.steps ?? []}
        currentStepIndex={currentStepIndex}
      />
    </>
  )
}

export default DirectionsNavHud
