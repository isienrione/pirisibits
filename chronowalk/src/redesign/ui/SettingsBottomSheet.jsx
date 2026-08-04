import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { T, F } from '../tokens.js'
import {
  useAppPreferences,
  SETTINGS_PLAYBACK_SPEEDS,
  TEXT_SIZE_OPTIONS,
} from '../../hooks/useAppPreferences.js'
import { useOfflineAudio } from '../../hooks/useOfflineAudio.js'
import { formatPlaybackSpeed } from '../../utils/appPreferences.js'
import { SETTINGS_LINKS } from '../../content/launchSettings.js'
import { WALKING_UI_REVISION } from '../../content/walkingUiRevision.js'
import { pwaController } from '../../pwa/pwaController.js'
import { useOptionalFamilyWalk } from '../context/FamilyWalkContext.jsx'
import { isBundleSku } from '../../lib/launchSkus.js'
import { readAccessEntitlement } from '../../lib/accessSession.js'
import { bundleMetaForProductId } from '../../lib/familyWalk.js'
import {
  beginChooseRoutePath,
} from '../beginFlowParams.js'
import {
  readPurchasedTier,
  shouldShowPaceModePicker,
} from '../../lib/pendingPurchase.js'
import AnalyticsPreferencesControl from '../../components/analytics/AnalyticsPreferencesControl.jsx'
import HomeScreenInstallOption from './HomeScreenInstallOption.jsx'
import { usePwaInstall } from '../../hooks/usePwaInstall.js'

function Hairline() {
  return <div style={{ height: 1, background: `${T.muted}28` }} aria-hidden="true" />
}

function Row({ label, right }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 0',
      }}
    >
      <p style={{ margin: 0, fontSize: 17, color: T.ink, lineHeight: 1.3, fontFamily: F.body }}>{label}</p>
      {right}
    </div>
  )
}

function Segmented({ options, value, onChange, formatLabel = (v) => String(v) }) {
  return (
    <div style={{ display: 'flex', background: `${T.muted}22`, borderRadius: 8, padding: 2, gap: 2, flexShrink: 0 }}>
      {options.map((option) => {
        const active = value === option
        return (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            style={{
              padding: '5px 10px',
              borderRadius: 6,
              fontSize: 12,
              fontFamily: F.body,
              background: active ? T.warmWhite : 'transparent',
              color: active ? T.ink : T.muted,
              border: 'none',
              cursor: 'pointer',
              minWidth: 40,
            }}
          >
            {formatLabel(option)}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ on, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? '#5B5249' : `${T.muted}38`,
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 250ms',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: T.warmWhite,
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'left 250ms',
        }}
      />
    </button>
  )
}

function ActionRow({ label, onClick, detail, subtitle, testId }) {
  return (
    <>
      <button
        type="button"
        data-testid={testId}
        onClick={onClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          minHeight: 44,
        }}
      >
        <span style={{ display: 'grid', gap: 2 }}>
          <span style={{ fontSize: 17, color: T.ink, fontFamily: F.body }}>{label}</span>
          {subtitle ? (
            <span style={{ fontSize: 13, color: T.muted, fontFamily: F.body, lineHeight: 1.35 }}>
              {subtitle}
            </span>
          ) : null}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.muted, fontSize: 13, fontFamily: F.body }}>
          {detail ? <span>{detail}</span> : null}
          <ChevronRight size={16} aria-hidden />
        </span>
      </button>
      <Hairline />
    </>
  )
}

const TEXT_SIZE_LABELS = {
  sm: 'S',
  md: 'M',
  lg: 'L',
}

