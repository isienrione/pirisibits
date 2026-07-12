import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLaunchOfflineTour } from '../content/launchOfflineDownload'
import ExplorerSettingsScreen from '../components/journey/ExplorerSettingsScreen'
import { useReducedMotion } from '../hooks/useReducedMotion'
import {
  cycleAudioSpeed,
  formatPlaybackSpeed,
  PREFERENCES_CHANGED_EVENT,
  readAudioEnabled,
  readAudioSpeed,
  readHapticsEnabled,
  readNotificationsEnabled,
  writeAudioEnabled,
  writeHapticsEnabled,
  writeNotificationsEnabled,
} from '../utils/appPreferences'
import { ROUTES } from '../routes/paths'

export default function SettingsPage() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const offlineTour = getLaunchOfflineTour('rome')

  const [audioEnabled, setAudioEnabled] = useState(() => readAudioEnabled())
  const [playbackSpeed, setPlaybackSpeed] = useState(() => readAudioSpeed())
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => readNotificationsEnabled())
  const [hapticsEnabled, setHapticsEnabled] = useState(() => readHapticsEnabled())

  useEffect(() => {
    const syncPreferences = () => {
      setAudioEnabled(readAudioEnabled())
      setPlaybackSpeed(readAudioSpeed())
      setNotificationsEnabled(readNotificationsEnabled())
      setHapticsEnabled(readHapticsEnabled())
    }

    window.addEventListener(PREFERENCES_CHANGED_EVENT, syncPreferences)
    return () => window.removeEventListener(PREFERENCES_CHANGED_EVENT, syncPreferences)
  }, [])

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(ROUTES.home, { replace: true })
  }, [navigate])

  const handleAudioEnabledChange = useCallback((enabled) => {
    writeAudioEnabled(enabled)
    setAudioEnabled(enabled)
  }, [])

  const handlePlaybackSpeedChange = useCallback(() => {
    const next = cycleAudioSpeed(playbackSpeed)
    setPlaybackSpeed(next)
  }, [playbackSpeed])

  const handleNotificationsChange = useCallback((enabled) => {
    writeNotificationsEnabled(enabled)
    setNotificationsEnabled(enabled)
  }, [])

  const handleHapticsChange = useCallback((enabled) => {
    writeHapticsEnabled(enabled)
    setHapticsEnabled(enabled)
  }, [])

  return (
    <ExplorerSettingsScreen
      audioEnabled={audioEnabled}
      playbackSpeedLabel={formatPlaybackSpeed(playbackSpeed)}
      notificationsEnabled={notificationsEnabled}
      hapticsEnabled={hapticsEnabled}
      reducedMotion={reducedMotion}
      offlineTour={offlineTour}
      onAudioEnabledChange={handleAudioEnabledChange}
      onPlaybackSpeedChange={handlePlaybackSpeedChange}
      onNotificationsChange={handleNotificationsChange}
      onHapticsChange={handleHapticsChange}
      onBack={handleBack}
    />
  )
}
