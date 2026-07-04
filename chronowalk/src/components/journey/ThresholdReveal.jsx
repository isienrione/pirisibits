import { useCallback, useEffect, useRef, useState } from 'react'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { HAPTIC_KIND, triggerHaptic } from '../../utils/haptics'
import { cn } from '../ui'

const HOLD_MS = 900
const REVEAL_COMPLETE_POSITION = 68

function ThresholdHandle() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
      <div
        className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.15) 18%, rgba(212, 175, 55, 0.75) 50%, rgba(212, 175, 55, 0.15) 82%, transparent 100%)',
          boxShadow: '0 0 18px rgba(212, 175, 55, 0.22)',
        }}
      />
      <div className="h-1 w-14 rounded-full border border-gold/35 bg-obsidian/50 backdrop-blur-sm" />
    </div>
  )
}

function ThresholdInstruction({ label, visible }) {
  return (
    <p
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-20 px-8 pb-[calc(env(safe-area-inset-bottom)+2.75rem)] text-center font-display text-sm font-medium tracking-[0.28em] text-ivory/55 uppercase transition-opacity duration-700',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      aria-live="polite"
    >
      {label}
    </p>
  )
}

function ThresholdFallback({ stopTitle }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-obsidian px-10 text-center text-ivory">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
        Threshold
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold">{stopTitle}</h1>
      <p className="mt-6 max-w-sm text-base leading-relaxed text-ivory/65">
        The matched ancient view is being prepared for this landmark.
      </p>
    </div>
  )
}

export default function ThresholdReveal({
  stopTitle,
  modernUrl,
  ancientUrl,
  onRevealComplete,
}) {
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState(reducedMotion ? 'armed' : 'waiting')
  const [sliderPosition, setSliderPosition] = useState(100)
  const [instructionVisible, setInstructionVisible] = useState(true)
  const holdTimerRef = useRef(null)
  const isHoldingRef = useRef(false)
  const completedRef = useRef(false)
  const sliderPositionRef = useRef(100)

  const instructionLabel =
    phase === 'waiting' ? 'Hold' : phase === 'armed' ? 'Reveal' : 'Release'

  const completeReveal = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setPhase('complete')
    triggerHaptic(HAPTIC_KIND.SELECTION)

    const fadeDelay = reducedMotion ? 200 : 1400
    window.setTimeout(() => {
      setInstructionVisible(false)
      onRevealComplete?.()
    }, fadeDelay)
  }, [onRevealComplete, reducedMotion])

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const handlePreludePointerDown = useCallback(() => {
    if (phase !== 'waiting') return

    isHoldingRef.current = true
    clearHoldTimer()

    holdTimerRef.current = window.setTimeout(() => {
      if (!isHoldingRef.current) return
      setPhase('armed')
      triggerHaptic(HAPTIC_KIND.ARRIVAL_UNLOCK)
    }, reducedMotion ? 0 : HOLD_MS)
  }, [clearHoldTimer, phase, reducedMotion])

  const handlePreludePointerUp = useCallback(() => {
    if (phase !== 'waiting') return
    isHoldingRef.current = false
    clearHoldTimer()
  }, [clearHoldTimer, phase])

  const handleSliderPointerDown = useCallback(() => {
    if (phase !== 'armed') return
    isHoldingRef.current = true
  }, [phase])

  const handleSliderPointerUp = useCallback(() => {
    if (phase !== 'armed') return
    isHoldingRef.current = false

    if (sliderPositionRef.current <= REVEAL_COMPLETE_POSITION) {
      completeReveal()
    }
  }, [completeReveal, phase])

  const handlePositionChange = useCallback(
    (position) => {
      if (phase !== 'armed') return
      sliderPositionRef.current = position
      setSliderPosition(position)
    },
    [phase]
  )

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
      clearHoldTimer()
    }
  }, [clearHoldTimer])

  if (!modernUrl || !ancientUrl) {
    return <ThresholdFallback stopTitle={stopTitle} />
  }

  return (
    <div
      className="relative min-h-dvh bg-obsidian text-ivory"
      data-testid="threshold-reveal"
      role="group"
      aria-label="Threshold reveal"
    >
      <div
        data-testid="threshold-surface"
        className="absolute inset-0"
        onPointerDown={phase === 'waiting' ? handlePreludePointerDown : handleSliderPointerDown}
        onPointerUp={phase === 'waiting' ? handlePreludePointerUp : handleSliderPointerUp}
        onPointerCancel={phase === 'waiting' ? handlePreludePointerUp : handleSliderPointerUp}
        onPointerLeave={phase === 'waiting' ? handlePreludePointerUp : undefined}
      >
        {phase === 'waiting' ? (
          <img
            src={modernUrl}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full w-full">
            <ReactCompareSlider
              portrait
              position={sliderPosition}
              style={{ width: '100%', height: '100%', touchAction: 'none' }}
              itemOne={
                <ReactCompareSliderImage
                  src={modernUrl}
                  alt="Present day"
                  style={{ objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={ancientUrl}
                  alt="Ancient reconstruction"
                  style={{ objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                />
              }
              handle={<ThresholdHandle />}
              onlyHandleDraggable={false}
              changePositionOnHover={false}
              onPositionChange={handlePositionChange}
            />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_35%,rgba(8,8,8,0.55)_100%)]"
          aria-hidden="true"
        />
      </div>

      <ThresholdInstruction label={instructionLabel} visible={instructionVisible} />
    </div>
  )
}
