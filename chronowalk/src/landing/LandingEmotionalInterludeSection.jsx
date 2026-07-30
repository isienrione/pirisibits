import CinematicInterlude from './CinematicInterlude.jsx'
import { LANDING_CONTENT } from './landingData.js'
import { LANDING_CINEMATIC_INTERLUDE } from './landingVisualAssets.js'
import './CinematicInterlude.css'

/**
 * Act I - first cinematic interlude (hero → Threshold).
 * Thin wrapper over reusable CinematicInterlude.
 */
export default function LandingEmotionalInterludeSection() {
  const section = LANDING_CONTENT.interlude

  return (
    <CinematicInterlude
      id={section.id}
      lines={[section.line1, section.line2, section.line3]}
      image={LANDING_CINEMATIC_INTERLUDE}
      seam="both"
      parallax
    />
  )
}
