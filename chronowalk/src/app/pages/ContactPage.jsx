import { useEffect } from 'react'
import GoldSeam from '../../landing/GoldSeam.jsx'
import LegalPageShell from '../../components/legal/LegalPageShell.jsx'

const SUPPORT_EMAIL = 'support@chronowalk.com'
const RESPONSE_TIME = 'within 3 business days'
const LEGAL_NAME = 'Chronowalk'

/**
 * Buyer-support visibility page (Paddle requirement).
 */
export default function ContactPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Contact · ChronoWalk'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <LegalPageShell>
      <div className="cw-legal-doc">
        <h1>Contact</h1>
        <p>
          Questions about ChronoWalk, your purchase, access, or a refund? Reach us using the details
          below. We are based in Chile.
        </p>

        <div style={{ margin: '1.5rem 0' }}>
          <GoldSeam variant="act" />
        </div>

        <div className="cw-legal-contact__card">
          <div className="cw-legal-contact__row">
            <span className="cw-legal-contact__label">Support email</span>
            <p className="cw-legal-contact__value">
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>
          </div>

          <div className="cw-legal-contact__row">
            <span className="cw-legal-contact__label">Expected response time</span>
            <p className="cw-legal-contact__value">{RESPONSE_TIME}</p>
          </div>

          <div className="cw-legal-contact__row">
            <span className="cw-legal-contact__label">Seller legal name</span>
            <p className="cw-legal-contact__value">
              {LEGAL_NAME}
              <br />
              Chile
            </p>
          </div>
        </div>

        <p style={{ marginTop: '1.5rem' }}>
          Payments are processed by Paddle.com as Merchant of Record. For billing questions you may
          also contact Paddle support via paddle.net.
        </p>
      </div>
    </LegalPageShell>
  )
}
