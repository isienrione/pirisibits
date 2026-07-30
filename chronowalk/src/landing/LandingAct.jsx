import GoldSeam from './GoldSeam.jsx'

/**
 * Editorial act wrapper (Prompt 17).
 * Region landmark + quiet marker; labels are not headings (H1 stays in hero).
 * Act visibility is not tracked - no clean existing analytics event for acts.
 *
 * @param {object} props
 * @param {string} props.id - `#act-promise` | `#act-experience` | `#act-decision`
 * @param {string} props.label - full aria label, e.g. "Act I - The Promise"
 * @param {string} props.index - Roman numeral ("I")
 * @param {string} props.name - short title ("The Promise")
 * @param {boolean} [props.transition] - Gold Seam above the marker (acts II / III)
 * @param {import('react').ReactNode} props.children
 */
export default function LandingAct({
  id,
  label,
  index,
  name,
  transition = false,
  className = '',
  children,
}) {
  return (
    <div
      id={id}
      className={`cw-landing-act cw-landing-act--${id}${className ? ` ${className}` : ''}`.trim()}
      role="region"
      aria-label={label}
      data-landing-act={id}
    >
      {transition ? <GoldSeam variant="act" /> : null}

      <p className="cw-landing-act__marker" aria-hidden="true">
        <span className="cw-landing-act__index">Act {index}</span>
        <span className="cw-landing-act__seam" />
        <span className="cw-landing-act__name">{name}</span>
      </p>

      {children}
    </div>
  )
}
