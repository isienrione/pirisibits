/**
 * Gate 1B.2 — Santiago City Engine node contracts.
 * Canonical primary key is STGO_XX. Legacy slugs are compatibility only.
 * Provider geography ≠ curator approval. POI ≠ entrance ≠ experience-point.
 */

export type ThemeCode =
  | 'T1A'
  | 'T1B'
  | 'T2'
  | 'T3'
  | 'T4'
  | 'T5'
  | 'T6'
  | 'T7'
  | 'T8'
  | 'T9'

/** Product mobility modes used by the solver (M1 reserved / unused). */
export type ModeCode = 'M1' | 'M2' | 'M3' | 'M4' | 'M5'

export type IdentityResolutionStatus = 'RESOLVED' | 'UNRESOLVED'

export type ProviderClassification =
  | 'AUTO_HIGH_CONFIDENCE'
  | 'NEEDS_CURATOR_REVIEW'
  | 'SUSPICIOUS'
  | 'NO_RESULT'
  | 'PENDING_GEOCODE'

export type PhysicalVerificationState =
  | 'IDENTITY_ONLY'
  | 'PROVIDER_DERIVED'
  | 'NEEDS_CURATOR_REVIEW'
  | 'SUSPICIOUS'
  | 'NO_RESULT'
  | 'CURATOR_APPROVED'
  | 'FIELD_VERIFIED'
  | 'UNRESOLVED'

export type LegacyMappingStatus = 'resolved' | 'proposed' | 'unresolved'

export type LatLng = {
  lat: number
  lng: number
}

export type ProviderCandidate = {
  provider: 'mapbox'
  providerId: string | null
  placeName: string | null
  text: string | null
  relevance: number | null
  accuracy: string | null
  category: string | null
  lat: number | null
  lng: number | null
  inSantiagoBbox: boolean
  placeType: string[]
  looksPenalizedCommune: boolean
}

export type LaunchPhysicalReadiness =
  | 'READY_FOR_EDGE_GENERATION'
  | 'PARTIAL_REVIEW_REQUIRED'
  | 'UNRESOLVED_RESEARCH_REQUIRED'
  | 'NEEDS_SEMANTIC_REVIEW'

export type PhysicalPoint = {
  id: string
  label: string
  role: string
  coordinate: LatLng | null
  provenance: 'CURATOR_APPROVED' | 'PROVIDER_DERIVED' | null
  notes?: string | null
}

export type CuratorCurationBlock = {
  gate: string
  source: string
  founderPlaceName: string
  googleMapsUrls: string[]
  notes?: string | null
  providerDiffMeters?: number | null
  curatorOverrideProvider?: boolean
  overrideReason?: string | null
  uiColor?: 'GREEN' | 'YELLOW' | 'RED'
  semanticWarning?: string | null
  researchBlocker?: string | null
  coordinateConflict?: Record<string, unknown> | null
}

export type ProvenanceBlock = {
  identity: {
    status: IdentityResolutionStatus
    sources: string[]
    missingSource?: string | null
  }
  physical: {
    provider: 'mapbox' | null
    coordinatePolicy: string
    curatorApproval: 'never-automatic' | 'CURATOR_APPROVED' | null
    selectionStatus: string | null
    humanCurationGate?: string | null
    humanCurationSource?: string | null
  }
  editorial: {
    source: string | null
    status: 'present' | 'absent' | 'partial'
  }
}

/**
 * Canonical Santiago engine node (STGO_01 … STGO_103).
 * Null is valid for unknown factual fields — never fabricate.
 */
export type SantiagoEngineNode = {
  /** Canonical primary key — never a legacy slug. */
  stgoId: string
  /** Compatibility slug from Gate 1B.1 identity corpus. */
  legacySlug: string
  canonicalName: string | null
  displayName: string | null
  aliases: string[]
  commune: string | null
  neighborhood: string | null
  identityStatus: IdentityResolutionStatus
  identityMissingSource: string | null

  themes: ThemeCode[]
  modes: ModeCode[]

  editorialRole: string | null
  tier: string | null
  chronoWorth: number | null

  /** Discovery / POI centroid candidate — not entrance, not experience-point. */
  poiCoordinate: LatLng | null
  entranceCoordinate: LatLng | null
  experiencePointCoordinate: LatLng | null
  nearestTransit: {
    stationName: string | null
    line: string | null
    distanceMeters: number | null
    status: 'UNRESOLVED'
  }
  geographicIsland: string | null
  physicalVerificationState: PhysicalVerificationState

  legacyContentId: string | null
  legacyMappingStatus: LegacyMappingStatus

  provenance: ProvenanceBlock

  launchCorpus: boolean
  fieldPriority: 'LAUNCH' | 'BACKLOG'
  verificationPriority: number | null

  geocodeQuery: string | null
  queryUsed: string | null
  providerClassification: ProviderClassification
  providerCandidate: ProviderCandidate | null
  candidates: ProviderCandidate[]
  selectionReason: string | null
  providerId: string | null
  /** Human curator approval from Gate 1B.2A founder review; never automatic from Mapbox. */
  curatorApproval: 'CURATOR_APPROVED' | null
  launchPhysicalReadiness?: LaunchPhysicalReadiness | null
  physicalPoints?: PhysicalPoint[]
  accessPoints?: PhysicalPoint[]
  providerAudit?: Record<string, unknown> | null
  curatorCuration?: CuratorCurationBlock | null
  physicalRouteGenerationEligible?: boolean
  /** Hard rule mirror — must remain false in generated data. */
  physicalRouteGenerationEnabled: false
}

