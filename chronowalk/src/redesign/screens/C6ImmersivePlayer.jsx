import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronLeft } from 'lucide-react'
import { T, F, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, Eyebrow } from '../ui/index.js'
import ThresholdRevealInvite from '../ui/ThresholdRevealInvite.jsx'
import KaraokeTranscript from '../ui/KaraokeTranscript.jsx'
import C7Threshold from './C7Threshold.jsx'
import { formatPlaybackSpeed } from '../../utils/appPreferences.js'
import { useAppPreferences, transcriptFontSizePx } from '../../hooks/useAppPreferences.js'
import {
  hasSeenThresholdRevealTutorial,
  markThresholdRevealTutorialSeen,
} from '../../utils/thresholdWaypointReveal.js'

const DEFAULT_SPEEDS = [0.8, 1, 1.2]

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Unified waypoint view — full-bleed landmark + then/now threshold, audio below.
 * Matches the Pantheon free-preview layout for every stop.
 */
export default function C6ImmersivePlayer({
  accent = T.actI,
  actLabel = 'ACT I — THE ARENA',
  title = 'The Colosseum',
  chapterTitle = 'The Beast Awakens',
  chapterIndex = 0,
  chapterCount = 3,
  chapterTitles = null,
  photo = colosseumNow,
  tagline = null,
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
  waypointId = 'waypoint',
  thenPhoto = null,
  thenLoop = null,
  thenLabel = 'ANCIENT ROME',
  honestyCaption = null,
  sourceNote = null,
  nowAmbienceUrl = null,
  thenSoundscapeUrl = null,
  initialTab = 'chapters',
  onTogglePlay,
  onSkipBack,
  onSkipForward,
  onSeek,
  onSelectChapter,
  onOpenTranscript,
  onStoryComplete,
  continueLabel = null,
  onBack,
  onThresholdCross,
  onOpenThreshold,
  onViewImages,
  forceRevealInvite = false,
}) {
  const { prefs } = useAppPreferences()
  const transcriptFontSize = transcriptFontSizePx(prefs.textSize)
  const [tab, setTab] = useState(initialTab === 'transcript' ? 'transcript' : 'audio')
  const [dragProgress, setDragProgress] = useState(null)
  const [showAudioNotice, setShowAudioNotice] = useState(false)
  const [autoRevealInvite, setAutoRevealInvite] = useState(false)
  const [promptedRevealInvite, setPromptedRevealInvite] = useState(false)
  const [focusReveal, setFocusReveal] = useState(false)
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

  useEffect(() => {
    const showInvite = hasReconstruction && (forceRevealInvite || !hasSeenThresholdRevealTutorial())
    setAutoRevealInvite(showInvite)
    setPromptedRevealInvite(false)
    setFocusReveal(false)
  }, [forceRevealInvite, hasReconstruction, waypointId])

  const dismissRevealInvite = useCallback(() => {
    if (autoRevealInvite) markThresholdRevealTutorialSeen()
    setAutoRevealInvite(false)
    setPromptedRevealInvite(false)
  }, [autoRevealInvite])

  const handleThresholdHelp = useCallback(() => {
    if (autoRevealInvite && !promptedRevealInvite) {
      setPromptedRevealInvite(true)
      return
    }
    setPromptedRevealInvite((prev) => !prev)
  }, [autoRevealInvite, promptedRevealInvite])

  const handleRevealHoldStart = useCallback(() => {
    if (!hasReconstruction) return

    if (autoRevealInvite || promptedRevealInvite) {
      markThresholdRevealTutorialSeen()
      setAutoRevealInvite(false)
      setPromptedRevealInvite(false)
    }

    setFocusReveal(true)
  }, [autoRevealInvite, hasReconstruction, promptedRevealInvite])

  const handleRevealHoldEnd = useCallback(() => {
    setFocusReveal(false)
  }, [])

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

  const reading = tab === 'transcript'
  const subtitle = tagline ?? chapterTitle
  const showContinuity = Boolean(onStoryComplete)
  const continuityLabel =
    continueLabel ??
    (storyEnded || !narrationPlaying ? 'Continue walking →' : 'Skip ahead →')
  const chromeHidden = focusReveal
  const showRevealInvite =
    hasReconstruction && !chromeHidden && (autoRevealInvite || promptedRevealInvite)
  const revealInviteInteractive = promptedRevealInvite

  const tabBar = (
    <div
      style={{
        display: 'flex',
        gap: 24,
        borderBottom: `1px solid ${T.ink800}`,
        marginBottom: reading ? 8 : 10,
        flexShrink: 0,
      }}
    >
      {[['audio', 'audio'], ['transcript', 'Read instead']].map(([t, label]) => (
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
  )

  const scrubber = (compact = false) => (
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
        height: compact ? 28 : 40,
        marginBottom: compact ? 2 : 6,
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
            height: compact ? Math.max(6, h * 0.45) : h,
            borderRadius: 1,
            pointerEvents: 'none',
            background: i / bars.length < progress ? accent : `${T.muted}35`,
            boxShadow: i / bars.length < progress ? `0 0 4px ${accent}60` : 'none',
          }}
        />
      ))}
    </div>
  )

  const timeRow = (compact = false) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: compact ? 8 : 12,
        flexShrink: 0,
      }}
    >
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
            padding: compact ? '3px 10px' : '4px 12px',
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
        {duration > 0 ? formatTime(duration) : narrationPlaying ? 'Playing' : 'Paused'}
      </span>
    </div>
  )

  const transportControls = (compact = false) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 20 : 28,
        marginBottom: compact ? 0 : 14,
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
        <SkipBack size={compact ? 22 : 24} />
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: T.muted, pointerEvents: 'none' }}>15</span>
      </button>
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={!audioAvailable}
        aria-label={narrationPlaying ? 'Pause' : 'Play'}
        style={{
          width: compact ? 52 : 60,
          height: compact ? 52 : 60,
          borderRadius: compact ? 26 : 30,
          background: T.ember,
          border: 'none',
          cursor: audioAvailable ? 'pointer' : 'default',
          opacity: audioAvailable ? 1 : 0.4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 22px rgba(232,161,60,0.5)',
        }}
      >
        {narrationPlaying ? (
          <Pause size={compact ? 22 : 24} fill={T.obsidian} color={T.obsidian} />
        ) : (
          <Play size={compact ? 22 : 24} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 3 }} />
        )}
      </button>
      <button
        type="button"
        onClick={onSkipForward}
        disabled={!audioAvailable}
        aria-label="Forward 15 seconds"
        style={{ color: T.muted, background: 'none', border: 'none', cursor: audioAvailable ? 'pointer' : 'default', lineHeight: 0, opacity: audioAvailable ? 1 : 0.35, position: 'relative' }}
      >
        <SkipForward size={compact ? 22 : 24} />
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: T.muted, pointerEvents: 'none' }}>15</span>
      </button>
    </div>
  )

  const audioPlayerBlock = (compact = false) => (
    <>
      {scrubber(compact)}
      {timeRow(compact)}
      {transportControls(compact)}
    </>
  )

  const heroLayer = hasReconstruction ? (
    <div className="cw-waypoint-immersive__threshold">
      <C7Threshold
        embedded
        immersive
        waypointId={waypointId}
        waypointName={title}
        nowPhoto={photo}
        thenPhoto={thenPhoto ?? photo}
        thenLoop={thenLoop}
        thenLabel={thenLabel}
        honestyCaption={honestyCaption ?? undefined}
        nowAmbienceUrl={nowAmbienceUrl}
        thenSoundscapeUrl={thenSoundscapeUrl}
        hideUi={chromeHidden}
        onHoldStart={handleRevealHoldStart}
        onHoldEnd={handleRevealHoldEnd}
        onCrossed={onThresholdCross}
      />
    </div>
  ) : (
    <div
      className="cw-waypoint-immersive__photo"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${photo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 28%',
      }}
    />
  )

  return (
    <div
      className={[
        'cw-waypoint-immersive',
        chromeHidden ? 'cw-waypoint-immersive--focus' : '',
        reading ? 'cw-waypoint-immersive--reading' : '',
        showContinuity ? 'cw-waypoint-immersive--with-continuity' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        background: T.obsidian,
        height: '100%',
        fontFamily: F.body,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <div className="cw-waypoint-immersive__hero">
        {heroLayer}

        {showRevealInvite ? (
          <ThresholdRevealInvite
            thenLabel={thenLabel}
            accent={accent}
            interactive={revealInviteInteractive}
            onDismiss={dismissRevealInvite}
          />
        ) : null}

        <div className="cw-waypoint-immersive__hero-scrim cw-waypoint-immersive__chrome" aria-hidden />
        <div className="cw-waypoint-immersive__chrome">
          <Vignette />
        </div>

        <div
          className="cw-waypoint-immersive__topbar cw-waypoint-immersive__chrome"
          style={{
            position: 'absolute',
            top: 'max(12px, env(safe-area-inset-top))',
            left: 16,
            right: 16,
            zIndex: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              color: T.warmWhite,
              background: 'rgba(22,19,15,0.45)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              borderRadius: 999,
              padding: '6px 10px 6px 6px',
              cursor: 'pointer',
              fontFamily: F.body,
              fontSize: 13,
              pointerEvents: 'auto',
            }}
          >
            <ChevronLeft size={17} /> Back
          </button>
          {hasReconstruction ? (
            <button
              type="button"
              data-testid="threshold-help"
              aria-label="How to cross the threshold"
              onClick={handleThresholdHelp}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                border: `1px solid rgba(245,240,232,0.35)`,
                background: 'rgba(22,19,15,0.55)',
                backdropFilter: 'blur(8px)',
                color: T.warmWhite,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: F.body,
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1,
                pointerEvents: 'auto',
              }}
            >
              ?
            </button>
          ) : null}
        </div>

        <div className="cw-waypoint-immersive__hero-title cw-waypoint-immersive__chrome">
          <Eyebrow color={accent}>{actLabel}</Eyebrow>
          <h2
            style={{
              fontFamily: F.display,
              fontSize: 34,
              color: T.warmWhite,
              fontWeight: 300,
              lineHeight: 1.05,
              margin: '8px 0 4px',
            }}
          >
            {title}
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
            {subtitle}
          </p>
        </div>
      </div>

      {reading ? (
        <div className="cw-waypoint-immersive__read-layer cw-waypoint-immersive__chrome">
          <div className="cw-waypoint-immersive__read-tabs">{tabBar}</div>
          <div className="cw-waypoint-immersive__read-body">
            <div className="cw-waypoint-immersive__read-scroll">
              {transcriptAvailable && transcript ? (
                <KaraokeTranscript
                  transcript={transcript}
                  currentTime={currentTime}
                  duration={duration}
                  playing={narrationPlaying}
                  accent={accent}
                  fontSize={transcriptFontSize + 2}
                  readingMode
                  testId="story-karaoke-transcript"
                />
              ) : (
                <p style={{ fontFamily: F.body, fontSize: 14, color: T.muted, fontStyle: 'italic', margin: 0 }}>
                  {import.meta.env.DEV
                    ? 'No written transcript is wired for this stop yet (development).'
                    : 'A written transcript for this stop is coming soon.'}
                </p>
              )}
            </div>
          </div>
          <div className="cw-waypoint-immersive__read-footer">
            {audioPlayerBlock(true)}
          </div>
        </div>
      ) : (
      <div
        className={`cw-waypoint-immersive__panel cw-waypoint-immersive__chrome${showContinuity ? ' cw-waypoint-immersive__panel--with-continuity' : ''}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: showContinuity
            ? '8px 24px 10px'
            : `8px 24px max(12px, ${SHELL_SAFE_BOTTOM_INSET})`,
        }}
      >
        {audioPlayerBlock(false)}

        {showAudioNotice ? (
          <p style={{ margin: '0 0 10px', fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 1.5, flexShrink: 0 }}>
            {import.meta.env.DEV
              ? 'Narration audio is unavailable in this development build.'
              : 'Narration is preparing — check your connection.'}
          </p>
        ) : null}

        {tabBar}

        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: '0 0 8px', flexShrink: 0 }}>
          Chapter {chapterIndex + 1} of {chapterCount}
          {chapterTitle ? (
            <>
              {' '}
              · <span style={{ color: T.warmWhite }}>{chapterTitle}</span>
            </>
          ) : null}
        </p>
      </div>
      )}

      {sourceNote && hasReconstruction ? (
        <p className="cw-waypoint-immersive__source-note cw-waypoint-immersive__chrome" aria-label="Reconstruction source">
          {sourceNote}
        </p>
      ) : null}

      {showContinuity ? (
        <div className="cw-waypoint-immersive__continuity cw-waypoint-immersive__chrome">
          <button
            type="button"
            data-testid="story-continue"
            onClick={onStoryComplete}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: T.ember,
              color: T.obsidian,
              fontFamily: F.body,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 24px rgba(232,161,60,0.4)',
            }}
          >
            {continuityLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
