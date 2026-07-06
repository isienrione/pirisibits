import { useState, useEffect } from "react";
import { T, F } from "../tokens.js";
import { capitolineNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Vignette } from '../ui/index.js';
import { useContext } from "react";

export default function C8cActComplete({
  actTitle = 'ACT IV · THE MARKET',
  closingLine = 'The ancient city, complete.',
  stats = ['11 stops', '4.1 km', '21 centuries'],
  accent = T.actIV,
  onContinue,
  onSavePlace,
  busy = false,
}) {
  const { navigate } = useContext(RedesignNavCtx);
  const verdigris = accent;
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Route path length for dashoffset animation — approximate
  const pathD = "M 28 210 Q 80 185 118 168 Q 155 150 185 140 Q 220 128 258 118 Q 295 108 330 96 Q 355 87 374 80";
  const pathLen = 390; // generous estimate for dasharray

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>
      {/* Dark map-hint background — capitoline heavily desaturated */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${capitolineNow})`,
        backgroundSize: "cover", backgroundPosition: "center 40%",
        filter: "brightness(0.10) saturate(0.2) blur(1px)",
      }} />
      {/* Subtle map-grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(78,155,143,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(78,155,143,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        zIndex: 1,
      }} />
      <Vignette />

      {/* Route line SVG — draws itself */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg
          width="390" height="280"
          viewBox="0 0 390 280"
          style={{ position: "absolute", top: "18%", left: 0 }}
        >
          {/* Soft glow duplicate — wider, low opacity */}
          <path
            d={pathD}
            stroke={verdigris}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            opacity={0.2}
            style={{
              strokeDasharray: pathLen,
              strokeDashoffset: drawn ? 0 : pathLen,
              transition: "stroke-dashoffset 2.2s cubic-bezier(0.4,0,0.2,1) 0.3s",
              filter: `blur(4px)`,
            }}
          />
          {/* Main route line */}
          <path
            d={pathD}
            stroke={verdigris}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: pathLen,
              strokeDashoffset: drawn ? 0 : pathLen,
              transition: "stroke-dashoffset 2.2s cubic-bezier(0.4,0,0.2,1) 0.15s",
              filter: `drop-shadow(0 0 6px ${verdigris}CC)`,
            }}
          />
          {/* Start dot */}
          <circle cx="28" cy="210" r="4" fill={verdigris}
            style={{ opacity: drawn ? 1 : 0, transition: "opacity 300ms 0.5s" }} />
          {/* End dot */}
          <circle cx="374" cy="80" r="5" fill={verdigris}
            style={{ opacity: drawn ? 1 : 0, transition: "opacity 300ms 2.4s" }} />
          {/* End glow */}
          <circle cx="374" cy="80" r="10" fill="none" stroke={verdigris} strokeWidth="1.5"
            style={{ opacity: drawn ? 0.4 : 0, transition: "opacity 300ms 2.4s" }} />
          {/* Act label */}
          <text x="195" y="246" textAnchor="middle"
            style={{ fontSize: "9px", letterSpacing: "0.2em", fill: verdigris, opacity: 0.7, textTransform: "uppercase" }}>
            {actTitle}
          </text>
        </svg>
      </div>

      {/* Content — lower half */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 28px 52px",
        zIndex: 10,
      }}>
        {/* Stats — DM Sans mono */}
        <div style={{
          display: "flex", gap: 8, alignItems: "center",
          marginBottom: 24, justifyContent: "center",
        }}>
          {stats.map((stat, i) => (
            <span key={stat} style={{
              fontSize: 13, color: T.muted,
              fontVariantNumeric: "tabular-nums",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              {i > 0 && <span style={{ color: T.ink800, fontSize: 10 }}>·</span>}
              {stat}
            </span>
          ))}
        </div>

        {/* Fraunces italic closing line */}
        <p style={{
          fontFamily: F.display, fontSize: 26,
          fontStyle: "italic", fontWeight: 300,
          color: T.warmWhite, lineHeight: 1.35,
          textAlign: "center", marginBottom: 32,
          textShadow: "0 2px 16px rgba(0,0,0,0.5)",
        }}>
          {closingLine}
        </p>

        {/* Seam tick — ember: time itself, always, regardless of act */}
        <div style={{
          width: 1.5, height: 24, background: T.ember,
          margin: "0 auto 24px",
          boxShadow: "0 0 12px rgba(232,161,60,0.45)",
          animation: "seamBreathe 3s ease-in-out infinite",
        }} />

        {/* Primary */}
        <button
          type="button"
          disabled={busy}
          onClick={() => (onContinue ? onContinue() : navigate("C2"))}
          style={{
            width: "100%", padding: "15px",
            background: verdigris, color: T.warmWhite,
            borderRadius: 12, fontFamily: F.body,
            fontWeight: 600, fontSize: 15,
            border: "none", cursor: "pointer",
            marginBottom: 14,
            boxShadow: `0 0 22px ${verdigris}55`,
          }}
        >
          Continue to Act V — The Living City
        </button>

        {/* Quiet */}
        <button
          type="button"
          disabled={busy}
          onClick={() => onSavePlace?.()}
          style={{
          width: "100%", textAlign: "center",
          fontSize: 13, color: T.muted,
          background: "none", border: "none",
          cursor: "pointer", fontFamily: F.body,
        }}>
          That's today — save my place.
        </button>
      </div>
    </div>
  );
}
