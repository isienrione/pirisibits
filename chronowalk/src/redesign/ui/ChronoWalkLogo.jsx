import { T } from '../tokens.js'

/** Temple-in-circle mark from Act 0 brand mockups. */
export default function ChronoWalkLogo({ size = 72, color = T.ember, className = '' }) {
  const radius = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <circle
        cx={radius}
        cy={radius}
        r={radius - 2}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 0 6px rgba(232,161,60,0.45))' }}
      />
      <line
        x1={radius}
        y1={4}
        x2={radius}
        y2={size - 4}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g transform={`translate(${radius - 14}, ${radius - 10})`} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round">
        <path d="M2 18 L14 18 L14 10 L20 10 L20 18 L26 18" />
        <path d="M0 18 L28 18" />
        <path d="M6 10 L6 6 L22 6 L22 10" />
        <path d="M8 6 L14 0 L20 6" />
        <line x1="8" y1="12" x2="8" y2="18" />
        <line x1="14" y1="12" x2="14" y2="18" />
        <line x1="20" y1="12" x2="20" y2="18" />
      </g>
    </svg>
  )
}
