import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PwaUpdatePromptView } from '../PwaUpdatePrompt'

describe('PwaUpdatePromptView', () => {
  it('renders nothing when no update is available', () => {
    const { container } = render(
      <PwaUpdatePromptView visible={false} onUpdate={vi.fn()} onDismiss={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('prompts the user to refresh when an update is available', () => {
    render(<PwaUpdatePromptView visible onUpdate={vi.fn()} onDismiss={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent(/update available/i)
    expect(screen.getByRole('button', { name: /^update$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /later/i })).toBeInTheDocument()
  })

  it('calls onUpdate when the user confirms', () => {
    const onUpdate = vi.fn()
    render(<PwaUpdatePromptView visible onUpdate={onUpdate} onDismiss={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /^update$/i }))

    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when the user chooses later', () => {
    const onDismiss = vi.fn()
    render(<PwaUpdatePromptView visible onUpdate={vi.fn()} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: /later/i }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
