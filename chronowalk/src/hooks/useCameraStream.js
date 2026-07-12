import { useEffect, useState } from 'react'

/**
 * @param {MediaTrackConstraints} [videoConstraints]
 */
export function useCameraStream(
  videoConstraints = { facingMode: { ideal: 'environment' } }
) {
  const [stream, setStream] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    let mediaStream = null

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!active) return
        setError('Camera unavailable on this device.')
        setStatus('error')
        return
      }

      setStatus('loading')
      setError(null)

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        })

        if (!active) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }

        setStream(mediaStream)
        setStatus('ready')
      } catch {
        if (!active) return
        setStream(null)
        setError('Camera access is required to align the reconstruction.')
        setStatus('error')
      }
    }

    void start()

    return () => {
      active = false
      mediaStream?.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    // Environment-facing camera is fixed for the overlay experience.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { stream, status, error }
}

export default useCameraStream
