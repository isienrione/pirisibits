import { useEffect, useState } from 'react'
import { Button, GlassPanel } from './ui'
import { pwaController } from '../pwa/pwaController'

export function PwaUpdatePromptView({ visible, onUpdate, onDismiss }) {
  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] px-4"
      role="status"
      aria-live="polite"
    >
      <GlassPanel className="pointer-events-auto mx-auto flex max-w-md items-center gap-3 p-4 shadow-glass-lg">
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow uppercase text-gold-text">Update available</p>
          <p className="mt-1 text-sm leading-relaxed text-deep-slate">
            A new version of ChronoWalk is ready. Refresh to get the latest improvements.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button size="sm" onClick={onUpdate}>
            Update
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Later
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}

export function PwaUpdatePrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    return pwaController.onNeedRefresh(() => setVisible(true))
  }, [])

  return (
    <PwaUpdatePromptView
      visible={visible}
      onUpdate={() => pwaController.applyUpdate()}
      onDismiss={() => setVisible(false)}
    />
  )
}

export default PwaUpdatePrompt
