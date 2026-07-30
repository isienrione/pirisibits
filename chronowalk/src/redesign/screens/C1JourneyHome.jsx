import { useState } from "react";
import { Settings } from "lucide-react";
import { T, F } from "../tokens.js";
import { colosseumNow, pantheonNow, capitolineNow, spanishSteps, severusNow, trajansNow, palatineNow } from "../images.js";
import { RedesignNavCtx } from '../nav.js';
import { Eyebrow, Seam } from '../ui/index.js';
import { useContext } from "react";
import { C1bRouteSheet } from './C1bRouteSheet.jsx';

export default function C1JourneyHome() {
  const { navigate } = useContext(RedesignNavCtx);
  const [sheetOpen, setSheetOpen] = useState(false);

  const acts = [
    { num: "I",   color: T.actI,   name: "The Arena",       promise: "Where it all began. The crowd remembers.",                  status: "current", photo: colosseumNow  },
    { num: "II",  color: T.actII,  name: "The Sacred Way",  promise: "The road Caesar walked - in both directions.",              status: "ahead",   photo: palatineNow    },
    { num: "III", color: T.actIII, name: "The Forum",       promise: "Nine stops, one drained swamp, the centre of the world.",   status: "ahead",   photo: capitolineNow },
    { num: "IV",  color: T.actIV,  name: "The Market",      promise: "Trade, gossip, and the smell of fresh bread.",              status: "ahead",   photo: trajansNow    },
    { num: "V",   color: T.actV,   name: "The Living City", promise: "The centuries pile up and somehow stay distinct.",          status: "ahead",   photo: pantheonNow   },
    { num: "VI",  color: T.actVI,  name: "The River",       promise: "Everything Rome built, it built toward this water.",        status: "ahead",   photo: spanishSteps  },
    { num: "ENC", color: T.encore, name: "Optional Encore",  promise: "Via Appia Antica - estimated 30 min drive.",         status: "ahead",   photo: spanishSteps  },
  ];

  // Seam x-position: within the left third (about 38px from left edge)
  const SEAM_X = 38;
  const NODE_R  = 7;

  return (
    <div className="cw-grain" style={{ background: T.bone, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "48px 24px 16px", flexShrink: 0, position: "relative", zIndex: 2 }}>
        <Eyebrow color={T.actI} hairline>HEART OF ANCIENT ROME</Eyebrow>
        <button onClick={() => navigate("G1")} style={{ color: T.muted, background: "none", border: "none", cursor: "pointer", lineHeight: 0, padding: 4 }}>
          <Settings size={18} />
        </button>
      </div>

      {/* ── Act spine (scrollable) ── */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", position: "relative" }}>
        {/* Vertical ember Seam - left third of screen */}
        <div style={{
          position: "absolute",
          left: SEAM_X,
          top: 0, bottom: 0,
          width: 1.5,
          background: T.ember,
          boxShadow: "0 0 12px rgba(232,161,60,0.45)",
          animation: "seamBreathe 3s ease-in-out infinite",
          zIndex: 0,
        }} />

        {/* Act rows */}
        <div style={{ paddingBottom: 16 }}>
          {acts.map((act) => (
            <div
              key={act.num}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                // left padding = left margin + room for seam node
                padding: `14px 20px 14px ${SEAM_X + NODE_R + 14}px`,
                gap: 12,
              }}
            >
              {/* Node indicator - sits ON the seam */}
              <div style={{
                position: "absolute",
                left: SEAM_X - NODE_R,
                top: "50%",
                transform: "translateY(-50%)",
                width: NODE_R * 2,
                height: NODE_R * 2,
                borderRadius: NODE_R,
                zIndex: 2,
                ...(act.status === "current" ? {
                  background: act.color,
                  boxShadow: `0 0 0 5px ${act.color}28, 0 0 14px ${act.color}70`,
                  animation: "presencePulse 3s ease-in-out infinite",
                } : act.status === "done" ? {
                  background: act.color,
                } : {
                  background: T.bone,
                  border: `1.5px solid ${T.ink800}`,
                }),
              }} />

              {/* 56 × 56 photo thumb - leads the row */}
              <img
                src={act.photo}
                alt={act.name}
                style={{
                  width: 56, height: 56,
                  borderRadius: 10,
                  objectFit: "cover",
                  flexShrink: 0,
                  filter: act.status === "ahead"
                    ? "brightness(0.7) saturate(0.55)"
                    : "none",
                  transition: "filter 300ms",
                }}
              />

              {/* Text block */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Roman numeral eyebrow in act accent */}
                <span style={{
                  fontFamily: F.body,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: act.status === "ahead" ? `${act.color}70` : act.color,
                  fontWeight: 500,
                  display: "block",
                  marginBottom: 2,
                }}>
                  {act.num === "ENC" ? "ENCORE" : `ACT ${act.num}`}
                </span>

                {/* Act name - Fraunces 22 */}
                <p style={{
                  fontFamily: F.display,
                  fontSize: 22,
                  color: act.status === "ahead" ? `${T.ink}85` : T.ink,
                  fontWeight: 300,
                  lineHeight: 1.1,
                  marginBottom: 3,
                }}>
                  {act.name}
                </p>

                {/* One-line promise - DM Sans 13 muted */}
                <p style={{
                  fontSize: 13,
                  color: T.muted,
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {act.promise}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom CTAs (above tab bar) ── */}
      <div style={{
        flexShrink: 0,
        padding: "16px 24px 16px",
        background: `linear-gradient(to bottom, ${T.bone}00 0%, ${T.bone} 18%)`,
        borderTop: `1px solid ${T.ink800}18`,
        position: "relative", zIndex: 5,
      }}>
        <button
          onClick={() => navigate("C2")}
          style={{
            width: "100%", padding: "15px",
            background: T.actI, color: T.warmWhite,
            borderRadius: 12, fontFamily: F.body,
            fontWeight: 600, fontSize: 15,
            border: "none", cursor: "pointer",
            marginBottom: 16,
            boxShadow: `0 0 22px ${T.actI}50`,
          }}
        >
          Begin Act I - The Arena
        </button>
        <div style={{ display: "flex", justifyContent: "center", gap: 36 }}>
          <button
            onClick={() => setSheetOpen(true)}
            style={{ fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: F.body }}
          >
            Route
          </button>
          <button
            style={{ fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer", fontFamily: F.body }}
          >
            Start from where I am
          </button>
        </div>
      </div>

      {/* Inline tab bar */}
      <div style={{
        flexShrink: 0, display: "flex",
        borderTop: `1px solid ${T.ink800}22`,
        background: T.bone, paddingBottom: 32, paddingTop: 4,
        zIndex: 5,
      }}>
        {(["JOURNEY", "MAP", "JOURNAL"]).map(tab => (
          <button key={tab} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 4, paddingTop: 8,
            fontFamily: F.body, fontSize: 10, letterSpacing: "0.12em",
            color: tab === "JOURNEY" ? T.actI : T.muted,
            background: "none", border: "none", cursor: "pointer",
          }}>
            <div style={{ width: 4, height: 4, borderRadius: 2, background: tab === "JOURNEY" ? T.actI : "transparent" }} />
            {tab}
          </button>
        ))}
      </div>

      {/* Route Sheet overlay */}
      {sheetOpen && <C1bRouteSheet onClose={() => setSheetOpen(false)} />}
    </div>
  );
}
