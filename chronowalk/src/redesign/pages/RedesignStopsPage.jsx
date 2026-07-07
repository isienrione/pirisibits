import RedesignRouteShell from '../RedesignRouteShell.jsx'
import RedesignStopsScreen from '../RedesignStopsScreen.jsx'

export default function RedesignStopsPage() {
  return (
    <RedesignRouteShell>
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <RedesignStopsScreen />
      </div>
    </RedesignRouteShell>
  )
}
