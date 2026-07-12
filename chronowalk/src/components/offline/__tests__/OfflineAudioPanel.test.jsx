import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OfflineAudioPanel from '../OfflineAudioPanel.jsx'

vi.mock('../../../hooks/useOfflineAudio.js', () => ({
  useOfflineAudio: () => ({
    estimate: { fileCount: 74, bytes: 55_500_000 },
    estimateLabel: '53 MB',
    isReady: false,
    isDownloading: false,
    progress: null,
    error: null,
    status: { status: 'none' },
    startDownload: vi.fn(),
    removeDownload: vi.fn(),
  }),
}))

describe('OfflineAudioPanel', () => {
  it('renders download controls for Rome audio', () => {
    render(
      <MemoryRouter>
        <OfflineAudioPanel />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /download rome for offline/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download for offline/i })).toBeInTheDocument()
    expect(screen.getByText('74')).toBeInTheDocument()
  })
})
