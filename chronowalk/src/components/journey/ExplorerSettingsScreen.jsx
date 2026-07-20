import {
  LAUNCH_SETTINGS_COPY,
  SETTINGS_LINKS,
  SETTINGS_SECTION_LABELS,
  SETTINGS_SECTIONS,
} from '../../content/launchSettings'
import LaunchOfflineSettings from './LaunchOfflineSettings'
import { Button, Toggle, cn } from '../ui'

function SettingsSection({ title, children, className }) {
  return (
    <section className={cn('mt-10 first:mt-8', className)}>
      <h2 className="text-eyebrow uppercase text-bronze">{title}</h2>
      <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-parchment/80 bg-ivory shadow-plaque">
        {children}
      </div>
    </section>
  )
}

function SettingRow({ title, description, children, last = false }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-5 px-5 py-4 sm:px-6',
        !last && 'border-b border-parchment/60'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-deep-slate">{title}</p>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-soft-slate">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function LinkRow({ title, description, href, last = false }) {
  return (
    <a
      href={href}
      className={cn(
        'flex items-center justify-between gap-5 px-5 py-4 sm:px-6 transition hover:bg-parchment/25',
        !last && 'border-b border-parchment/60'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-deep-slate">{title}</p>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-soft-slate">{description}</p>
        ) : null}
      </div>
      <span className="text-sm text-bronze" aria-hidden="true">
        →
      </span>
    </a>
  )
}

function ValueBadge({ children }) {
  return (
    <span className="rounded-full border border-parchment bg-parchment/50 px-3 py-1 text-sm font-medium text-deep-slate">
      {children}
    </span>
  )
}

export default function ExplorerSettingsScreen({
  copy = LAUNCH_SETTINGS_COPY,
  audioEnabled,
  playbackSpeedLabel,
  notificationsEnabled,
  hapticsEnabled,
  reducedMotion,
  offlineTour,
  onAudioEnabledChange,
  onPlaybackSpeedChange,
  onNotificationsChange,
  onHapticsChange,
  onBack,
}) {
  return (
    <div
      className="min-h-dvh bg-ivory text-deep-slate paper-texture"
      data-testid="explorer-settings-screen"
    >
      <div className="mx-auto w-full max-w-2xl px-6 pb-safe pt-safe sm:px-8">
        <header>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 min-h-11 text-sm font-medium text-soft-slate transition hover:text-deep-slate"
          >
            Back
          </button>

          <p className="mt-8 text-eyebrow uppercase text-bronze">Settings</p>
          <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-soft-slate sm:text-lg">
            {copy.subtitle}
          </p>
        </header>

        <SettingsSection title={SETTINGS_SECTION_LABELS[SETTINGS_SECTIONS.TOUR]}>
          <SettingRow title={copy.tourName} description={copy.tourDescription} last={false} />
          <SettingRow
            title="Location guidance"
            description={copy.locationGuidance}
            last
          >
            <ValueBadge>While walking</ValueBadge>
          </SettingRow>
        </SettingsSection>

        <SettingsSection title={SETTINGS_SECTION_LABELS[SETTINGS_SECTIONS.AUDIO]}>
          <SettingRow
            title="Story audio"
            description="Immersive narration at each landmark."
          >
            <Toggle
              checked={audioEnabled}
              onChange={onAudioEnabledChange}
              label="Toggle story audio"
            />
          </SettingRow>
          <SettingRow
            title="Playback speed"
            description="Default speed for story replay."
            last
          >
            <Button variant="secondary" size="md" onClick={onPlaybackSpeedChange}>
              {playbackSpeedLabel}
            </Button>
          </SettingRow>
        </SettingsSection>

        <SettingsSection title={SETTINGS_SECTION_LABELS[SETTINGS_SECTIONS.OFFLINE]}>
          <div className="px-5 py-5 sm:px-6">
            <p className="text-sm leading-relaxed text-soft-slate">{copy.offlineDescription}</p>
            <LaunchOfflineSettings tour={offlineTour} className="mt-5" />
          </div>
        </SettingsSection>

        <SettingsSection title={SETTINGS_SECTION_LABELS[SETTINGS_SECTIONS.NOTIFICATIONS]}>
          <SettingRow
            title="Journey updates"
            description="Gentle reminders when you approach the next landmark."
            last
          >
            <Toggle
              checked={notificationsEnabled}
              onChange={onNotificationsChange}
              label="Toggle journey notifications"
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title={SETTINGS_SECTION_LABELS[SETTINGS_SECTIONS.APPEARANCE]}>
          <SettingRow
            title="Motion"
            description={
              reducedMotion
                ? 'Your device prefers reduced motion.'
                : 'Full motion for arrivals and transitions.'
            }
          >
            <ValueBadge>{reducedMotion ? 'Reduced' : 'Standard'}</ValueBadge>
          </SettingRow>
          <SettingRow
            title="Interface"
            description={copy.appearanceInterfaceDetail}
            last={false}
          >
            <ValueBadge>{copy.appearanceInterface}</ValueBadge>
          </SettingRow>
          <SettingRow
            title="Haptic feedback"
            description="Subtle taps when you arrive and capture moments."
            last
          >
            <Toggle
              checked={hapticsEnabled}
              onChange={onHapticsChange}
              label="Toggle haptic feedback"
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title={SETTINGS_SECTION_LABELS[SETTINGS_SECTIONS.HELP]}>
          <LinkRow
            title="Help center"
            description="Guides for walking, audio, and offline use."
            href={SETTINGS_LINKS.help}
          />
          <LinkRow
            title="Contact support"
            description="We read every note."
            href={SETTINGS_LINKS.support}
            last
          />
        </SettingsSection>

        <SettingsSection title={SETTINGS_SECTION_LABELS[SETTINGS_SECTIONS.PRIVACY]}>
          <div className="px-5 py-5 sm:px-6">
            <p className="text-sm leading-relaxed text-soft-slate">{copy.privacySummary}</p>
            <a
              href={SETTINGS_LINKS.privacy}
              className="mt-4 inline-flex text-sm font-medium text-bronze underline decoration-bronze/30 underline-offset-4 transition hover:text-bronze-dark"
            >
              Privacy policy
            </a>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}
