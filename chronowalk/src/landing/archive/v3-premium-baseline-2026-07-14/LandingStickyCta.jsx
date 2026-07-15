import { formatLandingCopy, stickyCta } from './landingData.js'

export default function LandingStickyCta({ visible, priceLabel, onBegin, onPreview }) {
  return (
    <aside
      className={`cw-landing-sticky${visible ? ' cw-landing-sticky--visible' : ''}`}
      aria-hidden={!visible}
      aria-label="Quick actions"
    >
      <div className="cw-landing-sticky__inner">
        <button type="button" className="cw-landing-sticky__primary cw-landing-btn cw-landing-btn--coral" onClick={onBegin}>
          {formatLandingCopy(stickyCta.primary, { price: priceLabel })}
        </button>
        <button type="button" className="cw-landing-sticky__link" onClick={onPreview}>
          {stickyCta.secondary}
        </button>
      </div>
    </aside>
  )
}
