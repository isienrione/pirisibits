import { getModernCoverUrl } from '../../../utils/sliderMedia.js'

export default function ApproachingJourneyScreen({
  waypoint,
  targetTitle,
  approachLine,
  distance,
}) {
  const imageUrl = waypoint ? getModernCoverUrl(waypoint) : null
  const blurAmount = distance != null ? Math.max(6, 24 - distance / 4) : 18

  return (
    <div className="relative min-h-full">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `blur(${blurAmount}px) saturate(0.85)` }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="absolute inset-0 bg-[color-mix(in_srgb,var(--ember)_12%,var(--obsidian))]"
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--obsidian)_55%,transparent)]" />

      <div className="relative flex min-h-full w-full flex-col justify-end px-6 pb-16 pt-24">
        <p className="text-eyebrow uppercase text-ember">Approaching</p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-warmwhite">
          {targetTitle ?? 'Almost there'}
        </h1>
        {approachLine ? (
          <p className="mt-4 text-base leading-relaxed text-muted">{approachLine}</p>
        ) : null}
        {distance != null ? (
          <p className="mt-6 text-sm font-semibold tabular-nums text-warmwhite">
            {Math.round(distance)} m
          </p>
        ) : null}
      </div>
    </div>
  )
}
