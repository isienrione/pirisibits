/**
 * Gate 1B.2 — Santiago City Engine node contracts.
 * Canonical primary key is STGO_XX. Legacy slugs are compatibility only.
 * Provider geography ≠ curator approval. POI ≠ entrance ≠ experience-point.
 */

export type ThemeCode =
  | 'T1A'
  | 'T1B'
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

export type ProvenanceBlock = {
  identity: {
    status: IdentityResolutionStatus
    sources: string[]
    missingSource?: string | null
  }
  physical: {
    provider: 'mapbox' | null
    coordinatePolicy: string
    curatorApproval: 'never-automatic' | null
    selectionStatus: string | null
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
  curatorApproval: null
  /** Hard rule mirror — must remain false/null in generated data. */
  physicalRouteGenerationEnabled: false
}

export type SantiagoEngineNodesFile = {
  schemaVersion: 'santiago-engine-nodes.v0.1'
  cityId: 'santiago'
  gate: '1B.2'
  nodeCount: 103
  launchCorpusCount: 30
  backlogCount: 73
  physicalRouteGenerationEnabled: false
  autoCuratorApproveFromMapbox: false
  coordinatePolicy: string
  experiencePointPolicy: string
  transitPolicy: string
  launchCorpusStgoIds: string[]
  nodes: SantiagoEngineNode[]
  counts: Record<string, number>
}
