import { describe, expect, it } from 'vitest'
import { getShellTabs, isShellTabActive, SHELL_TAB_META } from '../config.js'
import { NAV_TABS } from '../../components/navigation/navConfig.jsx'

describe('shell config', () => {
  it('exposes Home · Walk · Tour · Map · Journal', () => {
    const tabs = getShellTabs()
    expect(tabs.map((tab) => tab.label)).toEqual(['Home', 'Walk', 'Tour', 'Map', 'Journal'])
    expect(SHELL_TAB_META[NAV_TABS.HOME].to).toBe('/home')
    expect(SHELL_TAB_META[NAV_TABS.WALK].to).toBe('/journey')
    expect(SHELL_TAB_META[NAV_TABS.TOUR].to).toBe('/tour')
  })

  it('highlights Home, Walk on /journey and Tour on legacy /stops', () => {
    expect(isShellTabActive('/home', '/home')).toBe(true)
    expect(isShellTabActive('/journey', '/journey')).toBe(true)
    expect(isShellTabActive('/tour', '/tour')).toBe(true)
    expect(isShellTabActive('/tour', '/stops')).toBe(true)
    expect(isShellTabActive('/journey', '/tour')).toBe(false)
  })
})
