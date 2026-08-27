/**
 * Load Santiago engine nodes merged with Gate 2A.1 semantic calibration.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ModeCode, ThemeCode } from '@/src/lib/city-graph/types'
import { loadCalibrationByStgoId } from '@/src/engine/loadCalibration'
import type { EngineNodeRecord } from '@/src/engine/types'

const ROOT = resolve(__dirname, '../..')

export function loadSantiagoEngineNodes(root = ROOT): EngineNodeRecord[] {
  const raw = JSON.parse(
    readFileSync(resolve(root, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
  )
  const calibration = loadCalibrationByStgoId(root)

  return (raw.nodes as EngineNodeRecord[]).map((n) => {
    const cal = calibration.get(n.stgoId)
    if (!cal) {
      return {
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
        sanCristobalStaging: (n as EngineNodeRecord).sanCristobalStaging ?? null,
      }
    }

    const accessibilityStatus = cal.accessibility.status
    const stepFree =
      accessibilityStatus === 'KNOWN_STEP_FREE'
        ? true
        : accessibilityStatus === 'KNOWN_NOT_STEP_FREE'
          ? false
          : null

    const structuralSuitability = Object.fromEntries(
      (Object.entries(cal.structuralSuitability) as [ModeCode, { value: number | null; status?: string; provenance?: string }][]).map(
        ([k, v]) => [k, { value: v.value ?? null, status: v.status, provenance: v.provenance }],
      ),
    ) as EngineNodeRecord['structuralSuitability']

    return {
      stgoId: n.stgoId,
      displayName: n.displayName ?? cal.displayName ?? null,
      canonicalName: n.canonicalName ?? null,
      launchCorpus: Boolean(n.launchCorpus),
      themes: cal.derivedThemeTags as ThemeCode[],
      modes: n.modes ?? [],
      editorialRole: cal.editorialRole ?? n.editorialRole ?? null,
      tier: n.tier ?? null,
      tierNormalized: cal.tier,
      // Approved supersedes; otherwise expose effective (proposed) for scoring consumers.
      chronoWorth: cal.chronoWorth.approved ?? cal.chronoWorth.effective,
      chronoWorthProposed: cal.chronoWorth.proposed,
      chronoWorthApproved: cal.chronoWorth.approved,
      chronoWorthEffective: cal.chronoWorth.approved ?? cal.chronoWorth.effective,
      chronoWorthProvenance: String(cal.chronoWorth.provenance),
      thematicVector: cal.thematicVector,
      visitDurationMinutes: cal.visitTime.typical,
      visitTimeMin: cal.visitTime.min,
      visitTimeTypical: cal.visitTime.typical,
      visitTimeMax: cal.visitTime.max,
      structuralSuitability,
      isSensitiveMemorySite: cal.sensitiveMemory.value,
      sensitiveMemory: cal.sensitiveMemory.value,
      daylightOnly: cal.operational.daylightOnly,
      daylight_only: cal.operational.daylightOnly,
      stepFree,
      step_free_certified: stepFree,
      accessibility: accessibilityStatus,
      launchRuntimeDisposition: n.launchRuntimeDisposition ?? null,
      physicalRouteGenerationEligible: n.physicalRouteGenerationEligible ?? null,
      launchPhysicalReadiness: n.launchPhysicalReadiness ?? null,
      sanCristobalStaging: (n as EngineNodeRecord).sanCristobalStaging ?? null,
    }
  })
}

export function loadLaunchNodes(root = ROOT): EngineNodeRecord[] {
  return loadSantiagoEngineNodes(root).filter((n) => n.launchCorpus)
}
