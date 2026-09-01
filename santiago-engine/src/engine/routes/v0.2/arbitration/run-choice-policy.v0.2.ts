/**
 * Gate 2E.2E pipeline: H2 lanes → ArcQuality V0.2 → lane-neutral arbitration.
 */

import { resolve } from 'node:path'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { normalizeRouteRequest, type RouteRequestInput } from '@/src/engine/routes/route-request'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import type { EngineNodeRecord } from '@/src/engine/types'
import { composeH2RoutesV02 } from '@/src/engine/routes/v0.2/composer/compose-h2.v0.2'
import type { H2ComposerResultV02 } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import { arbitrateLaneCandidates } from '@/src/engine/routes/v0.2/arbitration/route-arbitrator.v0.2'
import type { ArbitrationResultV02 } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'

const ROOT = resolve(__dirname, '../../../../..')

export type ChoicePolicyRunV02 = {
  h2: H2ComposerResultV02
  arbitration: ArbitrationResultV02
}

export function runChoicePolicyV02(
  input: RouteRequestInput | RouteRequestV01,
  opts?: { nodes?: EngineNodeRecord[]; root?: string },
): ChoicePolicyRunV02 {
  const root = opts?.root ?? ROOT
  const request =
    (input as RouteRequestV01).schemaVersion === 'santiago-route-request.v0.1'
      ? (input as RouteRequestV01)
      : normalizeRouteRequest(input as RouteRequestInput)
  const nodes = opts?.nodes ?? loadLaunchNodes(root)
  const h2 = composeH2RoutesV02(request, { nodes, root })
  const arbitration = arbitrateLaneCandidates(request, h2.candidates)
  return { h2, arbitration }
}
