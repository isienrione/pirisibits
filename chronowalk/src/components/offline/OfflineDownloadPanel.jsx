import { useState } from 'react'
import { useOfflineDownload } from '../../hooks/useOfflineDownload'
import { formatDownloadSize } from '../../offline/estimateDownloadSize'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Button, GlassPanel, StatusBadge, cn, ctaInCard } from '../ui'

function DownloadProgressBar({ percent, label }) {
  const safePercent = Math.max(0, Math.min(100, percent ?? 0))

  return (
    <div className="mt-4" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-deep-slate">{label ?? 'Downloading tour…'}</span>
        <span className="tabular-nums text-soft-slate">{safePercent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sand/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-terracotta to-gold motion-safe:transition-all motion-safe:duration-300"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  )
}

function MapInternetNotice({ className }) {
  return (
    <p className={cn('text-xs leading-relaxed text-soft-slate', className)}>
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
      <GlassPanel
        className={cn(
          compact ? 'p-5' : 'p-5 sm:p-6',
          isDownloaded ? 'border-olive/25 bg-olive/[0.04]' : 'border-gold/25 bg-gold/[0.04]',
          className
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-eyebrow uppercase text-gold">Offline access</p>
            <h2
              className={cn(
                'mt-1 font-display font-semibold leading-tight text-deep-slate',
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

        <p className="mt-3 text-sm leading-relaxed text-soft-slate">
          Save audio stories, historical reveals, and imagery for{' '}
          <span className="font-medium text-deep-slate">{tour.title}</span> so the tour keeps
          working when connectivity is limited.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <div className="rounded-2xl border border-limestone/60 bg-warm-white/80 px-3 py-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-soft-slate">
              Estimated size
            </p>
            <p className="mt-1 font-semibold tabular-nums text-deep-slate">{estimatedSizeLabel}</p>
          </div>
          {estimate?.stopCount ? (
            <div className="rounded-2xl border border-limestone/60 bg-warm-white/80 px-3 py-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-soft-slate">
                Included
              </p>
              <p className="mt-1 font-semibold text-deep-slate">
                {estimate.stopCount} stops · {estimate.assetCount} assets
              </p>
            </div>
          ) : null}
          {isDownloaded && lastUpdatedLabel ? (
            <div className="rounded-2xl border border-limestone/60 bg-warm-white/80 px-3 py-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-soft-slate">
                Last updated
              </p>
              <p className="mt-1 font-semibold text-deep-slate">{lastUpdatedLabel}</p>
            </div>
          ) : null}
        </div>

        {isDownloading ? (
          <DownloadProgressBar percent={progress?.percent ?? 0} label={progressLabel} />
        ) : null}

        {error ? (
          <p className="mt-4 rounded-2xl border border-terracotta/20 bg-terracotta/8 px-3 py-2 text-sm text-deep-slate">
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
                variant="secondary"
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

        <MapInternetNotice className="mt-4 border-t border-limestone/50 pt-4" />
      </GlassPanel>

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
