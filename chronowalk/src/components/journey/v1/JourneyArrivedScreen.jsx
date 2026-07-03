import ArrivalMoment from '../../ArrivalMoment.jsx'

export default function JourneyArrivedScreen({ waypoint }) {
  if (!waypoint) {
    return (
      <div className="mx-auto flex min-h-full max-w-md items-center px-6">
        <p className="text-base text-muted">You&apos;ve arrived — your story is opening.</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-full">
      <ArrivalMoment waypoint={waypoint} visible />
    </div>
  )
}
