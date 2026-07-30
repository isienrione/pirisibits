import { SHELL_TAB_BAR_INSET } from '../tokens.js'
import { PrimaryButton } from './index.js'
import TourRoutePreviewPanel from './TourRoutePreviewPanel.jsx'

/**
 * Full-screen tour route preview - illustrated roadmap is the hero.
 */
export default function TourRoutePreviewScreen({
  manifest,
  loading = false,
  context,
  onContinue,
  busy = false,
  continueLabel = 'Continue',
  footerNote = null,
  testId = 'tour-route-preview',
}) {
  return (
    <div className="cw-grain cw-route-preview-screen" data-testid={testId}>
      <TourRoutePreviewPanel manifest={manifest} loading={loading} context={context} subtitle={null} />

      <footer
        className="cw-route-preview-screen__footer"
        style={{ paddingBottom: SHELL_TAB_BAR_INSET }}
      >
        {footerNote ? <p className="cw-route-preview-screen__note">{footerNote}</p> : null}
        <PrimaryButton onClick={onContinue} disabled={busy}>
          {busy ? 'Loading…' : continueLabel}
        </PrimaryButton>
      </footer>
    </div>
  )
}
