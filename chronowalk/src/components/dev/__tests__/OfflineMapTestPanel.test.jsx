import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OfflineMapTestPanel from '../OfflineMapTestPanel.jsx'
import {
  formatOfflineMapProgress,
  formatOfflineMapResourceCount,
  shouldRenderOfflineMapTestPanel,
} from '../../../platform/offlineMaps/offlineMapTestHarness.js'

vi.mock('../../../platform/offlineMaps/index.js', () => ({
  isSupported: vi.fn(async () => ({ supported: true, platform: 'ios' })),
  getRegionStatus: vi.fn(async () => ({
    cityId: 'rome',
    supported: true,
    status: 'not_downloaded',
    progress: null,
    completedResourceCount: null,
    requiredResourceCount: null,
  })),
  downloadRegion: vi.fn(async () => ({
    cityId: 'rome',
    supported: true,
    status: 'downloaded',
    progress: 1,
    completedResourceCount: 12,
    requiredResourceCount: 12,
  })),
  deleteRegion: vi.fn(async () => ({
    cityId: 'rome',
    supported: true,
    status: 'not_downloaded',
    progress: null,
    completedResourceCount: null,
    requiredResourceCount: null,
  })),
  openTestMap: vi.fn(async () => ({
    opened: true,
    cityId: 'rome',
    supported: true,
    renderer: 'mapbox-maps-ios',
  })),
  subscribeOfflineMapProgress: vi.fn(() => () => {}),
  OFFLINE_MAP_STATUS: {
    NOT_DOWNLOADED: 'not_downloaded',
    DOWNLOADING: 'downloading',
    DOWNLOADED: 'downloaded',
    FAILED: 'failed',
  },
  ROME_OFFLINE_MAP_CONFIG: { cityId: 'rome' },
}))

import {
  deleteRegion,
  downloadRegion,
  getRegionStatus,
  isSupported,
  openTestMap,
} from '../../../platform/offlineMaps/index.js'

describe('OfflineMapTestPanel gate', () => {
  it('is hidden in production', () => {
    expect(shouldRenderOfflineMapTestPanel({ DEV: false })).toBe(false)
    expect(shouldRenderOfflineMapTestPanel({ DEV: true })).toBe(true)
  })

  it('formats progress and resource counts', () => {
    expect(formatOfflineMapProgress(0.42)).toBe('42%')
    expect(formatOfflineMapProgress(null)).toBe('—')
    expect(formatOfflineMapResourceCount(7)).toBe('7')
    expect(formatOfflineMapResourceCount(null)).toBe('—')
  })
})

describe('OfflineMapTestPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders diagnostic fields and invokes download / open / delete', async () => {
    getRegionStatus.mockResolvedValueOnce({
      cityId: 'rome',
      supported: true,
      status: 'not_downloaded',
      progress: null,
      completedResourceCount: null,
      requiredResourceCount: null,
    })
    isSupported.mockResolvedValue({ supported: true, platform: 'ios' })

    render(<OfflineMapTestPanel />)

    expect(screen.getByTestId('offline-map-test-panel')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('offline-map-test-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('offline-map-supported')).toHaveTextContent(/yes/)
    })

    expect(screen.getByTestId('offline-map-region')).toHaveTextContent('rome')
    expect(screen.getByTestId('offline-map-status')).toHaveTextContent('not_downloaded')

    fireEvent.click(screen.getByTestId('offline-map-check-status'))
    await waitFor(() => {
      expect(getRegionStatus).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByTestId('offline-map-download'))
    await waitFor(() => {
      expect(downloadRegion).toHaveBeenCalledWith({ cityId: 'rome' })
    })
    await waitFor(() => {
      expect(screen.getByTestId('offline-map-status')).toHaveTextContent('downloaded')
    })

    fireEvent.click(screen.getByTestId('offline-map-open'))
    await waitFor(() => {
      expect(openTestMap).toHaveBeenCalledWith({ cityId: 'rome' })
    })
    await waitFor(() => {
      expect(screen.getByTestId('offline-map-open-result')).toHaveTextContent(/opened/)
    })

    fireEvent.click(screen.getByTestId('offline-map-delete'))
    await waitFor(() => {
      expect(deleteRegion).toHaveBeenCalledWith({ cityId: 'rome' })
    })
  })

  it('shows unsupported status path on web-like support result', async () => {
    isSupported.mockResolvedValue({ supported: false, platform: 'web' })
    getRegionStatus.mockResolvedValue({
      cityId: 'rome',
      supported: false,
      status: 'not_downloaded',
      progress: null,
      completedResourceCount: null,
      requiredResourceCount: null,
      errorCode: 'unsupported_platform',
    })

    render(<OfflineMapTestPanel />)
    fireEvent.click(screen.getByTestId('offline-map-test-toggle'))

    await waitFor(() => {
      expect(screen.getByTestId('offline-map-supported')).toHaveTextContent(/no \(web\)/)
    })
  })
})
