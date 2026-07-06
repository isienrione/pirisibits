import { useNavigate } from 'react-router-dom'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import B1PrismWelcome from '../screens/B1PrismWelcome.jsx'

export default function RedesignWelcomePage() {
  const navigate = useNavigate()

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <B1PrismWelcome onComplete={() => navigate('/setup', { replace: true })} />
      </div>
    </RedesignRouteShell>
  )
}
