import { describe, expect, it, vi } from 'vitest'
import { getFocusableElements, trapTabKey } from '../focusTrap'

describe('focusTrap', () => {
  it('returns focusable elements inside a container', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <button type="button">First</button>
      <button type="button" disabled>Disabled</button>
      <button type="button">Last</button>
    `

    const focusable = getFocusableElements(container)
    expect(focusable).toHaveLength(2)
    expect(focusable[0].textContent).toBe('First')
    expect(focusable[1].textContent).toBe('Last')
  })

  it('wraps tab focus from last to first element', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <button type="button">First</button>
      <button type="button">Last</button>
    `
    document.body.appendChild(container)

    const [first, last] = getFocusableElements(container)
    last.focus()

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    const preventDefault = vi.spyOn(event, 'preventDefault')

    trapTabKey(event, container)

    expect(preventDefault).toHaveBeenCalled()
    expect(document.activeElement).toBe(first)

    document.body.removeChild(container)
  })
})
