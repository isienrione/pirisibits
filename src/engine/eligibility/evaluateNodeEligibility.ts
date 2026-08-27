/**
 * Gate 2A — deterministic hard eligibility.
 * UNKNOWN must not become FALSE.
 */

import type {
  EligibilityReason,
  EligibilityResult,
  EligibilityWarning,
  EngineNodeRecord,
  EvaluationContext,
  TravelerModel,
} from '@/src/engine/types'

function isDaylightSantiago(now: Date): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Santiago',
    }).format(now),
  )
  return hour >= 7 && hour < 19
}

function explicitSensitive(node: EngineNodeRecord): boolean {
  return Boolean(node.isSensitiveMemorySite || node.sensitiveMemory)
}

function explicitDaylightOnly(node: EngineNodeRecord): boolean {
  return Boolean(node.daylightOnly || node.daylight_only)
}

function explicitStepFreeFalse(node: EngineNodeRecord): boolean {
  if (node.step_free_certified === false || node.stepFree === false) return true
  if (typeof node.accessibility === 'string') {
    const a = node.accessibility.toUpperCase()
    if (a === 'NOT_ACCESSIBLE' || a === 'STEP_FREE_FALSE' || a === 'INACCESSIBLE') return true
  }
  return false
}

function accessibilityUnknown(node: EngineNodeRecord): boolean {
  if (node.step_free_certified === true || node.stepFree === true) return false
  if (explicitStepFreeFalse(node)) return false
  return node.accessibility == null || String(node.accessibility).toUpperCase() === 'UNKNOWN'
}

export function evaluateNodeEligibility(
  node: EngineNodeRecord,
  traveler: TravelerModel,
  context: EvaluationContext = {},
): EligibilityResult {
  const hardFailures: EligibilityReason[] = []
  const warnings: EligibilityWarning[] = []
  const launchOnly = context.launchCorpusOnly !== false

  if (launchOnly && !node.launchCorpus) {
    hardFailures.push({
      code: 'NOT_LAUNCH_CORPUS',
      message: 'Gate 2A candidate pool is launch-corpus only',
      evidenceState: 'PRESENT',
    })
  }

  const disposition = node.launchRuntimeDisposition ?? null
  if (disposition && disposition.startsWith('RUNTIME_EXCLUDED')) {
    hardFailures.push({
      code: 'RUNTIME_EXCLUDED',
      message: `Launch runtime disposition ${disposition}`,
      evidenceState: 'PRESENT',
    })
  }

  if (node.editoriallyDisabled === true) {
    hardFailures.push({
      code: 'EDITORIALLY_DISABLED',
      message: 'Node explicitly editorially disabled',
      evidenceState: 'PRESENT',
    })
  }

  if (node.launchCorpus && node.physicalRouteGenerationEligible === false && !disposition?.startsWith('RUNTIME_EXCLUDED')) {
    // Excluded nodes already caught; other ineligible launch nodes fail physically.
    hardFailures.push({
      code: 'PHYSICAL_INELIGIBLE',
      message: 'physicalRouteGenerationEligible is false',
      evidenceState: 'PRESENT',
    })
  }

  if (traveler.stepFreeRequired) {
    if (explicitStepFreeFalse(node)) {
      hardFailures.push({
        code: 'EXPLICIT_ACCESSIBILITY_INCOMPATIBLE',
        message: 'Traveler requires step-free access; node explicitly not step-free',
        evidenceState: 'PRESENT',
      })
    } else if (accessibilityUnknown(node)) {
      warnings.push({
        code: 'ACCESSIBILITY_UNKNOWN',
        message: 'Step-free required but node accessibility is UNKNOWN — not treated as accessible',
        evidenceState: 'UNKNOWN',
      })
    }
  }

  if (!traveler.memorySitesOptIn && explicitSensitive(node)) {
    hardFailures.push({
      code: 'EXPLICIT_SENSITIVE_MEMORY_WITHOUT_OPT_IN',
      message: 'Sensitive memory site requires explicit opt-in',
      evidenceState: 'PRESENT',
    })
  } else if (!traveler.memorySitesOptIn && (node.themes || []).includes('T1B')) {
    warnings.push({
      code: 'SENSITIVE_THEME_WITHOUT_OPT_IN',
      message: 'Node carries T1B theme without explicit sensitive flag; preference soft-warn only',
      evidenceState: 'PARTIAL',
    })
  }

  const now = context.now ?? new Date()
  if (explicitDaylightOnly(node) && !isDaylightSantiago(now)) {
    hardFailures.push({
      code: 'EXPLICIT_DAYLIGHT_ONLY_AT_NIGHT',
      message: 'Node is daylight-only and current Santiago time is night',
      evidenceState: 'PRESENT',
    })
  }

  const visited = new Set(context.alreadyVisitedStgoIds ?? [])
  if (visited.has(node.stgoId) && context.hardExcludeVisited) {
    hardFailures.push({
      code: 'ALREADY_VISITED_HARD',
      message: 'Node already visited (hard exclusion requested)',
      evidenceState: 'PRESENT',
    })
  }

  const visitMinutes = node.visitDurationMinutes ?? node.timeCostMinutes
  if (visitMinutes == null) {
    warnings.push({
      code: 'VISIT_DURATION_UNKNOWN',
      message: 'Authored visit duration missing — not invented',
      evidenceState: 'MISSING',
    })
  } else if (
    context.remainingTimeBudgetMinutes != null &&
    visitMinutes > context.remainingTimeBudgetMinutes
  ) {
    hardFailures.push({
      code: 'HARD_TIME_IMPOSSIBLE',
      message: `Visit duration ${visitMinutes}m exceeds remaining budget ${context.remainingTimeBudgetMinutes}m`,
      evidenceState: 'PRESENT',
    })
  }

  if (node.chronoWorth == null) {
    warnings.push({
      code: 'CHRONOWORTH_MISSING',
      message: 'ChronoWorth absent — editorial component will not invent a curated default',
      evidenceState: 'MISSING',
    })
  }

  if (node.openingHours == null) {
    warnings.push({
      code: 'OPENING_HOURS_UNKNOWN',
      message: 'Opening hours unknown — not fabricated',
      evidenceState: 'MISSING',
    })
  }

  const modes = node.modes || []
  if (modes.length <= 1) {
    warnings.push({
      code: 'STRUCTURAL_MODE_DATA_SPARSE',
      message: 'Node structural mode tags are sparse (often M3-only in launch freeze)',
      evidenceState: 'PARTIAL',
    })
  }

  warnings.push({
    code: 'FRICTION_FIELDS_UNKNOWN',
    message: 'POI soft/hard friction remains UNKNOWN per physical friction audit',
    evidenceState: 'UNKNOWN',
  })

  if (disposition === 'RUNTIME_STAGED') {
    warnings.push({
      code: 'STAGED_PHYSICAL_ENDPOINT',
      message: 'RUNTIME_STAGED — physical endpoint may be incomplete (e.g. funicular base ≠ summit)',
      evidenceState: 'PRESENT',
    })
  }

  return {
    eligible: hardFailures.length === 0,
    hardFailures,
    warnings,
  }
}
