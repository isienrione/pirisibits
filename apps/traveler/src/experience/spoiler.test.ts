import { describe, expect, it } from 'vitest'
import fixture from '../demo/generated/mobileFixture.json'
import { collectPreRevealText, leaksIdentity, visibleMysteryTitle } from './spoiler'

const data = fixture as {
  mysteryTrueTitle: string
  mysterySpoilerSafeTitle: string
  mysteryHint: string
  routes: Record<string, { items: Array<{
    title: string
    spoilerSafeTitle: string
    lookCue: string | null
    approachLine: string | null
    mystery: { isMystery: boolean; hint: string | null }
  }> }>
}

describe('mystery spoiler', () => {
  it('does not leak identity before reveal', () => {
    const mystery = data.routes['120'].items.find((item) => item.mystery.isMystery)
    expect(mystery).toBeTruthy()
    const text = collectPreRevealText(mystery as never)
    expect(leaksIdentity(text, data.mysteryTrueTitle)).toBe(false)
    expect(visibleMysteryTitle(mystery!, false)).toBe(data.mysterySpoilerSafeTitle)
    expect(visibleMysteryTitle(mystery!, true)).toBe(mystery!.title)
    expect(leaksIdentity(data.mysteryHint, data.mysteryTrueTitle)).toBe(false)
  })
})
