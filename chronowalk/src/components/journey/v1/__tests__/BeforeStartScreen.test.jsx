import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BeforeStartScreen from '../BeforeStartScreen.jsx'

describe('BeforeStartScreen', () => {
  it('renders act choices and fires begin', () => {
    const onBegin = vi.fn()
    render(<BeforeStartScreen onBegin={onBegin} />)

    expect(screen.getByRole('heading', { name: /choose your first act/i })).toBeInTheDocument()
    expect(screen.getByText(/act I · The Arena/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^begin$/i }))
    expect(onBegin).toHaveBeenCalledWith('act1')
  })
})
