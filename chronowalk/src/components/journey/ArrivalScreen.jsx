import { JourneyLayout, JourneyPrimaryButton } from './JourneyLayout.jsx'

export default function ArrivalScreen({ waypointName, arrivalLine, onBeginStory, busy = false }) {
  return (
    <JourneyLayout eyebrow="Arrived" title={waypointName} subtitle={arrivalLine}>
      <JourneyPrimaryButton onClick={onBeginStory} disabled={busy}>
        Begin story
      </JourneyPrimaryButton>
    </JourneyLayout>
  )
}
