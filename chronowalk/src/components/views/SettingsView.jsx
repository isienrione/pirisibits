import { isDebugGeo, isDebugMap } from '../../config/env'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { JOURNEY_STATE, LOCATION_STATUS } from '../../hooks/useGeoLocation'
import {
  GlassPanel,
  PageShell,
  StatusBadge,
  Toggle,
  cn,
} from '../ui'
import LocationNotice from '../LocationNotice'
import OfflineDownloadPanel from '../offline/OfflineDownloadPanel'
import PwaInstallPanel from '../PwaInstallPanel'

function PinIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="11" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function SpeakerIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M11 6 7 9H4v6h3l4 3V6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MotionIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function DebugIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m10 10-2 2 2 2m4-4 2 2-2 2M8 4 4 8l2 8 8 2 4-4-2-8-8-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsGroup({ title, children, className }) {
  return (
    <section className={cn('mt-8', className)}>
      {title ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-soft-slate">
          {title}
        </p>
      ) : null}
      <GlassPanel className="overflow-hidden px-5 py-1">{children}</GlassPanel>
    </section>
  )
}

function SettingRow({ title, description, icon: Icon, children, last = false }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 py-4',
        !last && 'border-b border-parchment/50'
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-parchment/70 bg-parchment/35 text-bronze">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-sm font-semibold text-deep-slate">{title}</p>
          {description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-soft-slate">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end">{children}</div>
    </div>
  )
}

function SettingsView({
  tour,
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
  const pwaInstall = usePwaInstall()
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
      <h1 className="font-display text-4xl font-semibold leading-tight text-deep-slate">Settings</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-soft-slate">
        Tune how ChronoWalk guides you through Rome.
      </p>

      {(locationStatus === LOCATION_STATUS.DENIED ||
        locationStatus === LOCATION_STATUS.UNAVAILABLE) && (
        <GlassPanel className="mt-6 px-4 py-4">
          <LocationNotice status={locationStatus} onRetry={onRetryLocation} />
        </GlassPanel>
      )}

      <SettingsGroup title="Location">
        <SettingRow
          title="GPS guidance"
          description={
            isDebugGeo()
              ? 'Debug GPS is simulating your position for testing.'
              : 'Required for arrival detection and walking guidance.'
          }
          icon={PinIcon}
          last
        >
          <StatusBadge variant={locationVariant}>{locationLabel}</StatusBadge>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup title="Audio">
        <SettingRow
          title="Audio stories"
          description="Ambient tour audio, arrival chimes, and immersive narration."
          icon={SpeakerIcon}
          last
        >
          <Toggle
            checked={audioEnabled}
            onChange={onAudioEnabledChange}
            label="Toggle audio stories"
          />
        </SettingRow>
      </SettingsGroup>

      <section className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-soft-slate">
          Offline
        </p>
        {tour ? <OfflineDownloadPanel tour={tour} /> : null}
      </section>

      {pwaInstall.showInstallOption || pwaInstall.installed ? (
        <section className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-soft-slate">
            Preferences
          </p>
          <PwaInstallPanel
            installed={pwaInstall.installed}
            canPromptInstall={pwaInstall.canPromptInstall}
            showIosInstructions={pwaInstall.showIosInstructions}
            showInstallOption={pwaInstall.showInstallOption}
            onInstall={() => void pwaInstall.promptInstall()}
          />
        </section>
      ) : null}

      <SettingsGroup title="Accessibility">
        <SettingRow
          title="Reduced motion"
          description={
            reducedMotion
              ? 'Your device prefers reduced motion — animations are softened.'
              : 'Full motion is enabled for arrivals and transitions.'
          }
          icon={MotionIcon}
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
          icon={DebugIcon}
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
