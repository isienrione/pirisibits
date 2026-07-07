import { useNavigate } from 'react-router-dom'
import { useAppPreferences } from '../../hooks/useAppPreferences.js'
import { useGeoLocation, LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { requestLocationAccess } from '../../lib/locationAccess.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import G1Settings from '../screens/G1Settings.jsx'

export default function RedesignSettingsPage() {
  const navigate = useNavigate()
  const { prefs, setPref } = useAppPreferences()
  const { locationStatus } = useGeoLocation({ debugMode: false })

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell redesign-phone-frame redesign-phone-frame--companion">
        <G1Settings
          prefs={prefs}
          onSetPref={setPref}
          locationGranted={locationStatus === LOCATION_STATUS.GRANTED}
          onRestoreAccess={() => navigate('/access')}
          onRequestLocation={() => void requestLocationAccess()}
          onDone={() => navigate(-1)}
          onOffline={() => navigate('/setup')}
          onPace={() => navigate('/begin')}
          onCredits={() => navigate('/credits')}
        />
      </div>
    </RedesignRouteShell>
  )
}
