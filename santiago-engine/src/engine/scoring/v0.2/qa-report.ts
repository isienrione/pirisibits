/**
 * Gate 2E.2A — QA reporting for V0.2 score variability.
 */

import { resolve } from 'node:path'
import { loadSemanticByStgoId } from '@/src/engine/loadCalibration'
import { normalizeTraveler } from '@/src/engine/traveler'
import { evaluateNodeScoreV02 } from '@/src/engine/scoring/v0.2/evaluate-node-v02'
import { computeIntrinsicWorth } from '@/src/engine/scoring/v0.2/intrinsic-worth'
import { rankValues, spearmanCorrelation } from '@/src/engine/scoring/v0.2/utils'
import type { RouteIntent } from '@/src/engine/routes/route-types'
import type { TravelerModel } from '@/src/engine/types'

const ROOT = resolve(__dirname, '../../..')

export const QA_PROFILES: Array<{ id: string; label: string; traveler: TravelerModel; routeIntent?: RouteIntent }> = [
  {
    id: 'BALANCED',
    label: 'Balanced',
    traveler: normalizeTraveler({ interests: ['historia_civica', 'arte_visual'], rhythm: 'equilibrado', timeBudgetMinutes: 120 }),
    routeIntent: 'BALANCED',
  },
  {
    id: 'T1A_CIVIC',
    label: 'T1A civic',
    traveler: normalizeTraveler({ interests: ['historia_civica', 'arq_monumental'], rhythm: 'estructurado', timeBudgetMinutes: 120 }),
    routeIntent: 'ESSENTIALS',
  },
  {
    id: 'T2_CULINARY',
    label: 'T2 culinary',
    traveler: normalizeTraveler({ interests: ['gastronomia'], rhythm: 'equilibrado', timeBudgetMinutes: 120 }),
    routeIntent: 'THEMATIC',
  },
  {
    id: 'T3_AESTHETICS',
    label: 'T3 aesthetics',
    traveler: normalizeTraveler({ interests: ['arte_visual', 'arq_monumental'], rhythm: 'equilibrado', timeBudgetMinutes: 120 }),
    routeIntent: 'THEMATIC',
  },
  {
    id: 'D1_FLANEUR',
    label: 'D1 Flâneur',
    traveler: normalizeTraveler({ interests: ['barrios_vivos', 'vida_cotidiana'], rhythm: 'equilibrado', discoveryPosture: 'D1', timeBudgetMinutes: 120 }),
    routeIntent: 'DISCOVERY',
  },
  {
    id: 'D2_DETECTIVE',
    label: 'D2 Detective',
    traveler: normalizeTraveler({ interests: ['arte_visual', 'barrios_vivos'], rhythm: 'espontaneo', discoveryPosture: 'D2', timeBudgetMinutes: 120 }),
    routeIntent: 'DISCOVERY',
  },
  {
    id: 'D3_COLLECTOR',
    label: 'D3 Collector',
    traveler: normalizeTraveler({ interests: ['historia_civica', 'arq_monumental'], rhythm: 'estructurado', discoveryPosture: 'D3', timeBudgetMinutes: 120 }),
    routeIntent: 'ESSENTIALS',
  },
  {
    id: 'M1_EXPRESS',
    label: 'M1 Express',
    traveler: normalizeTraveler({ interests: ['historia_civica'], rhythm: 'estructurado', expressPreference: true, mobilityArchetype: 'M1', timeBudgetMinutes: 45 }),
    routeIntent: 'ESSENTIALS',
  },
]

