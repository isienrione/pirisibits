import { isDebugGeo, isDebugMap } from '../../config/env'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { JOURNEY_STATE, LOCATION_STATUS } from '../../hooks/useGeoLocation'
import {
  GlassPanel,
  PageShell,
  SectionHeader,
  StatusBadge,
  Toggle,
  cn,
} from '../ui'
import LocationNotice from '../LocationNotice'

function SettingsGroup({ title, children, className }) {
  return (
    <section className={cn('mt-6', className)}>
      {title ? (
        <p className="mb-3 text-eyebrow uppercase text-terracotta">{title}</p>
      ) : null}
      <GlassPanel className="overflow-hidden px-5 py-1">{children}</GlassPanel>
    </section>
  )
}

function SettingRow({ title, description, children, last = false }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-5 py-4',
        !last && 'border-b border-limestone/45'
      )}
    >
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-sm font-semibold text-deep-slate">{title}</p>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-soft-slate">{description}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
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

  const locationVariant =
    locationStatus === LOCATION_STATUS.GRANTED
      ? journeyState === JOURNEY_STATE.ARRIVAL
        ? 'active'
        : 'walking'
      : 'neutral'

  const locationLabel =
    locationStatus === LOCATION_STATUS.GRANTED
      ? journeyState === JOURNEY_STATE.ARRIVAL
        ? 'At landmark'
        : distance != null
          ? `${Math.round(distance)} m away`
          : 'Tracking'
      : locationStatus === LOCATION_STATUS.DENIED
        ? 'Permission denied'
        : locationStatus === LOCATION_STATUS.UNAVAILABLE
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

      {(locationStatus === LOCATION_STATUS.DENIED ||
        locationStatus === LOCATION_STATUS.UNAVAILABLE) && (
        <GlassPanel className="mt-6 px-4 py-4">
          <LocationNotice status={locationStatus} onRetry={onRetryLocation} />
        </GlassPanel>
      )}

      <SettingsGroup title="Guidance">
        <SettingRow
          title="Location"
          description={
            isDebugGeo()
              ? 'Debug GPS is simulating your position for testing.'
              : 'Required for arrival detection and walking guidance.'
          }
        >
          <StatusBadge variant={locationVariant}>{locationLabel}</StatusBadge>
        </SettingRow>

        <SettingRow
          title="Audio stories"
          description="Ambient tour audio, arrival chimes, and immersive narration."
          last
        >
          <Toggle
            checked={audioEnabled}
            onChange={onAudioEnabledChange}
            label="Toggle audio stories"
          />
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Accessibility">
        <SettingRow
          title="Reduced motion"
          description={
            reducedMotion
              ? 'Your device prefers reduced motion — animations are softened.'
              : 'Full motion is enabled for arrivals and transitions.'
          }
          last
        >
          <StatusBadge variant={reducedMotion ? 'gold' : 'neutral'}>
            {reducedMotion ? 'On' : 'Off'}
          </StatusBadge>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Developer">
        <SettingRow
          title="Debug map overlays"
          description={
            urlDebugActive
              ? 'Active via URL (?debugMap=true or ?debugGeo=true). Clear the query param to disable.'
              : 'Show GPS, geofence, and journey labels on the map.'
          }
          last
        >
          {urlDebugActive ? (
            <StatusBadge variant="gold">URL active</StatusBadge>
          ) : (
            <Toggle
              checked={debugMapEnabled}
              onChange={onDebugMapEnabledChange}
              label="Toggle debug map overlays"
            />
          )}
        </SettingRow>
      </SettingsGroup>
    </PageShell>
  )
}

export default SettingsView
