/**
 * Gate 2E.6 — Feature-Complete Alpha status model.
 * BUILD must be READY for 19/19. DATA/HUMAN/PRODUCTION may remain PARTIAL/BLOCKED.
 */

export type FeatureStatusValue = 'READY' | 'PARTIAL' | 'BLOCKED' | 'NOT_REQUIRED'

export type ComponentStatusAxes = {
  BUILD: FeatureStatusValue
  DATA_CALIBRATION: FeatureStatusValue
  HUMAN_VALIDATION: FeatureStatusValue
  PRODUCTION: FeatureStatusValue
}

export type EngineComponentId =
  | 'ExperienceGraph'
  | 'PhysicalGraph'
  | 'NarrativeGraph'
  | 'Interests'
  | 'DiscoveryPosture'
  | 'ExperienceStructure'
  | 'Context'
  | 'TravelerModel'
  | 'HardFeasibility'
  | 'FeasibleExperienceGraph'
  | 'IntrinsicWorth'
  | 'TravelerMatch'
  | 'RoleFit'
  | 'MarginalRouteValue'
  | 'TransitionValue'
  | 'ArcStateIncrementalNarrative'
  | 'MultiRouteComposer'
  | 'ArcQuality'
  | 'ArbitrationExplanation'

export type EngineComponentStatus = {
  id: EngineComponentId
  ordinal: number
  label: string
  status: ComponentStatusAxes
  notes: string
}

export const ENGINE_FEATURE_COMPLETE_ALPHA_COMPONENTS: EngineComponentStatus[] = [
  {
    id: 'ExperienceGraph',
    ordinal: 1,
    label: 'Experience Graph',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'Place/Experience/ContentModule executable via legacy adapter; curated ExperienceTimes pending',
  },
  {
    id: 'PhysicalGraph',
    ordinal: 2,
    label: 'Physical Graph',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'PARTIAL', PRODUCTION: 'BLOCKED' },
    notes: 'Frozen Mapbox/physical graph reused; STGO_105 pending',
  },
  {
    id: 'NarrativeGraph',
    ordinal: 3,
    label: 'Narrative Graph',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'Existing directed graph + Experience adapter; D2 question/reveal sparse',
  },
  {
    id: 'Interests',
    ordinal: 4,
    label: 'Interests',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'Extensible semantic facets coexist with T1A–T9; no Santiago facet values assigned this gate',
  },
  {
    id: 'DiscoveryPosture',
    ordinal: 5,
    label: 'Discovery Posture',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'PosturePolicyVNext maps 12 legacy touchpoints → 2 responsibilities; shadow only',
  },
  {
    id: 'ExperienceStructure',
    ordinal: 6,
    label: 'Experience Structure',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'M1–M5 + activityMode + party context request dimensions',
  },
  {
    id: 'Context',
    ordinal: 7,
    label: 'Context',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'PARTIAL', PRODUCTION: 'BLOCKED' },
    notes: 'Route/request context + arrival-time state reservation',
  },
  {
    id: 'TravelerModel',
    ordinal: 8,
    label: 'TravelerModel',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'Multidimensional TravelerModel + facets + party/activity extensions',
  },
  {
    id: 'HardFeasibility',
    ordinal: 9,
    label: 'Hard Feasibility',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'PARTIAL', PRODUCTION: 'BLOCKED' },
    notes: 'Experience-level hard feasibility wrapping node eligibility + M2 fail-closed',
  },
  {
    id: 'FeasibleExperienceGraph',
    ordinal: 10,
    label: 'Feasible Experience Graph',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'buildFeasibleExperienceGraph executable with exclusion reasons',
  },
  {
    id: 'IntrinsicWorth',
    ordinal: 11,
    label: 'IntrinsicWorth',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'V0.2 IW via Experience adapter',
  },
  {
    id: 'TravelerMatch',
    ordinal: 12,
    label: 'TravelerMatch',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'Runtime formula frozen; VNext diagnostics expose components + selection gap',
  },
  {
    id: 'RoleFit',
    ordinal: 13,
    label: 'RoleFit',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'Structural roles ANCHOR/POCKET/MICRO_REVEAL + narrative role capabilities separated',
  },
  {
    id: 'MarginalRouteValue',
    ordinal: 14,
    label: 'MarginalRouteValue',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'V0.2 MRV wired through VNext composer',
  },
  {
    id: 'TransitionValue',
    ordinal: 15,
    label: 'TransitionValue',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'V0.2 TransitionValue + narrative edge adapter',
  },
  {
    id: 'ArcStateIncrementalNarrative',
    ordinal: 16,
    label: 'ArcState / Incremental Narrative Controller',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'ArcStateVNext + IncrementalArcValue + rhythm; provisional phase config',
  },
  {
    id: 'MultiRouteComposer',
    ordinal: 17,
    label: 'Multi-route Composer',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'Deterministic VNext composer; H2 frozen; SIGNATURE/DISCOVERY/FLOW diversification retained',
  },
  {
    id: 'ArcQuality',
    ordinal: 18,
    label: 'ArcQuality',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'ArcQualityVNext without timeUtilization; frozen Arc unchanged',
  },
  {
    id: 'ArbitrationExplanation',
    ordinal: 19,
    label: 'Arbitration + Explanation',
    status: { BUILD: 'READY', DATA_CALIBRATION: 'PARTIAL', HUMAN_VALIDATION: 'BLOCKED', PRODUCTION: 'BLOCKED' },
    notes: 'CURRENT + EXPERIMENTAL_FULL_FEATURE objectives; LanePrior toggle; explanation + live trace',
  },
]

export function allBuildReady(components: EngineComponentStatus[] = ENGINE_FEATURE_COMPLETE_ALPHA_COMPONENTS): boolean {
  return components.every((c) => c.status.BUILD === 'READY')
}

export function summarizeFeatureCompleteStatus() {
  return {
    gate: '2E.6',
    status: 'NON_CANONICAL',
    ENGINE_FEATURE_COMPLETE_ALPHA: true,
    ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL: false,
    buildReadyCount: ENGINE_FEATURE_COMPLETE_ALPHA_COMPONENTS.filter((c) => c.status.BUILD === 'READY').length,
    buildReadyRequired: 19,
    allBuildReady: allBuildReady(),
    components: ENGINE_FEATURE_COMPLETE_ALPHA_COMPONENTS,
  }
}
