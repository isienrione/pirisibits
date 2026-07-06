import ChronoWalkLogo from './ChronoWalkLogo.jsx'

/**
 * Brand "Arrival Pulse" — thin golden rings, crosshair, star flash, Seam Mark at center.
 */
export default function ArrivalPulse({
  size = 220,
  accent = '#D4AF37',
  logoSize = 88,
  cycleKey = 0,
}) {
  const rings = [0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.94]

  return (
    <div
      key={cycleKey}
      className="cw-arrival-pulse"
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-hidden="true"
    >
      {rings.map((scale, i) => (
        <div
          key={`${cycleKey}-${i}`}
          className="cw-arrival-pulse-ring"
          style={{
            width: size * scale,
            height: size * scale,
            borderColor: accent,
            animationDelay: `${i * 0.14}s`,
          }}
        />
      ))}

      <div
        className="cw-arrival-pulse-crosshair"
        style={{
          width: size * 0.72,
          background: `linear-gradient(90deg, transparent, ${accent}55, transparent)`,
        }}
      />

      <div className="cw-arrival-pulse-star" style={{ color: accent }} />

      <div style={{ position: 'relative', zIndex: 4 }}>
        <ChronoWalkLogo size={logoSize} mode="breathe" monumentOpacity={0.13} />
      </div>
    </div>
  )
}