export type SantiagoEngineNodesFile = {
  schemaVersion: 'santiago-engine-nodes.v0.1'
  cityId: 'santiago'
  gate: '1B.2' | '1B.2A'
  nodeCount: 103
  launchCorpusCount: 30
  backlogCount: 73
  physicalRouteGenerationEnabled: false
  autoCuratorApproveFromMapbox: false
  coordinatePolicy: string
  experiencePointPolicy: string
  transitPolicy: string
  humanCurationPolicy?: string
  launchCorpusStgoIds: string[]
  nodes: SantiagoEngineNode[]
  counts: Record<string, number>
}

/** Gate 1B.3 — pedestrian transition classification (provider duration). */
export type PedestrianEdgeClass = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'

export type PhysicalPointRef = {
  stgoId: string
  pointId: string
  pointType: 'experience_point' | 'poi' | 'access' | 'provider'
  coordinate: LatLng
  coordinateSource: string
}

export type PhysicalCost = {
  distanceM: number
  durationS: number
  durationMin: number
  baseProvider: 'mapbox'
  stepFree: null
  surfaceRoughness: null
  crossingFriction: null
  inclineFriction: null
  crowdFriction: null
  pleasantness: null
}

export type PedestrianEdgeProvenance = {
  provider: 'mapbox'
  providerReference: string | null
  routingProfile: string
  routingStatus: 'OK' | 'NO_ROUTE' | 'ERROR'
  checkedAt: string
  candidateStraightLineM: number | null
  responseSummary?: string | null
}

export type SantiagoPhysicalEdge = {
  edgeId: string
  fromPoiId: string
  toPoiId: string
  fromPoint: PhysicalPointRef
  toPoint: PhysicalPointRef
  mode: 'WALK'
  distanceM: number
  durationS: number
  durationMin: number
  physicalCost: PhysicalCost
  provider: 'mapbox'
  providerReference: string | null
  geometry: GeoJSON.LineString | null
  physicalClassification: PedestrianEdgeClass
  provenance: PedestrianEdgeProvenance
  curatorStatus: 'PROVIDER_DERIVED'
  runtimeEligible: boolean
  uncertaintyFlags: string[]
  pruned: boolean
  pruneReason: string | null
}

export type SantiagoPhysicalEdgesFile = {
  schemaVersion: 'santiago-physical-edges.v0.1'
  cityId: 'santiago'
  gate: '1B.3'
  mode: 'WALK'
  physicalRouteGenerationEnabled: false
  provider: 'mapbox'
  generatedAt: string
  eligibleNodeCount: number
  eligibleStgoIds: string[]
  excludedStgoIds: Array<{ stgoId: string; reason: string }>
  counts: Record<string, number>
  graphHealth: Record<string, unknown>
  qaRoutes: Array<Record<string, unknown>>
  referenceMatrixStatus: 'REFERENCE_MATRIX_NOT_PRESENT' | 'COMPARED'
  edges: SantiagoPhysicalEdge[]
}

