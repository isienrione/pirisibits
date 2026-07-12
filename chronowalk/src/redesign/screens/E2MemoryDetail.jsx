import { useState } from "react";
import { Play, ChevronLeft, ChevronDown } from "lucide-react";
import { useContext } from "react";
import {T, F, withAlpha} from "../tokens.js";
import { colosseumNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Eyebrow } from '../ui/index.js';
import C7Threshold from './C7Threshold.jsx';

export default function E2MemoryDetail({
  accent = T.actI,
  actLabel = 'ACT I — THE ARENA',
  title = 'The Colosseum',
  nowPhoto = colosseumNow,
  thenPhoto = colosseumNow,
  thenLoop = null,
  thenLabel = 'ANCIENT ROME',
  honestyCaption = 'Interpretive reconstruction informed by archaeology and scholarship.',
  signatureLine: sigLine = 'The concrete is still crystallizing.',
  facts: factsProp,
  transcript,
  chapters: chaptersProp,
  onBack,
  onWalkToStop,
  onStepThroughTime,
  onAudioOnly,
  onTranscript,
  onViewImages,
}) {
  const { navigate } = useContext(RedesignNavCtx);

  const immersionH = Math.round(((390 - 48) * 4) / 3);

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
              marginBottom: 12,
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

        {(onStepThroughTime || onAudioOnly || onTranscript || onViewImages) ? (
          <div style={{ marginBottom: 20 }}>
            {onStepThroughTime ? (
              <button
                type="button"
                onClick={onStepThroughTime}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: accent,
                  color: T.warmWhite,
                  fontFamily: F.body,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                Step through time
              </button>
            ) : null}
            <div style={{ display: 'flex', gap: 8, marginBottom: onViewImages ? 8 : 0 }}>
              {onAudioOnly ? (
                <button
                  type="button"
                  onClick={onAudioOnly}
                  style={{
                    flex: 1,
                    padding: '12px 10px',
                    borderRadius: 999,
                    border: `1.5px solid ${withAlpha(T.mutedDecor, '55')}`,
                    background: 'transparent',
                    color: T.ink,
                    fontFamily: F.body,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Audio only
                </button>
              ) : null}
              {onTranscript ? (
                <button
                  type="button"
                  onClick={onTranscript}
                  style={{
                    flex: 1,
                    padding: '12px 10px',
                    borderRadius: 999,
                    border: `1.5px solid ${withAlpha(T.mutedDecor, '55')}`,
                    background: 'transparent',
                    color: T.ink,
                    fontFamily: F.body,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Transcript
                </button>
              ) : null}
            </div>
            {onViewImages ? (
              <button
                type="button"
                onClick={onViewImages}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 999,
                  border: `1.5px solid ${accent}55`,
                  background: 'transparent',
                  color: accent,
                  fontFamily: F.body,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                View images only
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Interactive threshold — hold or drag the seam */}
        <p style={{ fontSize: 11, color: accent, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 10 }}>
          Immersion
        </p>
        <div
          style={{
            marginBottom: 8,
            borderRadius: 16,
            overflow: 'hidden',
            height: Math.min(immersionH, 360),
            boxShadow: '0 8px 28px rgba(33,28,21,0.12)',
          }}
        >
          <C7Threshold
            embedded
            nowPhoto={nowPhoto}
            thenPhoto={thenPhoto}
            thenLoop={thenLoop}
            thenLabel={thenLabel}
            honestyCaption={honestyCaption}
          />
        </div>
        <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginBottom: 6, letterSpacing: '0.08em' }}>
          Then · Now
        </p>
        <p style={{ fontSize: 11, color: T.muted, lineHeight: 1.6, marginBottom: 26, fontStyle: 'italic' }}>
          {honestyCaption}
        </p>

        {/* Key facts — editorial list, hairline-separated, no bullets */}
        <p style={{ fontSize: 11, color: accent, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>KEY FACTS</p>
        {facts.map((fact, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: `${withAlpha(T.mutedDecor, '28')}`, margin: "14px 0" }} />}
            <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.75 }}>{fact}</p>
          </div>
        ))}

        {/* Transcript accordion */}
        <div style={{ marginTop: 28, marginBottom: 24 }}>
          <button onClick={() => setTxOpen(!txOpen)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: "14px 0", borderTop: `1px solid ${withAlpha(T.mutedDecor, '28')}`, borderBottom: `1px solid ${withAlpha(T.mutedDecor, '28')}` }}>
            <span style={{ fontSize: 13, color: T.ink, fontWeight: 500, fontFamily: F.body }}>Full transcript</span>
            <ChevronDown size={16} color={T.muted} style={{ transform: txOpen ? "rotate(180deg)" : "none", transition: "transform 250ms" }} />
          </button>
          {txOpen && (
            <div style={{ padding: "16px 0 8px" }}>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.82 }}>
                {transcript ?? '"You are standing at the largest amphitheater ever built. The Romans called it the Flavian Amphitheatre — the Colosseum is a nickname. Vespasian began it. Titus opened it in 80 AD with one hundred days of games. Both are dead, and the building is not. That tells you something about what they understood about power..."'}
              </p>
              <p style={{ fontSize: 11, color: `${withAlpha(T.muted, '88')}`, marginTop: 10, fontStyle: "italic" }}>— Chapter I, The Beast Awakens</p>
            </div>
          )}
        </div>

        {/* Per-chapter listen-again rows */}
        <p style={{ fontSize: 11, color: accent, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>CHAPTERS</p>
        {chapters.map((ch, i) => (
          <div key={ch.n ?? i}>
            {i > 0 && <div style={{ height: 1, background: `${withAlpha(T.mutedDecor, '20')}` }} />}
            <button
              type="button"
              onClick={onAudioOnly ?? onWalkToStop}
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
