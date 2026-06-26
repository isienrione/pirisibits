import { isDebugGeo, isDebugMap } from '../../config/env'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { JOURNEY_STATE, LOCATION_STATUS } from '../../hooks/useGeoLocation'
import {
  AudioIcon,
  CompassIcon,
  DeveloperIcon,
  GlassPanel,
  PageShell,
  ProfileIcon,
  SectionHeader,
  StatusBadge,
  Toggle,
  cn,
  typeCaption,
  typeEyebrow,
  typeBodySm,
  typeBodySmMuted,
} from '../ui'
import LocationNotice from '../LocationNotice'

function SettingsGroup({ title, children, className }) {
  return (
    <section className={cn('mt-8', className)}>
      {title ? <p className={cn(typeEyebrow, 'mb-4')}>{title}</p> : null}
      <GlassPanel className="overflow-hidden px-5 py-1">{children}</GlassPanel>
    </section>
  )
}

function SettingRow({ title, description, icon: Icon, children, last = false }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-5 py-5',
        !last && 'border-b border-limestone/45'
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4 pr-2">
        {Icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand/70 text-terracotta">
            <Icon size="sm" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className={cn(typeBodySm, 'font-medium')}>{title}</p>
          {description ? (
            <p className={cn(typeBodySmMuted, 'mt-2')}>{description}</p>
          ) : null}
        </div>
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

      <GlassPanel className="mt-8 flex items-center gap-4 px-5 py-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/12 text-gold">
          <ProfileIcon size="md" />
        </span>
        <div>
          <p className={cn(typeBodySm, 'font-medium')}>Your tour profile</p>
          <p className={cn(typeCaption, 'mt-1')}>Preferences sync on this device</p>
        </div>
      </GlassPanel>

      {(locationStatus === LOCATION_STATUS.DENIED ||
        locationStatus === LOCATION_STATUS.UNAVAILABLE) && (
        <GlassPanel className="mt-6 px-4 py-4">
          <LocationNotice status={locationStatus} onRetry={onRetryLocation} />
        </GlassPanel>
      )}

      <SettingsGroup title="Guidance">
        <SettingRow
          icon={CompassIcon}
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
          icon={AudioIcon}
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
          icon={DeveloperIcon}
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
