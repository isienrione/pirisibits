import { useState } from "react";
import { T, F } from "../tokens.js";
import { colosseumNow, capitolineNow, severusNow, trajansNow, archTitusNow, palatineNow, templeSaturnNow, viaSacraNow } from "../images.js";
import { Eyebrow } from '../ui/index.js';

export function C1bRouteSheet({ onClose }) {
  const [expanded, setExpanded] = useState(0); // first row expanded by default

  // Waypoints — walking order, grouped by act
  const groups = [
    {
      actNum: "I", actName: "The Arena", color: T.actI,
      stops: [
        { n: 1,  name: "The Colosseum",          hook: "Fifty thousand witnesses. Zero exits for gladiators.",       dur: "18 min", photo: colosseumNow  },
        { n: 2,  name: "The Arch of Constantine", hook: "Three emperors, one arch, not all remembered fondly.",       dur: "6 min",  photo: archTitusNow  },
        { n: 3,  name: "The Palatine Hill",       hook: "The emperors lived here. You can feel the advantage.",       dur: "12 min", photo: palatineNow },
      ],
    },
    {
      actNum: "III", actName: "The Forum", color: T.actIII,
      stops: [
        { n: 4,  name: "The Sacred Way",          hook: "The road that built the empire, one triumph at a time.",    dur: "8 min",  photo: viaSacraNow    },
        { n: 5,  name: "The Temple of Saturn",    hook: "Treasury, prison, gods — all sharing one corner.",          dur: "5 min",  photo: templeSaturnNow    },
      ],
    },
    {
      actNum: "IV", actName: "The Market", color: T.actIV,
      stops: [
        { n: 6,  name: "Trajan's Market",         hook: "Two thousand years ago, this was the shopping centre.",     dur: "10 min", photo: trajansNow    },
      ],
    },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40 }}>
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(22,19,15,0.45)", animation: "sheetFadeIn 200ms ease" }}
        onClick={onClose}
      />

      {/* Sheet — 20px radius, bone */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: "84%",
        background: T.bone,
        borderRadius: "20px 20px 0 0",
        display: "flex", flexDirection: "column",
        animation: "slideUp 320ms cubic-bezier(0.32,0.72,0,1)",
        boxShadow: "0 -8px 40px rgba(22,19,15,0.3)",
      }}>
        {/* Drag handle */}
        <div style={{ paddingTop: 12, paddingBottom: 6, display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: `${T.muted}45` }} />
        </div>

        {/* Sheet header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 20px 14px", flexShrink: 0 }}>
          <Eyebrow color={T.actI} hairline>ROUTE — 22 STOPS</Eyebrow>
          {onClose && (
            <button onClick={onClose} style={{ fontFamily: F.body, fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
              Done
            </button>
          )}
        </div>

        {/* Scrollable waypoint list */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {groups.map(group => (
            <div key={group.actNum}>
              {/* Act eyebrow */}
              <div style={{ padding: "14px 20px 8px" }}>
                <Eyebrow color={group.color} hairline>
                  ACT {group.actNum} — {group.actName}
                </Eyebrow>
              </div>

              {group.stops.map((stop) => {
                const isExpanded = expanded === stop.n;
                return (
                  <div key={stop.n}>
                    {/* Compact row */}
                    <div
                      onClick={() => setExpanded(isExpanded ? null : stop.n)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 20px",
                        cursor: "pointer",
                        background: isExpanded ? `${group.color}09` : "transparent",
                        borderLeft: isExpanded ? `2px solid ${group.color}` : "2px solid transparent",
                        transition: "background 200ms, border-color 200ms",
                      }}
                    >
                      {/* Walking-order number — mono */}
                      <span style={{
                        fontSize: 12, color: T.muted,
                        fontVariantNumeric: "tabular-nums",
                        width: 20, textAlign: "right", flexShrink: 0,
                        fontWeight: 300,
                      }}>
                        {stop.n}
                      </span>

                      {/* 48px photo thumb */}
                      <img
                        src={stop.photo} alt={stop.name}
                        style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                      />

                      {/* Name + hook */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 500, color: T.ink, lineHeight: 1.25, marginBottom: 2 }}>
                          {stop.name}
                        </p>
                        <p style={{
                          fontSize: 12, color: T.muted, lineHeight: 1.35,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {stop.hook}
                        </p>
                      </div>

                      {/* Duration — right-aligned mono */}
                      <span style={{
                        fontSize: 12, color: T.muted,
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0, fontWeight: 300,
                      }}>
                        {stop.dur}
                      </span>
                    </div>

                    {/* Expanded preview card */}
                    {isExpanded && (
                      <div style={{ margin: "2px 20px 12px", borderRadius: 14, overflow: "hidden", background: T.warmWhite, boxShadow: "0 2px 12px rgba(33,28,21,0.08)" }}>
                        {/* 16:9 image */}
                        <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", overflow: "hidden" }}>
                          <img
                            src={stop.photo} alt={stop.name}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          {/* Subtle overlay with stop name */}
                          <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            background: "linear-gradient(to top, rgba(22,19,15,0.7) 0%, transparent 100%)",
                            padding: "20px 14px 12px",
                          }}>
                            <p style={{ fontFamily: F.display, fontSize: 18, color: T.warmWhite, fontWeight: 300 }}>{stop.name}</p>
                          </div>
                        </div>
                        {/* Hook + CTA */}
                        <div style={{ padding: "14px 16px 16px" }}>
                          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65, marginBottom: 14 }}>
                            {stop.hook}
                          </p>
                          <button style={{
                            fontFamily: F.body, fontSize: 13, fontWeight: 500,
                            color: group.color, background: "none", border: "none",
                            cursor: "pointer", padding: 0,
                          }}>
                            Take me there →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Footer space */}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}
