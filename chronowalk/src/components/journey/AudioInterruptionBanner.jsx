export default function AudioInterruptionBanner({ onResume, busy = false }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(10px, env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 66,
        width: 'min(420px, calc(100vw - 2 * var(--edge)))',
      }}
    >
      <button
        type="button"
        onClick={onResume}
        disabled={busy}
        aria-live="polite"
        style={{
          width: '100%',
          padding: '10px 16px',
          borderRadius: 999,
          border: '1px solid color-mix(in srgb, var(--ember) 40%, transparent)',
          background: 'color-mix(in srgb, var(--ink) 90%, transparent)',
          color: 'var(--warm-white)',
          fontSize: 'var(--fs-meta)',
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
          cursor: busy ? 'wait' : 'pointer',
        }}
      >
        Sound was interrupted - tap to resume
      </button>
      <p
        style={{
          margin: '8px 0 0',
          textAlign: 'center',
          fontSize: 11,
          lineHeight: 1.45,
          color: 'color-mix(in srgb, var(--warm-white) 72%, transparent)',
        }}
      >
        This can happen when another app takes audio or your phone locks.
      </p>
    </div>
  )
}
