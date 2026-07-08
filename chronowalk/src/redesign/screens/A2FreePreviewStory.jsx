import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { T, F } from "../tokens.js";
import { pantheonNow } from "../images.js";
import { THEN_pantheon } from "../images.js";
import { Vignette, Eyebrow, Seam } from '../ui/index.js';

export default function A2FreePreviewStory({
  title = 'The Pantheon',
  photo = pantheonNow,
  thenPhoto = THEN_pantheon,
  tagline = 'A temple to all gods — or a tomb for emperors?',
  narrationPlaying = false,
  audioAvailable = true,
  onTogglePlay,
  onThresholdCross,
  onUnlock,
  onBack,
}) {
  const [tab, setTab] = useState("audio");
  const [holdState, setHoldState] = useState("idle");
  const holdTimer = useRef(null);

  const down = () => {
    setHoldState("holding");
    holdTimer.current = setTimeout(() => {
      setHoldState("crossed");
      onThresholdCross?.();
    }, 700);
  };
  const up = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (holdState === "crossed") setTimeout(() => setHoldState("idle"), 420);
    else setHoldState("idle");
  };

  return (
    <div style={{ background: T.obsidian, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Full-bleed photo behind everything */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${photo})`,
        backgroundSize: "cover", backgroundPosition: "center 20%",
        filter: "brightness(0.3)",
        zIndex: 0,
      }} />
      <Vignette />

      {/* ── Stage: upper 52% — press and hold ── */}
      <div
        style={{ position: "relative", flexShrink: 0, height: "52%", cursor: "pointer", userSelect: "none", zIndex: 5 }}
        onPointerDown={down} onPointerUp={up} onPointerLeave={up}
      >
        {/* NOW */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: "cover", backgroundPosition: "center",
          transition: "opacity 600ms ease",
          opacity: holdState !== "crossed" ? 1 : 0,
        }} />
        {/* THEN — sepia */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${thenPhoto})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "sepia(75%) contrast(0.78) brightness(0.70)",
          transition: "opacity 600ms ease",
          opacity: holdState === "crossed" ? 1 : 0,
        }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(22,19,15,0.18)" }} />
        <Seam />
        {/* Affordance ring */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 44, height: 44, borderRadius: 22,
          border: `1.5px solid ${T.ember}`,
          boxShadow: `0 0 12px rgba(232,161,60,0.4)`,
          transform: `translate(-50%, -50%) scale(${holdState === "holding" ? 1.6 : 1})`,
          opacity: holdState === "crossed" ? 0 : 0.55,
          transition: "transform 300ms, opacity 200ms",
          pointerEvents: "none", zIndex: 5,
        }} />
        <div style={{ position: "absolute", bottom: 10, left: 12, fontSize: 9, color: T.bone, letterSpacing: "0.14em", textTransform: "uppercase", zIndex: 6 }}>TODAY</div>
        <div style={{ position: "absolute", bottom: 10, right: 12, fontSize: 9, color: T.bone, letterSpacing: "0.14em", textTransform: "uppercase", zIndex: 6 }}>ANCIENT ROME</div>
        {holdState === "idle" && (
          <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, textAlign: "center", zIndex: 6 }}>
            <span style={{ fontSize: 11, color: `${T.bone}99`, letterSpacing: "0.08em" }}>Hold to cross</span>
          </div>
        )}
      </div>

      {/* ── Story content — sits on the dark photo bg ── */}
      <div style={{ flex: 1, padding: "24px 24px 8px", position: "relative", zIndex: 5 }}>
        <Eyebrow color={T.actIII}>FREE PREVIEW · PANTHEON</Eyebrow>
        <h2 style={{ fontFamily: F.display, fontSize: 36, color: T.warmWhite, fontWeight: 300, lineHeight: 1.05, margin: "10px 0 4px" }}>
          {title}
        </h2>
        <p style={{ fontFamily: F.display, fontSize: 14, color: T.muted, fontStyle: "italic", marginBottom: 16 }}>
          {tagline}
        </p>

        {/* Player — only when preview audio can actually play */}
        {audioAvailable ? (
          <>
            {/* Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 1.5, background: T.ink800, borderRadius: 1 }}>
                <div style={{ height: "100%", width: "32%", background: T.ember, borderRadius: 1, boxShadow: "0 0 8px rgba(232,161,60,0.5)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 11, color: T.muted, fontVariantNumeric: "tabular-nums" }}>1:17</span>
                <span style={{ fontSize: 11, color: T.muted }}>4:00</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, marginBottom: 16 }}>
              <button style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", lineHeight: 0 }}><SkipBack size={22} /></button>
              <button
                type="button"
                onClick={() => onTogglePlay?.()}
                style={{ width: 56, height: 56, borderRadius: 28, background: T.ember, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(232,161,60,0.5)" }}
              >
                {narrationPlaying ? <Pause size={22} fill={T.obsidian} color={T.obsidian} /> : <Play size={22} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 3 }} />}
              </button>
              <button style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", lineHeight: 0 }}><SkipForward size={22} /></button>
            </div>
          </>
        ) : import.meta.env.DEV ? (
          <div style={{ textAlign: "center", padding: "18px 0 16px" }}>
            <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              Preview audio unavailable in development
            </span>
          </div>
        ) : null}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${T.ink800}`, marginBottom: 12 }}>
          {(["audio", "transcript"]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              paddingBottom: 8, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: tab === t ? T.warmWhite : T.muted, marginBottom: -1,
              background: "none", border: "none",
              borderBottom: `1.5px solid ${tab === t ? T.ember : "transparent"}`,
              cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>

        {tab === "audio" && (
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
            Chapter 1 of 3 · <span style={{ color: T.warmWhite }}>The Dome That Refused to Fall</span>
          </p>
        )}
        {tab === "transcript" && (
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.75 }}>
            "You are standing in front of the most perfectly preserved building in ancient Rome. It is not a ruin. It is complete — and that is almost impossible to believe..."
          </p>
        )}

        {/* End-card */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.ink800}` }}>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 14, fontStyle: "italic" }}>
            That's one room of twenty-two. The rest of Rome is waiting outside.
          </p>
          <button
            type="button"
            onClick={() => onUnlock?.()}
            style={{ width: "100%", padding: "15px", background: T.ember, color: T.obsidian, borderRadius: 12, fontFamily: F.body, fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer" }}
          >
            Unlock all 22 places
          </button>
          {onBack ? (
            <button type="button" onClick={onBack} style={{ width: '100%', marginTop: 10, padding: '12px', background: 'transparent', border: 'none', color: T.muted, cursor: 'pointer' }}>
              Back to landing
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
