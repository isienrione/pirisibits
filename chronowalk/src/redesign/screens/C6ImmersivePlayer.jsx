import { useState, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronLeft } from "lucide-react";
import { T, F } from "../tokens.js";
import { colosseumNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Vignette, Eyebrow } from '../ui/index.js';
import { useContext } from "react";

export default function C6ImmersivePlayer() {
  const { navigate } = useContext(RedesignNavCtx);
  const accent    = T.actI;
  const [playing, setPlaying]   = useState(true);
  const [progress, setProgress] = useState(0.42);
  const [tab, setTab]           = useState("chapters");
  const [speed, setSpeed]       = useState("1×");

  const bars = useRef(Array.from({ length: 52 }, () => 8 + Math.random() * 32)).current;

  return (
    <div style={{ background: T.obsidian, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Full-bleed blurred photo bg */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${colosseumNow})`,
        backgroundSize: "cover", backgroundPosition: "center 30%",
        filter: "blur(24px) brightness(0.22) saturate(0.5)",
      }} />
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(22,19,15,0.78)" }} />
      <Vignette />

      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%", padding: "48px 24px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexShrink: 0 }}>
          <button onClick={() => navigate("C5")} style={{ display: "flex", alignItems: "center", gap: 2, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: F.body, fontSize: 13 }}>
            <ChevronLeft size={17} /> Waypoint
          </button>
          <Eyebrow color={accent}>CHAPTER 2 OF 3</Eyebrow>
          <div style={{ width: 72 }} />
        </div>

        {/* Chapter title — ON photograph */}
        <h2 style={{ fontFamily: F.display, fontSize: 40, color: T.warmWhite, fontWeight: 300, lineHeight: 1.05, marginBottom: 5, flexShrink: 0, textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
          Fifty Thousand<br />Witnesses
        </h2>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 24, flexShrink: 0 }}>The Colosseum · Act I</p>

        {/* Waveform */}
        <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 52, marginBottom: 10, flexShrink: 0 }}>
          {bars.map((h, i) => (
            <div key={i} onClick={() => setProgress(i / bars.length)} style={{
              flex: 1, height: h, borderRadius: 1,
              background: (i / bars.length) < progress ? accent : `${T.muted}35`,
              cursor: "pointer", transition: "background 120ms",
              boxShadow: (i / bars.length) < progress ? `0 0 4px ${accent}60` : "none",
            }} />
          ))}
        </div>

        {/* Time */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: "tabular-nums" }}>4:22</span>
          <span style={{ fontSize: 12, color: T.muted }}>−6:01</span>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexShrink: 0 }}>
          <button onClick={() => setSpeed(s => s === "1×" ? "1.5×" : s === "1.5×" ? "2×" : "1×")} style={{ fontFamily: F.body, fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer", minWidth: 28 }}>{speed}</button>
          <button style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", lineHeight: 0 }}><SkipBack size={28} /></button>
          <button onClick={() => setPlaying(!playing)} style={{
            width: 72, height: 72, borderRadius: 36, background: T.ember, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 28px rgba(232,161,60,0.55)",
          }}>
            {playing ? <Pause size={30} fill={T.obsidian} color={T.obsidian} /> : <Play size={30} fill={T.obsidian} color={T.obsidian} style={{ marginLeft: 4 }} />}
          </button>
          <button style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", lineHeight: 0 }}><SkipForward size={28} /></button>
          <button style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", lineHeight: 0 }}><Volume2 size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${T.ink800}`, marginBottom: 14, flexShrink: 0 }}>
          {(["chapters", "transcript", "stops"]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              paddingBottom: 10, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: tab === t ? T.warmWhite : T.muted, marginBottom: -1,
              background: "none", border: "none",
              borderBottom: `1.5px solid ${tab === t ? accent : "transparent"}`,
              cursor: "pointer", fontFamily: F.body,
            }}>{t}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {tab === "chapters" && (
            <div>
              {["The Beast Awakens", "Fifty Thousand Witnesses", "The Concrete Memory"].map((ch, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: i < 1 ? T.ember : i === 1 ? accent : T.ink800, boxShadow: i === 1 ? `0 0 8px ${accent}` : "none" }} />
                  <span style={{ fontSize: 14, color: i === 1 ? T.warmWhite : T.muted }}>{ch}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "transcript" && (
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.8 }}>
              "Vespasian began it. Titus opened it — in 80 AD, with one hundred days of games. Fifty thousand people in tiered marble. The noise was not applause. It was the city breathing together for the first time..."
            </p>
          )}
          {tab === "stops" && (
            <div>
              {["The Colosseum", "The Arch of Constantine", "The Palatine Hill"].map((s, i) => (
                <div key={i} style={{ paddingBottom: 14, borderBottom: `1px solid ${T.ink800}`, marginBottom: 14 }}>
                  <span style={{ fontSize: 14, color: i === 0 ? accent : T.muted }}>
                    {i === 0 && <span style={{ fontSize: 10, color: accent, marginRight: 8 }}>NOW PLAYING</span>}
                    {s}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
