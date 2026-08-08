/**
 * X-B1 INTERACTION SHELL — Day 3 (experiment only; NOT production ChronoWalk code)
 *
 * Purpose: validate layered reveal, parallax/depth, transitions, touch behavior,
 * performance and mobile layout with NEUTRAL PLACEHOLDER layers that share the
 * exact contract of the ART-0 asset set (L0 backplate + L1–L5 depth planes).
 *
 * Asset-swap contract: replace each entry's `render` with an <img> pointing at the
 * ART-0 PNG for that plane. Nothing else changes. The flattened Control mode uses
 * the SAME layer stack with parallax factors forced to 0 — proving the
 * "identical asset, interaction-only difference" requirement of X-VPG/X-B1.
 */
import { useEffect, useRef, useState } from "react";

type Plane = {
  id: string;
  label: string;
  depth: number; // 0 = infinitely far (no parallax) … 1 = nearest (max parallax)
  render: (reveal: number) => React.ReactNode;
};

// Neutral placeholder "buildings" as flat blocks — deliberately ugly, per founder: no beauty pass.
function Block({ x, w, h, tone, label }: { x: number; w: number; h: number; tone: string; label?: string }) {
  return (
    <div
      style={{ left: `${x}%`, width: `${w}%`, height: `${h}%`, background: tone }}
      className="absolute bottom-0 flex items-end justify-center overflow-hidden rounded-t-sm"
    >
      {label && <span className="mb-1 text-[8px] leading-none text-white/60">{label}</span>}
    </div>
  );
}

