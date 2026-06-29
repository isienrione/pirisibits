import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PwaInstallPanel } from '../PwaInstallPanel'

describe('PwaInstallPanel', () => {
  it('shows install button when native prompt is available', () => {
    const onInstall = vi.fn()
    render(
      <PwaInstallPanel
        installed={false}
        canPromptInstall
        showIosInstructions={false}
        showInstallOption
        onInstall={onInstall}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /add to home screen/i }))
    expect(onInstall).toHaveBeenCalledTimes(1)
  })

  it('shows iOS instructions when Safari cannot use the native prompt', () => {
    render(
      <PwaInstallPanel
        installed={false}
        canPromptInstall={false}
        showIosInstructions
        showInstallOption
        onInstall={vi.fn()}
      />
    )

    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add to home screen/i })).not.toBeInTheDocument()
  })

  it('shows installed state after the app is on the home screen', () => {
    render(
      <PwaInstallPanel
        installed
        canPromptInstall={false}
        showIosInstructions={false}
        showInstallOption={false}
        onInstall={vi.fn()}
      />
    )

    expect(screen.getByText('Installed')).toBeInTheDocument()
  })
})
