/**
 * Native-scoped buttons — do not alter redesign PrimaryButton used on web.
 */

import { nativeTapHaptic } from './nativeHaptics.js'

/**
 * @param {{
 *   children: import('react').ReactNode,
 *   onClick?: () => void,
 *   variant?: 'primary' | 'secondary' | 'ghost' | 'terracotta',
 *   disabled?: boolean,
 *   'aria-label'?: string,
 *   className?: string,
 *   type?: 'button' | 'submit',
 *   testId?: string,
 * }} props
 */
export function NativeButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
  testId,
  ...aria
}) {
  return (
    <button
      type={type}
      className={`cw-native-btn cw-native-btn--${variant} ${className}`.trim()}
      disabled={disabled}
      data-testid={testId}
      onClick={() => {
        if (disabled) return
        nativeTapHaptic()
        onClick?.()
      }}
      {...aria}
    >
      {children}
    </button>
  )
}
