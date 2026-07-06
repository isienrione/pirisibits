export function BottomScrim({ strength = 0.92 }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '65%',
        background: `linear-gradient(to top, rgba(22,19,15,${strength}) 0%, rgba(22,19,15,0.55) 50%, transparent 100%)`,
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  )
}
