import { T } from '../tokens.js'

const SPECTRUM = `linear-gradient(to bottom, ${T.actI}, ${T.actII}, ${T.actIII}, ${T.actIV}, ${T.actV}, ${T.actVI}, ${T.encore})`

/**
 * Full-height vertical seam — electric ray draw, spectrum pulse on hold, erase on cross.
 */
export default function ElectricSeam({
  revealPct = 1,
  erasePct = 0,
  holding = false,
  crossed = false,
}) {
  const heightPct = Math.max(0, revealPct * (1 - erasePct) * 100)
  const showSpark = revealPct > 0.02 && revealPct < 0.98 && erasePct < 0.1
  const spectrumOpacity = holding ? 0.55 : crossed ? 0.35 * (1 - erasePct) : 0.12
  const coreWidth = holding ? 2.5 : 1.5
  const glowSpread = holding ? 28 : crossed ? 18 : 14

  return (
    <>
      {/* Outer electric envelope */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 0,
          width: holding ? 22 : 12,
          height: `${heightPct}%`,
          background: `radial-gradient(ellipse at center, rgba(255,220,160,${holding ? 0.35 : 0.22}) 0%, rgba(232,161,60,0.12) 45%, transparent 78%)`,
          pointerEvents: 'none',
          zIndex: 6,
          transition: 'width 220ms ease, background 220ms ease',
        }}
      />

      {/* Spectrum prism — intensifies while holding, fades as seam erases */}
      <div
        aria-hidden
        className={holding ? 'cw-threshold-seam-spectrum' : undefined}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 0,
          width: holding ? 10 : 6,
          height: `${heightPct}%`,
          background: SPECTRUM,
          opacity: spectrumOpacity,
          filter: 'blur(1px)',
          pointerEvents: 'none',
          zIndex: 7,
          transition: 'opacity 280ms ease, width 220ms ease',
        }}
      />

      {/* Hot core */}
      <div
        aria-hidden
        className={holding ? 'cw-threshold-seam-pulse' : 'cw-threshold-seam-idle'}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 0,
          width: coreWidth,
          height: `${heightPct}%`,
          background: `linear-gradient(to bottom, #FFF4D6 0%, ${T.ember} 35%, #C45A20 100%)`,
          boxShadow: `0 0 ${glowSpread}px rgba(232,161,60,${holding ? 0.85 : 0.5}), 0 0 ${glowSpread * 2}px rgba(255,200,120,${holding ? 0.35 : 0.15})`,
          pointerEvents: 'none',
          zIndex: 8,
          transition: 'width 200ms ease, box-shadow 200ms ease',
        }}
      />

      {/* Leading spark while drawing */}
      {showSpark ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            top: `${heightPct}%`,
            width: 10,
            height: 10,
            borderRadius: 5,
            background: '#FFE4A8',
            boxShadow: '0 0 20px rgba(255,220,160,0.95), 0 0 40px rgba(232,161,60,0.55)',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        />
      ) : null}
    </>
  )
}
