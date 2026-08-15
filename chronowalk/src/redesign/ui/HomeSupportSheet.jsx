import { F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

export const SUPPORT_EMAIL = 'support@chronowalk.com'

export function supportMailtoHref() {
  const subject = encodeURIComponent('ChronoWalk support')
  const body = encodeURIComponent(
    'Hi ChronoWalk support,\n\nI need help with:\n\n\nDevice / browser:\nTour / stop (if known):\n',
  )
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
}

/**
 * Lightweight support explainer — email is the channel; the link opens mail.
 */
export default function HomeSupportSheet({ open, onClose }) {
  const t = useT()
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-support-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'grid',
        placeItems: 'end center',
        background: 'rgba(11,11,13,0.55)',
        padding: '16px 16px calc(16px + var(--shell-tab-bar-height, 3.15rem))',
      }}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
        <div
          style={{
            width: 'min(420px, 100%)',
            borderRadius: 20,
            background: '#FFFDF8',
            padding: '22px 20px 18px',
            boxShadow: '0 -8px 40px rgba(11,11,13,0.28)',
            fontFamily: F.body,
            border: '1px solid #E6DCCE',
          }}
          onClick={(event) => event.stopPropagation()}
        >
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#C45C2A',
            fontWeight: 600,
          }}
        >
          {t('home.support.eyebrow')}
        </p>
        <h2
          id="home-support-title"
          style={{
            margin: '0 0 10px',
            fontFamily: F.display,
            fontSize: 26,
            fontWeight: 400,
            color: '#2C2823',
            lineHeight: 1.15,
          }}
        >
          {t('home.support.title')}
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.55, color: '#5A534A' }}>
          {t('home.support.body')}
        </p>
        <a
          href={supportMailtoHref()}
          style={{
            display: 'block',
            textAlign: 'center',
            textDecoration: 'none',
            padding: '14px 16px',
            borderRadius: 12,
            background: '#C45C2A',
            color: '#fff',
            fontWeight: 650,
            fontSize: 15,
            marginBottom: 10,
          }}
        >
          {t('home.support.emailCta', { email: SUPPORT_EMAIL })}
        </a>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            background: 'transparent',
            color: '#7A7266',
            fontFamily: F.body,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {t('home.support.close')}
        </button>
      </div>
    </div>
  )
}
