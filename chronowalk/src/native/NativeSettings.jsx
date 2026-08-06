import { useCallback, useEffect, useId, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { NativeButton } from './NativeButton.jsx'
import { nativeSelectionHaptic } from './nativeHaptics.js'

/**
 * Compact native settings sheet.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onRestore: () => void,
 * }} props
 */
export function NativeSettings({ open, onClose, onRestore }) {
  const navigate = useNavigate()
  const titleId = useId()
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    closeRef.current?.focus?.()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const go = useCallback(
    (path) => {
      nativeSelectionHaptic()
      onClose()
      navigate(path)
    },
    [navigate, onClose],
  )

  if (!open) return null

  return (
    <div
      className="cw-native-settings"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="native-settings"
    >
      <button
        type="button"
        className="cw-native-settings__scrim"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className="cw-native-settings__sheet">
        <div className="cw-native-settings__handle" aria-hidden="true" />
        <header className="cw-native-settings__header">
          <h2 id={titleId} className="cw-native-settings__title">
            Settings
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="cw-native-settings__close"
            aria-label="Close"
            onClick={onClose}
          >
            Done
          </button>
        </header>

        <ul className="cw-native-settings__list">
          <li>
            <NativeButton
              variant="ghost"
              className="cw-native-settings__row"
              testId="native-settings-restore"
              aria-label="Restore purchases"
              onClick={() => {
                onClose()
                onRestore()
              }}
            >
              Restore purchases
            </NativeButton>
          </li>
          <li>
            <NativeButton
              variant="ghost"
              className="cw-native-settings__row"
              testId="native-settings-help"
              aria-label="Help and contact"
              onClick={() => go('/contact')}
            >
              Help
            </NativeButton>
          </li>
          <li>
            <NativeButton
              variant="ghost"
              className="cw-native-settings__row"
              testId="native-settings-legal"
              aria-label="Legal information"
              onClick={() => go('/legal/terms')}
            >
              Legal
            </NativeButton>
          </li>
          <li>
            <div className="cw-native-settings__about" data-testid="native-settings-about">
              <p className="cw-native-settings__about-title">About</p>
              <p className="cw-native-settings__about-body">
                ChronoWalk — cinematic audio walks through cities as they once were.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  )
}
