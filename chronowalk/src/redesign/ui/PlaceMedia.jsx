import { BRAND_PLACEHOLDER_IMAGE } from '../../content/registry/constants.js'
import { DEFAULT_PLACEHOLDER_TONE, isHonestContentPhoto } from '../../content/registry/media.js'
import { mediaUrl } from '../../lib/mediaUrl.js'
import { R } from './RouteSurface.jsx'

function toneOf(item) {
  return item?.mediaResolved?.tone || DEFAULT_PLACEHOLDER_TONE
}

/**
 * Honest place photography. Never paints a different monument as a fallback.
 * Missing media → warm cluster texture + ChronoWalk mark.
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
  const emblem = mediaUrl(BRAND_PLACEHOLDER_IMAGE) || BRAND_PLACEHOLDER_IMAGE

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
        display: 'grid',
        placeItems: 'center',
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
            'radial-gradient(circle at 30% 20%, rgba(250,246,239,0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(26,26,31,0.12), transparent 50%)',
        }}
      />
      <img
        src={emblem}
        alt=""
        style={{
          width: Math.min(48, height * 0.32),
          height: Math.min(48, height * 0.32),
          opacity: 0.72,
          position: 'relative',
        }}
      />
    </div>
  )
}
