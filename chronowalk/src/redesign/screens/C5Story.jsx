import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipForward, Volume2, ChevronRight } from 'lucide-react'
import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Eyebrow, Seam } from '../ui/index.js'

export default function C5Story({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  actNumeral = 'I',
  signatureLine: sigLine = 'The concrete is still crystallizing.',
  chapters = ['The Beast Awakens', 'Fifty Thousand Witnesses', 'The Concrete Memory'],
  narrationPlaying = false,
  onTogglePlay,
  onOpenThreshold,
  onStoryComplete,
  hasReconstruction = true,
  onOpenSettings,
  onSkipForward,
}) {
  const [chapter, setChapter] = useState(0)
  const [tab, setTab] = useState('audio')
  const [reflecting, setReflecting] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  const reflectTimer = useRef(null)

  useEffect(() => {
    if (!reflecting) {
      setShowContinue(false)
      return undefined
    }
    reflectTimer.current = setTimeout(() => setShowContinue(true), 4000)
    return () => {
      if (reflectTimer.current) clearTimeout(reflectTimer.current)
    }
  }, [reflecting])

  const handleContinue = () => {
    setReflecting(false)
    setShowContinue(false)
    onStoryComplete?.()
  }

  return (
    <div
      style={{
        background: T.obsidian,
        height: '100%',
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 10%',
          filter: 'brightness(0.18) saturate(0.6)',
          zIndex: 0,
        }}
      />

      <div
        style={{ position: 'relative', flexShrink: 0, height: '44%', cursor: hasReconstruction ? 'pointer' : 'default', userSelect: 'none', zIndex: 5 }}
        onClick={hasReconstruction ? onOpenThreshold : undefined}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${photo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 25%',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,11,13,0.2)' }} />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(to top, rgba(11,11,13,0.95) 0%, transparent 100%)',
          }}
        />
        <Seam />
        {hasReconstruction ? (
          <>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 44,
                height: 44,
                borderRadius: 22,
                border: `1.5px solid ${T.ember}`,
                boxShadow: '0 0 12px rgba(232,161,60,0.4)',
                transform: 'translate(-50%, -50%)',
                opacity: 0.5,
                animation: 'seamBreathe 3s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 6,
              }}
            />
            <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center', zIndex: 6 }}>
              <span style={{ fontSize: 10, color: `${T.bone}88`, letterSpacing: '0.1em' }}>Press and hold to cross</span>
            </div>
          </>
        ) : null}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px 8px', position: 'relative', zIndex: 5, overflow: 'hidden' }}>
        <Eyebrow color={accent}>ACT {actNumeral}</Eyebrow>
        <h2 style={{ fontFamily: F.display, fontSize: 40, color: T.warmWhite, fontWeight: 300, lineHeight: 1.05, margin: '10px 0 3px' }}>
          {title}
        </h2>
        <p style={{ fontFamily: F.display, fontSize: 14, color: T.muted, fontStyle: 'italic', marginBottom: 12 }}>
          {chapters[chapter]}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {chapters.map((_, i) => (
            <div
              key={i}
              onClick={() => setChapter(i)}
              style={{
                width: i === chapter ? 22 : 8,
                height: 8,
                borderRadius: 4,
                background: i < chapter ? T.ember : i === chapter ? accent : T.ink800,
                transition: 'width 300ms, background 300ms',
                cursor: 'pointer',
                boxShadow: i === chapter ? `0 0 8px ${accent}80` : 'none',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <button
            type="button"
            onClick={onTogglePlay}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              background: accent,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${accent}55`,
            }}
          >
            {narrationPlaying ? (
              <Pause size={22} fill={T.obsidian} color={T.obsidian} />
            ) : (
              <Play size={22} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 3 }} />
            )}
          </button>
          <button
            type="button"
            onClick={() => (onSkipForward ? onSkipForward() : setChapter((current) => Math.min(current + 1, chapters.length - 1)))}
            style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0 }}
          >
            <SkipForward size={22} />
          </button>
          <button
            type="button"
            onClick={() => (onOpenSettings ? onOpenSettings() : undefined)}
            style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 0, marginLeft: 'auto' }}
          >
            <Volume2 size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${T.ink800}`, marginBottom: 10 }}>
          {['audio', 'transcript'].map((t) => (
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
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {tab === 'transcript' ? (
            <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.75 }}>
              &ldquo;{sigLine}&rdquo;
            </p>
          ) : (
            <p style={{ fontSize: 12, color: T.muted }}>
              Chapter {chapter + 1} of {chapters.length} · {narrationPlaying ? 'Playing' : 'Paused'}
              {narrationPlaying ? <span style={{ color: accent }}> ●</span> : null}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setReflecting(true)
            setShowContinue(false)
          }}
          style={{
            alignSelf: 'flex-start',
            fontSize: 10,
            color: `${T.muted}70`,
            background: 'none',
            border: `1px solid ${T.ink800}`,
            borderRadius: 6,
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: F.body,
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Complete chapter
        </button>
      </div>

      {reflecting ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: T.obsidian,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInUp 500ms ease-out',
          }}
        >
          <p
            style={{
              fontFamily: F.display,
              fontSize: 26,
              fontStyle: 'italic',
              fontWeight: 300,
              color: T.warmWhite,
              lineHeight: 1.5,
              textAlign: 'center',
              padding: '0 48px',
            }}
          >
            {sigLine}
          </p>
          <button
            type="button"
            onClick={handleContinue}
            style={{
              position: 'absolute',
              bottom: 'max(64px, calc(env(safe-area-inset-bottom) + 40px))',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: F.body,
              fontSize: 15,
              color: `${T.warmWhite}CC`,
              letterSpacing: '0.06em',
              opacity: showContinue ? 1 : 0,
              transition: 'opacity 700ms ease',
              pointerEvents: showContinue ? 'auto' : 'none',
            }}
          >
            Continue
          </button>
        </div>
      ) : null}
    </div>
  )
}
