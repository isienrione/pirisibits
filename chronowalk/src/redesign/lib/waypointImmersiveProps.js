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
  reconstructionSourceNoteForWaypoint,
} from './waypointPresentation.js'

export function actLabelForWaypoint(waypoint, manifest) {
  const act = waypoint?.act ? manifest?.acts?.find((a) => a.id === waypoint.act) : null
  if (act) return `ACT ${act.numeral} · ${act.title?.toUpperCase()}`
  return `ACT ${numeralForWaypoint(waypoint)}`
}

export function taglineForWaypoint(waypoint) {
  return waypoint?.arrivalLine?.replace(/\s*\/\s*/g, ' · ') ?? approachCopy(waypoint)
}

/**
 * Hero title for the immersive player.
 * - Distinct chapter names (Curia under Severus) stay as the title.
 * - Numbered siblings of the same stop ("Arch of Titus I - …") collapse to the
 *   stop name so the main title never carries a chapter numeral.
 */
export function heroTitleForWaypoint(waypoint, activeChapterTitle, chapterCount = 1) {
  const stopTitle = titleForWaypoint(waypoint)
  if (chapterCount <= 1 || !activeChapterTitle) return stopTitle
  try {
    const escaped = stopTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`^${escaped}\\s+[IVXLC\\d]+\\b`, 'i').test(activeChapterTitle)) {
      return stopTitle
    }
  } catch {
    // ignore bad title characters
  }
  return activeChapterTitle
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
  continueLabel = null,
}) {
  const chapters = waypoint?.chapters?.length ? waypoint.chapters : []
  const { nowAmbienceUrl, thenSoundscapeUrl } = resolveThresholdAmbienceUrls(manifest)
  const transcript = transcriptOverride ?? resolveWaypointTranscript(waypoint, chapterIndex)
  const hasOutro =
    Boolean(waypoint?.outro_variants) &&
    (audio.chapterCount || 0) > chapters.length
  const outroTitle = waypoint?.outro_title || 'Enter the valley'
  const activeChapterTitle =
    chapterIndex >= chapters.length && (hasOutro || waypoint?.outro_variants)
      ? outroTitle
      : chapterTitle(
          chapterAtIndex(chapters, chapterIndex, signatureLine(waypoint)),
          `Chapter ${chapterIndex + 1}`,
        )
  const displayChapterCount =
    audio.chapterCount || Math.max(chapters.length + (waypoint?.outro_variants ? 1 : 0), 1)
  const chapterTitles = [
    ...chapters.map((chapter, index) => chapterTitle(chapter, `Chapter ${index + 1}`)),
    ...(waypoint?.outro_variants ? [outroTitle] : []),
  ]

  return {
    accent: accentForWaypoint(waypoint, manifest),
    actLabel: actLabelForWaypoint(waypoint, manifest),
    title: heroTitleForWaypoint(waypoint, activeChapterTitle, displayChapterCount),
    tagline:
      displayChapterCount > 1 && activeChapterTitle
        ? activeChapterTitle
        : taglineForWaypoint(waypoint),
    chapterTitle: activeChapterTitle,
    chapterIndex,
    chapterCount: displayChapterCount,
    chapterTitles,
    photo: photoForWaypoint(waypoint, chapterIndex),
    waypointId,
    thenPhoto: thenPhotoForWaypoint(waypoint, chapterIndex),
    thenLoop: thenLoopForWaypoint(waypoint, chapterIndex),
    thenLabel: thenLabelForWaypoint(waypoint, chapterIndex),
    honestyCaption: honestyCaptionForWaypoint(waypoint, chapterIndex),
    sourceNote: reconstructionSourceNoteForWaypoint(waypoint, chapterIndex),
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
    continueLabel,
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
