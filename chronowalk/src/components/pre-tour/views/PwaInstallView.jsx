import { usePwaInstall } from '../../../hooks/usePwaInstall'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { EditorialTitle, GlassPanel } from '../../ui'
import PwaInstallPanel from '../../PwaInstallPanel'

export function PwaInstallView() {
  const pwaInstall = usePwaInstall()

  return (
    <div className="space-y-6">
      <GlassPanel className="rounded-3xl p-6 shadow-plaque-lg sm:p-8" grain>
        <EditorialTitle
          eyebrow="Install"
          size="md"
          subtitle="Add ChronoWalk to your home screen for quick access on tour day — full screen, like a native app."
        >
          Walk with ChronoWalk offline-ready
        </EditorialTitle>
      </GlassPanel>

      <PwaInstallPanel
        installed={pwaInstall.installed}
        canPromptInstall={pwaInstall.canPromptInstall}
        showIosInstructions={pwaInstall.showIosInstructions}
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
