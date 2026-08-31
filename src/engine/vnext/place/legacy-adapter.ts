/**
 * Gate 2E.6 — Legacy POI → Place/Experience adapter.
 * Deterministic compatibility Experiences. Does NOT invent visit modes or times.
 */

import type { EngineNodeRecord } from '@/src/engine/types'
import { coordinatesRoutable } from '@/src/engine/routes/experience-time/vnext/per-field-provenance'
import type { ContentModuleRecord, ExperienceRecord, PlaceRecord, StructuralRole } from '@/src/engine/vnext/place/types'
import {
  defaultExperienceProvenance,
  emptyConstraintSet,
  emptyTimeProfile,
} from '@/src/engine/vnext/place/types'
import { emptyPerFieldProvenance } from '@/src/engine/routes/experience-time/vnext/per-field-provenance'

export const LEGACY_EXPERIENCE_ADAPTER = true as const

export function legacyCoreExperienceId(stgoId: string): string {
  return `${stgoId}::LEGACY_CORE`
}

function mapStructuralRole(node: EngineNodeRecord): Partial<Record<StructuralRole, number | null>> {
  const role = String(node.editorialRole ?? '').toUpperCase()
  const out: Partial<Record<StructuralRole, number | null>> = {
    ANCHOR: null,
    POCKET: null,
    MICRO_REVEAL: null,
    UNKNOWN: null,
  }
  if (role.includes('ANCHOR')) out.ANCHOR = 1
  else if (role.includes('POCKET')) out.POCKET = 1
  else if (role.includes('MICRO')) out.MICRO_REVEAL = 1
  else out.UNKNOWN = 1
  return out
}

export function legacyNodeToPlace(node: EngineNodeRecord): PlaceRecord {
  // Coordinates are loaded from engine JSON by consumers; adapter records provenance only.
  const coords = null
  const fields = emptyPerFieldProvenance()
  fields.coordinates = node.physicalRouteGenerationEligible ? 'PROVIDER_DERIVED' : 'UNKNOWN'
  const routable = Boolean(node.physicalRouteGenerationEligible) && coordinatesRoutable(fields.coordinates)
  return {
    placeId: node.stgoId,
    stgoId: node.stgoId,
    canonicalName: node.canonicalName ?? node.displayName ?? node.stgoId,
    coordinates: coords,
    networkSnapRefs: [],
    physicalFacts: {
      physicalRouteGenerationEligible: node.physicalRouteGenerationEligible ?? null,
      launchRuntimeDisposition: node.launchRuntimeDisposition ?? null,
    },
    accessFacts: {
      stepFree: node.stepFree ?? node.step_free_certified ?? null,
      accessibility: node.accessibility ?? null,
    },
    adminMetadata: {
      launchCorpus: node.launchCorpus,
    },
    fieldProvenance: fields,
    routable,
  }
}

/**
 * For each routable (or launch) POI create a deterministic compatibility Experience.
 * visitMode/time UNKNOWN — no interior/exterior inference, no fabricated hours/tickets/dwell.
 */
export function legacyNodeToExperienceAdapter(node: EngineNodeRecord): {
  place: PlaceRecord
  experience: ExperienceRecord
  contentModules: ContentModuleRecord[]
} {
  const place = legacyNodeToPlace(node)
  const experienceId = legacyCoreExperienceId(node.stgoId)
  const provenance = defaultExperienceProvenance(true)
  provenance.fields = place.fieldProvenance
  provenance.fields.visitMode = 'UNKNOWN'
  provenance.fields.dwellTime = 'UNKNOWN'
  provenance.fields.openingHours = 'UNKNOWN'
  provenance.fields.ticketFacts = 'UNKNOWN'

  const experience: ExperienceRecord = {
    experienceId,
    placeId: place.placeId,
    corridorRef: null,
    displayName: place.canonicalName,
    visitMode: 'UNKNOWN',
    stopRole: 'UNKNOWN',
    structuralRoleFit: mapStructuralRole(node),
    narrativeRoleCapabilities: [],
    experienceTimeProfile: emptyTimeProfile(),
    openingConstraints: emptyConstraintSet(),
    ticketConstraints: emptyConstraintSet(),
    optionalStatus: 'CORE_COMPATIBILITY',
    parentExperienceId: null,
    mutualExclusionGroup: `place:${place.placeId}`,
    compatibilityOverride: false,
    contentModuleIds: [`${experienceId}::CORE`],
    provenance,
    LEGACY_EXPERIENCE_ADAPTER: true,
    sourceStgoId: node.stgoId,
  }

  const contentModules: ContentModuleRecord[] = [
    {
      contentModuleId: `${experienceId}::CORE`,
      experienceId,
      moduleType: 'CORE',
      themes: (node.themes ?? []).map(String),
      narrativeHooks: [],
      familiarityApplicability: [],
      authoredContentMin: null,
      walkCompatibleContentMin: null,
      requiredStationaryMin: null,
      provenance: 'UNKNOWN',
    },
  ]

  return { place, experience, contentModules }
}

export function adaptLaunchCorpusToExperienceGraph(nodes: EngineNodeRecord[]): {
  places: PlaceRecord[]
  experiences: ExperienceRecord[]
  contentModules: ContentModuleRecord[]
  LEGACY_EXPERIENCE_ADAPTER: true
} {
  const places: PlaceRecord[] = []
  const experiences: ExperienceRecord[] = []
  const contentModules: ContentModuleRecord[] = []
  for (const n of nodes) {
    const adapted = legacyNodeToExperienceAdapter(n)
    places.push(adapted.place)
    experiences.push(adapted.experience)
    contentModules.push(...adapted.contentModules)
  }
  return { places, experiences, contentModules, LEGACY_EXPERIENCE_ADAPTER: true }
}
