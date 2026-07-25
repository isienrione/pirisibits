import { LANDING_PRODUCT } from '../landingProduct.js'

/**
 * Mobile sticky CTA — purchase only, never while competing sections are in view.
 *
 * @param {{
 *   visible?: boolean,
 *   mode?: { id?: string },
 *   previewFirst?: boolean,
 *   onPurchase?: () => void,
 *   onPreview?: () => void,
 *   suppressed?: boolean,
 * }} props
 */
export default function RebuildStickyBar({
  visible = false,
  mode,
  previewFirst = false,
  onPurchase,
  onPreview,
  suppressed = false,
}) {
  const modeId = mode?.id === 'geo' || mode?.id === 'qr' ? mode.id : 'organic'
  const priceLabel = LANDING_PRODUCT.eterna?.priceLabel ?? ''
  const show = Boolean(visible) && !suppressed

  const showPreviewPrimary = modeId === 'geo' && previewFirst
  const stopCount = LANDING_PRODUCT.eterna?.stopCount ?? 21
  const metaLabel = showPreviewPrimary
    ? 'Free Pantheon chapter'
    : `Roma Eterna · ${stopCount} stops · ${priceLabel}`.trim()
  const primaryLabel = showPreviewPrimary ? 'Try free' : 'Unlock'

  return (
    <aside
      className={`cw-rb-sticky${show ? ' cw-rb-sticky--visible' : ''}`}
      aria-hidden={!show}
      aria-label="Quick actions"
    >
      <div className="cw-rb-sticky__inner">
        <p className="cw-rb-sticky__meta">{metaLabel}</p>
        <button
          type="button"
          className="cw-rb-btn cw-rb-btn--primary cw-rb-sticky__primary"
          onClick={showPreviewPrimary ? onPreview : onPurchase}
        >
          {primaryLabel}
        </button>
      </div>
    </aside>
  )
}
