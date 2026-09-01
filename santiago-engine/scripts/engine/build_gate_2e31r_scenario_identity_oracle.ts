#!/usr/bin/env npx tsx
/**
 * One-shot freeze of F1–F18 scenario-identity QA records.
 * Tests must NOT invoke this. Re-run only when intentionally accepting a new checkpoint.
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROUTE_LAB_FIXTURES } from '../../src/dev/route-lab/fixtures'
import { runRouteLabFixture } from '../../src/dev/route-lab/runRouteLab'
import { runChoicePolicyV02 } from '../../src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'
import {
  buildScenarioQaRecord,
  RECONSTRUCTION_PARENT_SHA,
  SCENARIO_QA_ORACLE_REL,
  SCENARIO_QA_ORACLE_SCHEMA,
} from '../../src/dev/route-lab/scenarioIdentity'

const ROOT = resolve(__dirname, '../..')

function main() {
  const records: Record<string, ReturnType<typeof buildScenarioQaRecord>> = {}
  for (const fx of ROUTE_LAB_FIXTURES) {
    const lab = runRouteLabFixture(fx.id, ROOT)
    const { arbitration } = runChoicePolicyV02(fx.input, { root: ROOT })
    records[fx.id] = buildScenarioQaRecord({ fixture: fx, lab, arbitration })
  }
  const payload = {
    schemaVersion: SCENARIO_QA_ORACLE_SCHEMA,
    executableOracle: 'F1-F18' as const,
    lostHistoricalOracle: 'R1-R8' as const,
    reconstructionParent: RECONSTRUCTION_PARENT_SHA,
    records,
  }
  writeFileSync(resolve(ROOT, SCENARIO_QA_ORACLE_REL), `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({ wrote: SCENARIO_QA_ORACLE_REL, count: Object.keys(records).length }, null, 2))
}

main()
