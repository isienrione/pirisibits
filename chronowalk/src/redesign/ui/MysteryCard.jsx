import { F, T } from '../tokens.js'
import { PrimaryButton } from './PrimaryButton.jsx'
import { GhostButton } from './GhostButton.jsx'
import { R, routeCard, routeGhost, routePrimary, routeType } from './RouteSurface.jsx'

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
    <div
      data-testid="mystery-card"
      data-flipped={flipped ? 'true' : 'false'}
      aria-label={flipped ? content?.title : 'A hidden detail'}
      style={{ perspective: 1200 }}
    >
      <style>{`
        @keyframes cwMysteryReveal {
          from { transform: rotateY(-86deg); opacity: 0.55; }
          to { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>
      {!flipped ? (
        <div data-testid="mystery-card-front" style={frontCard}>
          <p style={{ ...routeType, color: R.violet }}>✦ A hidden detail</p>
          <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, margin: '8px 0', color: R.ink }}>
            A hidden detail
          </h2>
          <p style={{ margin: 0, color: R.muted, lineHeight: 1.5, fontFamily: F.body }}>
            {Number(walkMin) > 0 ? `${walkMin} min from your route · ~${experienceMin} min` : `~${experienceMin} min`}
          </p>
          <p style={{ margin: '14px 0 0', lineHeight: 1.5, fontFamily: F.body, color: R.ink }}>
            There’s something on this street most people walk straight past.
          </p>
          <PrimaryButton color={T.gold} data-testid="mystery-take" onClick={onTake} style={{ marginTop: 18, ...routePrimary }}>
            Take me there
          </PrimaryButton>
          <GhostButton data-testid="mystery-reveal" onClick={onReveal} style={{ marginTop: 10, ...routeGhost }}>
            Reveal what it is
          </GhostButton>
        </div>
      ) : (
        <div data-testid="mystery-card-back" style={backCard}>
          <div
            style={{
              height: 160,
              borderRadius: 16,
              backgroundImage: content?.photo ? `url(${content.photo})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: R.line,
              marginBottom: 14,
            }}
          />
          <p style={routeType}>Worth noticing</p>
          <h2 style={{ fontFamily: F.display, fontWeight: 400, fontSize: 28, margin: '8px 0', color: R.ink }}>
            {content?.title || item?.contentId}
          </h2>
          <p style={{ margin: 0, lineHeight: 1.5, fontFamily: F.body, color: R.ink }}>{content?.whyWorthIt}</p>
          <PrimaryButton color={T.gold} data-testid="mystery-start" onClick={onStart} style={{ marginTop: 18, ...routePrimary }}>
            Take me there
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

const frontCard = {
  ...routeCard,
  padding: 18,
  background: `linear-gradient(165deg, color-mix(in srgb, ${R.sage} 18%, ${R.bg}) 0%, color-mix(in srgb, ${R.teal} 10%, ${R.cardWarm}) 52%, color-mix(in srgb, ${R.violet} 12%, ${R.bg}) 100%)`,
  boxShadow: `${R.shadow}, inset 0 1px 0 rgba(255,255,255,0.65)`,
}

const backCard = {
  ...routeCard,
  padding: 18,
  transformOrigin: 'center',
  animation: 'cwMysteryReveal 0.45s ease',
}
