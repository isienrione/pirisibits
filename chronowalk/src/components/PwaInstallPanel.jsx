import { Button, GlassPanel, StatusBadge, cn } from './ui'

function AppIconPreview({ className }) {
  return (
    <div
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-bronze to-gold shadow-plaque',
        className
      )}
      aria-hidden="true"
    >
      <span className="font-display text-lg font-bold text-warm-white">CW</span>
    </div>
  )
}

export function PwaInstallPanel({
  installed,
  canPromptInstall,
  showIosInstructions,
  showInstallOption,
  onInstall,
  compact = false,
  className,
}) {
  if (!showInstallOption && !installed) {
    return null
  }

  return (
    <GlassPanel className={cn('px-5 py-4', className)}>
      <div className="flex items-start gap-4">
        <AppIconPreview />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-deep-slate">Add ChronoWalk to your home screen</p>
            {installed ? <StatusBadge variant="active">Installed</StatusBadge> : null}
          </div>

          {installed ? (
            <p className="mt-2 text-sm leading-relaxed text-soft-slate">
              Open ChronoWalk from your home screen like any other app — full screen, no browser chrome.
            </p>
          ) : showIosInstructions ? (
            <p className="mt-2 text-sm leading-relaxed text-soft-slate">
              In Safari, tap <span className="font-semibold text-deep-slate">Share</span> at the bottom,
              then choose <span className="font-semibold text-deep-slate">Add to Home Screen</span>.
              The ChronoWalk icon will sit alongside your other apps.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-soft-slate">
              Install a home-screen icon that opens ChronoWalk directly — great for tour day when you want
              quick access without typing the URL.
            </p>
          )}

          {!installed && canPromptInstall ? (
            <Button
              size={compact ? 'md' : 'lg'}
              fullWidth={!compact}
              className={cn('mt-4', compact && 'sm:w-auto')}
              onClick={onInstall}
            >
              Add to Home Screen
            </Button>
          ) : null}

          {!installed && showIosInstructions && !canPromptInstall ? (
            <p className="mt-3 text-xs leading-relaxed text-soft-slate/90">
              Tip: use Safari — Chrome on iPhone cannot add PWAs to the home screen.
            </p>
          ) : null}

          {!installed && !canPromptInstall && !showIosInstructions ? (
            <p className="mt-3 text-xs leading-relaxed text-soft-slate/90">
              On Android Chrome, use your browser menu → Install app or Add to Home Screen. On
              iPhone, open this page in Safari and use Share → Add to Home Screen.
            </p>
          ) : null}
        </div>
      </div>
    </GlassPanel>
  )
}

export default PwaInstallPanel
