import { Link } from 'react-router-dom'
import OfflineAudioPanel from '../../components/offline/OfflineAudioPanel.jsx'
import SettingsPreferencesPanel from '../../components/settings/SettingsPreferencesPanel.jsx'
import { PageShell, SectionHeader } from '../../components/ui'

export function SettingsPage() {
  return (
    <PageShell>
      <SectionHeader align="left" title="Settings" />

      <SettingsPreferencesPanel />

      <section className="mt-8">
        <h2 className="mb-3 px-1 text-sm font-semibold text-ink">Offline</h2>
        <OfflineAudioPanel />
      </section>

      <div className="mt-8 grid gap-3">
        <Link to="/credits" className="text-sm font-semibold text-accent">
          Credits
        </Link>
        <Link to="/journal" className="text-sm font-semibold text-accent">
          Open journal
        </Link>
        <Link to="/letter" className="text-sm font-semibold text-accent">
          Open letter
        </Link>
        <Link to="/journey" className="text-sm font-semibold text-accent">
          Back to walk
        </Link>
      </div>
    </PageShell>
  )
}
