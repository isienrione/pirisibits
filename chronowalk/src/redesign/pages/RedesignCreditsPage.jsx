import { useNavigate } from 'react-router-dom'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import G2Credits from '../screens/G2Credits.jsx'

export default function RedesignCreditsPage() {
  const navigate = useNavigate()

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell redesign-phone-frame">
        <G2Credits onBack={() => navigate(-1)} />
      </div>
    </RedesignRouteShell>
  )
}
