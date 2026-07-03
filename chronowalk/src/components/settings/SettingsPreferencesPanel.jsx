import { useGeoLocation, LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { useAppPreferences } from '../../hooks/useAppPreferences.js'
import { isDebugGeo } from '../../config/env.js'
import { ShellSection, ShellSettingRow } from '../../shell'

function PinIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function SpeakerIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 9v6h4l5 4V5L9 9H5Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v10m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M5 18h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function locationValue(status) {
  if (status === LOCATION_STATUS.GRANTED) return 'Granted'
  if (status === LOCATION_STATUS.DENIED) return 'Denied'
  if (status === LOCATION_STATUS.UNAVAILABLE) return 'Unavailable'
  return 'Waiting'
}

export default function SettingsPreferencesPanel() {
  const { prefs, setPref } = useAppPreferences()
  const debugGeo = isDebugGeo()
  const { locationStatus, retryLocation } = useGeoLocation({
    debugMode: debugGeo,
    target: { lat: 41.8902, lng: 12.4922 },
    geofenceThresholdM: 5000,
  })

  const showRetry =
    !debugGeo &&
    (locationStatus === LOCATION_STATUS.DENIED || locationStatus === LOCATION_STATUS.UNAVAILABLE)

  return (
    <div className="mt-8 space-y-6">
      <ShellSection title="Location">
        <ShellSettingRow
          icon={PinIcon}
          title="Location Access"
          description="While using the app"
          value={debugGeo ? 'Simulated' : locationValue(locationStatus)}
          onPress={showRetry ? retryLocation : undefined}
          actionLabel="Try location again"
        />
      </ShellSection>

      <ShellSection title="Audio">
        <ShellSettingRow
          icon={ClockIcon}
          title="Playback Speed"
          description="Narration pace"
          value={`${prefs.playbackSpeed.toFixed(1)}x`}
        />
        <ShellSettingRow
          icon={SpeakerIcon}
          title="Background Play"
          description="Keep audio when the screen locks"
          checked={prefs.backgroundPlay}
          onToggle={(next) => setPref('backgroundPlay', next)}
        />
        <ShellSettingRow
          icon={DownloadIcon}
          title="Download Over Wi-Fi Only"
          description="Offline packages use Wi-Fi when available"
          checked={prefs.wifiOnlyDownload}
          onToggle={(next) => setPref('wifiOnlyDownload', next)}
        />
      </ShellSection>

      <ShellSection title="Preferences">
        <ShellSettingRow
          icon={SpeakerIcon}
          title="Haptic Feedback"
          description="Subtle taps on arrivals and alerts"
          checked={prefs.hapticFeedback}
          onToggle={(next) => setPref('hapticFeedback', next)}
        />
        <ShellSettingRow
          icon={SpeakerIcon}
          title="Reduce Motion"
          description="Soften animations and threshold motion"
          checked={prefs.reduceMotion}
          onToggle={(next) => setPref('reduceMotion', next)}
        />
      </ShellSection>
    </div>
  )
}
