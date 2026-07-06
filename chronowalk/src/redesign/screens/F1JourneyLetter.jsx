import { useState, useEffect } from "react";
import { T, F } from "../tokens.js";
import { spanishSteps } from "../images.js";
import { Vignette, BottomScrim } from '../ui/index.js';

export default function F1JourneyLetter({
  firstName = "",
  body = "Today you crossed twenty-one centuries on foot. You began at a fountain that sinks, and you ended at a tomb that refused to stay a tomb. Rome will remember you were here.",
  reflection = "— Your companion",
  stats = [{ v: "28 km", l: "walked" }, { v: "6h 40m", l: "in Rome" }, { v: "21", l: "centuries crossed" }],
  busy = false,
  statusMessage = "",
  onSave,
  onShare,
  onBack,
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2600);
    const t2 = setTimeout(() => setPhase(2), 4200);
    const t3 = setTimeout(() => setPhase(3), 6400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const segments = [
    { d: "M 44 158 Q 68 148 88 134",  color: T.actI   },
    { d: "M 88 134 Q 118 118 142 110", color: T.actII  },
    { d: "M 142 110 Q 172 96 198 86",  color: T.actIII },
    { d: "M 198 86 Q 228 72 252 62",   color: T.actIV  },
    { d: "M 252 62 Q 284 50 308 42",   color: T.actV   },
    { d: "M 308 42 Q 334 30 354 22",   color: T.actVI  },
    { d: "M 354 22 Q 366 16 378 14",   color: T.encore },
  ];

  const waypoints = [
    { cx: 44, cy: 158, color: T.actI }, { cx: 142, cy: 110, color: T.actIII },
    { cx: 198, cy: 86, color: T.actIII }, { cx: 252, cy: 62, color: T.actIV },
    { cx: 308, cy: 42, color: T.actV }, { cx: 354, cy: 22, color: T.actVI },
    { cx: 378, cy: 14, color: T.encore },
  ];

  return (
    <div style={{ background: T.obsidian, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Full-bleed Spanish Steps — the golden-hour emotional peak */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${spanishSteps})`,
        backgroundSize: "cover", backgroundPosition: "center 30%",
        filter: "brightness(0.32) saturate(0.9)",
        zIndex: 0,
      }} />
      <Vignette />
      <BottomScrim strength={0.94} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%", padding: "52px 28px 28px", overflowY: "auto", scrollbarWidth: "none" }}>
        {/* Spectrum route SVG */}
        <div style={{ flexShrink: 0, height: 170, position: "relative", marginBottom: 4 }}>
          <svg width="100%" height="170" viewBox="0 0 390 170" preserveAspectRatio="xMinYMin meet">
            <line x1="0" y1="90" x2="390" y2="90" stroke={T.ink800} strokeWidth="1" />
            <line x1="195" y1="0" x2="195" y2="170" stroke={T.ink800} strokeWidth="1" />
            {segments.map((seg, i) => (
              <path key={i} d={seg.d} stroke={seg.color} strokeWidth="2.5" strokeLinecap="round" fill="none"
                style={{
                  strokeDasharray: 200, strokeDashoffset: phase === 0 ? 200 : 0,
                  transition: `stroke-dashoffset 380ms ease-out ${i * 340}ms`,
                  filter: `drop-shadow(0 0 4px ${seg.color}88)`,
                }}
              />
            ))}
            {waypoints.map((pt, i) => (
              <circle key={i} cx={pt.cx} cy={pt.cy} r={4} fill={pt.color}
                style={{ opacity: phase === 0 ? 0 : 1, transition: `opacity 300ms ${i * 300 + 600}ms`, filter: `drop-shadow(0 0 4px ${pt.color})` }}
              />
            ))}
            <text x="50" y="169" style={{ fontSize: "9px", letterSpacing: "0.1em" }} fill={T.muted}>COLOSSEUM</text>
            <text x="335" y="12" style={{ fontSize: "9px", letterSpacing: "0.1em" }} fill={T.encore}>CASTEL</text>
          </svg>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28, flexShrink: 0, opacity: phase >= 1 ? 1 : 0, transition: "opacity 700ms" }}>
          {stats.map(s => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, color: T.warmWhite, fontVariantNumeric: "tabular-nums", fontWeight: 300 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* The Letter — Fraunces, ON the photograph */}
        <div style={{ opacity: phase >= 2 ? 1 : 0, transition: "opacity 800ms", flex: 1, flexShrink: 0 }}>
          <div style={{ width: 1.5, height: 32, background: T.ember, marginBottom: 24, opacity: 0.8, animation: "seamBreathe 3s ease-in-out infinite", boxShadow: "0 0 12px rgba(232,161,60,0.45)" }} />
          <div style={{ fontFamily: F.display, color: T.warmWhite, fontWeight: 300 }}>
            {firstName && (
              <p style={{ fontSize: 24, marginBottom: 22, textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>Dear {firstName} —</p>
            )}
            <p style={{ fontSize: 19, lineHeight: 1.78, textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
              {body}
            </p>
            <p style={{ fontSize: 16, color: T.muted, fontStyle: "italic", marginTop: 24 }}>
              {reflection}
            </p>
          </div>
        </div>

        {/* Actions + review */}
        <div style={{ opacity: phase >= 3 ? 1 : 0, transition: "opacity 800ms", marginTop: 28, flexShrink: 0 }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave?.()}
            style={{
            width: "100%", padding: "16px", background: T.ember, color: T.obsidian,
            borderRadius: 12, fontFamily: F.body, fontWeight: 600, fontSize: 15,
            border: "none", cursor: busy ? 'wait' : "pointer", marginBottom: 10,
            boxShadow: "0 0 24px rgba(232,161,60,0.45)",
          }}>Keep this — save your Letter</button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onShare?.()}
            style={{ width: "100%", padding: "12px", textAlign: "center", color: T.muted, fontSize: 14, background: "none", border: "none", cursor: busy ? 'wait' : "pointer", marginBottom: 18 }}
          >Share it.</button>
          {statusMessage ? (
            <p style={{ fontSize: 12, color: T.actII, marginBottom: 12, textAlign: 'center' }}>{statusMessage}</p>
          ) : null}
          {onBack ? (
            <button type="button" onClick={onBack} style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${T.ink800}`, color: T.muted, borderRadius: 10, cursor: 'pointer' }}>
              Back to journal
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
