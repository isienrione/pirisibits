import RedesignRouteShell from '../RedesignRouteShell.jsx'
import RedesignHomeScreen from '../RedesignHomeScreen.jsx'
import NativeDiscoverHome from '../screens/NativeDiscoverHome.jsx'
import { isNativeIOS } from '../../lib/platform.js'

export default function RedesignHomePage() {
  if (isNativeIOS()) {
    return (
      <RedesignRouteShell>
        <div className="redesign-phone-frame redesign-phone-frame--companion">
          <NativeDiscoverHome />
        </div>
      </RedesignRouteShell>
    )
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <RedesignHomeScreen />
      </div>
    </RedesignRouteShell>
  )
}
