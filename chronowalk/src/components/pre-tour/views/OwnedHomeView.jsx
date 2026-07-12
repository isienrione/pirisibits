import { getTourById } from '../../../services/tourRegistry'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { EditorialTitle, Button, cn, tapAction } from '../../ui'
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
      <div className="bg-ink900 rounded-card rounded-3xl p-6  sm:p-8">
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
              <button
                key={tour.id}
                type="button"
                onClick={() => {
                  triggerHaptic(HAPTIC_KIND.SOFT_TAP)
                  onSelectTour(tour.id)
                }}
                className={cn(
                  'bg-ink900 rounded-card w-full p-4 text-left transition',
                  tapAction,
                  selected ? 'border-ember/40 bg-ember/[0.04]' : 'hover:border-ember/30'
                )}
              >
                  <p className="text-eyebrow uppercase text-ember">{tour.subtitle}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-ink900">{tour.title}</h3>
                  <p className="mt-2 text-sm text-muted">
                    <span className="font-semibold text-ink900">{tour.stopIds.length} stops</span>
                  </p>
              </button>
            )
          })}
        </div>

        {selectedTourId ? (
          <Button
            size="lg"
            fullWidth
            className="mt-6"
            onClick={() => {
              triggerHaptic(HAPTIC_KIND.SUCCESS)
              onBeginJourney(selectedTourId)
            }}
          >
            Continue with {getTourById(selectedTourId)?.title ?? 'tour'}
          </Button>
        ) : null}
      </div>

      <FreePreviewCard onTryFreePreview={onTryFreePreview} className="mt-0" />

      <Button variant="quiet" fullWidth onClick={onBrowseTours}>
        Browse all tours
      </Button>
    </div>
  )
}

export default OwnedHomeView
