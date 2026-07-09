import { chapterAtIndex, chapterTitle, chapterTranscript } from '../../content/chapterMeta.js'
import { resolveThresholdAmbienceUrls } from '../../content/thresholdAmbience.js'
import { stripDirectorCues } from '../../utils/transcriptContent.js'
import {
  accentForWaypoint,
  approachCopy,
  arrivalCopy,
  hasImmersiveThreshold,
  honestyCaptionForWaypoint,
  numeralForWaypoint,
  photoForWaypoint,
  signatureLine,
  thenLabelForWaypoint,
  thenLoopForWaypoint,
  thenPhotoForWaypoint,
  titleForWaypoint,
} from './waypointPresentation.js'

export function actLabelForWaypoint(waypoint, manifest) {
  const act = waypoint?.act ? manifest?.acts?.find((a) => a.id === waypoint.act) : null
  if (act) return `ACT ${act.numeral} — ${act.title?.toUpperCase()}`
  return `ACT ${numeralForWaypoint(waypoint)}`
}

export function taglineForWaypoint(waypoint) {
  return waypoint?.arrivalLine?.replace(/\s*\/\s*/g, ' — ') ?? approachCopy(waypoint)
}

export function resolveWaypointTranscript(waypoint, chapterIndex = 0, fallbackTranscript = null) {
  const chapters = waypoint?.chapters?.length ? waypoint.chapters : []
  const activeChapter = chapterAtIndex(chapters, chapterIndex, signatureLine(waypoint))
  const chapterScopedTranscript = chapterTranscript(activeChapter)
  const raw =
    chapters.length > 1 && chapterScopedTranscript
      ? chapterScopedTranscript
      : fallbackTranscript ?? chapterScopedTranscript ?? waypoint?.transcript ?? ''
  return raw ? stripDirectorCues(raw) : ''
}

/** Shared C6ImmersivePlayer props for any manifest waypoint. */
export function buildImmersivePlayerProps({
  waypoint,
  waypointId,
  manifest,
  chapterIndex = 0,
  storyEnded = false,
  initialTab = 'audio',
  audio = {},
  handlers = {},
  transcriptOverride = null,
}) {
  const chapters = waypoint?.chapters?.length ? waypoint.chapters : []
  const { nowAmbienceUrl, thenSoundscapeUrl } = resolveThresholdAmbienceUrls(manifest)
  const transcript = transcriptOverride ?? resolveWaypointTranscript(waypoint, chapterIndex)

  return {
    accent: accentForWaypoint(waypoint, manifest),
    actLabel: actLabelForWaypoint(waypoint, manifest),
    title: titleForWaypoint(waypoint),
    tagline: taglineForWaypoint(waypoint),
    chapterTitle: chapterTitle(
      chapterAtIndex(chapters, chapterIndex, signatureLine(waypoint)),
      `Chapter ${chapterIndex + 1}`
    ),
    chapterIndex,
    chapterCount: audio.chapterCount || Math.max(chapters.length, 1),
    chapterTitles: chapters.map((chapter, index) =>
      chapterTitle(chapter, `Chapter ${index + 1}`)
    ),
    photo: photoForWaypoint(waypoint),
    waypointId,
    thenPhoto: thenPhotoForWaypoint(waypoint),
    thenLoop: thenLoopForWaypoint(waypoint),
    thenLabel: thenLabelForWaypoint(waypoint),
    honestyCaption: honestyCaptionForWaypoint(waypoint),
    nowAmbienceUrl,
    thenSoundscapeUrl,
    transcript,
    transcriptAvailable: Boolean(transcript),
    narrationPlaying: Boolean(audio.narrationPlaying),
    currentTime: audio.currentTime ?? 0,
    duration: audio.duration ?? 0,
    playbackRate: audio.playbackRate ?? 1,
    audioAvailable: Boolean(audio.audioAvailable),
    storyEnded,
    hasReconstruction: hasImmersiveThreshold(waypoint),
    initialTab,
    onTogglePlay: handlers.onTogglePlay,
    onSkipBack: handlers.onSkipBack,
    onSkipForward: handlers.onSkipForward,
    onSeek: handlers.onSeek,
    onSelectChapter: handlers.onSelectChapter,
    onOpenTranscript: handlers.onOpenTranscript,
    onStoryComplete: handlers.onStoryComplete,
    onThresholdCross: handlers.onThresholdCross,
    onBack: handlers.onBack,
    onOpenThreshold: handlers.onOpenThreshold,
    onViewImages: handlers.onViewImages,
    onCycleSpeed: handlers.onCycleSpeed,
    speeds: handlers.speeds,
  }
}

export function redesignWaypointShellProps(waypoint, manifest) {
  return {
    accent: accentForWaypoint(waypoint, manifest),
    title: titleForWaypoint(waypoint),
    photo: photoForWaypoint(waypoint),
    direction: approachCopy(waypoint),
    arrivalLine: arrivalCopy(waypoint),
    signatureLine: signatureLine(waypoint),
    actNumeral: numeralForWaypoint(waypoint),
  }
}
