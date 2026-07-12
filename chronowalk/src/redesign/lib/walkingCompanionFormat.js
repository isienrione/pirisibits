export function formatPlaybackClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function formatDistanceLine(distanceCopy) {
  if (distanceCopy.gpsBlocked) return 'Distance unavailable'
  if (distanceCopy.pending) return '—'
  const dist = distanceCopy.primary
  const eta = distanceCopy.secondary?.replace(/\s*walk$/i, '') ?? null
  if (dist && eta) return `${dist} · ${eta}`
  if (dist) return dist
  return '—'
}

export function formatRemainingShort(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '−0:00'
  return `−${formatPlaybackClock(Math.ceil(seconds))}`
}