export function buildTravelerMatchVariabilityReport(root = ROOT) {
  const semanticById = loadSemanticByStgoId(root)
  const launchIds = [...semanticById.values()].filter((r) => r.launchCorpus).map((r) => r.stgoId)
  const allIds = [...semanticById.keys()]

  const byNode: Record<string, number[]> = {}
  for (const id of allIds) {
    byNode[id] = []
    for (const p of QA_PROFILES) {
      const bundle = evaluateNodeScoreV02(
        {
          stgoId: id,
          displayName: semanticById.get(id)?.displayName ?? id,
          traveler: p.traveler,
          routeIntent: p.routeIntent,
        },
        root,
      )
      if (bundle?.travelerMatch.score != null) byNode[id]!.push(bundle.travelerMatch.score)
    }
  }

  const ranges = allIds.map((id) => {
    const scores = byNode[id] ?? []
    const range = scores.length ? Math.max(...scores) - Math.min(...scores) : 0
    return { stgoId: id, range, scores }
  })

  const launchRanges = ranges.filter((r) => launchIds.includes(r.stgoId)).map((r) => r.range)
  const sorted = [...ranges].sort((a, b) => a.range - b.range)
  const mean = launchRanges.length ? launchRanges.reduce((a, b) => a + b, 0) / launchRanges.length : 0
  const median = launchRanges.length
    ? [...launchRanges].sort((a, b) => a - b)[Math.floor(launchRanges.length / 2)]!
    : 0

  const iwRanks = rankValues(
    allIds.map((id) => ({
      id,
      score: computeIntrinsicWorth(semanticById.get(id)!, { allRecords: [...semanticById.values()] }).raw,
    })),
  )

  const profileCorrelations: Record<string, number | null> = {}
  for (const p of QA_PROFILES) {
    const tmRanks = rankValues(
      allIds.map((id) => {
        const b = evaluateNodeScoreV02(
          { stgoId: id, displayName: id, traveler: p.traveler, routeIntent: p.routeIntent },
          root,
        )
        return { id, score: b?.travelerMatch.score ?? null }
      }),
    )
    profileCorrelations[p.id] = spearmanCorrelation(iwRanks, tmRanks)
  }

  return {
    meanTravelerMatchRangeLaunch30: Math.round(mean * 10) / 10,
    medianTravelerMatchRangeLaunch30: Math.round(median * 10) / 10,
    lowestVariability: sorted.slice(0, 5),
    highestVariability: sorted.slice(-5).reverse(),
    profileCorrelations,
    ranges,
  }
}

export function buildRoleDistributionReport(root = ROOT) {
  const semanticById = loadSemanticByStgoId(root)
  const launchIds = [...semanticById.values()].filter((r) => r.launchCorpus).map((r) => r.stgoId)
  const allIds = [...semanticById.keys()]

  function summarize(ids: string[]) {
    const fits = ids.map((id) => {
      const b = evaluateNodeScoreV02(
        { stgoId: id, displayName: id, traveler: QA_PROFILES[0]!.traveler },
        root,
      )
      return b?.roleFit
    }).filter(Boolean)
    const anchor = fits.map((f) => f!.anchorFit).filter((v) => v != null) as number[]
    const pocket = fits.map((f) => f!.pocketFit).filter((v) => v != null) as number[]
    const micro = fits.map((f) => f!.microRevealFit).filter((v) => v != null) as number[]
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
    const ambiguous = fits.filter((f) => f!.roleAmbiguity).length
    const singleDominant = fits.filter((f) => {
      const vals = [f!.anchorFit, f!.pocketFit, f!.microRevealFit].filter((v) => v != null) as number[]
      if (vals.length < 2) return vals.length === 1
      vals.sort((a, b) => b - a)
      return vals[0]! - vals[1]! > 0.25
    }).length
    return {
      count: ids.length,
      avgAnchorFit: avg(anchor),
      avgPocketFit: avg(pocket),
      avgMicroRevealFit: avg(micro),
      roleAmbiguousCount: ambiguous,
      singleDominantRoleCount: singleDominant,
    }
  }

  return {
    launch30: summarize(launchIds),
    all104: summarize(allIds),
  }
}

export const REQUIRED_POI_QA = [
  'STGO_01',
  'STGO_03',
  'STGO_05',
  'STGO_20',
  'STGO_21',
  'STGO_24',
  'STGO_28',
  'STGO_34',
  'STGO_35',
  'STGO_92',
  'STGO_33',
  'STGO_104',
] as const

export function buildRequiredPoiQaTable(root = ROOT) {
  return REQUIRED_POI_QA.map((stgoId) => {
    const bundle = evaluateNodeScoreV02(
      { stgoId, displayName: stgoId, traveler: QA_PROFILES[0]!.traveler },
      root,
    )
    return {
      stgoId,
      intrinsicWorth: bundle?.intrinsicWorth.raw ?? null,
      anchorFit: bundle?.roleFit.anchorFit ?? null,
      pocketFit: bundle?.roleFit.pocketFit ?? null,
      microRevealFit: bundle?.roleFit.microRevealFit ?? null,
      essentiality: bundle?.editorialDimensions.essentiality?.value ?? null,
      discoveryDensity: bundle?.editorialDimensions.discoveryDensity?.value ?? null,
      surprise: bundle?.editorialDimensions.surprise?.value ?? null,
      provenance: bundle?.editorialDimensions.essentiality?.provenance ?? 'UNKNOWN',
      coverage: bundle?.travelerMatch.coverage ?? 0,
    }
  })
}
