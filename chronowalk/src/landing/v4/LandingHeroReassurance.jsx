import { Link } from 'react-router-dom'
import { LANDING_CONTENT } from '../landingData.js'
import { LANDING_ANALYTICS_SECTIONS } from '../landingAnalytics.js'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Compact factual reassurance strip directly under the hero.
 * Mostly noninteractive; the free Pantheon line may link to /free-pantheon
 * (or call onPreview when no href is configured).
 */
export default function LandingHeroReassurance({
  onPreview,
  section = LANDING_CONTENT.heroReassurance,
} = {}) {
  const t = useT()
  const items = section?.items ?? []
  if (!items.length) return null

  return (
    <section
      id={section.id}
      className="cw-v4-reassure"
      aria-label={t('landing.reassurance.aria')}
    >
      <div className="cw-v4-wrap">
        <ul className="cw-v4-reassure__list">
          {items.map((item) => (
            <li key={item.id} className="cw-v4-reassure__item">
              <span className="cw-v4-reassure__mark" aria-hidden="true" />
              <div className="cw-v4-reassure__copy">
                <p className="cw-v4-reassure__label">{item.label}</p>
                <p className="cw-v4-reassure__support">
                  {item.supportLinkText ? (
                    <>
                      {item.supportBefore ?? ''}
                      {item.supportLinkHref ? (
                        <Link to={item.supportLinkHref} className="cw-v4-reassure__link">
                          {item.supportLinkText}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="cw-v4-reassure__link"
                          onClick={() =>
                            onPreview?.(LANDING_ANALYTICS_SECTIONS.HERO_REASSURANCE)
                          }
                        >
                          {item.supportLinkText}
                        </button>
                      )}
                    </>
                  ) : (
                    item.support
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
