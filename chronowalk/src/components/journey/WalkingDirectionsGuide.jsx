import { formatStepDistance } from '../DirectionsStepList'
import { Button, IconButton, LoadingPanel, cn, metaLabel } from '../ui'

function CloseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

export default function WalkingDirectionsGuide({
  destinationTitle,
  directions,
  loading,
  error,
  currentStepIndex = 0,
  onDismiss,
  onOpenExternalMaps,
  mapsUrl,
}) {
  const steps = directions?.steps ?? []
  const currentStep = steps[currentStepIndex] ?? null
  const nextStep = steps[currentStepIndex + 1] ?? null
  const stepCount = steps.length
  const stepLabel = stepCount
    ? `Step ${Math.min(currentStepIndex + 1, stepCount)} of ${stepCount}`
    : null

  return (
    <div className="flex min-h-dvh flex-col bg-ivory text-deep-slate paper-texture">
      <header className="flex items-center justify-end px-4 pt-safe sm:px-6">
        {onDismiss ? (
          <IconButton
            variant="solid"
            size="lg"
            label="Close walking directions"
            onClick={onDismiss}
            className="mt-4 border-parchment/80 bg-ivory/90 shadow-plaque"
          >
            <CloseIcon className="h-6 w-6" />
          </IconButton>
        ) : null}
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-safe pt-8 sm:px-8">
        <p className={cn(metaLabel, 'text-bronze')}>Walking directions</p>
        <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight sm:text-4xl">
          {destinationTitle ?? 'Destination'}
        </h1>

        {loading ? (
          <LoadingPanel label="Finding your route…" className="mt-16 min-h-[30vh]" />
        ) : error ? (
          <div className="mt-16 space-y-6">
            <p className="text-xl leading-relaxed text-soft-slate">{error}</p>
            {mapsUrl ? (
              <Button fullWidth onClick={() => onOpenExternalMaps?.(mapsUrl)}>
                Open in Google Maps
              </Button>
            ) : null}
          </div>
        ) : currentStep ? (
          <div className="mt-14 flex flex-1 flex-col">
            {stepLabel ? (
              <p className="text-sm font-medium tracking-wide text-soft-slate">{stepLabel}</p>
            ) : null}

            <p className="mt-6 font-display text-[2rem] font-semibold leading-[1.15] tracking-tight text-deep-slate sm:text-[2.75rem]">
              {currentStep.instruction}
            </p>

            {currentStep.distanceM > 0 ? (
              <p className="mt-5 text-xl text-soft-slate">
                {formatStepDistance(currentStep.distanceM)}
              </p>
            ) : null}

            {nextStep ? (
              <div className="mt-16 border-t border-parchment/70 pt-10">
                <p className={cn(metaLabel, 'text-bronze')}>Then</p>
                <p className="mt-4 text-xl leading-relaxed text-soft-slate sm:text-2xl">
                  {nextStep.instruction}
                </p>
                {nextStep.distanceM > 0 ? (
                  <p className="mt-3 text-base text-soft-slate">
                    {formatStepDistance(nextStep.distanceM)}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto pb-8 pt-12">
          {onDismiss ? (
            <Button variant="text" fullWidth onClick={onDismiss} className="text-base">
              Back to map
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
