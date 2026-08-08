/**
 * X-B1 / X-B5 INTERACTION SHELL — Day 4 (experiment only; NOT production ChronoWalk code)
 *
 * ONE substrate (founder-approved Day 3), THREE presentation modes over the SAME
 * ART-0 reconstruction content:
 *   CONTROL — flattened binary Then/Now (parallax = 0, instant/crossfade full-frame swap)
 *   B1      — layered cinematic reveal (slider crossfade + parallax depth planes)
 *   B5      — Lantern: bounded circular reveal region the traveler drags across the
 *             modern scene, discovering the reconstruction underneath.
 *
 * ART-0 assets (Day 4, cheap throwaway; do-not-depict register respected):
 *   /art0/L0_modern.jpg      — L0 modern backplate
 *   /art0/recon_backdrop.jpg — far reconstruction plane (sky→square)
 *   /art0/temple_cutout.png  — mid plane cutout (granite-column temple porch)
 *   /art0/arch_cutout.png    — near plane cutout (triple arch, indistinct summit silhouette)
 *
 * Identical layer stack in every mode — the manipulated variable is interaction only.
 * Lantern principles: first-touch works anywhere (region jumps to finger), one-handed,
 * generous radius (no precision aiming), accessibility fallback = "Reveal all" button,
 * reduced-motion honored, outdoor legibility via high-contrast rim.
 */
