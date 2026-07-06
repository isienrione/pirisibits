import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronLeft } from 'lucide-react'
import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, Eyebrow } from '../ui/index.js'

/**
 * Immersion — dedicated audio player (Figma C6). Separate from threshold & arrival.
 */
export default function C6ImmersivePlayer({
  accent = T.actI,
  actLabel = 'ACT I — THE ARENA',
  title = 'The Colosseum',
  chapterTitle = 'The Beast Awakens',
  chapterIndex = 0,
  chapterCount = 3,
  photo = colosseumNow,
  transcript = '',
  narrationPlaying = false,
  initialTab = 'chapters',
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onStoryComplete,
  onBack,
  onOpenThreshold,
  onViewImages,
}) {
  const [tab, setTab] = useState(initialTab === 'transcript' ? 'transcript' : 'chapters')
  const [progress] = useState(0.35)
  const bars = useRef(Array.from({ length: 48 }, () => 8 + Math.random() * 28)).current

  useEffect(() => {
    if (initialTab === 'transcript') setTab('transcript')
  }, [initialTab])

  const chapters = Array.from({ length: chapterCount }, (_, i) => ({
    n: i + 1,
    title: i === chapterIndex ? chapterTitle : `Chapter ${i + 1}`,
  }))

  return (
    <div
      style={{
        background: T.obsidian,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'blur(20px) brightness(0.25) saturate(0.55)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,19,15,0.82)' }} />
      <Vignette />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: 'max(48px, calc(env(safe-area-inset-top) + 16px)) 24px max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              color: T.muted,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: F.body,
              fontSize: 13,
            }}
          >
            <ChevronLeft size={17} /> Waypoint
          </button>
          <Eyebrow color={accent}>
            CHAPTER {chapterIndex + 1} OF {chapterCount}
          </Eyebrow>
          <div style={{ width: 72 }} />
        </div>

        <p style={{ fontSize: 11, color: T.muted, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
          {actLabel}
        </p>
        <h2
          style={{
            fontFamily: F.display,
            fontSize: 36,
            color: T.warmWhite,
            fontWeight: 300,
            lineHeight: 1.08,
            marginBottom: 4,
            flexShrink: 0,
          }}
        >
          {chapterTitle}
        </h2>
        <p style={{ fontSize: 14, color: T.muted, marginBottom: 22, flexShrink: 0 }}>{title}</p>

        {/* Waveform */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1.5, height: 44, marginBottom: 8, flexShrink: 0 }}>
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                borderRadius: 1,
                background: i / bars.length < progress ? accent : `${T.muted}35`,
                boxShadow: i / bars.length < progress ? `0 0 4px ${accent}60` : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>0:00</span>
          <span style={{ fontSize: 12, color: T.muted }}>Playing</span>
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 28,
            marginBottom: 24,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onSkipBack}
            style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}
          >
            <SkipBack size={26} />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              background: T.ember,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 28px rgba(232,161,60,0.55)',
            }}
          >
            {narrationPlaying ? (
              <Pause size={28} fill={T.obsidian} color={T.obsidian} />
            ) : (
              <Play size={28} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 3 }} />
            )}
          </button>
          <button
            type="button"
            onClick={onSkipForward}
            style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}
          >
            <SkipForward size={26} />
          </button>
        </div>

        {(onOpenThreshold || onViewImages) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexShrink: 0 }}>
            {onOpenThreshold ? (
              <button
                type="button"
                onClick={onOpenThreshold}
                style={{
                  flex: 1,
                  padding: '11px 10px',
                  borderRadius: 10,
                  border: `1px solid ${accent}66`,
                  background: `${accent}12`,
                  color: T.warmWhite,
                  fontFamily: F.body,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Step through time
              </button>
            ) : null}
            {onViewImages ? (
              <button
                type="button"
                onClick={onViewImages}
                style={{
                  flex: 1,
                  padding: '11px 10px',
                  borderRadius: 10,
                  border: `1px solid ${T.muted}44`,
                  background: 'transparent',
                  color: T.muted,
                  fontFamily: F.body,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                View images only
              </button>
            ) : null}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 24,
            borderBottom: `1px solid ${T.ink800}`,
            marginBottom: 12,
            flexShrink: 0,
          }}
        >
          {['chapters', 'transcript'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                paddingBottom: 8,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: tab === t ? T.warmWhite : T.muted,
                marginBottom: -1,
                background: 'none',
                border: 'none',
                borderBottom: `1.5px solid ${tab === t ? accent : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: F.body,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', marginBottom: 12 }}>
          {tab === 'transcript' ? (
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8 }}>{transcript || 'Transcript loading…'}</p>
          ) : (
            <div>
              {chapters.map((ch, i) => (
                <div
                  key={ch.n}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    opacity: i === chapterIndex ? 1 : 0.55,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === chapterIndex ? accent : T.ink800,
                      boxShadow: i === chapterIndex ? `0 0 8px ${accent}` : 'none',
                    }}
                  />
                  <span style={{ fontSize: 14, color: i === chapterIndex ? T.warmWhite : T.muted }}>{ch.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {onStoryComplete ? (
          <button
            type="button"
            onClick={onStoryComplete}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: `1px solid ${T.muted}44`,
              background: 'transparent',
              color: T.warmWhite,
              fontFamily: F.body,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Continue walk →
          </button>
        ) : null}
      </div>
    </div>
  )
}
