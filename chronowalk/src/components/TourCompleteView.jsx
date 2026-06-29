import { lazy, Suspense, useState } from 'react'
import { Button, GlassPanel, cn, ctaInCard, metaLabel } from './ui'
import { env } from '../config/env'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { getAncientPosterUrl, getModernPosterUrl } from '../utils/sliderMedia'
import { readReviewPrompted, writeReviewPrompted } from '../utils/appPreferences'
import { formatElapsedDuration, formatWalkedDistance } from '../utils/tourStats'

const ShareCard = lazy(() => import('./ShareCard'))

function StatColumn({ label, value }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-display text-2xl font-semibold tabular-nums text-deep-slate">{value}</p>
      <p className={cn(metaLabel, 'mt-1 text-soft-slate')}>{label}</p>
    </div>
  )
}

function EnjoyingPrompt({ reducedMotion, onDismiss }) {
  const reviewUrl = env.reviewUrl
  const feedbackUrl = env.feedbackUrl

  const completePrompt = () => {
    writeReviewPrompted(true)
    onDismiss()
  }

  const openExternal = (url) => {
    if (!url) return
    if (url.startsWith('mailto:')) {
      window.location.href = url
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleReview = () => {
    completePrompt()
    openExternal(reviewUrl)
  }

  const handleFeedback = () => {
    completePrompt()
    openExternal(feedbackUrl)
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-limestone/80 bg-sand/35 px-4 py-4 text-left',
        !reducedMotion && 'motion-safe-transition'
      )}
      role="group"
      aria-label="Enjoying ChronoWalk?"
    >
      <p className="text-sm font-semibold text-deep-slate">Enjoying ChronoWalk?</p>
      <p className="mt-1 text-xs leading-relaxed text-soft-slate">
        A quick review helps other travelers find us. Prefer something private? Share feedback instead.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {reviewUrl ? (
          <Button size="sm" fullWidth onClick={handleReview}>
            Leave a review
          </Button>
        ) : null}
        {feedbackUrl ? (
          <Button size="sm" variant="secondary" fullWidth onClick={handleFeedback}>
            Share feedback
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function TourCompleteView({
  tour,
  visitedCount,
  walkedMeters,
  startedAtMs,
  shareWaypoint,
  onViewSummary,
  onDismiss,
}) {
  const reducedMotion = useReducedMotion()
  const totalStops = tour?.stopIds?.length ?? visitedCount
  const [shareOpen, setShareOpen] = useState(false)
  const [showReviewPrompt, setShowReviewPrompt] = useState(() => {
    const hasReviewPath = Boolean(env.reviewUrl || env.feedbackUrl)
    return hasReviewPath && !readReviewPrompted()
  })
  const canShareJourney = Boolean(
    shareWaypoint && getModernPosterUrl(shareWaypoint) && getAncientPosterUrl(shareWaypoint)
  )
  const journeyTitle = tour?.title ?? 'Tour complete'

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-deep-slate/50 px-4 backdrop-blur-sm">
        <GlassPanel className="pointer-events-auto max-w-md rounded-3xl p-6 text-center shadow-glass-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/35 bg-gold/15">
            <svg className="h-7 w-7 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="mt-4 text-eyebrow uppercase text-gold">Journey complete</p>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-deep-slate">
            {journeyTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-soft-slate">
            You visited every stop on this route through ancient Rome.
          </p>

          <div className="mt-6 flex gap-3 border-y border-limestone/60 py-5">
            <StatColumn label="Stops visited" value={`${visitedCount}/${totalStops}`} />
            <StatColumn label="Distance walked" value={formatWalkedDistance(walkedMeters)} />
            <StatColumn label="Time spent" value={formatElapsedDuration(startedAtMs)} />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <Button
              size="lg"
              fullWidth
              disabled={!canShareJourney}
              onClick={() => setShareOpen(true)}
            >
              Share your journey
            </Button>

            {showReviewPrompt ? (
              <EnjoyingPrompt
                reducedMotion={reducedMotion}
                onDismiss={() => setShowReviewPrompt(false)}
              />
            ) : null}

            <Button size="lg" fullWidth variant="secondary" onClick={onViewSummary}>
              View summary
            </Button>
            <Button variant="secondary" fullWidth className={ctaInCard} onClick={onDismiss}>
              Return to map
            </Button>
          </div>
        </GlassPanel>
      </div>

      {canShareJourney ? (
        <Suspense fallback={null}>
          <ShareCard
            waypoint={shareWaypoint}
            modernSrc={getModernPosterUrl(shareWaypoint)}
            ancientSrc={getAncientPosterUrl(shareWaypoint)}
            titleOverride={journeyTitle}
            panelTitle="Share your journey"
            panelDescription={`A before-and-after postcard from your walk — ${visitedCount} stops through ancient Rome.`}
            open={shareOpen}
            onClose={() => setShareOpen(false)}
          />
        </Suspense>
      ) : null}
    </>
  )
}

export default TourCompleteView
