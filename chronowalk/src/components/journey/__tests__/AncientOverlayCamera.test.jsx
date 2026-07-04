import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AncientOverlayCamera from '../AncientOverlayCamera'

const mockStream = {
  getTracks: () => [{ stop: vi.fn() }],
}

vi.mock('../../../hooks/useCameraStream', () => ({
  useCameraStream: () => ({
    stream: mockStream,
    status: 'ready',
    error: null,
  }),
}))

vi.mock('../../../utils/overlayCapture', () => ({
  captureOverlayFrame: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
  downloadCapture: vi.fn(),
}))

describe('AncientOverlayCamera', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the live overlay with opacity control and capture button', () => {
    render(
      <AncientOverlayCamera
        stopTitle="Colosseum"
        stopId="colosseum"
        overlayUrl="/ancient.jpg"
        onContinue={vi.fn()}
      />
    )

    expect(screen.getByTestId('ancient-overlay-camera')).toBeInTheDocument()
    expect(screen.getByLabelText(/live view of colosseum/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ancient overlay opacity/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /capture overlay/i })).toBeInTheDocument()
  })

  it('updates overlay opacity from the slider', () => {
    render(
      <AncientOverlayCamera
        stopTitle="Colosseum"
        stopId="colosseum"
        overlayUrl="/ancient.jpg"
        onContinue={vi.fn()}
      />
    )

    const slider = screen.getByLabelText(/ancient overlay opacity/i)
    fireEvent.change(slider, { target: { value: '80' } })

    expect(slider).toHaveValue('80')
  })

  it('captures a blended frame', async () => {
    const { captureOverlayFrame, downloadCapture } = await import('../../../utils/overlayCapture')

    render(
      <AncientOverlayCamera
        stopTitle="Colosseum"
        stopId="colosseum"
        overlayUrl="/ancient.jpg"
        onContinue={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /capture overlay/i }))

    await vi.waitFor(() => {
      expect(captureOverlayFrame).toHaveBeenCalled()
      expect(downloadCapture).toHaveBeenCalled()
    })
  })
})
