import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Button } from '../Button'

describe('Button touch activation', () => {
  it('fires once on touch pointerup and ignores the follow-up click', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Start free preview</Button>)
    const button = screen.getByRole('button', { name: /start free preview/i })

    fireEvent.pointerDown(button, { pointerType: 'touch', pointerId: 1, button: 0 })
    fireEvent.pointerUp(button, { pointerType: 'touch', pointerId: 1, button: 0 })
    fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('fires on mouse click', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Browse tours</Button>)
    const button = screen.getByRole('button', { name: /browse tours/i })

    fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
