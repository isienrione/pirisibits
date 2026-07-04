import { useState } from 'react'
import { useOfflineDownload } from '../../hooks/useOfflineDownload'
import { formatDownloadSize } from '../../offline/estimateDownloadSize'
import { Button, cn } from '../ui'

export default function LaunchOfflineSettings({ tour, className }) {
  const [isRemoving, setIsRemoving] = useState(false)
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

  const sizeLabel = formatDownloadSize(estimate?.bytes)
  const progressPercent = Math.round(progress?.percent ?? 0)

  const handleRemove = async () => {
    setIsRemoving(true)
    try {
      await removeDownload()
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="launch-offline-settings">
      <div>
        <p className="font-display text-xl font-semibold text-deep-slate">{tour.title}</p>
        {sizeLabel ? (
          <p className="mt-1 text-sm text-soft-slate">
            {isDownloaded ? 'Downloaded' : 'Estimated'} · {sizeLabel}
          </p>
        ) : null}
        {isDownloaded && lastUpdatedLabel ? (
          <p className="mt-1 text-sm text-soft-slate">Updated {lastUpdatedLabel}</p>
        ) : null}
      </div>

      {isDownloading ? (
        <p className="text-sm text-soft-slate" role="status">
          Downloading… {progressPercent > 0 ? `${progressPercent}%` : ''}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-soft-slate" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {isDownloaded ? (
          <Button
            variant="secondary"
            size="md"
            disabled={isRemoving || isDownloading}
            onClick={() => void handleRemove()}
          >
            Remove download
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            disabled={isDownloading}
            onClick={() => void startDownload()}
          >
            Download tour
          </Button>
        )}
      </div>
    </div>
  )
}
