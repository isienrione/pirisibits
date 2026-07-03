import { Button } from '../ui'

function GearIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function JourneyHeader({ onOpenRoute, onOpenSettings }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 8,
      }}
    >
      <Button variant="quiet" onClick={onOpenRoute} aria-label="Open route">
        Route
      </Button>

      <button
        type="button"
        onClick={onOpenSettings}
        aria-label="Open settings"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 999,
          border: '1px solid color-mix(in srgb, var(--warm-white) 16%, transparent)',
          background: 'transparent',
          color: 'var(--muted-warm)',
          cursor: 'pointer',
        }}
      >
        <GearIcon />
      </button>
    </div>
  )
}
