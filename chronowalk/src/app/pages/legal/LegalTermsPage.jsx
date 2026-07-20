import { useEffect } from 'react'
import LegalMarkdown from '../../../components/legal/LegalMarkdown.jsx'
import LegalPageShell from '../../../components/legal/LegalPageShell.jsx'
import termsSource from '../../../content/legal/terms-of-service.md?raw'

export default function LegalTermsPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Terms of Service · ChronoWalk'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <LegalPageShell>
      <LegalMarkdown source={termsSource} />
    </LegalPageShell>
  )
}
