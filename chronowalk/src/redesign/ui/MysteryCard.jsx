import { F } from '../tokens.js'
import { PrimaryButton } from './PrimaryButton.jsx'
import { GhostButton } from './GhostButton.jsx'
import { R } from './RouteSurface.jsx'
import { T } from '../tokens.js'

export default function MysteryCard({
  item,
  content,
  flipped = false,
  walkMin = 2,
  experienceMin = 3,
  onTake,
  onReveal,
  onStart,
}) {
  return (
    <div data-testid="mystery-card" data-flipped={flipped ? 'true' : 'false'} style={{ perspective: 1200 }}>
      {!flipped ? (
        <div data-testid="mystery-card-front" style={card}>
          <p style={eyebrow}>✦ Surprise Discovery</p>
          <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, margin: '8px 0' }}>Something almost everyone walks past</h2>
          <p style={{ margin: 0, color: R.muted, lineHeight: 1.5 }}>
            {walkMin} min from your route · ~{experienceMin} min
          </p>
          <p style={{ margin: '14px 0 0', lineHeight: 1.5 }}>There’s something on this street most people walk straight past.</p>
          <PrimaryButton color={T.gold} data-testid="mystery-take" onClick={onTake} style={{ marginTop: 18, minHeight: 48 }}>
            Take me there
          </PrimaryButton>
          <GhostButton data-testid="mystery-reveal" onClick={onReveal} style={{ marginTop: 10, minHeight: 48, color: R.ink, borderColor: R.line, background: 'transparent' }}>
            Reveal what it is
          </GhostButton>
        </div>
      ) : (
        <div data-testid="mystery-card-back" style={card}>
          <div
            style={{
              height: 160,
              borderRadius: 16,
              backgroundImage: content?.photo ? `url(${content.photo})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#E9E2D5',
              marginBottom: 14,
            }}
          />
          <p style={eyebrow}>Worth noticing</p>
          <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, margin: '8px 0' }}>{content?.title || item?.contentId}</h2>
          <p style={{ margin: 0, lineHeight: 1.5 }}>{content?.whyWorthIt}</p>
          <PrimaryButton color={T.gold} data-testid="mystery-start" onClick={onStart} style={{ marginTop: 18, minHeight: 48 }}>
            Take me there
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

const card = {
  background: R.card,
  borderRadius: 20,
  padding: 18,
  boxShadow: '0 12px 40px rgba(26,26,31,0.08)',
}

const eyebrow = {
  margin: 0,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: R.sage,
}
