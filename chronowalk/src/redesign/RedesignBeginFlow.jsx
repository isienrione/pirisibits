import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { JOURNEY_PACE, PACE_OPTIONS, getPaceOption } from '../data/romePacing.js'
import { requestLocationAccess } from '../lib/locationAccess.js'
import { track, TRACK_EVENTS } from '../lib/track.js'
import { useJourneyStep } from '../hooks/useJourneyStep.js'
import { useV2Journey, useTourManifest } from '../hooks/useV2Journey.js'
import B3PermissionsPrimer from './screens/B3PermissionsPrimer.jsx'
import B4PaceSelector from './screens/B4PaceSelector.jsx'
import C8dResume from './screens/C8dResume.jsx'
import { titleForWaypoint } from './lib/waypointPresentation.js'

export default function RedesignBeginFlow() {
  const navigate = useNavigate()
  const { begin, resume, reset, isResumable, context } = useV2Journey()
  const { manifest } = useTourManifest()
  const step = useJourneyStep(
    manifest,
    context.path,
    context.currentSequenceIndex,
    context.promotedOptionalIds,
  )
  const [stepName, setStepName] = useState(() => (isResumable ? 'resume' : 'pace'))
  const [selectedPace, setSelectedPace] = useState(JOURNEY_PACE.CLASSIC)
  const [busy, setBusy] = useState(false)

  const startJourney = () => {
    begin({ pace: selectedPace, waypointIndex: 0 })
    track(TRACK_EVENTS.JOURNEY_BEGIN, { pace: selectedPace, waypoint_index: 0 })
    navigate('/journey', { replace: true })
  }

  const handleEnableLocation = async () => {
    setBusy(true)
    const result = await requestLocationAccess()
    setBusy(false)
    if (result === 'granted') {
      startJourney()
      return
    }
    track(TRACK_EVENTS.GPS_FALLBACK_USED, { source: 'begin_flow', result })
    startJourney()
  }

  if (stepName === 'resume') {
    const resumeLabel = step?.type === 'waypoint' && step.record
      ? `Pick up at ${titleForWaypoint(step.record)}`
      : 'Continue your walk'
    return (
      <div className="redesign-app-shell">
        <C8dResume
          resumeLabel={resumeLabel}
          onContinue={() => {
            resume()
            track(TRACK_EVENTS.RESUME, { source: 'begin_flow' })
            navigate('/journey', { replace: true })
          }}
          onStartFresh={() => {
            reset()
            setStepName('pace')
          }}
        />
      </div>
    )
  }

  if (stepName === 'location') {
    return (
      <div className="redesign-app-shell">
        <B3PermissionsPrimer
          paceTitle={getPaceOption(selectedPace)?.title}
          busy={busy}
          onEnable={handleEnableLocation}
          onSkip={startJourney}
        />
      </div>
    )
  }

  return (
    <div className="redesign-app-shell">
      <B4PaceSelector
        options={PACE_OPTIONS}
        selectedPace={selectedPace}
        onSelectPace={setSelectedPace}
        onContinue={() => setStepName('location')}
      />
    </div>
  )
}
