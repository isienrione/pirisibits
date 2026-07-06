import { useId, useMemo } from 'react'
import { T, F } from '../tokens.js'

/** Classical arch + two pillars — faint monument behind the seam. */
const ARCH_MONUMENT =
  'M40 76 V52 Q60 40 80 52 V76 M34 76 H86'

/**
 * The Seam Mark — thin circle, faint arch monument, vertical ray of light bisecting both.
 * @see brand spec: "The moment time opens. Past and present align."
 */
export default function ChronoWalkLogo({
  size = 120,
  monumentOpacity = 0.14,
  mode = 'breathe',
  phase = 2,
  seamPct = 1,
  showWordmark = false,
  className = '',
  style = {},
}) {
  const uid = useId().replace(/:/g, '')
  const cx = 60
  const cy = 60
  const r = 52
  const circumference = 2 * Math.PI * r
  const seamFull = 112
  const seamTop = 4
  const seamBottom = 116

  const circleOffset = useMemo(() => {
    if (mode === 'welcome') return phase >= 0 ? 0 : circumference
    return 0
  }, [mode, phase, circumference])

  const drawnLen = mode === 'descend' ? seamFull * seamPct : seamFull
  const seamDashoffset = mode === 'welcome' && phase < 1 ? seamFull : 0
  const showSpectrum = mode === 'welcome' && phase === 1
  const seamResolved = mode !== 'welcome' || phase >= 2

  const breatheClass = mode === 'breathe' ? 'cw-seam-mark-breathe' : ''

  const seamY2 = seamTop + drawnLen

  return (
    <div
      className={`cw-seam-mark ${className}`.trim()}
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
            <stop offset="12%" stopColor="#FFE9B8" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="88%" stopColor="#FFE9B8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#E8A13C" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-spec`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.actI} stopOpacity="0" />
            <stop offset="20%" stopColor={T.actIII} />
            <stop offset="40%" stopColor={T.actII} />
            <stop offset="60%" stopColor={T.actIV} />
            <stop offset="80%" stopColor={T.actVI} />
            <stop offset="100%" stopColor={T.encore} stopOpacity="0" />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-80%" y="-10%" width="260%" height="120%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-halo`} x="-120%" y="-5%" width="340%" height="110%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Delicate circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="0.9"
          strokeOpacity="0.85"
          strokeDasharray={circumference}
          strokeDashoffset={circleOffset}
          style={{
            transition: mode === 'welcome' ? 'stroke-dashoffset 1100ms cubic-bezier(0.4,0,0.2,1)' : undefined,
          }}
        />

        {/* Faint monument — arch behind the seam */}
        <g clipPath={`url(#${uid}-clip)`} opacity={monumentOpacity}>
          <path
            d={ARCH_MONUMENT}
            fill="none"
            stroke={T.warmWhite}
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Welcome: brief spectrum seam before resolving to gold ray */}
        {showSpectrum ? (
          <line
            x1={cx}
            y1={seamTop}
            x2={cx}
            y2={seamBottom}
            stroke={`url(#${uid}-spec)`}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray={seamFull}
            strokeDashoffset={seamDashoffset}
            style={{
              transition: 'stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)',
              opacity: 0.85,
            }}
          />
        ) : null}

        {/* The Seam — electric ray of light */}
        {seamResolved ? (
          <g className={breatheClass}>
            {/* Wide soft halo */}
            <line
              x1={cx}
              y1={seamTop}
              x2={cx}
              y2={mode === 'descend' ? seamY2 : seamBottom}
              stroke="#E8A13C"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.22"
              filter={`url(#${uid}-halo)`}
            />
            {/* Gold beam */}
            <line
              x1={cx}
              y1={seamTop}
              x2={cx}
              y2={mode === 'descend' ? seamY2 : seamBottom}
              stroke={`url(#${uid}-ray)`}
              strokeWidth="2.2"
              strokeLinecap="round"
              filter={`url(#${uid}-glow)`}
              strokeDasharray={mode === 'welcome' ? seamFull : undefined}
              strokeDashoffset={mode === 'welcome' && phase === 2 ? 0 : undefined}
              style={{
                transition: mode === 'descend' ? 'y2 60ms linear' : undefined,
              }}
            />
            {/* Hot core needle */}
            <line
              x1={cx}
              y1={seamTop + 8}
              x2={cx}
              y2={(mode === 'descend' ? seamY2 : seamBottom) - 8}
              stroke="#FFFFFF"
              strokeWidth="0.6"
              strokeLinecap="round"
              opacity="0.92"
            />
          </g>
        ) : mode === 'welcome' && phase === 0 ? null : (
          <line
            x1={cx}
            y1={seamTop}
            x2={cx}
            y2={mode === 'descend' ? seamY2 : seamBottom}
            stroke={`url(#${uid}-ray)`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={seamFull}
            strokeDashoffset={seamFull - drawnLen}
            filter={`url(#${uid}-glow)`}
          />
        )}
      </svg>

      {showWordmark ? (
        <div style={{ marginTop: size * 0.2, textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontFamily: F.display,
              fontSize: Math.max(11, size * 0.12),
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              fontWeight: 500,
            }}
          >
            ChronoWalk
          </p>
          <p
            style={{
              margin: '8px 0 0',
              fontFamily: F.display,
              fontSize: Math.max(9, size * 0.07),
              fontStyle: 'italic',
              color: T.muted,
              lineHeight: 1.5,
              maxWidth: 220,
            }}
          >
            The moment time opens.
          </p>
        </div>
      ) : null}
    </div>
  )
}
