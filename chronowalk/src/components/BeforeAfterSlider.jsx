import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { focusRing } from './ui/focusRing';
import { cn } from './ui/cn';
import { TimeFractureHandle } from './ui/TimeFractureSlider';
import { resolveSliderPosterAtSec, resolveSliderPostAnimationLoopMs } from '../utils/sliderMedia';
import { composeLayerTransform } from '../utils/calibrationStorage';
import { HAPTIC_KIND, triggerHaptic } from '../utils/haptics';

const SLIDER_SNAP_POSITIONS = [0, 50, 100];
const SLIDER_SNAP_TOLERANCE = 4;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_SHIFT_PX = 24;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;
const MEDIA_ASPECT = 16 / 9;
const DEFAULT_MAX_FRAME_HEIGHT_RATIO = 0.58;
const ALIGNMENT_MAX_FRAME_HEIGHT_RATIO = 0.5;

export const isVideoUrl = (url) => Boolean(url && VIDEO_EXT.test(url));

const baseMediaStyle = {
  display: 'block',
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  objectPosition: 'center center',
};

const coverMediaStyle = {
  ...baseMediaStyle,
  objectFit: 'cover',
};

const usePosterProbe = (src) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) {
      setReady(false);
      return undefined;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setReady(true);
    };
    image.onerror = () => {
      if (!cancelled) setReady(false);
    };
    image.referrerPolicy = 'no-referrer';
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return ready;
};

/** Size the compare frame from card width (16:9) or fill the immersive parent. */
const useCompareFrameSize = (maxFrameHeightRatio = DEFAULT_MAX_FRAME_HEIGHT_RATIO, fillParent = false) => {
  const frameRef = useRef(null);
  const [frameHeight, setFrameHeight] = useState(0);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return undefined;

    const update = () => {
      if (fillParent) {
        const parent = element.parentElement;
        const parentHeight = parent?.clientHeight ?? 0;
        if (parentHeight > 0) {
          setFrameHeight(parentHeight);
          return;
        }
      }

      const width = element.clientWidth;
      if (!width) return;

      const idealHeight = width / MEDIA_ASPECT;
      const maxHeight = window.innerHeight * maxFrameHeightRatio;
      setFrameHeight(Math.min(idealHeight, maxHeight));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (fillParent && element.parentElement) {
      observer.observe(element.parentElement);
    }
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [maxFrameHeightRatio, fillParent]);

  return { frameRef, frameHeight };
};

const SliderItemShell = ({
  children,
  calibration,
  parallaxTransform,
  ghostOpacity,
  animateParallax = true,
}) => {
  const layerTransform = composeLayerTransform(calibration, parallaxTransform);
  const shouldAnimate = animateParallax && Boolean(parallaxTransform) && ghostOpacity == null;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#17212B',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: layerTransform,
          transition: shouldAnimate ? 'transform 0.1s ease-out' : undefined,
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
          willChange: layerTransform ? 'transform' : undefined,
          opacity: ghostOpacity ?? 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const MEDIA_PROBE_TIMEOUT_MS = 12000;

const AncientPlaceholder = ({ message = 'Ancient reconstruction — coming next' }) => (
  <div className="flex h-full min-h-[12rem] flex-col items-center justify-center bg-gradient-to-b from-deep-slate to-deep-slate/90 p-6 text-center">
    <p className="font-display text-base font-semibold text-gold">{message}</p>
    <p className="mt-3 max-w-xs text-sm text-sand/80">
      The portal will open once the matched ancient view is available.
    </p>
  </div>
);

function CompareSliderHandle() {
  return <TimeFractureHandle />;
}

function SliderEraPills({
  modernLabel = 'Today',
  ancientLabel = 'Ancient Rome c. 80 AD',
  immersive = false,
}) {
  const pillClass = cn(
    'rounded-full border px-3.5 py-2 shadow-sm backdrop-blur-md',
    immersive
      ? 'border-ivory/20 bg-obsidian/40'
      : 'border-parchment/60 bg-ivory/85'
  )

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 z-10 flex items-end justify-between px-4',
        immersive ? 'bottom-6 pb-safe' : 'bottom-4'
      )}
    >
      <div className={pillClass}>
        <p
          className={cn(
            'text-xs font-semibold',
            immersive ? 'text-ivory' : 'text-deep-slate'
          )}
        >
          {modernLabel}
        </p>
      </div>
      <div className={cn(pillClass, 'max-w-[58%] text-right')}>
        <p
          className={cn(
            'font-display text-sm italic leading-snug',
            immersive ? 'text-gold' : 'text-bronze'
          )}
        >
          {ancientLabel}
        </p>
      </div>
    </div>
  )
}

