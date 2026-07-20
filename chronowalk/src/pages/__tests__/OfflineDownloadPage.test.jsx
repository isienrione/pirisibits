import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OfflineDownloadPage from '../OfflineDownloadPage'
import { ROUTES } from '../../routes/paths'

const navigate = vi.fn()
const startDownload = vi.fn().mockResolvedValue(undefined)

let offlineState = {
  estimate: { bytes: 95 * 1024 * 1024, stopCount: 20, assetCount: 80 },
  isDownloaded: false,
  isDownloading: false,
  progress: null,
  startDownload,
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('../../hooks/useOfflineDownload', () => ({
  useOfflineDownload: () => offlineState,
}))

function renderOfflineDownload() {
  return render(
    <MemoryRouter initialEntries={['/begin/rome/download']}>
      <Routes>
        <Route path="/begin/:destinationId/download" element={<OfflineDownloadPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('OfflineDownloadPage', () => {
  beforeEach(() => {
    navigate.mockClear()
    startDownload.mockClear()
    offlineState = {
      estimate: { bytes: 95 * 1024 * 1024, stopCount: 20, assetCount: 80 },
      isDownloaded: false,
      isDownloading: false,
      progress: null,
      startDownload,
    }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders premium offline download copy without technical language', () => {
    renderOfflineDownload()

    expect(screen.getByRole('heading', { level: 1, name: /download your journey/i })).toBeInTheDocument()
    expect(screen.getByText(/journey size/i)).toBeInTheDocument()
    expect(screen.getByText(/95 MB/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /download journey/i })).toBeInTheDocument()
    expect(screen.queryByText(/assets/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/metadata/i)).not.toBeInTheDocument()
  })

  it('starts download when download journey is tapped', () => {
    renderOfflineDownload()
    fireEvent.click(screen.getByRole('button', { name: /download journey/i }))
    expect(startDownload).toHaveBeenCalled()
  })

  it('shows coffee-break progress while downloading', () => {
    offlineState.isDownloading = true
    offlineState.progress = { percent: 42 }

    renderOfflineDownload()

    expect(screen.getByText(/preparing your journey/i)).toBeInTheDocument()
    expect(screen.getByText(/perfect moment for a coffee/i)).toBeInTheDocument()
  })

  it('skips to journey when skip for now is tapped', () => {
    renderOfflineDownload()

    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(navigate).toHaveBeenCalledWith(ROUTES.journey, {
      replace: true,
      state: { destinationId: 'rome' },
    })
  })

  it('continues to journey after download completes', async () => {
    offlineState.isDownloaded = true

    renderOfflineDownload()

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(navigate).toHaveBeenCalledWith(ROUTES.journey, {
      replace: true,
      state: { destinationId: 'rome' },
    })
  })
})
