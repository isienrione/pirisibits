import { useNavigate } from 'react-router-dom'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import C9NoTicket from '../screens/C9NoTicket.jsx'

export default function RedesignNoTicketPage() {
  const navigate = useNavigate()

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell redesign-phone-frame">
        <C9NoTicket
          onTakeWalk={() => navigate('/journey')}
          onDismiss={() => navigate('/journey')}
        />
      </div>
    </RedesignRouteShell>
  )
}
