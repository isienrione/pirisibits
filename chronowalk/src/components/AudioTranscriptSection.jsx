export function AudioTranscriptSection({ waypoint, className = '' }) {
  const transcript =
    waypoint?.arrival_transcript ||
    waypoint?.arrival_subtitle ||
    'Full captions and transcript will appear here as audio stories are published for this landmark.'

  return (
    <div className={className}>
      <p className="text-sm leading-relaxed text-soft-slate">{transcript}</p>
      {!waypoint?.arrival_transcript ? (
        <p className="mt-2 text-xs text-soft-slate/80">
          Placeholder — timed captions will sync with narration in a future update.
        </p>
      ) : null}
    </div>
  )
}

export default AudioTranscriptSection
