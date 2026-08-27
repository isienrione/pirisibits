/**
 * Gate 2A — Engine V0.1 node utility / candidate selection public API.
 * Route composition / NarrativeEdgeScore / ArcState are intentionally absent.
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
export type * from '@/src/engine/types'
export type * from '@/src/engine/semanticTypes'
