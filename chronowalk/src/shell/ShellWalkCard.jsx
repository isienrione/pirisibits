import { GoldButton, GlassPanel } from '../components/ui'

function formatWalkEta(distanceM) {
  if (distanceM == null) return null
  const meters = Math.round(distanceM)
  const minutes = Math.max(1, Math.round(distanceM / 80))
  return `${meters} m · ${minutes} min`
}

/**
 * Map floating walk card — props only; parent supplies journey/map data.
 */
export default function ShellWalkCard({
  eyebrow = 'Next stop',
  title,
  distanceM,
  imageUrl,
  onContinue,
  onDismiss,
  continueLabel = 'Continue',
}) {
  if (!title) return null

  const eta = formatWalkEta(distanceM)

  return (
    <GlassPanel grain className="relative overflow-hidden p-4 shadow-plaque-lg">
      {onDismiss ? (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-soft-slate hover:text-deep-slate"
        >
          ×
        </button>
      ) : null}

      <div className="flex gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-parchment/80 text-xs font-semibold uppercase tracking-wide text-soft-slate">
            Stop
          </div>
        )}

        <div className="min-w-0 flex-1 pr-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-bronze">
            {eyebrow}
          </p>
          <p className="font-display text-xl font-medium text-deep-slate">{title}</p>
          {eta ? <p className="mt-1 text-sm text-soft-slate">{eta}</p> : null}
        </div>
      </div>

      {onContinue ? (
        <div className="mt-4 flex justify-end">
          <GoldButton type="button" onClick={onContinue} className="px-5 py-2.5 text-sm">
            {continueLabel} →
          </GoldButton>
        </div>
      ) : null}
    </GlassPanel>
  )
}