/** Minimal GeoJSON line string for encoded route geometry. */
export namespace GeoJSON {
  export type LineString = {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

/** Gate 1B.4 — verification / provenance states for transit entities. */
export type TransitVerificationState =
  | 'NETWORK_TOPOLOGY_VERIFIED'
  | 'SEGMENT_TIME_VERIFIED'
  | 'PROVIDER_DERIVED'
  | 'UNRESOLVED'
  | 'UNKNOWN'

export type PedestrianAdjacencyEdge = {
  edgeId: string
  fromPoiId: string
  toPoiId: string
  mode: 'WALK'
  distanceM: number
  durationS: number
  durationMin: number
  physicalClassification: PedestrianEdgeClass
  providerEdgeId: string
  provider: 'mapbox'
  runtimeEligible: true
  sparsificationReason: string
  provenance: {
    gate: '1B.4'
    tracesToGate1B3ProviderEdge: true
    providerReference: string | null
  }
}

export type SantiagoPedestrianAdjacencyFile = {
  schemaVersion: 'santiago-pedestrian-adjacency.v0.1'
  gate: '1B.4'
  physicalRouteGenerationEnabled: false
  denseProviderRuntimeEdgeCount: number
  sparseOperationalEdgeCount: number
  reductionPercent: number
  eligibleStgoIds: string[]
  graphHealth: Record<string, unknown>
  edges: PedestrianAdjacencyEdge[]
}

export type TransitStation = {
  stationId: string
  canonicalName: string
  lat: number
  lng: number
  lines: string[]
  accessibility: 'UNKNOWN'
  provenance: 'openstreetmap'
  provenanceSource: string
  osmNodeId: number
  verificationState: TransitVerificationState
}

export type TransitLine = {
  lineId: string
  canonicalName: string
  colour: string | null
  osmRelationId: number | null
  stationOrder: string[]
  topologyStatus: 'NETWORK_TOPOLOGY_VERIFIED' | 'UNRESOLVED'
  segmentTimingStatus: 'SEGMENT_TIME_UNRESOLVED'
  provenance: 'openstreetmap'
  provenanceSource: string
}

export type SantiagoMetroStationsFile = {
  schemaVersion: 'santiago-metro-stations.v0.1'
  gate: '1B.4'
  provenance: 'openstreetmap'
  provenanceSource: string
  stationCount: number
  stations: TransitStation[]
}

export type SantiagoMetroLinesFile = {
  schemaVersion: 'santiago-metro-lines.v0.1'
  gate: '1B.4'
  provenance: 'openstreetmap'
  provenanceSource: string
  lineCount: number
  lines: TransitLine[]
}

export type PoiMetroAccessEdge = {
  edgeId: string
  from: string
  to: string
  mode: 'POI_METRO_ACCESS'
  distanceMeters: number
  durationSeconds: number
  provider: 'mapbox'
  provenance: Record<string, unknown>
  stationId: string
  stgoId: string
  accessRole: 'PRIMARY' | 'SECONDARY' | 'QA_CANDIDATE'
  verificationState: 'PROVIDER_DERIVED'
  runtimePreferred: boolean
}

export type MetroRideEdge = {
  edgeId: string
  fromStationId: string
  toStationId: string
  lineId: string
  mode: 'METRO_RIDE'
  observedDurationSeconds: null
  topologyStatus: 'NETWORK_TOPOLOGY_VERIFIED'
  segmentTimingStatus: 'SEGMENT_TIME_UNRESOLVED'
  enginePolicyHopCostSeconds: number
  provenance: Record<string, unknown>
}

export type MetroTransferEdge = {
  edgeId: string
  stationId: string
  fromLineId: string
  toLineId: string
  mode: 'METRO_TRANSFER'
  observedDurationSeconds: null
  enginePolicyTransferPenaltySeconds: number
  provenance: Record<string, unknown>
  verificationState: 'NETWORK_TOPOLOGY_VERIFIED'
}

export type MacroConnectorEdge = {
  edgeId: string
  from: string
  to: string
  mode: 'RIDESHARE'
  distanceMeters: number | null
  durationSeconds: number | null
  provider: 'mapbox' | null
  runtimeEligible: boolean
  reason: string
}

export type MultimodalRouteLeg = {
  mode: 'WALK' | 'POI_METRO_ACCESS' | 'METRO_RIDE' | 'METRO_TRANSFER' | 'RIDESHARE'
  from: string
  to: string
  edgeId: string | null
  physicalDurationSeconds: number | null
  physicalDistanceMeters: number | null
  generalizedCostSeconds: number
  lineId?: string | null
  unverified: boolean
}

export type MultimodalRoute = {
  origin: string
  destination: string
  legs: MultimodalRouteLeg[]
  physicalDurationSeconds: number | null
  physicalDistanceMeters: number | null
  generalizedCost: number
  modeChanges: number
  metroLinesUsed: string[]
  transfers: number
  unverifiedComponents: string[]
  provenanceSummary: string
  pedestrianOnlyAlternative: Record<string, unknown> | null
  selectionReason: string
}

export type SantiagoMultimodalGraphFile = {
  schemaVersion: 'santiago-multimodal-graph.v0.1'
  gate: '1B.4'
  physicalRouteGenerationEnabled: false
  multimodalPhysicalGraphReady: boolean
  contractRecovery: Record<string, string>
  referenceMatrixStatus: 'REFERENCE_MATRIX_NOT_PRESENT'
  thematicNarrativeUsed: false
  counts: Record<string, number>
  sanCristobalStaging: Record<string, unknown>
  unresolvedLaunch: Array<{ stgoId: string; reason: string }>
  qaRoutes: MultimodalRoute[]
  poiMetroAccessEdges: PoiMetroAccessEdge[]
  metroRideEdges: MetroRideEdge[]
  metroTransferEdges: MetroTransferEdge[]
  rideshareMacroEdges: MacroConnectorEdge[]
}
