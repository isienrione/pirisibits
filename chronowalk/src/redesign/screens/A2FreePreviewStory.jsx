import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { T, F } from '../tokens.js'
import { pantheonNow } from '../images.js'
import { THEN_pantheon } from '../images.js'
import { loadRomeManifest } from '../../content/manifest.js'
import { getTourProductTruth } from '../../content/tourProductTruth.js'
import { Vignette, Eyebrow } from '../ui/index.js'
import C7Threshold from './C7Threshold.jsx'

const PRODUCT_TRUTH = getTourProductTruth(loadRomeManifest())

export default function A2FreePreviewStory({
  title = 'The Pantheon',
  photo = pantheonNow,
  thenPhoto = THEN_pantheon,
  thenLoop = null,
  thenLabel = 'ANCIENT ROME',
  honestyCaption = null,
  waypointId = 'w17',
  tagline = 'A temple to all gods — or a tomb for emperors?',
  narrationPlaying = false,
  audioAvailable = true,
  onTogglePlay,
  onThresholdCross,
  onUnlock,
  onBack,
}) {
  return (
    <div style={{ background: T.obsidian, height: '100%', fontFamily: F.body, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          filter: 'brightness(0.3)',
          zIndex: 0,
        }}
      />
      <Vignette />

      <div style={{ position: 'relative', flexShrink: 0, height: '52%', zIndex: 5 }}>
        <C7Threshold
          embedded
          waypointId={waypointId}
          waypointName={title}
          nowPhoto={photo}
          thenPhoto={thenPhoto}
          thenLoop={thenLoop}
          thenLabel={thenLabel}
          honestyCaption={honestyCaption ?? undefined}
          onCrossed={onThresholdCross}
        />
      </div>

      <div style={{ flex: 1, padding: '24px 24px 8px', position: 'relative', zIndex: 5 }}>
        <Eyebrow color={T.actIII}>FREE PREVIEW · PANTHEON</Eyebrow>
        <h2 style={{ fontFamily: F.display, fontSize: 36, color: T.warmWhite, fontWeight: 300, lineHeight: 1.05, margin: '10px 0 4px' }}>
          {title}
        </h2>
        <p style={{ fontFamily: F.display, fontSize: 14, color: T.muted, fontStyle: 'italic', marginBottom: 16 }}>
          {tagline}
        </p>

        {audioAvailable ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 1.5, background: T.ink800, borderRadius: 1 }}>
                <div style={{ height: '100%', width: '32%', background: T.ember, borderRadius: 1, boxShadow: '0 0 8px rgba(232,161,60,0.5)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>1:17</span>
                <span style={{ fontSize: 11, color: T.muted }}>4:00</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
              <button type="button" style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}><SkipBack size={22} /></button>
              <button
                type="button"
                onClick={() => onTogglePlay?.()}
                style={{ width: 56, height: 56, borderRadius: 28, background: T.ember, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(232,161,60,0.5)' }}
              >
                {narrationPlaying ? <Pause size={22} fill={T.obsidian} color={T.obsidian} /> : <Play size={22} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 3 }} />}
              </button>
              <button type="button" style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}><SkipForward size={22} /></button>
            </div>
          </>
        ) : import.meta.env.DEV ? (
          <div style={{ textAlign: 'center', padding: '18px 0 16px' }}>
            <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              Preview audio unavailable in development
            </span>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${T.ink800}`, marginBottom: 12 }}>
          {(['audio', 'transcript']).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {}}
              style={{
                paddingBottom: 8,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: t === 'audio' ? T.warmWhite : T.muted,
                marginBottom: -1,
                background: 'none',
                border: 'none',
                borderBottom: `1.5px solid ${t === 'audio' ? T.ember : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
          Chapter 1 of 3 · <span style={{ color: T.warmWhite }}>The Dome That Refused to Fall</span>
        </p>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.ink800}` }}>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 14, fontStyle: 'italic' }}>
            That&apos;s one room of {PRODUCT_TRUTH.publicPlaceCount}. The rest of Rome is waiting outside.
          </p>
          <button
            type="button"
            onClick={() => onUnlock?.()}
            style={{ width: '100%', padding: '15px', background: T.ember, color: T.obsidian, borderRadius: 12, fontFamily: F.body, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer' }}
          >
            Unlock all {PRODUCT_TRUTH.publicPlacesLabel}
          </button>
          {onBack ? (
            <button type="button" onClick={onBack} style={{ width: '100%', marginTop: 10, padding: '12px', background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>
              Back to landing
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
