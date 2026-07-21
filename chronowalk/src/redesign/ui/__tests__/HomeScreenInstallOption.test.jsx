import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import HomeScreenInstallOption, { CHRONOWALK_HOME_ICON } from '../HomeScreenInstallOption.jsx'

describe('HomeScreenInstallOption', () => {
  it('shows iPhone Safari Share-first how-to with the real ChronoWalk logo', () => {
    render(<HomeScreenInstallOption showIosInstructions />)

    fireEvent.click(screen.getByRole('button', { name: /use as a mobile app/i }))
    expect(screen.getByTestId('a2hs-capsule')).toHaveClass('cw-a2hs-capsule--open')
    expect(screen.getByTestId('a2hs-howto-demo-ios')).toBeInTheDocument()
    expect(screen.getByText(/iphone — use safari only/i)).toBeInTheDocument()
    expect(
      screen.getByText((_, el) => el?.tagName === 'LI' && /Share/.test(el.textContent || '')),
    ).toBeInTheDocument()
    expect(screen.getByTestId('a2hs-ios-chrome-warning')).toHaveTextContent(/chrome on iphone cannot/i)

    const logos = document.querySelectorAll(`img[src="${CHRONOWALK_HOME_ICON}"]`)
    expect(logos.length).toBeGreaterThan(0)
  })

  it('shows Android Chrome how-to and can trigger native install', () => {
    const onInstall = vi.fn()
    render(
      <HomeScreenInstallOption canPromptInstall onInstall={onInstall} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /use as a mobile app/i }))
    fireEvent.click(screen.getByRole('tab', { name: /android · chrome/i }))

    expect(screen.getByTestId('a2hs-howto-demo-android')).toBeInTheDocument()
    expect(screen.getByText(/android — chrome \(samsung/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^add to home screen$/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^add to home screen$/i }))
    expect(onInstall).toHaveBeenCalled()
  })
})
