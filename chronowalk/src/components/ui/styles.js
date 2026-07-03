/** Shared layout and surface tokens — DESIGN LAW compliant. */
export const pageShell =
  'h-full overflow-y-auto pb-[calc(5.5rem+var(--audio-bar-inset,0px)+env(safe-area-inset-bottom))] lg:pb-8'

export const pageContainer = 'mx-auto max-w-2xl px-6 pb-safe pt-safe lg:pt-10'

export const pageShellStyle = {
  background: 'var(--bone)',
  color: 'var(--ink)',
  fontFamily: 'var(--font-ui)',
}

export const cardSurface =
  'rounded-[var(--r-card)] border border-[color:var(--border-daylight)] bg-[color:var(--bone)]'

export const cardSurfaceStyle = {
  background: 'var(--bone)',
  borderColor: 'var(--border-daylight)',
  borderRadius: 'var(--r-card)',
  boxShadow: 'var(--shadow-card)',
}

export const immersionSurfaceStyle = {
  background: 'var(--obsidian)',
  color: 'var(--warm-white)',
  borderColor: 'var(--border-immersion)',
}

export const ctaPrimary = 'rounded-full'

export const ctaInCard = 'rounded-2xl'

/** Micro-label for stats, nav tabs, and HUD metadata. */
export const metaLabel =
  'text-[0.65rem] font-semibold uppercase tracking-[0.14em]'

export const statusPill =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'

export const statusWalking = 'bg-[color-mix(in_srgb,var(--ember)_15%,var(--bone))] text-[color:var(--ember)]'

export const statusArrived = 'bg-[color-mix(in_srgb,var(--verdigris)_15%,var(--bone))] text-[color:var(--verdigris)]'

export const statusNeutral =
  'bg-[color-mix(in_srgb,var(--ink)_8%,var(--bone))] text-[color:var(--ink-muted)]'

export const statusLocked = 'bg-[color-mix(in_srgb,var(--ink)_6%,var(--bone))] text-[color:var(--ink-muted)]'

export const statusCurrent =
  'bg-[color-mix(in_srgb,var(--accent)_12%,var(--bone))] text-[color:var(--accent)]'
