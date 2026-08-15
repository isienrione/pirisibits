import { useState } from 'react'
import { BookOpen, Hand, MapPinned, Pause, Play, Settings } from 'lucide-react'
import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Soft miniature of the real Home / walk control each tutorial step refers to.
 * Reveal step is interactive (press & hold practice); other cues stay decorative.
 */
export default function HomeTutorialCue({ phase, accent }) {
  const t = useT()
  const interactive = phase === 'reveal'

  return (
    <div
      className="cw-home-tutorial-cue"
      aria-hidden={interactive ? undefined : true}
      data-testid={`home-tutorial-cue-${phase}`}
    >
      {phase === 'walk' ? <WalkCue accent={accent} /> : null}
      {phase === 'arrive' ? <ArriveCue accent={accent} label={t('walk.here')} /> : null}
      {phase === 'listen' ? <ListenCue /> : null}
      {phase === 'transcript' ? <TranscriptCue accent={accent} label={t('walk.audio.read')} /> : null}
      {phase === 'continue' ? (
        <ContinueCue accent={accent} label={t('walk.continue').replace(/\s*→\s*$/, '')} />
      ) : null}
      {phase === 'reveal' ? <RevealCue accent={accent} /> : null}
      {phase === 'settings' ? <SettingsCue accent={accent} /> : null}
    </div>
  )
}

function CueFrame({ children, style }) {
  return (
    <div
      className="cw-home-tutorial-cue__frame"
      style={{
        marginTop: 18,
        borderRadius: 16,
        border: `1px solid #E9E2D5`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(243,237,227,0.9) 100%)',
        padding: '14px 16px',
        display: 'grid',
        placeItems: 'center',
        minHeight: 78,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function WalkCue({ accent }) {
  return (
    <CueFrame>
      <div
        style={{
          width: '100%',
          maxWidth: 220,
          height: 52,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${accent}18 0%, #E8E0D4 55%, ${accent}28 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg
          width="100%"
          height="52"
          viewBox="0 0 220 52"
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <path
            className="cw-home-tutorial-cue__route"
            d="M12 40 C 48 12, 78 44, 110 22 S 170 8, 208 28"
            fill="none"
            stroke={accent}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="cw-home-tutorial-cue__dot"
          style={{
            position: 'absolute',
            left: '48%',
            top: '38%',
            width: 10,
            height: 10,
            borderRadius: 999,
            background: accent,
            boxShadow: `0 0 0 4px ${accent}33`,
          }}
        />
        <MapPinned
          size={14}
          color={accent}
          style={{ position: 'absolute', right: 10, top: 8 }}
          strokeWidth={2}
        />
      </div>
    </CueFrame>
  )
}

function ArriveCue({ accent, label }) {
  return (
    <CueFrame>
      <div
        className="cw-home-tutorial-cue__pulse"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 44,
          padding: '0 18px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 72%, ${T.ink}) 100%)`,
          color: T.warmWhite,
          fontFamily: F.body,
          fontWeight: 650,
          fontSize: 14,
          boxShadow: `0 8px 20px ${accent}44`,
        }}
      >
        <MapPinned size={16} aria-hidden strokeWidth={2} />
        {label}
      </div>
    </CueFrame>
  )
}

function ListenCue() {
  return (
    <CueFrame>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span
          className="cw-home-tutorial-cue__pulse"
          style={{
            width: 52,
            height: 52,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            background: `linear-gradient(145deg, ${T.gold} 0%, #E8A13C 100%)`,
            color: T.ink,
            boxShadow: `0 8px 22px ${T.gold}55`,
          }}
        >
          <Play size={22} fill="currentColor" strokeWidth={0} style={{ marginLeft: 2 }} />
        </span>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            background: '#F3EDE3',
            border: `1px solid #E9E2D5`,
            color: T.ink,
            opacity: 0.72,
          }}
        >
          <Pause size={16} />
        </span>
      </div>
    </CueFrame>
  )
}

function TranscriptCue({ accent, label }) {
  return (
    <CueFrame>
      <div
        className="cw-home-tutorial-cue__soft"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 999,
          border: `1px solid ${accent}55`,
          background: `${accent}14`,
          color: T.ink,
          fontFamily: F.body,
          fontWeight: 650,
          fontSize: 13,
        }}
      >
        <BookOpen size={15} color={accent} aria-hidden />
        {label}
      </div>
    </CueFrame>
  )
}

