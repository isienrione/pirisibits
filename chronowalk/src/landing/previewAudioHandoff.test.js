import { describe, expect, it, beforeEach } from 'vitest'
import {
  consumePreviewAudioHandoff,
  consumePreviewPlaybackIntent,
  getActivePreviewSessionAudio,
  getPreviewSessionAudio,
  primePreviewAudioForNavigation,
  retainPreviewPlaybackIntent,
  stopPreviewSessionAudio,
} from './previewAudioHandoff.js'

describe('previewAudioHandoff', () => {
  beforeEach(() => {
    stopPreviewSessionAudio()
  })

  it('reuses one session audio element for the same preview', () => {
    const first = getPreviewSessionAudio('https://example.com/w17_ch1.mp3')
    const second = getPreviewSessionAudio('https://example.com/w17_ch1.mp3')

    expect(first).toBeInstanceOf(HTMLAudioElement)
    expect(second).toBe(first)
  })

  it('primes playback intent from a navigation click', () => {
    primePreviewAudioForNavigation('https://example.com/w17_ch1.mp3')

    expect(consumePreviewPlaybackIntent()).toBe(true)
    expect(consumePreviewPlaybackIntent()).toBe(false)
    expect(getActivePreviewSessionAudio()).toBeInstanceOf(HTMLAudioElement)
  })

  it('retains playback intent while audio is still playing', () => {
    primePreviewAudioForNavigation('https://example.com/w17_ch1.mp3')
    consumePreviewPlaybackIntent()

    const audio = getActivePreviewSessionAudio()
    Object.defineProperty(audio, 'paused', { configurable: true, value: false })

    retainPreviewPlaybackIntent()
    expect(consumePreviewPlaybackIntent()).toBe(true)
  })

  it('hands off the primed audio element once (legacy API)', () => {
    primePreviewAudioForNavigation('https://example.com/preview.mp3')
    const first = consumePreviewAudioHandoff()
    const second = consumePreviewAudioHandoff()

    expect(first).toBeInstanceOf(HTMLAudioElement)
    expect(first?.src).toContain('preview.mp3')
    expect(second).toBeNull()
  })

  it('clears the active session', () => {
    primePreviewAudioForNavigation('https://example.com/preview.mp3')
    stopPreviewSessionAudio()
    expect(getActivePreviewSessionAudio()).toBeNull()
    expect(consumePreviewAudioHandoff()).toBeNull()
  })
})
