/**
 * Gate 2E.6 — Feasible Experience Graph builder.
 */

import { evaluateNodeEligibility } from '@/src/engine/eligibility/evaluateNodeEligibility'
import { m2StepFreeFailClosed } from '@/src/engine/routes/experience-time/vnext/per-field-provenance'
import type { EngineNodeRecord, TravelerModel } from '@/src/engine/types'
import type { ExperienceRecord, PlaceRecord } from '@/src/engine/vnext/place/types'
import { experiencesViolateMutualExclusion } from '@/src/engine/routes/experience-time/vnext/place-experience-schema'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'

export type ExperienceExclusion = {
  experienceId: string
  placeId: string | null
  constraint: string
  evidence: string
  provenance: string
  reason: string
}

export type FeasibleExperienceGraph = {
  eligibleExperiences: ExperienceRecord[]
  excludedExperiences: ExperienceExclusion[]
  physicalEdges: Array<{ fromPlaceId: string; toPlaceId: string; evidence: string }>
  narrativeEdges: Array<{ fromExperienceId: string; toExperienceId: string; relationId: string | null; transferable: boolean }>
  unknownConstraints: string[]
  coverage: number
  mutualExclusionOk: boolean
}

export type BuildFeasibleExperienceGraphInput = {
  traveler: TravelerModel
  request: RouteRequestV01
  places: PlaceRecord[]
  experiences: ExperienceRecord[]
  nodesByStgoId: Map<string, EngineNodeRecord>
  physicalEdgePairs?: Array<{ from: string; to: string }>
  narrativeRelations?: Array<{ fromStgoId: string; toStgoId: string; relationId?: string | null }>
}

export function buildFeasibleExperienceGraph(
  input: BuildFeasibleExperienceGraphInput,
): FeasibleExperienceGraph {
  const eligible: ExperienceRecord[] = []
  const excluded: ExperienceExclusion[] = []
  const unknownConstraints: string[] = []

  for (const exp of input.experiences) {
    const stgoId = exp.sourceStgoId ?? exp.placeId
    const node = stgoId ? input.nodesByStgoId.get(stgoId) : undefined
    if (!node) {
      excluded.push({
        experienceId: exp.experienceId,
        placeId: exp.placeId,
        constraint: 'MISSING_SOURCE_NODE',
        evidence: 'ABSENT',
        provenance: String(exp.provenance.record),
        reason: 'No underlying place/node for Experience',
      })
      continue
    }

    const elig = evaluateNodeEligibility(node, input.traveler, { launchCorpusOnly: true })
    if (!elig.eligible) {
      for (const f of elig.hardFailures) {
        excluded.push({
          experienceId: exp.experienceId,
          placeId: exp.placeId,
          constraint: f.code,
          evidence: f.evidenceState ?? 'PRESENT',
          provenance: String(exp.provenance.record),
          reason: f.message,
        })
      }
      continue
    }

    const m2 = m2StepFreeFailClosed({
      stepFreeRequired: input.traveler.stepFreeRequired,
      accessibilityProvenance: exp.provenance.fields.accessibility,
      stepFreeKnown: exp.openingConstraints.stepFreeKnown ?? (node.stepFree === true || node.step_free_certified === true ? true : node.stepFree === false ? false : null),
    })
    if (!m2.pass) {
      excluded.push({
        experienceId: exp.experienceId,
        placeId: exp.placeId,
        constraint: 'M2_FAIL_CLOSED',
        evidence: m2.reason,
        provenance: exp.provenance.fields.accessibility,
        reason: m2.reason,
      })
      continue
    }

    if (!input.places.find((p) => p.placeId === exp.placeId)?.routable && node.physicalRouteGenerationEligible === false) {
      excluded.push({
        experienceId: exp.experienceId,
        placeId: exp.placeId,
        constraint: 'PLACE_NOT_ROUTABLE',
        evidence: 'PHYSICAL_INELIGIBLE_OR_PENDING',
        provenance: exp.provenance.fields.coordinates,
        reason: 'Place is not routable under current physical evidence',
      })
      continue
    }

    for (const u of exp.openingConstraints.unknownConstraints) unknownConstraints.push(`${exp.experienceId}:${u}`)
    eligible.push(exp)
  }

  const physicalEdges = (input.physicalEdgePairs ?? []).map((e) => ({
    fromPlaceId: e.from,
    toPlaceId: e.to,
    evidence: 'FROZEN_PHYSICAL_GRAPH',
  }))

  const narrativeEdges = (input.narrativeRelations ?? []).map((r) => {
    const fromExp = eligible.find((e) => e.sourceStgoId === r.fromStgoId)
    const toExp = eligible.find((e) => e.sourceStgoId === r.toStgoId)
    if (!fromExp || !toExp) {
      return {
        fromExperienceId: `${r.fromStgoId}::LEGACY_CORE`,
        toExperienceId: `${r.toStgoId}::LEGACY_CORE`,
        relationId: r.relationId ?? null,
        transferable: false,
      }
    }
    return {
      fromExperienceId: fromExp.experienceId,
      toExperienceId: toExp.experienceId,
      relationId: r.relationId ?? null,
      transferable: true,
    }
  })

  const mutex = experiencesViolateMutualExclusion(
    eligible.map((e) => ({
      experienceId: e.experienceId,
      placeId: e.placeId,
      corridorRef: e.corridorRef,
      visitMode: e.visitMode,
      stopRole: e.stopRole === 'UNKNOWN' ? 'REQUIRED_STOP' : e.stopRole,
      parentExperienceId: e.parentExperienceId,
      mutuallyExclusiveGroupId: e.mutualExclusionGroup,
      compatibilityOverride: e.compatibilityOverride,
      openingConstraintsRef: null,
      ticketConstraintsRef: null,
      narrativeIdentity: null,
      provenance: 'UNKNOWN' as const,
      contentTimeProfile: {
        authoredContentMin: null,
        walkCompatibleContentMin: null,
        requiredStopMin: null,
        stationaryDwellMin: null,
        accessOverheadMin: null,
        contentMayOverlapMovement: null,
      },
    })),
  )

  const coverage =
    input.experiences.length === 0 ? 0 : eligible.length / input.experiences.length

  return {
    eligibleExperiences: eligible,
    excludedExperiences: excluded,
    physicalEdges,
    narrativeEdges,
    unknownConstraints: [...new Set(unknownConstraints)],
    coverage,
    mutualExclusionOk: mutex.ok,
  }
}
