import { Button, StatusBadge, cn } from './ui'

function AppIconPreview({ className }) {
  return (
    <div
      className={cn(
        'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ember text-bone shadow-card',
        className
      )}
      aria-hidden="true"
    >
      <span className="font-display text-lg font-bold text-warmwhite">CW</span>
    </div>
  )
}

export function PwaInstallPanel({
  installed,
  canPromptInstall,
  showIosInstructions,
  needsSafariForInstall = false,
  showInstallOption,
  onInstall,
  compact = false,
  className,
}) {
  if (!showInstallOption && !installed) {
    return null
  }

  return (
    <div className={cn("bg-ink900 rounded-card", 'px-5 py-4', className)}>
      <div className="flex items-start gap-4">
        <AppIconPreview />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink900">Add ChronoWalk to your home screen</p>
            {installed ? <StatusBadge variant="active">Installed</StatusBadge> : null}
          </div>

          {installed ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Open ChronoWalk from your home screen like any other app — full screen, no browser chrome.
            </p>
          ) : needsSafariForInstall ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Open this page in <span className="font-semibold text-ink900">Safari</span>, then tap{' '}
              <span className="font-semibold text-ink900">Share</span> →{' '}
              <span className="font-semibold text-ink900">Add to Home Screen</span>.
              Chrome and other iPhone browsers cannot install the app.
            </p>
          ) : showIosInstructions ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tap <span className="font-semibold text-ink900">Share</span> at the bottom,
              then choose <span className="font-semibold text-ink900">Add to Home Screen</span>.
              The ChronoWalk icon will sit alongside your other apps and open full-screen.
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted">
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

          {!installed && showIosInstructions && !canPromptInstall && !needsSafariForInstall ? (
            <p className="mt-3 text-xs leading-relaxed text-muted/90">
              After adding, open ChronoWalk from the home-screen icon for the splash screen and
              full-screen status bar.
            </p>
          ) : null}

          {!installed && !canPromptInstall && !showIosInstructions ? (
            <p className="mt-3 text-xs leading-relaxed text-muted/90">
              On Android Chrome, use your browser menu → Install app or Add to Home Screen. On
              iPhone, open this page in Safari and use Share → Add to Home Screen.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default PwaInstallPanel
