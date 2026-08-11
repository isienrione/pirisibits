import { useEffect } from 'react'
import LegalMarkdown from '../../../components/legal/LegalMarkdown.jsx'
import LegalPageShell from '../../../components/legal/LegalPageShell.jsx'
import { getLegalDocumentSource } from '../../../content/legal/legalDocuments.js'
import { useI18n } from '../../../i18n/I18nProvider.jsx'

export default function LegalTermsPage() {
  const { locale, t } = useI18n()
  const source = getLegalDocumentSource('terms', locale)

  useEffect(() => {
    const previous = document.title
    document.title = t('legal.terms.documentTitle')
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
