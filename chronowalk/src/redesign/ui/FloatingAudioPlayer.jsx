import { useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown, X, RotateCcw } from 'lucide-react'
import { T, F } from '../tokens.js'
import { formatPlaybackSpeed } from '../../utils/appPreferences.js'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Persistent, minimizable narration dock. Rendered above the tab bar / safe
 * area during the journey so audio (especially transit narration heard while
 * walking) is always visible and controllable — never a mystery sound.
 */
export default function FloatingAudioPlayer({
  accent = T.actI,
  title = 'Rome',
  subtitle = 'Now playing',
  narrationPlaying = false,
  ended = false,
  currentTime = 0,
  duration = 0,
  playbackRate = 1,
  onToggle,
  onReplay,
  onSkipBack,
  onSkipForward,
  onSeek,
  onCycleSpeed,
  onStop,
  onDismiss,
  transcript = '',
  bottomInset = '16px',
}) {
  const [expanded, setExpanded] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [dragProgress, setDragProgress] = useState(null)
  const trackRef = useRef(null)

  const liveProgress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : ended ? 1 : 0
  const progress = dragProgress ?? liveProgress
  const canSeek = !ended && typeof onSeek === 'function' && duration > 0
  const displayTime = dragProgress != null ? dragProgress * duration : currentTime
  const remaining = duration > 0 ? Math.max(duration - displayTime, 0) : 0
  const handleMain = ended ? onReplay : onToggle

  const seekFromClientX = (clientX) => {
    const el = trackRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0) return null
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  }

  const onPointerDown = (e) => {
    if (!canSeek) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const frac = seekFromClientX(e.clientX)
    if (frac != null) setDragProgress(frac)
  }
  const onPointerMove = (e) => {
    if (!canSeek || dragProgress == null) return
    const frac = seekFromClientX(e.clientX)
    if (frac != null) setDragProgress(frac)
  }
  const onPointerUp = (e) => {
    if (!canSeek || dragProgress == null) return
    const frac = seekFromClientX(e.clientX) ?? dragProgress
    setDragProgress(null)
    onSeek(frac * duration)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: `calc(${bottomInset} + 8px)`,
        zIndex: 65,
        maxWidth: 512,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          background: 'rgba(22,19,15,0.94)',
          border: `1px solid ${T.ink800}`,
          borderRadius: 16,
          boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
          backdropFilter: 'blur(14px)',
          overflow: 'hidden',
          fontFamily: F.body,
        }}
      >
        {/* Live progress hairline */}
        <div style={{ height: 2, background: `${T.muted}22` }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: accent, boxShadow: `0 0 6px ${accent}` }} />
        </div>

        {/* Minimized row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 4.5,
              flexShrink: 0,
              background: accent,
              boxShadow: `0 0 0 4px ${accent}22`,
              animation: narrationPlaying ? 'presencePulse 3s ease-in-out infinite' : 'none',
              opacity: ended ? 0.55 : 1,
            }}
          />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>
              {subtitle}
            </div>
            <div
              style={{
                fontSize: 14,
                color: T.warmWhite,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>
          </button>

          <button
            type="button"
            onClick={handleMain}
            aria-label={ended ? 'Replay' : narrationPlaying ? 'Pause' : 'Play'}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              flexShrink: 0,
              background: ended ? `${accent}33` : T.ember,
              border: ended ? `1px solid ${accent}66` : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {ended ? (
              <RotateCcw size={17} color={accent} />
            ) : narrationPlaying ? (
              <Pause size={18} fill={T.obsidian} color={T.obsidian} />
            ) : (
              <Play size={18} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 2 }} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Minimize player' : 'Expand player'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, lineHeight: 0, flexShrink: 0 }}
          >
            {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {/* Expanded controls */}
        {expanded ? (
          <div style={{ padding: '0 14px 14px' }}>
            <div
              ref={trackRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                cursor: canSeek ? 'pointer' : 'default',
                touchAction: 'none',
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: 4, borderRadius: 2, background: `${T.muted}33` }}>
                <div style={{ position: 'absolute', inset: 0, width: `${progress * 100}%`, borderRadius: 2, background: accent }} />
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${progress * 100}%`,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: accent,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 8px ${accent}`,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>{formatTime(displayTime)}</span>
              <span style={{ fontSize: 11, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>
                {ended
                  ? 'Finished'
                  : duration > 0
                    ? `-${formatTime(remaining)}`
                    : narrationPlaying
                      ? 'Playing'
                      : 'Paused'}
              </span>
            </div>

            {ended ? (
              <button
                type="button"
                onClick={onReplay}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: T.ember,
                  color: T.obsidian,
                  fontFamily: F.body,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <RotateCcw size={16} /> Replay
              </button>
            ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
              <button
                type="button"
                onClick={onSkipBack}
                aria-label="Back 15 seconds"
                style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0, position: 'relative' }}
              >
                <SkipBack size={22} />
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: T.muted, pointerEvents: 'none' }}>15</span>
              </button>
              <button
                type="button"
                onClick={onToggle}
                aria-label={narrationPlaying ? 'Pause' : 'Play'}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: T.ember,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {narrationPlaying ? (
                  <Pause size={22} fill={T.obsidian} color={T.obsidian} />
                ) : (
                  <Play size={22} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 2 }} />
                )}
              </button>
              <button
                type="button"
                onClick={onSkipForward}
                aria-label="Forward 15 seconds"
                style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0, position: 'relative' }}
              >
                <SkipForward size={22} />
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: T.muted, pointerEvents: 'none' }}>15</span>
              </button>
            </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: ended ? 0 : 14 }}>
              {!ended && onCycleSpeed ? (
                <button
                  type="button"
                  onClick={onCycleSpeed}
                  aria-label={`Playback speed ${formatPlaybackSpeed(playbackRate)}`}
                  style={{
                    background: `${T.muted}22`,
                    border: 'none',
                    borderRadius: 999,
                    padding: '5px 14px',
                    cursor: 'pointer',
                    color: T.warmWhite,
                    fontFamily: F.body,
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatPlaybackSpeed(playbackRate)}
                </button>
              ) : <span />}
              {transcript ? (
                <button
                  type="button"
                  onClick={() => setShowTranscript((v) => !v)}
                  style={{
                    background: 'none',
                    border: `1px solid ${T.muted}44`,
                    borderRadius: 999,
                    padding: '5px 14px',
                    cursor: 'pointer',
                    color: T.muted,
                    fontFamily: F.body,
                    fontSize: 12,
                  }}
                >
                  {showTranscript ? 'Hide text' : 'Read instead'}
                </button>
              ) : null}
              {ended && onDismiss ? (
                <button
                  type="button"
                  onClick={onDismiss}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: `1px solid ${T.muted}44`,
                    borderRadius: 999,
                    padding: '5px 14px',
                    cursor: 'pointer',
                    color: T.muted,
                    fontFamily: F.body,
                    fontSize: 12,
                    marginLeft: 'auto',
                  }}
                >
                  <X size={14} /> Dismiss
                </button>
              ) : onStop ? (
                <button
                  type="button"
                  onClick={onStop}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: `1px solid ${T.muted}44`,
                    borderRadius: 999,
                    padding: '5px 14px',
                    cursor: 'pointer',
                    color: T.muted,
                    fontFamily: F.body,
                    fontSize: 12,
                  }}
                >
                  <X size={14} /> Stop
                </button>
              ) : null}
            </div>

            {showTranscript && transcript ? (
              <div
                style={{
                  marginTop: 12,
                  maxHeight: 160,
                  overflowY: 'auto',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: `${T.ink800}`,
                  border: `1px solid ${T.muted}22`,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: T.warmWhite,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {transcript}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
