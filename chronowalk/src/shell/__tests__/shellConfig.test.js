import { describe, expect, it } from 'vitest'
import { getShellTabs, SHELL_TAB_META } from '../config.js'
import { NAV_TABS } from '../../components/navigation/navConfig.jsx'

describe('shell config', () => {
  it('exposes three companion tabs aligned to journey, map, and journal', () => {
    const tabs = getShellTabs()
    expect(tabs.map((tab) => tab.label)).toEqual(['Journey', 'Map', 'Journal'])
    expect(SHELL_TAB_META[NAV_TABS.JOURNEY].to).toBe('/journey')
    expect(SHELL_TAB_META[NAV_TABS.JOURNAL].to).toBe('/journal')
  })
})
