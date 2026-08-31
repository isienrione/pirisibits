/**
 * Gate 2E.6 — Modular content selection (no LLM, no fabricated modules).
 */

import type { ArcStateVNext } from '@/src/engine/vnext/arc/arc-state-vnext'
import type { ContentModuleRecord } from '@/src/engine/vnext/place/types'
import type { TravelerModel } from '@/src/engine/types'

export type ContentSelectionResult = {
  selected: ContentModuleRecord[]
  omitted: ContentModuleRecord[]
  reasons: string[]
  unknownCoverage: number
}

export function selectContentModules(args: {
  experienceId: string
  available: ContentModuleRecord[]
  traveler: TravelerModel
  arcState: ArcStateVNext
  timeContext: { remainingMin: number | null; walkCompatibleCapacity: 'UNKNOWN' | 'CONFIG_REQUIRED' }
}): ContentSelectionResult {
  const pool = args.available.filter((m) => m.experienceId === args.experienceId)
  if (!pool.length) {
    return {
      selected: [],
      omitted: [],
      reasons: ['NO_RELEVANT_MODULE'],
      unknownCoverage: 1,
    }
  }

  const selected: ContentModuleRecord[] = []
  const omitted: ContentModuleRecord[] = []
  const reasons: string[] = []

  const core = pool.filter((m) => m.moduleType === 'CORE')
  const optional = pool.filter((m) => m.moduleType !== 'CORE' && m.moduleType !== 'TRANSITION')

  if (core.length) {
    selected.push(core[0]!)
    reasons.push('CORE_PREFERRED')
    omitted.push(...core.slice(1))
  }

  // Rank optional by theme overlap with traveler + phase need — skip if none relevant
  const ranked = [...optional].sort((a, b) => scoreModule(a, args) - scoreModule(b, args)).reverse()
  for (const m of ranked) {
    const sc = scoreModule(m, args)
    if (sc <= 0) {
      omitted.push(m)
      reasons.push(`SKIP_${m.contentModuleId}_NO_RELEVANCE`)
      continue
    }
    // Capacity unknown — do not invent overlap; only take one optional depth max for alpha
    if (selected.filter((x) => x.moduleType !== 'CORE').length >= 1) {
      omitted.push(m)
      reasons.push(`SKIP_${m.contentModuleId}_CAPACITY_UNKNOWN`)
      continue
    }
    selected.push(m)
    reasons.push(`SELECT_${m.contentModuleId}_SCORE_${sc.toFixed(2)}`)
  }

  const unknownCoverage = args.timeContext.walkCompatibleCapacity === 'UNKNOWN' ? 0.5 : 0.2
  return { selected, omitted, reasons, unknownCoverage }
}

function scoreModule(
  m: ContentModuleRecord,
  args: { traveler: TravelerModel; arcState: ArcStateVNext },
): number {
  let s = 0
  const themes = m.themes
  for (const [code, w] of Object.entries(args.traveler.themeWeights)) {
    if ((w ?? 0) > 0 && themes.some((t) => String(t).includes(code) || code.includes(String(t)))) s += w
  }
  if (m.moduleType === 'MICRO_REVEAL' && args.arcState.phase === 'MIDDLE') s += 0.3
  if (m.moduleType === 'OPTIONAL_DEPTH' && args.arcState.phase === 'LATE') s += 0.2
  if (m.moduleType === 'NARRATIVE_LENS' && args.arcState.openQuestions.length) s += 0.25
  return s
}

/** Transition content capability — infrastructure only; no fabricated narration. */
export function listTransitionContentModules(available: ContentModuleRecord[]): ContentModuleRecord[] {
  return available.filter((m) => m.moduleType === 'TRANSITION')
}
