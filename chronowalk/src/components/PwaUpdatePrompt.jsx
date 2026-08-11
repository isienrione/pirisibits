import { useEffect, useState } from 'react'
import { Button } from './ui'
import { pwaController } from '../pwa/pwaController'
import { useT } from '../i18n/I18nProvider.jsx'
import { t as translate } from '../i18n/t.js'

const DEFAULT_COPY = {
  eyebrow: translate('pwa.update.eyebrow', {}, 'en'),
  body: translate('pwa.update.body', {}, 'en'),
  tap: translate('pwa.update.tap', {}, 'en'),
  later: translate('pwa.update.later', {}, 'en'),
}

export function PwaUpdatePromptView({ visible, onUpdate, onDismiss, copy = DEFAULT_COPY }) {
  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] px-4"
      role="status"
      aria-live="polite"
    >
      <div className="bg-ink900 rounded-card pointer-events-auto mx-auto flex max-w-md items-center gap-3 p-4 ">
        <div className="min-w-0 flex-1">
          <p className="text-eyebrow uppercase text-ember">{copy.eyebrow}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink900">{copy.body}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button size="sm" onClick={onUpdate}>
            {copy.tap}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            {copy.later}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PwaUpdatePrompt() {
  const [visible, setVisible] = useState(false)
  const t = useT()

  useEffect(() => {
    return pwaController.onNeedRefresh(() => setVisible(true))
  }, [])

  return (
    <PwaUpdatePromptView
      visible={visible}
      copy={{
        eyebrow: t('pwa.update.eyebrow'),
        body: t('pwa.update.body'),
        tap: t('pwa.update.tap'),
        later: t('pwa.update.later'),
      }}
      onUpdate={() => {
        pwaController.applyUpdate()
        setVisible(false)
      }}
      onDismiss={() => setVisible(false)}
    />
  )
}

export default PwaUpdatePrompt
