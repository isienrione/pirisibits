import { T, F, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { PrimaryButton } from './index.js'
import TourRoutePreviewPanel from './TourRoutePreviewPanel.jsx'

/**
 * Full-screen tour route preview — shown after choosing a tour, before setup begins.
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
    <div
      className="cw-grain redesign-app-shell"
      data-testid={testId}
      style={{
        minHeight: '100%',
        background: T.bone,
        fontFamily: F.body,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <TourRoutePreviewPanel manifest={manifest} loading={loading} context={context} />

      <div
        style={{
          flexShrink: 0,
          padding: `16px 24px ${SHELL_TAB_BAR_INSET}`,
          borderTop: `1px solid ${T.muted}28`,
          background: T.bone,
        }}
      >
        {footerNote ? (
          <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', marginBottom: 14, lineHeight: 1.5 }}>
            {footerNote}
          </p>
        ) : null}
        <PrimaryButton onClick={onContinue} disabled={busy}>
          {busy ? 'Loading…' : continueLabel}
        </PrimaryButton>
      </div>
    </div>
  )
}
