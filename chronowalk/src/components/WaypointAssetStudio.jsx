import { useEffect, useMemo, useState } from 'react';
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
import { buildAssetStudioUrl, listAssetStudioEntries } from '../utils/assetStudioUrls';
import { Button, SectionHeader } from './ui';

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
    <section className="bg-ink900 rounded-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink900">{title}</h3>
          {tool ? <p className="mt-1 text-xs uppercase tracking-wide text-muted">{tool}</p> : null}
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted">
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

  const studioEntries = useMemo(() => listAssetStudioEntries(), []);
  const studioPageUrl = useMemo(() => {
    if (typeof window === 'undefined') return buildAssetStudioUrl(waypointId, 'http://localhost:5173');
    return buildAssetStudioUrl(waypointId, window.location.origin);
  }, [waypointId]);

  const modernReferencePath = waypoint ? getModernReferenceUrl(waypoint) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone text-muted">
        Loading waypoint asset studio…
      </div>
    );
  }

  if (error || !waypoint || !promptPack) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone px-6 text-center text-terracotta">
        {error || 'Waypoint not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone text-ink900">
      <div className="mx-auto max-w-3xl px-4 py-8 pb-safe pt-safe">
        <header className="mb-8">
          <SectionHeader
            align="left"
            eyebrow="Asset production studio"
            title={promptPack.title}
            subtitle="Generates Midjourney, Runway, and DaVinci prompts from the waypoint modern reference image and viewpoint metadata · same pipeline used for the Colosseum portal."
          />

          <div className="bg-ink900 rounded-card mt-5 p-4">
            <p className="text-eyebrow uppercase text-terracotta">Bookmark this page</p>
            <p className="mt-2 break-all font-mono text-xs text-muted">{studioPageUrl}</p>
            <p className="mt-3 text-xs text-muted">
              All stops:{' '}
              {studioEntries.map((entry, index) => (
                <span key={entry.id}>
                  {index > 0 ? ' · ' : null}
                  {entry.id === waypointId ? (
                    <span className="font-medium text-ink900">{entry.title}</span>
                  ) : (
                    <a
                      href={entry.search}
                      className="text-terracotta underline decoration-terracotta/40 hover:text-terracotta/80"
                    >
                      {entry.title}
                    </a>
                  )}
                </span>
              ))}
            </p>
          </div>
        </header>

        {framing ? (
          <section
            className={`mb-8 p-4 ${
              framing.passes
                ? 'border-olive/40 bg-acthill/5'
                : 'border-ember/40 bg-ember/5'
            }`}
          >
            <h2 className="text-sm font-semibold text-ink900">
              Framing check (Colosseum standard)
            </h2>
            <p className="mt-2 text-xs text-muted">
              Colosseum reference: viewpoint ~{framing.colosseumReferenceOffsetM} m from center, pitch{' '}
              {framing.colosseumReferencePitch}° (large approach). This waypoint (
              {framing.framingProfile.replace('_', ' ')}): offset{' '}
              {framing.offsetM != null ? `~${Math.round(framing.offsetM)} m` : 'unknown'}, pitch{' '}
              {framing.pitch ?? 'unknown'}°.
            </p>
            {framing.warnings.length ? (
              <ul className="mt-3 space-y-2 text-sm text-ember">
                {framing.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            ) : null}
            {framing.tips.length ? (
              <ul className="mt-3 space-y-1 text-xs text-acthill">
                {framing.tips.map((tip) => (
                  <li key={tip}>✓ {tip}</li>
                ))}
              </ul>
            ) : null}
            <details className="mt-4 text-xs text-muted">
              <summary className="cursor-pointer text-terracotta">Framing checklist for all waypoints</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {MODERN_FRAMING_CHECKLIST.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p className="mt-3 text-muted/70">
                Reference: {COLOSSEUM_FRAMING_REFERENCE.notes.join(' ')}
              </p>
            </details>
          </section>
        ) : null}

        <section className="bg-ink900 rounded-card mb-8 grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <p className="mb-2 text-eyebrow uppercase text-terracotta">
              Modern reference (source still)
            </p>
            {modernReferencePath ? (
              <img
                src={modernReferencePath}
                alt={`Modern reference for ${promptPack.title}`}
                className="aspect-video w-full rounded-lg border border-ink800 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-ink800 text-sm text-muted">
                Add modern_image_url to the waypoint seed
              </div>
            )}
            {promptPack.modernReferenceUrl ? (
              <a
                href={promptPack.modernReferenceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-terracotta underline underline-offset-2"
              >
                Open reference URL
              </a>
            ) : null}
          </div>

          <div className="text-sm text-muted">
            <p className="font-semibold text-ink900">Viewpoint metadata</p>
            <ul className="mt-3 space-y-2 font-mono text-xs leading-relaxed text-muted">
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
                className="mt-4 inline-flex items-center justify-center rounded-full border border-ember/35 bg-terracotta/8 px-3 py-1.5 text-xs font-semibold text-terracotta transition hover:bg-terracotta/15"
              >
                Open Street View at viewpoint
              </a>
            ) : null}
          </div>
        </section>

        <PromptBlock
          title="Shared camera rules (reference · do not paste alone)"
          body={`${promptPack.sharedCameraRules}\n\nUse the tool-specific prompts below. Prepend this block only if a tool's prompt field is short and you need extra camera constraints.`}
          tool="Context for you · optional prefix"
        />

        <section className="bg-ink900 rounded-card mb-6 border-ember/20 bg-ink800/40 p-4 text-sm text-muted">
          <h2 className="font-semibold text-ink900">Recommended order ({promptPack.title})</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>
              <strong className="text-ink900">
                {modernReferencePath ? 'Skip modern still' : 'Capture modern still'}
              </strong>
              {modernReferencePath
                ? ' · modern-exterior.jpg is already in the waypoint folder (re-export from Street View only if framing check fails).'
                : ' · export modern-exterior.jpg from Street View at the viewpoint above.'}
            </li>
            <li>
              <strong className="text-ink900">Runway / Pika</strong> · paste{' '}
              <em>Modern animated video</em>, upload <code className="text-terracotta">modern-exterior.jpg</code> → save{' '}
              <code className="text-terracotta">modern.mp4</code>
            </li>
            <li>
              <strong className="text-ink900">Midjourney</strong> · paste <em>Ancient still image</em>, attach modern
              photo as image reference → save <code className="text-terracotta">ancient-reconstruction.jpg</code>
            </li>
            <li>
              <strong className="text-ink900">Runway / Pika</strong> · paste <em>Ancient animated video</em>, use
              ancient still + motion-sync from modern clip → save <code className="text-terracotta">ancient-reconstruction.mp4</code>
            </li>
            <li>
              <strong className="text-ink900">DaVinci / export</strong> · use brief to pull poster frames at ~3s
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

        <section className="bg-ink900 rounded-card mt-8 p-4">
          <h2 className="text-sm font-semibold text-ink900">Workflow checklist</h2>
          <div className="mt-4 space-y-4 text-sm text-muted">
            {Object.values(promptPack.tooling).map((block) => (
              <div key={block.title}>
                <p className="font-medium text-ink900">{block.title}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  {block.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-ink900 rounded-card mt-6 p-4">
          <h2 className="text-sm font-semibold text-ink900">Deliverable paths</h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-muted">
            {promptPack.fileManifest.map((path) => (
              <li key={path}>{path}</li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-center text-xs text-muted">
          Studio URL: {studioPageUrl}
        </p>
      </div>
    </div>
  );
};

export default WaypointAssetStudio;
