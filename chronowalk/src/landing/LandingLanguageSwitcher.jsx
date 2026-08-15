import { useI18n } from '../i18n/I18nProvider.jsx'
import { SUPPORTED_LOCALES } from '../i18n/locales.js'

/**
 * Compact EN/ES toggle for landing / acquisition headers.
 * Flag + language code so the switcher is easy to find.
 */
export function LandingLanguageControl({
  className = '',
  testId = 'landing-language-control',
}) {
  const { locale, setLocale, labels, t } = useI18n()

  return (
    <div
      className={`cw-lang-switch__control${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={t('landing.nav.languageAria')}
      data-testid={testId}
    >
      {SUPPORTED_LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`cw-lang-switch__option${locale === code ? ' is-active' : ''}`}
          aria-pressed={locale === code}
          aria-label={labels[code] ?? code}
          onClick={() => setLocale(code)}
        >
          <span className="cw-lang-switch__flag" aria-hidden="true">
            {code === 'en' ? '🇬🇧' : '🇪🇸'}
          </span>
          <span className="cw-lang-switch__code">{code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * @deprecated Yellow banner removed — kept as a no-op for any stale imports.
 */
export function LandingLanguageSign() {
  return null
}

/**
 * Standalone language control (acquisition / shared use).
 */
export default function LandingLanguageSwitcher({
  className = '',
  testId = 'landing-language-switcher',
}) {
  return (
    <div className={`cw-lang-switch${className ? ` ${className}` : ''}`} data-testid={testId}>
      <LandingLanguageControl />
    </div>
  )
}
