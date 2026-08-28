/**
 * Engine public API — Gates 2A + 2B (provisional narrative).
 * Traveler route composition remains intentionally absent.
 */

export { THEME_CODES, MODE_CODES, THEME_LABELS, MODE_LABELS, DISCOVERY_POSTURE_LABELS, deriveThemeTags } from '@/src/engine/taxonomy'
export { normalizeTraveler, themeWeightsFromInterests } from '@/src/engine/traveler'
export { evaluateNodeEligibility } from '@/src/engine/eligibility/evaluateNodeEligibility'
export { scoreNodeUtility } from '@/src/engine/scoring/nodeUtility'
export { buildCandidatePool } from '@/src/engine/candidates/buildCandidatePool'
export { loadSantiagoEngineNodes, loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
export { loadEditorialCalibration, loadCalibrationByStgoId, loadCanonicalSemanticCalibration, loadSemanticByStgoId } from '@/src/engine/loadCalibration'
export { TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
export * from '@/src/engine/scoring/constants'

export { scoreNarrativeEdge, compareNarrativeScores, themeSimilarity, topThemes } from '@/src/engine/narrative/narrative-edge-score'
export { NARRATIVE_EDGE_SCORE_WEIGHTS } from '@/src/engine/narrative/narrative-constants'
export { createEmptyArcState, applyNarrativeEdgeToArcState, prerequisitesSatisfied } from '@/src/engine/narrative/arc-state'
export { computeArcSignals } from '@/src/engine/narrative/arc-signals'
export { loadLaunch30NarrativeGraph, narrativeEdgesFrom, runtimeEligibleEdges } from '@/src/engine/narrative/narrative-loader'
export { buildLaunch30NarrativeGraph } from '@/src/engine/narrative/propose-narrative-edges'

export type * from '@/src/engine/types'
export type * from '@/src/engine/semanticTypes'
export type * from '@/src/engine/narrative/narrative-types'
