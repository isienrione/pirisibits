import { describe, expect, it } from 'vitest'
import { travelerReducer, createInitialState } from '../state/reducer'

describe('onboarding draft', () => {
  it('captures profile fields without parallel unmapped strings', () => {
    let state = createInitialState()
    state = travelerReducer(state, { type: 'patchOnboarding', patch: { interests: ['antiquity'] } })
    state = travelerReducer(state, { type: 'patchOnboarding', patch: { explorationStyle: 'linger' } })
    state = travelerReducer(state, { type: 'patchOnboarding', patch: { mobility: 'walking' } })
    state = travelerReducer(state, { type: 'patchOnboarding', patch: { timeBudgetMin: 120 } })
    expect(state.onboarding).toMatchObject({
      interests: ['antiquity'],
      explorationStyle: 'linger',
      mobility: 'walking',
      timeBudgetMin: 120,
    })
    expect(state.screen).toBe('A01')
  })
})

describe('experience runtime', () => {
  it('does not start narration on arrive', () => {
    let state = createInitialState()
    state = travelerReducer(state, { type: 'arrive', itemId: 'w01' })
    expect(state.experience.arrivedItemId).toBe('w01')
    expect(state.experience.narrationStarted).toBe(false)
    state = travelerReducer(state, { type: 'beginExperience' })
    expect(state.experience.narrationStarted).toBe(false)
    state = travelerReducer(state, { type: 'confirmArrival' })
    state = travelerReducer(state, { type: 'beginExperience' })
    expect(state.experience.narrationStarted).toBe(true)
  })
})
