import { useState } from "react";
import { T, F } from "../tokens.js";
import { colosseumNow, pantheonNow, capitolineNow, spanishSteps, severusNow, trajansNow, archTitusNow, palatineNow, navonaNow, castelNow } from "../images.js";
import { Eyebrow, TabBar } from '../ui/index.js';

export default function D1Map({ embedded = false }) {
  const [activeAct, setActiveAct]   = useState(null);
  const [selectedPin, setSelectedPin] = useState(6); // Pantheon pre-tapped

  // Act filter chips
  const actChips = [
    { id: "I",   color: T.actI,   label: "I"   },
    { id: "II",  color: T.actII,  label: "II"  },
    { id: "III", color: T.actIII, label: "III" },
    { id: "IV",  color: T.actIV,  label: "IV"  },
    { id: "V",   color: T.actV,   label: "V"   },
    { id: "VI",  color: T.actVI,  label: "VI"  },
    { id: "ENC", color: T.encore, label: "Enc" },
  ];

  // Route polyline - 7 act segments sharing endpoints
  const segments = [
    { act:"I",   color: T.actI,   d:"M 308 655 Q 296 642 285 630 Q 272 616 262 604" },
    { act:"II",  color: T.actII,  d:"M 262 604 Q 250 592 238 580 Q 228 570 218 560" },
    { act:"III", color: T.actIII, d:"M 218 560 Q 206 550 195 540 Q 182 524 172 512 Q 165 501 162 490" },
    { act:"IV",  color: T.actIV,  d:"M 162 490 Q 154 472 148 455 Q 143 436 140 416 Q 137 402 135 388" },
    { act:"V",   color: T.actV,   d:"M 135 388 Q 126 374 118 360 Q 112 346 113 333 Q 128 318 158 306 Q 178 298 195 293" },
    { act:"VI",  color: T.actVI,  d:"M 195 293 Q 180 280 164 270 Q 148 261 130 256 Q 115 252 112 250" },
    { act:"ENC", color: T.encore, d:"M 112 250 Q 98 248 88 247 Q 83 246 78 245" },
  ];

  // Waypoints - status: done / current / ahead
  const waypoints = [
    { id:0, name:"The Colosseum",       act:"I",   color:T.actI,   status:"done",    x:308, y:655, hook:"Fifty thousand witnesses, zero exits for gladiators.", dist:"0.0 km", photo:colosseumNow  },
    { id:1, name:"Arch of Constantine", act:"I",   color:T.actI,   status:"done",    x:285, y:630, hook:"Three emperors, one arch, not all remembered fondly.",   dist:"0.3 km", photo:archTitusNow  },
    { id:2, name:"The Palatine Hill",   act:"II",  color:T.actII,  status:"current", x:255, y:596, hook:"The emperors lived here. You can feel the advantage.",  dist:"0.9 km", photo:palatineNow },
    { id:3, name:"The Roman Forum",     act:"III", color:T.actIII, status:"ahead",   x:218, y:558, hook:"Nine stops, one drained swamp, the centre of the world.",dist:"1.5 km", photo:severusNow    },
    { id:4, name:"Capitoline Hill",     act:"III", color:T.actIII, status:"ahead",   x:190, y:532, hook:"The original Rome, reduced to a pigeon square.",          dist:"1.9 km", photo:capitolineNow },
    { id:5, name:"Trajan's Market",     act:"IV",  color:T.actIV,  status:"ahead",   x:150, y:450, hook:"Two thousand years ago, this was the shopping centre.",   dist:"2.5 km", photo:trajansNow    },
    { id:6, name:"The Pantheon",        act:"V",   color:T.actV,   status:"ahead",   x:135, y:386, hook:"The dome that refused to fall.",                          dist:"3.1 km", photo:pantheonNow   },
    { id:7, name:"Piazza Navona",       act:"V",   color:T.actV,   status:"ahead",   x:115, y:340, hook:"Built on a stadium, beautiful by accident.",              dist:"3.7 km", photo:navonaNow   },
    { id:8, name:"The Spanish Steps",   act:"VI",  color:T.actVI,  status:"ahead",   x:195, y:293, hook:"138 steps. Zero shortcuts.",                              dist:"4.3 km", photo:spanishSteps  },
    { id:9, name:"Castel Sant'Angelo",  act:"ENC", color:T.encore, status:"ahead",   x:78,  y:245, hook:"A tomb that became a fortress that became a prison.",     dist:"5.2 km", photo:castelNow  },
  ];

  const sel        = selectedPin !== null ? waypoints[selectedPin] : null;
  const dimAct = (act) => activeAct && act !== activeAct
  const sheetShown = sel !== null;
  const controlsBottom = embedded ? 48 : 122;
  const controlsBottomWithSheet = embedded ? 174 : 248;

  return (
    <div
      style={{ height:"100%", position:"relative", overflow:"hidden", fontFamily:F.body, background:T.bone }}
      onClick={() => setSelectedPin(null)}
    >
      {/* ──────────────────────────────────────────────────────────────── */}
      {/* CUSTOM MAP SVG - warm desaturated bone/stone tile               */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <svg
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        style={{ position:"absolute", inset:0, display:"block", width:"100%", height:"100%" }}
      >
        {/* Base - warm road-surface sand */}
        <rect width="390" height="844" fill="#EFE7D2"/>

        {/* ── Tiber river - filled path for natural bank shape ── */}
        <path
          d="M 42 0 C 40 80 46 160 50 240 C 54 310 60 370 57 450 C 53 530 58 610 62 690 C 65 750 67 800 65 844
             L 88 844 C 86 800 84 750 81 690 C 77 610 82 530 78 450 C 75 370 80 310 84 240 C 88 160 90 80 88 0 Z"
          fill="#B4CAD8"
        />
        {/* River highlight - lighter inner */}
        <path
          d="M 50 0 C 48 80 52 160 56 240 C 60 310 65 370 62 450 C 58 530 62 610 66 690 C 69 750 71 800 69 844
             L 82 844 C 80 800 78 750 75 690 C 71 610 75 530 71 450 C 68 370 73 310 77 240 C 81 160 83 80 81 0 Z"
          fill="#C2D6E6" opacity="0.6"
        />

        {/* ── City block district fills ── */}
        {/* SE - Celio & Colosseum district */}
        <polygon points="390,844 390,440 348,404 305,410 272,468 255,530 258,590 300,660 355,755 390,800" fill="#E6DBc6"/>
        {/* East - Esquilino */}
        <polygon points="390,0 390,440 348,404 315,364 295,298 298,225 322,172 360,125 390,90" fill="#E6DBc6"/>
        {/* Centro Storico */}
        <polygon points="248,560 272,468 255,412 230,372 200,354 174,362 170,402 162,462 162,490 175,522 218,560" fill="#E4D8C2"/>
        {/* Campo Marzio & upper center */}
        <polygon points="115,340 138,316 162,293 195,278 225,258 240,230 225,190 200,170 172,168 148,182 128,215 112,253 89,248 86,280 90,318" fill="#E4D8C2"/>
        {/* North of route */}
        <polygon points="115,340 90,318 86,280 89,248 79,244 72,185 82,120 105,78 135,60 168,55 200,68 228,98 240,140 232,175 225,190 240,230 225,258" fill="#E6DBc6"/>
        {/* Prati strip (Tiber east bank, northwest) */}
        <polygon points="88,0 120,0 148,120 140,205 128,260 115,295 105,332 100,380 95,430 90,510 86,600 83,700 82,844 65,844 65,700 62,610 57,450 60,370 54,240 50,160 48,80 46,0" fill="#E2D6C0"/>

        {/* ── Green areas ── */}
        {/* Palatine Hill - terraced green oval */}
        <ellipse cx="268" cy="625" rx="50" ry="38" fill="#C9D8AA" opacity="0.82"/>
        <ellipse cx="268" cy="625" rx="38" ry="28" fill="#D2E0B4" opacity="0.5"/>
        {/* Celio gardens */}
        <ellipse cx="340" cy="605" rx="24" ry="18" fill="#CBD9AE" opacity="0.72"/>
        {/* Villa Borghese (upper right, partial) */}
        <ellipse cx="278" cy="148" rx="56" ry="42" fill="#D0DEB2" opacity="0.78"/>
        {/* Giardini Quirinale */}
        <ellipse cx="218" cy="318" rx="18" ry="13" fill="#CEDBAC" opacity="0.7"/>

        {/* ── Major road corridors (lighter stripes than blocks) ── */}
        {/* Via dei Fori Imperiali - the ancient processional road */}
        <path d="M 314 670 L 248 590 L 180 510 L 163 482" stroke="#E8E0CE" strokeWidth="16" fill="none" strokeLinecap="round"/>
        {/* Via Sacra through Forum */}
        <path d="M 248 590 L 230 572 L 215 558 L 195 540" stroke="#EAE2D0" strokeWidth="9" fill="none" strokeLinecap="round"/>
        {/* Lungotevere - road along Tiber east bank */}
        <path d="M 90 0 Q 94 200 90 400 Q 86 600 92 844" stroke="#E8E0CC" strokeWidth="13" fill="none"/>
        {/* Via del Corso - N/S through center */}
        <path d="M 232 242 Q 228 310 220 380 Q 214 430 210 468" stroke="#EAE2D0" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {/* Via Nazionale */}
        <path d="M 248 458 Q 238 390 226 330 Q 220 298 215 268" stroke="#EAE2D0" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {/* Via della Conciliazione (toward Castel) */}
        <path d="M 78 245 Q 94 258 115 265 Q 136 272 158 278 Q 178 283 195 290" stroke="#EAE2D0" strokeWidth="9" fill="none" strokeLinecap="round"/>
        {/* Secondary east–west cross streets */}
        <path d="M 160 490 Q 195 482 230 478 Q 262 474 290 480" stroke="#EDE5D3" strokeWidth="5" fill="none"/>
        <path d="M 140 415 Q 170 410 205 408 Q 235 406 262 408" stroke="#EDE5D3" strokeWidth="5" fill="none"/>
        <path d="M 115 338 Q 145 332 175 328 Q 205 325 228 328" stroke="#EDE5D3" strokeWidth="5" fill="none"/>

        {/* ── Landmark outlines ── */}
        {/* Colosseum - double oval */}
        <ellipse cx="308" cy="660" rx="26" ry="20" fill="#E2D6C0" stroke="#C2B09A" strokeWidth="2.5"/>
        <ellipse cx="308" cy="660" rx="17" ry="13" fill="#EDE5D5"/>
        {/* Pantheon - circle */}
        <circle cx="135" cy="388" r="11" fill="#E2D6C0" stroke="#C2B09A" strokeWidth="2"/>
        {/* Castel Sant'Angelo */}
        <circle cx="78" cy="245" r="9" fill="#E2D6C0" stroke="#C2B09A" strokeWidth="2"/>
        {/* Piazza Navona - slender oval */}
        <ellipse cx="115" cy="350" rx="8" ry="18" fill="none" stroke="#C2B09A" strokeWidth="1.5"/>

        {/* ── Act-gradient route polyline ── */}
        {segments.map(seg => (
          <path
            key={seg.act}
            d={seg.d}
            stroke={seg.color}
            strokeWidth={dimAct(seg.act) ? 2 : 3}
            fill="none"
            strokeLinecap="round"
            opacity={dimAct(seg.act) ? 0.2 : 1}
            style={{ transition:"opacity 250ms, stroke-width 250ms" }}
          />
        ))}
        {/* Route soft glow (doubled, blurred, behind) */}
        {segments.map(seg => (
          <path
            key={`glow-${seg.act}`}
            d={seg.d}
            stroke={seg.color}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            opacity={dimAct(seg.act) ? 0 : 0.18}
            style={{ filter:"blur(3px)", transition:"opacity 250ms" }}
          />
        ))}

        {/* ── Waypoint pins ── */}
        {waypoints.map(wp => {
          const dim   = dimAct(wp.act);
          const isSel = selectedPin === wp.id;
          return (
            <g
              key={wp.id}
              onClick={e => { e.stopPropagation(); setSelectedPin(isSel ? null : wp.id); }}
              style={{ cursor:"pointer" }}
            >
              {wp.status === "done" && (
                <>
                  <circle cx={wp.x} cy={wp.y} r={6} fill={wp.color} opacity={dim ? 0.25 : 1}/>
                  {isSel && <circle cx={wp.x} cy={wp.y} r={11} fill="none" stroke={wp.color} strokeWidth={2} opacity={0.5}/>}
                </>
              )}
              {wp.status === "current" && (
                <>
                  {/* Pulsing outer ring */}
                  <circle cx={wp.x} cy={wp.y} r={12} fill="none" stroke={wp.color} strokeWidth={1.5}
                    opacity={0.45} style={{ animation:"presencePulse 3s ease-in-out infinite" }}/>
                  <circle cx={wp.x} cy={wp.y} r={6} fill={wp.color}/>
                  {isSel && <circle cx={wp.x} cy={wp.y} r={16} fill="none" stroke={wp.color} strokeWidth={1.5} opacity={0.3}/>}
                </>
              )}
              {wp.status === "ahead" && (
                <>
                  <circle cx={wp.x} cy={wp.y} r={5.5} fill="#EFE7D2" stroke={wp.color}
                    strokeWidth={1.5} opacity={dim ? 0.25 : 1}/>
                  {isSel && <circle cx={wp.x} cy={wp.y} r={10} fill="none" stroke={wp.color} strokeWidth={1.5} opacity={0.45}/>}
                </>
              )}
            </g>
          );
        })}

        {/* ── User location dot - warm-white with ember halo ── */}
        <circle cx="242" cy="586" r="8" fill={T.warmWhite} stroke={T.warmWhite} strokeWidth="2"/>
        <circle cx="242" cy="586" r="14" fill="none" stroke={T.ember} strokeWidth="1.5" opacity="0.55"
          style={{ animation:"presencePulse 2.5s ease-in-out infinite" }}/>
        <circle cx="242" cy="586" r="4" fill={T.ember}/>
      </svg>

      {/* ── Act filter chips ── */}
      <div style={{
        position:"absolute", top:"max(52px, calc(env(safe-area-inset-top) + 12px))", left:0, right:0,
        padding:"0 16px", zIndex:20,
        display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none",
      }}>
        {actChips.map(chip => {
          const on = activeAct === chip.id;
          return (
            <button
              key={chip.id}
              onClick={e => { e.stopPropagation(); setActiveAct(on ? null : chip.id); }}
              style={{
                padding:"4px 12px",
                border:`1px solid ${on ? chip.color : `${chip.color}55`}`,
                borderRadius:20,
                background: on ? `${chip.color}20` : "rgba(247,241,230,0.88)",
                color: chip.color,
                fontSize:12, fontWeight:500,
                cursor:"pointer", whiteSpace:"nowrap",
                backdropFilter:"blur(6px)",
                fontFamily:F.body,
                transition:"background 200ms, border-color 200ms",
                flexShrink:0,
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* ── Bottom controls - sit above tab bar ── */}
      {/* "Start from where I am" - bottom-left */}
      <button
        style={{
          position:"absolute", bottom: sheetShown ? controlsBottomWithSheet : controlsBottom, left:20, zIndex:22,
          padding:"10px 16px",
          background:"rgba(247,241,230,0.92)", border:`1px solid rgba(33,28,21,0.12)`,
          borderRadius:24, fontSize:13, color:T.ink,
          fontFamily:F.body, cursor:"pointer",
          backdropFilter:"blur(8px)",
          transition:"bottom 240ms cubic-bezier(0.32,0.72,0,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        Start from where I am
      </button>

      {/* Recenter icon - bottom-right */}
      <button
        style={{
          position:"absolute", bottom: sheetShown ? controlsBottomWithSheet : controlsBottom, right:20, zIndex:22,
          width:44, height:44,
          background:"rgba(247,241,230,0.92)", border:`1px solid rgba(33,28,21,0.12)`,
          borderRadius:22,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", backdropFilter:"blur(8px)",
          transition:"bottom 240ms cubic-bezier(0.32,0.72,0,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="2.5" stroke={T.actI} strokeWidth="1.5"/>
          <line x1="9" y1="1"  x2="9" y2="4.5" stroke={T.ink} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="9" y1="13.5" x2="9" y2="17" stroke={T.ink} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="1"  y1="9" x2="4.5" y2="9" stroke={T.ink} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="13.5" y1="9" x2="17" y2="9" stroke={T.ink} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* ── Pin preview sheet - slides up on tap ── */}
      {sel && (
        <div
          style={{
            position:"absolute", bottom:0, left:0, right:0,
            background:T.bone,
            borderRadius:"20px 20px 0 0",
            padding:"12px 20px 44px",
            zIndex:30,
            boxShadow:"0 -8px 32px rgba(11,11,13,0.14)",
            animation:"slideUp 240ms cubic-bezier(0.32,0.72,0,1)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Sheet drag handle */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
            <div style={{ width:32, height:3.5, borderRadius:2, background:`${T.muted}45` }}/>
          </div>

          {/* Pin content row */}
          <div style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:14 }}>
            {/* NOW thumb */}
            <img
              src={sel.photo} alt={sel.name}
              style={{ width:72, height:72, borderRadius:10, objectFit:"cover", flexShrink:0 }}
            />
            <div style={{ flex:1 }}>
              {/* Act eyebrow */}
              <Eyebrow color={sel.color}>ACT {sel.act}</Eyebrow>
              {/* Name - Fraunces 20 */}
              <p style={{
                fontFamily:F.display, fontSize:20,
                color:T.ink, lineHeight:1.2, marginTop:4, marginBottom:4,
              }}>
                {sel.name}
              </p>
              {/* Hook */}
              <p style={{ fontSize:13, color:T.muted, lineHeight:1.55 }}>{sel.hook}</p>
            </div>
          </div>

          {/* Distance + CTA row */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{
              fontSize:13, color:T.muted,
              fontVariantNumeric:"tabular-nums",
            }}>
              {sel.dist}
            </span>
            <button style={{
              fontSize:13, fontWeight:500,
              color:sel.color, background:"none",
              border:"none", cursor:"pointer",
              fontFamily:F.body,
            }}>
              Take me there →
            </button>
          </div>
        </div>
      )}
      {!embedded && <TabBar active="MAP" />}
    </div>
  );
}
