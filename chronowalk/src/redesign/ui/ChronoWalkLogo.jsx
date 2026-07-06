import { useId, useMemo } from 'react'
import { T, F } from '../tokens.js'
import { severusNow } from '../images.js'

const TEMPLE_PATH =
  'M38 78 L38 58 L46 50 L54 58 L54 78 M66 78 L66 58 L74 50 L82 58 L82 78 M32 78 L88 78 M42 50 L60 36 L78 50'

/**
 * ChronoWalk brand mark — faint monument inside a circle, vertical seam of light/fire.
 * Modes: static | breathe | welcome (phased draw) | descend (seam 0→1)
 */
export default function ChronoWalkLogo({
  size = 120,
  monumentPhoto = severusNow,
  monumentOpacity = 0.08,
  mode = 'breathe',
  phase = 2,
  seamPct = 1,
  showWordmark = false,
  className = '',
  style = {},
}) {
  const uid = useId().replace(/:/g, '')
  const view = 120
  const cx = 60
  const cy = 60
  const r = 52
  const circumference = 2 * Math.PI * r
  const seamLen = 104

  const circleOffset = useMemo(() => {
    if (mode === 'welcome') return phase >= 0 ? 0 : circumference
    return 0
  }, [mode, phase, circumference])

  const spectrumOffset = mode === 'welcome' && phase >= 1 ? 0 : seamLen
  const emberOpacity = mode === 'welcome' ? (phase >= 2 ? 1 : 0) : 1
  const spectrumOpacity = mode === 'welcome' && phase >= 2 ? 0 : mode === 'welcome' ? 1 : 0

  const seamHeight = mode === 'descend' ? seamPct : 1
  const breatheClass = mode === 'breathe' ? 'cw-logo-seam-breathe' : ''

  return (
    <div
      className={`cw-brand-mark ${className}`.trim()}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${view} ${view}`}
        aria-hidden="true"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <clipPath id={`${uid}-clip`}>
            <circle cx={cx} cy={cy} r={r - 4} />
          </clipPath>
          <linearGradient id={`${uid}-spec`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E4552E" />
            <stop offset="17%" stopColor="#E8A13C" />
            <stop offset="34%" stopColor="#7C9A5C" />
            <stop offset="50%" stopColor="#4E9B8F" />
            <stop offset="67%" stopColor="#4E7D9B" />
            <stop offset="83%" stopColor="#8A6FB5" />
            <stop offset="100%" stopColor="#B14A6E" />
          </linearGradient>
          <linearGradient id={`${uid}-fire`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD08A" />
            <stop offset="45%" stopColor={T.ember} />
            <stop offset="100%" stopColor="#C45A20" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Circle frame */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`${T.warmWhite}55`}
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circleOffset}
          style={{
            transition: mode === 'welcome' ? 'stroke-dashoffset 1200ms cubic-bezier(0.4,0,0.2,1)' : undefined,
          }}
        />

        {/* Faint monument — photo + silhouette inside circle */}
        <g clipPath={`url(#${uid}-clip)`}>
          {monumentPhoto ? (
            <image
              href={monumentPhoto}
              x={8}
              y={8}
              width={104}
              height={104}
              preserveAspectRatio="xMidYMid slice"
              opacity={monumentOpacity}
            />
          ) : null}
          <path
            d={TEMPLE_PATH}
            fill="none"
            stroke={T.warmWhite}
            strokeWidth="0.9"
            opacity={Math.min(monumentOpacity * 2.2, 0.16)}
          />
        </g>

        {/* Spectrum seam (welcome phase 1) */}
        {(mode === 'welcome' || spectrumOpacity > 0) && (
          <line
            x1={cx}
            y1={8}
            x2={cx}
            y2={112}
            stroke={`url(#${uid}-spec)`}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray={seamLen}
            strokeDashoffset={spectrumOffset}
            opacity={spectrumOpacity}
            style={{
              transition: 'stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1), opacity 500ms ease',
              filter: 'drop-shadow(0 0 3px rgba(232,161,60,0.45))',
            }}
          />
        )}

        {/* Ember / fire seam */}
        <g className={breatheClass} filter={`url(#${uid}-glow)`} opacity={emberOpacity}>
          <line
            x1={cx}
            y1={8 + (1 - seamHeight) * 104}
            x2={cx}
            y2={8 + seamHeight * 104}
            stroke={`url(#${uid}-fire)`}
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              transition: mode === 'welcome' ? 'opacity 500ms ease' : 'y1 80ms linear, y2 80ms linear',
            }}
          />
        </g>
      </svg>

      {showWordmark ? (
        <div style={{ marginTop: size * 0.22, textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: F.body,
              fontSize: Math.max(10, size * 0.11),
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: T.warmWhite,
              fontWeight: 600,
            }}
          >
            ChronoWalk
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: Math.max(9, size * 0.075),
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: T.muted,
            }}
          >
            Walk · Listen · Time travel
          </p>
        </div>
      ) : null}
    </div>
  )
}
