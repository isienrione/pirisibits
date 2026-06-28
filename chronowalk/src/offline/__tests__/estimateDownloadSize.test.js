import { describe, expect, it } from 'vitest'
import { ROME_CORE_TOUR } from '../../data/rome-core-tour'
import {
  estimateTourDownloadSize,
  formatDownloadSize,
} from '../estimateDownloadSize'

describe('estimateDownloadSize', () => {
  it('formats byte sizes for display', () => {
    expect(formatDownloadSize(512)).toBe('512 B')
    expect(formatDownloadSize(2048)).toBe('2.0 KB')
    expect(formatDownloadSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('estimates a non-zero package size for the Rome core tour', () => {
    const estimate = estimateTourDownloadSize(ROME_CORE_TOUR)

    expect(estimate.stopCount).toBe(ROME_CORE_TOUR.stopIds.length)
    expect(estimate.assetCount).toBeGreaterThan(10)
    expect(estimate.bytes).toBeGreaterThan(1_000_000)
  })
})
