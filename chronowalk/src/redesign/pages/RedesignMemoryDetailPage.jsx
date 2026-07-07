import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWaypoint } from '../../content/manifest.js'
import { jumpToWaypointInJourney } from '../../lib/jumpToWaypoint.js'
import { JOURNEY_STATES } from '../../state/journey.js'
import { useTourManifest, useV2Journey } from '../../hooks/useV2Journey.js'
import {
  accentForWaypoint,
  honestyCaptionForWaypoint,
  photoForWaypoint,
  signatureLine,
  thenLabelForWaypoint,
  thenLoopForWaypoint,
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

  const goToStopExperience = (targetState, storyView = null) => {
    if (!manifest || !waypointId) return
    const jumped = jumpToWaypointInJourney(manifest, waypointId, context, state, {
      targetState,
      storyView,
    })
    if (jumped) navigate('/journey')
  }

  const handleWalkToStop = () => {
    goToStopExperience(null)
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
          thenLoop={thenLoopForWaypoint(waypoint)}
          thenLabel={thenLabelForWaypoint(waypoint)}
          honestyCaption={honestyCaptionForWaypoint(waypoint)}
          signatureLine={signatureLine(waypoint)}
          facts={waypoint.keyFacts ?? []}
          transcript={waypoint.transcriptPreview}
          chapters={waypoint.chapters ?? []}
          onBack={() => navigate('/journal')}
          onWalkToStop={handleWalkToStop}
          onStepThroughTime={() => goToStopExperience(JOURNEY_STATES.THRESHOLD)}
          onAudioOnly={() => goToStopExperience(JOURNEY_STATES.STORY, 'chapters')}
          onTranscript={() => goToStopExperience(JOURNEY_STATES.STORY, 'transcript')}
          onViewImages={() => goToStopExperience(JOURNEY_STATES.ARRIVED)}
        />
      </div>
    </RedesignRouteShell>
  )
}
