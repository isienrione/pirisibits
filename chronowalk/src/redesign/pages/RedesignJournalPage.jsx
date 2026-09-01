import RedesignRouteShell from '../RedesignRouteShell.jsx'
import RedesignJournalScreen from '../RedesignJournalScreen.jsx'
import NativeSavedScreen from '../screens/NativeSavedScreen.jsx'
import { isNativeIOS } from '../../lib/platform.js'

export default function RedesignJournalPage() {
  if (isNativeIOS()) {
    return (
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <NativeSavedScreen />
      </div>
    )
  }
  return (
    <RedesignRouteShell>
      <div className="redesign-phone-frame redesign-phone-frame--companion">
        <RedesignJournalScreen embedded />
      </div>
    </RedesignRouteShell>
  )
}
