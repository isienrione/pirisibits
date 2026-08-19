import { DEFAULT_PLACEHOLDER_TONE, isHonestContentPhoto } from '../../content/registry/media.js'
import { R } from './RouteSurface.jsx'

function toneOf(item) {
  return item?.mediaResolved?.tone || DEFAULT_PLACEHOLDER_TONE
}

/**
 * Honest place photography. Never paints a different monument as a fallback.
 * Missing media → travertine / map-fragment texture, never a ChronoWalk logo square.
 */
export default function PlaceMedia({
  item,
  height = 120,
  mystery = false,
  radius = 16,
  testId,
}) {
  const honest = !mystery && isHonestContentPhoto(item) && item?.photo
  const tone = toneOf(item)

  if (mystery) {
    return (
      <div
        data-testid={testId}
        data-placeholder="mystery"
        aria-hidden="true"
        style={{
          height,
          borderRadius: radius,
          background: `linear-gradient(165deg, color-mix(in srgb, ${R.sage} 22%, ${R.bg}) 0%, color-mix(in srgb, ${R.violet} 28%, ${R.cardWarm}) 100%)`,
          display: 'grid',
          placeItems: 'center',
          color: R.violet,
          fontSize: Math.min(28, height / 3),
          border: `1px solid ${R.line}`,
        }}
      >
        ✦
      </div>
    )
  }

  if (honest) {
    return (
      <div
        data-testid={testId}
        data-placeholder="false"
        aria-hidden="true"
        style={{
          height,
          borderRadius: radius,
          backgroundImage: `url(${item.photo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: R.line,
        }}
      />
    )
  }

  return (
    <div
      data-testid={testId}
      data-placeholder="true"
      data-asset-source="placeholder"
      aria-hidden="true"
      style={{
        height,
        borderRadius: radius,
        background: `linear-gradient(165deg, ${tone.from} 0%, ${tone.to} 100%)`,
        border: `1px solid ${R.line}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(115deg, rgba(250,246,239,0.08) 0 10px, transparent 10px 22px), radial-gradient(circle at 28% 18%, rgba(250,246,239,0.28), transparent 52%)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          right: '12%',
          top: '18%',
          width: '42%',
          height: '64%',
          border: `1px solid color-mix(in srgb, ${R.ink} 12%, transparent)`,
          borderRadius: 4,
          opacity: 0.45,
          background: 'linear-gradient(180deg, rgba(26,26,31,0.04), transparent)',
        }}
      />
    </div>
  )
}
