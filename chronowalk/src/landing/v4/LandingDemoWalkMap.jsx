import WalkingMapChrome from '../../redesign/ui/WalkingMapChrome.jsx'

/**
 * Walking map for landing phone demos.
 * Satellite basemap of a street-following Spanish Steps approach
 * (route + markers are baked into the image; chrome stays live).
 */
export default function LandingDemoWalkMap({ bearing = 12 }) {
  return (
    <div className="cw-v4-demo-walk-map" data-testid="landing-demo-walk-map">
      <img
        className="cw-v4-demo-walk-map__basemap"
        src="/landing/phone-screens/walk-map-spanish-steps.jpg"
        alt=""
        decoding="async"
        draggable={false}
      />
      <div className="cw-v4-demo-walk-map__veil cw-v4-demo-walk-map__veil--light" aria-hidden />
      <WalkingMapChrome bearing={bearing} onRecenter={() => {}} />
    </div>
  )
}
