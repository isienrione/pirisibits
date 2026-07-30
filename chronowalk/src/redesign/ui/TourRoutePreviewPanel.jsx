import { useMemo } from 'react'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { getPackRoutePreview } from '../../landing/packRoutePreview.js'
import { T, F } from '../tokens.js'
import { Eyebrow } from './index.js'
import TourRouteIllustration from './TourRouteIllustration.jsx'

/**
 * Shared route preview - pack poster for known tiers, illustrated roadmap otherwise.
 */
export default function TourRoutePreviewPanel({
  manifest,
  loading = false,
  context,
  cityLabel = 'Rome, Italy',
  eyebrow,
  title,
  subtitle,
}) {
  const pack = useMemo(() => getPackRoutePreview(context?.pace), [context?.pace])

  const stopCount = useMemo(() => {
    if (pack?.marketingStopCount) return pack.marketingStopCount
    if (!manifest) return 0
    // Own-pace / unknown: prefer catalog marketing count when no custom list.
    if (context?.pace == null) {
      return getTourProductTruth(manifest, {
        path: context?.path ?? 'a',
        promotedOptionalIds: context?.promotedOptionalIds ?? [],
        customWaypointIds: context?.customWaypointIds,
      }).visitStopCount
    }
    return getTourProductTruth(manifest, {
      path: context?.path ?? 'a',
      pace: context?.pace,
      promotedOptionalIds: context?.promotedOptionalIds ?? [],
      customWaypointIds: context?.customWaypointIds,
    }).visitStopCount
  }, [
    pack?.marketingStopCount,
    manifest,
    context?.path,
    context?.pace,
    context?.promotedOptionalIds,
    context?.customWaypointIds,
  ])

  const headerEyebrow = eyebrow ?? cityLabel.toUpperCase()
  const headerTitle =
    title ??
    (stopCount > 0 ? `${stopCount} stops · your route` : 'Your route')
  const headerSubtitle =
    subtitle === undefined
      ? pack
        ? pack.tagline
        : null
      : subtitle

  return (
    <div className="cw-route-preview-panel">
      <div className="cw-route-preview-panel__header">
        <Eyebrow color={T.ember}>{headerEyebrow}</Eyebrow>
        <h1
          className="cw-route-preview-panel__title"
          style={{ fontFamily: F.display, color: T.ink }}
        >
          {headerTitle}
        </h1>
        {headerSubtitle ? (
          <p className="cw-route-preview-panel__subtitle" style={{ color: T.muted }}>
            {headerSubtitle}
          </p>
        ) : null}
      </div>

      <div
        className={`cw-route-preview-panel__hero${pack ? ' cw-route-preview-panel__hero--pack' : ''}`}
      >
        {loading || !manifest ? (
          <div className="cw-route-preview-panel__loading" style={{ color: T.muted }}>
            Loading route…
          </div>
        ) : pack?.cardImage ? (
          <div className="cw-route-preview-panel__pack" data-testid="route-preview-pack">
            <img
              className="cw-route-preview-panel__pack-img"
              src={pack.cardImage}
              alt={`${pack.name} route map - ${pack.stopsLabel}`}
              width={pack.cardWidth}
              height={pack.cardHeight}
              decoding="async"
            />
          </div>
        ) : (
          <TourRouteIllustration manifest={manifest} context={context ?? { path: 'a' }} />
        )}
      </div>
    </div>
  )
}
