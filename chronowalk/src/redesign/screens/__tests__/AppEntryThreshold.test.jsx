import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AppEntryThreshold from '../AppEntryThreshold.jsx'

describe('AppEntryThreshold', () => {
  it('makes the crossing into the app explicit', () => {
    render(
      <AppEntryThreshold
        packTitle="Roma Antica"
        packBlurb="Colosseum, Forum, hills, and Circus Maximus."
        canPromptInstall
        onInstall={vi.fn()}
        onContinue={vi.fn()}
      />,
    )

    expect(screen.getByTestId('app-entry-threshold')).toBeInTheDocument()
    expect(screen.getByText(/you.re in the app now/i)).toBeInTheDocument()
    expect(screen.getByText(/roma antica/i)).toBeInTheDocument()
    expect(screen.getByText(/is unlocked/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add chronowalk to home screen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue in browser/i })).toBeInTheDocument()
  })

  it('continues into the app from the secondary CTA', () => {
    const onContinue = vi.fn()
    render(
      <AppEntryThreshold
        packTitle="Roma Eterna"
        canPromptInstall
        onContinue={onContinue}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /continue in browser/i }))
    expect(onContinue).toHaveBeenCalled()
  })
})
