import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import JourneyStopCard from '../components/journey/JourneyStopCard'
import { GoldButton, PageShell, cn } from '../components/ui'
import { useJourney } from '../hooks/useJourney'
import { JOURNEY_STATES } from '../state/journeyState'
import { ROUTES } from '../routes/paths'

function resolveStopStatus(stop, { currentStopId, completedStopIds }) {
  if (completedStopIds.includes(stop.id)) return 'visited'
  if (stop.id === currentStopId) return 'current'
  return 'upcoming'
}

export default function StopsPage() {
  const navigate = useNavigate()
  const { manifest, context, state, setState, states, updateContext } = useJourney()

  const stops = manifest.stops
  const visitedCount = context.completedStopIds.length
  const totalStops = stops.length
  const hasActiveJourney = state !== JOURNEY_STATES.IDLE && Boolean(context.currentStopId)

  const rows = useMemo(
    () =>
      stops.map((stop) => ({
        stop,
        status: resolveStopStatus(stop, context),
      })),
    [context, stops]
  )

  const returnToJourney = useCallback(() => {
    navigate(hasActiveJourney ? ROUTES.journey : ROUTES.begin)
  }, [hasActiveJourney, navigate])

  const handleStopPress = useCallback(
    (stop, status) => {
      if (status === 'visited') {
        updateContext({
          currentStopId: stop.id,
          currentStopIndex: stop.number - 1,
        })
        setState(states.STORY)
        navigate(ROUTES.journey)
        return
      }

      if (status === 'current') {
        navigate(ROUTES.journey)
      }
    },
    [navigate, setState, states.STORY, updateContext]
  )

  return (
    <div className="min-h-screen bg-ivory">
      <PageShell className="bg-transparent pb-32">
        <header className="pt-2">
          <p className="text-eyebrow uppercase text-bronze">Route reference</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-deep-slate">
            Stops
          </h1>
          <p className="mt-2 text-sm text-soft-slate">
            {visitedCount} of {totalStops} visited
          </p>
        </header>

        <ol className="mt-8 space-y-3" aria-label="Tour stops in route order">
          {rows.map(({ stop, status }) => (
            <li key={stop.id}>
              <JourneyStopCard
                stop={stop}
                status={status}
                onPress={() => handleStopPress(stop, status)}
              />
            </li>
          ))}
        </ol>
      </PageShell>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-parchment/80 bg-ivory/95 px-6 py-4 pb-safe backdrop-blur-glass'
        )}
      >
        <GoldButton fullWidth showArrow onClick={returnToJourney}>
          Return to journey
        </GoldButton>
      </div>
    </div>
  )
}
