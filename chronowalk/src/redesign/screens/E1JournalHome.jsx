import { useState } from "react";
import { Play } from "lucide-react";
import { useContext } from "react";
import { T, F, S, SHELL_TAB_BAR_INSET } from "../tokens.js";
import { colosseumNow, pantheonNow, capitolineNow, severusNow, archTitusNow, palatineNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import {
  Eyebrow,
  MiniActLine,
  ScreenHeader,
  SurfaceCard,
  TabBar,
  PrimaryButton,
  CinematicImage,
} from '../ui/index.js';

export default function E1JournalHome({
  embedded = false,
  headline = 'Your Rome',
  subtitle = '2–3 July 2025',
  groups: groupsProp = null,
  empty = false,
  loading = false,
  onStartWalk,
  onCardClick,
  onLetterClick,
  onAllStopsClick,
  onSettingsClick,
  showDevToggle = !embedded,
}) {
  const { navigate } = useContext(RedesignNavCtx);
  const [showEmptyDev, setShowEmptyDev] = useState(false);

  const defaultGroups = [
    {
      act: "I", color: T.actI, name: "The Arena",
      cards: [
        { id: 0, name: "The Colosseum",      sigLine: "The concrete is still crystallizing.", ts: "Yesterday · 14:32", photo: colosseumNow },
        { id: 1, name: "Arch of Constantine",sigLine: "Three names, one monument, no consensus.", ts: "Yesterday · 15:08", photo: archTitusNow },
      ],
    },
    {
      act: "II", color: T.actII, name: "The Sacred Way",
      cards: [
        { id: 2, name: "The Palatine Hill",  sigLine: "Power lived here. Comfort came later.", ts: "Today · 09:15", photo: palatineNow },
      ],
    },
    {
      act: "III", color: T.actIII, name: "The Forum",
      cards: [
        { id: 3, name: "The Roman Forum", sigLine: "Nine stops, one drained swamp, the centre of the world.", ts: "Today · 10:44", photo: severusNow },
      ],
    },
  ];

  const groups = groupsProp ?? defaultGroups;
  const showEmpty = empty || (showDevToggle && showEmptyDev);

  if (loading) {
    return (
      <div className="cw-grain" style={{ background: T.bone, height: '100%', fontFamily: F.body, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: T.muted }}>Gathering your path…</p>
      </div>
    );
  }

  return (
    <div className="cw-grain" style={{ background: T.bone, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Header */}
      <ScreenHeader
        layout="split"
        title={headline}
        titleSize={30}
        subtitle={subtitle}
        onSettings={onSettingsClick}
        trailing={
          <>
            {onAllStopsClick ? (
              <button type="button" onClick={onAllStopsClick} style={{ fontSize: 11, color: T.ember, background: 'none', border: `1px solid ${T.ember}44`, borderRadius: 8, padding: `${S.s} ${S.m}`, cursor: 'pointer', fontFamily: F.body }}>
                All stops
              </button>
            ) : null}
            {showDevToggle ? (
              <button onClick={() => setShowEmptyDev(!showEmptyDev)} style={{ fontSize: 10, color: T.muted, background: "none", border: `1px solid ${T.muted}40`, borderRadius: 8, padding: `3px ${S.m}`, cursor: "pointer", fontFamily: F.body }}>
                {showEmptyDev ? "filled" : "empty"}
              </button>
            ) : null}
          </>
        }
      />

      {showEmpty ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexDirection: 'column', gap: S.l, padding: `0 ${S.xl}` }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1.5, transform: "translateX(-50%)", background: T.ember, boxShadow: "0 0 10px rgba(232,161,60,0.4)", animation: "seamBreathe 3s ease-in-out infinite" }} />
          <p style={{ fontFamily: F.display, fontSize: 18, color: T.muted, fontStyle: "italic", lineHeight: 1.7, textAlign: "center", position: "relative", zIndex: 1 }}>
            Your journey will collect itself here. Walk, and Rome writes.
          </p>
          {onStartWalk ? (
            <div style={{ position: 'relative', zIndex: 1, width: 'auto' }}>
              <PrimaryButton color={T.ember} glow={false} onClick={onStartWalk} style={{ width: 'auto', padding: `${S.m} ${S.l}` }}>
                Start walking
              </PrimaryButton>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", paddingBottom: S.l, position: "relative", zIndex: 2 }}>

          {/* Journey Letter pinned — the ONE dark card in the light room */}
          <div style={{ padding: `${S.s} ${S.edge} ${S.xl}` }}>
            <SurfaceCard tone="dark" radius={14} padding={S.l}>
              <div style={{ marginBottom: S.m }}>
                <svg width="100%" height="26" viewBox="0 0 310 26" preserveAspectRatio="none">
                  {[
                    [T.actI, "M 0 13 L 44 13"],   [T.actII,  "M 44 13 L 88 13"],
                    [T.actIII,"M 88 13 L 132 13"],[T.actIV,  "M 132 13 L 176 13"],
                    [T.actV, "M 176 13 L 220 13"],[T.actVI,  "M 220 13 L 264 13"],
                    [T.encore,"M 264 13 L 310 13"],
                  ].map(([c, d], i) => (
                    <path key={i} d={d} stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${c}88)` }} />
                  ))}
                  <circle cx="2"   cy="13" r="3.5" fill={T.actI}   style={{ filter: `drop-shadow(0 0 3px ${T.actI})` }} />
                  <circle cx="308" cy="13" r="3.5" fill={T.encore} style={{ filter: `drop-shadow(0 0 3px ${T.encore})` }} />
                </svg>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: F.display, fontSize: 22, color: T.warmWhite, fontWeight: 300, lineHeight: 1.2, marginBottom: S.s }}>Journey letter</p>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>Rome · 2–3 July 2025</p>
                </div>
                <button type="button" onClick={() => (onLetterClick ? onLetterClick() : navigate("F1"))} style={{ background: "none", border: "none", cursor: "pointer", color: T.ember, fontSize: 13, fontFamily: F.body, flexShrink: 0, marginLeft: 12 }}>Open</button>
              </div>
            </SurfaceCard>
          </div>

          {/* Act groups with memory cards */}
          {groups.map((group, gi) => (
            <div key={group.act}>
              {gi > 0 && <MiniActLine color={group.color} />}
              <div style={{ padding: `${S.m} ${S.edge}` }}>
                <Eyebrow color={group.color} hairline>ACT {group.act} — {group.name}</Eyebrow>
              </div>
              {group.cards.map(card => (
                <div key={card.id} style={{ padding: `0 ${S.edge} ${S.l}`, cursor: "pointer" }} onClick={() => (onCardClick ? onCardClick(card.id) : navigate("E2"))}>
                  <SurfaceCard tone="light" radius={12} padding={S.l}>
                    {/* Diptych: NOW | ember seam | THEN */}
                    <div style={{ display: "flex", marginBottom: S.l, borderRadius: 10, overflow: "hidden", height: 108 }}>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <CinematicImage
                          src={card.photo}
                          alt=""
                          aspect="fill"
                          height="100%"
                          radius="none"
                          grade="film"
                          overlay="soft"
                          position="upper"
                          shadow="none"
                        />
                      </div>
                      <div style={{ width: 1.5, flexShrink: 0, background: T.ember, boxShadow: "0 0 6px rgba(232,161,60,0.55)", animation: "seamBreathe 3s ease-in-out infinite" }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <CinematicImage
                          src={card.photo}
                          alt=""
                          aspect="fill"
                          height="100%"
                          radius="none"
                          grade="none"
                          overlay="vignette"
                          position="upper"
                          shadow="none"
                          extraFilter="sepia(0.65) contrast(0.8) brightness(0.76)"
                        />
                      </div>
                    </div>
                    <p style={{ fontFamily: F.display, fontSize: 20, color: T.ink, fontWeight: 300, lineHeight: 1.2, marginBottom: S.m }}>{card.name}</p>
                    <p style={{ fontSize: 14, color: T.muted, fontStyle: "italic", lineHeight: 1.55, marginBottom: S.m }}>"{card.sigLine}"</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        type="button"
                        aria-label={`Open ${card.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onCardClick) onCardClick(card.id)
                          else navigate('E2')
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: `${group.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Play size={11} fill={group.color} color={group.color} style={{ marginLeft: 2 }} />
                        </div>
                      </button>
                      <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: "tabular-nums" }}>{card.ts}</span>
                    </div>
                  </SurfaceCard>
                </div>
              ))}
            </div>
          ))}
          <div style={{ height: embedded ? SHELL_TAB_BAR_INSET : 12 }} />
        </div>
      )}

      {!embedded && <TabBar active="JOURNAL" />}
    </div>
  );
}
