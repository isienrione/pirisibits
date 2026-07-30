import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, Settings, X } from 'lucide-react'
import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, Eyebrow } from '../ui/index.js'
import ThresholdDiegeticHint from '../ui/ThresholdDiegeticHint.jsx'
import KaraokeTranscript from '../ui/KaraokeTranscript.jsx'
import C7Threshold from './C7Threshold.jsx'
import { formatPlaybackSpeed } from '../../utils/appPreferences.js'
import { useAppPreferences, transcriptFontSizePx } from '../../hooks/useAppPreferences.js'
import {
  hasCrossedThreshold,
  markThresholdCrossed,
} from '../../utils/thresholdWaypointReveal.js'
import { OfflineMediaImg } from '../../components/OfflineMediaImg.jsx'

// Default speeds (must include 1.5× and 2×).
const DEFAULT_SPEEDS = [0.8, 1, 1.2, 1.5, 2]
const BRIEF_RING_MS = 1500

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Unified waypoint view · full-bleed landmark + then/now threshold, audio below.
 * Matches the Pantheon free-preview layout for every stop.
 */
export default function C6ImmersivePlayer({
  accent = T.actI,
  actLabel = 'ACT I · THE ARENA',
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
  onOpenSettings = null,
  onThresholdCross,
  onOpenThreshold,
  onViewImages,
  /** Shared-walk HUD rendered above the next-step CTA (in flow, not as an overlay). */
  syncSlot = null,
  /** Force the first-run ring + text even if the traveler has crossed before (QA / free preview). */
  forceDiegeticHint = false,
  /** @deprecated Prefer forceDiegeticHint */
  forceRevealInvite = false,
  suppressAutoRevealInvite = false,
  /** Landing demo: loop a full Threshold hold reveal. */
  demoAutoReveal = false,
}) {
  const { prefs } = useAppPreferences()
  const transcriptFontSize = transcriptFontSizePx(prefs.textSize)
  const [tab, setTab] = useState(initialTab === 'transcript' ? 'transcript' : 'audio')
  const [dragProgress, setDragProgress] = useState(null)
  const [showAudioNotice, setShowAudioNotice] = useState(false)
  const [focusReveal, setFocusReveal] = useState(false)
  const [revealLatched, setRevealLatched] = useState(false)
  const [photoLightboxOpen, setPhotoLightboxOpen] = useState(false)
  /** 'full' = ring + text · 'ring' = brief fading ring · 'hidden' */
  const [hintMode, setHintMode] = useState('hidden')
  const [hintFading, setHintFading] = useState(false)
  const seekTrackRef = useRef(null)
  const briefRingTimerRef = useRef(null)
  const bars = useRef(Array.from({ length: 48 }, () => 8 + Math.random() * 28)).current

  const forceHint = forceDiegeticHint || forceRevealInvite
  const alreadyCrossed = !forceHint && hasCrossedThreshold()
  const autoPeek =
    !demoAutoReveal &&
    hasReconstruction &&
    !suppressAutoRevealInvite &&
    (forceHint || !alreadyCrossed)
  const liveProgress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0
  const progress = dragProgress ?? liveProgress
  const canSeek = typeof onSeek === 'function' && duration > 0 && audioAvailable
  const displayTime = dragProgress != null ? dragProgress * duration : currentTime

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
    if (briefRingTimerRef.current != null) {
      window.clearTimeout(briefRingTimerRef.current)
      briefRingTimerRef.current = null
    }

    setFocusReveal(false)
    setRevealLatched(false)
    setHintFading(false)

    if (!hasReconstruction || suppressAutoRevealInvite) {
      setHintMode('hidden')
      return undefined
    }

    const crossed = !forceHint && hasCrossedThreshold()
    if (forceHint || !crossed) {
      setHintMode('full')
      return undefined
    }

    // Later thresholds: brief fading ring only (or nothing if storage failed → still ring).
    setHintMode('ring')
    briefRingTimerRef.current = window.setTimeout(() => {
      setHintFading(true)
      briefRingTimerRef.current = window.setTimeout(() => {
        setHintMode('hidden')
        setHintFading(false)
        briefRingTimerRef.current = null
      }, 420)
    }, BRIEF_RING_MS)

    return () => {
      if (briefRingTimerRef.current != null) {
        window.clearTimeout(briefRingTimerRef.current)
        briefRingTimerRef.current = null
      }
    }
  }, [forceHint, hasReconstruction, suppressAutoRevealInvite, waypointId])

  const dismissDiegeticHint = useCallback(() => {
    markThresholdCrossed()
    setHintFading(true)
    window.setTimeout(() => {
      setHintMode('hidden')
      setHintFading(false)
    }, 380)
  }, [])

  const handleNowTap = useCallback(() => {
    setPhotoLightboxOpen(true)
  }, [])

  const handleRevealHoldStart = useCallback(() => {
    if (!hasReconstruction) return
    setRevealLatched(false)
    setFocusReveal(true)
    if (hintMode !== 'hidden') dismissDiegeticHint()
  }, [dismissDiegeticHint, hasReconstruction, hintMode])

  const handleRevealHoldEnd = useCallback(
    (detail) => {
      setFocusReveal(false)
      const latched = Boolean(detail?.latched)
      setRevealLatched(latched)
      if (latched || detail?.via === 'pill') {
        markThresholdCrossed()
        if (hintMode !== 'hidden') dismissDiegeticHint()
      }
    },
    [dismissDiegeticHint, hintMode],
  )

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
  const showActionStack = showContinuity || Boolean(syncSlot)
  const continuityLabel =
    continueLabel ??
    (storyEnded || !narrationPlaying ? 'Continue walking →' : 'Skip ahead →')
  const chromeHidden = focusReveal
  const showDiegeticHint =
    hasReconstruction && !chromeHidden && !revealLatched && hintMode !== 'hidden'

  const tabBar = (
    <div
      className="cw-waypoint-immersive__mode-tabs"
      style={{
        display: 'flex',
        gap: 24,
        borderBottom: `1px solid ${T.ink800}`,
        marginBottom: reading ? 8 : 10,
        flexShrink: 0,
      }}
    >
      {[['audio', 'Audio'], ['transcript', 'Read instead']].map(([t, label]) => (
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

  const chapterMeta = (
    <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: '0 0 8px', flexShrink: 0 }}>
      Chapter {chapterIndex + 1} of {chapterCount}
      {chapterTitle ? (
        <>
          {': '}
          <span style={{ color: T.warmWhite }}>{chapterTitle}</span>
        </>
      ) : null}
    </p>
  )

  const sourceNoteInline =
    sourceNote && hasReconstruction ? (
      <p
        className="cw-waypoint-immersive__source-note-inline"
        style={{
          fontSize: 11,
          lineHeight: 1.4,
          color: 'rgba(245,240,232,0.45)',
          margin: '0 0 10px',
          flexShrink: 0,
        }}
      >
        {sourceNote}
      </p>
    ) : null

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
        autoPeek={autoPeek}
        demoAutoReveal={demoAutoReveal}
        onHoldStart={handleRevealHoldStart}
        onHoldEnd={handleRevealHoldEnd}
        onNowTap={handleNowTap}
        onCrossed={onThresholdCross}
      />
    </div>
  ) : (
    <div
      className="cw-waypoint-immersive__photo"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: T.obsidian,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const relX = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 1
        if (relX < 0.5) setPhotoLightboxOpen(true)
      }}
    >
      {/* <img> (not CSS background) so OfflineMediaImg can recover from bad blobs. */}
      <OfflineMediaImg
        src={photo}
        alt={title}
        data-testid="waypoint-immersive-photo"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 28%',
          display: 'block',
        }}
      />
    </div>
  )

  return (
    <div
      className={[
        'cw-waypoint-immersive',
        chromeHidden ? 'cw-waypoint-immersive--focus' : '',
        reading ? 'cw-waypoint-immersive--reading' : '',
        showContinuity ? 'cw-waypoint-immersive--with-continuity' : '',
        showActionStack ? 'cw-waypoint-immersive--with-action-stack' : '',
        syncSlot ? 'cw-waypoint-immersive--with-sync' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="waypoint-immersive"
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
      <div className="cw-waypoint-immersive__stage" data-testid="immersive-stage">
        <div className="cw-waypoint-immersive__hero">
          {heroLayer}

          {showDiegeticHint ? (
            <ThresholdDiegeticHint
              thenLabel={thenLabel}
              showText={hintMode === 'full'}
              fading={hintFading}
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
              top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
              left: 16,
              // Keep the right edge clear for the DEV QA badge (fixed top-right).
              right: 64,
              zIndex: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
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
                minHeight: 44,
                color: T.warmWhite,
                background: 'rgba(11,11,13,0.45)',
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
              <ChevronLeft size={17} aria-hidden /> Back
            </button>
            {typeof onOpenSettings === 'function' ? (
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Open settings"
                data-testid="journey-open-settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  minHeight: 44,
                  color: T.warmWhite,
                  background: 'rgba(11,11,13,0.45)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  borderRadius: 999,
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  flexShrink: 0,
                  marginRight: 'max(0px, calc(env(safe-area-inset-right) - 8px))',
                }}
              >
                <Settings size={18} aria-hidden />
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
            className={`cw-waypoint-immersive__panel cw-waypoint-immersive__chrome${showContinuity ? ' cw-waypoint-immersive__panel--with-continuity cw-waypoint-immersive__panel--preview-flow' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: showContinuity ? '8px 24px 10px' : undefined,
            }}
          >
            {showContinuity ? (
              <>
                {tabBar}
                {chapterMeta}
                {sourceNoteInline}
                {audioPlayerBlock(true)}
              </>
            ) : (
              <>
                {audioPlayerBlock(false)}

                {showAudioNotice ? (
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 1.5, flexShrink: 0 }}>
                    {import.meta.env.DEV
                      ? 'Narration audio is unavailable in this development build.'
                      : 'Narration is preparing · check your connection.'}
                  </p>
                ) : null}

                {tabBar}
                {chapterMeta}
              </>
            )}
          </div>
        )}

        {sourceNote && hasReconstruction && !showContinuity ? (
          <p className="cw-waypoint-immersive__source-note cw-waypoint-immersive__chrome" aria-label="Reconstruction source">
            {sourceNote}
          </p>
        ) : null}
      </div>

      {showActionStack ? (
        <div
          className="cw-waypoint-immersive__action-stack"
          data-testid="immersive-action-stack"
        >
          {syncSlot ? (
            <div className="cw-waypoint-immersive__sync-slot" data-testid="immersive-sync-slot">
              {syncSlot}
            </div>
          ) : null}
          {showContinuity ? (
            <div className="cw-waypoint-immersive__continuity">
              <button
                type="button"
                data-testid="story-continue"
                className="cw-wc-pressable"
                onClick={onStoryComplete}
                style={{
                  width: '100%',
                  minHeight: 44,
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  background: T.terracotta,
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
      ) : null}

      {photoLightboxOpen ? (
        <div
          data-testid="now-photo-lightbox"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setPhotoLightboxOpen(false)}
        >
          <OfflineMediaImg
            src={photo}
            alt={title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
          <button
            type="button"
            aria-label="Close photo view"
            onClick={(e) => { e.stopPropagation(); setPhotoLightboxOpen(false) }}
            style={{
              position: 'absolute',
              top: 'max(16px, env(safe-area-inset-top))',
              right: 'max(16px, env(safe-area-inset-right))',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(11,11,13,0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(245,240,232,0.2)',
              color: T.warmWhite,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  )
}
