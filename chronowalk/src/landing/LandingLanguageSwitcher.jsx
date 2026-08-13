import { useI18n } from '../i18n/I18nProvider.jsx'
import { SUPPORTED_LOCALES } from '../i18n/locales.js'

/**
 * Compact EN/ES toggle for landing / acquisition headers.
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
          onClick={() => setLocale(code)}
        >
          <span className="cw-lang-switch__flag" aria-hidden="true">
            {code === 'en' ? '🇬🇧' : '🇪🇸'}
          </span>
          <span className="cw-lang-switch__code">{code.toUpperCase()}</span>
          <span className="cw-lang-switch__label">{labels[code] ?? code}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Always-visible bilingual audio notice under the header row.
 */
export function LandingLanguageSign({ className = '' }) {
  const { t } = useI18n()

  return (
    <p className={`cw-lang-switch__sign${className ? ` ${className}` : ''}`} role="status">
      <span className="cw-lang-switch__flags" aria-hidden="true">
        🇬🇧 🇪🇸
      </span>
      <span className="cw-lang-switch__sign-text">{t('landing.nav.languageSign')}</span>
      <span className="cw-lang-switch__sign-text-short">
        {t('landing.nav.languageSignShort')}
      </span>
    </p>
  )
}

/**
 * Control + sign stacked (acquisition headers and standalone use).
 */
export default function LandingLanguageSwitcher({
  className = '',
  testId = 'landing-language-switcher',
}) {
  return (
    <div className={`cw-lang-switch${className ? ` ${className}` : ''}`} data-testid={testId}>
      <LandingLanguageControl />
      <LandingLanguageSign />
    </div>
  )
}
