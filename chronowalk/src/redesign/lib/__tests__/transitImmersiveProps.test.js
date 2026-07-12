import { describe, expect, it } from 'vitest'
import { loadRomeManifest, resolveJourneyStep } from '../../../content/manifest.js'
import { buildEffectiveSequence } from '../../../content/optionalPromotion.js'
import { buildTransitImmersiveProps } from '../transitImmersiveProps.js'

describe('buildTransitImmersiveProps', () => {
  it('builds props for every transit leg in the classic path', () => {
    const manifest = loadRomeManifest()
    const sequence = buildEffectiveSequence(manifest, 'a', [])

    for (const stepId of sequence) {
      if (!stepId.startsWith('t')) continue
      const index = sequence.indexOf(stepId)
      const step = resolveJourneyStep(manifest, 'a', index, [])
      expect(step.type).toBe('transit')

      const props = buildTransitImmersiveProps({
        step,
        manifest,
        context: { path: 'a' },
        journeyProgressPct: 40,
        audio: {
          narrationPlaying: false,
          progress: { currentTime: 0, duration: 120, paused: false },
          playbackRate: 1,
        },
        handlers: { onContinue: () => {} },
      })

      expect(props.title).toBeTruthy()
      expect(props.note).toBeTruthy()
      expect(typeof props.transcript).toBe('string')
      expect(props.onContinue).toBeTypeOf('function')
    }
  })
})
