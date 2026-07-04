import { describe, expect, it } from 'vitest'
import { loadRomeTourManifest } from '../romeTourManifest'
import { buildRomePassport, getStampInscriptionForStop } from '../launchRomePassport'

describe('launchRomePassport', () => {
  const manifest = loadRomeTourManifest()

  it('builds passport stamps for visited monuments in route order', () => {
    const passport = buildRomePassport({
      travelerName: 'Livia',
      manifest,
      context: {
        completedStopIds: ['colosseum'],
        currentStopId: 'pantheon',
      },
    })

    expect(passport.title).toBe('Rome Passport')
    expect(passport.holderName).toBe('Livia')
    expect(passport.stamps.map((stamp) => stamp.id)).toEqual(['colosseum', 'pantheon'])
    expect(passport.stamps[0].inscription).toMatch(/Arena/i)
  })

  it('returns an empty stamp collection when nothing has been visited', () => {
    const passport = buildRomePassport({
      travelerName: 'Marco',
      manifest,
      context: {
        completedStopIds: [],
        currentStopId: null,
      },
    })

    expect(passport.stamps).toEqual([])
  })

  it('avoids gamification language in passport copy', () => {
    const passport = buildRomePassport({
      travelerName: 'Livia',
      manifest,
      context: {
        completedStopIds: ['colosseum', 'pantheon'],
        currentStopId: 'piazza-navona',
      },
    })

    const copy = [passport.subtitle, ...passport.stamps.map((stamp) => stamp.inscription)].join(' ')
    expect(copy).not.toMatch(/xp|level|progress|percent|score/i)
  })

  it('provides stamp inscriptions for known monuments', () => {
    expect(getStampInscriptionForStop({ id: 'pantheon' })).toBe('Dome of Light')
    expect(getStampInscriptionForStop({ id: 'unknown-stop' })).toBe('Monument of Rome')
  })
})
