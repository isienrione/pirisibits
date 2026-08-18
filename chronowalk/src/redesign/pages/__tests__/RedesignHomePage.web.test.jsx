import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../../i18n/I18nProvider.jsx'
import { SettingsSheetProvider } from '../../context/SettingsSheetContext.jsx'
import { FamilyWalkProvider } from '../../context/FamilyWalkContext.jsx'
import { SharedWalkGuardProvider } from '../../context/SharedWalkGuardContext.jsx'
import { ThresholdChromeProvider } from '../../../context/ThresholdChromeContext.jsx'
import RedesignHomePage from '../RedesignHomePage.jsx'
import { clearLocalAccessState } from '../../../lib/accessSession.js'
import { grantTestAccess } from '../../../test/grantTestAccess.js'

const capacitor = vi.hoisted(() => ({ platform: 'web' }))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => capacitor.platform,
    isNativePlatform: () => capacitor.platform !== 'web',
  },
}))

function renderHome() {
  return render(
    <I18nProvider>
      <ThresholdChromeProvider>
        <MemoryRouter>
          <SettingsSheetProvider>
            <FamilyWalkProvider>
              <SharedWalkGuardProvider>
                <RedesignHomePage />
              </SharedWalkGuardProvider>
            </FamilyWalkProvider>
          </SettingsSheetProvider>
        </MemoryRouter>
      </ThresholdChromeProvider>
    </I18nProvider>,
  )
}

describe('web Home remains the linear hub', () => {
  beforeEach(() => {
    capacitor.platform = 'web'
    localStorage.clear()
    clearLocalAccessState()
    grantTestAccess()
  })

  it('does not mount native Discover on web', () => {
    renderHome()
    expect(screen.queryByTestId('native-discover')).not.toBeInTheDocument()
  })
})
