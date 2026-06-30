import { FREE_PREVIEW_ANCIENT_POSTER } from '../../../data/freePreview'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { BronzeButton, Button, EditorialTitle, GlassPanel } from '../../ui'

export function FreePreviewView({ onStartPreview, onBrowseTours }) {
  return (
    <GlassPanel className="overflow-hidden rounded-3xl shadow-plaque-lg" grain>
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <img
          src={FREE_PREVIEW_ANCIENT_POSTER}
          alt="Ancient reconstruction of the Colosseum exterior"
          className="h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-obsidian/20 to-transparent"
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

        <ul className="mt-6 space-y-2 text-sm text-soft-slate">
          <li>Full bundled route visible on the map</li>
          <li>Colosseum reconstruction and intro audio unlocked</li>
          <li>Locked landmarks show what you get when you buy</li>
        </ul>

        <div className="relative z-[3] mt-8 flex flex-col gap-3">
          <BronzeButton
            size="lg"
            fullWidth
            onClick={() => {
              triggerHaptic(HAPTIC_KIND.SUCCESS)
              onStartPreview()
            }}
          >
            Start free preview
          </BronzeButton>
          <Button
            variant="secondary"
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
    </GlassPanel>
  )
}

export default FreePreviewView
