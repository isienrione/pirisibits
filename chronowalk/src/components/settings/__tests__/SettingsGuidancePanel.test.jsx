import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsGuidancePanel from '../SettingsGuidancePanel.jsx'

vi.mock('../../../hooks/useGeoLocation.js', () => ({
  LOCATION_STATUS: {
    WAITING: 'waiting',
    GRANTED: 'granted',
    DENIED: 'denied',
    UNAVAILABLE: 'unavailable',
  },
  useGeoLocation: () => ({
    locationStatus: 'granted',
    distance: 240,
    retryLocation: vi.fn(),
  }),
}))

vi.mock('../../../hooks/useReducedMotion.js', () => ({
  useReducedMotion: () => false,
}))

vi.mock('../../../config/env.js', () => ({
  isDebugGeo: () => false,
}))

describe('SettingsGuidancePanel', () => {
  it('renders location and reduced motion rows', () => {
    render(<SettingsGuidancePanel />)

    expect(screen.getByText('Guidance')).toBeInTheDocument()
    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Reduced motion')).toBeInTheDocument()
    expect(screen.getByText('240 m tracked')).toBeInTheDocument()
    expect(screen.getByText('Off')).toBeInTheDocument()
  })
})
