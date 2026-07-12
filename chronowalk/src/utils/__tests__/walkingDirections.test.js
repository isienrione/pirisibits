import { describe, expect, it } from 'vitest'
import {
  buildInstructionFromManeuver,
  cleanInstruction,
  humanizeWalkingSteps,
  isGenericInstruction,
  isGenericStreetName,
  normalizeWalkingSteps,
  pickBestWalkingDirections,
  scoreWalkingStepQuality,
} from '../walkingDirections'

describe('walkingDirections', () => {
  it('cleans html from instructions', () => {
    expect(cleanInstruction('Turn <b>left</b> onto Via dei Fori Imperiali')).toBe(
      'Turn left onto Via dei Fori Imperiali',
    )
  })

  it('merges short continue steps', () => {
    const steps = normalizeWalkingSteps([
      { instruction: 'Head north', distanceM: 12, durationSec: 10, type: 'depart' },
      { instruction: 'Continue', distanceM: 8, durationSec: 6, type: 'continue' },
      { instruction: 'Turn right', distanceM: 40, durationSec: 30, type: 'turn' },
      { instruction: 'Arrive', distanceM: 0, durationSec: 0, type: 'arrive' },
    ])

    expect(steps.length).toBeLessThanOrEqual(4)
    expect(steps[0].distanceM).toBe(20)
  })

  it('detects generic walkway labels', () => {
    expect(isGenericStreetName('the walkway')).toBe(true)
    expect(isGenericStreetName('Colosseo')).toBe(false)
    expect(isGenericInstruction('Turn right onto the walkway')).toBe(true)
  })

  it('builds named-street instructions from maneuver metadata', () => {
    expect(
      buildInstructionFromManeuver(
        { type: 'turn', modifier: 'right' },
        'Via di San Giovanni in Laterano',
      ),
    ).toBe('Turn right onto Via di San Giovanni in Laterano')
  })

  it('humanizes generic walkway steps toward the destination', () => {
    const steps = humanizeWalkingSteps(
      [
        {
          instruction: 'Turn right onto the walkway',
          distanceM: 41,
          type: 'turn',
          modifier: 'right',
        },
        {
          instruction: 'Walk south on the walkway',
          distanceM: 56,
          type: 'continue',
          modifier: 'south',
        },
      ],
      'Colosseum interior',
    )

    expect(steps[0].instruction).toContain('Colosseum interior')
    expect(steps[0].instruction).not.toContain('walkway')
  })

  it('prefers routes with named streets over generic walkway routes', () => {
    const generic = {
      steps: [
        { instruction: 'Turn right onto the walkway', distanceM: 40, type: 'turn' },
        { instruction: 'Turn right onto the walkway', distanceM: 50, type: 'turn' },
      ],
    }
    const named = {
      steps: [
        {
          instruction: 'Turn right onto Colosseo',
          streetName: 'Colosseo',
          distanceM: 140,
          type: 'turn',
        },
        {
          instruction: 'Continue on Via di San Giovanni in Laterano',
          streetName: 'Via di San Giovanni in Laterano',
          distanceM: 90,
          type: 'continue',
        },
      ],
    }

    expect(scoreWalkingStepQuality(named.steps)).toBeGreaterThan(
      scoreWalkingStepQuality(generic.steps),
    )
    expect(pickBestWalkingDirections([generic, named])).toBe(named)
  })
})
