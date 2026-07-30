import { resolveStepTranscript } from '../../content/chapterMeta.js'
import { stripDirectorCues } from '../../utils/transcriptContent.js'
import { redesignWaypointShellProps } from './waypointImmersiveProps.js'

/** Strip production timing / path meta from traveler-facing transit titles. */
export function cleanTransitTrackTitle(title) {
  if (!title || typeof title !== 'string') return title
  return title
    .replace(/\s*\((?:both paths|PATH\s*[AB])[^)]*\)\s*/gi, '')
    .replace(/\s*[·•]\s*~\d+:\d+\s*$/g, '')
    .trim()
}

/** Shared C2Transit props · one builder for every transit leg. */
export function buildTransitImmersiveProps({
  step,
  manifest,
  context,
  journeyProgressPct,
  audio,
  handlers = {},
}) {
  const target = step.targetWaypoint
  const shell = redesignWaypointShellProps(target, manifest)
  const variantKey = context.path === 'b' ? 'b' : 'a'
  const rawTranscript = resolveStepTranscript(step, context.path)
  const rawTitle =
    step.record?.variant_meta?.[variantKey]?.title ?? step.record?.title ?? null
  const transitNote =
    step.record?.note ??
    (rawTitle
      ? `Listen on the way · ${String(cleanTransitTrackTitle(rawTitle)).replace(/^→\s*/, '')}`
      : 'The city between stops has its own stories · listen while Rome rolls past.')
  const travelMode = step.record?.travel_mode ?? step.record?.travelMode ?? null
  const etaOverride =
    step.record?.eta_label ??
    step.record?.etaLabel ??
    (travelMode === 'ride' ? 'estimated 30 min drive' : null)

  return {
    ...shell,
    note: transitNote,
    progressPct: journeyProgressPct,
    narrationPlaying: audio.narrationPlaying,
    narrationPaused: Boolean(audio.progress?.paused),
    currentTime: audio.progress?.currentTime ?? 0,
    duration: audio.progress?.duration ?? 0,
    playbackRate: audio.playbackRate,
    transcript: rawTranscript ? stripDirectorCues(rawTranscript) : '',
    trackTitle: cleanTransitTrackTitle(rawTitle),
    etaOverride,
    travelMode,
    ...handlers,
  }
}
