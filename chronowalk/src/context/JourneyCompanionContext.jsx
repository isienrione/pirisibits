import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BottomSheet } from '../components/ui/BottomSheet.jsx'
import JourneyRouteSheet from '../components/journey/JourneyRouteSheet.jsx'
import SettingsSheet from '../components/journey/SettingsSheet.jsx'

const JourneyCompanionContext = createContext(null)

export function useJourneyCompanion() {
  const value = useContext(JourneyCompanionContext)
  if (!value) {
    throw new Error('useJourneyCompanion must be used within JourneyCompanionProvider')
  }
  return value
}

export function JourneyCompanionProvider({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [routeSheetOpen, setRouteSheetOpen] = useState(false)
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false)

  const syncSheetFromSearch = useCallback(() => {
    const sheet = new URLSearchParams(location.search).get('sheet')
    setRouteSheetOpen(sheet === 'route')
    setSettingsSheetOpen(sheet === 'settings')
  }, [location.search])

  useEffect(() => {
    syncSheetFromSearch()
  }, [syncSheetFromSearch])

  const clearSheetParam = useCallback(() => {
    const params = new URLSearchParams(location.search)
    if (!params.has('sheet')) return
    params.delete('sheet')
    const search = params.toString()
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
      },
      { replace: true }
    )
  }, [location.pathname, location.search, navigate])

  const openRouteSheet = useCallback(() => {
    setRouteSheetOpen(true)
    setSettingsSheetOpen(false)
  }, [])

  const openSettingsSheet = useCallback(() => {
    setSettingsSheetOpen(true)
    setRouteSheetOpen(false)
  }, [])

  const closeRouteSheet = useCallback(() => {
    setRouteSheetOpen(false)
    clearSheetParam()
  }, [clearSheetParam])

  const closeSettingsSheet = useCallback(() => {
    setSettingsSheetOpen(false)
    clearSheetParam()
  }, [clearSheetParam])

  const value = useMemo(
    () => ({
      routeSheetOpen,
      settingsSheetOpen,
      openRouteSheet,
      openSettingsSheet,
      closeRouteSheet,
      closeSettingsSheet,
    }),
    [
      routeSheetOpen,
      settingsSheetOpen,
      openRouteSheet,
      openSettingsSheet,
      closeRouteSheet,
      closeSettingsSheet,
    ]
  )

  return (
    <JourneyCompanionContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[70]">
        <BottomSheet
          open={routeSheetOpen}
          onHandleClick={closeRouteSheet}
          handleLabel="Close route"
          ariaLabelledBy="journey-route-sheet-title"
          className="pointer-events-auto"
        >
          <JourneyRouteSheet onClose={closeRouteSheet} />
        </BottomSheet>

        <BottomSheet
          open={settingsSheetOpen}
          onHandleClick={closeSettingsSheet}
          handleLabel="Close settings"
          ariaLabelledBy="journey-settings-sheet-title"
          className="pointer-events-auto"
        >
          <SettingsSheet onClose={closeSettingsSheet} />
        </BottomSheet>
      </div>
    </JourneyCompanionContext.Provider>
  )
}

export default JourneyCompanionProvider
