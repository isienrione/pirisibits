/** Shared surface tokens for light (in-tour) vs dark (cinematic) shells. */
export const themeShell = {
  light: {
    page: 'bg-gradient-to-b from-ivory via-parchment/20 to-limestone/15 text-deep-slate',
    card: 'rounded-3xl border border-parchment/80 bg-ivory shadow-plaque',
    eyebrow: 'text-bronze',
    title: 'text-deep-slate',
    body: 'text-soft-slate',
    ctaPrimary: 'bronze',
    ctaSecondary: 'secondary',
  },
  dark: {
    page: 'bg-obsidian text-ivory',
    card: 'rounded-3xl border border-gold/25 bg-gradient-to-b from-[#2a2a2a] via-obsidian to-obsidian shadow-plaque-lg',
    eyebrow: 'text-gold',
    title: 'text-ivory',
    body: 'text-ivory/80',
    ctaPrimary: 'gold',
    ctaSecondary: 'outline-dark',
  },
}

export function getThemeShell(theme = 'light') {
  return themeShell[theme] ?? themeShell.light
}
