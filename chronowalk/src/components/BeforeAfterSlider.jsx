import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { resolveSliderPosterAtSec } from '../utils/sliderMedia';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_SHIFT_PX = 24;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;
const MEDIA_ASPECT = 16 / 9;
const MAX_FRAME_HEIGHT_RATIO = 0.65;

export const isVideoUrl = (url) => Boolean(url && VIDEO_EXT.test(url));

const baseMediaStyle = {
  display: 'block',
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

/** Size the frame to true 16:9 from card width, capped by viewport height. */
const useCompareFrameSize = () => {
  const frameRef = useRef(null);
  const [frameHeight, setFrameHeight] = useState(0);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return undefined;

    const update = () => {
      const width = element.clientWidth;
      if (!width) return;

      const idealHeight = width / MEDIA_ASPECT;
      const maxHeight = window.innerHeight * MAX_FRAME_HEIGHT_RATIO;
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
  }, []);

  return { frameRef, frameHeight };
};

const SliderItemShell = ({ children, parallaxTransform }) => (
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
        width: '100%',
        height: '100%',
        transform: parallaxTransform,
        transition: parallaxTransform ? 'transform 0.1s ease-out' : undefined,
        transformStyle: 'preserve-3d',
        willChange: parallaxTransform ? 'transform' : undefined,
      }}
    >
      {children}
    </div>
  </div>
);

const AncientPlaceholder = () => (
  <div className="flex h-full min-h-[12rem] flex-col items-center justify-center bg-gradient-to-b from-stone-800 to-stone-900 p-5 text-center">
    <p className="text-sm font-semibold text-amber-300">Ancient reconstruction — coming next</p>
    <p className="mt-3 font-mono text-[10px] text-amber-200/80">ancient-reconstruction.mp4</p>
  </div>
);

const useMediaProbe = (src) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) {
      setReady(false);
      return undefined;
    }

    let cancelled = false;

    if (isVideoUrl(src)) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.onloadeddata = () => {
        if (!cancelled) setReady(true);
      };
      video.onerror = () => {
        if (!cancelled) setReady(false);
      };
      video.src = src;
      return () => {
        cancelled = true;
        video.removeAttribute('src');
        video.load();
      };
    }

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

const BeforeAfterSlider = ({
  modernImg,
  historicImg,
  depthMap,
  tiltEnabled = false,
  posterAtSec,
  modernPosterUrl,
  ancientPosterUrl,
}) => {
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);
  const { frameRef, frameHeight } = useCompareFrameSize();
  const modernVideoRef = useRef(null);
  const ancientVideoRef = useRef(null);
  const compareReadyRef = useRef(false);
  const modernEndedRef = useRef(false);
  const ancientEndedRef = useRef(false);
  const ancientReady = useMediaProbe(historicImg);
  const modernPosterReady = usePosterProbe(modernPosterUrl);
  const ancientPosterReady = usePosterProbe(ancientPosterUrl);
  const [compareReady, setCompareReady] = useState(false);
  const modernIsVideo = isVideoUrl(modernImg);
  const ancientIsVideo = isVideoUrl(historicImg);
  const resolvedPosterAt = resolveSliderPosterAtSec(posterAtSec);
  const usingVideo = modernIsVideo || ancientIsVideo;

  const postersAvailable =
    modernPosterUrl &&
    ancientPosterUrl &&
    modernPosterReady &&
    ancientPosterReady;

  const showPosters = compareReady && postersAvailable;
  const playbackMediaStyle = coverMediaStyle;
  const compareMediaStyle = containMediaStyle;

  useEffect(() => {
    if (tiltEnabled) recalibrate();
  }, [tiltEnabled, historicImg, recalibrate]);

  useEffect(() => {
    compareReadyRef.current = false;
    modernEndedRef.current = false;
    ancientEndedRef.current = false;
    setCompareReady(false);
  }, [modernImg, historicImg, resolvedPosterAt]);

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

  const markEnded = useCallback(
    (side) => {
      if (compareReadyRef.current) return;

      if (side === 'modern') modernEndedRef.current = true;
      if (side === 'ancient') ancientEndedRef.current = true;

      const modernDone = !modernIsVideo || modernEndedRef.current;
      const ancientDone = !ancientIsVideo || ancientEndedRef.current;

      if (modernDone && ancientDone) {
        enterCompareMode();
      }
    },
    [ancientIsVideo, enterCompareMode, modernIsVideo]
  );

  const replayVideos = useCallback(() => {
    compareReadyRef.current = false;
    modernEndedRef.current = false;
    ancientEndedRef.current = false;
    setCompareReady(false);

    const modern = modernVideoRef.current;
    const ancient = ancientVideoRef.current;

    if (modern) {
      modern.currentTime = 0;
      void modern.play();
    }
    if (ancient) {
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
    tiltEnabled && !compareReady
      ? `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${offsetX}px, ${offsetY}px, 0)`
      : undefined;

  const renderModernItem = () => {
    if (showPosters) {
      return (
        <ReactCompareSliderImage
          src={modernPosterUrl}
          alt="Modern Colosseum"
          style={compareMediaStyle}
          referrerPolicy="no-referrer"
        />
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
            style={compareReady ? compareMediaStyle : playbackMediaStyle}
            onEnded={() => markEnded('modern')}
          />
        </SliderItemShell>
      );
    }

    return (
      <ReactCompareSliderImage
        src={modernImg}
        alt="Modern Colosseum"
        style={compareMediaStyle}
        referrerPolicy="no-referrer"
      />
    );
  };

  const renderAncientItem = () => {
    if (!ancientReady) return <AncientPlaceholder />;

    if (showPosters) {
      return (
        <ReactCompareSliderImage
          src={ancientPosterUrl}
          alt="Ancient Colosseum reconstruction"
          style={compareMediaStyle}
          referrerPolicy="no-referrer"
        />
      );
    }

    if (ancientIsVideo) {
      return (
        <SliderItemShell parallaxTransform={parallaxTransform}>
          <video
            ref={ancientVideoRef}
            src={historicImg}
            muted
            playsInline
            autoPlay
            preload="auto"
            aria-label="Ancient Colosseum reconstruction"
            style={compareReady ? compareMediaStyle : playbackMediaStyle}
            onEnded={() => markEnded('ancient')}
          />
        </SliderItemShell>
      );
    }

    return (
      <ReactCompareSliderImage
        src={historicImg}
        alt="Ancient Colosseum reconstruction"
        style={compareMediaStyle}
        referrerPolicy="no-referrer"
      />
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
          <ReactCompareSlider
            style={{ width: '100%', height: '100%' }}
            itemOne={renderModernItem()}
            itemTwo={renderAncientItem()}
          />
        ) : (
          <div className="aspect-video w-full bg-stone-950" />
        )}
      </div>
      <p className="bg-stone-900 px-3 py-2 text-center text-xs leading-relaxed text-stone-400">
        {!ancientReady ? (
          'Modern view is playing — add the matched ancient video to complete the portal.'
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
