import { IMMEDIATE_ACCESS_CONSENT_LABEL } from './immediateAccessConsent.js'

/**
 * Unchecked-by-default consent required before digital-content checkout.
 * Buy / continue button must stay disabled until `checked` is true.
 */
export default function ImmediateAccessConsent({
  id = 'immediate-access-consent',
  checked,
  onChange,
  className = '',
  dark = false,
}) {
  return (
    <div className={`cw-consent${dark ? ' cw-consent--on-dark' : ''}${className ? ` ${className}` : ''}`.trim()}>
      <input
        id={id}
        className="cw-consent__input"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id} className="cw-consent__label">
        {IMMEDIATE_ACCESS_CONSENT_LABEL}
      </label>
    </div>
  )
}
