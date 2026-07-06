import { ChevronRight } from "lucide-react";
import { useContext } from "react";
import { T, F } from "../tokens.js";
import { RedesignNavCtx } from '../nav.js';

export default function G1Settings({
  prefs,
  onSetPref,
  onDone,
  onCredits,
  onOffline,
  onPace,
  onRestoreAccess,
}) {
  const { navigate } = useContext(RedesignNavCtx);

  const state = prefs ?? {
    backgroundPlay: true,
    autoAdvance: false,
    hapticFeedback: true,
    reduceMotion: false,
    playbackSpeed: 1,
    ambientBed: 'Subtle',
  };

  const setState = (patch) => {
    Object.entries(patch).forEach(([key, value]) => onSetPref?.(key, value));
  };

  function Toggle({ on, onToggle }) {
    return (
      <button onClick={onToggle} style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? "#5B5249" : `${T.muted}38`,
        position: "relative", border: "none", cursor: "pointer",
        transition: "background 250ms", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 3, left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: 10,
          background: T.warmWhite,
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          transition: "left 250ms",
        }} />
      </button>
    );
  }

  function Row({ label, sub, right }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
        <div>
          <p style={{ fontSize: 15, color: T.ink, lineHeight: 1.3 }}>{label}</p>
          {sub && <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</p>}
        </div>
        {right}
      </div>
    );
  }

  function SectionLabel({ children }) {
    return <p style={{ fontSize: 11, color: T.muted, letterSpacing: "0.18em", textTransform: "uppercase", padding: "20px 0 6px" }}>{children}</p>;
  }

  function Hairline() {
    return <div style={{ height: 1, background: `${T.muted}28` }} />;
  }

  return (
    <div className="cw-grain" style={{ background: T.bone, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "48px 24px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <h2 style={{ fontFamily: F.display, fontSize: 26, color: T.ink, fontWeight: 300 }}>Settings</h2>
        <button type="button" onClick={() => (onDone ? onDone() : navigate("C1"))} style={{ fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: F.body }}>Done</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 24px 48px" }}>

        {/* Playback */}
        <SectionLabel>Playback</SectionLabel>
        <Hairline />
        <Row label="Narration speed" sub="Default for new chapters"
          right={
            <div style={{ display: "flex", background: `${T.muted}22`, borderRadius: 8, padding: 2, gap: 2 }}>
              {[1, 1.5, 2].map((speed) => {
                const label = speed === 1 ? '1×' : `${speed}×`
                const active = Number(state.playbackSpeed ?? 1) === speed
                return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setState({ playbackSpeed: speed })}
                  style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, fontFamily: F.body, background: active ? T.warmWhite : "transparent", color: active ? T.ink : T.muted, border: "none", cursor: "pointer" }}
                >
                  {label}
                </button>
              )})}
            </div>
          }
        />
        <Hairline />
        <Row label="Background audio" sub="Ambient bed continues on lock screen"
          right={<Toggle on={state.backgroundPlay} onToggle={() => setState({ backgroundPlay: !state.backgroundPlay })} />}
        />
        <Hairline />
        <Row label="Auto-advance chapters" sub="Where chapters are marked for it"
          right={<Toggle on={state.autoAdvance} onToggle={() => setState({ autoAdvance: !state.autoAdvance })} />}
        />

        {/* Sound */}
        <SectionLabel>Sound</SectionLabel>
        <Hairline />
        <Row label="Ambient bed" sub="Narration volume follows system"
          right={
            <div style={{ display: "flex", background: `${T.muted}22`, borderRadius: 8, padding: 2, gap: 2 }}>
              {["Subtle","Off"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setState({ ambientBed: mode })}
                  style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontFamily: F.body, background: (state.ambientBed ?? 'Subtle') === mode ? T.warmWhite : "transparent", color: (state.ambientBed ?? 'Subtle') === mode ? T.ink : T.muted, border: "none", cursor: "pointer" }}
                >
                  {mode}
                </button>
              ))}
            </div>
          }
        />

        {/* Device */}
        <SectionLabel>Device</SectionLabel>
        <Hairline />
        <Row label="Haptics"
          right={<Toggle on={state.hapticFeedback} onToggle={() => setState({ hapticFeedback: !state.hapticFeedback })} />}
        />
        <Hairline />
        <Row label="Reduce motion"
          right={<Toggle on={state.reduceMotion} onToggle={() => setState({ reduceMotion: !state.reduceMotion })} />}
        />

        {/* Content */}
        <SectionLabel>Content</SectionLabel>
        <Hairline />
        <button type="button" onClick={() => (onOffline ? onOffline() : navigate("B2"))} style={{ width: "100%", textAlign: "left", padding: "14px 0", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 15, color: T.ink }}>Offline content</p>
          <ChevronRight size={16} color={T.muted} />
        </button>
        <Hairline />
        <button type="button" onClick={() => (onPace ? onPace() : navigate("B4"))} style={{ width: "100%", textAlign: "left", padding: "14px 0", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 15, color: T.ink }}>Your pace</p>
          <ChevronRight size={16} color={T.muted} />
        </button>

        {/* Access */}
        <SectionLabel>Access</SectionLabel>
        <Hairline />
        <Row label="Restore access" sub="Opens your magic link email" right={
          <button type="button" onClick={() => onRestoreAccess?.()} style={{ fontSize: 13, color: T.ember, background: 'none', border: 'none', cursor: 'pointer' }}>Restore</button>
        } />
        <Hairline />
        <Row label="Devices" sub="2 devices linked" />

        {/* Legal & Credits */}
        <SectionLabel>Legal & Credits</SectionLabel>
        <Hairline />
        <button type="button" onClick={() => (onCredits ? onCredits() : navigate("G2"))} style={{ width: "100%", textAlign: "left", padding: "14px 0", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 15, color: T.ink }}>Credits & Attribution</p>
          <ChevronRight size={16} color={T.muted} />
        </button>
        <Hairline />
        <p style={{ fontSize: 12, color: T.muted, padding: "16px 0" }}>ChronoWalk Rome · Version 1.0.0</p>
      </div>
    </div>
  );
}
