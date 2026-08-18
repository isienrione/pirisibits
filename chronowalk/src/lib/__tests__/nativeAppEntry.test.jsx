import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { grantTestAccess } from '../../test/grantTestAccess.js'
import { RequireAccess } from '../requireAccess.jsx'
import { clearLocalAccessState } from '../accessSession.js'
import {
  NativePublicLandingRoute,
  getNativeRootRedirect,
  shouldSkipNativeA2hs,
} from '../nativeAppEntry.jsx'

const capacitor = vi.hoisted(() => ({
  platform: 'web',
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => capacitor.platform,
    isNativePlatform: () => capacitor.platform !== 'web',
  },
}))

function renderNativeEntry(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/"
          element={
            <NativePublicLandingRoute>
              <div>MARKETING LANDING</div>
            </NativePublicLandingRoute>
          }
        />
        <Route path="/home" element={<div>HOME</div>} />
        <Route path="/access" element={<div>ACCESS</div>} />
        <Route
          path="/journey"
          element={
            <RequireAccess>
              <div>JOURNEY</div>
            </RequireAccess>
          }
        />
        <Route
          path="/map"
          element={
            <RequireAccess>
              <div>MAP</div>
            </RequireAccess>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('native iOS product entry', () => {
  beforeEach(() => {
    capacitor.platform = 'web'
    localStorage.clear()
    clearLocalAccessState()
  })

  it('leaves web "/" on the marketing landing', () => {
    expect(getNativeRootRedirect()).toBeNull()
    renderNativeEntry('/')
    expect(screen.getByText('MARKETING LANDING')).toBeInTheDocument()
    expect(screen.queryByText('HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('ACCESS')).not.toBeInTheDocument()
  })

  it('sends native iOS "/" with a valid entitlement to /home without painting marketing', () => {
    capacitor.platform = 'ios'
    grantTestAccess()

    expect(getNativeRootRedirect()).toBe('/home')
    renderNativeEntry('/')

    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('sends native iOS "/" without entitlement to /access without painting marketing', () => {
    capacitor.platform = 'ios'

    expect(getNativeRootRedirect()).toBe('/access')
    renderNativeEntry('/')

    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
    expect(screen.getByText('ACCESS')).toBeInTheDocument()
  })

  it('does not replace native internal routes; RequireAccess still gates /journey', async () => {
    capacitor.platform = 'ios'

    renderNativeEntry('/journey')

    await waitFor(() => {
      expect(screen.getByText('ACCESS')).toBeInTheDocument()
    })
    expect(screen.queryByText('JOURNEY')).not.toBeInTheDocument()
    expect(screen.queryByText('HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
  })

  it('lets an entitled native session stay on /map instead of forcing /home', async () => {
    capacitor.platform = 'ios'
    grantTestAccess()

    renderNativeEntry('/map')

    await waitFor(() => {
      expect(screen.getByText('MAP')).toBeInTheDocument()
    })
    expect(screen.queryByText('HOME')).not.toBeInTheDocument()
    expect(screen.queryByText('MARKETING LANDING')).not.toBeInTheDocument()
  })

  it('skips A2HS only on native iOS', () => {
    capacitor.platform = 'web'
    expect(shouldSkipNativeA2hs()).toBe(false)

    capacitor.platform = 'ios'
    expect(shouldSkipNativeA2hs()).toBe(true)
  })
})
