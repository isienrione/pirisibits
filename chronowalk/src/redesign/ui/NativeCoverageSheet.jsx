import { useT } from '../../i18n/I18nProvider.jsx'
import { F, T } from '../tokens.js'
import { GhostButton } from './GhostButton.jsx'
import { PrimaryButton } from './PrimaryButton.jsx'
import { coveringOfferingsForScopes, displayPriceForOffering, ROME_NATIVE_OFFERINGS, ROME_SCOPE_IDS, SCOPE_DISCOVERY_IDS } from '../../content/rome/coverage.js'
import { SCOPE_HERO_IDS } from '../../lib/contentAccess.js'
import { getRomeRegistry, getRegistryItem } from '../../content/rome/registry.js'
import { useNavigate } from 'react-router-dom'

function offeringCounts(scopeId) {
  const registry = getRomeRegistry()
  const heroIds = SCOPE_HERO_IDS[scopeId] || []
  const discoveryIds = SCOPE_DISCOVERY_IDS[scopeId] || []
  const reveals = registry.reveals.filter((item) =>
    (item.unlockScopes || []).includes(scopeId) || heroIds.includes(item.relatedContentIds?.[0]),
  )
  const heroSamples = registry.heroes.filter((item) => heroIds.includes(item.id)).slice(0, 3)
  const discoverySamples = registry.discoveries.filter((item) => discoveryIds.includes(item.id)).slice(0, 3)
  return {
    heroes: heroIds.length,
    discoveries: discoveryIds.length,
    reveals: reveals.length,
    heroSamples,
    discoverySamples,
  }
}

export default function NativeCoverageSheet({
  open,
  item,
  heroId,
  title,
  onClose,
  storeKitProducts = null,
}) {
  const t = useT()
  const navigate = useNavigate()
  if (!open) return null

  const resolved = item || getRegistryItem(heroId) || { id: heroId, title, unlockScopes: [ROME_SCOPE_IDS.ANCIENT] }
  const scopes = resolved?.unlockScopes || [ROME_SCOPE_IDS.ANCIENT]
  const covering = new Set(coveringOfferingsForScopes(scopes).map((offering) => offering.offeringId))
  const list = ROME_NATIVE_OFFERINGS

  return (
    <div
      data-testid="native-unlock-sheet"
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(11,11,13,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <button type="button" aria-label={t('native.unlock.close')} onClick={onClose} style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent' }} />
      <div
        data-testid="native-coverage-preview"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          maxHeight: '88dvh',
          overflowY: 'auto',
          background: T.bone,
          color: T.ink,
          borderRadius: '24px 24px 0 0',
          padding: '22px 22px max(22px, calc(env(safe-area-inset-bottom) + 14px))',
          boxSizing: 'border-box',
        }}
      >
        <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted, fontFamily: F.body }}>
          {t('native.unlock.eyebrow')}
        </p>
        <h2 style={{ margin: '8px 0 10px', fontFamily: F.display, fontSize: 26, fontWeight: 400 }}>
          {t('native.coverage.headline')}
        </h2>
        <p style={{ margin: '0 0 16px', fontFamily: F.body, fontSize: 15, lineHeight: 1.5, color: T.muted }}>
          {resolved?.title ? t('native.coverage.includesItem', { title: resolved.title }) : t('native.coverage.body')}
        </p>
        <div
          data-testid="native-coverage-map"
          aria-hidden="true"
          style={{
            height: 92,
            borderRadius: 16,
            marginBottom: 16,
            background: 'linear-gradient(180deg, #1A1A1F 0%, #2A2A22 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <span style={{ position: 'absolute', left: '18%', top: '38%', width: 86, height: 36, borderRadius: 18, background: 'rgba(212,175,55,0.35)' }} />
          <span style={{ position: 'absolute', left: '42%', top: '22%', width: 110, height: 48, borderRadius: 22, background: 'rgba(78,155,143,0.35)' }} />
        </div>
        {list.map((offering, index) => {
          const counts = offeringCounts(offering.unlockScopeId)
          const price = displayPriceForOffering(offering, storeKitProducts?.[offering.appleProductId])
          return (
            <section
              key={offering.offeringId}
              data-testid={`native-coverage-offer-${offering.offeringId}`}
              data-covers-item={covering.has(offering.offeringId) ? 'true' : 'false'}
              style={{ marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid rgba(26,26,31,0.08)' }}
            >
              <h3 style={{ margin: 0, fontFamily: F.display, fontSize: 22, fontWeight: 400 }}>{offering.displayName}</h3>
              <p style={{ margin: '6px 0 8px', color: T.muted, lineHeight: 1.45 }}>{offering.tagline}</p>
              <p data-testid={`native-coverage-price-${offering.offeringId}`} data-price-source={price.source} style={{ margin: '0 0 8px', fontWeight: 600 }}>
                {price.label}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
                {t('native.coverage.counts', {
                  heroes: counts.heroes,
                  discoveries: counts.discoveries,
                  reveals: counts.reveals,
                })}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>
                {counts.heroSamples.map((sample) => sample.title).join(' · ')}
              </p>
              <p style={{ margin: '4px 0 10px', fontSize: 13, color: T.muted }}>
                {counts.discoverySamples.map((sample) => sample.title).join(' · ')}
              </p>
              <PrimaryButton
                disabled
                color={T.gold}
                data-testid={index === 0 ? 'native-unlock-purchase' : `native-coverage-buy-${offering.offeringId}`}
                data-price-source={price.source}
                style={{ minHeight: 48 }}
              >
                {t('native.unlock.purchase')}
              </PrimaryButton>
            </section>
          )
        })}
        <GhostButton
          data-testid="native-coverage-restore"
          disabled
          style={{ minHeight: 48, color: T.ink, borderColor: `${T.muted}66`, background: 'transparent' }}
        >
          {t('native.coverage.restore')}
        </GhostButton>
        <GhostButton
          data-testid="native-coverage-claim"
          onClick={() => {
            onClose?.()
            navigate('/access')
          }}
          style={{ marginTop: 10, minHeight: 48, color: T.ink, borderColor: `${T.muted}66`, background: 'transparent' }}
        >
          {t('native.coverage.claim')}
        </GhostButton>
        <GhostButton
          data-testid="native-unlock-dismiss"
          onClick={onClose}
          style={{ marginTop: 10, minHeight: 48, color: T.ink, borderColor: `${T.muted}66`, background: 'transparent' }}
        >
          {t('native.unlock.notNow')}
        </GhostButton>
      </div>
    </div>
  )
}
