import { T, F, SHELL_TAB_BAR_INSET } from "../tokens.js";
import { severusNow } from "../images.js";
import { Seam, Vignette } from '../ui/index.js';

export default function C8bThePause({ onResume, busy = false }) {
  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>

      {/* Forum ruins — heavily darkened */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${severusNow})`,
        backgroundSize: "cover", backgroundPosition: "center 30%",
        filter: "brightness(0.11) saturate(0.35)",
      }} />
      <Vignette />

      {/* Horizontal Seam at lower third — the horizon line */}
      <Seam variant="horizontal"
        accent={T.ember}
        style={{ top: "63%", transform: "none" }}
      />

      {/* Above the horizon — Fraunces italic, centered vertically in upper zone */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        // height = 63% of 844 = 532px; center content in that zone
        height: "63%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 40px",
        zIndex: 10,
      }}>
        <p style={{
          fontFamily: F.display,
          fontSize: 26,
          fontStyle: "italic",
          fontWeight: 300,
          color: T.warmWhite,
          lineHeight: 1.55,
          textAlign: "center",
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}>
          Find a piece of shade.<br />I'll be here.
        </p>
      </div>

      {/* Below the horizon — ghost button + bed indicator */}
      <div style={{
        position: "absolute",
        top: "63%", left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 20,
        padding: `28px 36px ${SHELL_TAB_BAR_INSET}`,
        zIndex: 10,
      }}>
        {/* Ghost "I'm ready" button — barely there */}
        <button
          type="button"
          disabled={busy}
          onClick={() => onResume?.()}
          style={{
          padding: "13px 36px",
          border: `1px solid rgba(245,239,227,0.18)`,
          borderRadius: 12,
          background: "transparent",
          color: `${T.warmWhite}BB`,
          fontFamily: F.body, fontSize: 15,
          cursor: "pointer", letterSpacing: "0.03em",
        }}>
          I'm ready
        </button>

        {/* Ambient bed indicator */}
        <p style={{
          fontSize: 11, color: T.muted,
          letterSpacing: "0.12em",
        }}>
          ♪ antiquity
        </p>
      </div>
    </div>
  );
}
