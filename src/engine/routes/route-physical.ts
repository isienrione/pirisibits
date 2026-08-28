/**
 * Gate 2C — frozen physical transition index (walk + operational Metro).
 * Never invents walks or L7.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  ENGINE_POLICY_METRO_ENTRY_FRICTION_S,
  ENGINE_POLICY_METRO_TRANSFER_FRICTION_S,
} from '@/src/lib/city-graph/physical-edge-constants'
import {
  FORBIDDEN_METRO_LINES,
  OPERATIONAL_METRO_LINES,
  ROUTE_SEARCH_CONFIG,
} from '@/src/engine/routes/route-config'
import type { PhysicalTransition } from '@/src/engine/routes/route-types'

const ROOT = resolve(__dirname, '../../..')

type WalkEdge = {
  to: string
  durationMin: number
  distanceM: number
  edgeId: string
}

type AccessEdge = {
  stationId: string
  durationMin: number
  distanceM: number
  edgeId: string
  runtimePreferred: boolean
}

type MetroRide = {
  to: string
  lineId: string
  durationMin: number
  edgeId: string
}

export type PhysicalGraphIndex = {
  physicallyEligibleIds: Set<string>
  walkOut: Map<string, WalkEdge[]>
  accessFromPoi: Map<string, AccessEdge[]>
  accessToPoi: Map<string, AccessEdge[]> // station -> POIs
  metroOut: Map<string, MetroRide[]>
  transferPenaltyMin: Map<string, number> // `${station}|${fromLine}|${toLine}`
  operationalLines: Set<string>
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function loadPhysicalGraphIndex(root = ROOT): PhysicalGraphIndex {
  const adj = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json'), 'utf8'),
  )
  const mm = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_multimodal_graph.v0.3.json'), 'utf8'),
  )

  const physicallyEligibleIds = new Set<string>(adj.eligibleStgoIds || [])
  const walkOut = new Map<string, WalkEdge[]>()
  for (const e of adj.edges || []) {
    if (!e.runtimeEligible) continue
    if (e.mode && e.mode !== 'WALK') continue
    const from = e.fromPoiId as string
    const to = e.toPoiId as string
    const durationMin = Number(e.durationMin ?? e.durationS / 60)
    if (durationMin > ROUTE_SEARCH_CONFIG.maxWalkChunkMin) continue
    const list = walkOut.get(from) || []
    list.push({
      to,
      durationMin: round1(durationMin),
      distanceM: Number(e.distanceM),
      edgeId: String(e.edgeId || `${from}>${to}`),
    })
    walkOut.set(from, list)
  }

  const operationalLines = new Set<string>(OPERATIONAL_METRO_LINES)
  for (const bad of FORBIDDEN_METRO_LINES) operationalLines.delete(bad)

  const accessFromPoi = new Map<string, AccessEdge[]>()
  const accessToPoi = new Map<string, AccessEdge[]>()
  for (const e of mm.poiMetroAccessEdges || []) {
    if (e.runtimePreferred === false) continue
    const stgoId = String(e.stgoId)
    const stationId = String(e.stationId)
    const durationMin = round1(Number(e.durationSeconds) / 60)
    const distanceM = Number(e.distanceMeters)
    const edgeId = String(e.edgeId)
    const fromIsPoi = String(e.from) === stgoId
    const payload: AccessEdge = {
      stationId,
      durationMin,
      distanceM,
      edgeId,
      runtimePreferred: Boolean(e.runtimePreferred),
    }
    if (fromIsPoi) {
      const list = accessFromPoi.get(stgoId) || []
      list.push(payload)
      accessFromPoi.set(stgoId, list)
    }
    // reverse access also listed in artifact; index station -> poi
    const toIsPoi = String(e.to) === stgoId
    if (toIsPoi || fromIsPoi) {
      const list = accessToPoi.get(stationId) || []
      if (!list.some((x) => x.edgeId === edgeId && (accessFromPoi.get(stgoId) || []).some((a) => a.stationId === stationId))) {
        // store poi access keyed by station for exits
        const exitList = accessToPoi.get(stationId) || []
        exitList.push({ ...payload, stationId: stgoId }) // reuse field: stationId holds poi for exit map? Better separate.
      }
      void list
    }
  }

  // Rebuild exit map cleanly: stationId -> AccessEdge-like with poi in stationId field replaced
  const stationToPois = new Map<string, AccessEdge[]>()
  for (const e of mm.poiMetroAccessEdges || []) {
    if (e.runtimePreferred === false) continue
    const stgoId = String(e.stgoId)
    const stationId = String(e.stationId)
    const durationMin = round1(Number(e.durationSeconds) / 60)
    const edge: AccessEdge = {
      stationId: stgoId, // poi id stored here for exit lookup
      durationMin,
      distanceM: Number(e.distanceMeters),
      edgeId: String(e.edgeId),
      runtimePreferred: true,
    }
    const list = stationToPois.get(stationId) || []
    if (!list.some((x) => x.stationId === stgoId)) list.push(edge)
    stationToPois.set(stationId, list)
  }

  const metroOut = new Map<string, MetroRide[]>()
  for (const e of mm.metroRideEdges || []) {
    const lineId = String(e.lineId)
    if (!operationalLines.has(lineId)) continue
    if (FORBIDDEN_METRO_LINES.includes(lineId as (typeof FORBIDDEN_METRO_LINES)[number])) continue
    if (e.runtimeOperational === false) continue
    const scheduled = e.scheduledDurationSeconds
    if (scheduled == null) continue
    const from = String(e.fromStationId)
    const to = String(e.toStationId)
    const list = metroOut.get(from) || []
    list.push({
      to,
      lineId,
      durationMin: round1(Number(scheduled) / 60),
      edgeId: String(e.edgeId),
    })
    metroOut.set(from, list)
  }

  const transferPenaltyMin = new Map<string, number>()
  for (const e of mm.metroTransferEdges || []) {
    const fromLine = String(e.fromLineId)
    const toLine = String(e.toLineId)
    if (!operationalLines.has(fromLine) || !operationalLines.has(toLine)) continue
    const penaltyS =
      e.enginePolicyTransferPenaltySeconds ?? ENGINE_POLICY_METRO_TRANSFER_FRICTION_S
    transferPenaltyMin.set(
      `${e.stationId}|${fromLine}|${toLine}`,
      round1(Number(penaltyS) / 60),
    )
  }

  return {
    physicallyEligibleIds,
    walkOut,
    accessFromPoi,
    accessToPoi: stationToPois,
    metroOut,
    transferPenaltyMin,
    operationalLines,
  }
}

type MetroPath = {
  durationMin: number
  scheduledMetroMin: number
  policyFrictionMin: number
  walkAccessMin: number
  lineIds: string[]
  transferCount: number
  edgeRefs: string[]
}

function shortestMetroPath(
  index: PhysicalGraphIndex,
  startStation: string,
  endStation: string,
): MetroPath | null {
  if (startStation === endStation) {
    return {
      durationMin: 0,
      scheduledMetroMin: 0,
      policyFrictionMin: 0,
      walkAccessMin: 0,
      lineIds: [],
      transferCount: 0,
      edgeRefs: [],
    }
  }
  // Dijkstra on (station, line|null)
  type Node = { station: string; line: string | null }
  const key = (n: Node) => `${n.station}|${n.line ?? 'NONE'}`
  const dist = new Map<string, number>()
  const prev = new Map<string, { prevKey: string | null; ride?: MetroRide; transferMin?: number }>()
  const pq: Array<{ k: string; d: number; node: Node }> = []
  const start: Node = { station: startStation, line: null }
  dist.set(key(start), 0)
  pq.push({ k: key(start), d: 0, node: start })

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d)
    const cur = pq.shift()!
    if (cur.d !== dist.get(cur.k)) continue
    if (cur.node.station === endStation) {
      // reconstruct
      const lineIds: string[] = []
      const edgeRefs: string[] = []
      let transferCount = 0
      let scheduled = 0
      let policy = 0
      let walk = 0
      let ck: string | null = cur.k
      while (ck) {
        const p = prev.get(ck)
        if (!p) break
        if (p.ride) {
          lineIds.push(p.ride.lineId)
          edgeRefs.push(p.ride.edgeId)
          scheduled += p.ride.durationMin
        }
        if (p.transferMin) {
          transferCount += 1
          policy += p.transferMin
        }
        ck = p.prevKey
      }
      return {
        durationMin: round1(cur.d),
        scheduledMetroMin: round1(scheduled),
        policyFrictionMin: round1(policy),
        walkAccessMin: walk,
        lineIds: [...new Set(lineIds.reverse())],
        transferCount,
        edgeRefs: edgeRefs.reverse(),
      }
    }
    if ((cur.node.line ? 1 : 0) + edgeRefsDepth(prev, cur.k) > ROUTE_SEARCH_CONFIG.maxMetroRideLegs + 4) {
      continue
    }
    for (const ride of index.metroOut.get(cur.node.station) || []) {
      let extra = ride.durationMin
      let transferMin = 0
      if (cur.node.line && cur.node.line !== ride.lineId) {
        transferMin =
          index.transferPenaltyMin.get(`${cur.node.station}|${cur.node.line}|${ride.lineId}`) ??
          round1(ENGINE_POLICY_METRO_TRANSFER_FRICTION_S / 60)
        extra += transferMin
      }
      const next: Node = { station: ride.to, line: ride.lineId }
      const nk = key(next)
      const nd = cur.d + extra
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd)
        prev.set(nk, { prevKey: cur.k, ride, transferMin: transferMin || undefined })
        pq.push({ k: nk, d: nd, node: next })
      }
    }
  }
  return null
}

function edgeRefsDepth(
  prev: Map<string, { prevKey: string | null }>,
  k: string,
): number {
  let n = 0
  let ck: string | null = k
  while (ck && n < 40) {
    const p = prev.get(ck)
    if (!p?.prevKey) break
    ck = p.prevKey
    n += 1
  }
  return n
}

/**
 * Outgoing physically feasible transitions from a Launch30-eligible POI.
 */
