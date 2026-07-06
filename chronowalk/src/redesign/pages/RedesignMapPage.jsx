import MapScreen from '../../components/map/MapScreen.jsx'

/**
 * Production map tab — uses the real Mapbox + GPS stack (MapScreen),
 * not the static Figma D1 illustration (see /prototype for that).
 */
export default function RedesignMapPage() {
  return (
    <div className="redesign-phone-frame redesign-phone-frame--companion">
      <MapScreen />
    </div>
  )
}