function ContinueCue({ accent, label }) {
  return (
    <CueFrame>
      <div
        className="cw-home-tutorial-cue__soft"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 44,
          padding: '0 16px',
          borderRadius: 12,
          width: 'min(100%, 240px)',
          background: T.ink,
          color: T.warmWhite,
          fontFamily: F.body,
          fontWeight: 650,
          fontSize: 14,
          boxShadow: `0 8px 18px ${accent}33`,
        }}
      >
        {label}
      </div>
    </CueFrame>
  )
}

function RevealCue({ accent }) {
  const t = useT()
  const [holding, setHolding] = useState(false)

  const startHold = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setHolding(true)
  }

  const endHold = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    setHolding(false)
  }

  return (
    <CueFrame style={{ padding: 10, width: '100%' }}>
      <button
        type="button"
        data-testid="home-tutorial-reveal-practice"
        aria-pressed={holding}
        aria-label={t('home.tutorial.reveal.practiceAria')}
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        onContextMenu={(event) => event.preventDefault()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 280,
          height: 118,
          borderRadius: 14,
          overflow: 'hidden',
          border: `1.5px solid ${holding ? accent : '#E9E2D5'}`,
          padding: 0,
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          boxShadow: holding ? `0 10px 24px ${accent}44` : '0 4px 14px rgba(11,11,13,0.08)',
          background: '#E8E0D4',
        }}
      >
        <svg
          viewBox="0 0 280 118"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
          style={{ display: 'block', position: 'absolute', inset: 0 }}
        >
          {/* NOW: ruined arches */}
          <rect width="280" height="118" fill="#D9CFC0" />
          <path d="M0 92 H280 V118 H0 Z" fill="#C4B8A4" />
          <path d="M28 92 V48 H52 V92 Z" fill="#A89A88" />
          <path d="M70 92 V38 Q96 18 122 38 V92 Z" fill="#B5A794" />
          <path d="M148 92 V52 H174 V92 Z" fill="#A89A88" />
          <path d="M196 92 V42 Q224 22 252 42 V92 Z" fill="#B5A794" />
          <circle cx="48" cy="28" r="10" fill="#E8A13C55" />
          <text x="12" y="18" fill="#5A534A" fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="700">
            {t('journal.now')}
          </text>
        </svg>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: holding ? 'inset(0 0 0 0)' : 'inset(0 0 0 100%)',
            transition: 'clip-path 220ms ease',
          }}
        >
          <svg
            viewBox="0 0 280 118"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            style={{ display: 'block' }}
          >
            {/* THEN: rebuilt colonnade */}
            <rect width="280" height="118" fill="#E8D7B8" />
            <path d="M0 96 H280 V118 H0 Z" fill="#C9B896" />
            <path d="M24 96 V34 H44 V96 Z" fill="#F2E6CF" />
            <path d="M56 96 V28 Q84 8 112 28 V96 Z" fill="#FFF6E4" />
            <path d="M124 96 V34 H144 V96 Z" fill="#F2E6CF" />
            <path d="M156 96 V28 Q184 8 212 28 V96 Z" fill="#FFF6E4" />
            <path d="M224 96 V34 H244 V96 Z" fill="#F2E6CF" />
            <path d="M20 34 H248 V28 H20 Z" fill={accent} opacity="0.85" />
            <circle cx="236" cy="22" r="12" fill="#E8A13C66" />
            <text x="12" y="18" fill="#211C15" fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="700">
              {t('journal.then')}
            </text>
          </svg>
        </div>

        <span
          style={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(11,11,13,0.62)',
            color: T.warmWhite,
            fontFamily: F.body,
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          <Hand size={13} aria-hidden />
          {holding ? t('home.tutorial.reveal.holdingHint') : t('home.tutorial.reveal.holdHint')}
        </span>
      </button>
    </CueFrame>
  )
}

function SettingsCue({ accent }) {
  const t = useT()
  return (
    <CueFrame>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <span
          className="cw-home-tutorial-cue__pulse"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            border: '1.5px solid rgba(44,40,35,0.35)',
            background: 'rgba(11,11,13,0.82)',
            color: T.warmWhite,
            boxShadow: `0 8px 20px ${accent}33`,
          }}
        >
          <Settings size={22} strokeWidth={1.9} />
        </span>
        <span
          style={{
            fontFamily: F.body,
            fontSize: 12,
            fontWeight: 650,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#B9AF9C',
          }}
        >
          {t('home.tutorial.settings.cueHints')}
        </span>
      </div>
    </CueFrame>
  )
}
