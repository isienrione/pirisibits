import RedesignRouteShell from '../RedesignRouteShell.jsx'
import RedesignTourRoadmapScreen from '../RedesignTourRoadmapScreen.jsx'

export default function RedesignTourPage() {
  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell redesign-phone-frame redesign-phone-frame--companion">
        <RedesignTourRoadmapScreen />
      </div>
    </RedesignRouteShell>
  )
}
