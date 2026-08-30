/**
 * Gate 2E.5-QA — offline beam-regret oracle (honest, not fake-exact).
 *
 * Lane-specific H2 search objectives are NOT mathematically identical to final
 * RouteChoiceScore arbitration. This oracle therefore compares beam search
 * quality on a SINGLE explicit objective (OracleObjective) only.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROUTE_LAB_FIXTURES } from '@/src/dev/route-lab/fixtures'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { evaluateNodeEligibility } from '@/src/engine/eligibility/evaluateNodeEligibility'
import { evaluateNodeScoreV02 } from '@/src/engine/scoring/v0.2/evaluate-node-v02'
import { normalizeRouteRequest } from '@/src/engine/routes/route-request'
import { composeH2RoutesV02 } from '@/src/engine/routes/v0.2/composer/compose-h2.v0.2'
import type { ComposerLane } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import { ROUTE_SEARCH_CONFIG } from '@/src/engine/routes/route-config'

/** Workspace root from `src/engine/qa/gate-2e5/`. */
const ROOT = resolve(__dirname, '../../../..')

export type OracleRoute = {
  stops: string[]
  score: number
  meanTransition: number
}

function haversineMin(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(b.lat - a.lat)
  const dLng = toR(b.lng - a.lng)
  const la1 = toR(a.lat)
  const la2 = toR(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  const meters = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
  return meters / 80
}

function startStgoId(request: ReturnType<typeof normalizeRouteRequest>): string | null {
  if (request.start.kind === 'STGO_ID') return request.start.stgoId
  return request.traveler.startingStgoId
}

/**
 * Deterministic branch-and-bound over a candidate pool.
 * Objective: mean(BaseNodeValue) − 0.15 × mean(transition minutes).
 * Transitions = haversine walking proxy (offline tractability).
 */
export function runBranchAndBoundOracle(input: {
  startId: string
  eligibleIds: string[]
  baseValue: Record<string, number>
  coords: Record<string, { lat: number; lng: number }>
  maxStops: number
  timeBudgetMin: number
  /** Soft wall-clock budget for this search (ms). */
  timeLimitMs?: number
}): OracleRoute | null {
  const start = input.startId
  if (!input.coords[start] || input.baseValue[start] == null) return null
  const deadline = Date.now() + (input.timeLimitMs ?? 8000)

  let best: OracleRoute | null = null
  let timedOut = false

  const dfs = (
    path: string[],
    used: Set<string>,
    timeUsed: number,
    dwellSum: number,
    transitionSum: number,
    transitionCount: number,
  ) => {
    if (Date.now() > deadline) {
      timedOut = true
      return
    }
    const meanT = transitionCount > 0 ? transitionSum / transitionCount : 0
    const score = dwellSum / path.length - 0.15 * meanT
    if (path.length >= 2) {
      if (!best || score > best.score) {
        best = { stops: [...path], score, meanTransition: meanT }
      }
    }
    if (path.length >= input.maxStops) return

    const remainingSlots = input.maxStops - path.length
    const unusedVals = input.eligibleIds
      .filter((id) => !used.has(id))
      .map((id) => input.baseValue[id] ?? 0)
      .sort((a, b) => b - a)
      .slice(0, remainingSlots)
    const optDwell =
      (dwellSum + unusedVals.reduce((a, b) => a + b, 0)) / (path.length + unusedVals.length || 1)
    const optScore = optDwell
    if (best && optScore <= best.score) return

    const last = path[path.length - 1]!
    const lastCoord = input.coords[last]
    if (!lastCoord) return

    // Expand highest BaseNodeValue first for better pruning.
    const candidates = input.eligibleIds
      .filter((id) => !used.has(id) && input.coords[id] && input.baseValue[id] != null)
      .sort((a, b) => (input.baseValue[b]! - input.baseValue[a]!))

    for (const nxt of candidates) {
      if (timedOut) return
      const c = input.coords[nxt]!
      const bv = input.baseValue[nxt]!
      const move = haversineMin(lastCoord, c)
      const dwell = 12
      if (timeUsed + move + dwell > input.timeBudgetMin + ROUTE_SEARCH_CONFIG.timeToleranceMin) continue
      used.add(nxt)
      path.push(nxt)
      dfs(
        path,
        used,
        timeUsed + move + dwell,
        dwellSum + bv,
        transitionSum + move,
        transitionCount + 1,
      )
      path.pop()
      used.delete(nxt)
    }
  }

  const used = new Set([start])
  dfs([start], used, 0, input.baseValue[start]!, 0, 0)
  return best
}

function oracleScoreOfStops(
  stops: string[],
  baseValue: Record<string, number>,
  coords: Record<string, { lat: number; lng: number }>,
): number | null {
  if (stops.length < 2) return null
  const vals = stops.map((id) => baseValue[id]).filter((v): v is number => v != null)
  if (!vals.length) return null
  const meanBv = vals.reduce((a, b) => a + b, 0) / vals.length
  let tSum = 0
  let tCount = 0
  for (let i = 1; i < stops.length; i++) {
    const a = coords[stops[i - 1]!]
    const b = coords[stops[i]!]
    if (!a || !b) continue
    tSum += haversineMin(a, b)
    tCount++
  }
  const meanT = tCount ? tSum / tCount : 0
  return meanBv - 0.15 * meanT
}

export function runBeamRegretReport(): void {
  const DOC = resolve(ROOT, 'docs/engine/reports/BEAM_REGRET_ORACLE_V0_1.md')
  const JSON_OUT = resolve(ROOT, 'src/data/santiago/qa/beam_regret_oracle.v0.1.json')
  const subset = ROUTE_LAB_FIXTURES.filter((f) => ['F1', 'F2', 'F6', 'F8', 'F15'].includes(f.id))
  const launch = loadLaunchNodes(ROOT)
  const engine = JSON.parse(
    readFileSync(resolve(ROOT, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
  )
  const coords: Record<string, { lat: number; lng: number }> = {}
  for (const n of engine.nodes) {
    if (n.poiCoordinate?.lat != null) coords[n.stgoId] = n.poiCoordinate
  }

  const rows: string[] = []
  const machine: unknown[] = []
  rows.push(`# Beam Regret Oracle V0.1`)
  rows.push('')
  rows.push(`**Gate:** 2E.5-QA · **Status:** NON-CANONICAL · **Offline only**`)
  rows.push('')
  rows.push(`## Comparability caveat (do not fake exactness)`)
  rows.push('')
  rows.push(
    `H2 lane composers optimize **lane-specific** objectives; final arbitration uses **RouteChoiceScore** on common features.`,
  )
  rows.push(
    `A single exact solver cannot be mathematically identical to both simultaneously.`,
  )
  rows.push('')
  rows.push(`**OracleObjective (explicit):**`)
  rows.push('')
  rows.push('`mean(BaseNodeValue along stops) − 0.15 × mean(transition minutes)`')
  rows.push('')
  rows.push(
    `Oracle transitions use a haversine walking proxy (not frozen Mapbox edges) for offline tractability.`,
  )
  rows.push(
    `Beam side is scored on the **same OracleObjective** (haversine proxy on beam stop sequence) for fair regret.`,
  )
  rows.push(
    `Default runtime beamWidth=${ROUTE_SEARCH_CONFIG.beamWidth}, candidateExpansionLimit=${ROUTE_SEARCH_CONFIG.candidateExpansionLimit} — **not mutated**.`,
  )
  rows.push('')
  rows.push(`## Representative subset results`)
  rows.push('')
  rows.push(
    `| Fixture | lane | beam stops | beam oracle-obj | BnB oracle-obj | regret | pool | runtime_ms | exactness |`,
  )
  rows.push(`|---|---|---|---:|---:|---:|---|---:|---|`)

  for (const fx of subset) {
    const request = normalizeRouteRequest(fx.input)
    const startId = startStgoId(request)
    if (!startId) continue
    const t0 = Date.now()
    const h2 = composeH2RoutesV02(fx.input, { root: ROOT })
    const eligible = launch.filter((n) =>
      evaluateNodeEligibility(n, request.traveler, { launchCorpusOnly: true }).eligible,
    )
    const baseValue: Record<string, number> = {}
    for (const n of eligible) {
      const bundle = evaluateNodeScoreV02(
        {
          stgoId: n.stgoId,
          displayName: n.displayName ?? n.stgoId,
          traveler: request.traveler,
          routeIntent: request.routeIntent,
        },
        ROOT,
      )
      if (bundle?.baseNodeValue?.score != null) baseValue[n.stgoId] = bundle.baseNodeValue.score
    }

    const rankedPool = eligible
      .map((n) => n.stgoId)
      .filter((id) => baseValue[id] != null && coords[id])
      .sort((a, b) => baseValue[b]! - baseValue[a]!)

    for (const lane of ['SIGNATURE', 'DISCOVERY', 'FLOW'] as ComposerLane[]) {
      const cand = h2.lanes[lane]
      if (!cand) continue
      const stops = cand.candidate.orderedStops.map((s) => s.stgoId)
      const beamScore = oracleScoreOfStops(stops, baseValue, coords)
      if (beamScore == null) continue

      const poolSizes = [24, 48, rankedPool.length] as const
      const poolResults: Array<{
        pool: number
        oracleScore: number | null
        oracleStops: string[] | null
        regret: number | null
        runtimeMs: number
        exactness: string
      }> = []

      for (const poolN of poolSizes) {
        const tPool = Date.now()
        const pool = rankedPool.slice(0, Math.min(poolN, rankedPool.length))
        if (!pool.includes(startId) && rankedPool.includes(startId)) {
          pool[pool.length - 1] = startId
        }
        // Match beam length when feasible; Launch30 keeps this small.
        // Note: oracle uses fixed dwell=12 for time pruning — beam dwells may differ,
        // so regret can be negative when beam sequences are unscored-feasible under haversine
        // but pruned under the simplified dwell model (documented, not faked as exact).
        const oracle = runBranchAndBoundOracle({
          startId,
          eligibleIds: pool,
          baseValue,
          coords,
          maxStops: Math.min(8, Math.max(2, stops.length)),
          timeBudgetMin: request.timeBudgetMin,
          timeLimitMs: poolN <= 24 ? 15000 : poolN <= 48 ? 10000 : 6000,
        })
        const oracleScore = oracle?.score ?? null
        const regret = oracleScore != null ? oracleScore - beamScore : null
        const exactness =
          oracleScore == null
            ? 'NO_FEASIBLE'
            : Date.now() - tPool >= (poolN <= 24 ? 11900 : poolN <= 48 ? 7900 : 4900)
              ? 'BNB_TIME_LIMITED_BEST'
              : poolN >= rankedPool.length
                ? 'BNB_EXHAUSTIVE_OVER_POOL'
                : 'BNB_EXHAUSTIVE_OVER_TOP_N'
        poolResults.push({
          pool: poolN,
          oracleScore,
          oracleStops: oracle?.stops ?? null,
          regret,
          runtimeMs: Date.now() - tPool,
          exactness,
        })
        rows.push(
          `| ${fx.id} | ${lane} | ${stops.join('→')} | ${beamScore.toFixed(2)} | ${oracleScore == null ? '—' : oracleScore.toFixed(2)} | ${regret == null ? '—' : regret.toFixed(2)} | ${poolN} | ${Date.now() - tPool} | ${exactness} |`,
        )
      }

      machine.push({
        fixture: fx.id,
        lane,
        beamStops: stops,
        beamOracleObj: beamScore,
        pools: poolResults,
        totalMs: Date.now() - t0,
        note: 'Not comparable to RouteChoiceScore; OracleObjective only.',
      })
    }
  }

  rows.push('')
  rows.push(`## Beam / pool sensitivity`)
  rows.push('')
  rows.push(
    `Frozen runtime beamWidth=${ROUTE_SEARCH_CONFIG.beamWidth}. This gate does **not** mutate composer config.`,
  )
  rows.push(
    `Candidate-pool sensitivity is reported above (top-24 / top-48 / all feasible by BaseNodeValue).`,
  )
  rows.push(
    `Beam-width sweep 8/16/64/256 is **not** executed against production composer (would require parallel harness mutating search config). Documented as CONFIG_REQUIRED for a future diagnostic harness.`,
  )
  rows.push(`Reported regret is vs OracleObjective only — not vs RouteChoiceScore.`)
  rows.push('')
  rows.push(`## Exactness statement`)
  rows.push('')
  rows.push(
    `For Launch30 corpus size, BnB over top-24 with maxStops≤5 is typically exhaustive within the time budget.`,
  )
  rows.push(
    `Larger pools may hit the soft time limit; those rows are labeled \`BNB_TIME_LIMITED_BEST\` — not claimed exact.`,
  )
  rows.push('')

  mkdirSync(resolve(ROOT, 'docs/engine/reports'), { recursive: true })
  mkdirSync(resolve(ROOT, 'src/data/santiago/qa'), { recursive: true })
  writeFileSync(DOC, rows.join('\n') + '\n')
  writeFileSync(
    JSON_OUT,
    JSON.stringify(
      {
        gate: '2E.5-QA',
        status: 'NON_CANONICAL',
        objective: 'mean(BaseNodeValue) - 0.15 * mean(haversineTransitionMin)',
        comparableToRouteChoiceScore: false,
        runtimeBeamWidthUnchanged: ROUTE_SEARCH_CONFIG.beamWidth,
        rows: machine,
      },
      null,
      2,
    ) + '\n',
  )
}
