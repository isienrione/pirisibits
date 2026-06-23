import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { resolveSliderFreezeAtSec } from '../utils/sliderMedia';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_SHIFT_PX = 24;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

export const isVideoUrl = (url) => Boolean(url && VIDEO_EXT.test(url));

const mediaFitStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
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

const CompareMedia = ({
  src,
  alt,
  parallaxStyle,
  videoRef,
  onReady,
  onError,
  onEnded,
  hidden = false,
}) => {
  const style = {
    ...mediaFitStyle,
    ...parallaxStyle,
    visibility: hidden ? 'hidden' : 'visible',
  };

  if (isVideoUrl(src)) {
    return (
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        autoPlay
        preload="auto"
        aria-label={alt}
        style={style}
        onLoadedData={onReady}
        onError={onError}
        onEnded={onEnded}
      />
    );
  }

  if (parallaxStyle) {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        style={style}
        onLoad={onReady}
        onError={onError}
      />
    );
  }

  return (
    <ReactCompareSliderImage
      src={src}
      alt={alt}
      style={mediaFitStyle}
      referrerPolicy="no-referrer"
      onLoad={onReady}
      onError={onError}
    />
  );
};

const FrozenPoster = ({ src, alt, parallaxStyle }) => (
  <img
    src={src}
    alt={alt}
    referrerPolicy="no-referrer"
    style={{ ...mediaFitStyle, ...parallaxStyle }}
  />
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
  freezeAtSec,
  modernPosterUrl,
  ancientPosterUrl,
}) => {
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);
  const modernVideoRef = useRef(null);
  const ancientVideoRef = useRef(null);
  const frozenRef = useRef(false);
  const ancientReady = useMediaProbe(historicImg);
  const modernPosterReady = usePosterProbe(modernPosterUrl);
  const ancientPosterReady = usePosterProbe(ancientPosterUrl);
  const [videosFrozen, setVideosFrozen] = useState(false);
  const modernIsVideo = isVideoUrl(modernImg);
  const ancientIsVideo = isVideoUrl(historicImg);
  const resolvedFreezeAt = resolveSliderFreezeAtSec(freezeAtSec);

  const useModernPoster = videosFrozen && modernPosterUrl && modernPosterReady;
  const useAncientPoster = videosFrozen && ancientPosterUrl && ancientPosterReady;

  useEffect(() => {
    if (tiltEnabled) recalibrate();
  }, [tiltEnabled, historicImg, recalibrate]);

  useEffect(() => {
    frozenRef.current = false;
    setVideosFrozen(false);
  }, [modernImg, historicImg, resolvedFreezeAt]);

  const freezeAtTimestamp = useCallback((seconds) => {
    if (frozenRef.current) return;

    const modern = modernVideoRef.current;
    const ancient = ancientVideoRef.current;
    const target = Math.max(seconds, 0);

    if (modern) {
      modern.pause();
      if (Number.isFinite(modern.duration)) {
        modern.currentTime = Math.min(target, Math.max(modern.duration - 0.04, 0));
      } else {
        modern.currentTime = target;
      }
    }

    if (ancient) {
      ancient.pause();
      if (Number.isFinite(ancient.duration)) {
        ancient.currentTime = Math.min(target, Math.max(ancient.duration - 0.04, 0));
      } else {
        ancient.currentTime = target;
      }
    }

    frozenRef.current = true;
    setVideosFrozen(true);
  }, []);

  const freezeBothVideosAtEnd = useCallback(() => {
    const modern = modernVideoRef.current;
    const fallback =
      modern && Number.isFinite(modern.duration)
        ? Math.max(modern.duration - 0.04, 0)
        : 0;
    freezeAtTimestamp(resolvedFreezeAt ?? fallback);
  }, [freezeAtTimestamp, resolvedFreezeAt]);

  const replayVideos = useCallback(() => {
    const modern = modernVideoRef.current;
    const ancient = ancientVideoRef.current;

    frozenRef.current = false;
    setVideosFrozen(false);

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
    if (!modernIsVideo || !ancientReady || videosFrozen) return undefined;

    const modernVideo = modernVideoRef.current;
    const ancientVideo = ancientVideoRef.current;
    if (!modernVideo) return undefined;

    const onTimeUpdate = () => {
      if (frozenRef.current) return;

      if (ancientVideo && ancientIsVideo) {
        if (Math.abs(ancientVideo.currentTime - modernVideo.currentTime) > 0.2) {
          ancientVideo.currentTime = modernVideo.currentTime;
        }
      }

      if (resolvedFreezeAt != null && modernVideo.currentTime >= resolvedFreezeAt) {
        freezeAtTimestamp(resolvedFreezeAt);
      }
    };

    modernVideo.addEventListener('timeupdate', onTimeUpdate);
    return () => modernVideo.removeEventListener('timeupdate', onTimeUpdate);
  }, [
    modernIsVideo,
    ancientIsVideo,
    ancientReady,
    videosFrozen,
    modernImg,
    historicImg,
    resolvedFreezeAt,
    freezeAtTimestamp,
  ]);

  const depthBoost = depthMap ? 1.1 : 1;
  const offsetX = clamp(x * 1.8 * depthBoost, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const offsetY = clamp(y * 1.8 * depthBoost, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const rotateY = clamp(x * 0.55 * depthBoost, -6, 6);
  const rotateX = clamp(-y * 0.4 * depthBoost, -5, 5);

  const parallaxTransform =
    tiltEnabled && !videosFrozen
      ? `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${offsetX}px, ${offsetY}px, 0)`
      : undefined;

  const modernLayer = (
    <div className="relative flex h-full w-full items-center justify-center bg-stone-950">
      {useModernPoster ? (
        <FrozenPoster src={modernPosterUrl} alt="Modern Colosseum" />
      ) : null}
      {modernIsVideo ? (
        <CompareMedia
          src={modernImg}
          alt="Modern Colosseum"
          videoRef={modernVideoRef}
          onEnded={resolvedFreezeAt == null ? freezeBothVideosAtEnd : undefined}
          hidden={useModernPoster}
        />
      ) : (
        <CompareMedia src={modernImg} alt="Modern Colosseum" />
      )}
    </div>
  );

  const ancientLayer = ancientReady ? (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-stone-950"
      style={{ perspective: '900px' }}
    >
      <div
        className={
          parallaxTransform && !useAncientPoster
            ? 'absolute flex h-[112%] w-[112%] items-center justify-center'
            : 'flex h-full w-full items-center justify-center'
        }
        style={
          parallaxTransform && !useAncientPoster
            ? {
                left: '-6%',
                top: '-6%',
                transform: parallaxTransform,
                transition: 'transform 0.1s ease-out',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }
            : undefined
        }
      >
        {useAncientPoster ? (
          <FrozenPoster
            src={ancientPosterUrl}
            alt="Ancient Colosseum reconstruction"
            parallaxStyle={undefined}
          />
        ) : null}
        {ancientIsVideo ? (
          <CompareMedia
            src={historicImg}
            alt="Ancient Colosseum reconstruction"
            parallaxStyle={parallaxTransform && !useAncientPoster ? mediaFitStyle : undefined}
            videoRef={ancientVideoRef}
            onEnded={
              resolvedFreezeAt == null && !modernIsVideo ? freezeBothVideosAtEnd : undefined
            }
            hidden={useAncientPoster}
          />
        ) : (
          <CompareMedia
            src={historicImg}
            alt="Ancient Colosseum reconstruction"
            parallaxStyle={parallaxTransform ? mediaFitStyle : undefined}
          />
        )}
      </div>
    </div>
  ) : (
    <AncientPlaceholder />
  );

  const usingVideo = modernIsVideo || ancientIsVideo;

  return (
    <div className="w-full overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <div className="aspect-video w-full min-h-[min(52vh,22rem)] max-h-[min(62vh,36rem)]">
        <ReactCompareSlider itemOne={modernLayer} itemTwo={ancientLayer} />
      </div>
      <p className="bg-stone-900 px-3 py-2 text-center text-xs leading-relaxed text-stone-400">
        {!ancientReady ? (
          'Modern view is playing — add the matched ancient video to complete the portal.'
        ) : videosFrozen ? (
          <>
            Frozen on the hero frame — drag to compare eras.
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
          resolvedFreezeAt != null
            ? `Playing to ${resolvedFreezeAt}s — then freezes on the full Colosseum view.`
            : 'Videos play once — drag the handle to compare, then they freeze.'
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
