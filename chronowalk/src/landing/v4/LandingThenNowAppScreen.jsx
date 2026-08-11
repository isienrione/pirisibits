import { useCallback, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { ThresholdChromeProvider } from '../../context/ThresholdChromeContext.jsx'
import { mediaUrl } from '../../lib/mediaUrl.js'
import C7Threshold from '../../redesign/screens/C7Threshold.jsx'
import { Eyebrow } from '../../redesign/ui/Eyebrow.jsx'
import ThresholdDiegeticHint from '../../redesign/ui/ThresholdDiegeticHint.jsx'
import { F, T } from '../../redesign/tokens.js'
import { Vignette } from '../../redesign/ui/Vignette.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'

const INTERIOR_NOW = mediaUrl('/waypoints/colosseum/interior/modern-poster.jpg')
const INTERIOR_THEN = mediaUrl('/waypoints/colosseum/interior/ancient-reconstruction.jpg')
const INTERIOR_LOOP = mediaUrl('/waypoints/colosseum/interior/ancient-reconstruction.mp4')

/**
 * In-phone Colosseum-interior Threshold — mirrors the immersive stop chrome
 * visitors see in the product (diegetic hold teach, title, era pills).
 * Silent: no ambience / narration audio.
 */
export default function LandingThenNowAppScreen({
  active = true,
  autoPeek = false,
  onHoldStart,
  onHoldEnd,
  onFullyRevealed,
}) {
  const { t } = useI18n()
  const [focusReveal, setFocusReveal] = useState(false)
  const [hintHidden, setHintHidden] = useState(false)
  const [latched, setLatched] = useState(false)
  const thenLabel = t('threshold.thenDefault')
  const honestyCaption = t('threshold.honesty')

  const handleHoldStart = useCallback(() => {
    setFocusReveal(true)
    setHintHidden(true)
    onHoldStart?.()
  }, [onHoldStart])

  const handleHoldEnd = useCallback(
    (detail) => {
      const nextLatched = Boolean(detail?.latched)
      setLatched(nextLatched)
      setFocusReveal(nextLatched)
      if (!nextLatched) setHintHidden(false)
      onHoldEnd?.(detail)
    },
    [onHoldEnd],
  )

  const handleCrossed = useCallback(() => {
    setLatched(true)
    setFocusReveal(true)
    setHintHidden(true)
    onFullyRevealed?.()
  }, [onFullyRevealed])

  const chromeHidden = focusReveal
  const showDiegeticHint = active && !chromeHidden && !latched && !hintHidden

  return (
    <ThresholdChromeProvider>
      <div
        className={[
          'cw-waypoint-immersive',
          'cw-v4-then-now-app',
          chromeHidden ? 'cw-waypoint-immersive--focus' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-testid="then-now-app-screen"
        style={{
          background: T.obsidian,
          height: '100%',
          maxHeight: '100%',
          fontFamily: F.body,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="cw-waypoint-immersive__stage">
          <div className="cw-waypoint-immersive__hero">
            <div className="cw-waypoint-immersive__threshold">
              <C7Threshold
                embedded
                immersive
                active={active}
                waypointId="landing-colosseum-interior"
                waypointName={t('landing.thenNow.interiorName')}
                nowPhoto={INTERIOR_NOW}
                thenPhoto={INTERIOR_THEN}
                thenLoop={INTERIOR_LOOP}
                thenLabel={thenLabel}
                honestyCaption={honestyCaption}
                autoPeek={autoPeek}
                onHoldStart={handleHoldStart}
                onHoldEnd={handleHoldEnd}
                onCrossed={handleCrossed}
              />
            </div>

            {showDiegeticHint ? (
              <ThresholdDiegeticHint thenLabel={thenLabel} showText showHand />
            ) : null}

            <div className="cw-waypoint-immersive__hero-scrim cw-waypoint-immersive__chrome" aria-hidden />
            <div className="cw-waypoint-immersive__chrome" aria-hidden>
              <Vignette />
            </div>

            <div
              className="cw-waypoint-immersive__topbar cw-waypoint-immersive__chrome"
              style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                left: 16,
                right: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            >
              <span
                className="cw-v4-then-now-app__back"
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: 'rgba(12,10,8,0.45)',
                  color: T.warmWhite,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <ChevronLeft size={20} />
              </span>
            </div>

            <div className="cw-waypoint-immersive__hero-title cw-waypoint-immersive__chrome">
              <Eyebrow color={T.gold}>Act I · Antiquity</Eyebrow>
              <h2
                style={{
                  fontFamily: F.display,
                  fontSize: 28,
                  color: T.warmWhite,
                  fontWeight: 300,
                  lineHeight: 1.08,
                  margin: '8px 0 4px',
                }}
              >
                Colosseum interior
              </h2>
              <p
                style={{
                  fontFamily: F.display,
                  fontSize: 14,
                  color: 'rgba(245,240,232,0.82)',
                  fontStyle: 'italic',
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                You are standing where the crowd never stood.
              </p>
            </div>
          </div>

          <div
            className="cw-waypoint-immersive__panel cw-waypoint-immersive__chrome cw-v4-then-now-app__panel"
            aria-hidden
          >
            <div className="cw-v4-then-now-app__wave" />
            <div className="cw-v4-then-now-app__transport">
              <span className="cw-v4-then-now-app__time">0:00</span>
              <span className="cw-v4-then-now-app__play" />
              <span className="cw-v4-then-now-app__time">4:12</span>
            </div>
            <p className="cw-v4-then-now-app__chapter">Chapter 1 of 2 · Audio</p>
          </div>
        </div>
      </div>
    </ThresholdChromeProvider>
  )
}
