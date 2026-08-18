import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isNativeIOS } from '../../lib/platform.js'
import { useSettingsSheet } from '../context/SettingsSheetContext.jsx'
import NativeSettingsScreen from '../screens/NativeSettingsScreen.jsx'

/** Opens the companion settings sheet and returns to the previous screen. */
export default function RedesignSettingsPage() {
  const navigate = useNavigate()
  const { openSettings } = useSettingsSheet()

  useEffect(() => {
    if (isNativeIOS()) return
    openSettings()
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/journal', { replace: true })
  }, [navigate, openSettings])

  if (isNativeIOS()) {
    return (
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <NativeSettingsScreen />
      </div>
    )
  }

  return null
}
