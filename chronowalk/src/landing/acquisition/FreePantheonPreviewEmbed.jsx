import { useCallback, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
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
 * Large phone mockup of the live Pantheon exterior preview.
 * Parent can call ref.start(section) to open fullscreen immediately.
 */
const FreePantheonPreviewEmbed = forwardRef(function FreePantheonPreviewEmbed(
  { onUnlockFullTour, includesCompact = [] },
  ref,
) {
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

  useImperativeHandle(
    ref,
    () => ({
      start: (section = 'hero') => openImmersive(section),
      scrollIntoView: () => {
        document.getElementById('try-pantheon')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      },
    }),
    [openImmersive],
  )

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
      aria-label="Pantheon Part 1 exterior preview"
    >
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
          {includesCompact.length ? (
            <ul className="cw-acq-preview__chips" aria-label="What this free chapter includes">
              {includesCompact.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="cw-acq-btn cw-acq-btn--primary cw-acq-preview__start-under"
            onClick={() => openImmersive('under_phone')}
          >
            Start the Pantheon experience
          </button>
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
})

export default FreePantheonPreviewEmbed
