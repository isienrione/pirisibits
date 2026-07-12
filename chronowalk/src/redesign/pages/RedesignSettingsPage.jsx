import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsSheet } from '../context/SettingsSheetContext.jsx'

/** Opens the companion settings sheet and returns to the previous screen. */
export default function RedesignSettingsPage() {
  const navigate = useNavigate()
  const { openSettings } = useSettingsSheet()

  useEffect(() => {
    openSettings()
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/journal', { replace: true })
  }, [navigate, openSettings])

  return null
}
