import { useState, useEffect } from "react";
import { Volume1 } from "lucide-react";
import {T, F, withAlpha} from "../tokens.js";
import { colosseumNow, severusNow } from "../images.js";
import { Seam, Vignette } from '../ui/index.js';

export default function G3SystemStates() {
  // (a) Offline without pack  ·  (b) GPS denied banner  ·  (c) Audio interruption

  // Toast auto-dismiss demo
  const [toastVisible, setToastVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setToastVisible(false), 3200);
    return () => clearTimeout(t);
  }, []);
  const resetToast = () => setToastVisible(true);

  const zoneH = Math.floor(844 / 3); // ≈ 281px each

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: F.body }}>

      {/* ── (a) OFFLINE WITHOUT PACK — obsidian, seam, copy + retry ── */}
      <div style={{ height: zoneH, position: "relative", overflow: "hidden", background: T.obsidian, flexShrink: 0 }}>
        {/* Dim background photo */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${severusNow})`, backgroundSize: "cover", backgroundPosition: "center 40%", filter: "brightness(0.10) saturate(0.2)" }} />
        <Seam />
        <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: T.warmWhite, lineHeight: 1.6, marginBottom: 4 }}>
            Rome is out of signal — your stories aren't.
          </p>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 20 }}>
            Download when you're back on wifi.
          </p>
          <button style={{ padding: "9px 24px", border: `1px solid ${T.ink800}`, borderRadius: 8, background: "transparent", color: `${withAlpha(T.warmWhite, 'BB')}`, fontFamily: F.body, fontSize: 13, cursor: "pointer" }}>
            Retry
          </button>
        </div>
        {/* Zone label */}
        <div style={{ position: "absolute", top: 8, left: 12, zIndex: 10 }}>
          <span style={{ fontSize: 9, color: `${withAlpha(T.muted, '80')}`, letterSpacing: "0.16em", textTransform: "uppercase" }}>a · OFFLINE WITHOUT PACK</span>
        </div>
      </div>

      {/* ── (b) GPS DENIED — amber banner over bone walking screen ── */}
      <div style={{ height: zoneH, position: "relative", overflow: "hidden", background: T.bone, flexShrink: 0 }}>
        {/* Walking screen context (dimmed) */}
        <div style={{ padding: "14px 20px 0", opacity: 0.45 }}>
          <span style={{ fontSize: 9, color: T.actIText, letterSpacing: "0.18em", textTransform: "uppercase" }}>WALKING TO</span>
          <p style={{ fontFamily: F.display, fontSize: 26, color: T.ink, fontWeight: 300, lineHeight: 1.1, margin: "5px 0 3px" }}>The Pantheon</p>
          <span style={{ color: T.actIText, fontSize: 14, fontWeight: 600 }}>380 m</span>
          <span style={{ color: `${withAlpha(T.ink, '55')}`, fontSize: 12 }}> · about 5 min</span>
        </div>

        {/* Single amber banner — NOT red */}
        <div style={{
          margin: "10px 16px 0",
          background: `${withAlpha(T.ember, '16')}`,
          border: `1px solid ${withAlpha(T.ember, '40')}`,
          borderRadius: 10,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <p style={{ fontSize: 13, color: T.ink, lineHeight: 1.4, flex: 1 }}>
            Location access is off — stories won't auto-start.
          </p>
          <button style={{ fontFamily: F.body, fontSize: 12, color: T.ember, fontWeight: 500, background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}>
            Enable in Settings
          </button>
        </div>

        {/* Zone label */}
        <div style={{ position: "absolute", top: 8, left: 12, zIndex: 10 }}>
          <span style={{ fontSize: 9, color: `${withAlpha(T.muted, '80')}`, letterSpacing: "0.16em", textTransform: "uppercase" }}>b · GPS DENIED</span>
        </div>
      </div>

      {/* ── (c) AUDIO INTERRUPTION — quiet bottom toast ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: T.obsidian, flexShrink: 0 }} onClick={resetToast}>
        {/* Story context */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${colosseumNow})`, backgroundSize: "cover", backgroundPosition: "center 20%", filter: "brightness(0.2)" }} />
        <div style={{ position: "absolute", top: 18, left: 20, zIndex: 5, opacity: 0.5 }}>
          <p style={{ fontFamily: F.display, fontSize: 18, color: T.warmWhite, fontWeight: 300 }}>The Colosseum</p>
          <p style={{ fontSize: 11, color: T.muted }}>Chapter 2 · Playing</p>
        </div>

        {/* Toast — quiet, bottom, auto-dismisses */}
        <div style={{
          position: "absolute", bottom: 14, left: 16, right: 16, zIndex: 20,
          background: `${withAlpha(T.ink, 'F0')}`,
          borderRadius: 10,
          padding: "11px 16px",
          display: "flex", alignItems: "center", gap: 10,
          opacity: toastVisible ? 1 : 0,
          transform: toastVisible ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 350ms ease, transform 350ms ease",
          backdropFilter: "blur(8px)",
        }}>
          <Volume1 size={14} color={T.muted} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: T.muted, flex: 1 }}>resuming where the story paused</p>
        </div>

        {/* Zone label */}
        <div style={{ position: "absolute", top: 8, left: 12, zIndex: 10 }}>
          <span style={{ fontSize: 9, color: `${withAlpha(T.muted, '80')}`, letterSpacing: "0.16em", textTransform: "uppercase" }}>c · AUDIO INTERRUPTION</span>
        </div>
        {!toastVisible && (
          <div style={{ position: "absolute", bottom: 8, right: 16, zIndex: 10 }}>
            <span style={{ fontSize: 9, color: `${withAlpha(T.muted, '60')}`, letterSpacing: "0.1em" }}>tap to replay</span>
          </div>
        )}
      </div>
    </div>
  );
}
