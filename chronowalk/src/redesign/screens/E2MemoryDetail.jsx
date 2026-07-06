import { useState } from "react";
import { Play, ChevronLeft, ChevronDown } from "lucide-react";
import { useContext } from "react";
import { T, F } from "../tokens.js";
import { colosseumNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Eyebrow } from '../ui/index.js';

export default function E2MemoryDetail({
  accent = T.actI,
  actLabel = 'ACT I — THE ARENA',
  title = 'The Colosseum',
  nowPhoto = colosseumNow,
  thenPhoto = colosseumNow,
  signatureLine: sigLine = 'The concrete is still crystallizing.',
  facts: factsProp,
  transcript,
  chapters: chaptersProp,
  onBack,
  onWalkToStop,
}) {
  const { navigate } = useContext(RedesignNavCtx);

  const halfW = (390 - 40 - 1.5) / 2;   // ≈ 174px
  const halfH = Math.round(halfW * 1.25); // 4:5 ratio ≈ 218px

  const [txOpen, setTxOpen] = useState(false);

  const facts = factsProp?.length ? factsProp : [
    "Built in 70–80 AD under Vespasian and Titus. The entire arena floor in under ten years.",
    "Capacity was closer to fifty thousand than eighty. The noise, by all accounts, was impossible to describe.",
    "The concrete is still curing. Roman pozzolana reacts with seawater and strengthens over centuries.",
  ];

  const chapters = chaptersProp?.length ? chaptersProp : [
    { n: 1, title: "The Beast Awakens",        dur: "4:22" },
    { n: 2, title: "Fifty Thousand Witnesses", dur: "6:01" },
    { n: 3, title: "The Concrete Memory",      dur: "5:38" },
  ];

  return (
    <div className="cw-grain" style={{ background: T.bone, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Back */}
      <div style={{ padding: "48px 24px 16px", flexShrink: 0 }}>
        <button type="button" onClick={() => (onBack ? onBack() : navigate("E1"))} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: T.muted, fontFamily: F.body, fontSize: 13, padding: 0 }}>
          <ChevronLeft size={16} /> Journal
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 24px 48px" }}>
        <Eyebrow color={accent} hairline>{actLabel}</Eyebrow>
        <h2 style={{ fontFamily: F.display, fontSize: 28, color: T.ink, fontWeight: 300, lineHeight: 1.1, margin: "10px 0 20px" }}>{title}</h2>

        {onWalkToStop ? (
          <button
            type="button"
            onClick={onWalkToStop}
            style={{
              width: '100%',
              marginBottom: 20,
              padding: '13px 16px',
              borderRadius: 12,
              border: 'none',
              background: accent,
              color: T.warmWhite,
              fontFamily: F.body,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Walk to this stop
          </button>
        ) : null}

        {/* Large 4:5 diptych */}
        <div style={{ display: "flex", marginBottom: 8, borderRadius: 14, overflow: "hidden", height: halfH }}>
          <div style={{ width: halfW, flexShrink: 0, overflow: "hidden" }}>
            <img src={nowPhoto} alt="TODAY" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
          </div>
          <div style={{ width: 1.5, flexShrink: 0, background: T.ember, boxShadow: "0 0 10px rgba(232,161,60,0.55)", animation: "seamBreathe 3s ease-in-out infinite" }} />
          <div style={{ flex: 1, overflow: "hidden" }}>
            <img src={thenPhoto} alt="c. 80 AD" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", filter: "sepia(65%) contrast(0.80) brightness(0.74) saturate(1.2)" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 9, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase" }}>TODAY</span>
          <span style={{ fontSize: 9, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase" }}>c. 80 AD</span>
        </div>
        <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.6, marginBottom: 26, fontStyle: "italic" }}>
          Statue placement evidence-based; crowd density and awning colours informed conjecture.
        </p>

        {/* Key facts — editorial list, hairline-separated, no bullets */}
        <p style={{ fontSize: 11, color: accent, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>KEY FACTS</p>
        {facts.map((fact, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: `${T.muted}28`, margin: "14px 0" }} />}
            <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.75 }}>{fact}</p>
          </div>
        ))}

        {/* Transcript accordion */}
        <div style={{ marginTop: 28, marginBottom: 24 }}>
          <button onClick={() => setTxOpen(!txOpen)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: "14px 0", borderTop: `1px solid ${T.muted}28`, borderBottom: `1px solid ${T.muted}28` }}>
            <span style={{ fontSize: 13, color: T.ink, fontWeight: 500, fontFamily: F.body }}>Full transcript</span>
            <ChevronDown size={16} color={T.muted} style={{ transform: txOpen ? "rotate(180deg)" : "none", transition: "transform 250ms" }} />
          </button>
          {txOpen && (
            <div style={{ padding: "16px 0 8px" }}>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.82 }}>
                {transcript ?? '"You are standing at the largest amphitheater ever built. The Romans called it the Flavian Amphitheatre — the Colosseum is a nickname. Vespasian began it. Titus opened it in 80 AD with one hundred days of games. Both are dead, and the building is not. That tells you something about what they understood about power..."'}
              </p>
              <p style={{ fontSize: 11, color: `${T.muted}88`, marginTop: 10, fontStyle: "italic" }}>— Chapter I, The Beast Awakens</p>
            </div>
          )}
        </div>

        {/* Per-chapter listen-again rows */}
        <p style={{ fontSize: 11, color: accent, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>CHAPTERS</p>
        {chapters.map((ch, i) => (
          <div key={ch.n ?? i}>
            {i > 0 && <div style={{ height: 1, background: `${T.muted}20` }} />}
            <button
              type="button"
              onClick={onWalkToStop}
              style={{ width: '100%', display: "flex", alignItems: "center", gap: 14, padding: "12px 0", cursor: "pointer", background: 'none', border: 'none', textAlign: 'left' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 18, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Play size={13} fill={accent} color={accent} style={{ marginLeft: 2 }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: T.ink, fontWeight: 500, lineHeight: 1.3, marginBottom: 2 }}>{ch.title ?? ch}</p>
                <p style={{ fontSize: 12, color: T.muted }}>Chapter {ch.n ?? i + 1}</p>
              </div>
              <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{ch.dur ?? ''}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
