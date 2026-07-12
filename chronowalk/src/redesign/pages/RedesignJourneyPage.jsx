import RedesignRouteShell from '../RedesignRouteShell.jsx'
import JourneyShell from '../../components/journey/JourneyShell.jsx'

export default function RedesignJourneyPage() {
  return (
    <RedesignRouteShell>
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <JourneyShell variant="redesign" />
      </div>
    </RedesignRouteShell>
  )
}
