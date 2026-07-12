import { Play } from 'lucide-react'
import { pantheonNow } from '../redesign/images.js'
import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingFreeStorySection({ onPreview, onScrollToProduct }) {
  const { id, headline, subheadline, card, primaryCta, secondaryCta } = LANDING_CONTENT['free-story']

  return (
    <LandingSection id={id} title={headline} variant="bone">
      <p className="cw-landing-lead">{subheadline}</p>
      <div className="cw-landing-story-card">
        <div className="cw-landing-story-card__thumb">
          <img src={pantheonNow} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>
        <div>
          <h3 className="cw-landing-story-card__title">{card.title}</h3>
          <p className="cw-landing-story-card__meta">{card.meta}</p>
        </div>
      </div>
      <div className="cw-landing-actions">
        <button type="button" className="cw-landing-btn cw-landing-btn--coral" onClick={onPreview}>
          <Play size={16} aria-hidden />
          {primaryCta}
        </button>
        <button type="button" className="cw-landing-btn cw-landing-btn--ghost-dark" onClick={onScrollToProduct}>
          {secondaryCta}
        </button>
      </div>
    </LandingSection>
  )
}
