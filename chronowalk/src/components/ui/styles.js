/** Shared layout and surface tokens for luxury-travel UI cohesion. */
export const pageShell =
  'h-full overflow-y-auto bg-gradient-to-b from-warm-white via-sand/15 to-limestone/10 pb-[calc(5.5rem+var(--audio-bar-inset,0px)+env(safe-area-inset-bottom))] lg:pb-8'

export const pageContainer = 'mx-auto max-w-2xl px-6 pb-safe pt-safe lg:pt-10'

/** Horizontal page gutter — use on full-bleed sections that sit outside PageShell. */
export const pageGutter = 'px-6'

/** Standard inset padding for GlassPanel content blocks. */
export const panelPadding = 'p-5 sm:p-6'

/** Desktop side navigation width. */
export const navInset = '5.5rem'

export const cardSurface =
  'rounded-3xl border border-limestone/70 bg-warm-white/92 shadow-glass backdrop-blur-glass'

export const ctaPrimary = 'rounded-full'

export const ctaInCard = 'rounded-2xl'

/** Micro-label for stats, nav tabs, and HUD metadata. */
export const metaLabel = 'text-eyebrow uppercase'

/** Display typography scale */
export const displayHero =
  'font-display text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.75rem]'

export const displayLg =
  'font-display text-3xl font-semibold leading-tight tracking-tight text-deep-slate'

export const displayMd = 'font-display text-2xl font-semibold leading-tight text-deep-slate'

/** Motion duration tokens (pair with motion-safe:transition-*). */
export const motionFast = 'motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]'

export const motionBase = 'motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]'

export const motionSlow = 'motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]'

export const statusPill =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'

export const statusWalking = 'bg-gold/15 text-gold'

export const statusArrived = 'bg-olive/15 text-olive'

export const statusNeutral = 'bg-sand/80 text-soft-slate'

export const statusLocked = 'bg-sand text-soft-slate'

export const statusCurrent = 'bg-gold/15 text-gold'
