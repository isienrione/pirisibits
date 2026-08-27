/**
 * Load Santiago engine nodes as EngineNodeRecord[] without mutating physical graph.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { EngineNodeRecord } from '@/src/engine/types'

const ROOT = resolve(__dirname, '../..')

export function loadSantiagoEngineNodes(root = ROOT): EngineNodeRecord[] {
  const raw = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
  )
  return (raw.nodes as EngineNodeRecord[]).map((n) => ({
    stgoId: n.stgoId,
    displayName: n.displayName ?? null,
    canonicalName: n.canonicalName ?? null,
    launchCorpus: Boolean(n.launchCorpus),
    themes: n.themes ?? [],
    modes: n.modes ?? [],
    editorialRole: n.editorialRole ?? null,
    tier: n.tier ?? null,
    chronoWorth: n.chronoWorth ?? null,
    launchRuntimeDisposition: n.launchRuntimeDisposition ?? null,
    physicalRouteGenerationEligible: n.physicalRouteGenerationEligible ?? null,
    launchPhysicalReadiness: n.launchPhysicalReadiness ?? null,
    isSensitiveMemorySite: (n as EngineNodeRecord).isSensitiveMemorySite ?? null,
    sensitiveMemory: (n as EngineNodeRecord).sensitiveMemory ?? null,
    daylightOnly: (n as EngineNodeRecord).daylightOnly ?? null,
    daylight_only: (n as EngineNodeRecord).daylight_only ?? null,
    stepFree: (n as EngineNodeRecord).stepFree ?? null,
    step_free_certified: (n as EngineNodeRecord).step_free_certified ?? null,
    accessibility: (n as EngineNodeRecord).accessibility ?? null,
    visitDurationMinutes: (n as EngineNodeRecord).visitDurationMinutes ?? null,
    timeCostMinutes: (n as EngineNodeRecord).timeCostMinutes ?? null,
    openingHours: (n as EngineNodeRecord).openingHours ?? null,
    editoriallyDisabled: (n as EngineNodeRecord).editoriallyDisabled ?? null,
    sanCristobalStaging: (n as EngineNodeRecord).sanCristobalStaging ?? null,
  }))
}

export function loadLaunchNodes(root = ROOT): EngineNodeRecord[] {
  return loadSantiagoEngineNodes(root).filter((n) => n.launchCorpus)
}
