import { lazy, Suspense, useState } from 'react'
import { Button, GoldButton, cn, ctaInCard, metaLabel } from './ui'
import { MedallionBadge } from './ui/MedallionBadge'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { formatElapsedDuration, formatWalkedDistance } from '../utils/tourStats'

const ShareCard = lazy(() => import('./ShareCard'))

const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

const CONFETTI_PIECES = [
  { left: '12%', delay: '0s', color: '#D4AF37' },
  { left: '28%', delay: '0.4s', color: '#FFFDF8' },
  { left: '44%', delay: '0.8s', color: '#D9A441' },
  { left: '61%', delay: '0.2s', color: '#8B9A6B' },
  { left: '78%', delay: '0.6s', color: '#D4AF37' },
  { left: '90%', delay: '1s', color: '#FFFDF8' },
]

function ShareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 12h11M14 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatColumn({ label, value }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-display text-2xl font-semibold tabular-nums text-ivory">{value}</p>
      <p className={cn(metaLabel, 'mt-1 text-parchment/80')}>{label}</p>
    </div>
  )
}

function ConfettiLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {CONFETTI_PIECES.map((piece) => (
        <span
          key={piece.left}
          className="confetti-piece"
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animationDelay: piece.delay,
          }}
        />
      ))}
    </div>
  )
}

function TourCompleteView({
  tour,
  visitedCount,
  walkedMeters,
  startedAtMs,
  shareWaypoint = null,
  onViewSummary,
  onDismiss,
  onBackToTours,
}) {
  const reducedMotion = useReducedMotion()
  const [shareOpen, setShareOpen] = useState(false)
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)
  const totalStops = tour?.stopIds?.length ?? visitedCount

  const handleShare = async () => {
    if (shareWaypoint) {
      setShareOpen(true)
      return
    }

    const text = `I completed ${tour?.title ?? 'a ChronoWalk tour'}! ${visitedCount}/${totalStops} stops, ${formatWalkedDistance(walkedMeters)} walked.`

    try {
      if (navigator.share) {
        await navigator.share({ title: 'ChronoWalk', text })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      }
    } catch {
      // User dismissed share sheet.
    }
  }

  return (
    <>
      <div className="pointer-events-auto fixed inset-0 z-[60] overflow-y-auto bg-obsidian">
        <div className="relative min-h-[46vh]">
          <img
            src={heroSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setHeroSrc('/tour-hero.svg')}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-obsidian/25 via-obsidian/45 to-obsidian"
            aria-hidden="true"
          />
          {!reducedMotion ? <ConfettiLayer /> : null}

          <div className="relative flex min-h-[46vh] flex-col items-center justify-center px-6 pb-10 pt-safe">
            <MedallionBadge size="lg" pulse className="shadow-gold-glow">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            </MedallionBadge>
          </div>
        </div>

        <div className="relative -mt-2 px-6 pb-safe text-center">
          <p className="font-display text-2xl font-semibold text-gold">Tour completed!</p>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ivory">
            {tour?.title ?? 'Tour complete'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-parchment/85">
            You visited every stop on this route through{' '}
            <span className="font-display italic text-gold">ancient Rome</span>.
          </p>

          <div className="mt-6 flex gap-3 border-y border-gold/20 py-5">
            <StatColumn label="Stops visited" value={`${visitedCount}/${totalStops}`} />
            <StatColumn label="Distance walked" value={formatWalkedDistance(walkedMeters)} />
            <StatColumn label="Time spent" value={formatElapsedDuration(startedAtMs)} />
          </div>

          <div className="mt-6 flex flex-col gap-3 pb-6">
            <GoldButton size="lg" fullWidth showArrow onClick={onViewSummary}>
              View summary
            </GoldButton>
            <Button
              variant="secondary"
              fullWidth
              className={cn(
                ctaInCard,
                'border-gold/25 bg-parchment font-display text-deep-slate hover:bg-ivory'
              )}
              onClick={() => void handleShare()}
            >
              <ShareIcon className="h-5 w-5" />
              Share your journey
            </Button>
            <Button
              variant="text"
              fullWidth
              className="font-display text-parchment/85 hover:text-ivory"
              onClick={onBackToTours ?? onDismiss}
            >
              Back to tours
            </Button>
          </div>
        </div>
      </div>

      {shareWaypoint ? (
        <Suspense fallback={null}>
          <ShareCard waypoint={shareWaypoint} open={shareOpen} onClose={() => setShareOpen(false)} />
        </Suspense>
      ) : null}
    </>
  )
}

export default TourCompleteView
