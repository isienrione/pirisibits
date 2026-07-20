import { useEffect, useState } from 'react'
import { getLaunchTranscriptParagraphs } from '../content/launchStoryTranscripts'
import {
  attachParagraphProgress,
  loadTranscriptContent,
  splitTranscriptParagraphs,
} from '../utils/transcriptContent'

/**
 * @param {{ id?: string, transcript?: string }} stop
 */
export function useTranscriptDocument(stop) {
  const [paragraphs, setParagraphs] = useState(() => getLaunchTranscriptParagraphs(stop))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setParagraphs(getLaunchTranscriptParagraphs(stop))

      if (!stop?.transcript) return

      setLoading(true)
      const text = await loadTranscriptContent(stop.transcript)

      if (cancelled) return

      if (text) {
        const parsed = splitTranscriptParagraphs(text)
        if (parsed.length) {
          setParagraphs(attachParagraphProgress(parsed))
        }
      }

      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [stop])

  return { paragraphs, loading }
}

export default useTranscriptDocument
