import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import { clearAppEntryComplete } from '../../../lib/appEntry.js'
import { grantTestAccess } from '../../../test/grantTestAccess.js'
import { clearLocalAccessState } from '../../../lib/accessSession.js'
import RedesignSetupPage from '../RedesignSetupPage.jsx'

const capacitor = vi.hoisted(() => ({
  platform: 'web',
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => capacitor.platform,
    isNativePlatform: () => capacitor.platform !== 'web',
  },
}))

vi.mock('../../../hooks/useOfflineAudio.js', () => ({
  useOfflineAudio: () => ({
    isReady: false,
    isDownloading: false,
    progress: null,
    error: null,
    status: null,
    startDownload: vi.fn(),
  }),
}))

vi.mock('../../../hooks/usePwaInstall.js', () => ({
  usePwaInstall: () => ({
    installed: false,
    canPromptInstall: false,
    // Intentionally true even on native: skip must use Capacitor, not UA/PWA heuristics.
    showIosInstructions: true,
    promptInstall: vi.fn(),
  }),
}))

vi.mock('../../../lib/accessHandoff.js', () => ({
  syncAccessHandoff: vi.fn(),
}))

function renderSetup() {
  return render(
    <MemoryRouter initialEntries={['/setup']}>
      <I18nProvider>
        <RedesignSetupPage />
      </I18nProvider>
    </MemoryRouter>,
  )
}

describe('native iOS setup A2HS', () => {
  beforeEach(() => {
    capacitor.platform = 'web'
    localStorage.clear()
    clearAppEntryComplete()
    clearLocalAccessState()
  })

  it('still shows Add to Home Screen on web setup', () => {
    renderSetup()

    expect(screen.getByTestId('app-entry-prepare')).toBeInTheDocument()
    expect(screen.getByTestId('app-entry-a2hs')).toBeInTheDocument()
    expect(screen.getByText(/use as a mobile app/i)).toBeInTheDocument()
    expect(screen.getByTestId('app-entry-download')).toBeInTheDocument()
  })

  it('hides A2HS and Safari install instructions on native iOS setup', () => {
    capacitor.platform = 'ios'
    grantTestAccess()
    renderSetup()

    expect(screen.getByTestId('app-entry-prepare')).toBeInTheDocument()
    expect(screen.queryByTestId('app-entry-a2hs')).not.toBeInTheDocument()
    expect(screen.queryByText(/use as a mobile app/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/add chronowalk to your home screen/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('a2hs-howto-demo-ios')).not.toBeInTheDocument()
    expect(screen.getByTestId('app-entry-download')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })
})
