import { LANDING_CONTENT } from '../landingData.js'
import { LandingDemoChapterPhone } from '../v4/LandingProductPhoneStage.jsx'

/** Representative beat per chapter so each phone frame shows a clear product state. */
const CHAPTER_BEATS = Object.freeze({
  choose: 1,
  arrive: 2,
  listen: 0,
  walk: 0,
})

function withoutDashes(text) {
  return String(text ?? '').replace(/[—–]/g, '-')
}

/**
 * Ads-friendly product walkthrough: one screen + copy block per chapter,
 * scrolled normally (no sticky scrub / jack scroll).
 */
export default function HowItWorksSequentialDemo() {
  const section = LANDING_CONTENT['product-demo']
  const chapters = section?.chapters ?? []

  return (
    <div className="cw-acq-seq" data-testid="how-it-works-sequential-demo">
      {chapters.map((chapter, index) => {
        const flip = index % 2 === 1
        return (
          <section
            key={chapter.id}
            className={`cw-acq-seq__row${flip ? ' cw-acq-seq__row--flip' : ''}`}
            aria-labelledby={`how-chapter-${chapter.id}`}
          >
            <div className="cw-acq-seq__copy">
              <p className="cw-acq-seq__index">
                {String(index + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
              </p>
              <h3 id={`how-chapter-${chapter.id}`} className="cw-acq-seq__title">
                {withoutDashes(chapter.title)}
              </h3>
              <p className="cw-acq-seq__body">{withoutDashes(chapter.body)}</p>
              {chapter.beats?.length ? (
                <ul className="cw-acq-seq__beats" aria-label={`${chapter.title} highlights`}>
                  {chapter.beats.map((beat) => (
                    <li key={beat}>{withoutDashes(beat)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="cw-acq-seq__phone">
              <LandingDemoChapterPhone
                chapterId={chapter.id}
                beat={CHAPTER_BEATS[chapter.id] ?? 0}
                active={chapter.id === 'arrive'}
                label={`ChronoWalk: ${chapter.title}`}
              />
            </div>
          </section>
        )
      })}
    </div>
  )
}
