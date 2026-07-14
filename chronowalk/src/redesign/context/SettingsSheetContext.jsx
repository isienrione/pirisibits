import { Suspense, createContext, useCallback, useContext, useMemo, useState } from 'react'
import { lazyWithRecovery } from '../../utils/lazyWithRecovery.js'

const SettingsBottomSheet = lazyWithRecovery(
  () => import('../ui/SettingsBottomSheet.jsx'),
  'settings sheet',
)

const SettingsSheetActionsContext = createContext(null)
const SettingsSheetStateContext = createContext(null)

export function SettingsSheetProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openSettings = useCallback(() => setOpen(true), [])
  const closeSettings = useCallback(() => setOpen(false), [])

  const actions = useMemo(
    () => ({
      openSettings,
      closeSettings,
    }),
    [closeSettings, openSettings],
  )

  const state = useMemo(() => ({ isOpen: open }), [open])

  return (
    <SettingsSheetActionsContext.Provider value={actions}>
      <SettingsSheetStateContext.Provider value={state}>
        {children}
        {open ? (
          <Suspense fallback={null}>
            <SettingsBottomSheet open={open} onClose={closeSettings} />
          </Suspense>
        ) : null}
      </SettingsSheetStateContext.Provider>
    </SettingsSheetActionsContext.Provider>
  )
}

/** Stable actions — does not re-render when the sheet opens/closes. */
export function useSettingsSheetActions() {
  const context = useContext(SettingsSheetActionsContext)
  if (!context) {
    throw new Error('useSettingsSheetActions must be used within SettingsSheetProvider')
  }
  return context
}

export function useSettingsSheetState() {
  const context = useContext(SettingsSheetStateContext)
  if (!context) {
    throw new Error('useSettingsSheetState must be used within SettingsSheetProvider')
  }
  return context
}

/** Combined hook for existing call sites. Prefer actions-only when isOpen unused. */
export function useSettingsSheet() {
  const actions = useSettingsSheetActions()
  const state = useSettingsSheetState()
  return useMemo(
    () => ({
      ...actions,
      ...state,
    }),
    [actions, state],
  )
}
