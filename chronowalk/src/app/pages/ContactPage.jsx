import { useEffect } from 'react'
import GoldSeam from '../../landing/GoldSeam.jsx'
import LegalPageShell from '../../components/legal/LegalPageShell.jsx'
import { useI18n } from '../../i18n/I18nProvider.jsx'

const SUPPORT_EMAIL = 'support@chronowalk.com'
const LEGAL_NAME = 'Chronowalk'

/**
 * Buyer-support visibility page (Paddle requirement).
 */
export default function ContactPage() {
  const { t } = useI18n()

  useEffect(() => {
    const previous = document.title
    document.title = t('contact.title')
    return () => {
      document.title = previous
    }
  }, [t])

  return (
    <LegalPageShell>
      <div className="cw-legal-doc">
        <h1>{t('contact.h1')}</h1>
        <p>{t('contact.lead')}</p>

        <div style={{ margin: '1.5rem 0' }}>
          <GoldSeam variant="act" />
        </div>

        <div className="cw-legal-contact__card">
          <div className="cw-legal-contact__row">
            <span className="cw-legal-contact__label">{t('contact.supportEmail')}</span>
            <p className="cw-legal-contact__value">
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>
          </div>

          <div className="cw-legal-contact__row">
            <span className="cw-legal-contact__label">{t('contact.responseTime')}</span>
            <p className="cw-legal-contact__value">{t('contact.responseValue')}</p>
          </div>

          <div className="cw-legal-contact__row">
            <span className="cw-legal-contact__label">{t('contact.seller')}</span>
            <p className="cw-legal-contact__value">
              {LEGAL_NAME}
              <br />
              {t('contact.country')}
            </p>
          </div>
        </div>

        <p style={{ marginTop: '1.5rem' }}>{t('contact.paddle')}</p>
      </div>
    </LegalPageShell>
  )
}
