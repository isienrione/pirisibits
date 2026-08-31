/**
 * Gate 2E.6 — ArcStateVNext + IncrementalArcValue + advanceArcState.
 * Budget-fraction based. Provisional phase thresholds — NOT final.
 */

import type { ExperienceRecord, NarrativeRoleCapability } from '@/src/engine/vnext/place/types'
import type { TravelerModel } from '@/src/engine/types'

export type ArcPhase = 'EARLY' | 'MIDDLE' | 'LATE' | 'LANDING' | 'UNKNOWN'

/** Versioned provisional config — thresholds NOT founder-final. */
export const ARC_PHASE_CONFIG_VNEXT = {
  version: 'arc-phase.vnext.0.1.provisional',
  calibrationRequired: true as const,
  /** Provisional only — may change after calibration. */
  earlyMax: 0.25,
  middleMax: 0.55,
  lateMax: 0.85,
  // remainder → LANDING
}

export type ArrivalTimeState = {
  routeStartTimeIso: string | null
  arrivalTimeByExperienceId: Record<string, string | null>
  openingHoursEvaluatedAtArrival: boolean
  fabricatedOpeningHours: false
}

export type ArcStateVNext = {
  phase: ArcPhase
  fractionOfBudgetConsumed: number
  themesIntroduced: string[]
  themesDeveloped: string[]
  recentThemes: string[]
  openQuestions: string[]
  resolvedQuestions: string[]
  usedNarrativeRoles: NarrativeRoleCapability[]
  recentNarrativeRoles: NarrativeRoleCapability[]
  orientationSatisfied: boolean
  payoffSatisfied: boolean
  landingSatisfied: boolean
  strongestRevealUsed: boolean
  repetitionLoad: number
  contrastNeed: number
  narrativeIntensity: number
  recentExperienceBeats: number
  recentRequiredStops: number
  recentStationaryStops: number
  narrationLoad: number
  arrivalTimeState: ArrivalTimeState
  unknownNarrativeCoverage: number
  stopCount: number
}

export function initialArcStateVNext(routeStartTimeIso: string | null = null): ArcStateVNext {
  return {
    phase: 'EARLY',
    fractionOfBudgetConsumed: 0,
    themesIntroduced: [],
    themesDeveloped: [],
    recentThemes: [],
    openQuestions: [],
    resolvedQuestions: [],
    usedNarrativeRoles: [],
    recentNarrativeRoles: [],
    orientationSatisfied: false,
    payoffSatisfied: false,
    landingSatisfied: false,
    strongestRevealUsed: false,
    repetitionLoad: 0,
    contrastNeed: 0.5,
    narrativeIntensity: 0,
    recentExperienceBeats: 0,
    recentRequiredStops: 0,
    recentStationaryStops: 0,
    narrationLoad: 0,
    arrivalTimeState: {
      routeStartTimeIso,
      arrivalTimeByExperienceId: {},
      openingHoursEvaluatedAtArrival: false,
      fabricatedOpeningHours: false,
    },
    unknownNarrativeCoverage: 1,
    stopCount: 0,
  }
}

export function phaseFromBudgetFraction(frac: number): ArcPhase {
  if (!Number.isFinite(frac)) return 'UNKNOWN'
  if (frac < ARC_PHASE_CONFIG_VNEXT.earlyMax) return 'EARLY'
  if (frac < ARC_PHASE_CONFIG_VNEXT.middleMax) return 'MIDDLE'
  if (frac < ARC_PHASE_CONFIG_VNEXT.lateMax) return 'LATE'
  return 'LANDING'
}

export type IncrementalArcValueComponents = {
  orientationNeedFit: number
  developmentFit: number
  contrastFit: number
  questionProgressionFit: number
  payoffFit: number
  landingFit: number
  repetitionPenalty: number
  prematurePayoffPenalty: number
  newSetupLatePenalty: number
  rhythmFit: number
  evidenceCoverage: number
}

