import { LandingStepMockup } from './LandingPhoneScreens.jsx'

/** Renders a product phone: marketing still by default, or live HTML with mode="live". */
export default function LandingLivePhoneMockup({
  variant = 'journey',
  compact = false,
  size,
  mode,
}) {
  const resolvedSize = size ?? (compact ? 'sm' : 'lg')
  return (
    <div
      className={`cw-v2-live-phone${compact ? ' cw-v2-live-phone--compact' : ''} cw-v2-live-phone--${resolvedSize}`}
    >
      <LandingStepMockup variant={variant} size={resolvedSize} mode={mode} />
    </div>
  )
}
