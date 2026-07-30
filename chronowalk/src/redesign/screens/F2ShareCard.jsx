import { T, F } from "../tokens.js";
import { spanishSteps } from "../images.js";

export default function F2ShareCard() {
  // Exportable 9:16 artifact - rendered at 390×844 inside the phone frame
  const actColors = [T.actI, T.actII, T.actIII, T.actIV, T.actV, T.actVI, T.encore];

  // Winding spectrum route - the full walk as a curving hero SVG
  const routeSegs = [
    { d: "M 28 170 Q 72 150 105 136",  c: T.actI   },
    { d: "M 105 136 Q 145 120 172 110",c: T.actII  },
    { d: "M 172 110 Q 205 98 228 88",  c: T.actIII },
    { d: "M 228 88 Q 258 76 278 64",   c: T.actIV  },
    { d: "M 278 64 Q 306 50 322 38",   c: T.actV   },
    { d: "M 322 38 Q 344 26 358 18",   c: T.actVI  },
    { d: "M 358 18 Q 370 12 380 8",    c: T.encore },
  ];
  const dots = [
    { x: 28,  y: 170, c: T.actI   },
    { x: 105, y: 136, c: T.actII  },
    { x: 172, y: 110, c: T.actIII },
    { x: 228, y: 88,  c: T.actIV  },
    { x: 278, y: 64,  c: T.actV   },
    { x: 322, y: 38,  c: T.actVI  },
    { x: 358, y: 18,  c: T.encore },
  ];

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>
      {/* Dim city photo - near-obsidian, preserves artifact feel */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${spanishSteps})`, backgroundSize: "cover", backgroundPosition: "center 30%", filter: "brightness(0.05) saturate(0.3)" }} />
      {/* Vignette to deepen corners */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, transparent 38%, rgba(0,0,0,0.42) 100%)", pointerEvents: "none", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", padding: "52px 32px 50px" }}>

        {/* PrismSeam mark - top left */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "auto" }}>
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9.5" stroke={T.ember} strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 0 4px rgba(232,161,60,0.55))" }} />
            <line x1="11" y1="1.5" x2="11" y2="20.5" stroke={T.ember} strokeWidth="1.5" />
          </svg>
          <span style={{ fontSize: 10, color: `${T.muted}80`, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            CHRONOWALK
          </span>
        </div>

        {/* ── Spectrum route-line - HERO ELEMENT ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 36 }}>

          <svg width="100%" height="190" viewBox="0 0 390 190" style={{ overflow: "visible" }}>
            {/* Soft ambient glow pass (blurred, wide) */}
            {routeSegs.map((seg, i) => (
              <path key={`g${i}`} d={seg.d} stroke={seg.c} strokeWidth="10" fill="none"
                strokeLinecap="round" opacity={0.18}
                style={{ filter: "blur(6px)" }} />
            ))}
            {/* Main route lines */}
            {routeSegs.map((seg, i) => (
              <path key={i} d={seg.d} stroke={seg.c} strokeWidth="2.5" fill="none"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 5px ${seg.c}CC)` }} />
            ))}
            {/* Waypoint dots */}
            {dots.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r="7" fill={pt.c} opacity={0.2} />
                <circle cx={pt.x} cy={pt.y} r="4" fill={pt.c}
                  style={{ filter: `drop-shadow(0 0 5px ${pt.c})` }} />
              </g>
            ))}
          </svg>

          {/* Eyebrow */}
          <p style={{
            fontSize: 10, color: T.muted,
            letterSpacing: "0.22em", textTransform: "uppercase",
            textAlign: "center",
          }}>
            ROME · 12 AUGUST 2026
          </p>

          {/* Stats - single mono row */}
          <p style={{
            fontSize: 14, color: `${T.warmWhite}CC`,
            fontVariantNumeric: "tabular-nums",
            textAlign: "center", letterSpacing: "0.04em",
          }}>
            14.2 km · 7h 12m · 21 centuries
          </p>

          {/* Closing line - Fraunces italic */}
          <p style={{
            fontFamily: F.display, fontSize: 18,
            fontStyle: "italic", fontWeight: 300,
            color: T.warmWhite, lineHeight: 1.6,
            textAlign: "center",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}>
            You began at a fountain that sinks,<br />
            and you ended at a tomb that<br />
            refused to stay a tomb.
          </p>
        </div>

        {/* Wordmark - bottom, with ember seam tick */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ width: 1.5, height: 14, background: T.ember, opacity: 0.55,
            boxShadow: "0 0 6px rgba(232,161,60,0.4)" }} />
          <span style={{ fontSize: 11, color: T.muted, letterSpacing: "0.14em" }}>
            chronowalk.com
          </span>
        </div>
      </div>
    </div>
  );
}
