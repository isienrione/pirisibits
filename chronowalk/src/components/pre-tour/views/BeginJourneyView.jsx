import { getTourById } from '../../../services/tourRegistry'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { BronzeButton, EditorialTitle, GlassPanel } from '../../ui'
import OfflineDownloadPanel from '../../offline/OfflineDownloadPanel'

export function BeginJourneyView({ tourId, onStartJourney }) {
  const tour = getTourById(tourId)

  if (!tour) {
    return <p className="text-sm text-soft-slate">Select a tour to begin your journey.</p>
  }

  return (
    <GlassPanel className="rounded-3xl p-6 shadow-plaque-lg sm:p-8" grain>
      <EditorialTitle
        eyebrow="Ready to walk"
        size="md"
        subtitle="Your tour begins at the first landmark. Walk there to unlock your opening story — location is used only to guide you between stops."
      >
        {tour.title}
      </EditorialTitle>

      <p className="mt-4 text-sm text-soft-slate">
        <span className="font-semibold text-deep-slate">{tour.stopIds.length} stops</span>
        <span className="text-limestone"> · </span>
        {tour.subtitle}
      </p>

      <div className="mt-6">
        <OfflineDownloadPanel tour={tour} compact />
      </div>

      <BronzeButton
        size="lg"
        fullWidth
        className="mt-8"
        onClick={() => {
          triggerHaptic(HAPTIC_KIND.SUCCESS)
          onStartJourney(tour)
        }}
      >
        Begin journey
      </BronzeButton>
    </GlassPanel>
  )
}

export default BeginJourneyView