export function outgoingTransitions(
  index: PhysicalGraphIndex,
  fromStgoId: string,
  transportPolicy: 'WALK_ONLY' | 'WALK_METRO',
  eligibleTargets: Set<string>,
): PhysicalTransition[] {
  const out: PhysicalTransition[] = []
  const seen = new Set<string>()

  for (const w of index.walkOut.get(fromStgoId) || []) {
    if (!eligibleTargets.has(w.to) || !index.physicallyEligibleIds.has(w.to)) continue
    const t: PhysicalTransition = {
      mode: 'WALK',
      fromStgoId,
      toStgoId: w.to,
      durationMin: w.durationMin,
      distanceM: w.distanceM,
      metroLineIds: [],
      transferCount: 0,
      policyFrictionMin: 0,
      scheduledMetroMin: 0,
      walkAccessMin: 0,
      explanation: `Walk ${w.durationMin} min (${Math.round(w.distanceM)} m) on frozen pedestrian adjacency`,
      edgeRefs: [w.edgeId],
    }
    out.push(t)
    seen.add(w.to)
  }

  if (transportPolicy !== 'WALK_METRO') return out.sort((a, b) => a.durationMin - b.durationMin)

  const entryFrictionMin = round1(ENGINE_POLICY_METRO_ENTRY_FRICTION_S / 60)
  const fromAccess = index.accessFromPoi.get(fromStgoId) || []
  if (fromAccess.length) {
    // Multi-source Dijkstra from all entry stations of current POI.
    type Node = { station: string; line: string | null }
    const key = (n: Node) => `${n.station}|${n.line ?? 'NONE'}`
    const dist = new Map<string, number>()
    const meta = new Map<
      string,
      { scheduled: number; policy: number; lines: string[]; transfers: number; edgeRefs: string[]; entryAccess: AccessEdge }
    >()
    const pq: Array<{ k: string; d: number; node: Node }> = []
    for (const access of fromAccess) {
      const start: Node = { station: access.stationId, line: null }
      const k0 = key(start)
      const d0 = access.durationMin + entryFrictionMin
      if (d0 < (dist.get(k0) ?? Infinity)) {
        dist.set(k0, d0)
        meta.set(k0, {
          scheduled: 0,
          policy: entryFrictionMin,
          lines: [],
          transfers: 0,
          edgeRefs: [access.edgeId],
          entryAccess: access,
        })
        pq.push({ k: k0, d: d0, node: start })
      }
    }
    while (pq.length) {
      pq.sort((a, b) => a.d - b.d)
      const cur = pq.shift()!
      if (cur.d !== dist.get(cur.k)) continue
      const curMeta = meta.get(cur.k)!
      if (curMeta.edgeRefs.length > ROUTE_SEARCH_CONFIG.maxMetroRideLegs + 3) continue
      for (const ride of index.metroOut.get(cur.node.station) || []) {
        let extra = ride.durationMin
        let transferMin = 0
        if (cur.node.line && cur.node.line !== ride.lineId) {
          transferMin =
            index.transferPenaltyMin.get(`${cur.node.station}|${cur.node.line}|${ride.lineId}`) ??
            round1(ENGINE_POLICY_METRO_TRANSFER_FRICTION_S / 60)
          extra += transferMin
        }
        const next: Node = { station: ride.to, line: ride.lineId }
        const nk = key(next)
        const nd = cur.d + extra
        if (nd < (dist.get(nk) ?? Infinity)) {
          dist.set(nk, nd)
          meta.set(nk, {
            scheduled: curMeta.scheduled + ride.durationMin,
            policy: curMeta.policy + transferMin,
            lines: curMeta.lines.includes(ride.lineId) ? curMeta.lines : [...curMeta.lines, ride.lineId],
            transfers: curMeta.transfers + (transferMin > 0 ? 1 : 0),
            edgeRefs: [...curMeta.edgeRefs, ride.edgeId],
            entryAccess: curMeta.entryAccess,
          })
          pq.push({ k: nk, d: nd, node: next })
        }
      }
    }

    // Best arrival cost per station (any line state)
    const bestAtStation = new Map<string, { d: number; metaKey: string }>()
    for (const [k, d] of dist) {
      const station = k.split('|')[0]!
      const prev = bestAtStation.get(station)
      if (!prev || d < prev.d) bestAtStation.set(station, { d, metaKey: k })
    }

    for (const [stationId, best] of bestAtStation) {
      const m = meta.get(best.metaKey)!
      for (const exit of index.accessToPoi.get(stationId) || []) {
        const toPoi = exit.stationId
        if (toPoi === fromStgoId) continue
        if (!eligibleTargets.has(toPoi) || !index.physicallyEligibleIds.has(toPoi)) continue
        const total = round1(best.d + exit.durationMin)
        if (total > ROUTE_SEARCH_CONFIG.maxMetroAssistedMin) continue
        const existingWalk = out.find((t) => t.toStgoId === toPoi && t.mode === 'WALK')
        if (existingWalk && existingWalk.durationMin <= total) continue
        const t: PhysicalTransition = {
          mode: 'METRO',
          fromStgoId,
          toStgoId: toPoi,
          durationMin: total,
          distanceM: null,
          metroLineIds: m.lines,
          transferCount: m.transfers,
          policyFrictionMin: round1(m.policy),
          scheduledMetroMin: round1(m.scheduled),
          walkAccessMin: round1(m.entryAccess.durationMin + exit.durationMin),
          explanation: `Metro-assisted via ${m.lines.join('/') || 'network'} (scheduled ${round1(m.scheduled)} min + policy friction ${round1(m.policy)} min + access walks ${round1(m.entryAccess.durationMin + exit.durationMin)} min)`,
          edgeRefs: [...m.edgeRefs, exit.edgeId],
        }
        const prevIdx = out.findIndex((x) => x.toStgoId === toPoi && x.mode === 'METRO')
        if (prevIdx >= 0) {
          if (out[prevIdx]!.durationMin <= t.durationMin) continue
          out[prevIdx] = t
        } else {
          out.push(t)
        }
      }
    }
  }

  const best = new Map<string, PhysicalTransition>()
  for (const t of out) {
    const prev = best.get(t.toStgoId)
    if (!prev || t.durationMin < prev.durationMin) best.set(t.toStgoId, t)
  }
  return [...best.values()].sort((a, b) => a.durationMin - b.durationMin || a.toStgoId.localeCompare(b.toStgoId))
}
