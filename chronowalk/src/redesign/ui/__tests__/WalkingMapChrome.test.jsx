import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import WalkingMapChrome from '../WalkingMapChrome.jsx'

describe('WalkingMapChrome', () => {
  it('renders north compass and styled recenter control', () => {
    const onRecenter = vi.fn()

    render(<WalkingMapChrome bearing={30} onRecenter={onRecenter} />)

    expect(screen.getByTestId('walking-map-chrome')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /north/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /recenter map on your route/i }))
    expect(onRecenter).toHaveBeenCalledTimes(1)
  })

  it('hides when not visible', () => {
    const { container } = render(<WalkingMapChrome visible={false} onRecenter={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
