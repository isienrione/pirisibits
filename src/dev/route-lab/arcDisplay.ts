/**
 * Gate 2E — ArcQuality weighted breakdown for Route Lab display.
 */

import {
  ARC_QUALITY_PENALTY_WEIGHTS,
  ARC_QUALITY_POSITIVE_WEIGHTS,
} from '@/src/engine/routes/arc-quality-config'
import type { ArcQualityResult } from '@/src/engine/routes/arc-quality'

export type ArcDisplayRow = {
  key: string
  value: number
  weight: number
  contribution: number
  kind: 'positive' | 'penalty'
  explanation: string
}

const POSITIVE_EXPL: Record<string, string> = {
  openingStrength: 'First-stop orientation, utility, and traveler match.',
  developmentStrength: 'Mid-route build-up via utility, themes, and narrative depth.',
  payoffStrength: 'Resolution and emotional landing from ArcState.',
  endingStrength: 'Final stop utility and thematic landing.',
  rhythmBalance: 'Anchor/pocket/micro mix vs soft bands.',
  curiosityContinuity: 'Open questions and reveal beats sustained.',
  themeDiversity: 'Theme spread across route.',
  thematicCoherence: 'Sequential theme overlap / continuity.',
  contrastBalance: 'Contrast relation presence.',
  revealSpacing: 'Spacing of reveal/micro beats.',
  anchorDistribution: 'Anchor ratio vs descriptive band.',
  structuralVariety: 'Structural alternation across stops.',
  relationTypeVariety: 'Distinct narrative relation types used.',
  questionResolution: 'Authored questions resolved by route end.',
  timeUtilization: 'Budget use vs slack and continuations.',
  routeDistinctiveness: 'Unique POIs and themes visited.',
}

const PENALTY_EXPL: Record<string, string> = {
  repetitionPenalty: 'Repeated tags / relation repetition from ArcState.',
  unresolvedSetupPenalty: 'Questions opened but not resolved in metadata.',
  structuralMonotonyPenalty: 'Long anchor or micro runs.',
  themeMonotonyPenalty: 'Single-theme mechanical repetition.',
  relationMonotonyPenalty: 'Consecutive identical relation types.',
  weakEndingPenalty: 'Landing utility weak for traveler intent.',
  overstuffingPenalty: 'Compressed dwell / high stop density.',
  underutilizedBudgetPenalty: 'Large unused budget with worthwhile continuations.',
  backtrackingPenalty: 'Thematic/structural backtracking patterns.',
}

export function arcQualityDisplayRows(arc: ArcQualityResult): ArcDisplayRow[] {
  const positives = Object.entries(ARC_QUALITY_POSITIVE_WEIGHTS).map(([key, weight]) => {
    const value = arc.components[key as keyof typeof arc.components]
    return {
      key,
      value,
      weight,
      contribution: Math.round(value * weight * 1000) / 1000,
      kind: 'positive' as const,
      explanation: POSITIVE_EXPL[key] || key,
    }
  })
  const penalties = Object.entries(ARC_QUALITY_PENALTY_WEIGHTS).map(([key, weight]) => {
    const value = arc.penalties[key as keyof typeof arc.penalties]
    return {
      key,
      value,
      weight,
      contribution: Math.round(value * weight * 1000) / 1000,
      kind: 'penalty' as const,
      explanation: PENALTY_EXPL[key] || key,
    }
  })
  return [...positives, ...penalties]
}
