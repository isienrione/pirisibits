import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import tourHeroFallback from '../assets/tour-hero.svg'
import { getLaunchTourDetail } from '../content/launchTourDetail'
import { BronzeButton } from '../components/ui'
import { chooseExperiencePath } from '../routes/paths'

export default function BeginJourneyPage() {
  const navigate = useNavigate()
  const { destinationId } = useParams()
  const detail = useMemo(
    () => (destinationId ? getLaunchTourDetail(destinationId) : null),
    [destinationId]
  )
  const [heroSrc, setHeroSrc] = useState(tourHeroFallback)

  useEffect(() => {
    if (detail?.heroImage) {
      setHeroSrc(detail.heroImage)
    }
  }, [detail])

  if (!detail?.anticipation) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ivory px-6">
        <p className="text-sm text-soft-slate">This journey is not available yet.</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-ivory text-deep-slate paper-texture">
      <div className="relative h-[min(72vh,40rem)] w-full sm:h-[min(78vh,44rem)]">
        <img
          src={heroSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
          onError={() => {
            if (heroSrc !== tourHeroFallback) {
              setHeroSrc(tourHeroFallback)
            }
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-deep-slate/15 via-transparent to-ivory"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ivory via-ivory/30 to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="relative -mt-20 mx-auto flex min-h-[28vh] max-w-lg flex-col justify-between px-6 pb-safe sm:max-w-xl sm:px-8">
        <div>
          <h1 className="font-display text-[3.25rem] font-semibold leading-[0.98] tracking-tight sm:text-[3.75rem]">
            {detail.anticipation.headline}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-soft-slate sm:text-xl">
            {detail.anticipation.sentence}
          </p>
        </div>

        <BronzeButton
          size="lg"
          fullWidth
          className="mt-12"
          onClick={() => navigate(chooseExperiencePath(destinationId), { replace: true })}
        >
          Start Journey
        </BronzeButton>
      </div>
    </div>
  )
}
