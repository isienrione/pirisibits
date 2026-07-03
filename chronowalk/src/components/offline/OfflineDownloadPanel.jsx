import { useState } from 'react'
import { useOfflineDownload } from '../../hooks/useOfflineDownload'
import { formatDownloadSize } from '../../offline/estimateDownloadSize'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Button, StatusBadge, cn, ctaInCard } from '../ui'

function DownloadProgressBar({ percent, label }) {
  const safePercent = Math.max(0, Math.min(100, percent ?? 0))

  return (
    <div className="mt-4" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-ink900">{label ?? 'Downloading tour…'}</span>
        <span className="tabular-nums text-muted">{safePercent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink800/80">
        <div
          className="h-full rounded-full bg-ember motion-safe:transition-all motion-safe:duration-300"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  )
}

function MapInternetNotice({ className }) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted', className)}>
      Detailed live maps and turn-by-turn walking routes may still require an internet connection.
      Stories, imagery, and audio for downloaded stops remain available offline.
    </p>
  )
}

export function OfflineDownloadPanel({
  tour,
  compact = false,
  className,
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const {
    estimate,
    isDownloaded,
    isDownloading,
    progress,
    error,
    lastUpdatedLabel,
    startDownload,
    removeDownload,
  } = useOfflineDownload(tour)

  if (!tour?.id) return null

  const estimatedSizeLabel = formatDownloadSize(estimate?.bytes)
  const progressLabel =
    progress?.label && progress?.phase === 'assets'
      ? `Downloading ${progress.label}…`
      : progress?.label ?? 'Preparing download…'

  return (
    <>
      <div
        className={cn("bg-ink900 rounded-card", 
          compact ? 'p-5' : 'p-5 sm:p-6',
          isDownloaded ? 'border-olive/25 bg-acthill/[0.04]' : 'border-ember/25 bg-ember/[0.04]',
          className
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-eyebrow uppercase text-ember">Offline access</p>
            <h2
              className={cn(
                'mt-1 font-display font-semibold leading-tight text-ink900',
                compact ? 'text-xl' : 'text-2xl'
              )}
            >
              Download for offline use
            </h2>
          </div>
          {isDownloaded ? (
            <StatusBadge variant="active">Downloaded</StatusBadge>
          ) : isDownloading ? (
            <StatusBadge variant="walking">Downloading</StatusBadge>
          ) : null}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          Save audio stories, historical reveals, and imagery for{' '}
          <span className="font-medium text-ink900">{tour.title}</span> so the tour keeps
          working when connectivity is limited.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <div className="rounded-2xl border border-ink800/60 bg-bone/80 px-3 py-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Estimated size
            </p>
            <p className="mt-1 font-semibold tabular-nums text-ink900">{estimatedSizeLabel}</p>
          </div>
          {estimate?.stopCount ? (
            <div className="rounded-2xl border border-ink800/60 bg-bone/80 px-3 py-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Included
              </p>
              <p className="mt-1 font-semibold text-ink900">
                {estimate.stopCount} stops · {estimate.assetCount} assets
              </p>
            </div>
          ) : null}
          {isDownloaded && lastUpdatedLabel ? (
            <div className="rounded-2xl border border-ink800/60 bg-bone/80 px-3 py-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Last updated
              </p>
              <p className="mt-1 font-semibold text-ink900">{lastUpdatedLabel}</p>
            </div>
          ) : null}
        </div>

        {isDownloading ? (
          <DownloadProgressBar percent={progress?.percent ?? 0} label={progressLabel} />
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl border border-ember/20 bg-ember/8 px-3 py-2 text-sm text-ink900">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {!isDownloaded ? (
            <Button
              fullWidth
              className={cn(ctaInCard, 'sm:flex-1')}
              disabled={isDownloading}
              onClick={() => void startDownload()}
            >
              {isDownloading ? 'Downloading…' : 'Download tour'}
            </Button>
          ) : (
            <>
              <Button
                variant="quiet"
                fullWidth
                className={cn(ctaInCard, 'sm:flex-1')}
                disabled={isDownloading}
                onClick={() => void startDownload()}
              >
                Update download
              </Button>
              <Button
                variant="ghost"
                fullWidth
                className={cn(ctaInCard, 'sm:flex-1')}
                onClick={() => setDeleteOpen(true)}
              >
                Delete download
              </Button>
            </>
          )}
        </div>

        <MapInternetNotice className="mt-4 border-t border-ink800/50 pt-4" />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete offline download?"
        message="This removes saved audio, imagery, and tour metadata from this device. You can download the tour again anytime."
        confirmLabel="Delete download"
        cancelLabel="Keep download"
        onConfirm={() => {
          setDeleteOpen(false)
          void removeDownload()
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}

export default OfflineDownloadPanel
