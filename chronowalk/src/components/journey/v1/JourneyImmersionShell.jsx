export default function JourneyImmersionShell({ seamProgress = 0, children }) {
  const clamped = Math.min(1, Math.max(0, seamProgress))

  return (
    <div
      className="fixed inset-0 z-[35] flex flex-col bg-obsidian text-warmwhite"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px origin-left bg-ember"
        style={{
          transform: `scaleX(${clamped})`,
          boxShadow: clamped > 0 ? 'var(--seam-glow)' : undefined,
        }}
        role="progressbar"
        aria-valuenow={Math.round(clamped * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Journey progress"
      />

      <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-safe pt-[max(env(safe-area-inset-top),0.75rem)]">
        {children}
      </div>
    </div>
  )
}
