import { describe, expect, it } from 'vitest'
import { buildWalkTogetherPresentationSeats } from '../walkTogetherPresentation.js'

describe('buildWalkTogetherPresentationSeats', () => {
  it('numbers the organizer as 1 even when the server row sorts last', () => {
    const seats = [
      { id: 'seat-member-a', role: 'member', status: 'claimed', label: 'Seat A' },
      { id: 'seat-member-b', role: 'member', status: 'open', label: 'Seat B' },
      { id: 'seat-member-c', role: 'member', status: 'open', label: 'Seat C' },
      { id: 'seat-owner', role: 'owner', status: 'claimed', label: 'Owner' },
    ]

    const presented = buildWalkTogetherPresentationSeats(seats)

    expect(presented.map((row) => [row.presentationNumber, row.displayName, row.seat.id])).toEqual([
      [1, 'You', 'seat-owner'],
      [2, 'Walker 2', 'seat-member-a'],
      [3, 'Walker 3', 'seat-member-b'],
      [4, 'Walker 4', 'seat-member-c'],
    ])
    expect(presented[0].isOrganizerSeat).toBe(true)
    expect(presented.slice(1).every((row) => !row.isOrganizerSeat)).toBe(true)
  })

  it('keeps Couple organizer as 1 and the member as Walker 2', () => {
    const presented = buildWalkTogetherPresentationSeats([
      { id: 'seat-member-2', role: 'member', status: 'open' },
      { id: 'seat-owner', role: 'owner', status: 'claimed' },
    ])

    expect(presented).toEqual([
      {
        seat: { id: 'seat-owner', role: 'owner', status: 'claimed' },
        presentationNumber: 1,
        isOrganizerSeat: true,
        displayName: 'You',
      },
      {
        seat: { id: 'seat-member-2', role: 'member', status: 'open' },
        presentationNumber: 2,
        isOrganizerSeat: false,
        displayName: 'Walker 2',
      },
    ])
  })

  it('preserves relative server order among non-organizer seats', () => {
    const presented = buildWalkTogetherPresentationSeats([
      { id: 'open-first', role: 'member', status: 'open' },
      { id: 'claimed-second', role: 'member', status: 'claimed' },
      { id: 'owner', role: 'owner', status: 'claimed' },
      { id: 'open-third', role: 'member', status: 'open' },
    ])

    expect(presented.map((row) => row.seat.id)).toEqual([
      'owner',
      'open-first',
      'claimed-second',
      'open-third',
    ])
  })

  it('returns an empty list for missing seats without inventing rows', () => {
    expect(buildWalkTogetherPresentationSeats(null)).toEqual([])
    expect(buildWalkTogetherPresentationSeats(undefined)).toEqual([])
    expect(buildWalkTogetherPresentationSeats([])).toEqual([])
  })
})
