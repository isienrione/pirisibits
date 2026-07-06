import { useNavigate } from 'react-router-dom'
import { usePwaInstall } from '../../hooks/usePwaInstall.js'
import { useOfflineAudio } from '../../hooks/useOfflineAudio.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import B2MakeItYours from '../screens/B2MakeItYours.jsx'

export default function RedesignSetupPage() {
  const navigate = useNavigate()
  const { canPromptInstall, showIosInstructions, promptInstall } = usePwaInstall()
  const offline = useOfflineAudio()

  const handleInstall = async () => {
    if (canPromptInstall) {
      await promptInstall()
      return
    }
    if (!offline.isDownloading && !offline.isReady) {
      void offline.startDownload()
    }
  }

  const downloadProgress =
    offline.progress?.percent != null ? offline.progress.percent / 100 : offline.isReady ? 1 : 0

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <B2MakeItYours
          showIosInstructions={showIosInstructions}
          canInstall={canPromptInstall || showIosInstructions || !offline.isReady}
          downloading={offline.isDownloading}
          downloadProgress={downloadProgress}
          downloadComplete={offline.isReady}
          onInstall={handleInstall}
          onContinue={() => navigate('/begin', { replace: true })}
          onSkip={() => navigate('/begin', { replace: true })}
        />
      </div>
    </RedesignRouteShell>
  )
}