export default function SettingsBottomSheet({ open, onClose }) {
  const navigate = useNavigate()
  const { prefs, setPref } = useAppPreferences()
  const offline = useOfflineAudio()
  const family = useOptionalFamilyWalk()
  const entitlement = readAccessEntitlement()
  const purchasedProductId =
    family?.purchasedProductId ||
    family?.bundle?.purchasedProductId ||
    entitlement?.purchasedProductId ||
    null
  const showWalkTogether =
    Boolean(family?.hasBundleAccess) || isBundleSku(purchasedProductId)
  const showChangeRoute = shouldShowPaceModePicker(readPurchasedTier())
  const walkMeta = bundleMetaForProductId(purchasedProductId)
  const walkSubtitle =
    family?.isOrganizer || entitlement?.role === 'owner'
      ? 'Invite people and manage your shared tour'
      : family?.isMember || entitlement?.role === 'member'
        ? 'View your shared tour'
        : walkMeta
          ? 'Invite people and manage your shared tour'
          : 'Manage your shared tour'

  const { installed, canPromptInstall, showIosInstructions, promptInstall } = usePwaInstall()

  if (!open) return null

  const offlineDetail = offline.isReady
    ? 'Ready'
    : offline.isDownloading
      ? `${Math.round(offline.progress?.percent ?? 0)}%`
      : null

  const handleDownload = () => {
    if (offline.isReady || offline.isDownloading) return
    void offline.startDownload()
  }

  const handleRestore = () => {
    onClose()
    navigate('/access')
  }

  const handleWalkTogether = () => {
    onClose()
    navigate('/walk-together')
  }

  const handleChangeRoute = () => {
    onClose()
    navigate(beginChooseRoutePath())
  }

  const handleHelp = () => {
    window.open(SETTINGS_LINKS.help, '_blank', 'noopener,noreferrer')
  }

  const handleAbout = () => {
    onClose()
    navigate('/credits')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80 }} role="presentation">
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(11,11,13,0.45)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="cw-grain"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: 'min(88dvh, 640px)',
          background: T.bone,
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(11,11,13,0.28)',
          animation: 'slideUp 320ms cubic-bezier(0.32,0.72,0,1)',
          fontFamily: F.body,
        }}
      >
        <div style={{ paddingTop: 12, paddingBottom: 8, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: `${T.muted}45` }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px 8px',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontFamily: F.display, fontSize: 22, color: T.ink, fontWeight: 300 }}>Settings</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.body }}
          >
            Done
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            scrollbarWidth: 'none',
            padding: '0 24px',
          }}
        >
          <Hairline />
          <Row
            label="Audio speed"
            right={
              <Segmented
                options={SETTINGS_PLAYBACK_SPEEDS}
                value={prefs.playbackSpeed}
                onChange={(speed) => setPref('playbackSpeed', speed)}
                formatLabel={formatPlaybackSpeed}
              />
            }
          />
          <Hairline />
          <Row
            label="Read instead of listen"
            right={
              <Toggle
                on={prefs.preferTranscript}
                onToggle={() => setPref('preferTranscript', !prefs.preferTranscript)}
                label="Read instead of listen"
              />
            }
          />
          <Hairline />
          <Row
            label="Text size"
            right={
              <Segmented
                options={TEXT_SIZE_OPTIONS}
                value={prefs.textSize}
                onChange={(size) => setPref('textSize', size)}
                formatLabel={(size) => TEXT_SIZE_LABELS[size] ?? size}
              />
            }
          />
          <Hairline />

          {showChangeRoute ? (
            <ActionRow
              label="Change or customize route"
              subtitle="Switch Roma Eterna, a shorter walk, or pick your own stops"
              testId="settings-change-route"
              onClick={handleChangeRoute}
            />
          ) : null}

          {showWalkTogether ? (
            <ActionRow
              label="Walk together"
              subtitle={walkSubtitle}
              detail={walkMeta?.label ?? null}
              testId="settings-walk-together"
              onClick={handleWalkTogether}
            />
          ) : null}

          <div
            style={{
              borderRadius: 12,
              border: `1.5px solid ${T.ember}55`,
              background: `${T.ember}0a`,
              padding: '0 12px',
              marginBottom: 10,
            }}
            data-testid="settings-offline-option"
          >
            <p style={{ margin: '10px 0 2px', fontSize: 10, color: T.ember, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
              Recommended
            </p>
            <ActionRow
              label="Download for offline"
              subtitle="Keep stories and maps ready when signal drops"
              detail={offlineDetail}
              onClick={handleDownload}
            />
          </div>
          <div
            style={{
              borderRadius: 12,
              border: `1.5px solid ${T.ember}55`,
              background: `${T.ember}0a`,
              padding: '10px 12px 4px',
              marginBottom: 8,
            }}
            data-testid="settings-a2hs-option"
          >
            <p style={{ margin: '0 0 4px', fontSize: 10, color: T.ember, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>
              Recommended
            </p>
            <HomeScreenInstallOption
              installed={installed}
              canPromptInstall={canPromptInstall}
              showIosInstructions={showIosInstructions}
              onInstall={promptInstall}
              tone="light"
              embedded
            />
          </div>
          <ActionRow label="Restore purchase" onClick={handleRestore} />
          <ActionRow label="Help" onClick={handleHelp} />
          <ActionRow label="About" onClick={handleAbout} />
          <AnalyticsPreferencesControl variant="settings" />
          <Hairline />
          <ActionRow
            label="Refresh app"
            detail="Get the latest version"
            onClick={() => void pwaController.checkForAppUpdate()}
          />

          {offline.error ? (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{offline.error}</p>
          ) : null}

          <p
            style={{
              margin: '20px 0 24px',
              fontSize: 12,
              color: `${T.muted}cc`,
              textAlign: 'center',
              lineHeight: 1.5,
              letterSpacing: '0.02em',
            }}
          >
            ChronoWalk · Rome · made to disappear.
            {typeof globalThis.__APP_BUILD_ID__ !== 'undefined' ? (
              <>
                <br />
                Build {globalThis.__APP_BUILD_ID__} · Walking UI {WALKING_UI_REVISION}
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  )
}
