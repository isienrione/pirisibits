import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLaunchTourDetail } from '../content/launchTourDetail'
import { formatUsd } from '../data/tourProducts'
import { Button, GoldButton, cn } from '../components/ui'
import { ROUTES, tourDetailPath } from '../routes/paths'

function LockIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function PurchasePage() {
  const navigate = useNavigate()
  const { destinationId } = useParams()
  const detail = useMemo(
    () => (destinationId ? getLaunchTourDetail(destinationId) : null),
    [destinationId]
  )
  const [isConfirming, setIsConfirming] = useState(false)

  if (!detail) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ivory px-6">
        <p className="text-sm text-soft-slate">This journey is not available yet.</p>
      </div>
    )
  }

  const priceLabel = formatUsd(detail.priceUsd)

  const handleConfirm = () => {
    if (isConfirming) return
    setIsConfirming(true)
    window.setTimeout(() => {
      navigate(ROUTES.legacy, { replace: true })
    }, 450)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ivory text-deep-slate">
      <div className="px-6 pt-safe">
        <Button
          variant="text"
          size="sm"
          className="-ml-1 text-soft-slate hover:text-deep-slate"
          onClick={() => navigate(tourDetailPath(destinationId))}
          disabled={isConfirming}
        >
          Cancel
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-safe">
        <div className="text-center">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-soft-slate">ChronoWalk</p>
          <h1 className="sr-only">Purchase {detail.title}</h1>
        </div>

        <div className="mt-12 space-y-8">
          <div className="text-center">
            <p className="font-display text-3xl font-semibold text-deep-slate">{detail.title}</p>
            <p className="mt-2 text-base text-soft-slate">{detail.tagline}</p>
            <p className="mt-3 text-sm text-soft-slate">
              {detail.stats.stories} places · yours to keep
            </p>
          </div>

          <div className="border-t border-parchment/70 pt-8">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-soft-slate">Total</span>
              <span className="font-display text-4xl font-semibold tracking-tight text-deep-slate">
                {priceLabel}
              </span>
            </div>
          </div>

          <p className="flex items-center justify-center gap-2 text-sm text-soft-slate">
            <LockIcon className="h-4 w-4 shrink-0 text-soft-slate/80" />
            <span>Secure payment</span>
          </p>
        </div>

        <div className="mt-14">
          <GoldButton
            fullWidth
            disabled={isConfirming}
            className={cn(isConfirming && 'opacity-80')}
            onClick={handleConfirm}
          >
            {isConfirming ? 'Confirming…' : `Pay ${priceLabel}`}
          </GoldButton>
        </div>
      </div>
    </div>
  )
}
