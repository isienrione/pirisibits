/** Act id → CSS custom property for the Vitality accent family. */
export const ACT_ACCENT_VARS = {
  act1: '--act-arena',
  act2: '--act-hill',
  act3: '--act-forum',
  act4: '--act-market',
  act5: '--act-city',
  act6: '--act-river',
  encore: '--act-encore',
} as const

/** WCAG text variants for act accent labels on bone. */
export const ACT_ACCENT_TEXT_VARS = {
  act1: '--act-arena-text',
  act2: '--act-hill-text',
  act3: '--act-forum-text',
  act4: '--act-market-text',
  act5: '--act-city-text',
  act6: '--act-river-text',
  encore: '--act-encore-text',
} as const

export type ActId = keyof typeof ACT_ACCENT_VARS

const DEFAULT_ACT: ActId = 'act3'

/** Resolve a manifest / pacing act id to its accent CSS variable name (without var()). */
export function getActAccentVar(actId: string | null | undefined): string {
  if (actId && actId in ACT_ACCENT_VARS) {
    return ACT_ACCENT_VARS[actId as ActId]
  }
  return ACT_ACCENT_VARS[DEFAULT_ACT]
}

/** Resolve act id to its WCAG text variant CSS variable name (without var()). */
export function getActAccentTextVar(actId: string | null | undefined): string {
  if (actId && actId in ACT_ACCENT_TEXT_VARS) {
    return ACT_ACCENT_TEXT_VARS[actId as ActId]
  }
  return ACT_ACCENT_TEXT_VARS[DEFAULT_ACT]
}

/** Full CSS value for use in inline styles, e.g. `color: actAccentValue('act1')`. */
export function actAccentValue(actId: string | null | undefined): string {
  return `var(${getActAccentVar(actId)})`
}

/** Full CSS value for act accent text on bone. */
export function actAccentTextValue(actId: string | null | undefined): string {
  return `var(${getActAccentTextVar(actId)})`
}

/** Accent fill + readable text pair for hooks and inline styles. */
export function actAccentPair(actId: string | null | undefined): {
  accent: string
  accentText: string
} {
  return {
    accent: actAccentValue(actId),
    accentText: actAccentTextValue(actId),
  }
}
