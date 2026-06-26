import { isDebugGeo, isDebugMap } from '../../config/env'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { JOURNEY_STATE, LOCATION_STATUS } from '../../hooks/useGeoLocation'
import { GlassPanel, PageShell, SectionHeader, cn, focusRing, statusCurrent, statusNeutral } from '../ui'
import LocationNotice from '../LocationNotice'

function SettingRow({ title, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-limestone/50 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-deep-slate">{title}</p>
        {description ? <p className="mt-1 text-sm leading-relaxed text-soft-slate">{description}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onChange(!checked)
      }}
      className={cn(
        'relative inline-flex h-11 min-w-[3.25rem] items-center rounded-full transition-colors',
        focusRing,
        checked ? 'bg-terracotta' : 'bg-limestone',
        disabled && 'cursor-not-allowed opacity-70'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-6 w-6 rounded-full bg-warm-white shadow-sm transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

function SettingsView({
  locationStatus,
  journeyState,
  distance,
  audioEnabled,
  onAudioEnabledChange,
  debugMapEnabled,
  onDebugMapEnabledChange,
  onRetryLocation,
}) {
  const reducedMotion = useReducedMotion()
  const urlDebugActive = isDebugMap() || isDebugGeo()

  const locationLabel =
    locationStatus === 'granted'
      ? journeyState === JOURNEY_STATE.ARRIVAL
        ? 'At landmark'
        : distance != null
          ? `${Math.round(distance)} m to stop`
          : 'Tracking'
      : locationStatus === 'denied'
        ? 'Permission denied'
        : locationStatus === 'unavailable'
          ? 'Unavailable'
          : 'Waiting for GPS'

  return (
    <PageShell>
      <SectionHeader
        align="left"
        eyebrow="Preferences"
        title="Settings"
        subtitle="Tune how ChronoWalk guides you through Rome."
      />

      <GlassPanel className="mt-6 px-5">
        {(locationStatus === LOCATION_STATUS.DENIED ||
          locationStatus === LOCATION_STATUS.UNAVAILABLE) && (
          <div className="border-b border-limestone/50 pb-4 pt-1">
            <LocationNotice status={locationStatus} onRetry={onRetryLocation} />
          </div>
        )}

        <SettingRow
          title="Location"
          description={
            isDebugGeo()
              ? 'Debug GPS is simulating your position for testing.'
              : 'Required for arrival detection and walking guidance.'
          }
        >
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', statusNeutral)}>
            {locationLabel}
          </span>
        </SettingRow>

        <SettingRow
          title="Audio stories"
          description="Ambient tour audio, arrival chimes, and immersive narration."
        >
          <Toggle
            checked={audioEnabled}
            onChange={onAudioEnabledChange}
            label="Toggle audio stories"
          />
        </SettingRow>

        <SettingRow
          title="Reduced motion"
          description={
            reducedMotion
              ? 'Your device prefers reduced motion — animations are softened.'
              : 'Full motion is enabled for arrivals and transitions.'
          }
        >
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold',
              reducedMotion ? statusCurrent : statusNeutral
            )}
          >
            {reducedMotion ? 'On' : 'Off'}
          </span>
        </SettingRow>

        <SettingRow
          title="Debug map overlays"
          description={
            urlDebugActive
              ? 'Active via URL (?debugMap=true or ?debugGeo=true). Clear the query param to disable.'
              : 'Show GPS, geofence, and journey labels on the map.'
          }
        >
          <Toggle
            checked={debugMapEnabled || urlDebugActive}
            onChange={onDebugMapEnabledChange}
            label="Toggle debug map overlays"
            disabled={urlDebugActive}
          />
        </SettingRow>
      </GlassPanel>
    </PageShell>
  )
}

export default SettingsView
