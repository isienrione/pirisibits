import { useState } from 'react'
import { getWaypointTranscript, hasPublishedTranscript } from '../utils/waypointTranscript'
import { Button, cn } from './ui'

const DEFAULT_TRUNCATE_CHARS = 320

export function AudioTranscriptSection({
  waypoint,
  className = '',
  expandable = false,
  serif = false,
  truncateChars = DEFAULT_TRUNCATE_CHARS,
}) {
  const transcript = getWaypointTranscript(waypoint)
  const [expanded, setExpanded] = useState(false)
  const shouldTruncate = expandable && transcript.length > truncateChars
  const displayText =
    expanded || !shouldTruncate ? transcript : `${transcript.slice(0, truncateChars).trimEnd()}…`

  return (
    <div className={className}>
      <p
        className={cn(
          'text-sm leading-relaxed text-soft-slate',
          serif && 'font-display text-base leading-7 text-deep-slate'
        )}
      >
        {displayText}
      </p>

      {shouldTruncate ? (
        <Button
          variant="text"
          size="sm"
          className="mt-3 px-0 font-semibold text-bronze"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      ) : null}

      {!hasPublishedTranscript(waypoint) ? (
        <p className="mt-3 text-xs text-soft-slate/80">
          Placeholder — timed captions will sync with narration in a future update.
        </p>
      ) : null}
    </div>
  )
}

export default AudioTranscriptSection