import { useEffect, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + "/"; // normalize: BASE_PATH may lack trailing slash
const A = (f: string) => `${BASE}art0/${f}`;

type Mode = "control" | "b1" | "lantern";

type Plane = { id: string; depth: number; src: string; style?: React.CSSProperties };

// SAME reconstruction stack for all three modes (asset-swap contract honored).
const PLANES: Plane[] = [
  { id: "far", depth: 0.06, src: A("recon_backdrop.jpg"), style: { objectFit: "cover" } },
  { id: "mid", depth: 0.3, src: A("temple_cutout.png"), style: { objectFit: "contain", objectPosition: "8% 100%", transform: "scale(0.55)", transformOrigin: "8% 100%" } },
  { id: "near", depth: 0.65, src: A("arch_cutout.png"), style: { objectFit: "contain", objectPosition: "30% 100%", transform: "scale(0.6)", transformOrigin: "30% 100%" } },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function B1Shell() {
  const [mode, setMode] = useState<Mode>("b1");
  const [reveal, setReveal] = useState(0); // control + b1: 0 today … 1 reconstruction
  const [lanternOn, setLanternOn] = useState(false); // lantern: region active
  const [lanternFull, setLanternFull] = useState(false); // accessibility fallback: reveal all
  const [fps, setFps] = useState(0);
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const lanternTarget = useRef({ x: 0.5, y: 0.55 });
  const lantern = useRef({ x: 0.5, y: 0.55 });
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);
  const revealWrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<null | { startX: number; startY: number; baseX: number; baseY: number }>(null);

  // Single rAF loop: eased parallax, lantern easing, FPS meter.
  useEffect(() => {
    let raf = 0, frames = 0, last = performance.now();
    const tick = () => {
      const ease = reduced ? 1 : 0.14;
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;
      lantern.current.x += (lanternTarget.current.x - lantern.current.x) * (reduced ? 1 : 0.22);
      lantern.current.y += (lanternTarget.current.y - lantern.current.y) * (reduced ? 1 : 0.22);
      layersRef.current.forEach((el, i) => {
        if (!el) return;
        const depth = mode === "b1" && !reduced ? PLANES[i].depth : 0;
        el.style.transform = `translate3d(${current.current.x * depth * 40}px, ${current.current.y * depth * 16}px, 0) scale(${1 + depth * 0.06})`;
      });
      const wrap = revealWrapRef.current;
      if (wrap) {
        if (mode === "lantern" && !lanternFull) {
          const w = stageRef.current?.clientWidth ?? 390;
          const r = Math.max(120, w * 0.34); // generous radius — no precision aiming
          wrap.style.clipPath = lanternOn
            ? `circle(${r}px at ${lantern.current.x * 100}% ${lantern.current.y * 100}%)`
            : "circle(0px at 50% 55%)";
          wrap.style.opacity = "1";
        } else {
          wrap.style.clipPath = "none";
          wrap.style.opacity = String(mode === "lantern" ? (lanternFull ? 1 : 0) : reveal);
        }
      }
      frames++;
      const now = performance.now();
      if (now - last >= 1000) { setFps(frames); frames = 0; last = now; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, reduced, lanternOn, lanternFull, reveal]);

  const setLanternFromEvent = (e: React.PointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    lanternTarget.current = {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (mode === "lantern") {
      // first touch anywhere ignites the lantern AT the finger — zero instruction needed
      setLanternOn(true);
      setLanternFromEvent(e);
      return;
    }
    dragging.current = { startX: e.clientX, startY: e.clientY, baseX: target.current.x, baseY: target.current.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (mode === "lantern") {
      if (lanternOn && e.buttons > 0) setLanternFromEvent(e);
      return;
    }
    if (!dragging.current) return;
    const w = stageRef.current?.clientWidth ?? 390;
    target.current.x = Math.max(-1, Math.min(1, dragging.current.baseX + (e.clientX - dragging.current.startX) / (w / 2)));
    target.current.y = Math.max(-1, Math.min(1, dragging.current.baseY + (e.clientY - dragging.current.startY) / 300));
  };
  const onPointerUp = () => (dragging.current = null); // lantern stays where left — robust to imperfect grip

  // Device tilt for B1 (degrade silently)
  useEffect(() => {
    const fn = (e: DeviceOrientationEvent) => {
      if (mode !== "b1" || dragging.current || e.gamma == null || e.beta == null) return;
      target.current.x = Math.max(-1, Math.min(1, e.gamma / 30));
      target.current.y = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
    };
    window.addEventListener("deviceorientation", fn);
    return () => window.removeEventListener("deviceorientation", fn);
  }, [mode]);

  const transition = reduced ? "none" : "opacity 320ms ease, clip-path 120ms linear";
  const modeLabel = mode === "control" ? "CONTROL (flattened)" : mode === "b1" ? "B1 (layered)" : "B5 (lantern)";

  return (
    <div className="flex h-screen w-full select-none flex-col bg-black text-white" style={{ overscrollBehavior: "none" }}>
      <div
        ref={stageRef}
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* L0 modern backplate — ART-0 */}
        <img src={A("L0_modern.jpg")} alt="Modern Roman Forum from the Campidoglio overlook" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* Reconstruction stack — identical in all modes; mode changes only how it is revealed */}
        <div ref={revealWrapRef} className="absolute inset-0" style={{ transition, opacity: 0 }}>
          {PLANES.map((p, i) => (
            <div key={p.id} ref={(el) => { layersRef.current[i] = el; }} className="absolute inset-0 will-change-transform" style={{ zIndex: i + 1 }}>
              <img src={p.src} alt="" className="absolute inset-0 h-full w-full" style={p.style} draggable={false} />
            </div>
          ))}
          {mode === "lantern" && !lanternFull && lanternOn && (
            /* high-contrast rim for outdoor legibility */
            <div className="pointer-events-none absolute inset-0" style={{ zIndex: 8, boxShadow: "inset 0 0 0 3px rgba(255,196,0,0.9)", borderRadius: "0" }} />
          )}
        </div>
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px]" style={{ zIndex: 20 }}>
          {fps} fps · {modeLabel} {reduced && "· reduced-motion"}
        </div>
        {mode === "lantern" && !lanternOn && !lanternFull && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-white/90" style={{ zIndex: 20, textShadow: "0 1px 3px #000" }}>
            Touch anywhere to shine the lantern
          </div>
        )}
      </div>
      <div className="space-y-2 border-t border-white/10 bg-neutral-900 p-3 pb-5">
        <div className="flex gap-1">
          {(["control", "b1", "lantern"] as Mode[]).map((m) => (
            <button key={m} onClick={() => { setMode(m); setLanternOn(false); setLanternFull(false); }}
              className={`flex-1 rounded px-2 py-2 text-[11px] font-semibold ${mode === m ? "bg-amber-500 text-black" : "bg-neutral-800 text-white/60"}`}>
              {m === "control" ? "Control" : m === "b1" ? "B1 Layered" : "B5 Lantern"}
            </button>
          ))}
        </div>
        {mode !== "lantern" ? (
          <>
            <div className="flex items-center gap-3">
              <span className="w-10 text-[11px] text-white/60">Today</span>
              <input type="range" min={0} max={100} value={reveal * 100}
                onChange={(e) => setReveal(Number(e.target.value) / 100)}
                className="h-8 flex-1 accent-amber-400"
                aria-label="Reveal the early 4th-century reconstruction" />
              <span className="w-10 text-right text-[11px] text-white/60">315</span>
            </div>
            <button onClick={() => setReveal((r) => (r < 0.5 ? 1 : 0))} className="rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-black">
              {reveal < 0.5 ? "Reveal 315" : "Back to today"}
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/60">Drag the lantern across the ruins</span>
            <button onClick={() => setLanternFull((v) => !v)} className="rounded bg-neutral-700 px-3 py-2 text-xs font-semibold" aria-label="Accessibility: reveal the full reconstruction without dragging">
              {lanternFull ? "Back to lantern" : "Reveal all"}
            </button>
          </div>
        )}
        <p className="text-[9px] leading-tight text-white/30">
          One substrate, three modes — identical ART-0 reconstruction content; only the interaction differs. Cheap throwaway ART-0; no production art.
        </p>
      </div>
    </div>
  );
}
