import { describe, expect, it, beforeEach } from 'vitest'
import { readTravelerName, writeTravelerName } from '../travelerProfile'

describe('travelerProfile', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('reads and writes the traveler name', () => {
    writeTravelerName('Livia')
    expect(readTravelerName()).toBe('Livia')
  })

  it('falls back to Traveler when no name is stored', () => {
    expect(readTravelerName()).toBe('Traveler')
  })
})
