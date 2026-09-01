/**
 * Gate 2E.3-R — read-only founder inspection view-model.
 *
 * Observes existing Route Lab + arbitration results. Does not score, search,
 * or select routes. Reconstructed equivalent of lost Gate 2E.3 capability.
 */

import { DISCOVERY_POSTURE_LABELS } from '@/src/engine/taxonomy'
import { loadPoiCoordinates } from '@/src/dev/route-lab/coordinates'
import { getRouteLabFixture } from '@/src/dev/route-lab/fixtures'
import type { RouteLabRunResult } from '@/src/dev/route-lab/runRouteLab'
import {
  buildScenarioIdentity,
  buildScenarioQaRecord,
  compareToFrozenOracle,
  computeV01RouteFingerprint,
  computeV02RouteFingerprint,
  loadScenarioQaOracle,
} from '@/src/dev/route-lab/scenarioIdentity'
import type { ArbitrationResultV02, FeatureScore } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'
import type { RouteCandidateV01, RouteStopV01, OmittedNodeReason } from '@/src/engine/routes/route-types'
import type { ScoreComponent } from '@/src/engine/types'
import type { RerankedRouteCandidateV01 } from '@/src/engine/routes/route-reranker'
import {
  buildTimeInsertionDiagnostics,
  reconstructBanderaMoneda,
  type TimeInsertionDiagnostics,
} from '@/src/dev/route-lab/routeTimeDiagnostics'
import { IDENTITY_DIAGNOSTIC_FINDINGS } from '@/src/dev/route-lab/identityDiagnosticFindings'
import { MODELING_DEFICIENCY_FINDING } from '@/src/dev/route-lab/modelingDeficiencyFinding'

export const FOUNDER_INSPECTION_SCHEMA = 'santiago-founder-inspection.v0.1' as const

export type EvidenceAvailability = 'AVAILABLE' | 'UNKNOWN' | 'NOT_MODELED'

export type InspectedField<T> = {
  availability: EvidenceAvailability
  value: T | null
}

export type InspectedScoreComponent = {
  key: string
  availability: EvidenceAvailability
  value: number | null
  note?: string
}

export type InspectedStop = {
  sequenceIndex: number
  stgoId: string
  name: InspectedField<string>
  inclusionExplanation: InspectedField<string>
  nodeUtility: InspectedField<number>
  yourMatch: InspectedField<number>
  role: InspectedField<string>
  tier: InspectedField<string>
  estimatedDwellMin: InspectedField<number>
  transitionTimeMin: InspectedField<number>
  cumulativeTimeMin: InspectedField<number>
  narrativeRelation: InspectedField<string>
  scoreDimensions: InspectedScoreComponent[]
}

export type InspectedOmission = {
  stgoId: string
  displayName: InspectedField<string>
  reasonCode: InspectedField<OmittedNodeReason['reasonCode']>
  message: InspectedField<string>
  nodeUtility: InspectedField<number>
}

export type InspectedCoordinate = {
  stgoId: string
  availability: EvidenceAvailability
  lat: number | null
  lng: number | null
}

