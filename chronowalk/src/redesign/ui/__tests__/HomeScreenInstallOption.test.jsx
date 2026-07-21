import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import HomeScreenInstallOption from '../HomeScreenInstallOption.jsx'

describe('HomeScreenInstallOption', () => {
  it('opens the how-to capsule and can trigger native install', () => {
    const onInstall = vi.fn()
    render(
      <HomeScreenInstallOption canPromptInstall onInstall={onInstall} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /add icon to home screen/i }))
    expect(screen.getByTestId('a2hs-capsule')).toHaveClass('cw-a2hs-capsule--open')
    expect(screen.getByText(/one tap to install/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^add to home screen$/i }))
    expect(onInstall).toHaveBeenCalled()
  })
})
