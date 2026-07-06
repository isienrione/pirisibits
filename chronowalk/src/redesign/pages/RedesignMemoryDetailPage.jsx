import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWaypoint } from '../../content/manifest.js'
import { jumpToWaypointInJourney } from '../../lib/jumpToWaypoint.js'
import { useTourManifest, useV2Journey } from '../../hooks/useV2Journey.js'
import {
  accentForWaypoint,
  photoForWaypoint,
  signatureLine,
  thenPhotoForWaypoint,
  titleForWaypoint,
} from '../lib/waypointPresentation.js'
import { getAct } from '../../content/manifest.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import E2MemoryDetail from '../screens/E2MemoryDetail.jsx'

export default function RedesignMemoryDetailPage() {
  const navigate = useNavigate()
  const { waypointId } = useParams()
  const { state, context } = useV2Journey()
  const { manifest, loading, error } = useTourManifest()

  const waypoint = useMemo(
    () => (manifest && waypointId ? getWaypoint(manifest, waypointId) : null),
    [manifest, waypointId],
  )

  const act = useMemo(() => {
    if (!manifest || !waypoint?.act) return null
    return getAct(manifest, waypoint.act)
  }, [manifest, waypoint?.act])

  const handleWalkToStop = () => {
    if (!manifest || !waypointId) return
    const jumped = jumpToWaypointInJourney(manifest, waypointId, context, state)
    if (jumped) navigate('/journey')
  }

  if (loading) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell" style={{ minHeight: '100dvh', background: '#F7F1E6' }} />
      </RedesignRouteShell>
    )
  }

  if (error || !waypoint) {
    return (
      <RedesignRouteShell>
        <div className="redesign-app-shell redesign-phone-frame" style={{ padding: 32 }}>
          <p>Stop not found.</p>
          <button type="button" onClick={() => navigate('/stops')}>Back to all stops</button>
        </div>
      </RedesignRouteShell>
    )
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell redesign-phone-frame">
        <E2MemoryDetail
          accent={accentForWaypoint(waypoint, manifest)}
          actLabel={act ? `ACT ${act.numeral} — ${act.title?.toUpperCase()}` : undefined}
          title={titleForWaypoint(waypoint)}
          nowPhoto={photoForWaypoint(waypoint)}
          thenPhoto={thenPhotoForWaypoint(waypoint)}
          signatureLine={signatureLine(waypoint)}
          facts={waypoint.keyFacts ?? []}
          transcript={waypoint.transcriptPreview}
          chapters={waypoint.chapters ?? []}
          onBack={() => navigate('/journal')}
          onWalkToStop={handleWalkToStop}
        />
      </div>
    </RedesignRouteShell>
  )
}
