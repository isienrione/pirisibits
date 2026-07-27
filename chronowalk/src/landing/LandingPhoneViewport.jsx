import LandingPhoneFrame from './LandingPhoneFrame.jsx'

/**
 * Fits a full 390×844 app artboard inside the phone frame.
 * Content is authored at phone pixels, then scaled to the *screen* width
 * (inner bezel), not the outer titanium shell.
 *
 * @param {{
 *   label?: string
 *   size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
 *   interactive?: boolean
 *   className?: string
 *   children?: import('react').ReactNode
 * }} props
 */
export default function LandingPhoneViewport({
  label,
  size = 'md',
  interactive = false,
  className = '',
  children,
}) {
  return (
    <LandingPhoneFrame label={label} size={size} className={className}>
      <div className="cw-landing-phone__stage">
        <div
          className={`cw-landing-phone__artboard${interactive ? ' cw-landing-phone__artboard--interactive' : ''}`}
        >
          {children}
        </div>
      </div>
    </LandingPhoneFrame>
  )
}
