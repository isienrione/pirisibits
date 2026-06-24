import React, { useEffect, useMemo, useState } from 'react';
import { fetchWaypointById } from '../services/waypointService';
import {
  buildWaypointAssetPromptPack,
  getModernReferenceUrl,
} from '../utils/waypointAssetPrompts';
import {
  assessModernFraming,
  COLOSSEUM_FRAMING_REFERENCE,
  MODERN_FRAMING_CHECKLIST,
} from '../utils/modernFramingGuide';

const PromptBlock = ({ title, body, tool }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.warn('WaypointAssetStudio: clipboard copy failed.', error);
    }
  };

  return (
    <section className="rounded-xl border border-stone-700 bg-stone-950/70 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-200">{title}</h3>
          {tool ? <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">{tool}</p> : null}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-full border border-amber-400/40 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-400/10"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-stone-300">
        {body}
      </pre>
    </section>
  );
};

const WaypointAssetStudio = ({ waypointId = 'colosseum' }) => {
  const [waypoint, setWaypoint] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchWaypointById(waypointId)
      .then((data) => {
        if (!cancelled) setWaypoint(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load waypoint.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [waypointId]);

  const promptPack = useMemo(() => {
    if (!waypoint) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return buildWaypointAssetPromptPack(waypoint, origin);
  }, [waypoint]);

  const framing = useMemo(() => (waypoint ? assessModernFraming(waypoint) : null), [waypoint]);

  const modernReferencePath = waypoint ? getModernReferenceUrl(waypoint) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-300">
        Loading waypoint asset studio…
      </div>
    );
  }

  if (error || !waypoint || !promptPack) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-center text-red-300">
        {error || 'Waypoint not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-3xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
            Asset production studio
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-amber-50">{promptPack.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            Generates Midjourney, Runway, and DaVinci prompts from the waypoint modern reference
            image and viewpoint metadata — same pipeline used for the Colosseum portal.
          </p>
        </header>

        {framing ? (
          <section
            className={`mb-8 rounded-xl border p-4 ${
              framing.passes
                ? 'border-emerald-500/30 bg-emerald-950/20'
                : 'border-amber-500/40 bg-amber-950/20'
            }`}
          >
            <h2 className="text-sm font-semibold text-amber-100">
              Framing check (Colosseum standard)
            </h2>
            <p className="mt-2 text-xs text-stone-400">
              Colosseum reference: viewpoint ~{framing.colosseumReferenceOffsetM} m from center, pitch{' '}
              {framing.colosseumReferencePitch}°. This waypoint: offset{' '}
              {framing.offsetM != null ? `~${Math.round(framing.offsetM)} m` : 'unknown'}, pitch{' '}
              {framing.pitch ?? 'unknown'}°.
            </p>
            {framing.warnings.length ? (
              <ul className="mt-3 space-y-2 text-sm text-amber-200">
                {framing.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            ) : null}
            {framing.tips.length ? (
              <ul className="mt-3 space-y-1 text-xs text-emerald-200/90">
                {framing.tips.map((tip) => (
                  <li key={tip}>✓ {tip}</li>
                ))}
              </ul>
            ) : null}
            <details className="mt-4 text-xs text-stone-400">
              <summary className="cursor-pointer text-amber-300">Framing checklist for all waypoints</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {MODERN_FRAMING_CHECKLIST.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p className="mt-3 text-stone-500">
                Reference: {COLOSSEUM_FRAMING_REFERENCE.notes.join(' ')}
              </p>
            </details>
          </section>
        ) : null}

        <section className="mb-8 grid gap-4 rounded-xl border border-stone-700 bg-stone-900/60 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
              Modern reference (source still)
            </p>
            {modernReferencePath ? (
              <img
                src={modernReferencePath}
                alt={`Modern reference for ${promptPack.title}`}
                className="aspect-video w-full rounded-lg border border-stone-700 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-stone-600 text-sm text-stone-500">
                Add modern_image_url to the waypoint seed
              </div>
            )}
            {promptPack.modernReferenceUrl ? (
              <a
                href={promptPack.modernReferenceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-amber-300 underline underline-offset-2"
              >
                Open reference URL
              </a>
            ) : null}
          </div>

          <div className="text-sm text-stone-300">
            <p className="font-semibold text-amber-100">Viewpoint metadata</p>
            <ul className="mt-3 space-y-2 font-mono text-xs leading-relaxed text-stone-400">
              <li>id: {promptPack.waypointId}</li>
              <li>
                stand: {promptPack.viewpoint.standLat}, {promptPack.viewpoint.standLng}
              </li>
              <li>
                heading: {promptPack.viewpoint.heading}° · pitch: {promptPack.viewpoint.pitch}°
              </li>
              <li>
                landmark: {promptPack.viewpoint.landmarkLat}, {promptPack.viewpoint.landmarkLng}
              </li>
              <li>poster frame: {promptPack.viewpoint.posterSec}s</li>
            </ul>
            {promptPack.streetViewUrl ? (
              <a
                href={promptPack.streetViewUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-amber-400/40 px-4 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-400/10"
              >
                Open Street View at viewpoint
              </a>
            ) : null}
          </div>
        </section>

        <PromptBlock
          title="Shared camera rules (reference — do not paste alone)"
          body={`${promptPack.sharedCameraRules}\n\nUse the tool-specific prompts below. Prepend this block only if a tool's prompt field is short and you need extra camera constraints.`}
          tool="Context for you · optional prefix"
        />

        <section className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/5 p-4 text-sm text-stone-300">
          <h2 className="font-semibold text-amber-100">Recommended order (Pantheon)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-stone-400">
            <li>
              <strong className="text-stone-200">Skip modern still</strong> — you already have{' '}
              <code className="text-amber-200">modern-exterior.jpg</code> from Street View.
            </li>
            <li>
              <strong className="text-stone-200">Runway / Pika</strong> — paste{' '}
              <em>Modern animated video</em>, upload <code className="text-amber-200">modern-exterior.jpg</code> → save{' '}
              <code className="text-amber-200">modern.mp4</code>
            </li>
            <li>
              <strong className="text-stone-200">Midjourney</strong> — paste <em>Ancient still image</em>, attach modern
              photo as image reference → save <code className="text-amber-200">ancient-reconstruction.jpg</code>
            </li>
            <li>
              <strong className="text-stone-200">Runway / Pika</strong> — paste <em>Ancient animated video</em>, use
              ancient still + motion-sync from modern clip → save <code className="text-amber-200">ancient-reconstruction.mp4</code>
            </li>
            <li>
              <strong className="text-stone-200">DaVinci / export</strong> — use brief to pull poster frames at ~3s
            </li>
          </ol>
        </section>

        <div className="mt-6 space-y-4">
          <PromptBlock
            title="Modern animated video"
            tool="Runway · Pika · Kling"
            body={promptPack.prompts.modernAnimatedVideo}
          />
          <PromptBlock
            title="Ancient still image"
            tool="Midjourney · Flux · DALL·E"
            body={promptPack.prompts.ancientStill}
          />
          <PromptBlock
            title="Ancient animated video"
            tool="Runway · Pika · motion-sync"
            body={promptPack.prompts.ancientAnimatedVideo}
          />
          <PromptBlock
            title="DaVinci Resolve brief"
            tool="Edit · posters · sync"
            body={promptPack.prompts.davinciResolveBrief}
          />
        </div>

        <section className="mt-8 rounded-xl border border-stone-700 bg-stone-900/50 p-4">
          <h2 className="text-sm font-semibold text-amber-200">Workflow checklist</h2>
          <div className="mt-4 space-y-4 text-sm text-stone-300">
            {Object.values(promptPack.tooling).map((block) => (
              <div key={block.title}>
                <p className="font-medium text-amber-100">{block.title}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-stone-400">
                  {block.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-stone-700 bg-stone-900/50 p-4">
          <h2 className="text-sm font-semibold text-amber-200">Deliverable paths</h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-stone-400">
            {promptPack.fileManifest.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-center text-xs text-stone-500">
          Studio URL: ?assetStudio=true&amp;waypoint={promptPack.waypointId}
        </p>
      </div>
    </div>
  );
};

export default WaypointAssetStudio;
