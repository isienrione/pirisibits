import { describe, expect, it, vi } from 'vitest'
import { drawCoverImage } from '../overlayCapture'

describe('overlayCapture', () => {
  it('draws an image with cover scaling', () => {
    const drawImage = vi.fn()
    const context = { drawImage }

    drawCoverImage(context, { width: 200, height: 100 }, 100, 100)

    expect(drawImage).toHaveBeenCalledWith(
      { width: 200, height: 100 },
      -50,
      0,
      200,
      100
    )
  })
})
