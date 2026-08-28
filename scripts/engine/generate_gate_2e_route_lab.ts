#!/usr/bin/env npx tsx
/**
 * Gate 2E — generate standalone Santiago Route Lab HTML + UI bundle.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildRouteLabEmbedPayload } from '../../src/dev/route-lab/embedPayload'
import { buildAllFixtureResults } from '../../src/dev/route-lab/runRouteLab'
import { runChoicePolicyV02 } from '../../src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'
import { ROUTE_LAB_FIXTURES } from '../../src/dev/route-lab/fixtures'
import type { ArbitratedCandidate } from '../../src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'

const ROOT = resolve(__dirname, '../..')
const OUT_HTML = resolve(ROOT, 'docs/engine/gate-2e-route-lab.html')
const OUT_JS = resolve(ROOT, 'docs/engine/route-lab-ui.v0.1.js')
const OUT_MAP = resolve(ROOT, 'docs/engine/route-lab-map.v0.1.js')
const SHELL = resolve(ROOT, 'src/dev/route-lab/static/route-lab-shell.html')
const UI_SRC = resolve(ROOT, 'src/dev/route-lab/static/route-lab-ui.js')
const MAP_SRC = resolve(ROOT, 'src/dev/route-lab/static/route-lab-map.js')

function slimCandidate(c: ArbitratedCandidate) {
  return {
    originatingLane: c.originatingLane,
    routeId: c.routeId,
    userFacingLabel: c.userFacingLabel,
    routeChoiceScore: c.routeChoiceScore,
    routeChoiceCoverage: c.routeChoiceCoverage,
    composerScore: c.candidate.composerScore,
    composerScoreIsCrossLaneUtility: c.candidate.composerScoreIsCrossLaneUtility,
    stops: c.candidate.candidate.orderedStops.map((s) => s.stgoId),
    features: c.features,
    character: c.character,
  }
}

function main() {
  console.log('Building Route Lab fixture payloads (F1–F18)…')
  const results = buildAllFixtureResults(ROOT)
  const payload = buildRouteLabEmbedPayload(results, ROOT) as ReturnType<typeof buildRouteLabEmbedPayload> & {
    results: Record<string, { choicePolicy?: unknown }>
  }
  console.log('Attaching CHOICE POLICY V0.2 (H2 + arbitration)…')
  for (const fx of ROUTE_LAB_FIXTURES) {
    const run = runChoicePolicyV02(fx.input, { root: ROOT })
    const a = run.arbitration
    payload.results[fx.id]!.choicePolicy = {
      recommendedLane: a.recommendedLane,
      recommendedRouteId: a.recommendedRouteId,
      choiceConfidence: a.choiceConfidence,
      choiceMargin: a.choiceMargin,
      whyWon: a.whyWon,
      whyOthersLost: a.whyOthersLost,
      constraintDominated: a.constraintDominated,
      alternatives: a.alternatives.map(slimCandidate),
      recommended: a.recommended ? slimCandidate(a.recommended) : null,
      allCandidates: a.allCandidates.map(slimCandidate),
      legacyBlends: a.legacyBlends,
    }
  }

  let shell = readFileSync(SHELL, 'utf8')
  const inject = `<script>window.__ROUTE_LAB_DATA__ = ${JSON.stringify(payload)};</script>`
  shell = shell.replace('<!--INJECT_DATA-->', inject)

  mkdirSync(resolve(ROOT, 'docs/engine'), { recursive: true })
  writeFileSync(OUT_HTML, shell, 'utf8')
  copyFileSync(UI_SRC, OUT_JS)
  copyFileSync(MAP_SRC, OUT_MAP)

  console.log(
    JSON.stringify(
      {
        html: 'docs/engine/gate-2e-route-lab.html',
        js: 'docs/engine/route-lab-ui.v0.1.js',
        map: 'docs/engine/route-lab-map.v0.1.js',
        schema: payload.schemaVersion,
        fixtures: Object.keys(results).length,
      },
      null,
      2,
    ),
  )
}

main()
