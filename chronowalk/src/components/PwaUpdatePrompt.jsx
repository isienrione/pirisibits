import { useEffect, useState } from 'react'
import { Button } from './ui'
import { pwaController } from '../pwa/pwaController'

export function PwaUpdatePromptView({ visible, onUpdate, onDismiss }) {
  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] px-4"
      role="status"
      aria-live="polite"
    >
      <div className="bg-ink900 rounded-card pointer-events-auto mx-auto flex max-w-md items-center gap-3 p-4 ">
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow uppercase text-ember">Update available</p>
          <p className="mt-1 text-sm leading-relaxed text-ink900">
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
      </div>
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
      onUpdate={() => {
        pwaController.applyUpdate()
        setVisible(false)
      }}
      onDismiss={() => setVisible(false)}
    />
  )
}

export default PwaUpdatePrompt
