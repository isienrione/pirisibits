/**
 * Gate 2A — canonical taxonomy labels for Engine V0.1.
 * Source of truth for Santiago engine nodes: ThemeCode / ModeCode in city-graph/types.
 *
 * NOTE: Prompt-era “T2 Culinary Explorer” is NOT present on Santiago ThemeCode.
 * Demo algorithm.ts maps vector index T2 → memory (T1B alias). Do not invent T2 culinary tags.
 */

import type { ModeCode, ThemeCode } from '@/src/lib/city-graph/types'

export const THEME_CODES = ['T1A', 'T1B', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'] as const satisfies readonly ThemeCode[]

export const MODE_CODES = ['M1', 'M2', 'M3', 'M4', 'M5'] as const satisfies readonly ModeCode[]

export const THEME_LABELS: Record<ThemeCode, string> = {
  T1A: 'Civic, Military & Traditional Heritage',
  T1B: 'Memory, Human Rights & Grassroots',
  T3: 'Urban Shutterbug & Aesthetics',
  T4: 'Subculture, Street Art & Indie',
  T5: 'Mindful, Green & Quiet Living',
  T6: 'Dark Lore, Forensics & Macabre',
  T7: 'Budget Hacker & Street Life',
  T8: 'Urban Ecology & Conscious Living',
  T9: 'Luxury Heritage & High Craft',
}

/** Aspirational culinary axis — FUTURE_NOT_2A (absent from ThemeCode). */
export const FUTURE_THEME_T2_CULINARY = {
  code: 'T2',
  label: 'Culinary Explorer & Gastronomy',
  status: 'FUTURE_NOT_2A' as const,
  note: 'Not present on Santiago ThemeCode; do not invent culinary tags in Gate 2A.',
}

export const MODE_LABELS: Record<ModeCode, string> = {
  M1: 'Express / Time-Boxed',
  M2: 'Accessibility / Step-Free',
  M3: 'Family & Kid Quest',
  M4: 'Night Owl / Nocturnal',
  M5: 'High Comfort / Low Friction',
}

export const DISCOVERY_POSTURE_LABELS = {
  D1: 'Essentials-balanced / Flâneur',
  D2: 'Discovery-forward / Detective',
  D3: 'Essentials-first / Coleccionista',
} as const

export type DiscoveryPostureCode = keyof typeof DISCOVERY_POSTURE_LABELS

/** Editorial roles observed on Santiago launch corpus (not collapsed). */
export const EDITORIAL_ROLE_LABELS: Record<string, string> = {
  anchor: 'Anchor / essential civic stop',
  pocket: 'Pocket revelation',
  micro: 'Micro / discovery grain',
  civic: 'Civic institution',
  museum: 'Museum / cultural institution',
  memory: 'Memory site',
  plaza: 'Plaza / open civic space',
  architecture: 'Architecture focus',
  culture: 'Culture house / corridor',
}

export function emptyThemeWeights(): Record<ThemeCode, number> {
  return {
    T1A: 0,
    T1B: 0,
    T3: 0,
    T4: 0,
    T5: 0,
    T6: 0,
    T7: 0,
    T8: 0,
    T9: 0,
  }
}

export function emptyModeFlags(): Record<ModeCode, boolean> {
  return { M1: false, M2: false, M3: false, M4: false, M5: false }
}
