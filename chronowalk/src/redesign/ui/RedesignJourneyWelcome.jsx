import { useMemo, useState, useEffect } from 'react'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { useTourManifest, useV2Journey } from '../../hooks/useV2Journey.js'
import { SHELL_TAB_BAR_INSET } from '../tokens.js'
import { PrimaryButton, GoldSeam } from './index.js'
import TourRoutePreviewPanel from './TourRoutePreviewPanel.jsx'

/**
 * Journey welcome — full-screen illustrated roadmap before unlocking audio.
 * Gold Seam `audioUnlocked` flashes once audio context is awake.
 */
export default function RedesignJourneyWelcome({ onUnlock, busy = false, audioJustUnlocked = false }) {
  const { context } = useV2Journey()
  const { manifest, loading } = useTourManifest()
  const [showSeam, setShowSeam] = useState(false)

  useEffect(() => {
    if (!audioJustUnlocked) return undefined
    setShowSeam(true)
    const t = window.setTimeout(() => setShowSeam(false), 900)
    return () => window.clearTimeout(t)
  }, [audioJustUnlocked])

  const stopCount = useMemo(() => {
    if (!manifest) return 0
    return getTourProductTruth(manifest, {
      path: context.path,
      pace: context.pace,
      promotedOptionalIds: context.promotedOptionalIds,
      customWaypointIds: context.customWaypointIds,
    }).visitStopCount
  }, [manifest, context.path, context.pace, context.promotedOptionalIds, context.customWaypointIds])

  return (
    <div className="cw-grain cw-route-preview-screen" data-testid="journey-welcome">
      {showSeam ? (
        <div
          style={{
            position: 'absolute',
            top: 'max(72px, calc(env(safe-area-inset-top) + 40px))',
            left: 0,
            right: 0,
            zIndex: 20,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          <GoldSeam moment="audioUnlocked" />
        </div>
      ) : null}

      <TourRoutePreviewPanel
        manifest={manifest}
        loading={loading}
        context={context}
        eyebrow="YOUR ROME AWAITS"
        title={
          <>
            {stopCount} stops.
            <br />
            One living city.
          </>
        }
        subtitle="Walk the full route — from the Arena to the Appian Way. Narration unlocks as you arrive at each place."
      />

      <footer
        className="cw-route-preview-screen__footer"
        style={{ paddingBottom: SHELL_TAB_BAR_INSET }}
      >
        <p className="cw-route-preview-screen__note">
          Tap once to wake sound — narration, ambience, and the city between stops.
        </p>
        <PrimaryButton onClick={onUnlock} disabled={busy}>
          {busy ? 'Starting audio…' : 'Begin your walk'}
        </PrimaryButton>
      </footer>
    </div>
  )
}
