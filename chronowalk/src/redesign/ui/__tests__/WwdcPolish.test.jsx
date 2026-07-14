import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrimaryButton } from '../PrimaryButton.jsx'
import { SecondaryButton } from '../SecondaryButton.jsx'
import { GhostButton } from '../GhostButton.jsx'
import { IconButton } from '../IconButton.jsx'
import { TextButton } from '../TextButton.jsx'
import { BackLink } from '../BackLink.jsx'
import { ICON, R, SHELL_TAB_BAR_INSET, TAP, T } from '../../tokens.js'

describe('WWDC polish contract', () => {
  it('keeps ember aligned with CSS warm accent (not gold)', () => {
    expect(T.ember.toLowerCase()).toBe('#e8a13c')
    expect(T.gold.toLowerCase()).toBe('#d4af37')
    expect(T.ember).not.toBe(T.gold)
  })

  it('does not double-count safe-area in tab bar inset', () => {
    expect(SHELL_TAB_BAR_INSET).toBe('calc(var(--shell-tab-bar-height) + var(--gap-s))')
    expect(SHELL_TAB_BAR_INSET).not.toMatch(/safe-area-inset-bottom/)
  })

  it('exposes control radius and tap floor tokens', () => {
    expect(R.control).toBe('var(--radius-control)')
    expect(R.card).toBe('var(--radius-card)')
    expect(TAP.min).toBe('var(--tap-min)')
    expect(TAP.minPx).toBe(44)
    expect(ICON.md).toBe(18)
  })
})

describe('button family polish', () => {
  it('PrimaryButton meets tap floor and pressable contract', () => {
    render(<PrimaryButton>Continue</PrimaryButton>)
    const btn = screen.getByRole('button', { name: 'Continue' })
    expect(btn).toHaveClass('cw-motion-pressable')
    expect(btn.style.minHeight).toBe('var(--tap-min)')
    expect(btn.style.borderRadius).toBe('var(--radius-control)')
  })

  it('Secondary and Ghost share press + disabled affordances', () => {
    render(
      <>
        <SecondaryButton disabled>Later</SecondaryButton>
        <GhostButton disabled>Skip</GhostButton>
      </>
    )
    const later = screen.getByRole('button', { name: 'Later' })
    const skip = screen.getByRole('button', { name: 'Skip' })
    expect(later).toHaveClass('cw-motion-pressable')
    expect(skip).toHaveClass('cw-motion-pressable')
    expect(later.style.cursor).toBe('not-allowed')
    expect(skip.style.cursor).toBe('not-allowed')
    expect(later.style.opacity).toBe('0.55')
  })

  it('chrome controls expose a 44px hit box', () => {
    render(
      <>
        <IconButton label="Settings" />
        <TextButton>Edit</TextButton>
        <BackLink>Journal</BackLink>
      </>
    )
    expect(screen.getByLabelText('Settings').style.minHeight).toBe('var(--tap-min)')
    expect(screen.getByRole('button', { name: 'Edit' }).style.minHeight).toBe('var(--tap-min)')
    expect(screen.getByRole('button', { name: /Journal/ }).style.minHeight).toBe('var(--tap-min)')
  })
})
