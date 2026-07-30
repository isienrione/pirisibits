import { useState, useEffect } from "react";
import { useContext } from "react";
import { T, F } from "../tokens.js";
import { colosseumNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Vignette } from '../ui/index.js';

export default function A3AccessConfirmed({ onContinue }) {
  const { navigate } = useContext(RedesignNavCtx);
  // Animate seam drawing downward: 0 → full height, then hold, then restart
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const DRAW = 2400;  // ms to draw full seam
    const HOLD = 800;   // ms to hold at 100%
    const WAIT = 400;   // ms gap before restart
    let raf = 0;
    let startTs = 0;

    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / DRAW, 1);
      setPct(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    const cycle = () => {
      startTs = 0;
      setPct(0);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    // Restart after draw + hold + wait
    const iv = setInterval(cycle, DRAW + HOLD + WAIT);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []);

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>
      {/* Dim photo - satisfies photo-on-every-immersion-screen; brightness kept near-black */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${colosseumNow})`, backgroundSize: "cover", backgroundPosition: "center 20%", filter: "brightness(0.04) saturate(0.3)" }} />
      <Vignette />

      {/* Seam drawing downward - the key turning in the lock */}
      {/* Outer glow envelope */}
      <div style={{
        position: "absolute",
        left: "50%", transform: "translateX(-50%)",
        top: 0,
        width: 9,
        height: `${pct * 100}%`,
        background: `radial-gradient(ellipse at center, rgba(232,161,60,0.22) 0%, transparent 80%)`,
        pointerEvents: "none",
      }} />
      {/* The Seam itself */}
      <div style={{
        position: "absolute",
        left: "50%", transform: "translateX(-50%)",
        top: 0,
        width: 1.5,
        height: `${pct * 100}%`,
        background: T.ember,
        boxShadow: "0 0 12px rgba(232,161,60,0.55)",
      }} />
      {/* Leading dot - the keyhead moving down */}
      {pct > 0 && pct < 1 && (
        <div style={{
          position: "absolute",
          left: "50%", transform: "translateX(-50%)",
          top: `calc(${pct * 100}% - 4px)`,
          width: 8, height: 8, borderRadius: 4,
          background: T.ember,
          boxShadow: "0 0 16px rgba(232,161,60,0.8), 0 0 32px rgba(232,161,60,0.3)",
        }} />
      )}

      {/* Content - lower half, clear of the Seam draw zone */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        padding: "0 32px max(72px, calc(env(safe-area-inset-bottom) + 48px))",
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center",
        zIndex: 2,
      }}>
        <h1 style={{
          fontFamily: F.display,
          fontSize: 36,
          fontWeight: 300,
          color: T.warmWhite,
          lineHeight: 1.1,
          marginBottom: 16,
          textShadow: "0 2px 24px rgba(0,0,0,0.8)",
        }}>
          Rome is yours.
        </h1>

        <p style={{
          fontSize: 15,
          color: T.muted,
          lineHeight: 1.65,
          marginBottom: 36,
          maxWidth: 280,
        }}>
          Your access link is in your email - it works on any phone.
        </p>

        <button
          type="button"
          onClick={() => (onContinue ? onContinue() : navigate("B1"))}
          style={{
            width: "100%",
            padding: "15px",
            background: T.ember,
            color: T.obsidian,
            borderRadius: 12,
            fontFamily: F.body,
            fontWeight: 600,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 28px rgba(232,161,60,0.4)",
          }}
        >
          Begin setup
        </button>
      </div>
    </div>
  );
}
