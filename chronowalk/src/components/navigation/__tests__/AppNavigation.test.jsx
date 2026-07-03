import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AppNavigation from '../AppNavigation'
import { NAV_TABS } from '../navConfig'

describe('AppNavigation', () => {
  it('renders all navigation tabs', () => {
    render(<AppNavigation activeTab={NAV_TABS.MAP} onChange={vi.fn()} />)

    expect(screen.getAllByRole('navigation', { name: /main navigation/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /^journey$/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /^map$/i })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /^journal$/i })).toHaveLength(2)
  })

  it('marks the active tab and switches on click', () => {
    const onChange = vi.fn()
    render(<AppNavigation activeTab={NAV_TABS.JOURNEY} onChange={onChange} />)

    const mapButtons = screen.getAllByRole('button', { name: /map/i })
    fireEvent.click(mapButtons[0])

    expect(onChange).toHaveBeenCalledWith(NAV_TABS.MAP)
  })
})
