import MapScreen from '../../components/map/MapScreen.jsx'
import NativeMapScreen from '../screens/NativeMapScreen.jsx'
import { isNativeIOS } from '../../lib/platform.js'

/**
 * Production map tab - uses the real Mapbox + GPS stack (MapScreen) on web.
 * Native iOS uses the city inventory map (Heroes + Discoveries).
 */
export default function RedesignMapPage() {
  if (isNativeIOS()) {
    return (
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <NativeMapScreen />
      </div>
    )
  }
  return (
    <div className="redesign-phone-frame redesign-phone-frame--companion">
      <MapScreen variant="redesign" />
    </div>
  )
}
