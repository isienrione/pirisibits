import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { resolveSliderPosterAtSec, resolveSliderPostAnimationLoopMs } from '../utils/sliderMedia';
import { composeLayerTransform } from '../utils/calibrationStorage';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_SHIFT_PX = 24;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;
const MEDIA_ASPECT = 16 / 9;
const DEFAULT_MAX_FRAME_HEIGHT_RATIO = 0.48;

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

const containMediaStyle = {
  ...baseMediaStyle,
  objectFit: 'contain',
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

/** Size the frame to true 16:9 from card width, capped for the waypoint card viewport. */
const useCompareFrameSize = (maxFrameHeightRatio = DEFAULT_MAX_FRAME_HEIGHT_RATIO) => {
  const frameRef = useRef(null);
  const [frameHeight, setFrameHeight] = useState(0);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return undefined;

    const update = () => {
      const width = element.clientWidth;
      if (!width) return;

      const idealHeight = width / MEDIA_ASPECT;
      const maxHeight = window.innerHeight * maxFrameHeightRatio;
      setFrameHeight(Math.min(idealHeight, maxHeight));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [maxFrameHeightRatio]);

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
        backgroundColor: '#0c0a09',
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
  <div className="flex h-full min-h-[12rem] flex-col items-center justify-center bg-gradient-to-b from-stone-800 to-stone-900 p-5 text-center">
    <p className="text-sm font-semibold text-amber-300">{message}</p>
    <p className="mt-3 font-mono text-[10px] text-amber-200/80">ancient-reconstruction.mp4</p>
  </div>
);

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
}) => {
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);
  const resolvedMaxFrameHeightRatio =
    maxFrameHeightRatio ?? (alignmentMode ? 0.34 : DEFAULT_MAX_FRAME_HEIGHT_RATIO);
  const { frameRef, frameHeight } = useCompareFrameSize(resolvedMaxFrameHeightRatio);
  const modernVideoRef = useRef(null);
  const ancientVideoRef = useRef(null);
  const compareReadyRef = useRef(false);
  const loopTimerRef = useRef(null);
  const loopPhaseRef = useRef(false);
  const modernEndedRef = useRef(false);
  const ancientEndedRef = useRef(false);
  const ancientMedia = useMediaProbe(historicImg);
  const ancientReady = ancientMedia.ready;
  const ancientLayerActive = Boolean(historicImg) && !ancientMedia.failed;
  const modernPosterReady = usePosterProbe(modernPosterUrl);
  const ancientPosterReady = usePosterProbe(ancientPosterUrl);
  const [compareReady, setCompareReady] = useState(false);
  const [animationLoopActive, setAnimationLoopActive] = useState(false);
  const modernIsVideo = isVideoUrl(modernImg);
  const ancientIsVideo = isVideoUrl(historicImg);
  const resolvedPosterAt = resolveSliderPosterAtSec(posterAtSec);
  const resolvedLoopMs = resolveSliderPostAnimationLoopMs(postAnimationLoopMs);
  const usingVideo = modernIsVideo || ancientIsVideo;

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

    const style = containMediaStyle;
    const ancientTransform = isAncient
      ? composeLayerTransform(calibration, parallaxTransform)
      : undefined;

    const media = isVideoUrl(src) ? (
      <video
        src={src}
        muted
        playsInline
        preload="auto"
        aria-label={label}
        style={style}
      />
    ) : (
      <img src={src} alt={label} style={style} referrerPolicy="no-referrer" />
    );

    if (!isAncient) {
      return <div className="absolute inset-0 bg-stone-950">{media}</div>;
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
        <div className="flex h-full items-center justify-center bg-stone-950 px-4 text-center text-sm text-amber-200">
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
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-950/70 text-xs text-amber-200">
              Loading ancient Rome…
            </div>
          ) : null}
          <video
            ref={ancientVideoRef}
            src={historicImg}
            muted
            playsInline
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

  return (
    <div className="w-full overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <div
        ref={frameRef}
        className="relative w-full"
        style={{ height: frameHeight > 0 ? `${frameHeight}px` : undefined }}
      >
        {frameHeight > 0 ? (
          alignmentMode ? (
            <div className="relative h-full w-full overflow-hidden bg-stone-950">
              {renderAlignmentView()}
            </div>
          ) : (
            <ReactCompareSlider
              style={{ width: '100%', height: '100%' }}
              itemOne={renderModernItem()}
              itemTwo={renderAncientItem()}
            />
          )
        ) : (
          <div className="aspect-video w-full bg-stone-950" />
        )}
      </div>
      <p className="bg-stone-900 px-3 py-2 text-center text-xs leading-relaxed text-stone-400">
        {alignmentMode ? (
          'Ghost overlay active — adjust the ancient layer until it snaps to the real-world facade.'
        ) : !ancientLayerActive ? (
          'Add the matched ancient video to complete the portal.'
        ) : ancientMedia.loading ? (
          'Modern view is playing — ancient reconstruction is loading…'
        ) : compareReady ? (
          <>
            Full facade — drag to compare eras.
            {usingVideo ? (
              <button
                type="button"
                onClick={replayVideos}
                className="ml-1 text-amber-400 underline underline-offset-2"
              >
                Replay
              </button>
            ) : null}
          </>
        ) : animationLoopActive ? (
          'Animation looping — it will switch to the full facade for comparing soon.'
        ) : usingVideo ? (
          'Animation playing — it will switch to the full facade for comparing when finished.'
        ) : tiltEnabled && isActive ? (
          <>
            Same viewpoint, two eras — tilt gently for depth.
            <button
              type="button"
              onClick={recalibrate}
              className="ml-1 text-amber-400 underline underline-offset-2"
            >
              Reset center
            </button>
          </>
        ) : (
          'Drag to compare the same view across time.'
        )}
      </p>
    </div>
  );
};

export default BeforeAfterSlider;
