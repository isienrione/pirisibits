import { useGeoLocation, LOCATION_STATUS } from '../../hooks/useGeoLocation.js'
import { useAppPreferences } from '../../hooks/useAppPreferences.js'
import { isDebugGeo } from '../../config/env.js'
import { ShellSection, ShellSettingRow } from '../../shell'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { SUPPORTED_LOCALES } from '../../i18n/locales.js'

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

function GlobeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 12h16M12 4c2.5 2.8 3.8 5.5 3.8 8s-1.3 5.2-3.8 8c-2.5-2.8-3.8-5.5-3.8-8s1.3-5.2 3.8-8Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
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
  const { locale, setLocale, t, labels } = useI18n()
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
      <ShellSection title={t('settings.section.language')}>
        <div className="flex items-center justify-between gap-4 px-1 py-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink900">
              <GlobeIcon />
              {t('language.label')}
            </p>
            <p className="mt-1 text-sm text-soft-slate">{t('language.sub')}</p>
          </div>
          <div
            className="inline-flex shrink-0 rounded-lg bg-parchment/70 p-0.5"
            role="group"
            aria-label={t('language.label')}
            data-testid="settings-language"
          >
            {SUPPORTED_LOCALES.map((code) => {
              const active = locale === code
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLocale(code)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                    active ? 'bg-ivory text-ink900 shadow-sm' : 'text-soft-slate'
                  }`}
                >
                  {code === 'en' ? '🇬🇧' : '🇪🇸'} {labels[code] ?? code}
                </button>
              )
            })}
          </div>
        </div>
      </ShellSection>

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
