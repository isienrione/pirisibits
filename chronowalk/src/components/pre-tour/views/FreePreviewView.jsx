import { FREE_PREVIEW_ANCIENT_POSTER } from '../../../data/freePreview'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { Button, EditorialTitle } from '../../ui'

export function FreePreviewView({ onStartPreview, onBrowseTours }) {
  return (
    <div className="bg-ink900 rounded-card overflow-hidden rounded-3xl ">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={FREE_PREVIEW_ANCIENT_POSTER}
          alt="Ancient reconstruction of the Colosseum exterior"
          className="h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-[color-mix(in_srgb,var(--obsidian)_62%,transparent)]"
          aria-hidden="true"
        />
      </div>

      <div className="p-6 sm:p-8">
        <EditorialTitle
          eyebrow="Free preview"
          size="md"
          subtitle="Explore the full Rome tour map with the Colosseum unlocked. Experience the reconstruction and opening audio before purchasing the complete journey."
        >
          Walk the Colosseum for free
        </EditorialTitle>

        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>Full bundled route visible on the map</li>
          <li>Colosseum reconstruction and intro audio unlocked</li>
          <li>Locked landmarks show what you get when you buy</li>
        </ul>

        <div className="relative z-[3] mt-8 flex flex-col gap-3">
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              triggerHaptic(HAPTIC_KIND.SUCCESS)
              onStartPreview()
            }}
          >
            Start free preview
          </Button>
          <Button
            variant="quiet"
            size="lg"
            fullWidth
            onClick={() => {
              triggerHaptic(HAPTIC_KIND.SOFT_TAP)
              onBrowseTours()
            }}
          >
            Browse tours &amp; pricing
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FreePreviewView
