import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLaunchOfflineTour } from '../content/launchOfflineDownload'
import { useOfflineDownload } from '../hooks/useOfflineDownload'
import { formatDownloadSize } from '../offline/estimateDownloadSize'
import { BronzeButton, Button, cn } from '../components/ui'
import { metaLabel } from '../components/ui/styles'
import { ROUTES } from '../routes/paths'

function JourneyIllustration({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 240"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="120" cy="120" r="108" className="fill-parchment/50" />
      <path
        d="M72 156c0-28 21-52 48-52s48 24 48 52"
        className="stroke-bronze/30"
        strokeWidth="2"
      />
      <path
        d="M88 92c8-18 24-28 32-28s24 10 32 28"
        className="stroke-gold/50"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M104 72c4-10 10-14 16-14s12 4 16 14"
        className="stroke-gold/35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="92" y="118" width="56" height="44" rx="10" className="fill-ivory stroke-bronze/25" />
      <path d="M148 130h18c6 0 10 4 10 10v8c0 8-6 14-14 14h-14" className="stroke-bronze/35" />
      <path
        d="M108 150h24"
        className="stroke-gold/60"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DownloadProgress({ percent }) {
  const safePercent = Math.max(0, Math.min(100, percent ?? 0))

  return (
    <div className="mt-10 w-full" role="status" aria-live="polite">
      <div className="h-1.5 overflow-hidden rounded-full bg-parchment/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-bronze via-gold to-gold-dark transition-[width] duration-700 ease-spring"
          style={{ width: `${safePercent}%` }}
        />
      </div>
      <p className="mt-5 text-center font-display text-lg text-deep-slate">
        Preparing your journey…
      </p>
      <p className="mt-2 text-center text-sm leading-relaxed text-soft-slate">
        A perfect moment for a coffee while Rome comes with you.
      </p>
    </div>
  )
}

export default function OfflineDownloadPage() {
  const navigate = useNavigate()
  const { destinationId } = useParams()
  const tour = useMemo(
    () => (destinationId ? getLaunchOfflineTour(destinationId) : null),
    [destinationId]
  )
  const {
    estimate,
    isDownloaded,
    isDownloading,
    progress,
    startDownload,
  } = useOfflineDownload(tour)
  const [hasStarted, setHasStarted] = useState(false)

  const journeySizeLabel = formatDownloadSize(estimate?.bytes)
  const progressPercent = progress?.percent ?? (isDownloading ? 12 : 0)

  const continueToJourney = () => {
    navigate(ROUTES.journey, { replace: true, state: { destinationId } })
  }

  const handleDownload = async () => {
    if (isDownloading) return
    setHasStarted(true)
    await startDownload()
  }

  useEffect(() => {
    if (hasStarted && isDownloaded && !isDownloading) {
      const timer = window.setTimeout(continueToJourney, 700)
      return () => window.clearTimeout(timer)
    }
  }, [hasStarted, isDownloaded, isDownloading])

  if (!tour) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ivory px-6">
        <p className="text-sm text-soft-slate">This journey is not available yet.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ivory text-deep-slate paper-texture">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 pb-safe pt-safe sm:px-8">
        <JourneyIllustration className="h-48 w-48 sm:h-56 sm:w-56" />

        <p className={cn(metaLabel, 'mt-8 text-bronze')}>Take Rome with you</p>
        <h1 className="mt-3 text-center font-display text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl">
          Download your journey
        </h1>

        <p className="mt-4 text-center text-sm text-soft-slate">
          Journey size · <span className="font-semibold text-deep-slate">{journeySizeLabel}</span>
        </p>

        {isDownloading ? (
          <DownloadProgress percent={progressPercent} />
        ) : isDownloaded ? (
          <p className="mt-10 text-center text-lg text-deep-slate">Rome is ready whenever you are.</p>
        ) : (
          <p className="mt-6 max-w-sm text-center text-base leading-relaxed text-soft-slate">
            Stories, imagery, and audio - saved so the city stays with you, even without signal.
          </p>
        )}

        <div className="mt-12 w-full">
          {!isDownloaded && !isDownloading ? (
            <div className="flex flex-col gap-4">
              <BronzeButton size="lg" fullWidth onClick={() => void handleDownload()}>
                Download journey
              </BronzeButton>
              <Button variant="text" fullWidth onClick={continueToJourney}>
                Skip for now
              </Button>
            </div>
          ) : isDownloaded ? (
            <BronzeButton size="lg" fullWidth onClick={continueToJourney}>
              Continue
            </BronzeButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}
