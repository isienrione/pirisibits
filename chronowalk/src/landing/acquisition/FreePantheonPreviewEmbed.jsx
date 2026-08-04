import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import A2FreePreviewStory from '../../redesign/screens/A2FreePreviewStory.jsx'
import A2PreviewGhostTour from '../../redesign/screens/A2PreviewGhostTour.jsx'
import LandingProductPhoneFrame from '../v4/LandingProductPhoneFrame.jsx'
import {
  trackFreePantheonDemoInteracted,
  trackFreePantheonStartClicked,
} from './acquisitionAnalytics.js'
import { usePantheonPreviewController } from './usePantheonPreviewController.js'

function PantheonStoryPlayer({ preview, immersive, onRequestImmersive, onBack }) {
  if (preview.loading || !preview.waypoint) {
    return (
      <div className="cw-acq-preview-phone__loading" aria-busy="true">
        Loading Pantheon preview…
      </div>
    )
  }

  return (
    <A2FreePreviewStory
      manifest={preview.manifest}
      waypoint={preview.waypoint}
      waypointId={preview.waypoint?.id ?? 'w17'}
      eyebrowLabel="FREE · PANTHEON PART 1 OF 4 · EXTERIOR"
      narrationPlaying={preview.playing}
      audioAvailable={preview.audioAvailable}
      currentTime={preview.currentTime}
      duration={preview.duration}
      storyEnded={preview.storyEnded}
      chapterCount={4}
      continueLabel="See the full tour →"
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
 * Large phone mockup of the live Pantheon exterior preview, with a Start CTA
 * that expands into a fullscreen experience (same player as /preview).
 * Back collapses to this acquisition page — no navigation away.
 */
export default function FreePantheonPreviewEmbed({
  startLabel = 'Start the Pantheon experience',
  onUnlockFullTour,
}) {
  const [immersive, setImmersive] = useState(false)
  const preview = usePantheonPreviewController({ analyticsSource: 'free_pantheon' })

  const openImmersive = useCallback(
    (section = 'demo') => {
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
    <section className="cw-acq-section cw-acq-preview" aria-labelledby="free-pantheon-demo">
      <div className="cw-v4-wrap cw-acq-preview__intro">
        <p className="cw-v4-eyebrow">TRY IT HERE</p>
        <h2 id="free-pantheon-demo" className="cw-v4-section-title">
          Pantheon Part 1 — Exterior
        </h2>
        <p className="cw-v4-section-lead">
          A full free chapter (~4 minutes) with the complete exterior audio and Then/Now
          reconstruction. Three more Pantheon chapters unlock with the full Rome tour.
        </p>
        <button
          type="button"
          className="cw-acq-btn cw-acq-btn--primary cw-acq-preview__start"
          onClick={() => openImmersive('demo')}
        >
          {startLabel}
        </button>
      </div>

      {!immersive ? (
        <div className="cw-acq-preview__phone-wrap">
          <LandingProductPhoneFrame label="ChronoWalk Pantheon exterior preview">
            <div className="cw-acq-preview-phone__app">
              <PantheonStoryPlayer
                preview={preview}
                immersive={false}
                onRequestImmersive={openImmersive}
              />
            </div>
          </LandingProductPhoneFrame>
        </div>
      ) : null}

      {immersive && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="cw-acq-preview-immersive"
              role="dialog"
              aria-modal="true"
              aria-label="Pantheon Part 1 exterior experience"
            >
              <button
                type="button"
                className="cw-acq-preview-immersive__back"
                onClick={closeImmersive}
              >
                ← Back to free Pantheon page
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
                    previewStopTitle={preview.waypoint?.title ?? 'The Pantheon'}
                    backLabel="Back to free Pantheon page"
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
