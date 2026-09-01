/**
 * Gate 2E.3-R — founder judgment metadata.
 *
 * Structurally separated from engine results. Must never be passed into
 * scoring, arbitration, composer, candidate generation, or route selection.
 */

export const FOUNDER_INSPECTION_REVIEW_SCHEMA = 'cw_founder_inspection_review.v0.1' as const
export const FOUNDER_INSPECTION_REVIEW_STORAGE_KEY = 'cw_founder_inspection_review_v0_1'

export type FounderRating5 = 1 | 2 | 3 | 4 | 5 | 'UNKNOWN'
export type FounderSellable = 'YES' | 'NO' | 'UNKNOWN'

export const DISAGREEMENT_CLASSIFICATIONS = [
  'DATA',
  'EXPERIENCE_TIME',
  'NARRATIVE_GRAPH',
  'CONTENT_GAP',
  'CALIBRATION',
  'SEARCH',
  'ARBITRATION',
  'HUMAN_PREFERENCE',
  'ENGINE_BETTER',
  'UNKNOWN',
  'CORPUS_COVERAGE',
  'PLAN_COMPOSITION',
] as const

export type DisagreementClassification = (typeof DISAGREEMENT_CLASSIFICATIONS)[number]

export type FounderInspectionReview = {
  schemaVersion: typeof FOUNDER_INSPECTION_REVIEW_SCHEMA
  fixtureId: string
  routeId: string
  routeFingerprint: string
  travelerFit: FounderRating5 | ''
  essentialOmissions: string
  geographicFlow: FounderRating5 | ''
  narrativeArc: FounderRating5 | ''
  varietyRhythm: FounderRating5 | ''
  timeUse: FounderRating5 | ''
  openingQuality: FounderRating5 | ''
  payoffQuality: FounderRating5 | ''
  endingQuality: FounderRating5 | ''
  sellable: FounderSellable | ''
  defensibleExplanation: FounderRating5 | ''
  founderNotes: string
  disagreementClassification: DisagreementClassification | ''
  updatedAt: string
  humanReviewAffectsEngine: false
}

export type FounderInspectionReviewStore = {
  schemaVersion: typeof FOUNDER_INSPECTION_REVIEW_SCHEMA
  reviews: Record<string, FounderInspectionReview>
}

export function founderInspectionReviewKey(fixtureId: string, routeId: string): string {
  return `${fixtureId}::${routeId}`
}

export function emptyFounderInspectionReview(
  fixtureId: string,
  routeId: string,
  routeFingerprint = '',
): FounderInspectionReview {
  return {
    schemaVersion: FOUNDER_INSPECTION_REVIEW_SCHEMA,
    fixtureId,
    routeId,
    routeFingerprint,
    travelerFit: '',
    essentialOmissions: '',
    geographicFlow: '',
    narrativeArc: '',
    varietyRhythm: '',
    timeUse: '',
    openingQuality: '',
    payoffQuality: '',
    endingQuality: '',
    sellable: '',
    defensibleExplanation: '',
    founderNotes: '',
    disagreementClassification: '',
    updatedAt: '',
    humanReviewAffectsEngine: false,
  }
}

export function emptyFounderInspectionReviewStore(): FounderInspectionReviewStore {
  return { schemaVersion: FOUNDER_INSPECTION_REVIEW_SCHEMA, reviews: {} }
}

export function parseFounderInspectionReviewStore(raw: string | null): FounderInspectionReviewStore {
  if (!raw) return emptyFounderInspectionReviewStore()
  try {
    const parsed = JSON.parse(raw) as FounderInspectionReviewStore
    if (parsed.schemaVersion !== FOUNDER_INSPECTION_REVIEW_SCHEMA) return emptyFounderInspectionReviewStore()
    return parsed
  } catch {
    return emptyFounderInspectionReviewStore()
  }
}

export function exportFounderInspectionReviewJson(store: FounderInspectionReviewStore): string {
  return JSON.stringify(store, null, 2) + '\n'
}

export function importFounderInspectionReviewJson(raw: string): FounderInspectionReviewStore {
  return parseFounderInspectionReviewStore(raw)
}

/** Explicit: review documents are not engine inputs. */
export function founderReviewIsEngineInput(_review: FounderInspectionReview): false {
  return false
}
