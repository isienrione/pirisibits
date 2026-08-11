import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import A2FreePreviewStory from '../../redesign/screens/A2FreePreviewStory.jsx'
import A2PreviewGhostTour from '../../redesign/screens/A2PreviewGhostTour.jsx'
import LandingProductPhoneFrame from '../v4/LandingProductPhoneFrame.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import {
  trackFreePantheonDemoInteracted,
  trackFreePantheonStartClicked,
} from './acquisitionAnalytics.js'
import { usePantheonPreviewController } from './usePantheonPreviewController.js'

function PantheonStoryPlayer({ preview, immersive, onRequestImmersive, onBack }) {
  const { t } = useI18n()

  if (preview.loading || !preview.waypoint) {
    return (
      <div className="cw-acq-preview-phone__loading" aria-busy="true">
        {t('pantheon.preview.loading')}
      </div>
    )
  }

  return (
    <A2FreePreviewStory
      manifest={preview.manifest}
      waypoint={preview.waypoint}
      waypointId={preview.waypoint?.id ?? 'w17'}
      eyebrowLabel={t('pantheon.free.eyebrow')}
      narrationPlaying={preview.playing}
      audioAvailable={preview.audioAvailable}
      currentTime={preview.currentTime}
      duration={preview.duration}
      storyEnded={preview.storyEnded}
      chapterCount={4}
      continueLabel={t('pantheon.preview.continue')}
      onTogglePlay={() => {
        if (!preview.started) onRequestImmersive('phone_play')
        else preview.togglePlay()
      }}
      onSkipBack={preview.skipBack}
      onSkipForward={preview.skipForward}
      onSeek={preview.seek}
      onThresholdCross={() => {
        trackFreePantheonDemoInteracted('then_now')
        preview.handleThresholdCross()
      }}
      onStoryComplete={preview.handleStoryComplete}
      onBack={onBack}
      suppressAutoRevealInvite={!immersive && !preview.started}
    />
  )
}

/**
 * Large phone mockup of the live Pantheon exterior preview.
 * Interaction happens on the phone screen itself (no separate Start CTA).
 */
export default function FreePantheonPreviewEmbed({
  onUnlockFullTour,
  includesCompact = [],
  tipEyebrow,
  tipPrompt,
}) {
  const { t } = useI18n()
  const [immersive, setImmersive] = useState(false)
  const [tipDismissed, setTipDismissed] = useState(false)
  const preview = usePantheonPreviewController({ analyticsSource: 'free_pantheon' })
  const showTip = !immersive && !tipDismissed && !preview.started
  const resolvedTipEyebrow = tipEyebrow ?? t('pantheon.free.interactTipEyebrow')
  const resolvedTipPrompt = tipPrompt ?? t('pantheon.free.interactPrompt')

  const openImmersive = useCallback(
    (section = 'demo') => {
      setTipDismissed(true)
      trackFreePantheonStartClicked(section)
      preview.startExperience()
      setImmersive(true)
      trackFreePantheonDemoInteracted('start')
    },
    [preview],
  )

  const closeImmersive = useCallback(() => {
    preview.exitToPage()
    setImmersive(false)
  }, [preview])

  useEffect(() => {
    if (!immersive) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape') closeImmersive()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [closeImmersive, immersive])

  return (
    <section
      id="try-pantheon"
      className="cw-acq-preview cw-acq-preview--tight"
      aria-label={t('pantheon.preview.aria.section')}
    >
      {!immersive ? (
        <div className="cw-acq-preview__phone-wrap">
          <div className="cw-acq-preview__phone-stage">
            {showTip ? (
              <aside
                className="cw-acq-phone-tip"
                role="status"
                aria-live="polite"
                data-testid="pantheon-phone-tip"
              >
                <p className="cw-acq-phone-tip__eyebrow">{resolvedTipEyebrow}</p>
                <p className="cw-acq-phone-tip__text">{resolvedTipPrompt}</p>
                <span className="cw-acq-phone-tip__caret" aria-hidden="true" />
              </aside>
            ) : null}
            <LandingProductPhoneFrame label={t('pantheon.preview.aria.phone')}>
              <div className="cw-acq-preview-phone__app">
                <PantheonStoryPlayer
                  preview={preview}
                  immersive={false}
                  onRequestImmersive={openImmersive}
                />
              </div>
            </LandingProductPhoneFrame>
          </div>
          {includesCompact.length ? (
            <ul className="cw-acq-preview__chips" aria-label={t('pantheon.preview.aria.includes')}>
              {includesCompact.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {immersive && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="cw-acq-preview-immersive"
              role="dialog"
              aria-modal="true"
              aria-label={t('pantheon.preview.aria.dialog')}
            >
              <button
                type="button"
                className="cw-acq-preview-immersive__back"
                onClick={closeImmersive}
              >
                {t('pantheon.preview.backToPage')}
              </button>
              <div className="cw-acq-preview-immersive__shell redesign-app-shell">
                {preview.phase === 'story' ? (
                  <PantheonStoryPlayer
                    preview={preview}
                    immersive
                    onRequestImmersive={openImmersive}
                    onBack={closeImmersive}
                  />
                ) : (
                  <A2PreviewGhostTour
                    manifest={preview.manifest}
                    previewWaypointId={preview.waypoint?.id ?? 'w17'}
                    previewStopTitle={preview.waypoint?.title ?? t('mapDemo.stop.pantheon')}
                    backLabel={t('pantheon.preview.backToPage')}
                    onUnlock={() => {
                      closeImmersive()
                      onUnlockFullTour?.()
                    }}
                    onBack={closeImmersive}
                  />
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
