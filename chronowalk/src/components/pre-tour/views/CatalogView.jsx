import { TOUR_PRODUCT_LIST, formatUsd } from '../../../data/tourProducts'
import { HAPTIC_KIND, triggerHaptic } from '../../../utils/haptics'
import { BronzeButton, ParchmentCard, SectionHeader, cn, tapAction } from '../../ui'
import { getProductStopCount, isProductUnlocked } from '../catalogUtils'

function CatalogListItem({ product, unlocked, onOpen }) {
  const stopCount = getProductStopCount(product)

  return (
    <ParchmentCard
      as="button"
      type="button"
      onClick={() => {
        triggerHaptic(HAPTIC_KIND.SOFT_TAP)
        onOpen(product.id)
      }}
      className={cn(
        'w-full p-5 text-left transition hover:border-bronze/35 hover:shadow-plaque-lg',
        tapAction
      )}
    >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {product.badge ? (
              <span className="inline-flex rounded-full bg-gold/15 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-gold">
                {product.badge}
              </span>
            ) : null}
            <p className={cn('text-eyebrow uppercase text-bronze', product.badge && 'mt-2')}>
              {product.tagline}
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-deep-slate">{product.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-soft-slate">
              {product.description}
            </p>
            <p className="mt-3 text-sm text-soft-slate">
              <span className="font-semibold text-deep-slate">{stopCount} stops</span>
              {product.firstStopTitle ? (
                <>
                  <span className="text-limestone"> · </span>
                  <span>Starts at {product.firstStopTitle}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-xl font-semibold text-deep-slate">
              {unlocked ? 'Owned' : formatUsd(product.priceUsd)}
            </p>
            <p className="mt-2 text-xs font-semibold text-bronze">View details →</p>
          </div>
        </div>
    </ParchmentCard>
  )
}

export function CatalogView({
  ownedTourIds,
  ownsAllTours,
  onOpenProduct,
  onTryFreePreview,
}) {
  const bundleProduct = TOUR_PRODUCT_LIST.find((product) => product.includesProductIds?.length)
  const singleProducts = TOUR_PRODUCT_LIST.filter((product) => !product.includesProductIds?.length)

  return (
    <div className="space-y-6">
      <SectionHeader
        align="left"
        eyebrow="Rome"
        title="Choose your walk"
        subtitle="Self-guided audio tours at your pace. Tap a tour to see every stop, story, and price."
      />

      <div className="space-y-4">
        {bundleProduct ? (
          <CatalogListItem
            product={bundleProduct}
            unlocked={isProductUnlocked(bundleProduct.id, ownedTourIds, ownsAllTours)}
            onOpen={onOpenProduct}
          />
        ) : null}

        {singleProducts.length ? (
          <>
            <p className="text-eyebrow uppercase text-bronze">Single tours</p>
            {singleProducts.map((product) => (
              <CatalogListItem
                key={product.id}
                product={product}
                unlocked={isProductUnlocked(product.id, ownedTourIds, ownsAllTours)}
                onOpen={onOpenProduct}
              />
            ))}
          </>
        ) : null}
      </div>

      <div className="border-t border-parchment/80 pt-6">
        <p className="text-sm leading-relaxed text-soft-slate">
          Not ready to buy? Walk the Colosseum for free — experience the reconstruction and opening
          audio before unlocking the full tour.
        </p>
        <BronzeButton
          variant="secondary"
          size="lg"
          fullWidth
          className="mt-4"
          onClick={() => {
            triggerHaptic(HAPTIC_KIND.SUCCESS)
            onTryFreePreview()
          }}
        >
          Try for free
        </BronzeButton>
      </div>
    </div>
  )
}

export default CatalogView
