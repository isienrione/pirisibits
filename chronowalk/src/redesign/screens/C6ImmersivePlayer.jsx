import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronLeft } from 'lucide-react'
import { T, F, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, Eyebrow } from '../ui/index.js'
import { formatPlaybackSpeed } from '../../utils/appPreferences.js'
import { useAppPreferences, transcriptFontSizePx } from '../../hooks/useAppPreferences.js'

const DEFAULT_SPEEDS = [0.8, 1, 1.2]

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

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
  transcriptAvailable = false,
  narrationPlaying = false,
  currentTime = 0,
  duration = 0,
  playbackRate = 1,
  speeds = DEFAULT_SPEEDS,
  onCycleSpeed,
  audioAvailable = true,
  storyEnded = false,
  hasReconstruction = false,
  initialTab = 'chapters',
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onSeek,
  onSelectChapter,
  onOpenTranscript,
  onStoryComplete,
  onBack,
  onOpenThreshold,
  onViewImages,
}) {
  const { prefs } = useAppPreferences()
  const transcriptFontSize = transcriptFontSizePx(prefs.textSize)
  const [tab, setTab] = useState(initialTab === 'transcript' ? 'transcript' : 'chapters')
  const [dragProgress, setDragProgress] = useState(null)
  const [showAudioNotice, setShowAudioNotice] = useState(false)
  const seekTrackRef = useRef(null)
  const bars = useRef(Array.from({ length: 48 }, () => 8 + Math.random() * 28)).current

  const liveProgress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0
  const progress = dragProgress ?? liveProgress
  const canSeek = typeof onSeek === 'function' && duration > 0 && audioAvailable
  const displayTime = dragProgress != null ? dragProgress * duration : currentTime
  const remaining = duration > 0 ? Math.max(duration - displayTime, 0) : 0

  const seekFromClientX = (clientX) => {
    const el = seekTrackRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return null
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  }

  const handleSeekPointerDown = (e) => {
    if (!canSeek) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const frac = seekFromClientX(e.clientX)
    if (frac != null) setDragProgress(frac)
  }

  const handleSeekPointerMove = (e) => {
    if (!canSeek || dragProgress == null) return
    const frac = seekFromClientX(e.clientX)
    if (frac != null) setDragProgress(frac)
  }

  const handleSeekPointerUp = (e) => {
    if (!canSeek || dragProgress == null) return
    const frac = seekFromClientX(e.clientX) ?? dragProgress
    setDragProgress(null)
    onSeek(frac * duration)
  }

  useEffect(() => {
    if (initialTab === 'transcript') setTab('transcript')
  }, [initialTab])

  // Only surface the "no audio" notice after a grace period so a normal load
  // (buffers still resolving) never flashes it.
  useEffect(() => {
    if (audioAvailable) {
      setShowAudioNotice(false)
      return undefined
    }
    const id = setTimeout(() => setShowAudioNotice(true), 1600)
    return () => clearTimeout(id)
  }, [audioAvailable])

  const selectTab = (next) => {
    setTab(next)
    if (next === 'transcript') onOpenTranscript?.()
  }

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
          padding: `max(48px, calc(env(safe-area-inset-top) + 16px)) 24px ${SHELL_SAFE_BOTTOM_INSET}`,
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

        {/* Waveform / scrubber */}
        <div
          ref={seekTrackRef}
          onPointerDown={handleSeekPointerDown}
          onPointerMove={handleSeekPointerMove}
          onPointerUp={handleSeekPointerUp}
          onPointerCancel={handleSeekPointerUp}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            height: 56,
            marginBottom: 4,
            flexShrink: 0,
            cursor: canSeek ? 'pointer' : 'default',
            touchAction: 'none',
            opacity: audioAvailable ? 1 : 0.4,
          }}
        >
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: h,
                borderRadius: 1,
                pointerEvents: 'none',
                background: i / bars.length < progress ? accent : `${T.muted}35`,
                boxShadow: i / bars.length < progress ? `0 0 4px ${accent}60` : 'none',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>
            {formatTime(displayTime)}
          </span>
          {onCycleSpeed ? (
            <button
              type="button"
              onClick={onCycleSpeed}
              aria-label={`Playback speed ${formatPlaybackSpeed(playbackRate)}`}
              style={{
                background: `${T.muted}22`,
                border: 'none',
                borderRadius: 999,
                padding: '4px 12px',
                cursor: 'pointer',
                color: T.warmWhite,
                fontFamily: F.body,
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
              }}
            >
              {formatPlaybackSpeed(playbackRate)}
            </button>
          ) : null}
          <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: 'tabular-nums', minWidth: 40, textAlign: 'right' }}>
            {duration > 0 ? `-${formatTime(remaining)}` : narrationPlaying ? 'Playing' : 'Paused'}
          </span>
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
            disabled={!audioAvailable}
            aria-label="Back 15 seconds"
            style={{ color: T.muted, background: 'none', border: 'none', cursor: audioAvailable ? 'pointer' : 'default', lineHeight: 0, opacity: audioAvailable ? 1 : 0.35, position: 'relative' }}
          >
            <SkipBack size={26} />
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: T.muted, pointerEvents: 'none' }}>15</span>
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!audioAvailable}
            aria-label={narrationPlaying ? 'Pause' : 'Play'}
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              background: T.ember,
              border: 'none',
              cursor: audioAvailable ? 'pointer' : 'default',
              opacity: audioAvailable ? 1 : 0.4,
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
            disabled={!audioAvailable}
            aria-label="Forward 15 seconds"
            style={{ color: T.muted, background: 'none', border: 'none', cursor: audioAvailable ? 'pointer' : 'default', lineHeight: 0, opacity: audioAvailable ? 1 : 0.35, position: 'relative' }}
          >
            <SkipForward size={26} />
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: T.muted, pointerEvents: 'none' }}>15</span>
          </button>
        </div>

        {showAudioNotice ? (
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 12,
              color: T.muted,
              textAlign: 'center',
              lineHeight: 1.5,
              flexShrink: 0,
            }}
          >
            {import.meta.env.DEV
              ? 'Narration audio is unavailable in this development build.'
              : 'Narration is preparing — check your connection.'}
          </p>
        ) : null}

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
          {[['chapters', 'chapters'], ['transcript', 'Read instead']].map(([t, label]) => (
            <button
              key={t}
              type="button"
              onClick={() => selectTab(t)}
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
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', marginBottom: 12 }}>
          {tab === 'transcript' ? (
            <div
              style={{
                background: T.bone,
                borderRadius: 12,
                padding: '18px 18px 20px',
              }}
            >
              {transcriptAvailable && transcript ? (
                <p style={{ fontFamily: F.display, fontWeight: 300, fontSize: transcriptFontSize, color: T.ink, lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {transcript}
                </p>
              ) : (
                <p style={{ fontFamily: F.body, fontSize: 14, color: `${T.ink}99`, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  {import.meta.env.DEV
                    ? 'No written transcript is wired for this stop yet (development).'
                    : 'A written transcript for this stop is coming soon.'}
                </p>
              )}
            </div>
          ) : (
            <div>
              {chapters.map((ch, i) => (
                <button
                  key={ch.n}
                  type="button"
                  onClick={() => onSelectChapter?.(i)}
                  disabled={!onSelectChapter}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: onSelectChapter ? 'pointer' : 'default',
                    opacity: i === chapterIndex ? 1 : 0.55,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      flexShrink: 0,
                      background: i === chapterIndex ? accent : T.ink800,
                      boxShadow: i === chapterIndex ? `0 0 8px ${accent}` : 'none',
                    }}
                  />
                  <span style={{ fontSize: 14, fontFamily: F.body, color: i === chapterIndex ? T.warmWhite : T.muted }}>
                    {ch.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {storyEnded && hasReconstruction && onOpenThreshold ? (
          <button
            type="button"
            onClick={onOpenThreshold}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 12,
              border: 'none',
              background: T.ember,
              color: T.obsidian,
              fontFamily: F.body,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 0 24px rgba(232,161,60,0.4)',
            }}
          >
            When you’re ready, cross into the past →
          </button>
        ) : storyEnded && onStoryComplete ? (
          <button
            type="button"
            onClick={onStoryComplete}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 12,
              border: 'none',
              background: T.ember,
              color: T.obsidian,
              fontFamily: F.body,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 0 24px rgba(232,161,60,0.4)',
            }}
          >
            Continue walking →
          </button>
        ) : onStoryComplete ? (
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
