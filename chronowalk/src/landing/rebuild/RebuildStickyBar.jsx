import { LANDING_PRODUCT } from '../landingProduct.js'

/**
 * Mobile-only sticky CTA bar.
 * Geo starts preview-first until previewFirst is false.
 *
 * @param {{
 *   visible?: boolean,
 *   mode?: { id?: string },
 *   previewFirst?: boolean,
 *   onPurchase?: () => void,
 *   onPreview?: () => void,
 *   audioActive?: boolean,
 * }} props
 */
export default function RebuildStickyBar({
  visible = false,
  mode,
  previewFirst = false,
  onPurchase,
  onPreview,
  audioActive = false,
}) {
  const modeId = mode?.id === 'geo' || mode?.id === 'qr' ? mode.id : 'organic'
  const priceLabel = LANDING_PRODUCT.eterna?.priceLabel ?? ''
  const show = Boolean(visible) && !audioActive

  // Geo: preview-first until parent clears previewFirst.
  const showPreviewPrimary = modeId === 'geo' && previewFirst

  const primaryLabel = showPreviewPrimary
    ? 'Try Pantheon free'
    : `Unlock Rome · ${priceLabel}`.trim()

  const secondaryLabel = showPreviewPrimary
    ? `See full walk · ${priceLabel}`.trim()
    : 'Try Pantheon free'

  return (
    <aside
      className={`cw-rb-sticky${show ? ' cw-rb-sticky--visible' : ''}`}
      aria-hidden={!show}
      aria-label="Quick actions"
    >
      <div className="cw-rb-sticky__inner">
        <button
          type="button"
          className="cw-rb-btn cw-rb-btn--primary cw-rb-sticky__primary"
          onClick={showPreviewPrimary ? onPreview : onPurchase}
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          className="cw-rb-btn cw-rb-btn--ghost cw-rb-sticky__secondary"
          onClick={showPreviewPrimary ? onPurchase : onPreview}
        >
          {secondaryLabel}
        </button>
      </div>
    </aside>
  )
}
