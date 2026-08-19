import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRomeRegistry, contentRoute } from '../../content/rome/registry.js'
import { readGuestContext, removeSavedExperience } from '../../lib/guestSession.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F } from '../tokens.js'
import NativeContentCard from '../ui/NativeContentCard.jsx'
import { GhostButton } from '../ui/GhostButton.jsx'
import { R, RouteSurface, routeGhost, routeHeadline } from '../ui/RouteSurface.jsx'

export default function NativeSavedScreen() {
  const t = useT()
  const navigate = useNavigate()
  const registry = useMemo(() => getRomeRegistry(), [])
  const [savedIds, setSavedIds] = useState(() => readGuestContext()?.history?.savedExperienceIds ?? [])
  const [filter, setFilter] = useState('all')
  const items = savedIds
    .map((id) => registry.byId[id])
    .filter(Boolean)
    .filter((item) => {
      if (filter === 'experiences') return item.contentType !== 'discovery'
      if (filter === 'discoveries') return item.contentType === 'discovery'
      return true
    })

  const remove = (id) => {
    removeSavedExperience(id)
    setSavedIds((current) => current.filter((item) => item !== id))
  }

  return (
    <RouteSurface testId="native-saved">
      <h1 style={routeHeadline}>{t('native.saved.title')}</h1>
      <div style={{ display: 'flex', gap: 8, margin: '0 0 16px', flexWrap: 'wrap' }}>
        {[
          ['all', 'native.saved.filter.all'],
          ['experiences', 'native.saved.filter.experiences'],
          ['discoveries', 'native.saved.filter.discoveries'],
        ].map(([id, key]) => (
          <GhostButton
            key={id}
            data-testid={`saved-filter-${id}`}
            onClick={() => setFilter(id)}
            style={{ minHeight: 40, ...routeGhost, borderColor: filter === id ? R.ink : R.line }}
          >
            {t(key)}
          </GhostButton>
        ))}
      </div>
      {items.length === 0 ? (
        <p data-testid="native-saved-empty" style={{ color: R.muted, lineHeight: 1.5, fontFamily: F.body }}>
          {t('native.saved.empty')}
        </p>
      ) : (
        items.map((item) => (
          <div key={item.id}>
            <NativeContentCard
              item={item}
              compact
              testId={`saved-card-${item.id}`}
              onOpen={(next) => navigate(contentRoute(next))}
            />
            <GhostButton
              data-testid={`saved-remove-${item.id}`}
              onClick={() => remove(item.id)}
              style={{ minHeight: 44, marginBottom: 16, ...routeGhost }}
            >
              {t('native.saved.remove')}
            </GhostButton>
          </div>
        ))
      )}
    </RouteSurface>
  )
}
