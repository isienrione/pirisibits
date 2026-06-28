import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ROME_CORE_TOUR } from '../../../data/rome-core-tour'
import { OfflineDownloadPanel } from '../OfflineDownloadPanel'

const offlineState = vi.hoisted(() => ({
  isDownloaded: false,
  isDownloading: false,
  progress: null,
  error: null,
  lastUpdatedLabel: null,
  estimate: { bytes: 95_000_000, assetCount: 42, stopCount: 7 },
  startDownload: vi.fn(),
  removeDownload: vi.fn(),
}))

vi.mock('../../../hooks/useOfflineDownload', () => ({
  useOfflineDownload: () => offlineState,
}))

describe('OfflineDownloadPanel', () => {
  beforeEach(() => {
    offlineState.isDownloaded = false
    offlineState.isDownloading = false
    offlineState.progress = null
    offlineState.error = null
    offlineState.lastUpdatedLabel = null
    offlineState.startDownload.mockClear()
    offlineState.removeDownload.mockClear()
  })

  it('shows estimated size and download action', () => {
    render(<OfflineDownloadPanel tour={ROME_CORE_TOUR} />)

    expect(screen.getByRole('heading', { name: /download for offline use/i })).toBeInTheDocument()
    expect(screen.getByText(/estimated size/i)).toBeInTheDocument()
    expect(screen.getByText(/91 MB|90 MB|95 MB/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download tour/i })).toBeInTheDocument()
    expect(screen.getByText(/detailed live maps/i)).toBeInTheDocument()
  })

  it('shows progress while downloading', () => {
    offlineState.isDownloading = true
    offlineState.progress = { percent: 42, label: 'colosseum' }

    render(<OfflineDownloadPanel tour={ROME_CORE_TOUR} />)

    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /downloading/i })).toBeDisabled()
  })

  it('shows downloaded status and delete option', () => {
    offlineState.isDownloaded = true
    offlineState.lastUpdatedLabel = 'Jun 28, 2026, 10:15 AM'

    render(<OfflineDownloadPanel tour={ROME_CORE_TOUR} />)

    expect(screen.getByText('Downloaded')).toBeInTheDocument()
    expect(screen.getByText(/last updated/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete download/i })).toBeInTheDocument()
  })

  it('starts a download from the primary button', () => {
    render(<OfflineDownloadPanel tour={ROME_CORE_TOUR} />)

    fireEvent.click(screen.getByRole('button', { name: /download tour/i }))

    expect(offlineState.startDownload).toHaveBeenCalledTimes(1)
  })
})
