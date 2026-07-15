/**
 * Act wrapper for the editorial landing architecture.
 * Landmark region for screen readers; no visual chrome beyond optional class.
 */
export default function LandingAct({ label, children, className = '' }) {
  return (
    <div
      className={`cw-landing-act ${className}`.trim()}
      role="region"
      aria-label={label}
      data-landing-act={label}
    >
      {children}
    </div>
  )
}
