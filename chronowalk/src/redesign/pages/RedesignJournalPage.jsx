import RedesignRouteShell from '../RedesignRouteShell.jsx'
import RedesignJournalScreen from '../RedesignJournalScreen.jsx'

export default function RedesignJournalPage() {
  return (
    <RedesignRouteShell>
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <RedesignJournalScreen embedded />
      </div>
    </RedesignRouteShell>
  )
}
