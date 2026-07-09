import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT, formatLandingCopy } from './landingData.js'

export default function LandingFinalCtaSection({ priceLabel, onBegin, onPreview }) {
  const { id, paragraphs, primaryCta, secondaryCta, trustLine } = LANDING_CONTENT['final-cta']

  return (
    <LandingSection id={id} title="" hideTitle variant="dark" className="cw-landing-final">
      <div className="cw-landing-final__copy">
        {paragraphs.map((block) => (
          <p key={block.slice(0, 20)} className="cw-landing-final__para">
            {block.split('\n').map((line, i) => (
              <span key={line}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        ))}
      </div>
      <div className="cw-landing-actions">
        <button type="button" className="cw-landing-btn cw-landing-btn--coral" onClick={onBegin}>
          {primaryCta}
        </button>
        <button type="button" className="cw-landing-btn cw-landing-btn--ghost" onClick={onPreview}>
          {secondaryCta}
        </button>
      </div>
      <p className="cw-landing-final__trust">
        {formatLandingCopy(trustLine, { price: priceLabel })}
      </p>
    </LandingSection>
  )
}
