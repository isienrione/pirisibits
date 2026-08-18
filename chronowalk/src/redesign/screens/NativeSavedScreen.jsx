import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRegistry, contentRoute } from '../../content/rome/registry.js'
import { readGuestContext, removeSavedExperience } from '../../lib/guestSession.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import NativeContentCard from '../ui/NativeContentCard.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'

export default function NativeSavedScreen() {
  const t = useT()
  const navigate = useNavigate()
  const registry = useMemo(() => getRomeRegistry(), [])
  const [savedIds, setSavedIds] = useState(() => readGuestContext()?.history?.savedExperienceIds ?? [])
  const items = savedIds.map((id) => registry.byId[id]).filter(Boolean)

  const remove = (id) => {
    removeSavedExperience(id)
    setSavedIds((current) => current.filter((item) => item !== id))
  }

  return (
    <div
      data-testid="native-saved"
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.bone,
        padding: 'max(20px, calc(env(safe-area-inset-top) + 12px)) 20px calc(var(--shell-tab-bar-height, 72px) + 12px)',
      }}
    >
      <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '0 0 12px' }}>{t('native.saved.title')}</h1>
      {items.length === 0 ? (
        <p data-testid="native-saved-empty" style={{ color: T.muted, lineHeight: 1.5 }}>
          {t('native.saved.empty')}
        </p>
      ) : (
        items.map((item) => (
          <div key={item.id}>
            <NativeContentCard item={item} testId={`saved-card-${item.id}`} onOpen={(next) => navigate(contentRoute(next))} />
            <GhostButton
              data-testid={`saved-remove-${item.id}`}
              onClick={() => remove(item.id)}
              style={{ minHeight: 44, marginBottom: 16 }}
            >
              {t('native.saved.remove')}
            </GhostButton>
          </div>
        ))
      )}
    </div>
  )
}
