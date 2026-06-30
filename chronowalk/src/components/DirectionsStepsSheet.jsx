import { BottomSheet } from './ui/BottomSheet'
import { DirectionsStepList } from './DirectionsStepList'
import { SectionHeader } from './ui'

function DirectionsStepsSheet({
  open,
  onClose,
  destinationTitle,
  steps,
  currentStepIndex,
}) {
  return (
    <BottomSheet
      open={open}
      onHandleClick={onClose}
      onEscape={onClose}
      handleLabel="Close walking steps"
      ariaLabelledBy="directions-steps-title"
      className="fixed inset-x-0"
    >
      <SectionHeader
        id="directions-steps-title"
        align="left"
        eyebrow="Turn-by-turn"
        title={destinationTitle ?? 'Walking directions'}
        subtitle="Follow these steps while keeping the map visible above."
      />
      <DirectionsStepList
        steps={steps}
        currentStepIndex={currentStepIndex}
        className="mt-5 pb-6"
      />
    </BottomSheet>
  )
}

export default DirectionsStepsSheet
