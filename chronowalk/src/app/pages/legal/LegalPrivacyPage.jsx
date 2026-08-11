import { useEffect } from 'react'
import LegalMarkdown from '../../../components/legal/LegalMarkdown.jsx'
import LegalPageShell from '../../../components/legal/LegalPageShell.jsx'
import { getLegalDocumentSource } from '../../../content/legal/legalDocuments.js'
import { useI18n } from '../../../i18n/I18nProvider.jsx'

export default function LegalPrivacyPage() {
  const { locale, t } = useI18n()
  const source = getLegalDocumentSource('privacy', locale)

  useEffect(() => {
    const previous = document.title
    document.title = t('legal.privacy.documentTitle')
    return () => {
      document.title = previous
    }
  }, [t])

  return (
    <LegalPageShell>
      <LegalMarkdown source={source} />
    </LegalPageShell>
  )
}
