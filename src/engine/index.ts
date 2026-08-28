/**
 * Engine public API — Gates 2A + 2B + provisional 2C route composer.
 * Production traveler routing remains disabled via flags.
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

export { composeProvisionalRoutes } from '@/src/engine/routes/route-composer'
export { normalizeRouteRequest, hashRouteRequest, serializeRouteRequest } from '@/src/engine/routes/route-request'
export {
  stopOverlap,
  orderedOverlap,
  edgeOverlap,
  routeSimilarity,
  timeDifference,
  scoreDifference,
  themeCoverageDifference,
  compositionDifference,
} from '@/src/engine/routes/route-compare'
export { ROUTE_SCORE_WEIGHTS, ROUTE_SEARCH_CONFIG } from '@/src/engine/routes/route-config'

export type * from '@/src/engine/types'
export type * from '@/src/engine/semanticTypes'
export type * from '@/src/engine/narrative/narrative-types'
export type * from '@/src/engine/routes/route-types'
