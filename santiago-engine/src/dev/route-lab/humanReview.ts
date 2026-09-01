/**
 * Gate 2E.1 — human founder review (local-only, never feeds engine).
 */

export const HUMAN_REVIEW_STORAGE_KEY = 'cw_route_lab_human_review_v0_1'

export type HumanReviewRating = 'GOOD' | 'QUESTIONABLE' | 'BAD' | ''

export type HumanRouteReview = {
  fixtureId: string
  routeId: string
  geography: HumanReviewRating
  sequence: HumanReviewRating
  travelerFit: HumanReviewRating
  narrativeShape: HumanReviewRating
  timeUse: HumanReviewRating
  founderNote: string
  updatedAt: string
}

export type HumanReviewStore = {
  schemaVersion: 'cw_route_lab_human_review.v0.1'
  reviews: Record<string, HumanRouteReview>
}

export function reviewKey(fixtureId: string, routeId: string): string {
  return `${fixtureId}::${routeId}`
}

export function emptyHumanReview(fixtureId: string, routeId: string): HumanRouteReview {
  return {
    fixtureId,
    routeId,
    geography: '',
    sequence: '',
    travelerFit: '',
    narrativeShape: '',
    timeUse: '',
    founderNote: '',
    updatedAt: new Date().toISOString(),
  }
}

export function emptyHumanReviewStore(): HumanReviewStore {
  return { schemaVersion: 'cw_route_lab_human_review.v0.1', reviews: {} }
}

/** Browser-only parse (tests use same shape). */
export function parseHumanReviewStore(raw: string | null): HumanReviewStore {
  if (!raw) return emptyHumanReviewStore()
  try {
    const parsed = JSON.parse(raw) as HumanReviewStore
    if (parsed.schemaVersion !== 'cw_route_lab_human_review.v0.1') return emptyHumanReviewStore()
    return parsed
  } catch {
    return emptyHumanReviewStore()
  }
}

export const REVIEW_MATRIX_FIXTURES = ['F1', 'F2', 'F6', 'F8', 'F9', 'F15', 'F17'] as const

export const WATCH_GEO_FIXTURES = {
  F1: {
    note: 'Positive control — Arc reranker may have improved a compact walk.',
    expectedReranked: ['STGO_01', 'STGO_92', 'STGO_05'],
  },
  F2: {
    note: 'Compare geographic elegance vs narrative rerank — did ArcQuality improve the walk or create a loop?',
    expectedReranked: ['STGO_01', 'STGO_18', 'STGO_03', 'STGO_06', 'STGO_05', 'STGO_02'],
  },
  F8: {
    note: 'Budget-fill rerank — 4 anchors / 0 pockets / 3 micros. Evidence view only. F8 D1 Flâneur (Gate 2E.2E.1-R).',
    expectedReranked: ['STGO_01', 'STGO_92', 'STGO_18', 'STGO_03', 'STGO_19', 'STGO_02', 'STGO_26'],
  },
} as const
