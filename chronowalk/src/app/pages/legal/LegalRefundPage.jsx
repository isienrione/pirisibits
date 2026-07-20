import { useEffect } from 'react'
import LegalMarkdown from '../../../components/legal/LegalMarkdown.jsx'
import LegalPageShell from '../../../components/legal/LegalPageShell.jsx'
import refundSource from '../../../content/legal/refund-policy.md?raw'

export default function LegalRefundPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Refund Policy · ChronoWalk'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <LegalPageShell>
      <LegalMarkdown source={refundSource} />
    </LegalPageShell>
  )
}
