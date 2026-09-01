/**
 * Gate 2B — minimal ArcState + deterministic transitions.
 */

import {
  ARC_EMOTIONAL_CLAMP,
  RECENT_POI_WINDOW,
  RECENT_RELATION_WINDOW,
} from '@/src/engine/narrative/narrative-constants'
import type {
  ArcState,
  NarrativeEdge,
  NarrativeRelationType,
} from '@/src/engine/narrative/narrative-types'
import type { ThemeCode } from '@/src/lib/city-graph/types'

function uniqStable<T extends string>(xs: T[]): T[] {
  const seen = new Set<T>()
  const out: T[] = []
  for (const x of xs) {
    if (seen.has(x)) continue
    seen.add(x)
    out.push(x)
  }
  return out
}

function clamp01(n: number): number {
  return Math.max(ARC_EMOTIONAL_CLAMP.min, Math.min(ARC_EMOTIONAL_CLAMP.max, n))
}

export function createEmptyArcState(): ArcState {
  return {
    themesSeen: [],
    themesDominant: [],
    questionsOpened: [],
    questionsResolved: [],
    relationTypesRecentlyUsed: [],
    emotionalIntensity: 0.4,
    revealCount: 0,
    anchorCount: 0,
    microRevealCount: 0,
    lastNarrativeHook: null,
    recentPOIs: [],
    repetitionTagsSeen: [],
    lastRelationType: null,
    routeStepIndex: 0,
  }
}

function intensityDelta(relation: NarrativeRelationType): number {
  switch (relation) {
    case 'escalation':
    case 'reveal':
    case 'causal_followup':
      return 0.12
    case 'contrast':
      return 0.06
    case 'relief':
      return -0.14
    case 'resolves_question':
      return -0.05
    case 'deepens_context':
      return 0.08
    default:
      return 0.02
  }
}

export type ArcTransitionInput = {
  edge: Pick<
    NarrativeEdge,
    | 'to'
    | 'relationType'
    | 'themesSupported'
    | 'antiRepetitionTags'
    | 'narrativeHooksSupported'
    | 'optionalQuestionOpened'
    | 'optionalQuestionResolved'
  >
  toTier?: string | null
  toEditorialRole?: string | null
}

/**
 * Apply a narrative edge to ArcState. Deterministic; no LLM.
 */
export function applyNarrativeEdgeToArcState(state: ArcState, input: ArcTransitionInput): ArcState {
  const { edge } = input
  const themesSeen = uniqStable([...state.themesSeen, ...edge.themesSupported]) as ThemeCode[]
  const themesDominant = themesSeen.slice(0, 3)
  const questionsOpened = uniqStable(
    edge.optionalQuestionOpened
      ? [...state.questionsOpened.filter((q) => q !== edge.optionalQuestionResolved), edge.optionalQuestionOpened]
      : state.questionsOpened.filter((q) => q !== edge.optionalQuestionResolved),
  )
  const questionsResolved = uniqStable(
    edge.optionalQuestionResolved ? [...state.questionsResolved, edge.optionalQuestionResolved] : state.questionsResolved,
  )
  const relationTypesRecentlyUsed = [...state.relationTypesRecentlyUsed, edge.relationType].slice(
    -RECENT_RELATION_WINDOW,
  )
  const recentPOIs = [...state.recentPOIs, edge.to].slice(-RECENT_POI_WINDOW)
  const repetitionTagsSeen = uniqStable([...state.repetitionTagsSeen, ...edge.antiRepetitionTags])
  const tier = `${input.toTier || ''} ${input.toEditorialRole || ''}`.toLowerCase()
  const revealCount = state.revealCount + (edge.relationType === 'reveal' ? 1 : 0)
  const anchorCount = state.anchorCount + (/anchor|canonical/.test(tier) ? 1 : 0)
  const microRevealCount = state.microRevealCount + (/micro/.test(tier) ? 1 : 0)
  const lastNarrativeHook = edge.narrativeHooksSupported[0] || state.lastNarrativeHook

  return {
    themesSeen,
    themesDominant,
    questionsOpened,
    questionsResolved,
    relationTypesRecentlyUsed,
    emotionalIntensity: clamp01(state.emotionalIntensity + intensityDelta(edge.relationType)),
    revealCount,
    anchorCount,
    microRevealCount,
    lastNarrativeHook,
    recentPOIs,
    repetitionTagsSeen,
    lastRelationType: edge.relationType,
    routeStepIndex: state.routeStepIndex + 1,
  }
}

export function prerequisitesSatisfied(state: ArcState, prerequisites: string[]): {
  satisfied: boolean
  unresolved: string[]
} {
  const unresolved = prerequisites.filter((p) => {
    if (p.startsWith('theme:')) {
      const theme = p.slice('theme:'.length) as ThemeCode
      return !state.themesSeen.includes(theme)
    }
    if (p.startsWith('question:')) {
      const q = p.slice('question:'.length)
      return !state.questionsOpened.includes(q) && !state.questionsResolved.includes(q)
    }
    if (p.startsWith('poi:')) {
      const id = p.slice('poi:'.length)
      return !state.recentPOIs.includes(id) && !state.recentPOIs.includes(id)
    }
    if (p === 'has_anchor') return state.anchorCount < 1
    if (p === 'has_setup') return state.questionsOpened.length < 1 && state.revealCount < 1
    return false
  })
  return { satisfied: unresolved.length === 0, unresolved }
}
