import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TYPE, TYPE_SPACE, displayTitleStyle } from '../../typography.js'
import { PrimaryButton } from '../PrimaryButton.jsx'
import { ScreenHeader } from '../ScreenHeader.jsx'
import { Eyebrow } from '../Eyebrow.jsx'
import { SectionLabel } from '../SectionLabel.jsx'
import { TabBar } from '../TabBar.jsx'

describe('typography roles', () => {
  it('keeps Fraunces / DM Sans families', () => {
    expect(TYPE.display.fontFamily).toMatch(/Fraunces/)
    expect(TYPE.body.fontFamily).toMatch(/DM Sans/)
    expect(TYPE.button.fontFamily).toMatch(/DM Sans/)
  })

  it('defines book-like leading and tracking via CSS vars', () => {
    expect(TYPE.display.lineHeight).toBe('var(--lh-display)')
    expect(TYPE.body.lineHeight).toBe('var(--lh-body)')
    expect(TYPE.prose.lineHeight).toBe('var(--lh-prose)')
    expect(TYPE.button.letterSpacing).toBe('var(--tracking-button)')
    expect(TYPE.kicker.letterSpacing).toBe('var(--tracking-kicker)')
    expect(TYPE.section.letterSpacing).toBe('var(--tracking-section)')
  })

  it('separates caption hierarchy kickers from section labels', () => {
    expect(TYPE.kicker.fontSize).toBe('var(--fs-kicker)')
    expect(TYPE.section.fontSize).toBe('var(--fs-caption)')
    expect(TYPE.kicker.letterSpacing).not.toBe(TYPE.section.letterSpacing)
  })

  it('exposes paragraph rhythm tokens', () => {
    expect(TYPE_SPACE.afterParagraph).toBe('var(--type-after-paragraph)')
    expect(TYPE_SPACE.afterDisplay).toBe('var(--type-after-display)')
  })

  it('tunes displayTitleStyle by size without changing family', () => {
    const large = displayTitleStyle(34)
    const mid = displayTitleStyle(24)
    expect(large.fontFamily).toMatch(/Fraunces/)
    expect(large.lineHeight).toBe('var(--lh-display)')
    expect(mid.lineHeight).toBe('var(--lh-title)')
    expect(large.paddingTop).toBe('var(--type-optical-display)')
  })
})

describe('typography primitives', () => {
  it('PrimaryButton uses button tracking role', () => {
    render(<PrimaryButton>Continue</PrimaryButton>)
    const btn = screen.getByRole('button', { name: 'Continue' })
    expect(btn.style.letterSpacing).toBe('var(--tracking-button)')
    expect(btn.style.fontSize).toBe('var(--fs-button)')
    expect(btn.style.lineHeight).toBe('var(--lh-button)')
  })

  it('ScreenHeader uses display leading', () => {
    render(<ScreenHeader title="My Tour" subtitle="Today’s walk" />)
    const title = screen.getByRole('heading', { level: 1 })
    expect(title.style.lineHeight).toBe('var(--lh-display)')
    expect(title.style.letterSpacing).toBe('var(--tracking-display)')
    expect(screen.getByText("Today’s walk").style.lineHeight).toBe('var(--lh-ui)')
  })

  it('Eyebrow and SectionLabel stay distinct in the caption ladder', () => {
    render(
      <>
        <Eyebrow>Act I</Eyebrow>
        <SectionLabel>Key facts</SectionLabel>
      </>
    )
    expect(screen.getByText('Act I').style.letterSpacing).toBe('var(--tracking-kicker)')
    expect(screen.getByText('Key facts').style.letterSpacing).toBe('var(--tracking-section)')
  })

  it('TabBar captions meet the 11px floor via caption token', () => {
    render(<TabBar active="JOURNEY" />)
    const journey = screen.getByRole('button', { name: /JOURNEY/ })
    expect(journey.style.fontSize).toBe('var(--fs-caption)')
    expect(journey.style.letterSpacing).toBe('var(--tracking-tab)')
  })
})
