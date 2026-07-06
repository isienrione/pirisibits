import { useState, useEffect, useRef } from "react";
import { T, F } from "../tokens.js";
import { colosseumNow, capitolineNow, severusNow, trajansNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Eyebrow } from '../ui/index.js';
import { useContext } from "react";

export default function B4PaceSelector({
  options: optionsProp,
  selectedPace,
  onSelectPace,
  onContinue,
}) {
  const { navigate } = useContext(RedesignNavCtx);
  const [selected, setSelected] = useState(null);

  const defaultOptions = [
    {
      title: "The Classic Split",
      badge: "Most loved",
      desc: "The ancient city one outing, the living city another. Acts I–IV, then V–VI.",
      img: colosseumNow,
      dots: [T.actI, T.actII, T.actIII, T.actIV, null, null, null],
    },
    {
      title: "The Heroic Day",
      badge: null,
      desc: "All of it, dawn to golden hour. Bring real shoes and real ambition.",
      img: capitolineNow,
      dots: [T.actI, T.actII, T.actIII, T.actIV, T.actV, T.actVI, T.encore],
    },
    {
      title: "Your Own Pace",
      badge: null,
      desc: "Any act, any order, as many mornings as you like. I'll keep your place.",
      img: trajansNow,
      dots: [T.actI, null, T.actIII, null, T.actV, null, T.encore],
    },
  ];

  const options =
    optionsProp?.map((opt, i) => ({
      title: opt.title,
      badge: opt.badge ?? null,
      desc: opt.description,
      img: [colosseumNow, capitolineNow, trajansNow][i] ?? colosseumNow,
      dots: [
        [T.actI, T.actII, T.actIII, T.actIV, null, null, null],
        [T.actI, T.actII, T.actIII, T.actIV, T.actV, T.actVI, T.encore],
        [T.actI, null, T.actIII, null, T.actV, null, T.encore],
      ][i],
      id: opt.id,
    })) ?? defaultOptions;

  const activeIndex =
    selectedPace != null ? options.findIndex((opt) => opt.id === selectedPace) : selected;

  const handleSelect = (index) => {
    setSelected(index);
    onSelectPace?.(options[index].id);
  };

  const handleContinue = () => {
    if (activeIndex == null || activeIndex < 0) return
    if (onContinue) {
      onContinue()
      return
    }
    navigate('C2')
  }

  return (
    <div style={{ background: T.obsidian, height: '100%', fontFamily: F.body, display: 'flex', flexDirection: 'column', padding: '48px 24px 32px', overflow: 'hidden', position: 'relative' }}>
      {/* Subtle bg photo */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${severusNow})`,
        backgroundSize: "cover", backgroundPosition: "center 40%",
        filter: "brightness(0.12) saturate(0.4)",
        zIndex: 0,
      }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(22,19,15,0.7)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 5, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Seam top tick */}
        <div style={{ height: 32, position: "relative", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1.5, background: T.ember, opacity: 0.7, boxShadow: "0 0 12px rgba(232,161,60,0.45)" }} />
        </div>

        <Eyebrow color={T.ember}>BEFORE YOU BEGIN</Eyebrow>
        <h2 style={{ fontFamily: F.display, fontSize: 44, color: T.warmWhite, fontWeight: 300, lineHeight: 1.05, margin: "10px 0 20px", flexShrink: 0 }}>
          Choose your<br />rhythm.
        </h2>

        {/* Photo-led option cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflow: "hidden" }}>
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              style={{
                textAlign: 'left', background: T.ink,
                border: `1.5px solid ${activeIndex === i ? T.ember : T.ink800}`,
                borderRadius: 14, cursor: "pointer",
                transition: "border-color 300ms",
                flex: 1, overflow: "hidden", display: "flex", flexDirection: "column",
                boxShadow: activeIndex === i ? '0 0 20px rgba(232,161,60,0.15)' : 'none',
              }}
            >
              {/* 4:3 photo header */}
              <div style={{ width: "100%", height: 80, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                <img
                  src={opt.img}
                  alt={opt.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', filter: `brightness(${activeIndex === i ? 0.7 : 0.55})`, transition: 'filter 300ms' }}
                />
                {/* Gradient over photo */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(33,28,21,0.7) 0%, transparent 60%)" }} />
                {/* Title on photo */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "0 14px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span style={{ fontFamily: F.display, fontSize: 20, color: T.warmWhite, fontWeight: 400, lineHeight: 1.1 }}>
                      {opt.title}
                    </span>
                    {opt.badge && (
                      <span style={{ fontSize: 9, color: T.ember, border: `1px solid ${T.ember}50`, borderRadius: 6, padding: "2px 7px", letterSpacing: "0.12em" }}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Text + dots */}
              <div style={{ padding: "10px 14px 12px" }}>
                <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginBottom: 10 }}>{opt.desc}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {opt.dots.map((color, di) => (
                    <div key={di} style={{ width: 8, height: 8, borderRadius: 4, background: color ?? T.ink800, opacity: color ? 1 : 0.35 }} />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, textAlign: "center", margin: "14px 0 10px", flexShrink: 0 }}>
          You can change your mind at any time. Nothing expires. Nothing is skipped forever.
        </p>

        <button
          type="button"
          onClick={handleContinue}
          style={{
            width: '100%', padding: '15px',
            background: activeIndex != null && activeIndex >= 0 ? T.ember : T.ink800,
            color: activeIndex != null && activeIndex >= 0 ? T.obsidian : T.muted,
            borderRadius: 12, fontFamily: F.body, fontWeight: 600, fontSize: 15,
            border: 'none', cursor: activeIndex != null && activeIndex >= 0 ? 'pointer' : 'default',
            transition: 'background 300ms, color 300ms', flexShrink: 0,
            boxShadow: activeIndex != null && activeIndex >= 0 ? '0 0 20px rgba(232,161,60,0.35)' : 'none',
          }}
        >
          {activeIndex != null && activeIndex >= 0 ? `Begin — ${options[activeIndex].title}` : 'Select a pace'}
        </button>
      </div>
    </div>
  );
}