export type FounderInspectionView = {
  schemaVersion: typeof FOUNDER_INSPECTION_SCHEMA
  humanReviewAffectsEngine: false
  request: {
    scenarioId: InspectedField<string>
    travelerFixtureSummary: InspectedField<string>
    discoveryPosture: InspectedField<string>
    discoveryPostureLabel: InspectedField<string>
    familiarity: InspectedField<string>
    structuralConstraints: InspectedField<{
      stepFreeRequired: boolean
      memorySitesOptIn: boolean
      mobilityArchetype: string | null
      highComfort: boolean
    }>
    timeBudgetMin: InspectedField<number>
    start: InspectedField<string>
    routeIntent: InspectedField<string>
    transportPolicy: InspectedField<string>
    interests: InspectedField<string[]>
  }
  result: {
    winningLane: InspectedField<string>
    routeId: InspectedField<string>
    routeFingerprint: InspectedField<string>
    requestHash: InspectedField<string>
    orderedStopIds: InspectedField<string[]>
    orderedStopNames: InspectedField<string[]>
    totalModeledMinutes: InspectedField<number>
    routeScore: InspectedField<number>
    rerankedScore: InspectedField<number>
    arbitrationStatus: InspectedField<string>
    arbitrationRouteId: InspectedField<string>
    v01AndV02AreSameRoute: InspectedField<boolean>
  }
  scenarioIdentity: {
    scenarioId: InspectedField<string>
    scenarioFingerprint: InspectedField<string>
    travelerFixtureId: InspectedField<string>
    includedFields: InspectedField<Record<string, unknown>>
    notModeled: InspectedField<string[]>
  }
  resultIdentity: {
    routeFingerprintV01: InspectedField<string>
    routeFingerprintV02: InspectedField<string>
    routeIdV01: InspectedField<string>
    routeIdV02: InspectedField<string>
    orderedStopIds: InspectedField<string[]>
  }
  reproducibility: {
    frozenOracleMatch: InspectedField<'PASS' | 'FAIL'>
    scenarioDrift: InspectedField<'YES' | 'NO'>
    routeDrift: InspectedField<'YES' | 'NO'>
  }
  timeInsertionDiagnostics: TimeInsertionDiagnostics | null
  identityFindings: typeof IDENTITY_DIAGNOSTIC_FINDINGS
  modelingDeficiency: typeof MODELING_DEFICIENCY_FINDING
  banderaMoneda: ReturnType<typeof reconstructBanderaMoneda> | null
  r1HistoricalNote: {
    historicalNote: string
    status: 'UNVERIFIED_HISTORICAL_NOTE'
    executableOracle: false
    source: string
  }
  scoreTrace: InspectedScoreComponent[]
  inclusionTrace: InspectedStop[]
  omissionTrace: InspectedOmission[]
  geographicTrace: {
    orderedCoordinates: InspectedCoordinate[]
    anyMissing: boolean
  }
}

function field<T>(availability: EvidenceAvailability, value: T | null): InspectedField<T> {
  return { availability, value }
}

function available<T>(value: T): InspectedField<T> {
  return field('AVAILABLE', value)
}

function unknown<T>(): InspectedField<T> {
  return { availability: 'UNKNOWN', value: null }
}

function notModeled<T>(): InspectedField<T> {
  return { availability: 'NOT_MODELED', value: null }
}

function fromScoreComponent(c: ScoreComponent): InspectedScoreComponent {
  if (!c.available) {
    return { key: c.key, availability: 'UNKNOWN', value: null }
  }
  return { key: c.key, availability: 'AVAILABLE', value: c.value }
}

function fromFeature(key: string, f: FeatureScore | undefined, note?: string): InspectedScoreComponent {
  if (!f) return { key, availability: 'NOT_MODELED', value: null, note }
  if (f.unknown || f.value == null) {
    return { key, availability: 'UNKNOWN', value: null, note }
  }
  return { key, availability: 'AVAILABLE', value: f.value, note }
}

function travelerSummary(lab: RouteLabRunResult): string {
  const t = lab.composed.request.traveler
  const posture = DISCOVERY_POSTURE_LABELS[t.discoveryPosture] ?? t.discoveryPosture
  return [
    lab.fixtureId ?? 'custom',
    `Dz ${t.discoveryPosture} (${posture})`,
    `rhythm ${t.rhythm}`,
    `budget ${lab.composed.request.timeBudgetMin} min`,
    t.interests.slice(0, 4).join(', '),
  ]
    .filter(Boolean)
    .join(' · ')
}

