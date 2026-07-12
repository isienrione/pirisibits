import { useNavigate } from 'react-router-dom'
import { getJourneySnapshot, JOURNEY_STATES } from '../../state/journey.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import A3AccessConfirmed from '../screens/A3AccessConfirmed.jsx'

export default function RedesignAccessConfirmedPage() {
  const navigate = useNavigate()

  const handleContinue = () => {
    const { state } = getJourneySnapshot()
    const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE
    navigate(inProgress ? '/journey' : '/setup', { replace: true })
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <A3AccessConfirmed onContinue={handleContinue} />
      </div>
    </RedesignRouteShell>
  )
}
