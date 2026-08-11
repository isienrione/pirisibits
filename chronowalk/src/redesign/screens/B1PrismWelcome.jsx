import { useState, useEffect } from "react";
import { T, F } from "../tokens.js";
import { severusNow } from "../images.js";
import { Vignette } from '../ui/index.js';
import { useT } from '../../i18n/I18nProvider.jsx';

export default function B1PrismWelcome({ onComplete }) {
  const t = useT();
  // phase 0 → circle draws   phase 1 → spectrum hairline   phase 2 → ember + ROME
  const [phase, setPhase] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 1300);
    const t2 = setTimeout(() => setPhase(2), 2600);
    const t3 = setTimeout(() => { setCycleKey(k => k + 1); }, 5800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [cycleKey]);

  // Circle circumference for r=52
  const C = 2 * Math.PI * 52;

  return (
    <div
      style={{ background: T.obsidian, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", fontFamily: F.body }}
      onClick={() => (onComplete ? onComplete() : setCycleKey(k => k + 1))}
    >
      {/* Dim photo - near-black so animation reads clean; satisfies immersion rule */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${severusNow})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.04) saturate(0.2)", pointerEvents: "none" }} />
      <Vignette />
      {/* Tap hint - production; frame label kept for prototype gallery */}
      <div style={{ position: "absolute", top: "max(52px, env(safe-area-inset-top))", left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
        <span style={{ fontSize: 10, color: `${T.muted}88`, letterSpacing: "0.16em" }}>{t('onboarding.welcome.continue')}</span>
      </div>

      {/* PrismSeam logomark SVG */}
      <svg width="148" height="148" viewBox="-4 -4 128 128" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="b1spec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E4552E" />
            <stop offset="17%"  stopColor="#E8A13C" />
            <stop offset="34%"  stopColor="#7C9A5C" />
            <stop offset="50%"  stopColor="#4E9B8F" />
            <stop offset="67%"  stopColor="#4E7D9B" />
            <stop offset="83%"  stopColor="#8A6FB5" />
            <stop offset="100%" stopColor="#B14A6E" />
          </linearGradient>
        </defs>

        {/* Circle - draws itself over 1.2s */}
        <circle
          cx="60" cy="60" r="52"
          fill="none"
          stroke={`${T.warmWhite}50`}
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            strokeDasharray: C,
            strokeDashoffset: phase >= 0 ? 0 : C,
            transition: "stroke-dashoffset 1200ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />

        {/* Spectrum hairline - draws top-to-bottom through the circle */}
        <line
          x1="60" y1="8" x2="60" y2="112"
          stroke="url(#b1spec)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            strokeDasharray: 104,
            strokeDashoffset: phase >= 1 ? 0 : 104,
            transition: "stroke-dashoffset 800ms cubic-bezier(0.4,0,0.2,1)",
            opacity: phase >= 2 ? 0 : 1,
            // opacity transition fires separately
            transitionProperty: "stroke-dashoffset, opacity",
            transitionDuration: "800ms, 500ms",
            filter: "drop-shadow(0 0 3px rgba(232,161,60,0.5))",
          }}
        />

        {/* Ember hairline - resolves from spectrum at phase 2 */}
        <line
          x1="60" y1="8" x2="60" y2="112"
          stroke={T.ember}
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transition: "opacity 500ms ease",
            filter: "drop-shadow(0 0 8px rgba(232,161,60,0.75))",
          }}
        />
      </svg>

      {/* "ROME" - fades in at phase 2 */}
      <div style={{ marginTop: 40, opacity: phase >= 2 ? 1 : 0, transition: "opacity 700ms ease 200ms" }}>
        <span style={{
          fontFamily: F.display, fontSize: 36, color: T.warmWhite,
          fontWeight: 300, letterSpacing: "0.38em",
          textShadow: "0 0 32px rgba(245,239,227,0.25)",
        }}>
          {t('onboarding.welcome.rome')}
        </span>
      </div>

      {/* Tap-to-skip hint */}
      <div style={{ position: "absolute", bottom: 52, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: T.muted, letterSpacing: "0.08em" }}>{t('onboarding.welcome.skip')}</span>
      </div>
    </div>
  );
}
