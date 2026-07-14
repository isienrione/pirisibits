import { resolveStepTranscript } from '../../content/chapterMeta.js'
import { stripDirectorCues } from '../../utils/transcriptContent.js'
import { redesignWaypointShellProps } from './waypointImmersiveProps.js'

/** Shared C2Transit props — one builder for every transit leg. */
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
  const transitNote =
    step.record?.note ??
    (step.record?.title
      ? `Listen on the way — ${String(step.record.title).replace(/^→\s*/, '')}`
      : 'The city between stops has its own stories — listen while Rome rolls past.')

  return {
    ...shell,
    note: transitNote,
    progressPct: journeyProgressPct,
    narrationPlaying: audio.narrationPlaying,
    narrationPaused: Boolean(audio.progress?.paused),
    /* Scrubber follows audioProgressStore in WalkingCompanion / mini player. */
    currentTime: 0,
    duration: audio.progress?.duration ?? 0,
    playbackRate: audio.playbackRate,
    transcript: rawTranscript ? stripDirectorCues(rawTranscript) : '',
    trackTitle:
      step.record?.variant_meta?.[variantKey]?.title ?? step.record?.title ?? null,
    ...handlers,
  }
}
