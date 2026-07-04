import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HEART_OF_ANCIENT_ROME_TOUR } from '../data/heart-of-ancient-rome-tour'
import { LOCATION_STATUS, useGeoLocation } from '../hooks/useGeoLocation'
import { useJourney } from '../hooks/useJourney'
import LocationNotice from '../components/LocationNotice'
import OfflineDownloadPanel from '../components/offline/OfflineDownloadPanel'
import {
  GlassPanel,
  PageShell,
  StatusBadge,
  cn,
  metaLabel,
} from '../components/ui'
import {
  AUDIO_SPEED_OPTIONS,
  TEXT_SIZE_OPTIONS,
  applyTextSizePreference,
  readAudioSpeed,
  readTextSize,
  writeAudioSpeed,
  writeTextSize,
} from '../utils/appPreferences'
import { ROUTES } from '../routes/paths'

function SettingsGroup({ children, className }) {
  return (
    <GlassPanel className={cn('overflow-hidden px-4 py-1', className)}>{children}</GlassPanel>
  )
}

function SettingsRow({ title, description, children, last = false, action }) {
  return (
    <div className={cn('py-4', !last && 'border-b border-parchment/50')}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-deep-slate">{title}</p>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-soft-slate">{description}</p>
          ) : null}
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

function SegmentedControl({ options, value, onChange, formatLabel = (v) => String(v) }) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((option) => {
        const selected = option === value
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            className={cn(
              'min-h-11 rounded-full border px-4 py-2.5 text-sm font-semibold motion-safe:transition-colors',
              selected
                ? 'border-bronze/40 bg-bronze/10 text-deep-slate'
                : 'border-parchment/80 bg-ivory text-soft-slate hover:border-bronze/25'
            )}
            onClick={() => onChange(option)}
          >
            {formatLabel(option)}
          </button>
        )
      })}
    </div>
  )
}

function PlaceholderBadge() {
  return (
    <span className={cn(metaLabel, 'rounded-full border border-parchment/80 px-2.5 py-1 text-soft-slate')}>
      Coming soon
    </span>
  )
}

function locationStatusLabel(status) {
  switch (status) {
    case LOCATION_STATUS.GRANTED:
      return 'Enabled'
    case LOCATION_STATUS.DENIED:
      return 'Denied'
    case LOCATION_STATUS.UNAVAILABLE:
      return 'Unavailable'
    case LOCATION_STATUS.WAITING:
      return 'Waiting'
    default:
      return 'Unknown'
  }
}

function locationStatusVariant(status) {
  if (status === LOCATION_STATUS.GRANTED) return 'walking'
  if (status === LOCATION_STATUS.DENIED || status === LOCATION_STATUS.UNAVAILABLE) return 'neutral'
  return 'neutral'
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { currentStop } = useJourney()
  const [audioSpeed, setAudioSpeed] = useState(() => readAudioSpeed())
  const [textSize, setTextSize] = useState(() => readTextSize())

  const { locationStatus, retryLocation } = useGeoLocation({
    target: currentStop?.coords,
    geofenceThresholdM: currentStop?.radiusM ?? 30,
  })

  useEffect(() => {
    applyTextSizePreference(textSize)
  }, [textSize])

  const handleAudioSpeed = useCallback((speed) => {
    writeAudioSpeed(speed)
    setAudioSpeed(speed)
  }, [])

  const handleTextSize = useCallback((size) => {
    writeTextSize(size)
    setTextSize(size)
  }, [])

  return (
    <div className="min-h-dvh overflow-x-hidden bg-ivory">
      <PageShell className="bg-transparent pb-8">
        <button
          type="button"
          className="mb-4 inline-flex min-h-11 items-center text-sm font-medium text-soft-slate hover:text-deep-slate"
          onClick={() => navigate(ROUTES.journey)}
        >
          ← Back
        </button>

        <header>
          <p className="text-eyebrow uppercase text-bronze">Preferences</p>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-deep-slate">
            Settings
          </h1>
        </header>

        {(locationStatus === LOCATION_STATUS.DENIED ||
          locationStatus === LOCATION_STATUS.UNAVAILABLE) && (
          <div className="mt-6">
            <LocationNotice status={locationStatus} onRetry={retryLocation} compact />
          </div>
        )}

        <div className="mt-8 space-y-6">
          <SettingsGroup>
            <SettingsRow
              title="Location status"
              description="Used only while your tour is active to guide you between landmarks."
            >
              <StatusBadge variant={locationStatusVariant(locationStatus)}>
                {locationStatusLabel(locationStatus)}
              </StatusBadge>
            </SettingsRow>

            <SettingsRow
              title="Download for offline"
              description="Save stories, audio, and imagery for use without a connection."
              last
              action={<OfflineDownloadPanel tour={HEART_OF_ANCIENT_ROME_TOUR} compact />}
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow
              title="Audio speed"
              description="Applies to story playback on this device."
              action={
                <SegmentedControl
                  options={AUDIO_SPEED_OPTIONS}
                  value={audioSpeed}
                  onChange={handleAudioSpeed}
                  formatLabel={(speed) => `${speed}×`}
                />
              }
            />

            <SettingsRow
              title="Text size"
              description="Adjusts reading size across the app on this device."
              last
              action={
                <SegmentedControl
                  options={Object.keys(TEXT_SIZE_OPTIONS)}
                  value={textSize}
                  onChange={handleTextSize}
                  formatLabel={(size) => TEXT_SIZE_OPTIONS[size]?.label ?? size}
                />
              }
            />
          </SettingsGroup>

          <SettingsGroup>
            <SettingsRow
              title="Restore purchase"
              description="Re-download tours you have already bought on this device."
            >
              <PlaceholderBadge />
            </SettingsRow>

            <SettingsRow title="Privacy" description="How ChronoWalk handles location and on-device data.">
              <PlaceholderBadge />
            </SettingsRow>

            <SettingsRow
              title="Help"
              description="Questions about walking the tour or using reconstructions."
              last
            >
              <PlaceholderBadge />
            </SettingsRow>
          </SettingsGroup>
        </div>
      </PageShell>
    </div>
  )
}
