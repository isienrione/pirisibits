import { useEffect, useState } from 'react'
import DebugPanel from './DebugPanel.jsx'
import {
  isDebugPanelOpen,
  subscribeDebugPanelOpen,
  syncDebugPanelFromUrl,
} from './debugPanelGate.js'

/**
 * Owns open-state for the hidden diagnostics panel.
 * Mount on landing + tour (or globally) when INCLUDE_DEBUG_PANEL is true.
 */
export default function DebugPanelHost() {
  const [open, setOpen] = useState(() => isDebugPanelOpen())

  useEffect(() => {
    syncDebugPanelFromUrl()
    setOpen(isDebugPanelOpen())
    const unsub = subscribeDebugPanelOpen(setOpen)

    const onNav = () => syncDebugPanelFromUrl()
    window.addEventListener('popstate', onNav)
    return () => {
      unsub()
      window.removeEventListener('popstate', onNav)
    }
  }, [])

  if (!open) return null
  return <DebugPanel />
}
