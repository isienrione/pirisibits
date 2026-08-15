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
    // Highlights: Colosseum → Via Sacra → Vesta → Capitoline → Trevi → Pantheon → Castel → Appian
    // Circus Maximus sits on Path B before Appian (not early in the route).
    expect(stops.map((stop) => stop.id)).toHaveLength(21)
    expect(new Set(stops.map((stop) => stop.id)).size).toBe(21)
    expect(stops.map((stop) => stop.id).indexOf('circus-maximus')).toBeGreaterThan(
      stops.map((stop) => stop.id).indexOf('castel-sant-angelo'),
    )
    expect(stops.map((stop) => stop.id).at(-2)).toBe('circus-maximus')
    expect(stops.map((stop) => stop.id).at(-1)).toBe('appian-way')
    expect(previewSegments.map((segment) => segment.skippedAfter)).toEqual([3, 0, 4, 2, 0, 3, 1, 0])
    expect(
      previewSegments.reduce((sum, segment) => sum + 1 + segment.skippedAfter, 0),
    ).toBe(totalStops)
  })

  it('frames the stop carousel without a catalog pitch', () => {
    expect(LANDING_CONTENT.monuments.headline).toMatch(/waypoints you can discover with ChronoWalk/i)
    expect(LANDING_CONTENT.monuments.subheadline).toMatch(/tap a photo to flip/i)
    expect(LANDING_CONTENT.monuments.routeName).toBe('Roma Eterna')
  })

  it('attaches Viator-aligned flip copy to every complete-route stop', () => {
    const monuments = getLandingMonuments()
    expect(monuments.every((stop) => stop.description.length > 40)).toBe(true)
    expect(monuments.every((stop) => stop.duration && stop.admission)).toBe(true)
    const colosseum = monuments.find((stop) => stop.id === 'colosseum')
    expect(colosseum.description).toMatch(/games day/i)
    expect(colosseum.description).toMatch(/50,000|machinery|arena/i)
    const pantheon = monuments.find((stop) => stop.id === 'pantheon')
    expect(pantheon.description).toMatch(/oculus/i)
    expect(pantheon.description).toMatch(/Agrippa/i)
    expect(pantheon.description).not.toMatch(/—/)
    const saturn = monuments.find((stop) => stop.id === 'forum-temple-saturn')
    expect(saturn.description).toMatch(/treasury|Saturnalia/i)
    const circus = monuments.find((stop) => stop.id === 'circus-maximus')
    expect(circus.description).toMatch(/chariot/i)
    expect(monuments.every((stop) => !stop.description.includes('—'))).toBe(true)
    expect(monuments.every((stop) => !/\b(The audio|Narration covers|The narration)\b/i.test(stop.description))).toBe(
      true,
    )
  })
})
