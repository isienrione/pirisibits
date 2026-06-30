export function getWaypointTranscript(waypoint) {
  return (
    waypoint?.arrival_transcript ||
    waypoint?.arrival_subtitle ||
    'Full captions and transcript will appear here as audio stories are published for this landmark.'
  )
}

export function hasPublishedTranscript(waypoint) {
  return Boolean(waypoint?.arrival_transcript)
}
