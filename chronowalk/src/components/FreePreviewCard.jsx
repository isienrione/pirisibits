import { FREE_PREVIEW_ANCIENT_POSTER } from '../data/freePreview'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import { Button } from './ui'

export function FreePreviewCard({ onTryFreePreview, className = 'mt-8' }) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-gold/35 bg-gradient-to-br from-gold/[0.08] to-terracotta/[0.06] ${className}`}
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
          <p className="text-eyebrow uppercase text-terracotta">Try for free</p>
          <h2 className="mt-2 font-display text-lg font-semibold text-deep-slate">
            Explore the full Rome tour on the map
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-soft-slate">
            See every landmark on the bundled route — Forum cluster and city loop — with the
            Colosseum unlocked. Tap any locked stop to preview what you&apos;re missing.
          </p>
          <Button
            size="lg"
            fullWidth
            className="mt-4"
            onClick={() => {
              triggerHaptic(HAPTIC_KIND.SUCCESS)
              onTryFreePreview?.()
            }}
          >
            Try for free
          </Button>
        </div>
      </div>
    </section>
  )
}

export default FreePreviewCard
