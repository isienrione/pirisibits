/** Shared layout and surface tokens for luxury-travel UI cohesion. */
export const pageShell =
  'h-full overflow-y-auto bg-gradient-to-b from-warm-white via-sand/15 to-limestone/10 pb-[calc(5.5rem+var(--audio-bar-inset,0px)+env(safe-area-inset-bottom))] lg:pb-8'

export const pageContainer = 'mx-auto max-w-2xl px-6 pb-safe pt-safe lg:pt-10'

export const cardSurface =
  'rounded-3xl border border-limestone/70 bg-warm-white/92 shadow-glass backdrop-blur-glass'

export const ctaPrimary = 'rounded-full'

export const ctaInCard = 'rounded-2xl'

/** Micro-label for stats, nav tabs, and HUD metadata. */
export const metaLabel =
  'text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-caption'

/** Eyebrow label on light surfaces — meets AA against warm-white. */
export const eyebrowOnLight = 'text-eyebrow uppercase text-gold-text'

/** Secondary caption copy on light surfaces. */
export const bodyCaption = 'text-xs leading-relaxed text-caption'

/** Fine print on light surfaces (footer notes, helper text). */
export const fineCaption = 'text-[0.7rem] leading-relaxed text-caption sm:text-xs'

export const statusPill =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'

export const statusWalking = 'bg-gold/15 text-gold-text'

export const statusArrived = 'bg-olive/15 text-olive'

export const statusNeutral = 'bg-sand/80 text-caption'

export const statusLocked = 'bg-sand text-caption'

export const statusCurrent = 'bg-gold/15 text-gold-text'
