import { useMemo } from 'react'
import { getWaypointGeo } from '../data/waypointGeo'
import {
  TOUR_PRODUCT_LIST,
  formatUsd,
  getTourIdsForProduct,
  getTourProduct,
} from '../data/tourProducts'
import { getTourById } from '../services/tourRegistry'
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics'
import { BronzeButton, Button, GlassPanel, cn } from './ui'

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
    <ul className="mt-3 space-y-1.5">
      {stops.map((stop, index) => (
        <li key={stop.id} className="flex items-center gap-2 text-sm text-soft-slate">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sand text-[0.65rem] font-bold text-deep-slate">
            {index + 1}
          </span>
          <span>{stop.title}</span>
        </li>
      ))}
    </ul>
  )
}

function TourProductCard({
  product,
  selected,
  unlocked,
  onSelect,
  onPurchase,
}) {
  const isBundle = Boolean(product.includesProductIds?.length)
  const stopCount = isBundle
    ? product.includesProductIds.reduce(
        (total, childId) => total + (getTourProduct(childId)?.stopIds?.length ?? 0),
        0
      )
    : product.stopIds?.length ?? 0

  return (
    <GlassPanel
      className={cn(
        'relative overflow-hidden rounded-3xl p-5 transition',
        selected ? 'border-bronze/45 bg-bronze/[0.04] shadow-plaque-lg' : 'hover:border-bronze/30'
      )}
    >
      {product.badge ? (
        <span className="inline-flex w-fit rounded-full bg-gold/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-gold">
          {product.badge}
        </span>
      ) : null}

      <p className={cn('text-eyebrow uppercase text-bronze', product.badge ? 'mt-3' : '')}>
        {product.tagline}
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold text-deep-slate">{product.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-soft-slate">{product.description}</p>

      <p className="mt-3 text-sm text-soft-slate">
        <span className="font-semibold text-deep-slate">{stopCount} stops</span>
        {product.firstStopTitle ? (
          <>
            <span className="text-limestone"> · </span>
            <span>Starts at {product.firstStopTitle}</span>
          </>
        ) : null}
      </p>

      {isBundle ? (
        <div className="mt-3 space-y-3">
          {product.includesProductIds.map((childId) => {
            const child = getTourProduct(childId)
            if (!child) return null
            return (
              <div key={childId} className="rounded-2xl border border-parchment/70 bg-ivory/70 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-deep-slate">
                  {child.title}
                </p>
                <ProductStopPreview stopIds={child.stopIds} />
              </div>
            )
          })}
        </div>
      ) : (
        <ProductStopPreview stopIds={product.stopIds} />
      )}

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-semibold text-deep-slate">
            {formatUsd(product.priceUsd)}
          </p>
          {product.savingsUsd ? (
            <p className="text-xs text-gold">Save {formatUsd(product.savingsUsd)} vs buying separately</p>
          ) : null}
        </div>

        {unlocked ? (
          <Button
            variant={selected ? 'primary' : 'secondary'}
            onClick={() => {
              triggerHaptic(HAPTIC_KIND.SOFT_TAP)
              onSelect(product)
            }}
          >
            {selected ? 'Selected' : 'Select'}
          </Button>
        ) : (
          <BronzeButton
            onClick={() => {
              triggerHaptic(HAPTIC_KIND.SUCCESS)
              onPurchase(product.id)
            }}
          >
            Buy {formatUsd(product.priceUsd)}
          </BronzeButton>
        )}
      </div>
    </GlassPanel>
  )
}

function TourCatalog({
  selectedTourId,
  ownedTourIds,
  ownsAllTours,
  onSelectTour,
  onPurchaseProduct,
}) {
  const isTourUnlocked = (tourId) => ownsAllTours || ownedTourIds.includes(tourId)

  const isProductUnlocked = (productId) => {
    const tourIds = getTourIdsForProduct(productId)
    return tourIds.length > 0 && tourIds.every((tourId) => isTourUnlocked(tourId))
  }

  const bundleProduct = TOUR_PRODUCT_LIST.find((product) => product.includesProductIds?.length)
  const singleProducts = TOUR_PRODUCT_LIST.filter((product) => !product.includesProductIds?.length)

  const handleSelectProduct = (product) => {
    if (product.includesProductIds?.length) {
      const firstChild = getTourProduct(product.includesProductIds[0])
      if (firstChild?.tourId) onSelectTour(firstChild.tourId)
      return
    }
    if (product.tourId) onSelectTour(product.tourId)
  }

  const renderProductCard = (product) => {
    const tourIds = getTourIdsForProduct(product.id)
    const selected = tourIds.includes(selectedTourId)
    const unlocked = isProductUnlocked(product.id)

    return (
      <TourProductCard
        key={product.id}
        product={product}
        selected={selected}
        unlocked={unlocked}
        onSelect={handleSelectProduct}
        onPurchase={onPurchaseProduct}
      />
    )
  }

  return (
    <section aria-label="Rome tour options" className="space-y-4">
      <div>
        <p className="text-eyebrow uppercase text-bronze">Choose your walk</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-deep-slate">
          Self-guided audio tours at your pace
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-soft-slate">
          Detailed, entertaining walks you can finish in a few hours or spread across different days.
          The Roman Forum tour covers every forum-cluster landmark; the city loop includes the
          Colosseum, Capitoline Hill, and the rest of ancient Rome.
        </p>
      </div>

      {bundleProduct ? (
        <div className="space-y-4">{renderProductCard(bundleProduct)}</div>
      ) : null}

      {singleProducts.length ? (
        <div className="space-y-4 border-t border-parchment/80 pt-6">
          <div>
            <p className="text-eyebrow uppercase text-bronze">Single tours</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-deep-slate">
              One route at a time · {formatUsd(10)} each
            </h3>
          </div>
          <div className="space-y-4">{singleProducts.map(renderProductCard)}</div>
        </div>
      ) : null}
    </section>
  )
}

export function getDefaultSelectableTourId(ownedTourIds, ownsAllTours) {
  if (ownsAllTours) return 'roman-forum'
  if (ownedTourIds.includes('roman-forum')) return 'roman-forum'
  if (ownedTourIds.includes('heart-of-ancient-rome')) return 'heart-of-ancient-rome'
  return null
}

export function resolveActiveTour(tourId, ownedTourIds, ownsAllTours) {
  const tour = tourId ? getTourById(tourId) : null
  if (!tour) return null
  if (ownsAllTours || ownedTourIds.includes(tour.id)) return tour
  return null
}

export default TourCatalog
