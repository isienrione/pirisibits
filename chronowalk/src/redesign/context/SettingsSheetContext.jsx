import { Suspense, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { lazyWithRecovery } from '../../utils/lazyWithRecovery.js'

const SettingsBottomSheet = lazyWithRecovery(
  () => import('../ui/SettingsBottomSheet.jsx'),
  'settings sheet',
)

const SettingsSheetContext = createContext(null)

export function SettingsSheetProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openSettings = useCallback(() => setOpen(true), [])
  const closeSettings = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({
      isOpen: open,
      openSettings,
      closeSettings,
    }),
    [closeSettings, open, openSettings],
  )

  return (
    <SettingsSheetContext.Provider value={value}>
      {children}
      {open ? (
        <Suspense fallback={null}>
          <SettingsBottomSheet open={open} onClose={closeSettings} />
        </Suspense>
      ) : null}
    </SettingsSheetContext.Provider>
  )
}

export function useSettingsSheet() {
  const context = useContext(SettingsSheetContext)
  if (!context) {
    throw new Error('useSettingsSheet must be used within SettingsSheetProvider')
  }
  return context
}
