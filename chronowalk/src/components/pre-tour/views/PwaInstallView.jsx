import { usePwaInstall } from '../../../hooks/usePwaInstall'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { EditorialTitle } from '../../ui'
import PwaInstallPanel from '../../PwaInstallPanel'

export function PwaInstallView() {
  const pwaInstall = usePwaInstall()

  return (
    <div className="space-y-6">
      <div className="bg-ink900 rounded-card rounded-3xl p-6  sm:p-8">
        <EditorialTitle
          eyebrow="Install"
          size="md"
          subtitle="Add ChronoWalk to your home screen for quick access on tour day — full screen, like a native app."
        >
          Walk with ChronoWalk offline-ready
        </EditorialTitle>
      </div>

      <PwaInstallPanel
        installed={pwaInstall.installed}
        canPromptInstall={pwaInstall.canPromptInstall}
        showIosInstructions={pwaInstall.showIosInstructions}
        needsSafariForInstall={pwaInstall.needsSafariForInstall}
        showInstallOption={pwaInstall.showInstallOption}
        onInstall={() => {
          triggerHaptic(HAPTIC_KIND.SOFT_TAP)
          void pwaInstall.promptInstall()
        }}
      />
    </div>
  )
}

export default PwaInstallView
