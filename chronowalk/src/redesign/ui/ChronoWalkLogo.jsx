import { useId, useMemo } from 'react'
import { T, F } from '../tokens.js'

/**
 * Greek temple silhouette — pediment + columns, ghost-like behind the seam.
 * Brand spec: faint classical monument inside the circle.
 */
const TEMPLE_MONUMENT = [
  'M34 78 L60 50 L86 78', // pediment
  'M30 78 H90', // entablature
  'M38 78 V58 M50 78 V58 M70 78 V58 M82 78 V58', // columns
  'M28 80 H92', // base step
].join(' ')

/**
 * The Seam Mark — thin gold circle, faint temple, vertical ray bisecting both.
 */
export default function ChronoWalkLogo({
  size = 120,
  monumentOpacity = 0.12,
  mode = 'breathe',
  phase = 2,
  seamPct = 1,
  showWordmark = false,
  variant = 'dark',
  className = '',
  style = {},
}) {
  const uid = useId().replace(/:/g, '')
  const cx = 60
  const cy = 60
  const r = 52
  const circumference = 2 * Math.PI * r
  const seamFull = 112
  const seamTop = 2
  const seamBottom = 118

  const circleStroke = variant === 'light' ? '#8A7355' : '#D4AF37'
  const monumentStroke = variant === 'light' ? T.ink : T.warmWhite
  const wordmarkColor = variant === 'light' ? '#8A7355' : '#D4AF37'

  const circleOffset = useMemo(() => {
    if (mode === 'welcome') return phase >= 0 ? 0 : circumference
    return 0
  }, [mode, phase, circumference])

  const drawnLen = mode === 'descend' ? seamFull * seamPct : seamFull
  const showSpectrum = mode === 'welcome' && phase === 1
  const seamResolved = mode !== 'welcome' || phase >= 2
  const breatheClass = mode === 'breathe' ? 'cw-seam-mark-breathe' : ''
  const seamY2 = seamTop + drawnLen

  return (
    <div
      className={`cw-seam-mark ${className}`.trim()}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', ...style }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        aria-hidden="true"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <clipPath id={`${uid}-clip`}>
            <circle cx={cx} cy={cy} r={r - 2} />
          </clipPath>
          <linearGradient id={`${uid}-ray`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8A13C" stopOpacity="0" />
            <stop offset="10%" stopColor="#FFE9B8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="90%" stopColor="#FFE9B8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E8A13C" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-spec`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.actI} stopOpacity="0" />
            <stop offset="25%" stopColor={T.actIII} />
            <stop offset="50%" stopColor={T.actII} />
            <stop offset="75%" stopColor={T.actIV} />
            <stop offset="100%" stopColor={T.actVI} stopOpacity="0" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-80%" y="-10%" width="260%" height="120%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-halo`} x="-120%" y="-5%" width="340%" height="110%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={circleStroke}
          strokeWidth="0.85"
          strokeOpacity="0.9"
          strokeDasharray={circumference}
          strokeDashoffset={circleOffset}
          style={{
            transition: mode === 'welcome' ? 'stroke-dashoffset 1100ms cubic-bezier(0.4,0,0.2,1)' : undefined,
          }}
        />

        <g clipPath={`url(#${uid}-clip)`} opacity={monumentOpacity}>
          <path
            d={TEMPLE_MONUMENT}
            fill="none"
            stroke={monumentStroke}
            strokeWidth="0.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {showSpectrum ? (
          <line
            x1={cx}
            y1={seamTop}
            x2={cx}
            y2={seamBottom}
            stroke={`url(#${uid}-spec)`}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeDasharray={seamFull}
            strokeDashoffset={mode === 'welcome' && phase < 1 ? seamFull : 0}
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)', opacity: 0.85 }}
          />
        ) : null}

        {seamResolved ? (
          <g className={breatheClass}>
            <line
              x1={cx}
              y1={seamTop}
              x2={cx}
              y2={mode === 'descend' ? seamY2 : seamBottom}
              stroke="#E8A13C"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.2"
              filter={`url(#${uid}-halo)`}
            />
            <line
              x1={cx}
              y1={seamTop}
              x2={cx}
              y2={mode === 'descend' ? seamY2 : seamBottom}
              stroke={`url(#${uid}-ray)`}
              strokeWidth="2"
              strokeLinecap="round"
              filter={`url(#${uid}-glow)`}
            />
            <line
              x1={cx}
              y1={seamTop + 10}
              x2={cx}
              y2={(mode === 'descend' ? seamY2 : seamBottom) - 10}
              stroke="#FFFFFF"
              strokeWidth="0.55"
              strokeLinecap="round"
              opacity="0.95"
            />
          </g>
        ) : (
          <line
            x1={cx}
            y1={seamTop}
            x2={cx}
            y2={mode === 'descend' ? seamY2 : seamBottom}
            stroke={`url(#${uid}-ray)`}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray={seamFull}
            strokeDashoffset={seamFull - drawnLen}
            filter={`url(#${uid}-glow)`}
          />
        )}
      </svg>

      {showWordmark ? (
        <div style={{ marginTop: size * 0.18, textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: F.display,
              fontSize: Math.max(11, size * 0.115),
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: wordmarkColor,
              fontWeight: 600,
            }}
          >
            ChronoWalk
          </p>
          <p
            style={{
              margin: '10px 0 0',
              fontFamily: F.body,
              fontSize: Math.max(8, size * 0.062),
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: variant === 'light' ? T.muted : `${T.muted}`,
              fontWeight: 500,
            }}
          >
            Walk · Listen · Time travel
          </p>
        </div>
      ) : null}
    </div>
  )
}
