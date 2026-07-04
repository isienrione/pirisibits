import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { JOURNEY_STATES } from '../../state/journeyState'
import { useJourney } from '../../hooks/useJourney'
import { TimeFractureHandle, cn } from '../ui'
import { isVideoUrl } from '../BeforeAfterSlider'

function CompareMedia({ src, alt }) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
    )
  }

  return <ReactCompareSliderImage src={src} alt={alt} />
}

/**
 * Press-and-hold threshold reveal — Today vs Ancient Rome.
 */
export default function ThresholdReveal({ onRevealComplete }) {
  const { state, currentStop } = useJourney()
  const reducedMotion = useReducedMotion()
  const [position, setPosition] = useState(reducedMotion ? 100 : 0)
  const [holding, setHolding] = useState(false)
  const [revealed, setRevealed] = useState(reducedMotion)
  const intervalRef = useRef(null)

  const visible = state === JOURNEY_STATES.THRESHOLD && Boolean(currentStop)

  useEffect(() => {
    if (!visible) {
      setPosition(reducedMotion ? 100 : 0)
      setRevealed(reducedMotion)
      setHolding(false)
      return
    }

    if (reducedMotion) {
      setRevealed(true)
      onRevealComplete?.()
    }
  }, [onRevealComplete, reducedMotion, visible, currentStop?.id])

  useEffect(() => {
    if (!holding || revealed) return undefined

    intervalRef.current = window.setInterval(() => {
      setPosition((prev) => {
        const next = Math.min(100, prev + 4)
        if (next >= 100) {
          setRevealed(true)
          onRevealComplete?.()
        }
        return next
      })
    }, 40)

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [holding, onRevealComplete, revealed])

  const handlePointerDown = useCallback(() => {
    if (revealed || reducedMotion) return
    setHolding(true)
  }, [reducedMotion, revealed])

  const handlePointerUp = useCallback(() => {
    setHolding(false)
  }, [])

  const nowSrc = currentStop?.reconstructionNow
  const thenSrc = currentStop?.reconstructionThen

  const itemOne = useMemo(
    () => <CompareMedia src={nowSrc} alt="Rome today" />,
    [nowSrc]
  )
  const itemTwo = useMemo(
    () => <CompareMedia src={thenSrc} alt="Ancient Rome reconstruction" />,
    [thenSrc]
  )

  if (!visible) return null

  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 z-[75] flex flex-col bg-obsidian"
        data-testid="threshold-reveal"
      >
        <div className="flex justify-between px-6 pt-safe text-sm font-semibold uppercase tracking-wide text-ivory/80">
          <span>Today</span>
          <span>Ancient Rome</span>
        </div>
        <div className="relative flex-1">
          <img src={thenSrc} alt="Ancient Rome reconstruction" className="absolute inset-0 h-full w-full object-cover opacity-100" />
          <img
            src={nowSrc}
            alt="Rome today"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
            style={{ opacity: revealed ? 0 : 1 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[75] flex flex-col bg-obsidian touch-none select-none"
      data-testid="threshold-reveal"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="flex justify-between px-6 pt-safe text-sm font-semibold uppercase tracking-wide text-ivory/80">
        <span>Today</span>
        <span>Ancient Rome</span>
      </div>

      <div className="relative min-h-0 flex-1">
        <ReactCompareSlider
          className="h-full w-full"
          position={position}
          onPositionChange={setPosition}
          handle={<TimeFractureHandle size="lg" />}
          itemOne={itemOne}
          itemTwo={itemTwo}
        />
      </div>

      <p className={cn('pb-safe px-6 py-4 text-center text-sm text-ivory/70', revealed && 'opacity-0')}>
        {revealed ? 'Reveal complete' : 'Press and hold to step through time'}
      </p>
    </div>
  )
}
