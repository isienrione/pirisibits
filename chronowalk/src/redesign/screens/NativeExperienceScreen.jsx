import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRegistryItem } from '../../content/rome/registry.js'
import { COVERAGE_LABELS } from '../../content/rome/heroRecommendationMeta.js'
import { canAccessContentId } from '../../lib/contentAccess.js'
import { startHeroExperience } from '../../lib/heroExperience.js'
import {
  isExperienceSaved,
  recordSavedExperience,
  removeSavedExperience,
} from '../../lib/guestSession.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import NativeCoverageSheet from '../ui/NativeCoverageSheet.jsx'
import PlaceMedia from '../ui/PlaceMedia.jsx'
import { R, RouteSurface, routeGhost, routePrimary, routeType } from '../ui/RouteSurface.jsx'

export default function NativeExperienceScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { heroId } = useParams()
  const [lockOpen, setLockOpen] = useState(false)
  const [saved, setSaved] = useState(() => isExperienceSaved(heroId))

  const hero = useMemo(() => getRegistryItem(heroId), [heroId])

  if (!hero) {
    return (
      <RouteSurface testId="native-experience">
        <p style={{ color: R.ink }}>Experience unavailable.</p>
      </RouteSurface>
    )
  }

  const locked = !canAccessContentId(hero.id)
  const label = locked
    ? COVERAGE_LABELS[(hero.unlockScopes || []).find((scope) => scope !== 'rome-free')] || 'Locked'
    : COVERAGE_LABELS['rome-free']

  const handleStart = () => {
    if (locked) {
      track(TRACK_EVENTS.LOCKED_EXPERIENCE_OPENED, { hero_id: hero.id })
      setLockOpen(true)
      return
    }
    startHeroExperience(hero.heroId || hero.id, { navigate })
  }

  const toggleSave = () => {
    if (saved) removeSavedExperience(hero.id)
    else recordSavedExperience(hero.id)
    setSaved(!saved)
  }

  return (
    <RouteSurface testId="native-experience" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <div data-hero-id={hero.id} style={{ color: R.ink }}>
        <div style={{ padding: '0 20px' }}>
          <PlaceMedia item={hero} height={220} radius={20} />
        </div>
        <div style={{ padding: '18px 20px 0' }}>
          <p style={routeType}>
            {t('native.content.experience')} · {label} · {hero.timeCostMin} min
          </p>
          <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, margin: '8px 0', color: R.ink }}>
            {hero.title}
          </h1>
          <p style={{ margin: '0 0 20px', lineHeight: 1.5, color: R.ink, fontFamily: F.body }}>{hero.whyWorthIt}</p>
          <PrimaryButton color={T.gold} data-testid="experience-start" onClick={handleStart} style={routePrimary}>
            {locked ? t('native.experience.unlock') : t('native.experience.start')}
          </PrimaryButton>
          <GhostButton data-testid="experience-save" onClick={toggleSave} style={{ marginTop: 10, ...routeGhost }}>
            {saved ? t('native.saved.remove') : t('native.saved.save')}
          </GhostButton>
          <GhostButton data-testid="experience-back" onClick={() => navigate('/home')} style={{ marginTop: 10, ...routeGhost }}>
            {t('native.experience.back')}
          </GhostButton>
        </div>
      </div>
      <NativeCoverageSheet
        open={lockOpen}
        item={hero}
        heroId={hero.id}
        title={hero.title}
        onClose={() => setLockOpen(false)}
      />
    </RouteSurface>
  )
}
