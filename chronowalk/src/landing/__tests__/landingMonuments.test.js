import { describe, expect, it } from 'vitest'
import {
  getLandingMonuments,
  getLandingRouteJourney,
  LANDING_ROUTE_CHAPTERS,
  LANDING_ROUTE_PREVIEW_IDS,
} from '../landingMonuments.js'
import { LANDING_CONTENT } from '../landingData.js'

describe('getLandingMonuments', () => {
  it('returns complete route stops with photos and titles', () => {
    const monuments = getLandingMonuments()
    expect(monuments.length).toBeGreaterThan(20)
    expect(monuments[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      photo: expect.stringMatching(/^\/waypoints\//),
      index: 1,
    })
  })
})

describe('getLandingRouteJourney', () => {
  it('groups the complete route into narrative chapters spanning every stop', () => {
    const { stops, chapters, previewStops, previewSegments, totalStops } = getLandingRouteJourney()

    expect(totalStops).toBe(stops.length)
    expect(chapters).toHaveLength(LANDING_ROUTE_CHAPTERS.length)
    expect(chapters.flatMap((chapter) => chapter.stops.map((stop) => stop.id))).toEqual(
      stops.map((stop) => stop.id),
    )
    expect(previewStops.map((stop) => stop.id)).toEqual(LANDING_ROUTE_PREVIEW_IDS)
    expect(previewStops.every((stop) => stop.featured)).toBe(true)
    expect(previewSegments.map((segment) => segment.stop.id)).toEqual(LANDING_ROUTE_PREVIEW_IDS)
    // Highlights: Colosseum → Titus → Vesta → Capitoline → Trevi → Pantheon → Castel → Appian
    // Gap after Titus no longer jumps straight to Trevi (10 skips); Vesta + Capitoline break it up.
    expect(previewSegments.map((segment) => segment.skippedAfter)).toEqual([1, 2, 4, 2, 0, 3, 1, 0])
    expect(
      previewSegments.reduce((sum, segment) => sum + 1 + segment.skippedAfter, 0),
    ).toBe(totalStops)
  })

  it('sells continuity in section copy, not a stop count catalog', () => {
    expect(LANDING_CONTENT.monuments.headline).toContain('One continuous story')
    expect(LANDING_CONTENT.monuments.subheadline).toMatch(/Arena to the Appian Way/i)
  })
})
