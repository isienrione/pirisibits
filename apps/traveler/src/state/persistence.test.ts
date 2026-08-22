import { describe, expect, it } from 'vitest'
import { createInitialState } from './reducer'
import { createMemoryStore } from './store'
import { deserializeSession, loadSession, saveSession, serializeSession } from './persistence'

describe('session persistence', () => {
  it('round-trips an active route and lands on resume', async () => {
    const store = createMemoryStore()
    const state = createInitialState()
    state.route = { id: 'demo-rome-120' } as never
    state.cursor = 3
    state.screen = 'C01'
    await saveSession(store, state)
    const restored = await loadSession(store)
    expect(restored?.cursor).toBe(3)
    expect(restored?.screen).toBe('C07')
  })

  it('migrates unknown schema without crashing', () => {
    const restored = deserializeSession(JSON.stringify({ schema: 0, route: { id: 'x' } }))
    expect(restored?.screen).toBe('C07')
  })

  it('serialize marks demoOnly', () => {
    expect(serializeSession(createInitialState()).demoOnly).toBe(true)
  })
})
