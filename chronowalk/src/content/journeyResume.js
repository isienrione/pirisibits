export const RESUME_AWAY_MS = 5 * 60 * 1000
export const ROME_TIME_ZONE = 'Europe/Rome'

export function formatCalendarDay(timestamp, timeZone = ROME_TIME_ZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp))
}

export function isSameCalendarDay(
  leftTimestamp,
  rightTimestamp,
  timeZone = ROME_TIME_ZONE
) {
  return formatCalendarDay(leftTimestamp, timeZone) === formatCalendarDay(rightTimestamp, timeZone)
}

export function resolveResumeCue(lastActiveAt, now = Date.now(), timeZone = ROME_TIME_ZONE) {
  if (!lastActiveAt) return 'new_day'
  return isSameCalendarDay(lastActiveAt, now, timeZone) ? 'same_day' : 'new_day'
}

export function wasAwayLongEnough(
  lastActiveAt,
  now = Date.now(),
  thresholdMs = RESUME_AWAY_MS
) {
  if (!lastActiveAt) return true
  return now - lastActiveAt >= thresholdMs
}
