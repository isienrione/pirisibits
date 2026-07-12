import { JourneyLayout, JourneyPrimaryButton } from './JourneyLayout.jsx'

export default function ArrivalScreen({
  waypointName,
  arrivalLine,
  onBeginStory,
  beginLabel = 'Begin story',
  busy = false,
}) {
  return (
    <JourneyLayout eyebrow="Arrived" title={waypointName} subtitle={arrivalLine}>
      <JourneyPrimaryButton onClick={onBeginStory} disabled={busy}>
        {beginLabel}
      </JourneyPrimaryButton>
    </JourneyLayout>
  )
}
