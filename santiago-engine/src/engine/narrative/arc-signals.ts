/**
 * Gate 2B — reusable Arc signal helpers for later Gate 2D.
 * Explicitly NOT a final ArcQuality score.
 */

import type { ArcSignalSnapshot, ArcState, NarrativeRelationType } from '@/src/engine/narrative/narrative-types'
import { THEME_CODES } from '@/src/engine/taxonomy'

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function countRelation(types: NarrativeRelationType[], want: NarrativeRelationType): number {
  return types.filter((t) => t === want).length
}

/**
 * Deterministic arc signals from ArcState (+ optional relation history length).
 * `arcQualityComplete` is always false in Gate 2B.
 */
export function computeArcSignals(state: ArcState): ArcSignalSnapshot {
  const steps = Math.max(1, state.routeStepIndex)
  const themeDiversity = clamp01(state.themesSeen.length / THEME_CODES.length)
  const openingStrength = clamp01(
    (state.anchorCount > 0 ? 0.45 : 0.1) + (state.themesDominant.length > 0 ? 0.35 : 0) + (steps >= 1 ? 0.2 : 0),
  )
  const developmentStrength = clamp01(
    state.revealCount * 0.2 + countRelation(state.relationTypesRecentlyUsed, 'deepens_context') * 0.25 + themeDiversity * 0.4,
  )
  const payoffStrength = clamp01(
    countRelation(state.relationTypesRecentlyUsed, 'resolves_question') * 0.4 +
      state.questionsResolved.length * 0.2 +
      (state.emotionalIntensity > 0.55 ? 0.2 : 0.05),
  )
  const rhythmBalance = clamp01(
    1 -
      Math.abs(
        countRelation(state.relationTypesRecentlyUsed, 'escalation') -
          countRelation(state.relationTypesRecentlyUsed, 'relief'),
      ) *
        0.35,
  )
  const curiosityContinuity = clamp01(
    state.questionsOpened.filter((q) => !state.questionsResolved.includes(q)).length * 0.3 +
      state.revealCount * 0.15 +
      0.2,
  )
  const repetitionPenalty = clamp01(state.repetitionTagsSeen.length * 0.08 + (state.lastRelationType && countRelation(state.relationTypesRecentlyUsed, state.lastRelationType) >= 2 ? 0.25 : 0))
  const unresolvedSetupPenalty = clamp01(
    state.questionsOpened.filter((q) => !state.questionsResolved.includes(q)).length * 0.25,
  )
  const contrastBalance = clamp01(countRelation(state.relationTypesRecentlyUsed, 'contrast') * 0.35 + 0.2)
  const revealSpacing = clamp01(1 - Math.abs(state.revealCount / steps - 0.25) * 2)
  const anchorDistribution = clamp01(1 - Math.abs(state.anchorCount / steps - 0.35) * 1.5)

  return {
    openingStrength: round2(openingStrength),
    developmentStrength: round2(developmentStrength),
    payoffStrength: round2(payoffStrength),
    rhythmBalance: round2(rhythmBalance),
    curiosityContinuity: round2(curiosityContinuity),
    themeDiversity: round2(themeDiversity),
    repetitionPenalty: round2(repetitionPenalty),
    unresolvedSetupPenalty: round2(unresolvedSetupPenalty),
    contrastBalance: round2(contrastBalance),
    revealSpacing: round2(revealSpacing),
    anchorDistribution: round2(anchorDistribution),
    arcQualityComplete: false,
  }
}
