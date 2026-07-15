import { LANDING_CONTENT } from './landingData.js'

export default function LandingProblemSection() {
  const { id, headline, body, pullquote } = LANDING_CONTENT.problem

  return (
    <section id={id} className="cw-doc-section cw-doc-section--obsidian cw-doc-problem" aria-labelledby={`${id}-heading`}>
      <div className="cw-landing-wrap cw-doc-section__inner cw-doc-section__inner--theater">
        <div className="cw-doc-problem__layout">
          <div className="cw-doc-problem__main">
            <h2 id={`${id}-heading`} className="cw-doc-problem__headline">
              {headline}
            </h2>
            <p className="cw-doc-problem__body">{body}</p>
          </div>
          <blockquote className="cw-doc-problem__pullquote" cite="">
            {pullquote}
          </blockquote>
        </div>
      </div>
    </section>
  )
}
