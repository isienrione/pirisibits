import { T, F } from "../tokens.js";
import { colosseumNow, severusNow } from "../images.js";
import { Eyebrow } from '../ui/index.js';

export default function C9NoTicket({ onTakeWalk, onDismiss }) {
  const accent = T.actI;

  return (
    <div className="cw-grain" style={{ background: T.bone, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

      {/* Header */}
      <div style={{ padding: "52px 24px 0", flexShrink: 0, position: "relative", zIndex: 2 }}>
        <h2 style={{
          fontFamily: F.display, fontSize: 26,
          color: T.ink, fontWeight: 300,
          lineHeight: 1.2, marginBottom: 6,
        }}>
          Sold out happens to the best of us.
        </h2>
        <p style={{ fontSize: 15, color: T.muted, fontStyle: "italic", marginBottom: 28 }}>
          — and Rome planned for it.
        </p>
        {/* Accent hairline under context */}
        <div style={{ width: "100%", height: 1, background: `${T.muted}28`, marginBottom: 28 }} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 24px 32px", position: "relative", zIndex: 2 }}>

        {/* Offer block — no card box, just photography + content */}
        <div style={{ marginBottom: 20 }}>
          <Eyebrow color={accent} hairline>AN ALTERNATIVE WALK</Eyebrow>
          <div style={{ marginTop: 14 }}>
            {/* Offer photo — 4:3 */}
            <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16, aspectRatio: "4/3" }}>
              <img
                src={severusNow}
                alt="The Forum from the Railing"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
              />
            </div>

            {/* Offer title */}
            <h3 style={{
              fontFamily: F.display, fontSize: 24,
              color: T.ink, fontWeight: 300,
              lineHeight: 1.15, marginBottom: 6,
            }}>
              The Forum from the Railing
            </h3>

            {/* Meta line */}
            <p style={{
              fontSize: 13, color: T.muted,
              marginBottom: 16,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>2 stories</span>
              <span style={{ color: `${T.muted}60` }}>·</span>
              <span>free ground</span>
              <span style={{ color: `${T.muted}60` }}>·</span>
              <span>zero queue</span>
            </p>

            {/* Mini-map hint — Via dei Fori Imperiali schematic */}
            <div style={{
              borderRadius: 12, overflow: "hidden",
              background: `${T.warmWhite}`,
              border: `1px solid ${T.muted}30`,
              padding: "14px 14px 10px",
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 10, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
                Route to viewpoint
              </p>
              <svg width="100%" height="90" viewBox="0 0 310 90">
                {/* Via dei Fori Imperiali — main road */}
                <rect x="0" y="36" width="310" height="18" rx="3" fill={`${T.muted}18`} />
                <text x="155" y="49" textAnchor="middle" style={{ fontSize: "8px", fill: T.muted, letterSpacing: "0.12em" }}>
                  VIA DEI FORI IMPERIALI
                </text>

                {/* Forum grounds below the road */}
                <rect x="10" y="60" width="280" height="22" rx="4" fill={`${T.actIV}12`} />
                <text x="155" y="75" textAnchor="middle" style={{ fontSize: "8px", fill: T.actIV, letterSpacing: "0.1em", opacity: 0.8 }}>
                  ROMAN FORUM
                </text>

                {/* Walking path — from left to railing pin */}
                <path d="M 30 44 L 230 44" stroke={accent} strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" />
                <polygon points="228,40 236,44 228,48" fill={accent} />

                {/* You marker */}
                <circle cx="30" cy="44" r="5" fill={T.warmWhite} stroke={accent} strokeWidth="1.5" />
                <text x="30" y="30" textAnchor="middle" style={{ fontSize: "8px", fill: T.muted }}>You</text>

                {/* Railing viewpoint pin */}
                <circle cx="240" cy="44" r="5" fill={accent} />
                <circle cx="240" cy="44" r="9" fill="none" stroke={accent} strokeWidth="1" opacity="0.4" />
                <text x="240" y="30" textAnchor="middle" style={{ fontSize: "8px", fill: accent }}>Railing</text>
              </svg>
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              onClick={() => (onTakeWalk ? onTakeWalk() : undefined)}
              style={{
              width: "100%", padding: "15px",
              background: accent, color: T.warmWhite,
              borderRadius: 12, fontFamily: F.body,
              fontWeight: 600, fontSize: 15,
              border: "none", cursor: "pointer",
              marginBottom: 16,
              boxShadow: `0 0 20px ${accent}40`,
            }}>
              Take the railing walk
            </button>

            {/* Footnote */}
            <p style={{
              fontSize: 13, color: T.muted,
              lineHeight: 1.65, textAlign: "center",
              fontStyle: "italic",
            }}>
              The full version will still be here tomorrow.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
