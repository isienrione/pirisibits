import { Seam } from '../redesign/ui/index.js'
import { viaSacraNow } from '../redesign/images.js'
import { LANDING_CONTENT } from './landingData.js'

/**
 * Full-bleed bone band · problem + rescue editorial copy.
 * Sits immediately below the cinematic hero (obsidian → bone transition).
 */
export default function LandingEditorialBand() {
  const problem = LANDING_CONTENT.problem
  const rescue = LANDING_CONTENT.rescue

  return (
    <section className="cw-landing-editorial" aria-labelledby="problem-heading">
      <div className="cw-landing-editorial__inner">
        <article className="cw-landing-editorial__chapter cw-landing-editorial__chapter--problem">
          <h2 id="problem-heading" className="cw-landing-editorial__headline">
            {problem.headline}
          </h2>
          <p className="cw-landing-editorial__body">
            {problem.body} {problem.pullquote}
          </p>
        </article>

        <div className="cw-landing-editorial__figure" aria-hidden>
          <img src={viaSacraNow} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <Seam />
        </div>

        <article
          id={rescue.id}
          className="cw-landing-editorial__chapter cw-landing-editorial__chapter--rescue"
          aria-labelledby="rescue-heading"
        >
          <h2 id="rescue-heading" className="cw-landing-editorial__headline">
            {rescue.headline}
          </h2>
          <p className="cw-landing-editorial__body">{rescue.copy}</p>
        </article>
      </div>
    </section>
  )
}
