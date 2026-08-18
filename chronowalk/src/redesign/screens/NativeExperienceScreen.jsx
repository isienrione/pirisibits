import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadRomeManifest } from '../../content/manifest.js'
import { getRomeHeroCatalog } from '../../content/rome/heroCatalog.js'
import { COVERAGE_LABELS } from '../../content/rome/heroRecommendationMeta.js'
import { canAccessHero } from '../../lib/contentAccess.js'
import { startHeroExperience } from '../../lib/heroExperience.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import NativeUnlockSheet from '../ui/NativeUnlockSheet.jsx'

export default function NativeExperienceScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { heroId } = useParams()
  const [lockOpen, setLockOpen] = useState(false)

  const hero = useMemo(() => {
    const catalog = getRomeHeroCatalog(loadRomeManifest())
    return catalog.find((item) => item.heroId === heroId) ?? null
  }, [heroId])

  if (!hero) {
    return <p style={{ color: T.bone, padding: 24 }}>Experience unavailable.</p>
  }

  const locked = !canAccessHero(hero.heroId)
  const label = locked
    ? COVERAGE_LABELS[(hero.unlockScopes || []).find((scope) => scope !== 'rome-free')] || 'Locked'
    : COVERAGE_LABELS['rome-free']

  const handleStart = () => {
    if (locked) {
      track(TRACK_EVENTS.LOCKED_EXPERIENCE_OPENED, { hero_id: hero.heroId })
      setLockOpen(true)
      return
    }
    startHeroExperience(hero.heroId, { navigate })
  }

  return (
    <div
      data-testid="native-experience"
      data-hero-id={hero.heroId}
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.bone,
        paddingBottom: 'calc(var(--shell-tab-bar-height, 72px) + 12px)',
      }}
    >
      <div
        style={{
          height: 280,
          backgroundImage: hero.photo ? `url(${hero.photo})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted }}>
          {label} · {hero.timeCostMin} min
        </p>
        <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 32, margin: '10px 0' }}>{hero.title}</h1>
        <p style={{ margin: '0 0 24px', lineHeight: 1.5, color: 'rgba(250,246,239,0.82)' }}>{hero.whyWorthIt}</p>
        <PrimaryButton color={T.gold} data-testid="experience-start" onClick={handleStart} style={{ minHeight: 48 }}>
          {locked ? t('native.experience.unlock') : t('native.experience.start')}
        </PrimaryButton>
        <GhostButton data-testid="experience-back" onClick={() => navigate('/home')} style={{ marginTop: 10, minHeight: 48 }}>
          {t('native.experience.back')}
        </GhostButton>
      </div>
      <NativeUnlockSheet
        open={lockOpen}
        heroId={hero.heroId}
        title={hero.title}
        onClose={() => setLockOpen(false)}
      />
    </div>
  )
}
