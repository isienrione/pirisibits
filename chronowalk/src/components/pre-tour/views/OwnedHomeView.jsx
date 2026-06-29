import { getTourById } from '../../../services/tourRegistry'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { BronzeButton, EditorialTitle, GlassPanel, ParchmentCard, cn, tapAction } from '../../ui'
import FreePreviewCard from '../../FreePreviewCard'

export function OwnedHomeView({
  ownedTourIds,
  ownsAllTours,
  selectedTourId,
  onSelectTour,
  onBeginJourney,
  onTryFreePreview,
  onBrowseTours,
}) {
  const tourIds = ownsAllTours
    ? ['roman-forum', 'heart-of-ancient-rome']
    : ownedTourIds

  const tours = tourIds.map((id) => getTourById(id)).filter(Boolean)

  return (
    <div className="space-y-6">
      <GlassPanel className="rounded-3xl p-6 shadow-plaque-lg sm:p-8" grain>
        <EditorialTitle
          eyebrow="ChronoWalk"
          size="lg"
          subtitle="Pick up where you left off or switch between your purchased routes."
        >
          Your Rome walking tours
        </EditorialTitle>

        <div className="mt-6 space-y-4">
          {tours.map((tour) => {
            const selected = tour.id === selectedTourId
            return (
              <ParchmentCard
                key={tour.id}
                as="button"
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_KIND.SOFT_TAP)
                  onSelectTour(tour.id)
                }}
                className={cn(
                  'w-full p-4 text-left transition',
                  tapAction,
                  selected ? 'border-bronze/40 bg-bronze/[0.04] shadow-plaque-lg' : 'hover:border-bronze/30'
                )}
              >
                  <p className="text-eyebrow uppercase text-bronze">{tour.subtitle}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-deep-slate">{tour.title}</h3>
                  <p className="mt-2 text-sm text-soft-slate">
                    <span className="font-semibold text-deep-slate">{tour.stopIds.length} stops</span>
                  </p>
              </ParchmentCard>
            )
          })}
        </div>

        {selectedTourId ? (
          <BronzeButton
            size="lg"
            fullWidth
            className="mt-6"
            onClick={() => {
              triggerHaptic(HAPTIC_KIND.SUCCESS)
              onBeginJourney(selectedTourId)
            }}
          >
            Continue with {getTourById(selectedTourId)?.title ?? 'tour'}
          </BronzeButton>
        ) : null}
      </GlassPanel>

      <FreePreviewCard onTryFreePreview={onTryFreePreview} className="mt-0" />

      <BronzeButton variant="secondary" fullWidth onClick={onBrowseTours}>
        Browse all tours
      </BronzeButton>
    </div>
  )
}

export default OwnedHomeView
