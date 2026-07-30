/**
 * Restrained horizontal Gold Seam — act transitions and cinematic breaks.
 * Felt more than noticed; no breathe/scroll-jack. Glow drops under reduced motion via CSS.
 */
export default function GoldSeam({ className = '', variant = 'act' }) {
  return (
    <div
      className={`cw-gold-seam cw-gold-seam--${variant}${className ? ` ${className}` : ''}`.trim()}
      aria-hidden="true"
      data-gold-seam={variant}
    />
  )
}
