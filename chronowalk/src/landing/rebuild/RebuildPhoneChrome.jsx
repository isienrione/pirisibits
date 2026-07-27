import LandingPhoneFrame from '../LandingPhoneFrame.jsx'

/**
 * iPhone frame styles for rebuild landing product mockups.
 * Mirrors ChronoWalkLanding.css phone chrome so we don't import the whole legacy sheet.
 */
export function RebuildPhoneChrome({ label, size = 'xl', children }) {
  return (
    <LandingPhoneFrame label={label} size={size}>
      {children}
    </LandingPhoneFrame>
  )
}

export default RebuildPhoneChrome
