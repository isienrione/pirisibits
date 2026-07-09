import { T, F } from '../tokens.js'
import { loadRomeManifest } from '../../content/manifest.js'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { buildImmersivePlayerProps } from '../lib/waypointImmersiveProps.js'
import C6ImmersivePlayer from './C6ImmersivePlayer.jsx'

const PRODUCT_TRUTH = getTourProductTruth(loadRomeManifest())

/**
 * Free Pantheon preview — same unified immersive layout as every journey stop.
 */
export default function A2FreePreviewStory({
  manifest,
  waypoint,
  waypointId = 'w17',
  eyebrowLabel = 'FREE PREVIEW · PANTHEON',
  narrationPlaying = false,
  audioAvailable = true,
  currentTime = 0,
  duration = 0,
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onSeek,
  onThresholdCross,
  onUnlock,
  onBack,
}) {
  const playerProps = buildImmersivePlayerProps({
    waypoint,
    waypointId,
    manifest,
    audio: {
      narrationPlaying,
      currentTime,
      duration,
      audioAvailable,
    },
    handlers: {
      onTogglePlay,
      onSkipBack,
      onSkipForward,
      onSeek,
      onThresholdCross,
      onBack,
    },
  })

  return (
    <div style={{ background: T.obsidian, height: '100%', fontFamily: F.body, position: 'relative', overflow: 'hidden' }}>
      <C6ImmersivePlayer
        {...playerProps}
        actLabel={eyebrowLabel}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          padding: '0 24px max(16px, env(safe-area-inset-bottom))',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            paddingTop: 12,
            borderTop: `1px solid ${T.ink800}`,
            background: 'linear-gradient(0deg, rgba(22,19,15,0.98) 70%, transparent)',
          }}
        >
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, margin: '0 0 14px', fontStyle: 'italic' }}>
            That&apos;s one room of {PRODUCT_TRUTH.publicPlaceCount}. The rest of Rome is waiting outside.
          </p>
          <button
            type="button"
            onClick={() => onUnlock?.()}
            style={{
              width: '100%',
              padding: '15px',
              background: T.ember,
              color: T.obsidian,
              borderRadius: 12,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 15,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Unlock all {PRODUCT_TRUTH.publicPlacesLabel}
          </button>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '12px',
                background: 'transparent',
                border: 'none',
                color: T.muted,
                cursor: 'pointer',
              }}
            >
              Back to landing
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
