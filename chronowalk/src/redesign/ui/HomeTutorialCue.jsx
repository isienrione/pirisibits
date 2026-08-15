import { BookOpen, Hand, MapPinned, Pause, Play, Settings } from 'lucide-react'
import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

/**
 * Soft miniature of the real Home / walk control each tutorial step refers to.
 * Decorative only (aria-hidden); copy carries the instruction.
 */
export default function HomeTutorialCue({ phase, accent }) {
  const t = useT()

  return (
    <div className="cw-home-tutorial-cue" aria-hidden data-testid={`home-tutorial-cue-${phase}`}>
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
  return (
    <CueFrame style={{ padding: 10 }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 220,
          height: 64,
          borderRadius: 12,
          overflow: 'hidden',
          background: `linear-gradient(120deg, #C4B8A4 0%, ${accent}66 48%, #7A8A6A 100%)`,
        }}
      >
        <div
          className="cw-home-tutorial-cue__reveal-seam"
          style={{
            position: 'absolute',
            inset: '0 auto 0 42%',
            width: 3,
            background: 'rgba(255,253,248,0.85)',
            boxShadow: '0 0 12px rgba(255,253,248,0.55)',
          }}
        />
        <span
          className="cw-home-tutorial-cue__finger"
          style={{
            position: 'absolute',
            right: 18,
            bottom: 10,
            width: 28,
            height: 28,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(11,11,13,0.55)',
            color: T.warmWhite,
            backdropFilter: 'blur(4px)',
          }}
        >
          <Hand size={14} aria-hidden />
        </span>
      </div>
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
