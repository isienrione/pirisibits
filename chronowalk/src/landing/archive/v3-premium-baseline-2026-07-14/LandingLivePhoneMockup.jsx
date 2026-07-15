import { LandingStepMockup } from './LandingPhoneScreens.jsx'

/** Renders a live in-app screen inside the landing phone frame. */
export default function LandingLivePhoneMockup({ variant = 'journey', compact = false }) {
  return (
    <div className={`cw-v2-live-phone${compact ? ' cw-v2-live-phone--compact' : ''}`}>
      <LandingStepMockup variant={variant} />
    </div>
  )
}
