import { useMemo } from 'react'
import { getWaypointGeo } from '../../../data/waypointGeo'
import { formatUsd, getTourProduct } from '../../../data/tourProducts'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { Button, EditorialTitle } from '../../ui'
import { getProductStopCount, isProductUnlocked } from '../catalogUtils'

function ProductStopPreview({ stopIds }) {
  const stops = useMemo(
    () =>
      stopIds.map((id) => ({
        id,
        title: getWaypointGeo(id)?.title ?? id,
      })),
    [stopIds]
  )

  return (
    <ol className="mt-3 space-y-2">
      {stops.map((stop, index) => (
        <li
          key={stop.id}
          className="flex items-center gap-3 rounded-2xl border border-ink800/70 bg-ink900/80 px-3 py-2.5"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink800 text-xs font-bold text-ink900">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-ink900">{stop.title}</span>
        </li>
      ))}
    </ol>
  )
}

export function TourDetailView({
  productId,
  ownedTourIds,
  ownsAllTours,
  onPurchase,
  onBeginJourney,
  onTryFreePreview,
}) {
  const product = getTourProduct(productId)
  if (!product) {
    return (
      <p className="text-sm text-muted">This tour is no longer available.</p>
    )
  }

  const unlocked = isProductUnlocked(product.id, ownedTourIds, ownsAllTours)
  const stopCount = getProductStopCount(product)
  const isBundle = Boolean(product.includesProductIds?.length)

  const handlePurchase = () => {
    triggerHaptic(HAPTIC_KIND.SUCCESS)
    const result = onPurchase(product.id)
    if (result?.ok) {
      onBeginJourney(product.id)
    }
  }

  return (
    <div className="bg-ink900 rounded-card rounded-3xl p-6  sm:p-8">
      {product.badge ? (
        <span className="inline-flex rounded-full bg-ember/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ember">
          {product.badge}
        </span>
      ) : null}

      <EditorialTitle
        eyebrow={product.tagline}
        size="md"
        subtitle={product.description}
        className={product.badge ? 'mt-3' : undefined}
      >
        {product.title}
      </EditorialTitle>

      <p className="mt-4 text-sm text-muted">
        <span className="font-semibold text-ink900">{stopCount} stops</span>
        {product.firstStopTitle ? (
          <>
            <span className="text-muted"> · </span>
            <span>Starts at {product.firstStopTitle}</span>
          </>
        ) : null}
      </p>

      <section className="mt-6 border-t border-ink800/80 pt-6" aria-label="Tour stops">
        <p className="text-eyebrow uppercase text-ember">Included landmarks</p>
        {isBundle ? (
          <div className="mt-4 space-y-4">
            {product.includesProductIds.map((childId) => {
              const child = getTourProduct(childId)
              if (!child) return null
              return (
                <div
                  key={childId}
                  className="rounded-2xl border border-ink800/70 bg-ink800/20 px-4 py-4"
                >
                  <h3 className="font-display text-lg font-semibold text-ink900">{child.title}</h3>
                  <ProductStopPreview stopIds={child.stopIds} />
                </div>
              )
            })}
          </div>
        ) : (
          <ProductStopPreview stopIds={product.stopIds} />
        )}
      </section>

      <section className="mt-8 border-t border-ink800/80 pt-6" aria-label="What's included">
        <p className="text-eyebrow uppercase text-ember">Included</p>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li>GPS-guided walking between landmarks</li>
          <li>Place-aware audio stories on arrival</li>
          <li>Then-and-now visual reconstructions</li>
        </ul>
      </section>

      <div className="mt-8 space-y-3 border-t border-ink800/80 pt-6">
        {unlocked ? (
          <Button size="lg" fullWidth onClick={() => onBeginJourney(product.id)}>
            Begin journey
          </Button>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-3xl font-semibold text-ink900">
                  {formatUsd(product.priceUsd)}
                </p>
                {product.savingsUsd ? (
                  <p className="text-xs text-ember">
                    Save {formatUsd(product.savingsUsd)} vs buying separately
                  </p>
                ) : null}
              </div>
            </div>
            <Button size="lg" fullWidth onClick={handlePurchase}>
              Purchase {formatUsd(product.priceUsd)}
            </Button>
            <Button
              variant="quiet"
              size="lg"
              fullWidth
              onClick={() => {
                triggerHaptic(HAPTIC_KIND.SOFT_TAP)
                onTryFreePreview()
              }}
            >
              Try Colosseum free first
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export default TourDetailView
