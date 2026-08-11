import { useT } from '../../i18n/I18nProvider.jsx'

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
  const t = useT()
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
        {t('consent.immediate')}
      </label>
    </div>
  )
}
