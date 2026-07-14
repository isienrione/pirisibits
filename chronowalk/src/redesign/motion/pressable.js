/**
 * Semantic classnames for pressable feedback — use instead of ad-hoc transitions.
 * Pairs with `.cw-motion-pressable` in redesign.css / tokens.
 */
export function pressableClassName(extra = '') {
  return ['cw-motion-pressable', extra].filter(Boolean).join(' ')
}
