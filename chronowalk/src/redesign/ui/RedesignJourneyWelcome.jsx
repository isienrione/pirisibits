import { useMemo } from 'react'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { useTourManifest, useV2Journey } from '../../hooks/useV2Journey.js'
import { SHELL_TAB_BAR_INSET } from '../tokens.js'
import { PrimaryButton } from './index.js'
import TourRoutePreviewPanel from './TourRoutePreviewPanel.jsx'

/**
 * Journey welcome — full-screen illustrated roadmap before unlocking audio.
 */
export default function RedesignJourneyWelcome({ onUnlock, busy = false }) {
  const { context } = useV2Journey()
  const { manifest, loading } = useTourManifest()

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
