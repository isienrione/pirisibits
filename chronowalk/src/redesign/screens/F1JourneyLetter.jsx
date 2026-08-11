import { useState, useEffect } from "react";
import { T, F } from "../tokens.js";
import { spanishSteps } from "../images.js";
import { Vignette, BottomScrim } from '../ui/index.js';
import { useT } from '../../i18n/I18nProvider.jsx'

export default function F1JourneyLetter({
  firstName = "",
  body = null,
  reflection = "- Your companion",
  stats = null,
  busy = false,
  statusMessage = "",
  travelerName = "",
  onTravelerNameChange,
  onSave,
  onShare,
  onBack,
}) {
  const t = useT()
  const [phase, setPhase] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(travelerName || "");

  useEffect(() => {
    setNameDraft(travelerName || "");
  }, [travelerName]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2600);
    const t2 = setTimeout(() => setPhase(2), 4200);
    const t3 = setTimeout(() => setPhase(3), 6400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const segments = [
    { d: "M 44 158 Q 68 148 88 134",  color: T.actI   },
    { d: "M 88 134 Q 118 118 142 110", color: T.actII  },
    { d: "M 142 110 Q 172 96 198 86",  color: T.actIII },
    { d: "M 198 86 Q 228 72 252 62",   color: T.actIV  },
    { d: "M 252 62 Q 284 50 308 42",   color: T.actV   },
    { d: "M 308 42 Q 334 30 354 22",   color: T.actVI  },
    { d: "M 354 22 Q 366 16 378 14",   color: T.encore },
  ];

  const waypoints = [
    { cx: 44, cy: 158, color: T.actI }, { cx: 142, cy: 110, color: T.actIII },
    { cx: 198, cy: 86, color: T.actIII }, { cx: 252, cy: 62, color: T.actIV },
    { cx: 308, cy: 42, color: T.actV }, { cx: 354, cy: 22, color: T.actVI },
    { cx: 378, cy: 14, color: T.encore },
  ];

  const displayName = firstName || t('letter.traveler')
  const resolvedBody = body ?? t('letter.defaultBody')
  const resolvedStats = stats ?? [
    { v: "28 km", l: t('letter.stat.walked') },
    { v: "6h 40m", l: t('letter.stat.inRome') },
    { v: "21", l: t('letter.stat.centuries') },
  ]

  const commitName = () => {
    onTravelerNameChange?.(nameDraft.trim());
    setEditingName(false);
  };

  return (
    <div style={{ background: T.obsidian, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${spanishSteps})`,
        backgroundSize: "cover", backgroundPosition: "center 30%",
        filter: "brightness(0.32) saturate(0.9)",
        zIndex: 0,
      }} />
      <Vignette />
      <BottomScrim strength={0.94} />

      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%", padding: "52px 28px 28px", overflowY: "auto", scrollbarWidth: "none" }}>
        <div style={{ flexShrink: 0, height: 170, position: "relative", marginBottom: 4 }}>
          <svg width="100%" height="170" viewBox="0 0 390 170" preserveAspectRatio="xMinYMin meet">
            <line x1="0" y1="90" x2="390" y2="90" stroke={T.ink800} strokeWidth="1" />
            <line x1="195" y1="0" x2="195" y2="170" stroke={T.ink800} strokeWidth="1" />
            {segments.map((seg, i) => (
              <path key={i} d={seg.d} stroke={seg.color} strokeWidth="2.5" strokeLinecap="round" fill="none"
                style={{
                  strokeDasharray: 200, strokeDashoffset: phase === 0 ? 200 : 0,
                  transition: `stroke-dashoffset 380ms ease-out ${i * 340}ms`,
                  filter: `drop-shadow(0 0 4px ${seg.color}88)`,
                }}
              />
            ))}
            {waypoints.map((pt, i) => (
              <circle key={i} cx={pt.cx} cy={pt.cy} r={4} fill={pt.color}
                style={{ opacity: phase === 0 ? 0 : 1, transition: `opacity 300ms ${i * 300 + 600}ms`, filter: `drop-shadow(0 0 4px ${pt.color})` }}
              />
            ))}
            <text x="50" y="169" style={{ fontSize: "9px", letterSpacing: "0.1em" }} fill={T.muted}>{t('letter.map.colosseum')}</text>
            <text x="335" y="12" style={{ fontSize: "9px", letterSpacing: "0.1em" }} fill={T.encore}>{t('letter.map.castel')}</text>
          </svg>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28, flexShrink: 0, opacity: phase >= 1 ? 1 : 0, transition: "opacity 700ms" }}>
          {resolvedStats.map(s => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, color: T.warmWhite, fontVariantNumeric: "tabular-nums", fontWeight: 300 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ opacity: phase >= 2 ? 1 : 0, transition: "opacity 800ms", flex: 1, flexShrink: 0 }}>
          <div style={{ width: 1.5, height: 32, background: T.ember, marginBottom: 24, opacity: 0.8, animation: "seamBreathe 3s ease-in-out infinite", boxShadow: "0 0 12px rgba(232,161,60,0.45)" }} />
          <div style={{ fontFamily: F.display, color: T.warmWhite, fontWeight: 300 }}>
            {typeof onTravelerNameChange === 'function' ? (
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 12, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {t('letter.addressTo')}
                </p>
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onFocus={() => setEditingName(true)}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  placeholder={t('letter.traveler')}
                  aria-label={t('letter.nameAria')}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1px solid ${T.ink800}`,
                    background: 'rgba(11,11,13,0.55)',
                    color: T.warmWhite,
                    fontFamily: F.display,
                    fontSize: 18,
                    fontWeight: 300,
                  }}
                />
              </div>
            ) : null}
            <p style={{ fontSize: 24, marginBottom: 22, textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
              {t('letter.dear', { name: displayName })}{editingName ? '' : ''}
            </p>
            <p style={{ fontSize: 19, lineHeight: 1.78, textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
              {resolvedBody}
            </p>
            <p style={{ fontSize: 16, color: T.muted, fontStyle: "italic", marginTop: 24 }}>
              {reflection}
            </p>
          </div>
        </div>

        <div style={{ opacity: phase >= 3 ? 1 : 0, transition: "opacity 800ms", marginTop: 28, flexShrink: 0 }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave?.()}
            style={{
            width: "100%", padding: "16px", background: T.ember, color: T.obsidian,
            borderRadius: 12, fontFamily: F.body, fontWeight: 600, fontSize: 15,
            border: "none", cursor: busy ? 'wait' : "pointer", marginBottom: 10,
            boxShadow: "0 0 24px rgba(232,161,60,0.45)",
          }}>{t('letter.keep')}</button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onShare?.()}
            style={{ width: "100%", padding: "12px", textAlign: "center", color: T.muted, fontSize: 14, background: "none", border: "none", cursor: busy ? 'wait' : "pointer", marginBottom: 18 }}
          >{t('letter.share')}</button>
          {statusMessage ? (
            <p style={{ fontSize: 12, color: T.actII, marginBottom: 12, textAlign: 'center' }}>{statusMessage}</p>
          ) : null}
          {onBack ? (
            <button type="button" onClick={onBack} style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${T.ink800}`, color: T.muted, borderRadius: 10, cursor: 'pointer' }}>
              {t('letter.back')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
