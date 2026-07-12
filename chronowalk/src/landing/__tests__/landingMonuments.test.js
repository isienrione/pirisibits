import { describe, expect, it } from 'vitest'
import { getLandingMonuments } from '../landingMonuments.js'

describe('getLandingMonuments', () => {
  it('returns complete route stops with photos and titles', () => {
    const monuments = getLandingMonuments()
    expect(monuments.length).toBeGreaterThan(20)
    expect(monuments[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      photo: expect.stringMatching(/modern-poster-thumb\.webp$/),
    })
  })
})
