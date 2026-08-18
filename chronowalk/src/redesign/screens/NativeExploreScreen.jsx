import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadRomeManifest } from '../../content/manifest.js'
import { getRomeHeroCatalog } from '../../content/rome/heroCatalog.js'
import { canAccessHero } from '../../lib/contentAccess.js'
import { COVERAGE_LABELS } from '../../content/rome/heroRecommendationMeta.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { F, T } from '../tokens.js'

export default function NativeExploreScreen() {
  const navigate = useNavigate()
  const catalog = useMemo(() => getRomeHeroCatalog(loadRomeManifest()), [])

  return (
    <div
      data-testid="native-explore"
      style={{
        minHeight: '100%',
        background: T.obsidian,
        color: T.bone,
        padding:
          'max(20px, calc(env(safe-area-inset-top) + 12px)) 20px calc(var(--shell-tab-bar-height, 72px) + 12px)',
      }}
    >
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.muted }}>
        ChronoWalk · Rome
      </p>
      <h1 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 30, margin: '12px 0 18px' }}>All Rome</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {catalog.map((hero) => {
          const locked = !canAccessHero(hero.heroId)
          const label = locked
            ? COVERAGE_LABELS[(hero.unlockScopes || []).find((scope) => scope !== 'rome-free')] || 'Locked'
            : 'Free'
          return (
            <button
              key={hero.heroId}
              type="button"
              data-testid={`explore-hero-${hero.heroId}`}
              onClick={() => {
                track(TRACK_EVENTS.RECOMMENDATION_OPENED, { hero_id: hero.heroId, source: 'explore' })
                navigate(`/experience/${hero.heroId}`)
              }}
              style={{
                minHeight: 64,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                borderRadius: 14,
                border: '1px solid rgba(250,246,239,0.12)',
                background: 'rgba(250,246,239,0.04)',
                color: T.bone,
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  backgroundImage: hero.photo ? `url(${hero.photo})` : 'none',
                  backgroundSize: 'cover',
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontFamily: F.display, fontWeight: 400, fontSize: 18 }}>
                  {hero.title}
                </strong>
                <span style={{ color: T.muted, fontSize: 13 }}>
                  {label} · {hero.timeCostMin} min
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
