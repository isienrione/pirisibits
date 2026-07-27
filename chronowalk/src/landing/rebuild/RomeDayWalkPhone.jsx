import { ProductShotScreen } from '../LandingPhoneScreens.jsx'

/**
 * Real ChronoWalk walking screen — production screenshot, not a mock.
 */
export default function RomeDayWalkPhone({ size = 'lg' }) {
  return (
    <ProductShotScreen
      src="/landing/phone-screens/walk-pantheon.jpg"
      label="ChronoWalk navigation — walking to The Pantheon"
      size={size}
    />
  )
}
