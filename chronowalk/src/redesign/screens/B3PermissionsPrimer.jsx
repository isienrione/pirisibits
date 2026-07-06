import { T, F } from "../tokens.js";
import { severusNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Seam, Vignette } from '../ui/index.js';
import { useContext } from "react";

export default function B3PermissionsPrimer({ onEnable, onSkip, busy = false, paceTitle }) {
  const { navigate } = useContext(RedesignNavCtx);

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>
      {/* Full-bleed forum ruins photo — dramatic sky, muted */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${severusNow})`,
        backgroundSize: "cover", backgroundPosition: "center 25%",
        filter: "brightness(0.22) saturate(0.45)",
      }} />
      <Vignette />

      {/* Vertical Seam — the dividing line between what we do / never do */}
      <Seam />

      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column" }}>

        {/* Top area — logomark centered */}
        <div style={{ textAlign: "center", paddingTop: 56, paddingBottom: 36 }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8.5" stroke={T.ember} strokeWidth="1.3" style={{ filter: "drop-shadow(0 0 5px rgba(232,161,60,0.55))" }} />
            <line x1="10" y1="1.5" x2="10" y2="18.5" stroke={T.ember} strokeWidth="1.3" />
          </svg>
        </div>

        {/* Two-column zone — Seam is the visual divider */}
        <div style={{ display: "flex", flex: 1, paddingBottom: 28 }}>

          {/* LEFT — "While walking:" */}
          <div style={{ width: "50%", padding: "0 20px 0 28px", display: "flex", flexDirection: "column" }}>
            <span style={{
              fontFamily: F.body, fontSize: 11, color: T.ember,
              letterSpacing: "0.18em", textTransform: "uppercase",
              display: "block", marginBottom: 22,
            }}>
              While walking:
            </span>
            <p style={{ fontSize: 15, color: T.warmWhite, lineHeight: 1.65, fontWeight: 400 }}>
              knows which story to tell
            </p>
          </div>

          {/* RIGHT — "Never:" */}
          <div style={{ width: "50%", padding: "0 28px 0 20px", display: "flex", flexDirection: "column" }}>
            <span style={{
              fontFamily: F.body, fontSize: 11, color: T.muted,
              letterSpacing: "0.18em", textTransform: "uppercase",
              display: "block", marginBottom: 22,
            }}>
              Never:
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["background tracking", "storing", "selling"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ color: `${T.muted}70`, fontSize: 12, lineHeight: 1, flexShrink: 0 }}>·</span>
                  <p style={{ fontSize: 14, color: `${T.warmWhite}90`, lineHeight: 1.55 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom panel — exact copy + CTA */}
        <div style={{ padding: "22px 28px 44px", borderTop: `1px solid ${T.ink800}` }}>
          <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, marginBottom: 28 }}>
            {paceTitle ? `${paceTitle} · ` : ''}
            ChronoWalk uses your location{' '}
            <span style={{ color: T.warmWhite }}>only while walking the tour.</span>
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => (onEnable ? onEnable() : navigate('B4'))}
            style={{
              width: '100%', padding: '16px',
              background: T.ember, color: T.obsidian,
              borderRadius: 12, fontFamily: F.body, fontWeight: 600, fontSize: 15,
              border: 'none', cursor: busy ? 'wait' : 'pointer',
              boxShadow: '0 0 24px rgba(232,161,60,0.42)',
              marginBottom: 12,
              opacity: busy ? 0.75 : 1,
            }}
          >
            {busy ? 'Requesting access…' : 'Enable location & start'}
          </button>
          {onSkip ? (
            <button
              type="button"
              disabled={busy}
              onClick={onSkip}
              style={{
                width: '100%', padding: '14px',
                background: 'transparent', color: T.muted,
                border: 'none', cursor: busy ? 'wait' : 'pointer', fontSize: 14,
              }}
            >
              Continue without enabling
            </button>
          ) : (
          <button
            onClick={() => navigate("B4")}
            style={{
              width: "100%", padding: "16px",
              background: T.ember, color: T.obsidian,
              borderRadius: 12, fontFamily: F.body, fontWeight: 600, fontSize: 15,
              border: "none", cursor: "pointer",
              boxShadow: "0 0 24px rgba(232,161,60,0.42)",
            }}
          >
            Sounds fair — continue
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