const PLANES: Plane[] = [
  {
    id: "L5", label: "L5 horizon (Titus/Maxentius)", depth: 0.06,
    render: () => (
      <>
        <Block x={70} w={22} h={28} tone="#5a5f6b" label="Maxentius" />
        <Block x={58} w={6} h={18} tone="#63687a" label="Titus" />
      </>
    ),
  },
  {
    id: "L4", label: "L4 far (Castor/DivJul/Aemilia)", depth: 0.18,
    render: () => (
      <>
        <Block x={48} w={14} h={34} tone="#6e7387" label="Castor" />
        <Block x={62} w={10} h={26} tone="#787d92" label="Div.Iul." />
        <Block x={10} w={30} h={30} tone="#737890" label="Aemilia" />
      </>
    ),
  },
  {
    id: "L3", label: "L3 mid (Bas. Julia + square)", depth: 0.34,
    render: () => (
      <>
        <Block x={30} w={40} h={26} tone="#8188a3" label="Basilica Julia" />
        <div className="absolute bottom-0 h-[10%] w-full bg-[#9aa0b5]" />
      </>
    ),
  },
  {
    id: "L2", label: "L2 near-mid (Saturn)", depth: 0.55,
    render: () => <Block x={8} w={16} h={52} tone="#8f96b3" label="Saturn" />,
  },
  {
    id: "L1", label: "L1 near (Arch/Rostra/Curia…)", depth: 0.8,
    render: () => (
      <>
        <Block x={26} w={18} h={46} tone="#a0a7c4" label="Severus arch" />
        {/* summit group: INDISTINCT SILHOUETTE ONLY (HV1 decision) */}
        <div className="absolute" style={{ left: "31%", bottom: "46%", width: "8%", height: "5%", background: "#6b6f85", borderRadius: "40% 40% 10% 10%", filter: "blur(1px)" }} />
        <Block x={48} w={10} h={30} tone="#aab0cc" label="Rostra" />
        <Block x={62} w={14} h={44} tone="#a5accb" label="Curia" />
      </>
    ),
  },
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
  const [reveal, setReveal] = useState(0); // 0 = today (L0), 1 = reconstruction
  const [controlMode, setControlMode] = useState(false); // flattened control: same assets, parallax off
  const [fps, setFps] = useState(0);
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);
  const dragging = useRef<null | { startX: number; startY: number; baseX: number; baseY: number }>(null);

  // rAF loop: eased parallax + FPS meter
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const tick = () => {
      const ease = reduced ? 1 : 0.12; // reduced motion: snap, no easing drift
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;
      layersRef.current.forEach((el, i) => {
        if (!el) return;
        const depth = controlMode || reduced ? 0 : PLANES[i].depth;
        el.style.transform = `translate3d(${current.current.x * depth * 40}px, ${current.current.y * depth * 16}px, 0) scale(${1 + depth * 0.06})`;
      });
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controlMode, reduced]);

  // Pointer drag = parallax look-around. touch-action:none prevents browser back-swipe conflict.
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragging.current = { startX: e.clientX, startY: e.clientY, baseX: target.current.x, baseY: target.current.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const w = stageRef.current?.clientWidth ?? 390;
    target.current.x = Math.max(-1, Math.min(1, dragging.current.baseX + (e.clientX - dragging.current.startX) / (w / 2)));
    target.current.y = Math.max(-1, Math.min(1, dragging.current.baseY + (e.clientY - dragging.current.startY) / 300));
  };
  const onPointerUp = () => (dragging.current = null);

  // Device tilt (iOS Safari requires permission; degrade silently)
  useEffect(() => {
    const fn = (e: DeviceOrientationEvent) => {
      if (dragging.current || e.gamma == null || e.beta == null) return;
      target.current.x = Math.max(-1, Math.min(1, e.gamma / 30));
      target.current.y = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
    };
    window.addEventListener("deviceorientation", fn);
    return () => window.removeEventListener("deviceorientation", fn);
  }, []);

  const transition = reduced ? "none" : "opacity 320ms ease";

  return (
    <div className="flex h-screen w-full select-none flex-col bg-black text-white" style={{ overscrollBehavior: "none" }}>
      {/* Stage */}
      <div
        ref={stageRef}
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* L0 modern backplate placeholder (photo goes here) */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(#7c93ad 0%, #93a4b8 55%, #6f6a5e 56%, #857f70 100%)" }}>
          <span className="absolute left-2 top-2 text-[10px] text-black/50">L0 — modern view placeholder (ruins)</span>
          {/* crude "ruins": low stumps */}
          <div className="absolute bottom-[8%] left-[10%] h-[12%] w-[3%] bg-[#9c927c]" />
          <div className="absolute bottom-[8%] left-[27%] h-[20%] w-[10%] bg-[#a89d85]" />
          <div className="absolute bottom-[8%] left-[49%] h-[9%] w-[7%] bg-[#9c927c]" />
          <div className="absolute bottom-[8%] left-[63%] h-[18%] w-[9%] bg-[#a89d85]" />
        </div>
        {/* Reconstruction plane stack — SAME stack drives Control (flattened) and B1 (parallax) */}
        <div className="absolute inset-0" style={{ opacity: reveal, transition, background: reveal > 0.02 ? "linear-gradient(#a8c0d8 0%, #c2cfd9 55%, rgba(0,0,0,0) 56%)" : "none" }}>
          {PLANES.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => { layersRef.current[i] = el; }}
              className="absolute inset-0 will-change-transform"
              style={{ zIndex: i + 1 }}
            >
              {p.render(reveal)}
            </div>
          ))}
          <div className="absolute bottom-0 h-[8%] w-full" style={{ zIndex: 9, background: "#b7ad93" }} />
        </div>
        {/* HUD */}
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/50 px-2 py-1 text-[10px]">
          {fps} fps · {controlMode ? "CONTROL (flattened)" : "B1 (layered)"} {reduced && "· reduced-motion"}
        </div>
      </div>
      {/* Controls */}
      <div className="space-y-2 border-t border-white/10 bg-neutral-900 p-3 pb-5">
        <div className="flex items-center gap-3">
          <span className="w-10 text-[11px] text-white/60">Today</span>
          <input
            type="range" min={0} max={100} value={reveal * 100}
            onChange={(e) => setReveal(Number(e.target.value) / 100)}
            className="h-8 flex-1 accent-amber-400"
            aria-label="Reveal the early 4th-century reconstruction"
          />
          <span className="w-10 text-right text-[11px] text-white/60">315</span>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setReveal((r) => (r < 0.5 ? 1 : 0))}
            className="rounded bg-amber-500 px-3 py-2 text-xs font-semibold text-black"
          >
            {reveal < 0.5 ? "Reveal 315" : "Back to today"}
          </button>
          <label className="flex items-center gap-2 text-[11px] text-white/60">
            <input type="checkbox" checked={controlMode} onChange={(e) => setControlMode(e.target.checked)} />
            Flattened control mode (same assets)
          </label>
        </div>
        <p className="text-[9px] leading-tight text-white/30">
          Drag to look around (parallax). Placeholder blocks share the ART-0 layer contract (L0 + L1–L5). No production art.
        </p>
      </div>
    </div>
  );
}
