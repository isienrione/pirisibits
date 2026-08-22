export type EditorialDensity = 0 | 1 | 2 | 3

export type ProvenanceStatus =
  | 'sourced'
  | 'NEEDS_FIELD_QA'
  | 'NEEDS_RESEARCH'
  | 'pending-curation'

export type Coordinate = {
  lat: number
  lng: number
  precision: 'geofence-center'
  sourceId: string
}

export type TravelerInterest = 'antiquity' | 'living-city' | 'river'
export type ExplorationStyle = 'linger' | 'cover-ground' | 'mixed'
export type Mobility = 'walking' | 'limited-stairs'
export type TimeBudgetMin = 60 | 120 | 180

export type TravelerProfile = {
  interests: TravelerInterest[]
  explorationStyle: ExplorationStyle
  mobility: Mobility
  timeBudgetMin: TimeBudgetMin
}

export type SessionContext = {
  cityId: 'rome'
  locationMode: 'planning' | 'on-street'
  permission: 'unknown' | 'granted' | 'denied' | 'skipped'
  startedAtIso: string
}

export type Treatment = 'hero' | 'discovery' | 'micro' | 'walk' | 'mystery' | 'reveal' | 'rest'

export type TimeFit = 'under' | 'fit' | 'over' | 'unknown'

export type RouteTimeReport = {
  targetBudgetMin: number
  experienceMin: number
  walkingMin: number
  bufferMin: number
  totalEstimatedMin: number
  budgetDeltaMin: number
  timeFit: TimeFit
  walkingMinComplete: boolean
  notes: string[]
}

export type WhyReason = {
  id: string
  kind: 'time' | 'sequence' | 'interest' | 'alternative-lost'
  statement: string
  sourceId: string
}

export type ArchiveStill = {
  uri: string | null
  caption: string | null
  credit: string | null
  license: string | null
  source: string | null
  provenance: ProvenanceStatus
}

export type RouteItemView = {
  id: string
  kind: 'experience' | 'walk'
  treatment: Treatment
  title: string
  spoilerSafeTitle: string
  lookCue: string | null
  arrivalLine: string | null
  approachLine: string | null
  coordinate: Coordinate | null
  arrivalRadiusM: number | null
  experienceMin: number | null
  walkingMin: number | null
  archive: {
    now: ArchiveStill | null
    then: ArchiveStill | null
    caption: string | null
  }
  mystery: {
    isMystery: boolean
    hint: string | null
    detourCostMin: number | null
  }
  provenance: ProvenanceStatus
  sourceId: string
}

export type ComposedRoute = {
  id: string
  demoOnly: true
  title: string
  honestyLine: string
  items: RouteItemView[]
  time: RouteTimeReport
  why: WhyReason[]
  losingAlternative: WhyReason | null
}

export type RouteDelta = {
  timeDeltaMin: number | null
  walkingDeltaMin: number | null
  removedIds: string[]
  addedIds: string[]
  remainingIds: string[]
  notes: string[]
}

export type LocationSignal =
  | { status: 'checking' }
  | { status: 'denied' }
  | { status: 'granted-awaiting-fix' }
  | { status: 'ok'; lat: number; lng: number; accuracyM: number }
  | { status: 'weak'; lat: number | null; lng: number | null; accuracyM: number | null }
  | { status: 'error'; message: string }
  | { status: 'planning' }

export type ExperienceRuntimeEvent = 'arrive' | 'confirmArrival' | 'beginExperience' | 'complete'

export const SCHEMA_VERSION = 1 as const
