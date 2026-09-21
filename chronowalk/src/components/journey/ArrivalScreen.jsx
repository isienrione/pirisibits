import { JourneyLayout, JourneyPrimaryButton } from './JourneyLayout.jsx'
import { IS_IOS } from '../../lib/platform.js'
import { openAppleMapsWalk } from '../../lib/openExternal.js'

export default function ArrivalScreen({
  waypointName,
  arrivalLine,
  onBeginStory,
  beginLabel = 'Begin story',
  busy = false,
  lat = null,
  lng = null,
}) {
  return (
    <JourneyLayout eyebrow="Arrived" title={waypointName} subtitle={arrivalLine}>
      <JourneyPrimaryButton onClick={onBeginStory} disabled={busy}>
        {beginLabel}
      </JourneyPrimaryButton>
      {IS_IOS && lat != null && lng != null ? (
        <button
          type="button"
          data-testid="ios-apple-maps-walk"
          onClick={() => void openAppleMapsWalk(lat, lng)}
          style={{
            marginTop: 12,
            width: '100%',
            minHeight: 48,
            borderRadius: 999,
            border: '1px solid var(--ink-800, #2A241C)',
            background: 'transparent',
            color: 'var(--ink-900, #1A1612)',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Walk here in Apple Maps
        </button>
      ) : null}
    </JourneyLayout>
  )
}
