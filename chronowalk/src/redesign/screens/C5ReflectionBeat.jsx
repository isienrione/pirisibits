import { useState, useEffect } from "react";
import { useContext } from "react";
import { T, F } from "../tokens.js";
import { colosseumNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Vignette } from '../ui/index.js';

export default function C5ReflectionBeat() {
  const { navigate } = useContext(RedesignNavCtx);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContinue(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: T.obsidian, height: "100%", position: "relative", overflow: "hidden", fontFamily: F.body }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${colosseumNow})`,
        backgroundSize: "cover", backgroundPosition: "center 20%",
        filter: "brightness(0.12) saturate(0.3)",
      }} />
      <Vignette />

      {/* The signature line · full-bleed Fraunces italic, centered */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 48px", zIndex: 10 }}>
        <p style={{
          fontFamily: F.display, fontSize: 28,
          fontStyle: "italic", fontWeight: 300,
          color: T.warmWhite, lineHeight: 1.5,
          textAlign: "center",
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}>
          The concrete is still crystallizing.
        </p>
      </div>

      {/* Continue · fades in after 3s */}
      <div style={{
        position: "absolute", bottom: 64, left: 0, right: 0,
        textAlign: "center", zIndex: 10,
        opacity: showContinue ? 1 : 0,
        transition: "opacity 700ms ease",
      }}>
        <button onClick={() => navigate("C5")} style={{ background: "none", border: "none", cursor: "pointer", color: `${T.warmWhite}CC`, fontSize: 15, fontFamily: F.body, letterSpacing: "0.06em" }}>
          Continue
        </button>
      </div>
    </div>
  );
}
