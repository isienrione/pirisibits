import { useRef, useState } from 'react'
import { Settings, Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { T, F, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { Eyebrow } from '../ui/index.js'
import KaraokeTranscript from '../ui/KaraokeTranscript.jsx'
import { formatPlaybackSpeed } from '../../utils/appPreferences.js'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function C2Transit({
  accent = T.actI,
  title = 'The Pantheon',
  note = 'The city between stops has its own stories.',
  progressPct = 35,
  onOpenSettings,
  onContinue,
  continueLabel = 'Continue walking →',
  narrationPlaying = false,
  narrationPaused = false,
  currentTime = 0,
  duration = 0,
  playbackRate = 1,
  transcript = '',
  trackTitle = null,
  onToggleAudio,
  onSkipBack,
  onSkipForward,
  onSeek,
  onCycleSpeed,
  map,
  destinationTitle = null,
  onArriveAtDestination,
  atDestination = false,
}) {
  const navigate = useNavigate()
  const [showTranscript, setShowTranscript] = useState(false)
  const [dragProgress, setDragProgress] = useState(null)
  const seekTrackRef = useRef(null)

  const liveProgress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0
  const progress = dragProgress ?? liveProgress
  const canSeek = typeof onSeek === 'function' && duration > 0
  const displayTime = dragProgress != null ? dragProgress * duration : currentTime
  const remaining = duration > 0 ? Math.max(duration - displayTime, 0) : 0
  const audioLive = narrationPlaying || narrationPaused || duration > 0
  const reading = Boolean(showTranscript && transcript)

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

  return (
    <div
      className="cw-grain"
      data-testid="transit-screen"
      style={{
        background: T.bone,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div
        style={{
          height: 3,
          background: `${T.muted}28`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: accent,
            boxShadow: `0 0 8px ${accent}80`,
          }}
        />
      </div>

      {/* Map — hidden in read mode so lyrics fill the screen */}
      {!reading ? (
      <div
        style={{
          flexShrink: 0,
          height: 'min(34vh, 220px)',
          minHeight: 140,
          position: 'relative',
          background: T.obsidian,
        }}
      >
        {map}

        <button
          type="button"
          onClick={onOpenSettings ?? (() => navigate('/settings'))}
          aria-label="Settings"
          style={{
            position: 'absolute',
            top: 'max(12px, calc(env(safe-area-inset-top) + 8px))',
            left: 16,
            zIndex: 3,
            background: 'rgba(247,241,230,0.92)',
            border: 'none',
            borderRadius: 20,
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: `${T.ink}80`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Settings size={18} />
        </button>

        <div
          style={{
            position: 'absolute',
            top: 'max(12px, calc(env(safe-area-inset-top) + 8px))',
            right: 16,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(247,241,230,0.92)',
            borderRadius: 20,
            padding: '5px 10px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              background: accent,
              animation: narrationPlaying ? 'presencePulse 2.5s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ fontSize: 11, color: T.ink, letterSpacing: '0.06em' }}>ON ROUTE</span>
        </div>
      </div>
      ) : null}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          flexShrink: 1,
          padding: reading ? '8px 12px 0' : showTranscript && transcript ? '10px 16px 0' : '14px 20px 0',
          background: T.bone,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {reading ? (
          <KaraokeTranscript
            transcript={transcript}
            currentTime={currentTime}
            duration={duration}
            playing={narrationPlaying}
            accent={accent}
            fontSize={19}
            variant="bone"
            fullHeight
            immersive
            testId="transit-transcript"
          />
        ) : (
          <>
            <Eyebrow color={accent}>WALKING TO</Eyebrow>
            <h1
              style={{
                fontFamily: F.display,
                fontSize: 26,
                color: T.ink,
                fontWeight: 300,
                lineHeight: 1.12,
                margin: '6px 0 4px',
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: 14, color: `${T.ink}72`, lineHeight: 1.55, margin: 0 }}>
              {note}
            </p>
          </>
        )}
      </div>

      {/* Sticky footer — narration controls + continue always on screen */}
      <div
        style={{
          flexShrink: 0,
          background: T.bone,
          borderTop: `1px solid ${T.muted}28`,
          boxShadow: '0 -8px 24px rgba(22,19,15,0.08)',
        }}
      >
        <div
          data-testid="transit-audio-panel"
          style={{
            margin: reading ? '8px 12px 0' : '10px 16px 0',
            padding: reading ? '10px 12px' : '14px 14px 12px',
            borderRadius: 14,
            background: T.obsidian,
            border: `1px solid ${T.ink800}`,
          }}
        >
          {!reading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent }}>
                {narrationPlaying ? 'Now playing' : narrationPaused ? 'Paused' : audioLive ? 'Narration' : 'On the way'}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: T.warmWhite,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: 2,
                }}
              >
                {trackTitle ?? `Toward ${title}`}
              </div>
            </div>
            {onToggleAudio ? (
              <button
                type="button"
                onClick={onToggleAudio}
                aria-label={narrationPlaying ? 'Pause' : 'Play'}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  flexShrink: 0,
                  marginLeft: 10,
                  background: T.ember,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {narrationPlaying ? (
                  <Pause size={20} fill={T.obsidian} color={T.obsidian} />
                ) : (
                  <Play size={20} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 2 }} />
                )}
              </button>
            ) : null}
          </div>
          ) : null}

          <div
            ref={seekTrackRef}
            onPointerDown={handleSeekPointerDown}
            onPointerMove={handleSeekPointerMove}
            onPointerUp={handleSeekPointerUp}
            onPointerCancel={handleSeekPointerUp}
            style={{
              height: 32,
              display: 'flex',
              alignItems: 'center',
              cursor: canSeek ? 'pointer' : 'default',
              touchAction: 'none',
              marginBottom: 6,
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: 4, borderRadius: 2, background: `${T.muted}33` }}>
              <div style={{ position: 'absolute', inset: 0, width: `${progress * 100}%`, borderRadius: 2, background: accent }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>{formatTime(displayTime)}</span>
            <span style={{ fontSize: 11, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>
              {duration > 0 ? `-${formatTime(remaining)}` : narrationPlaying ? 'Playing' : 'Ready'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: reading ? 12 : 16 }}>
              {reading && onToggleAudio ? (
                <button
                  type="button"
                  onClick={onToggleAudio}
                  aria-label={narrationPlaying ? 'Pause' : 'Play'}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    flexShrink: 0,
                    background: T.ember,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {narrationPlaying ? (
                    <Pause size={18} fill={T.obsidian} color={T.obsidian} />
                  ) : (
                    <Play size={18} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 2 }} />
                  )}
                </button>
              ) : null}
              {onSkipBack ? (
                <button type="button" onClick={onSkipBack} aria-label="Back 15 seconds" style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}>
                  <SkipBack size={20} />
                </button>
              ) : null}
              {onSkipForward ? (
                <button type="button" onClick={onSkipForward} aria-label="Forward 15 seconds" style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}>
                  <SkipForward size={20} />
                </button>
              ) : null}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onCycleSpeed ? (
                <button
                  type="button"
                  onClick={onCycleSpeed}
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
                  }}
                >
                  {formatPlaybackSpeed(playbackRate)}
                </button>
              ) : null}
              {transcript ? (
                <button
                  type="button"
                  onClick={() => setShowTranscript((v) => !v)}
                  style={{
                    background: 'none',
                    border: `1px solid ${T.muted}44`,
                    borderRadius: 999,
                    padding: '4px 12px',
                    cursor: 'pointer',
                    color: T.muted,
                    fontFamily: F.body,
                    fontSize: 12,
                  }}
                >
                  {showTranscript ? 'Hide text' : 'Read instead'}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: `12px 20px calc(${SHELL_TAB_BAR_INSET} + 8px)`,
            position: 'relative',
            zIndex: 12,
          }}
        >
          {onArriveAtDestination ? (
            <button
              type="button"
              data-testid="transit-arrive-destination"
              onClick={onArriveAtDestination}
              style={{
                width: '100%',
                marginBottom: onContinue ? 10 : 0,
                background: atDestination ? T.ember : 'transparent',
                border: atDestination ? 'none' : `1px solid ${accent}`,
                borderRadius: 12,
                padding: '14px 16px',
                cursor: 'pointer',
                color: atDestination ? T.obsidian : accent,
                fontWeight: 600,
                fontSize: 15,
                fontFamily: F.body,
                boxShadow: atDestination ? '0 0 24px rgba(232,161,60,0.35)' : 'none',
              }}
            >
              {atDestination
                ? `I'm here — begin ${destinationTitle ?? title}`
                : `I've arrived — begin ${destinationTitle ?? title}`}
            </button>
          ) : null}
          {onContinue ? (
            <button
              type="button"
              data-testid="transit-continue"
              onClick={onContinue}
              style={{
                width: '100%',
                background: T.ember,
                border: 'none',
                borderRadius: 12,
                padding: '14px 16px',
                cursor: 'pointer',
                color: T.obsidian,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              {continueLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
