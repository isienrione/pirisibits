import { ChevronLeft } from "lucide-react";
import { useContext } from "react";
import { T, F } from "../tokens.js";
import { RedesignNavCtx } from '../nav.js';

export default function G2Credits({ onBack }) {
  const { navigate } = useContext(RedesignNavCtx);

  const attributions = [
    {
      stop: "The Colosseum",
      items: [
        { type: "NOW photograph", author: "Dario Veronesi", license: "Unsplash License", url: "unsplash.com/@dariovero_" },
        { type: "THEN reconstruction", author: "AI-generated (Midjourney v6)", license: "Commercial use · disclosed", url: "" },
      ],
    },
    {
      stop: "Arch of Constantine",
      items: [
        { type: "NOW photograph", author: "David Köhler", license: "Unsplash License", url: "unsplash.com/@davidkhlr" },
        { type: "THEN reconstruction", author: "AI-generated (Midjourney v6)", license: "Commercial use · disclosed", url: "" },
      ],
    },
    {
      stop: "The Pantheon",
      items: [
        { type: "NOW photograph", author: "Fadi Al Shami", license: "Unsplash License", url: "unsplash.com/@fadster666" },
        { type: "THEN reconstruction", author: "AI-generated (Midjourney v6)", license: "Commercial use · disclosed", url: "" },
      ],
    },
    {
      stop: "Capitoline Hill",
      items: [
        { type: "NOW photograph", author: "Massimo Virgilio", license: "Unsplash License", url: "unsplash.com/@massimovirgilio" },
        { type: "THEN reconstruction", author: "AI-generated (Midjourney v6)", license: "Commercial use · disclosed", url: "" },
      ],
    },
    {
      stop: "Roman Forum",
      items: [
        { type: "NOW photograph", author: "Nicholas Martinelli", license: "Unsplash License", url: "unsplash.com/@nickmartinelli98" },
        { type: "THEN reconstruction", author: "AI-generated (Midjourney v6)", license: "Commercial use · disclosed", url: "" },
      ],
    },
    {
      stop: "Trajan's Market",
      items: [
        { type: "NOW photograph", author: "Chad Greiter", license: "Unsplash License", url: "unsplash.com/@cgreiter" },
        { type: "THEN reconstruction", author: "AI-generated (Midjourney v6)", license: "Commercial use · disclosed", url: "" },
      ],
    },
  ];

  return (
    <div className="cw-grain" style={{ background: T.bone, height: "100%", fontFamily: F.body, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "48px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <button type="button" onClick={() => (onBack ? onBack() : navigate("G1"))} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: T.muted, fontFamily: F.body, fontSize: 13, padding: 0 }}>
          <ChevronLeft size={16} /> Settings
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 24px 48px" }}>
        <h2 style={{ fontFamily: F.display, fontSize: 28, color: T.ink, fontWeight: 300, lineHeight: 1.15, marginBottom: 20 }}>
          Credits & Attribution
        </h2>

        {/* AI disclosure · editorial intro paragraph */}
        <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${T.muted}28` }}>
          <p style={{ fontSize: 11, color: T.muted, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
            AI RECONSTRUCTIONS
          </p>
          <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.75 }}>
            The THEN images in ChronoWalk are AI-generated historical reconstructions produced with Midjourney v6. They are interpretations informed by archaeology and scholarship · not photographic records. Where conjecture was required (colours, crowds, vegetation), we have noted it in the honesty captions on each screen.
          </p>
          <p style={{ fontSize: 14, color: T.ink, lineHeight: 1.75, marginTop: 12 }}>
            No AI imagery depicts real people, living or deceased, without documented historical basis.
          </p>
        </div>

        {/* Per-waypoint attribution list */}
        <p style={{ fontSize: 11, color: T.muted, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 16 }}>
          PHOTOGRAPHY
        </p>

        {attributions.map((group, gi) => (
          <div key={group.stop} style={{ marginBottom: 24 }}>
            {gi > 0 && <div style={{ height: 1, background: `${T.muted}20`, marginBottom: 24, marginTop: -12 }} />}
            <p style={{ fontSize: 13, color: T.ink, fontWeight: 500, marginBottom: 8 }}>{group.stop}</p>
            {group.items.map((item, ii) => (
              <div key={ii} style={{ paddingLeft: 16, marginBottom: 6 }}>
                <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>
                  {item.type}{" "}
                  <span style={{ color: T.ink }}>{item.author}</span>
                  {" · "}{item.license}
                  {item.url ? (
                    <a href={`https://${item.url}`} target="_blank" rel="noreferrer" style={{ color: T.ember, textDecoration: 'none' }}>
                      {' · '}{item.url}
                    </a>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        ))}

        {/* Music & SFX */}
        <div style={{ marginBottom: 28, paddingTop: 8, borderTop: `1px solid ${T.muted}28` }}>
          <p style={{ fontSize: 11, color: T.muted, letterSpacing: "0.18em", textTransform: "uppercase", margin: "20px 0 12px" }}>
            MUSIC & SOUND
          </p>
          <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.65 }}>
            Ambient compositions and presence pulses · original works commissioned for ChronoWalk Rome.
            SFX world-builds recorded on location and in Foley, Rome 2025.
          </p>
        </div>

        {/* Footer · verbatim from spec */}
        <div style={{ paddingTop: 20, borderTop: `1px solid ${T.muted}28` }}>
          <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, fontStyle: "italic" }}>
            Facts checked against current scholarship · corrections:{" "}
            <a href="mailto:hello@chronowalk.com" style={{ color: T.ink, textDecoration: 'none' }}>hello@chronowalk.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
