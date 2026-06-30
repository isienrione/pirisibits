import { useMemo, useState } from 'react'
import tourHeroFallback from '../../../assets/tour-hero.svg'
import { getWaypointGeo } from '../../../data/waypointGeo'
import { getTourById } from '../../../services/tourRegistry'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import OfflineDownloadPanel from '../../offline/OfflineDownloadPanel'
import { Button, GoldButton } from '../../ui'
import PreviewStopsList from '../components/PreviewStopsList'
import TourFeatureRow from '../components/TourFeatureRow'

const APP_NAME = 'ChronoWalk'
const tourHeroPhoto = `/tour-hero.jpg?v=${__APP_BUILD_ID__}`

const VALUE_PROPOSITION =
  'Place-aware stories and stunning reconstructions that bring Ancient Rome to life.'

const PRIVACY_NOTICE =
  'We use your location only while the tour is active. You can pause anytime.'

function ShieldIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v6c0 4.4 3 8.5 7 9 4-.5 7-4.6 7-9V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.5 12 11 13.5 14.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BackButton({ onBack, label = 'Back' }) {
  return (
    <Button
      variant="ghost"
      size="md"
      className="mb-2 -ml-2 self-start rounded-full border border-ivory/20 bg-obsidian/30 px-5 text-ivory hover:bg-ivory/10"
      onClick={onBack}
    >
      ← {label}
    </Button>
  )
}

export function BeginJourneyView({ tourId, onStartJourney, onBack }) {
  const tour = getTourById(tourId)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [heroSrc, setHeroSrc] = useState(tourHeroPhoto)

  const stops = useMemo(
    () =>
      (tour?.stopIds ?? []).map((id, index) => ({
        id,
        index: index + 1,
        title: getWaypointGeo(id)?.title ?? id,
      })),
    [tour?.stopIds]
  )

  const handleHeroError = () => {
    if (heroSrc !== tourHeroFallback) {
      setHeroSrc(tourHeroFallback)
    }
  }

  if (!tour) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian px-6">
        <p className="text-sm text-ivory/70">Select a tour to begin your journey.</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-obsidian">
      <div className="absolute inset-x-0 top-0 h-[min(60vh,28rem)] sm:h-[min(62vh,30rem)]">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-[center_38%]"
          onError={handleHeroError}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-obsidian/10 via-obsidian/50 to-obsidian"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-safe pt-safe sm:px-6 lg:max-w-3xl">
        {onBack ? <BackButton onBack={onBack} /> : null}

        <div className="h-[min(28vh,12rem)] shrink-0 sm:h-[min(32vh,14rem)]" aria-hidden="true" />

        <div className="flex flex-1 flex-col justify-end pb-2">
          <p className="font-display text-[2.5rem] font-semibold leading-none tracking-tight text-ivory sm:text-5xl">
            {APP_NAME}
          </p>
          <p className="mt-2 font-display text-lg italic text-gold sm:text-xl">– {tour.title}</p>

          <p className="mt-5 max-w-lg text-sm leading-relaxed text-ivory/80 sm:text-base">
            {VALUE_PROPOSITION}
          </p>

          <TourFeatureRow className="mt-7" />

          {previewOpen ? (
            <div className="mt-6 border-t border-ivory/10 pt-5">
              <p className="text-eyebrow uppercase text-gold/90">Your route</p>
              <PreviewStopsList stops={stops} className="mt-3" variant="dark" />
              <div className="mt-5 rounded-2xl border border-ivory/10 bg-ivory/5 p-4">
                <OfflineDownloadPanel tour={tour} compact />
              </div>
            </div>
          ) : null}

          <div className="relative z-[3] mt-8 flex flex-col gap-3">
            <GoldButton
              fullWidth
              showArrow
              onClick={() => {
                triggerHaptic(HAPTIC_KIND.SUCCESS)
                onStartJourney(tour)
              }}
            >
              Start tour
            </GoldButton>
            <Button
              variant="outline-dark"
              size="lg"
              fullWidth
              aria-expanded={previewOpen}
              onClick={() =>
                setPreviewOpen((open) => {
                  if (!open) triggerHaptic(HAPTIC_KIND.SOFT_TAP)
                  return !open
                })
              }
            >
              {previewOpen ? 'Hide stops' : 'Preview stops'}
            </Button>
          </div>

          <p className="mt-6 flex items-start gap-2.5 text-xs leading-relaxed text-ivory/60 sm:text-sm">
            <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-ivory/50" />
            <span>{PRIVACY_NOTICE}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default BeginJourneyView
