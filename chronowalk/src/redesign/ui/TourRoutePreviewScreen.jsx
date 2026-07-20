import { SHELL_TAB_BAR_INSET } from '../tokens.js'
import { PrimaryButton } from './index.js'
import BackNavButton from './BackNavButton.jsx'
import TourRoutePreviewPanel from './TourRoutePreviewPanel.jsx'

/**
 * Full-screen tour route preview — illustrated roadmap is the hero.
 */
export default function TourRoutePreviewScreen({
  manifest,
  loading = false,
  context,
  onContinue,
  onBack,
  busy = false,
  continueLabel = 'Continue',
  footerNote = null,
  testId = 'tour-route-preview',
}) {
  return (
    <div className="cw-grain cw-route-preview-screen" data-testid={testId}>
      {onBack ? (
        <div
          style={{
            position: 'absolute',
            top: 'max(8px, env(safe-area-inset-top))',
            left: 'max(12px, env(safe-area-inset-left))',
            zIndex: 20,
          }}
        >
          <BackNavButton variant="inline" label="Back" onClick={onBack} />
        </div>
      ) : null}
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