export type IncrementalArcValueResult = {
  components: IncrementalArcValueComponents
  aggregate: number
  weightsVersion: string
  calibrationRequired: true
}

const IAV_WEIGHTS = {
  version: 'iav.vnext.0.1.provisional',
  orientationNeedFit: 0.12,
  developmentFit: 0.14,
  contrastFit: 0.1,
  questionProgressionFit: 0.1,
  payoffFit: 0.12,
  landingFit: 0.1,
  repetitionPenalty: 0.1,
  prematurePayoffPenalty: 0.08,
  newSetupLatePenalty: 0.06,
  rhythmFit: 0.08,
}

export function computeIncrementalArcValue(args: {
  currentArcState: ArcStateVNext
  candidateExperience: ExperienceRecord
  narrativeEdgeAvailable: boolean
  traveler: TravelerModel
  remainingBudgetMin: number
  rhythmScore01: number
}): IncrementalArcValueResult {
  const s = args.currentArcState
  const caps = args.candidateExperience.narrativeRoleCapabilities
  const has = (r: NarrativeRoleCapability) => caps.includes(r)

  const orientationNeedFit = !s.orientationSatisfied && (has('ORIENT') || s.phase === 'EARLY') ? 0.9 : s.orientationSatisfied ? 0.4 : 0.5
  const developmentFit = s.phase === 'MIDDLE' || s.phase === 'EARLY' ? (has('DEVELOP') || has('BRIDGE') ? 0.85 : 0.55) : 0.45
  const contrastFit = s.contrastNeed * (has('CONTRAST') ? 1 : 0.4)
  const questionProgressionFit = args.narrativeEdgeAvailable
    ? has('SETUP')
      ? 0.8
      : has('RESOLVE') && s.openQuestions.length
        ? 0.9
        : 0.5
    : 0.35
  const payoffFit = s.phase === 'LATE' || s.phase === 'LANDING' ? (has('PAYOFF') || has('REVEAL') ? 0.9 : 0.4) : has('PAYOFF') ? 0.3 : 0.5
  const landingFit = s.phase === 'LANDING' ? (has('LAND') || has('RESOLVE') ? 0.95 : 0.5) : 0.4
  const placeKey = args.candidateExperience.placeId ?? args.candidateExperience.experienceId
  const repetitionPenalty = s.recentThemes.includes(placeKey) ? 0.8 : Math.min(1, s.repetitionLoad)
  const prematurePayoffPenalty = s.phase === 'EARLY' && (has('PAYOFF') || has('REVEAL')) ? 0.7 : 0
  const newSetupLatePenalty = (s.phase === 'LATE' || s.phase === 'LANDING') && has('SETUP') ? 0.6 : 0
  const rhythmFit = args.rhythmScore01
  const evidenceCoverage = caps.length ? 0.7 : args.narrativeEdgeAvailable ? 0.5 : 0.25

  const components: IncrementalArcValueComponents = {
    orientationNeedFit,
    developmentFit,
    contrastFit,
    questionProgressionFit,
    payoffFit,
    landingFit,
    repetitionPenalty,
    prematurePayoffPenalty,
    newSetupLatePenalty,
    rhythmFit,
    evidenceCoverage,
  }

  let raw = 0
  raw += IAV_WEIGHTS.orientationNeedFit * orientationNeedFit
  raw += IAV_WEIGHTS.developmentFit * developmentFit
  raw += IAV_WEIGHTS.contrastFit * contrastFit
  raw += IAV_WEIGHTS.questionProgressionFit * questionProgressionFit
  raw += IAV_WEIGHTS.payoffFit * payoffFit
  raw += IAV_WEIGHTS.landingFit * landingFit
  raw += IAV_WEIGHTS.rhythmFit * rhythmFit
  raw -= IAV_WEIGHTS.repetitionPenalty * repetitionPenalty
  raw -= IAV_WEIGHTS.prematurePayoffPenalty * prematurePayoffPenalty
  raw -= IAV_WEIGHTS.newSetupLatePenalty * newSetupLatePenalty
  raw = Math.max(0, Math.min(1, raw)) * evidenceCoverage

  return {
    components,
    aggregate: Math.round(raw * 1000) / 1000,
    weightsVersion: IAV_WEIGHTS.version,
    calibrationRequired: true,
  }
}

