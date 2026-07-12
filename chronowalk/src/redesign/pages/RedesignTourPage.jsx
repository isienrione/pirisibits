import RedesignRouteShell from '../RedesignRouteShell.jsx'
import RedesignMyTourScreen from '../RedesignMyTourScreen.jsx'

export default function RedesignTourPage() {
  return (
    <RedesignRouteShell>
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <RedesignMyTourScreen />
      </div>
    </RedesignRouteShell>
  )
}
