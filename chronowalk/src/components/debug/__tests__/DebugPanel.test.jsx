import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

describe('debug panel gate + event log', () => {
  beforeEach(async () => {
    vi.resetModules()
    const { __resetDebugPanelGateForTests } = await import('../debugPanelGate.js')
    const { __resetDebugEventLogForTests } = await import('../../../lib/debugEventLog.js')
    __resetDebugPanelGateForTests()
    __resetDebugEventLogForTests()
  })

  it('opens from ?debug=1 and from 5 rapid logo taps', async () => {
    const {
      urlRequestsDebugPanel,
      syncDebugPanelFromUrl,
      isDebugPanelOpen,
      noteDebugLogoTap,
      closeDebugPanel,
      __resetDebugPanelGateForTests,
    } = await import('../debugPanelGate.js')

    expect(urlRequestsDebugPanel('?debug=1')).toBe(true)
    expect(urlRequestsDebugPanel('?debug=true')).toBe(true)
    expect(urlRequestsDebugPanel('')).toBe(false)

    window.history.replaceState({}, '', '/?debug=1')
    syncDebugPanelFromUrl()
    expect(isDebugPanelOpen()).toBe(true)
    closeDebugPanel()
    __resetDebugPanelGateForTests()

    for (let i = 0; i < 4; i += 1) noteDebugLogoTap()
    expect(isDebugPanelOpen()).toBe(false)
    noteDebugLogoTap()
    expect(isDebugPanelOpen()).toBe(true)
  })

  it('keeps a ring buffer of the last 20 events', async () => {
    const { recordDebugEvent, getRecentDebugEvents } = await import(
      '../../../lib/debugEventLog.js'
    )
    for (let i = 0; i < 25; i += 1) {
      recordDebugEvent(`evt_${i}`, { tier: 'rome-complete', noise: 'drop-me' })
    }
    const events = getRecentDebugEvents()
    expect(events).toHaveLength(20)
    expect(events[0].name).toBe('evt_5')
    expect(events[19].name).toBe('evt_24')
    expect(events[0].props).toEqual({ tier: 'rome-complete' })
    expect(events[0].props.noise).toBeUndefined()
  })
})

describe('DebugPanel UI', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('../../../lib/analytics.ts', async () => {
      const actual = await vi.importActual('../../../lib/analytics.ts')
      return {
        ...actual,
        getPostHogCheckoutIdentity: () => ({
          ph_distinct_id: 'ph_test_user',
          ph_session_id: 'ph_test_session',
        }),
        getEngagementDebugSnapshot: () => ({
          scroll_depth_pct: 42,
          max_scroll_pct: 42,
          seconds_on_page: 12,
          engaged_seconds: 10,
          deepest_funnel_step: 'landing',
          analytics_ready: true,
        }),
        isProductAnalyticsReady: () => true,
      }
    })
    vi.doMock('../../../lib/track.js', () => ({
      isAnalyticsReady: () => true,
    }))
    vi.doMock('../../../lib/config.js', () => ({
      getAbVariantCents: () => 1499,
    }))
    vi.doMock('../../../lib/attribution.ts', () => ({
      getAttribution: () => ({ utm_source: 'reddit', gclid: null }),
    }))
    vi.doMock('../../../lib/paddle.js', () => ({
      getPaddleLoadStatus: () => 'loaded',
    }))

    const { __resetDebugPanelGateForTests, openDebugPanel } = await import('../debugPanelGate.js')
    const { __resetDebugEventLogForTests, recordDebugEvent } = await import(
      '../../../lib/debugEventLog.js'
    )
    const { __resetMapboxInitStatusForTests, setMapboxInitStatus } = await import(
      '../../../lib/mapboxStatus.js'
    )
    __resetDebugPanelGateForTests()
    __resetDebugEventLogForTests()
    __resetMapboxInitStatusForTests()
    setMapboxInitStatus('ready')
    recordDebugEvent('pricing_view', { tier: 'rome-complete' })
    openDebugPanel()

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async () => {}),
      },
    })
  })

  afterEach(async () => {
    const { closeDebugPanel } = await import('../debugPanelGate.js')
    closeDebugPanel()
    vi.doUnmock('../../../lib/analytics.ts')
    vi.doUnmock('../../../lib/track.js')
    vi.doUnmock('../../../lib/config.js')
    vi.doUnmock('../../../lib/attribution.ts')
    vi.doUnmock('../../../lib/paddle.js')
  })

  it('renders live diagnostics and copies JSON to the clipboard', async () => {
    const { default: DebugPanel } = await import('../DebugPanel.jsx')
    render(<DebugPanel />)

    await waitFor(() => {
      expect(screen.getByTestId('cw-debug-panel')).toBeTruthy()
      expect(screen.getByText(/distinct_id: ph_test_user/)).toBeTruthy()
      expect(screen.getByText(/ab_variant: 1499/)).toBeTruthy()
      expect(screen.getByText(/paddle: loaded/)).toBeTruthy()
      expect(screen.getByText(/mapbox: ready/)).toBeTruthy()
      expect(screen.getByText(/pricing_view/)).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: /Copy diagnostics/i }))
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      const dumped = JSON.parse(navigator.clipboard.writeText.mock.calls[0][0])
      expect(dumped.posthog.distinct_id).toBe('ph_test_user')
      expect(dumped.paddle).toBe('loaded')
      expect(dumped.recent_events[0].name).toBe('pricing_view')
    })
  })
})

describe('INCLUDE_DEBUG_PANEL gate', () => {
  it('defaults to shipping the panel', async () => {
    const { INCLUDE_DEBUG_PANEL } = await import('../includeDebugPanel.js')
    expect(INCLUDE_DEBUG_PANEL).toBe(true)
  })
})