function inspectStop(s: RouteStopV01): InspectedStop {
  return {
    sequenceIndex: s.sequenceIndex,
    stgoId: s.stgoId,
    name: s.name ? available(s.name) : unknown<string>(),
    inclusionExplanation: s.inclusionExplanation
      ? available(s.inclusionExplanation)
      : unknown<string>(),
    nodeUtility: available(s.nodeUtility),
    yourMatch: available(s.yourMatch),
    role: s.editorialRole ? available(s.editorialRole) : unknown<string>(),
    tier: s.tier ? available(s.tier) : unknown<string>(),
    estimatedDwellMin: available(s.estimatedDwellMin),
    transitionTimeMin: available(s.transitionTimeMin),
    cumulativeTimeMin: available(s.cumulativeTimeMin),
    narrativeRelation: s.narrativeRelationFromPrevious
      ? available(s.narrativeRelationFromPrevious)
      : unknown<string>(),
    scoreDimensions: [
      fromScoreComponent(s.nodeUtilityBreakdown.editorial),
      fromScoreComponent(s.nodeUtilityBreakdown.interests),
      fromScoreComponent(s.nodeUtilityBreakdown.structural),
      fromScoreComponent(s.nodeUtilityBreakdown.discovery),
      fromScoreComponent(s.nodeUtilityBreakdown.context),
    ],
  }
}

function inspectOmission(o: OmittedNodeReason): InspectedOmission {
  return {
    stgoId: o.stgoId,
    displayName: o.displayName ? available(o.displayName) : unknown<string>(),
    reasonCode: available(o.reasonCode),
    message: o.message ? available(o.message) : unknown<string>(),
    nodeUtility: o.nodeUtility == null ? unknown<number>() : available(o.nodeUtility),
  }
}

function v01Winner(lab: RouteLabRunResult): RerankedRouteCandidateV01 | undefined {
  return (
    lab.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1) ?? lab.reranked.rerankedCandidates[0]
  )
}

function scoreTrace(
  candidate: RouteCandidateV01,
  rerank: RerankedRouteCandidateV01 | undefined,
  arbitration: ArbitrationResultV02 | null,
): InspectedScoreComponent[] {
  const b = candidate.scoreBreakdown
  const rec = arbitration?.recommended
  const rows: InspectedScoreComponent[] = [
    { key: 'provisionalRouteScore', availability: 'AVAILABLE', value: candidate.provisionalRouteScore },
    { key: 'scoreBreakdown.nodeUtilityAvg', availability: 'AVAILABLE', value: b.nodeUtilityAvg },
    { key: 'scoreBreakdown.narrativeAvg', availability: 'AVAILABLE', value: b.narrativeAvg },
    { key: 'scoreBreakdown.compositionFit', availability: 'AVAILABLE', value: b.compositionFit },
    { key: 'scoreBreakdown.arcSignal', availability: 'AVAILABLE', value: b.arcSignal },
    { key: 'scoreBreakdown.timeFit', availability: 'AVAILABLE', value: b.timeFit },
    { key: 'scoreBreakdown.physicalEfficiency', availability: 'AVAILABLE', value: b.physicalEfficiency },
    { key: 'scoreBreakdown.repetitionPenalty', availability: 'AVAILABLE', value: b.repetitionPenalty },
    { key: 'scoreBreakdown.detourPenalty', availability: 'AVAILABLE', value: b.detourPenalty },
    { key: 'scoreBreakdown.constraintRiskPenalty', availability: 'AVAILABLE', value: b.constraintRiskPenalty },
    rerank
      ? { key: 'rerankedScore', availability: 'AVAILABLE', value: rerank.rerankedScore }
      : { key: 'rerankedScore', availability: 'UNKNOWN', value: null },
    rerank
      ? { key: 'arcQualityScore', availability: 'AVAILABLE', value: rerank.arcQualityScore }
      : { key: 'arcQualityScore', availability: 'UNKNOWN', value: null },
    {
      key: 'composerScore',
      availability: 'AVAILABLE',
      value: candidate.provisionalRouteScore,
      note: 'Within-lane composer quality. Not used as a cross-lane winner criterion.',
    },
  ]
  if (!arbitration || !rec) {
    rows.push({
      key: 'routeChoiceScore',
      availability: 'NOT_MODELED',
      value: null,
      note: 'V0.2 arbitration not attached to this inspection.',
    })
    return rows
  }
  rows.push({
    key: 'routeChoiceScore',
    availability: rec.routeChoiceScore == null ? 'UNKNOWN' : 'AVAILABLE',
    value: rec.routeChoiceScore,
  })
  rows.push(fromFeature('travelerMatchRoute', rec.features.travelerMatchRoute))
  rows.push(fromFeature('intrinsicWorthRoute', rec.features.intrinsicWorthRoute))
  rows.push(fromFeature('routeMarginalValue', rec.features.routeMarginalValue))
  rows.push(fromFeature('arcQuality', rec.features.arcQuality))
  rows.push(fromFeature('physicalEfficiency', rec.features.physicalEfficiency))
  rows.push(fromFeature('timeFit', rec.features.timeFit))
  rows.push(fromFeature('structuralFit', rec.features.structuralFit))
  rows.push(fromFeature('discoveryFit', rec.features.discoveryFit))
  rows.push(fromFeature('narrativeCoherence', rec.features.narrativeCoherence))
  rows.push(fromFeature('lanePrior', rec.features.lanePrior))
  return rows
}

