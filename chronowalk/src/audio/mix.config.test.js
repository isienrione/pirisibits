import { describe, expect, it } from 'vitest'
import { MIX_CONFIG } from './mix.config.js'
import { dbToGain } from './db.js'

describe('MIX_CONFIG bed ducking', () => {
  it('keeps idle bed audible for walking silence and ducks hard under voice', () => {
    expect(MIX_CONFIG.bed.idleDb).toBe(-24)
    expect(MIX_CONFIG.bed.duckedDb).toBe(-42)

    const idle = dbToGain(MIX_CONFIG.bed.idleDb)
    const ducked = dbToGain(MIX_CONFIG.bed.duckedDb)
    // ≈18 dB down → faint background, not competing with narration
    expect(ducked / idle).toBeLessThan(0.2)
    expect(MIX_CONFIG.bed.idleDb - MIX_CONFIG.bed.duckedDb).toBeGreaterThanOrEqual(15)
  })
})
