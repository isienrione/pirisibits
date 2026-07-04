import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import StoryReflectionMoment from '../StoryReflectionMoment'

describe('StoryReflectionMoment', () => {
  it('renders a quiet reflection with large typography', () => {
    render(
      <StoryReflectionMoment
        sentence="For nearly two thousand years, this dome remained the largest on Earth."
        onContinue={vi.fn()}
      />
    )

    expect(screen.getByTestId('story-reflection-moment')).toBeInTheDocument()
    expect(screen.getByText(/Reflection/i)).toBeInTheDocument()
    expect(
      screen.getByText(/For nearly two thousand years, this dome remained the largest on Earth./i)
    ).toBeInTheDocument()
  })

  it('continues on button press', () => {
    const onContinue = vi.fn()

    render(
      <StoryReflectionMoment
        sentence="A quiet pause."
        onContinue={onContinue}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /^continue$/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
