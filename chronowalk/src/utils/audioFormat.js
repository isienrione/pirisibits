export function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'

  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const paddedSeconds = secs.toString().padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSeconds}`
  }

  return `${minutes}:${paddedSeconds}`
}

export function formatRemainingTime(currentTime, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return '—:——'
  return `-${formatAudioTime(Math.max(0, duration - currentTime))}`
}
