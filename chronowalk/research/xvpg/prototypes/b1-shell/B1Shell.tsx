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
 * ART-0 assets (v2 — Day 5.5 founder-authorized implementation-correction pass;
 * do-not-depict register respected; v1 files retained on disk for audit):
 *   /art0/L0_modern_v2.jpg      — modern backplate (Campidoglio overlook, Colosseum at far end)
 *   /art0/recon_backdrop_v2.jpg — 315 CE reconstruction, same vantage/layout; Colosseum
 *                                 and Basilica of Maxentius remain visible at the far end
 *
 * DAY 5.5 FRAMING CORRECTION (root cause of founder QA defect A):
 * assets are square (1024×1024) but the stage is tall portrait; object-fit:cover was
 * silently discarding ~44% of the image width, and B1 parallax shifted that crop —
 * hence "wiggle to see more". Fix: a fixed square SCENE BOX (exact fit for square
 * assets — zero crop by definition, deterministic in every mode) centered in the stage
 * with cinematic letterbox bands above/below. Identical framing in Control/B1/Lantern.
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
// Day 5 parity fix (ART-0 STIMULUS PARITY GATE): the separate cutout PNGs duplicated
// architecture already present in the backdrop and could not be cheaply aligned.
// All three depth planes are now soft-masked bands of the SAME backdrop image —
// perfect pixel alignment, no invented/duplicated architecture, no new assets.
// Depth parallax for B1 is preserved via the banded masks; Control flattens to the
// identical composite; Lantern clips the identical composite. (Permitted fixes used:
// adjust masks, reposition layers. No ART-1, no new art.)
const bandMask = (m: string) => ({ WebkitMaskImage: m, maskImage: m }) as React.CSSProperties;
const RECON = "recon_backdrop_v2.jpg";
const PLANES: Plane[] = [
  { id: "far", depth: 0.06, src: A(RECON), style: { objectFit: "cover" } },
  { id: "mid", depth: 0.22, src: A(RECON), style: { objectFit: "cover", ...bandMask("linear-gradient(to bottom, transparent 28%, black 46%, black 68%, transparent 84%)") } },
  { id: "near", depth: 0.5, src: A(RECON), style: { objectFit: "cover", ...bandMask("linear-gradient(to bottom, transparent 62%, black 82%)") } },
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

// QA/experiment support: deterministic initial state via URL params
// (?mode=control|b1|lantern&reveal=0..1&full=1&lit=x,y — lit ignites the lantern at
// fractional scene coords for screenshot QA without a touch)
const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
const initMode = (["control", "b1", "lantern"].includes(params.get("mode") ?? "") ? params.get("mode") : "b1") as Mode;
const initReveal = Math.max(0, Math.min(1, Number(params.get("reveal") ?? 0) || 0));
const initFull = params.get("full") === "1";
const initLit = (() => {
  const v = (params.get("lit") ?? "").split(",").map(Number);
  return v.length === 2 && v.every((n) => n >= 0 && n <= 1) ? { x: v[0], y: v[1] } : null;
})();

export function B1Shell() {
  const [mode, setMode] = useState<Mode>(initMode);
  const [reveal, setReveal] = useState(initReveal); // control + b1: 0 today … 1 reconstruction
  const [lanternOn, setLanternOn] = useState(initLit != null); // lantern: region active
  const [lanternFull, setLanternFull] = useState(initFull); // accessibility fallback: reveal all
  const [fps, setFps] = useState(0);
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const lanternTarget = useRef(initLit ?? { x: 0.5, y: 0.55 });
  const lantern = useRef(initLit ?? { x: 0.5, y: 0.55 });
  const sceneRef = useRef<HTMLDivElement>(null); // fixed square scene box — deterministic framing
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);
  const revealWrapRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
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
        // overscan: scale margin must exceed max translation (depth*22px on a ~390px
        // scene → factor 0.12 gives (s-1)/2*w ≥ depth*22 for all plane depths), so
        // parallax can never expose a scene-box edge or the backplate through a band
        el.style.transform = `translate3d(${current.current.x * depth * 22}px, ${current.current.y * depth * 10}px, 0) scale(${1 + depth * 0.12})`;
      });
      const wrap = revealWrapRef.current;
      if (wrap) {
        if (mode === "lantern" && !lanternFull) {
          const w = sceneRef.current?.clientWidth ?? 390;
          const r = Math.max(120, w * 0.34); // generous radius — no precision aiming
          wrap.style.clipPath = lanternOn
            ? `circle(${r}px at ${lantern.current.x * 100}% ${lantern.current.y * 100}%)`
            : "circle(0px at 50% 55%)";
          wrap.style.opacity = "1";
          const rim = rimRef.current;
          if (rim && sceneRef.current) {
            rim.style.width = rim.style.height = `${r * 2}px`;
            rim.style.left = `${lantern.current.x * sceneRef.current.clientWidth}px`;
            rim.style.top = `${lantern.current.y * sceneRef.current.clientHeight}px`;
          }
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
    // coords relative to the SCENE BOX (clamped) so the lantern maps 1:1 to the image
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    lanternTarget.current = {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (mode === "lantern") {
      // first touch anywhere ON THE SCENE ignites the lantern AT the finger — zero
      // instruction needed; touches in the letterbox bands are ignored (nothing to
      // reveal there, and snapping the lantern to the boundary would be off-finger)
      const rect = sceneRef.current?.getBoundingClientRect();
      if (!rect || e.clientY < rect.top || e.clientY > rect.bottom) return;
      setLanternOn(true);
      setLanternFromEvent(e);
      // snap the rendered position immediately so ignition happens AT the finger
      // (easing applies only to subsequent drag motion)
      lantern.current = { ...lanternTarget.current };
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
        {/* SCENE BOX — fixed square, exact fit for the square ART-0 assets: the full
            intended framing is ALWAYS visible by default, identically in all modes.
            Letterbox bands above/below are plain black (cinematic register). */}
        <div ref={sceneRef} className="absolute left-0 right-0 top-1/2 aspect-square -translate-y-1/2 overflow-hidden">
          {/* L0 modern backplate — ART-0 v2 */}
          <img src={A("L0_modern_v2.jpg")} alt="Modern Roman Forum from the Campidoglio overlook" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          {/* Reconstruction stack — identical in all modes; mode changes only how it is revealed */}
          <div ref={revealWrapRef} className="absolute inset-0" style={{ transition, opacity: 0 }}>
            {PLANES.map((p, i) => (
              <div key={p.id} ref={(el) => { layersRef.current[i] = el; }} className="absolute inset-0 will-change-transform" style={{ zIndex: i + 1 }}>
                <img src={p.src} alt="" className="absolute inset-0 h-full w-full" style={p.style} draggable={false} />
              </div>
            ))}
          </div>
          {mode === "lantern" && !lanternFull && lanternOn && (
            /* high-contrast rim for outdoor legibility — OUTSIDE the clipped wrapper,
               positioned at the live lantern coords by the rAF loop */
            <div ref={rimRef} className="pointer-events-none absolute rounded-full" style={{ zIndex: 8, border: "3px solid rgba(255,196,0,0.9)", boxShadow: "0 0 12px rgba(0,0,0,0.5)", transform: "translate(-50%, -50%)" }} />
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
