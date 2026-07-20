import { useEffect } from 'react'
import LegalMarkdown from '../../../components/legal/LegalMarkdown.jsx'
import LegalPageShell from '../../../components/legal/LegalPageShell.jsx'
import privacySource from '../../../content/legal/privacy-policy.md?raw'

export default function LegalPrivacyPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Privacy Policy · ChronoWalk'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <LegalPageShell>
      <LegalMarkdown source={privacySource} />
    </LegalPageShell>
  )
}
