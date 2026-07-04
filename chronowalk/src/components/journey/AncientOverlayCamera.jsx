import { useCallback, useEffect, useRef, useState } from 'react'
import { useCameraStream } from '../../hooks/useCameraStream'
import { buildCalibrationTransform, DEFAULT_CALIBRATION } from '../../utils/calibrationStorage'
import { captureOverlayFrame, downloadCapture } from '../../utils/overlayCapture'
import { HAPTIC_KIND, triggerHaptic } from '../../utils/haptics'
import { cn } from '../ui'

function CaptureIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="3.25" fill="currentColor" />
    </svg>
  )
}

export default function AncientOverlayCamera({
  stopTitle,
  stopId,
  overlayUrl,
  calibration = DEFAULT_CALIBRATION,
  onContinue,
}) {
  const videoRef = useRef(null)
  const { stream, status, error } = useCameraStream()
  const [opacity, setOpacity] = useState(0.52)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureMessage, setCaptureMessage] = useState(null)

  const overlayTransform = buildCalibrationTransform(calibration)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return undefined

    video.srcObject = stream

    return () => {
      video.srcObject = null
    }
  }, [stream])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const handleCapture = useCallback(async () => {
    const video = videoRef.current
    if (!video || !overlayUrl || status !== 'ready') return

    setIsCapturing(true)
    setCaptureMessage(null)

    try {
      const blob = await captureOverlayFrame({
        video,
        overlaySrc: overlayUrl,
        opacity,
      })

      const slug = (stopId ?? 'chronowalk').replace(/\s+/g, '-')
      downloadCapture(blob, `chronowalk-${slug}-overlay.png`)
      triggerHaptic(HAPTIC_KIND.SUCCESS)
      setCaptureMessage('Saved to your device')
    } catch (captureError) {
      setCaptureMessage(
        captureError instanceof Error ? captureError.message : 'Capture failed.'
      )
    } finally {
      setIsCapturing(false)
    }
  }, [opacity, overlayUrl, status, stopId])

  if (!overlayUrl) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-obsidian px-10 text-center text-ivory">
        <h1 className="font-display text-3xl font-semibold">{stopTitle}</h1>
        <p className="mt-6 max-w-sm text-base leading-relaxed text-ivory/65">
          The ancient overlay is being prepared for this landmark.
        </p>
        <button
          type="button"
          className="mt-10 text-sm font-medium text-ivory/60 transition hover:text-ivory"
          onClick={onContinue}
        >
          Continue journey
        </button>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-obsidian text-ivory"
      data-testid="ancient-overlay-camera"
    >
      {status === 'ready' ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          aria-label={`Live view of ${stopTitle}`}
        />
      ) : (
        <div className="absolute inset-0 bg-[#080808]" aria-hidden="true" />
      )}

      <img
        src={overlayUrl}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{
          opacity,
          transform: overlayTransform,
          transformOrigin: 'center center',
        }}
        referrerPolicy="no-referrer"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_48%,rgba(8,8,8,0.35)_100%)]"
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 top-0 z-20 px-5 pt-safe">
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 min-h-11 rounded-full px-3 text-sm font-medium text-ivory/55 transition hover:text-ivory"
        >
          Continue journey
        </button>
      </div>

      {error ? (
        <p className="absolute inset-x-0 top-24 z-20 px-8 text-center text-sm text-ivory/60">
          {error}
        </p>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <div className="mx-auto flex max-w-md items-center gap-4">
          <label className="sr-only" htmlFor="ancient-overlay-opacity">
            Ancient overlay opacity
          </label>
          <input
            id="ancient-overlay-opacity"
            type="range"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(event) => setOpacity(Number(event.target.value) / 100)}
            className="h-1 flex-1 appearance-none rounded-full bg-ivory/20 accent-gold [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
          />

          <button
            type="button"
            aria-label="Capture overlay"
            disabled={status !== 'ready' || isCapturing}
            onClick={handleCapture}
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-obsidian/70 text-gold transition',
              status === 'ready' && !isCapturing
                ? 'hover:border-gold hover:bg-obsidian/90'
                : 'opacity-45'
            )}
          >
            <CaptureIcon className="h-6 w-6" />
          </button>
        </div>

        {captureMessage ? (
          <p className="mt-3 text-center text-xs text-ivory/55" role="status">
            {captureMessage}
          </p>
        ) : (
          <p className="mt-3 text-center text-xs tracking-[0.18em] text-ivory/40 uppercase">
            Align · Blend · Capture
          </p>
        )}
      </div>
    </div>
  )
}