export function buildFounderInspection(args: {
  lab: RouteLabRunResult
  arbitration?: ArbitrationResultV02 | null
  root: string
}): FounderInspectionView {
  const { lab, root } = args
  const arbitration = args.arbitration ?? null
  const winner = v01Winner(lab)
  const candidate = winner?.candidate
  const req = lab.composed.request
  const traveler = req.traveler
  const coords = loadPoiCoordinates(root)

  const stopIds = candidate?.orderedStops.map((s) => s.stgoId) ?? []
  const stopNames = candidate?.orderedStops.map((s) => s.name) ?? []
  const routeId = candidate?.routeId ?? lab.reranked.topRerankedRouteId ?? null
  const routeFingerprint = computeV01RouteFingerprint({
    requestHash: lab.composed.requestHash,
    routeId,
    stopIds,
    totalEstimatedMin: candidate?.totalEstimatedMin ?? null,
    provisionalRouteScore: candidate?.provisionalRouteScore ?? null,
    rerankedScore: winner?.rerankedScore ?? null,
  })
  const routeFingerprintV02 = computeV02RouteFingerprint({
    recommendedRouteId: arbitration?.recommendedRouteId ?? null,
    recommendedLane: arbitration?.recommendedLane ? String(arbitration.recommendedLane) : null,
    choiceConfidence: arbitration?.choiceConfidence ?? null,
  })

  const fixture =
    lab.fixtureId && getRouteLabFixture(lab.fixtureId)
      ? getRouteLabFixture(lab.fixtureId)!
      : {
          id: lab.fixtureId ?? 'custom',
          label: '',
          description: '',
          input: lab.input,
        }
  const identity = buildScenarioIdentity(fixture)
  const qa = buildScenarioQaRecord({ fixture, lab, arbitration })
  let frozenOracleMatch: InspectedField<'PASS' | 'FAIL'> = unknown<'PASS' | 'FAIL'>()
  let scenarioDrift: InspectedField<'YES' | 'NO'> = unknown<'YES' | 'NO'>()
  let routeDrift: InspectedField<'YES' | 'NO'> = unknown<'YES' | 'NO'>()
  try {
    const oracle = loadScenarioQaOracle(root)
    const frozen = oracle.records[qa.scenarioId]
    if (frozen) {
      const cmp = compareToFrozenOracle(qa, frozen)
      frozenOracleMatch = available(cmp.frozenOracleMatch)
      scenarioDrift = available(cmp.scenarioDrift)
      routeDrift = available(cmp.routeDrift)
    }
  } catch {
    // Oracle file not yet present — inspection still renders identity.
  }

  const startValue =
    req.start.kind === 'STGO_ID' ? req.start.stgoId : req.start.kind === 'UNSUPPORTED' ? req.start.reason : null

  const orderedCoordinates: InspectedCoordinate[] = stopIds.map((id) => {
    const c = coords.get(id)
    if (!c) return { stgoId: id, availability: 'UNKNOWN', lat: null, lng: null }
    return { stgoId: id, availability: 'AVAILABLE', lat: c.lat, lng: c.lng }
  })

  const arbRouteId = arbitration?.recommendedRouteId ?? null
  const sameRoute = routeId != null && arbRouteId != null ? arbRouteId === routeId : null

  return {
    schemaVersion: FOUNDER_INSPECTION_SCHEMA,
    humanReviewAffectsEngine: false,
    request: {
      scenarioId: lab.fixtureId ? available(lab.fixtureId) : unknown<string>(),
      travelerFixtureSummary: available(travelerSummary(lab)),
      discoveryPosture: available(traveler.discoveryPosture),
      discoveryPostureLabel: available(DISCOVERY_POSTURE_LABELS[traveler.discoveryPosture] ?? traveler.discoveryPosture),
      familiarity: notModeled<string>(),
      structuralConstraints: available({
        stepFreeRequired: traveler.stepFreeRequired,
        memorySitesOptIn: traveler.memorySitesOptIn,
        mobilityArchetype: traveler.mobilityArchetype,
        highComfort: traveler.highComfort,
      }),
      timeBudgetMin: available(req.timeBudgetMin),
      start: startValue ? available(startValue) : unknown<string>(),
      routeIntent: available(req.routeIntent),
      transportPolicy: available(req.transportPolicy),
      interests: available([...traveler.interests]),
    },
    result: {
      winningLane: arbitration?.recommendedLane
        ? available(String(arbitration.recommendedLane))
        : notModeled<string>(),
      routeId: routeId ? available(routeId) : unknown<string>(),
      routeFingerprint: available(routeFingerprint),
      requestHash: available(lab.composed.requestHash),
      orderedStopIds: candidate ? available(stopIds) : unknown<string[]>(),
      orderedStopNames: candidate ? available(stopNames) : unknown<string[]>(),
      totalModeledMinutes: candidate ? available(candidate.totalEstimatedMin) : unknown<number>(),
      routeScore: candidate ? available(candidate.provisionalRouteScore) : unknown<number>(),
      rerankedScore: winner ? available(winner.rerankedScore) : unknown<number>(),
      arbitrationStatus: arbitration
        ? available(arbitration.choiceConfidence)
        : notModeled<string>(),
      arbitrationRouteId: arbRouteId ? available(arbRouteId) : notModeled<string>(),
      v01AndV02AreSameRoute: sameRoute == null ? notModeled<boolean>() : available(sameRoute),
    },
    scenarioIdentity: {
      scenarioId: available(identity.scenarioId),
      scenarioFingerprint: available(identity.scenarioFingerprint),
      travelerFixtureId: available(identity.travelerFixtureId),
      includedFields: available({ ...identity.includedFields }),
      notModeled: available([...identity.notModeled]),
    },
    resultIdentity: {
      routeFingerprintV01: available(routeFingerprint),
      routeFingerprintV02: routeFingerprintV02 ? available(routeFingerprintV02) : notModeled<string>(),
      routeIdV01: routeId ? available(routeId) : unknown<string>(),
      routeIdV02: arbRouteId ? available(arbRouteId) : notModeled<string>(),
      orderedStopIds: candidate ? available(stopIds) : unknown<string[]>(),
    },
    reproducibility: {
      frozenOracleMatch,
      scenarioDrift,
      routeDrift,
    },
    timeInsertionDiagnostics: candidate
      ? buildTimeInsertionDiagnostics({ candidate, lab, root })
      : null,
    identityFindings: IDENTITY_DIAGNOSTIC_FINDINGS,
    modelingDeficiency: MODELING_DEFICIENCY_FINDING,
    banderaMoneda: candidate
      ? reconstructBanderaMoneda({ scenarioId: lab.fixtureId ?? 'custom', candidate })
      : null,
    r1HistoricalNote: {
      historicalNote: 'R1 was approximately 116.1 modeled minutes',
      status: 'UNVERIFIED_HISTORICAL_NOTE',
      executableOracle: false,
      source: 'lost Gate 2E.3.2 reconstruction record',
    },
    scoreTrace: candidate ? scoreTrace(candidate, winner, arbitration) : [],
    inclusionTrace: candidate ? candidate.orderedStops.map(inspectStop) : [],
    omissionTrace: candidate ? candidate.omittedHighUtilityNodes.map(inspectOmission) : [],
    geographicTrace: {
      orderedCoordinates,
      anyMissing: orderedCoordinates.some((c) => c.availability !== 'AVAILABLE'),
    },
  }
}
