import { useState, useContext } from "react";
import { T, F, SHELL_TAB_BAR_INSET } from "../tokens.js";
import { colosseumNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Vignette, BottomScrim } from '../ui/index.js';

export default function C8aPathChoice({ onChoose, busy = false }) {
  const { navigate } = useContext(RedesignNavCtx);
  const [chosen, setChosen] = useState(null);

  const inkPanel = "rgba(33,28,21,0.70)";        // ink-900 at 70% — translucent, not solid
  const hairline = "rgba(245,239,227,0.13)";

  const paths = [
    {
      key: "A",
      label: "Path A — The Forum Direct",
      chip: "~45 min shorter",
      chipStyle: { background: T.ember, color: T.obsidian },
      body: "Straight through the gate of triumphs and down into the heart. The Palatine stays available as an optional climb.",
    },
    {
      key: "B",
      label: "Path B — The Emperor's Approach",
      chip: "The full hill",
      chipStyle: { border: `1px solid ${hairline}`, color: T.warmWhite, background: "transparent" },
      body: "Past Constantine's arch, up the Palatine the way power went — palace, the Circus from the emperor's railing, then descend into the Forum from above.",
    },
  ];

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>
      {/* Colosseum at dusk — warm-filtered for late light */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${colosseumNow})`,
        backgroundSize: "cover", backgroundPosition: "center 25%",
        filter: "brightness(0.42) sepia(18%) saturate(1.4)",
      }} />
      <Vignette />
      <BottomScrim strength={0.82} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 10,
        height: "100%", display: "flex", flexDirection: "column",
        padding: `56px 24px ${SHELL_TAB_BAR_INSET}`,
      }}>
        {/* Title */}
        <div style={{ marginBottom: 28, flexShrink: 0 }}>
          <h2 style={{
            fontFamily: F.display, fontSize: 30,
            color: T.warmWhite, fontWeight: 300,
            lineHeight: 1.12, marginBottom: 6,
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}>
            Two doors into ancient Rome.
          </h2>
          <p style={{ fontSize: 15, color: T.muted }}>Pick your appetite.</p>
        </div>

        {/* Path panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
          {paths.map(path => (
            <button
              key={path.key}
              onClick={() => setChosen(path.key)}
              style={{
                textAlign: "left",
                background: chosen === path.key ? "rgba(33,28,21,0.85)" : inkPanel,
                border: `1px solid ${chosen === path.key ? `${T.ember}60` : hairline}`,
                borderRadius: 14,
                padding: "20px 18px",
                cursor: "pointer",
                flex: 1,
                display: "flex", flexDirection: "column", gap: 10,
                transition: "border-color 250ms, background 250ms",
                backdropFilter: "blur(6px)",
              }}
            >
              {/* Label + chip row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <span style={{
                  fontFamily: F.body, fontSize: 11,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: T.warmWhite, fontWeight: 600,
                  lineHeight: 1.4,
                }}>
                  {path.label}
                </span>
                <span style={{
                  ...path.chipStyle,
                  fontSize: 10, letterSpacing: "0.08em",
                  borderRadius: 6, padding: "3px 9px",
                  flexShrink: 0, fontWeight: 500,
                }}>
                  {path.chip}
                </span>
              </div>
              {/* Body — verbatim */}
              <p style={{
                fontSize: 14, color: `${T.warmWhite}CC`,
                lineHeight: 1.65,
              }}>
                {path.body}
              </p>
            </button>
          ))}
        </div>

        {/* Footnote */}
        <p style={{
          fontSize: 12, color: T.muted,
          lineHeight: 1.65, textAlign: "center",
          margin: "18px 0 0", flexShrink: 0,
        }}>
          Same ticket, same stops available, same single entry. Nothing is lost either way.
        </p>

        {/* Confirm — only visible once chosen */}
        {chosen && (
          <button
            type="button"
            disabled={busy}
            onClick={() => (onChoose ? onChoose(chosen) : navigate('C2'))}
            style={{
              marginTop: 14, width: '100%', padding: '15px',
              background: T.ember, color: T.obsidian,
              borderRadius: 12, fontFamily: F.body,
              fontWeight: 600, fontSize: 15,
              border: 'none', cursor: busy ? 'wait' : 'pointer',
              boxShadow: '0 0 22px rgba(232,161,60,0.45)',
              flexShrink: 0,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy
              ? 'Starting…'
              : `Take ${chosen === 'A' ? 'The Forum Direct' : "The Emperor's Approach"}`}
          </button>
        )}
      </div>
    </div>
  );
}