function ImmersiveCompareHeader({ onBack, onShare }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to landmark card"
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/20 bg-obsidian/45 text-ivory backdrop-blur-sm',
            focusRing
          )}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M14 6 8 12l6 6"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="min-w-0 flex-1 px-2 text-center">
          <h2 className="font-display text-xl font-semibold leading-tight text-ivory">Then &amp; Now</h2>
          <p className="mt-0.5 text-xs text-parchment/80">Drag to explore the past</p>
        </div>

        {onShare ? (
          <button
            type="button"
            onClick={onShare}
            aria-label="Share this reveal"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/20 bg-obsidian/45 text-ivory backdrop-blur-sm',
              focusRing
            )}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 12h11M14 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <span className="h-11 w-11 shrink-0" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

function SliderLoadingSkeleton({ reducedMotion = false }) {
  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-gradient-to-br from-sand via-limestone/50 to-warm-white">
      <div
        className={cn(
          'absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,253,248,0.55)_50%,transparent_75%)] bg-[length:200%_100%]',
          !reducedMotion && 'animate-pulse'
        )}
      />
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-medium text-deep-slate">Preparing the time portal…</p>
        <p className="mt-2 text-xs text-soft-slate">Loading matched views</p>
      </div>
    </div>
  );
}

function MediaFailFallback({ title = 'Media unavailable' }) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center bg-gradient-to-b from-sand to-limestone/60 px-6 text-center">
      <p className="font-display text-lg font-semibold text-deep-slate">{title}</p>
      <p className="mt-2 max-w-xs text-sm text-soft-slate">
        Check your connection and try again, or continue with the audio story.
      </p>
    </div>
  );
}

