import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { grantTestAccess } from '../../../test/grantTestAccess.js'
import { BeginPage } from '../BeginPage.jsx'
import { clearLocalAccessState } from '../../../lib/accessSession.js'
import { clearGuestSession, startNativeGuestExploration } from '../../../lib/guestSession.js'

const capacitor = vi.hoisted(() => ({
  platform: 'web',
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => capacitor.platform,
    isNativePlatform: () => capacitor.platform !== 'web',
  },
}))

vi.mock('../../../redesign/RedesignBeginFlow.jsx', () => ({
  default: () => <div>EXISTING CONTEXT BEGIN</div>,
}))

function renderBegin() {
  return render(
    <MemoryRouter initialEntries={['/begin']}>
      <Routes>
        <Route path="/begin" element={<BeginPage />} />
        <Route path="/" element={<div>MARKETING LANDING</div>} />
        <Route path="/welcome" element={<div>WELCOME</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BeginPage guest vs web access', () => {
  beforeEach(() => {
    capacitor.platform = 'web'
    localStorage.clear()
    clearLocalAccessState()
    clearGuestSession()
  })

  it('keeps web /begin behind paid access (marketing /)', () => {
    renderBegin()
    expect(screen.getByText('MARKETING LANDING')).toBeInTheDocument()
  })

  it('lets a native guest enter existing Context/begin without paid entitlement', () => {
    capacitor.platform = 'ios'
    startNativeGuestExploration()
    renderBegin()
    expect(screen.getByText('EXISTING CONTEXT BEGIN')).toBeInTheDocument()
  })

  it('lets an entitled traveler enter begin', () => {
    grantTestAccess()
    renderBegin()
    expect(screen.getByText('EXISTING CONTEXT BEGIN')).toBeInTheDocument()
  })
})
