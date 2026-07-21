import { LocateFixed } from 'lucide-react'

/**
 * Walking-hero map chrome: north compass + styled recenter.
 * Uses ChronoWalk walking-companion CSS tokens (`--wc-*`).
 */
export default function WalkingMapChrome({
  bearing = 0,
  onRecenter,
  visible = true,
}) {
  if (!visible) return null

  return (
    <div className="cw-walk-map-chrome" data-testid="walking-map-chrome">
      <div
        className="cw-walk-map-chrome__compass"
        role="img"
        aria-label={`North. Map bearing ${Math.round(((bearing % 360) + 360) % 360)} degrees`}
      >
        <span
          className="cw-walk-map-chrome__compass-dial"
          style={{ transform: `rotate(${-bearing}deg)` }}
          aria-hidden
        >
          <span className="cw-walk-map-chrome__compass-n">N</span>
          <span className="cw-walk-map-chrome__compass-needle" />
        </span>
      </div>

      {typeof onRecenter === 'function' ? (
        <button
          type="button"
          className="cw-walk-map-chrome__recenter cw-wc-pressable"
          onClick={onRecenter}
          aria-label="Recenter map on your route"
        >
          <LocateFixed size={18} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