const useMediaProbe = (src) => {
  const [status, setStatus] = useState(src ? 'loading' : 'idle');

  useEffect(() => {
    if (!src) {
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');

    const markReady = () => {
      if (!cancelled) setStatus('ready');
    };

    const markError = () => {
      if (!cancelled) setStatus('error');
    };

    if (isVideoUrl(src)) {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = markReady;
      video.onloadeddata = markReady;
      video.oncanplay = markReady;
      video.onerror = markError;
      video.src = src;
      video.load();

      const timer = window.setTimeout(markReady, MEDIA_PROBE_TIMEOUT_MS);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        video.removeAttribute('src');
        video.load();
      };
    }

    const image = new Image();
    image.onload = markReady;
    image.onerror = markError;
    image.referrerPolicy = 'no-referrer';
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return {
    ready: status === 'ready' || (Boolean(src) && isVideoUrl(src) && status === 'loading'),
    loading: status === 'loading',
    failed: status === 'error',
  };
};

const BeforeAfterSlider = ({
  modernImg,
  historicImg,
  depthMap,
  tiltEnabled = false,
  posterAtSec,
  postAnimationLoopMs,
  modernPosterUrl,
  ancientPosterUrl,
  calibration,
  alignmentMode = false,
  maxFrameHeightRatio,
  embedded = false,
  startImmersive = false,
  onRequestExit = null,
  modernEraLabel = 'Today',
  ancientEraLabel = 'Ancient Rome c. 80 AD',
  onShare = null,
}) => {
  const [immersive, setImmersive] = useState(startImmersive);
  const reducedMotion = useReducedMotion();
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);
  const immersiveHeightRatio = immersive ? 1 : maxFrameHeightRatio;
  const resolvedMaxFrameHeightRatio =
    immersiveHeightRatio ??
    (alignmentMode ? ALIGNMENT_MAX_FRAME_HEIGHT_RATIO : DEFAULT_MAX_FRAME_HEIGHT_RATIO);
  const { frameRef, frameHeight } = useCompareFrameSize(resolvedMaxFrameHeightRatio, immersive);
  const modernVideoRef = useRef(null);
  const ancientVideoRef = useRef(null);
  const compareReadyRef = useRef(false);
  const loopTimerRef = useRef(null);
  const loopPhaseRef = useRef(false);
  const sliderPositionRef = useRef(50);
  const isDraggingSliderRef = useRef(false);
  const lastSnapRef = useRef(null);
  const modernEndedRef = useRef(false);
  const ancientEndedRef = useRef(false);
  const ancientMedia = useMediaProbe(historicImg);
  const modernMedia = useMediaProbe(modernImg);
  const ancientReady = ancientMedia.ready;
  const modernReady = modernMedia.ready;
  const ancientLayerActive = Boolean(historicImg) && !ancientMedia.failed;
  const modernLayerFailed = Boolean(modernImg) && modernMedia.failed;
  const modernPosterReady = usePosterProbe(modernPosterUrl);
  const ancientPosterReady = usePosterProbe(ancientPosterUrl);
  const [compareReady, setCompareReady] = useState(false);
  const [animationLoopActive, setAnimationLoopActive] = useState(false);
  const modernIsVideo = isVideoUrl(modernImg);
  const ancientIsVideo = isVideoUrl(historicImg);
  const resolvedPosterAt = resolveSliderPosterAtSec(posterAtSec);
  const resolvedLoopMs = resolveSliderPostAnimationLoopMs(postAnimationLoopMs);
  const usingVideo = modernIsVideo || ancientIsVideo;

  const handleSliderPositionChange = useCallback((position) => {
    sliderPositionRef.current = position;
    isDraggingSliderRef.current = true;
  }, []);

  const handleSliderRelease = useCallback(() => {
    if (!isDraggingSliderRef.current) return;
    isDraggingSliderRef.current = false;

    const position = sliderPositionRef.current;
    const snapped = SLIDER_SNAP_POSITIONS.find(
      (point) => Math.abs(position - point) <= SLIDER_SNAP_TOLERANCE
    );

    if (snapped != null && snapped !== lastSnapRef.current) {
      lastSnapRef.current = snapped;
      triggerHaptic(HAPTIC_KIND.SELECTION);
    }
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    frame.addEventListener('pointerup', handleSliderRelease);
    frame.addEventListener('pointercancel', handleSliderRelease);
    return () => {
      frame.removeEventListener('pointerup', handleSliderRelease);
      frame.removeEventListener('pointercancel', handleSliderRelease);
    };
  }, [handleSliderRelease, frameHeight]);

  const postersAvailable =
    modernPosterUrl &&
    ancientPosterUrl &&
    modernPosterReady &&
    ancientPosterReady;

  const showPosters = compareReady && postersAvailable;
  const playbackMediaStyle = coverMediaStyle;
  const posterMediaStyle = coverMediaStyle;

  useEffect(() => {
    if (tiltEnabled) recalibrate();
  }, [tiltEnabled, historicImg, recalibrate]);

  useEffect(() => {
    compareReadyRef.current = false;
    modernEndedRef.current = false;
    ancientEndedRef.current = false;
    setCompareReady(false);
    setAnimationLoopActive(false);
    loopPhaseRef.current = false;
    if (loopTimerRef.current) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, [modernImg, historicImg, resolvedPosterAt, resolvedLoopMs]);

  useEffect(
    () => () => {
      if (loopTimerRef.current) {
        window.clearTimeout(loopTimerRef.current);
      }
    },
    []
  );

  const seekVideoToPosterFrame = useCallback(
    (video) => {
      if (!video) return;

      const target = Math.max(resolvedPosterAt ?? 0, 0);
      video.pause();
      if (Number.isFinite(video.duration)) {
        video.currentTime = Math.min(target, Math.max(video.duration - 0.04, 0));
      } else {
        video.currentTime = target;
      }
    },
    [resolvedPosterAt]
  );

  const enterCompareMode = useCallback(() => {
    if (compareReadyRef.current) return;
    compareReadyRef.current = true;

    if (!postersAvailable) {
      seekVideoToPosterFrame(modernVideoRef.current);
      seekVideoToPosterFrame(ancientVideoRef.current);
    }

    setCompareReady(true);
  }, [postersAvailable, seekVideoToPosterFrame]);

  const startLoopPhase = useCallback(() => {
    if (loopTimerRef.current || loopPhaseRef.current) return;

    loopPhaseRef.current = true;
    setAnimationLoopActive(true);
    modernEndedRef.current = false;
    ancientEndedRef.current = false;

    const modern = modernVideoRef.current;
    const ancient = ancientVideoRef.current;

    if (modern) {
      modern.loop = true;
      modern.currentTime = 0;
      void modern.play();
    }
    if (ancient) {
      ancient.loop = true;
      ancient.currentTime = 0;
      void ancient.play();
    }

    loopTimerRef.current = window.setTimeout(() => {
      loopTimerRef.current = null;
      loopPhaseRef.current = false;
      setAnimationLoopActive(false);

      if (modern) modern.loop = false;
      if (ancient) ancient.loop = false;

      enterCompareMode();
    }, resolvedLoopMs);
  }, [enterCompareMode, resolvedLoopMs]);

  const markEnded = useCallback(
    (side) => {
      if (compareReadyRef.current || loopPhaseRef.current) return;

      if (side === 'modern') modernEndedRef.current = true;
      if (side === 'ancient') ancientEndedRef.current = true;

      const modernDone = !modernIsVideo || modernEndedRef.current;
      const ancientDone = !ancientIsVideo || ancientEndedRef.current;

      if (modernDone && ancientDone) {
        startLoopPhase();
      }
    },
    [ancientIsVideo, modernIsVideo, startLoopPhase]
  );

  const replayVideos = useCallback(() => {
    compareReadyRef.current = false;
    modernEndedRef.current = false;
    ancientEndedRef.current = false;
    loopPhaseRef.current = false;
    setCompareReady(false);
    setAnimationLoopActive(false);
    if (loopTimerRef.current) {
      window.clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }

    const modern = modernVideoRef.current;
    const ancient = ancientVideoRef.current;

    if (modern) {
      modern.loop = false;
      modern.currentTime = 0;
      void modern.play();
    }
    if (ancient) {
      ancient.loop = false;
      ancient.currentTime = 0;
      void ancient.play();
    }
  }, []);

  useEffect(() => {
    if (!usingVideo || compareReady || !ancientReady) return undefined;

    const modernVideo = modernVideoRef.current;
    const ancientVideo = ancientVideoRef.current;
    if (!modernVideo && !ancientVideo) return undefined;

    const onTimeUpdate = () => {
      if (compareReadyRef.current) return;
      if (!modernVideo || !ancientVideo || !modernIsVideo || !ancientIsVideo) return;

      if (Math.abs(ancientVideo.currentTime - modernVideo.currentTime) > 0.2) {
        ancientVideo.currentTime = modernVideo.currentTime;
      }
    };

    modernVideo?.addEventListener('timeupdate', onTimeUpdate);
    return () => modernVideo?.removeEventListener('timeupdate', onTimeUpdate);
  }, [ancientIsVideo, ancientReady, compareReady, modernIsVideo, usingVideo]);

  const depthBoost = depthMap ? 1.1 : 1;
  const offsetX = clamp(x * 1.8 * depthBoost, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const offsetY = clamp(y * 1.8 * depthBoost, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const rotateY = clamp(x * 0.55 * depthBoost, -6, 6);
  const rotateX = clamp(-y * 0.4 * depthBoost, -5, 5);

  const parallaxTransform =
    tiltEnabled && !compareReady && !alignmentMode
      ? `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${offsetX}px, ${offsetY}px, 0)`
      : undefined;

  const ancientGhostOpacity = alignmentMode ? 0.5 : undefined;

  useEffect(() => {
    if (!alignmentMode) return undefined;

    const modern = modernVideoRef.current;
    const ancient = ancientVideoRef.current;

    modern?.pause();
    ancient?.pause();
    seekVideoToPosterFrame(modern);
    seekVideoToPosterFrame(ancient);

    return undefined;
  }, [alignmentMode, seekVideoToPosterFrame]);

  const renderAlignmentMedia = (src, label, isAncient = false) => {
    if (!src) return null;

    const style = coverMediaStyle;
    const ancientTransform = isAncient
      ? composeLayerTransform(calibration, parallaxTransform)
      : undefined;

    const media = isVideoUrl(src) ? (
      <video
        src={src}
        muted
        playsInline
        controls={false}
        preload="auto"
        aria-label={label}
        style={style}
      />
    ) : (
      <img src={src} alt={label} style={style} referrerPolicy="no-referrer" />
    );

    if (!isAncient) {
      return <div className="absolute inset-0 bg-deep-slate">{media}</div>;
    }

    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.5,
          transform: ancientTransform,
          transformOrigin: 'center center',
        }}
      >
        {media}
      </div>
    );
  };

  const renderAlignmentView = () => {
    const modernSrc = modernPosterUrl || modernImg;
    const ancientSrc = ancientPosterUrl || historicImg;

    if (!modernSrc) {
      return (
        <div className="flex h-full items-center justify-center bg-deep-slate px-4 text-center text-sm text-sand">
          Modern reference image is missing for alignment.
        </div>
      );
    }

    return (
      <>
        {renderAlignmentMedia(modernSrc, 'Modern Colosseum')}
        {ancientSrc && !ancientMedia.failed
          ? renderAlignmentMedia(ancientSrc, 'Ancient Colosseum reconstruction', true)
          : null}
      </>
    );
  };

  const renderModernItem = () => {
    if (showPosters) {
      return (
        <SliderItemShell>
          <ReactCompareSliderImage
            src={modernPosterUrl}
            alt="Modern Colosseum"
            style={posterMediaStyle}
            referrerPolicy="no-referrer"
          />
        </SliderItemShell>
      );
    }

    if (modernIsVideo) {
      return (
        <SliderItemShell parallaxTransform={parallaxTransform}>
          <video
            ref={modernVideoRef}
            src={modernImg}
            muted
            playsInline
            controls={false}
            autoPlay
            preload="auto"
            aria-label="Modern Colosseum"
            style={playbackMediaStyle}
            onEnded={() => markEnded('modern')}
          />
        </SliderItemShell>
      );
    }

    return (
      <ReactCompareSliderImage
        src={modernImg}
        alt="Modern Colosseum"
        style={posterMediaStyle}
        referrerPolicy="no-referrer"
      />
    );
  };

  const renderAncientItem = () => {
    if (!historicImg || ancientMedia.failed) {
      return (
        <AncientPlaceholder message="Ancient reconstruction could not load — check your connection and retry." />
      );
    }

    if (showPosters) {
      return (
        <SliderItemShell calibration={calibration} ghostOpacity={ancientGhostOpacity}>
          <ReactCompareSliderImage
            src={ancientPosterUrl}
            alt="Ancient Colosseum reconstruction"
            style={posterMediaStyle}
            referrerPolicy="no-referrer"
          />
        </SliderItemShell>
      );
    }

    if (ancientIsVideo) {
      return (
        <SliderItemShell
          calibration={calibration}
          parallaxTransform={parallaxTransform}
          ghostOpacity={ancientGhostOpacity}
          animateParallax={!alignmentMode}
        >
          {ancientMedia.loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-deep-slate/70 text-xs text-sand">
              Loading ancient Rome…
            </div>
          ) : null}
          <video
            ref={ancientVideoRef}
            src={historicImg}
            muted
            playsInline
            controls={false}
            autoPlay
            preload="auto"
            aria-label="Ancient Colosseum reconstruction"
            style={playbackMediaStyle}
            onEnded={() => markEnded('ancient')}
          />
        </SliderItemShell>
      );
    }

    return (
      <SliderItemShell calibration={calibration} ghostOpacity={ancientGhostOpacity}>
        <ReactCompareSliderImage
          src={historicImg}
          alt="Ancient Colosseum reconstruction"
          style={posterMediaStyle}
          referrerPolicy="no-referrer"
        />
      </SliderItemShell>
    );
  };

  useEffect(() => {
    if (!immersive) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setImmersive(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [immersive]);

  const isMediaLoading =
    (Boolean(modernImg) && modernMedia.loading && !modernReady) ||
    (Boolean(historicImg) && ancientMedia.loading && !ancientReady);

  const renderSliderFrame = () => (
    <div
      ref={frameRef}
      className="compare-slider-frame relative w-full"
      style={{ height: frameHeight > 0 ? `${frameHeight}px` : undefined }}
      role="group"
      aria-label="Compare today and ancient Rome views"
    >
      {frameHeight > 0 ? (
        alignmentMode ? (
          <div className="relative h-full w-full overflow-hidden bg-deep-slate">
            {renderAlignmentView()}
          </div>
        ) : modernLayerFailed ? (
          <MediaFailFallback title="Modern view unavailable" />
        ) : (
          <>
            <SliderEraPills
              modernLabel={modernEraLabel}
              ancientLabel={ancientEraLabel}
              immersive={immersive}
            />
            {immersive ? (
              <div
                className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(23,33,43,0.52)_100%)]"
                aria-hidden="true"
              />
            ) : null}
            {isMediaLoading ? <SliderLoadingSkeleton reducedMotion={reducedMotion} /> : null}
            <ReactCompareSlider
              style={{ width: '100%', height: '100%', touchAction: 'none' }}
              itemOne={renderModernItem()}
              itemTwo={renderAncientItem()}
              handle={<CompareSliderHandle />}
              onlyHandleDraggable={false}
              changePositionOnHover={false}
              onPositionChange={handleSliderPositionChange}
            />
            <div className="grain-overlay" aria-hidden="true" />
          </>
        )
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-sand to-limestone/50">
          <SliderLoadingSkeleton reducedMotion={reducedMotion} />
        </div>
      )}
    </div>
  );

  const renderCaption = () => {
    if (alignmentMode) {
      return 'Adjust the ancient layer until it aligns with the facade.';
    }
    if (!ancientLayerActive) {
      return 'Ancient reconstruction is being prepared for this landmark.';
    }
    if (isMediaLoading) {
      return 'Loading both eras of Rome…';
    }
    if (compareReady) {
      return (
        <>
          Drag to reveal the past.
          {usingVideo ? (
            <button
              type="button"
              onClick={replayVideos}
              aria-label="Replay comparison videos"
              className={cn(
                'ml-1.5 min-h-11 rounded-lg px-2 text-bronze underline underline-offset-2',
                focusRing
              )}
            >
              Replay
            </button>
          ) : null}
        </>
      );
    }
    if (animationLoopActive) {
      return 'A brief animation — then you can drag between eras.';
    }
    if (usingVideo) {
      return 'Watch the facade come alive — comparison opens when ready.';
    }
    if (tiltEnabled && isActive) {
      return (
        <>
          Tilt gently for depth between eras.
          <button
            type="button"
            onClick={recalibrate}
            aria-label="Reset tilt center"
            className={cn(
              'ml-1.5 min-h-11 rounded-lg px-2 text-bronze underline underline-offset-2',
              focusRing
            )}
          >
            Reset center
          </button>
        </>
      );
    }
    return 'Drag to reveal the past.';
  };

  const closeImmersive = () => setImmersive(false);

  const exitCompareView = () => {
    closeImmersive();
    onRequestExit?.();
  };

  const sliderShell = (
    <div
      className={
        immersive
          ? 'relative flex h-full min-h-0 flex-1 flex-col'
          : embedded
            ? 'w-full overflow-hidden'
            : 'w-full overflow-hidden rounded-3xl border border-limestone/60 shadow-glass'
      }
    >
      {!immersive ? (
        <div
          className={cn(
            'flex items-center justify-between gap-2 border-b border-limestone/50 px-3 py-2',
            embedded ? 'bg-warm-white/95' : 'bg-sand/40'
          )}
        >
          {embedded && onRequestExit ? (
            <button
              type="button"
              onClick={exitCompareView}
              aria-label="Back to landmark card"
              className={cn(
                'min-h-11 rounded-full border border-limestone/70 bg-warm-white/90 px-3 py-2.5 text-xs font-semibold text-deep-slate shadow-sm',
                focusRing
              )}
            >
              Back to landmark
            </button>
          ) : (
            <span className="w-2" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => setImmersive(true)}
            aria-label="Open full screen compare view"
            className={cn(
              'min-h-11 rounded-full border border-limestone/70 bg-warm-white/90 px-4 py-2.5 text-xs font-semibold text-deep-slate shadow-sm',
              focusRing
            )}
          >
            Full screen
          </button>
        </div>
      ) : null}

      <div className={immersive ? 'relative min-h-0 flex-1' : ''}>{renderSliderFrame()}</div>

      {!immersive ? (
        <p className="border-t border-limestone/40 bg-warm-white/95 px-4 py-3 text-center text-sm leading-relaxed text-soft-slate backdrop-blur-sm">
          {renderCaption()}
        </p>
      ) : null}
    </div>
  );

  if (immersive) {
    return (
      <div className="fixed inset-0 z-[300] flex flex-col bg-obsidian">
        <ImmersiveCompareHeader onBack={exitCompareView} onShare={onShare} />
        <div className="flex h-full w-full min-h-0 flex-1 flex-col pt-safe">{sliderShell}</div>
      </div>
    );
  }

  return sliderShell;
};

export default BeforeAfterSlider;
