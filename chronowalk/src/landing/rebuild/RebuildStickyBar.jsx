import { LANDING_PRODUCT } from '../landingProduct.js'

/**
 * Compact contextual sticky CTA.
 *
 * @param {{
 *   visible?: boolean,
 *   suppressed?: boolean,
 *   mode?: { id?: string },
 *   previewFirst?: boolean,
 *   onPurchase?: () => void,
 *   onPreview?: () => void,
 * }} props
 */
export default function RebuildStickyBar({
  visible = false,
  suppressed = false,
  mode,
  previewFirst = false,
  onPurchase,
  onPreview,
}) {
  const modeId = mode?.id === 'geo' || mode?.id === 'qr' ? mode.id : 'organic'
  const eterna = LANDING_PRODUCT.eterna
  const show = Boolean(visible) && !suppressed
  const showPreviewPrimary = modeId === 'geo' && previewFirst

  return (
    <aside
      className={`cw-rb-sticky${show ? ' cw-rb-sticky--visible' : ''}`}
      aria-hidden={!show}
      aria-label="Quick purchase"
    >
      <div className="cw-rb-sticky__inner">
        <div className="cw-rb-sticky__copy">
          <p className="cw-rb-sticky__title">
            {showPreviewPrimary ? 'Free Pantheon stop' : `Roma Eterna · ${eterna?.priceLabel ?? ''}`}
          </p>
          <p className="cw-rb-sticky__sub">
            {showPreviewPrimary ? 'No purchase required' : `${eterna?.stopCount ?? 21} stops`}
          </p>
        </div>
        <button
          type="button"
          className="cw-rb-btn cw-rb-btn--primary cw-rb-sticky__btn"
          onClick={showPreviewPrimary ? onPreview : onPurchase}
        >
          {showPreviewPrimary ? 'Try free' : 'Unlock'}
        </button>
      </div>
    </aside>
  )
}
