import RedesignRouteShell from '../RedesignRouteShell.jsx'
import RedesignHomeScreen from '../RedesignHomeScreen.jsx'

export default function RedesignHomePage() {
  return (
    <RedesignRouteShell>
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <RedesignHomeScreen />
      </div>
    </RedesignRouteShell>
  )
}
