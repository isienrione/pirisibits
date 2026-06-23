import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

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

const CompareMedia = ({
  src,
  alt,
  parallaxStyle,
  videoRef,
  onReady,
  onError,
  onEnded,
}) => {
  const style = { ...mediaFitStyle, ...parallaxStyle };

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

const AncientPlaceholder = () => (
  <div className="flex h-full min-h-[12rem] flex-col items-center justify-center bg-gradient-to-b from-stone-800 to-stone-900 p-5 text-center">
    <p className="text-sm font-semibold text-amber-300">Ancient reconstruction — coming next</p>
    <p className="mt-2 max-w-xs text-xs leading-relaxed text-stone-400">
      Export a matched Midjourney video or still from the{' '}
      <strong className="text-stone-300">same camera angle</strong> as the modern take.
    </p>
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

const freezeVideoOnLastFrame = (video) => {
  if (!video || !Number.isFinite(video.duration)) return;
  video.pause();
  video.currentTime = Math.max(video.duration - 0.04, 0);
};

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap, tiltEnabled = false }) => {
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);
  const modernVideoRef = useRef(null);
  const ancientVideoRef = useRef(null);
  const ancientReady = useMediaProbe(historicImg);
  const [videosFrozen, setVideosFrozen] = useState(false);
  const modernIsVideo = isVideoUrl(modernImg);
  const ancientIsVideo = isVideoUrl(historicImg);

  useEffect(() => {
    if (tiltEnabled) recalibrate();
  }, [tiltEnabled, historicImg, recalibrate]);

  useEffect(() => {
    setVideosFrozen(false);
  }, [modernImg, historicImg]);

  const freezeBothVideos = useCallback(() => {
    freezeVideoOnLastFrame(modernVideoRef.current);
    freezeVideoOnLastFrame(ancientVideoRef.current);
    setVideosFrozen(true);
  }, []);

  const replayVideos = useCallback(() => {
    const modern = modernVideoRef.current;
    const ancient = ancientVideoRef.current;

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
    if (!modernIsVideo || !ancientIsVideo || !ancientReady || videosFrozen) return undefined;

    const modernVideo = modernVideoRef.current;
    const ancientVideo = ancientVideoRef.current;
    if (!modernVideo || !ancientVideo) return undefined;

    const syncAncientToModern = () => {
      if (videosFrozen) return;
      if (Math.abs(ancientVideo.currentTime - modernVideo.currentTime) > 0.2) {
        ancientVideo.currentTime = modernVideo.currentTime;
      }
    };

    modernVideo.addEventListener('timeupdate', syncAncientToModern);
    return () => modernVideo.removeEventListener('timeupdate', syncAncientToModern);
  }, [modernIsVideo, ancientIsVideo, ancientReady, videosFrozen, modernImg, historicImg]);

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
    <div className="flex h-full w-full items-center justify-center bg-stone-950">
      <CompareMedia
        src={modernImg}
        alt="Modern Colosseum"
        videoRef={modernVideoRef}
        onEnded={modernIsVideo ? freezeBothVideos : undefined}
      />
    </div>
  );

  const ancientLayer = ancientReady ? (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-stone-950"
      style={{ perspective: '900px' }}
    >
      <div
        className={
          parallaxTransform
            ? 'absolute flex h-[112%] w-[112%] items-center justify-center'
            : 'flex h-full w-full items-center justify-center'
        }
        style={
          parallaxTransform
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
        <CompareMedia
          src={historicImg}
          alt="Ancient Colosseum reconstruction"
          parallaxStyle={parallaxTransform ? mediaFitStyle : undefined}
          videoRef={ancientVideoRef}
          onEnded={ancientIsVideo && !modernIsVideo ? freezeBothVideos : undefined}
        />
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
            Frozen on the final frame — drag to compare eras.
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
        ) : usingVideo && tiltEnabled && isActive ? (
          <>
            Videos play once, then freeze. Tilt gently on the ancient side.
            <button
              type="button"
              onClick={recalibrate}
              className="ml-1 text-amber-400 underline underline-offset-2"
            >
              Reset center
            </button>
          </>
        ) : usingVideo ? (
          'Videos play once — drag the handle to compare, then they freeze on the last frame.'
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
