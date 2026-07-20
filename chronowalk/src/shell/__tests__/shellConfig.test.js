import { describe, expect, it } from 'vitest'
import { getShellTabs, SHELL_TAB_META } from '../config.js'
import { NAV_TABS } from '../../components/navigation/navConfig.jsx'

describe('shell config', () => {
  it('exposes mockup-aligned tab routes and labels', () => {
    const tabs = getShellTabs()
    expect(tabs.map((tab) => tab.label)).toEqual(['My Tour', 'Stops', 'Map', 'Journal'])
    expect(SHELL_TAB_META[NAV_TABS.STOPS].to).toBe('/stops')
  })
})
