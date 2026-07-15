import { LandingStepMockup } from './LandingPhoneScreens.jsx'

/** Renders a live in-app screen inside a realistic landing phone frame. */
export default function LandingLivePhoneMockup({
  variant = 'journey',
  compact = false,
  size,
}) {
  const resolvedSize = size ?? (compact ? 'sm' : 'lg')
  return (
    <div
      className={`cw-v2-live-phone${compact ? ' cw-v2-live-phone--compact' : ''} cw-v2-live-phone--${resolvedSize}`}
    >
      <LandingStepMockup variant={variant} size={resolvedSize} />
    </div>
  )
}
