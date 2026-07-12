import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT, formatLandingCopy } from './landingData.js'

export default function LandingWhatYouGetSection({ priceLabel }) {
  const { id, headline, items, valueLine } = LANDING_CONTENT['what-you-get']

  return (
    <LandingSection id={id} title={headline} variant="dark">
      <ul className="cw-landing-checklist">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="cw-landing-value-line">{formatLandingCopy(valueLine, { price: priceLabel })}</p>
    </LandingSection>
  )
}
