import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadRomeManifest } from '../../content/manifest.js'
import { getRomeHeroCatalog } from '../../content/rome/heroCatalog.js'
import { COVERAGE_LABELS } from '../../content/rome/heroRecommendationMeta.js'
import { canAccessHero } from '../../lib/contentAccess.js'
import { hasValidLocalAccess } from '../../lib/accessSession.js'
import { readGuestContext, writeGuestLocation } from '../../lib/guestSession.js'
import { getLocationFix, LOCATION_STATUS } from '../../lib/locationAccess.js'
import { startHeroExperience } from '../../lib/heroExperience.js'
import { discoverCards, rankHeroes } from '../../lib/rankHeroes.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { getJourneySnapshot } from '../../state/journey.js'
import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from '../ui/GhostButton.jsx'
import { PrimaryButton } from '../ui/PrimaryButton.jsx'
import NativeUnlockSheet from '../ui/NativeUnlockSheet.jsx'

function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  return hours === 1 ? '1 hour' : `${hours} hours`
}

function formatDistance(distanceM) {
  if (!Number.isFinite(distanceM)) return null
  if (distanceM < 1000) return `${Math.round(distanceM)} m`
  return `${(distanceM / 1000).toFixed(1)} km`
}

function lockLabel(hero) {
  if (!hero.locked) return COVERAGE_LABELS['rome-free']
  const paid = (hero.unlockScopes || []).find((scope) => scope !== 'rome-free')
  return COVERAGE_LABELS[paid] || 'Locked'
}

function ExperienceCard({ hero, primary, onOpen, onStart }) {
  const t = useT()
  return (
    <article
      data-testid={primary ? 'discover-primary-card' : `discover-alt-card-${hero.heroId}`}
      style={{
        borderRadius: primary ? 20 : 16,
        overflow: 'hidden',
        background: T.charcoal,
        marginBottom: primary ? 16 : 12,
      }}
    >
      <button
        type="button"
        onClick={() => onOpen(hero)}
        style={{
          display: 'block',
          width: '100%',
          border: 'none',
          padding: 0,
          background: 'transparent',
          textAlign: 'left',
          color: T.bone,
        }}
      >
        <div
          style={{
            height: primary ? 210 : 128,
            backgroundImage: hero.photo ? `url(${hero.photo})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#1a1a1f',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              padding: '5px 10px',
              borderRadius: 999,
              background: hero.locked ? 'rgba(11,11,13,0.72)' : T.gold,
              color: hero.locked ? T.bone : T.obsidian,
              fontFamily: F.body,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {lockLabel(hero)}
          </span>
        </div>
        <div style={{ padding: primary ? '16px 16px 8px' : '12px 14px 8px' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: F.display,
              fontSize: primary ? 26 : 20,
              fontWeight: 400,
              lineHeight: 1.2,
            }}
          >
            {hero.title}
          </h2>
          <p style={{ margin: '8px 0 0', color: 'rgba(250,246,239,0.78)', fontSize: primary ? 15 : 14, lineHeight: 1.4 }}>
            {hero.whyWorthIt}
          </p>
          <p style={{ margin: '10px 0 0', color: T.muted, fontSize: 13 }}>
            {[formatDistance(hero.distanceM), formatDuration(hero.timeCostMin), hero.whyReasons?.[1]]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </button>
      {primary ? (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <PrimaryButton color={T.gold} data-testid="discover-start" onClick={() => onStart(hero)} style={{ minHeight: 48 }}>
            {hero.locked ? t('native.discover.view') : t('native.discover.start')}
          </PrimaryButton>
          <GhostButton data-testid="discover-view" onClick={() => onOpen(hero)} style={{ minHeight: 44 }}>
            {t('native.discover.view')}
          </GhostButton>
        </div>
      ) : null}
    </article>
  )
}

export default function NativeDiscoverHome() {
  const t = useT()
  const navigate = useNavigate()
  const guest = readGuestContext()
  const [position, setPosition] = useState(guest.lastPosition)
  const [lockHero, setLockHero] = useState(null)
  const impressed = useRef(false)

  const catalog = useMemo(() => getRomeHeroCatalog(loadRomeManifest()), [])
  const completedIds = getJourneySnapshot()?.context?.completedWaypointIds ?? []

  const ranked = useMemo(
    () =>
      rankHeroes({
        catalog,
        context: guest,
        position,
        canAccess: (id) => canAccessHero(id),
        completedIds,
      }),
    [catalog, completedIds, guest, position],
  )

  const { primary, alternatives } = discoverCards(ranked)

  useEffect(() => {
    track(TRACK_EVENTS.DISCOVER_VIEWED, { city: 'rome' })
  }, [])

  useEffect(() => {
    if (impressed.current || !primary) return
    impressed.current = true
    track(TRACK_EVENTS.RECOMMENDATION_IMPRESSION, {
      primary: primary.heroId,
      alternatives: alternatives.map((item) => item.heroId),
    })
  }, [alternatives, primary])

  useEffect(() => {
    let cancelled = false
    void getLocationFix({ timeoutMs: 8000 }).then((result) => {
      if (cancelled) return
      if (result.status === LOCATION_STATUS.SUCCESS && result.position) {
        setPosition(result.position)
        writeGuestLocation(result.position, 'granted')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const openHero = (hero) => {
    track(TRACK_EVENTS.RECOMMENDATION_OPENED, { hero_id: hero.heroId, locked: hero.locked })
    if (hero.locked) track(TRACK_EVENTS.LOCKED_EXPERIENCE_OPENED, { hero_id: hero.heroId })
    navigate(`/experience/${hero.heroId}`)
  }

  const startHero = (hero) => {
    const result = startHeroExperience(hero.heroId, { navigate })
    if (!result.ok && result.reason === 'locked') {
      setLockHero(hero)
    }
  }

  return (
    <div
      data-testid="native-discover"
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.bone,
        padding:
          'max(20px, calc(env(safe-area-inset-top) + 12px)) 20px calc(var(--shell-tab-bar-height, 72px) + 12px)',
        boxSizing: 'border-box',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>
        ChronoWalk · Rome
      </p>
      <p style={{ margin: '8px 0 0', color: 'rgba(250,246,239,0.7)', fontSize: 14 }}>
        {position ? t('native.discover.status.located') : t('native.discover.status.browse')}
      </p>
      <h1
        style={{
          fontFamily: F.display,
          fontWeight: 400,
          fontSize: 30,
          margin: '18px 0 18px',
          lineHeight: 1.15,
        }}
      >
        {t('native.discover.headline')}
      </h1>

      {primary ? (
        <ExperienceCard hero={primary} primary onOpen={openHero} onStart={startHero} />
      ) : null}
      {alternatives.map((hero) => (
        <ExperienceCard key={hero.heroId} hero={hero} onOpen={openHero} onStart={startHero} />
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <GhostButton data-testid="discover-see-all" onClick={() => navigate(hasValidLocalAccess() ? '/tour' : '/explore')} style={{ minHeight: 48 }}>
          {t('native.discover.seeAll')}
        </GhostButton>
        <GhostButton data-testid="discover-map" onClick={() => navigate('/map')} style={{ minHeight: 48 }}>
          {t('native.discover.map')}
        </GhostButton>
      </div>

      <NativeUnlockSheet
        open={Boolean(lockHero)}
        heroId={lockHero?.heroId}
        title={lockHero?.title}
        onClose={() => setLockHero(null)}
      />
    </div>
  )
}
