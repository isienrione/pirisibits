import { Link } from 'react-router-dom'
import OfflineAudioPanel from '../offline/OfflineAudioPanel.jsx'
import SettingsPreferencesPanel from '../settings/SettingsPreferencesPanel.jsx'
import { SectionHeader } from '../ui'

export default function SettingsSheet({ onClose }) {
  return (
    <div className="pb-6">
      <SectionHeader
        align="left"
        id="journey-settings-sheet-title"
        title="Settings"
        subtitle="Preferences, offline packs, and credits."
      />

      <SettingsPreferencesPanel />

      <section className="mt-8">
        <h2 className="mb-3 px-1 text-sm font-semibold text-ink900">Offline</h2>
        <OfflineAudioPanel />
      </section>

      <div className="mt-8 grid gap-3">
        <Link
          to="/credits"
          onClick={() => onClose?.()}
          className="text-sm font-semibold text-ember"
        >
          Credits
        </Link>
        <Link
          to="/letter"
          onClick={() => onClose?.()}
          className="text-sm font-semibold text-ember"
        >
          Open letter
        </Link>
      </div>
    </div>
  )
}
