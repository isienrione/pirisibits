import { useState, useRef } from "react";
import { T, F } from "../tokens.js";
import { colosseumNow, THEN_colosseum } from "../images.js";
import { Vignette } from '../ui/index.js';

export default function C7Threshold({
  nowPhoto = colosseumNow,
  thenPhoto = THEN_colosseum,
  honestyCaption = 'Statue placement evidence-based; awning colors informed conjecture',
  onDismiss,
}) {
  const [state, setState]       = useState("idle");
  const [bloomPos, setBloomPos] = useState({ x: 195, y: 422 });
  const [bloomR, setBloomR]     = useState(0);
  const holdTimer = useRef(null);
  const bloomRAF  = useRef(null);

  const isThen = state === "crossed" || state === "returning";

  const cleanup = () => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (bloomRAF.current)  { cancelAnimationFrame(bloomRAF.current); bloomRAF.current = null; }
  };

  const handleDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setBloomPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setState("holding");
    setBloomR(0);
    const start = performance.now();
    const tick = (now) => {
      const pct = Math.min((now - start) / 700, 1);
      setBloomR(pct);
      if (pct < 1) bloomRAF.current = requestAnimationFrame(tick);
      else setState("crossed");
    };
    bloomRAF.current = requestAnimationFrame(tick);
  };

  const handleUp = () => {
    cleanup();
    if (state === "crossed") {
      setState("returning");
      setTimeout(() => setState("idle"), 420);
    } else if (state === "holding") {
      setState("idle");
      setBloomR(0);
    }
  };

  return (
    <div
      style={{ height: "100%", position: "relative", overflow: "hidden", cursor: "pointer", userSelect: "none", touchAction: "none" }}
      onPointerDown={handleDown} onPointerUp={handleUp} onPointerLeave={handleUp}
    >
      {/* NOW — colosseum exterior */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${nowPhoto})`,
        backgroundSize: "cover", backgroundPosition: "center 20%",
        transition: "opacity 500ms ease",
        opacity: isThen ? 0 : 1,
        filter: "brightness(0.75)",
      }} />

      {/* THEN — sepia ancient */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${thenPhoto})`,
        backgroundSize: "cover", backgroundPosition: "center",
        filter: "sepia(60%) contrast(0.85) brightness(0.75) saturate(1.3)",
        transition: "opacity 500ms ease",
        opacity: isThen ? 1 : 0,
      }} />

      {/* Base scrim */}
      <div style={{ position: "absolute", inset: 0, background: `rgba(22,19,15,${isThen ? 0.18 : 0.1})`, transition: "background 500ms" }} />

      <Vignette />

      {/* Ember bloom from touch point */}
      {(state === "holding" || state === "crossed") && (
        <div style={{
          position: "absolute",
          left: bloomPos.x, top: bloomPos.y,
          width: 700, height: 700, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(232,161,60,0.32) 0%, rgba(232,161,60,0.12) 35%, transparent 70%)`,
          transform: `translate(-50%, -50%) scale(${bloomR})`,
          transition: state === "crossed" ? "transform 600ms ease-out" : "none",
          pointerEvents: "none", zIndex: 5,
        }} />
      )}

      {/* Spectrum shimmer on crossing */}
      {state === "crossed" && (
        <div style={{
          position: "absolute", top: 0, left: "50%", bottom: 0, width: 32, transform: "translateX(-50%)",
          background: `linear-gradient(to bottom, ${T.actI}, ${T.actII}, ${T.actIII}, ${T.actIV}, ${T.actV}, ${T.actVI}, ${T.encore})`,
          opacity: 0.25, animation: "fadeOut 1.2s ease-out forwards", pointerEvents: "none", zIndex: 6,
        }} />
      )}

      {/* Vertical Seam with glow */}
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: "50%", width: 1.5,
        transform: "translateX(-50%)",
        background: T.ember,
        boxShadow: `0 0 ${state === "holding" ? "20px" : "12px"} rgba(232,161,60,${state === "holding" ? "0.7" : "0.45"})`,
        opacity: state === "holding" ? 1 : 0.75,
        animation: "seamBreathe 3s ease-in-out infinite",
        transition: "opacity 200ms, box-shadow 200ms",
        pointerEvents: "none", zIndex: 7,
      }} />

      {/* Instruction — first time */}
      {state === "idle" && (
        <div style={{ position: "absolute", bottom: 64, left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
          <p style={{ fontFamily: F.body, fontSize: 14, color: T.warmWhite, letterSpacing: "0.06em", textShadow: "0 1px 12px rgba(0,0,0,0.8)" }}>
            Press and hold to cross.
          </p>
        </div>
      )}

      {/* Year chip */}
      <div style={{ position: "absolute", bottom: 22, right: 18, zIndex: 10 }}>
        <span style={{
          fontFamily: F.body, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
          color: isThen ? T.ember : T.muted, transition: "color 400ms",
          textShadow: "0 1px 8px rgba(0,0,0,0.8)",
        }}>{isThen ? "c. 80 AD" : "TODAY"}</span>
      </div>

      {/* Honesty caption */}
      {isThen && (
        <div style={{ position: "absolute", bottom: 22, left: 16, maxWidth: 210, zIndex: 10 }}>
          <p style={{ fontFamily: F.body, fontSize: 10, color: `${T.muted}BB`, lineHeight: 1.55 }}>
            {honestyCaption}
          </p>
        </div>
      )}

      {/* Accessibility / reduce-motion toggle — quiet, bottom-right, above year chip */}
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => {
          e.stopPropagation();
          cleanup();
          if (isThen) {
            setState("returning");
            setTimeout(() => setState("idle"), 400);
          } else {
            setState("crossed");
          }
        }}
        style={{
          position: "absolute", bottom: 48, right: 18, zIndex: 10,
          background: "none", border: "none", cursor: "pointer",
          fontFamily: F.body, fontSize: 12,
          color: `${T.muted}CC`,
          textShadow: "0 1px 8px rgba(0,0,0,0.8)",
          letterSpacing: "0.03em",
          padding: 0,
          transition: "opacity 250ms",
        }}
      >
        {isThen ? "Return" : "Cross without holding"}
      </button>
    </div>
  );
}