export function advanceArcState(args: {
  currentState: ArcStateVNext
  selectedExperience: ExperienceRecord
  selectedNarrativeRelation: string | null
  elapsedTimeMin: number
  timeBudgetMin: number
  themes?: string[]
  opensQuestion?: string | null
  resolvesQuestion?: string | null
  isReveal?: boolean
  isPayoff?: boolean
  stationary?: boolean
  required?: boolean
  narrationMin?: number
}): ArcStateVNext {
  const s = { ...args.currentState }
  s.stopCount += 1
  s.fractionOfBudgetConsumed = Math.min(
    1,
    args.timeBudgetMin > 0 ? args.elapsedTimeMin / args.timeBudgetMin : s.fractionOfBudgetConsumed,
  )
  s.phase = phaseFromBudgetFraction(s.fractionOfBudgetConsumed)

  const themes = args.themes ?? []
  for (const t of themes) {
    if (!s.themesIntroduced.includes(t)) s.themesIntroduced = [...s.themesIntroduced, t]
    else if (!s.themesDeveloped.includes(t)) s.themesDeveloped = [...s.themesDeveloped, t]
  }
  s.recentThemes = [...themes, ...s.recentThemes].slice(0, 5)

  const roles = args.selectedExperience.narrativeRoleCapabilities
  s.usedNarrativeRoles = [...new Set([...s.usedNarrativeRoles, ...roles])]
  s.recentNarrativeRoles = [...roles, ...s.recentNarrativeRoles].slice(0, 6)

  if (roles.includes('ORIENT') || s.stopCount === 1) s.orientationSatisfied = true
  if (args.isPayoff || roles.includes('PAYOFF')) s.payoffSatisfied = true
  if (roles.includes('LAND') || s.phase === 'LANDING') s.landingSatisfied = true
  if (args.isReveal || roles.includes('REVEAL')) s.strongestRevealUsed = true

  if (args.opensQuestion) s.openQuestions = [...s.openQuestions, args.opensQuestion]
  if (args.resolvesQuestion) {
    s.openQuestions = s.openQuestions.filter((q) => q !== args.resolvesQuestion)
    s.resolvedQuestions = [...s.resolvedQuestions, args.resolvesQuestion]
  }

  const placeKey = args.selectedExperience.placeId ?? args.selectedExperience.experienceId
  if (s.recentThemes.filter((t) => t === placeKey).length > 1) s.repetitionLoad = Math.min(1, s.repetitionLoad + 0.25)
  s.contrastNeed = Math.max(0, Math.min(1, 0.3 + (1 - s.themesIntroduced.length / 8)))
  s.narrativeIntensity = Math.min(1, s.narrativeIntensity + (roles.includes('ESCALATE') ? 0.2 : 0.05))

  s.recentExperienceBeats += 1
  if (args.required !== false) s.recentRequiredStops += 1
  if (args.stationary !== false) s.recentStationaryStops += 1
  s.narrationLoad += args.narrationMin ?? 0

  s.arrivalTimeState = {
    ...s.arrivalTimeState,
    arrivalTimeByExperienceId: {
      ...s.arrivalTimeState.arrivalTimeByExperienceId,
      [args.selectedExperience.experienceId]: null,
    },
  }

  s.unknownNarrativeCoverage = args.selectedNarrativeRelation ? Math.max(0, s.unknownNarrativeCoverage - 0.1) : s.unknownNarrativeCoverage

  return s
}
