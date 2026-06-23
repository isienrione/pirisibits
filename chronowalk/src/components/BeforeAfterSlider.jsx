import React, { useEffect, useRef, useState } from 'react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_SHIFT_PX = 30;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

export const isVideoUrl = (url) => Boolean(url && VIDEO_EXT.test(url));

const mediaStyle = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

const CompareMedia = ({ src, alt, parallaxStyle, videoRef, onReady, onError }) => {
  if (isVideoUrl(src)) {
    return (
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        aria-label={alt}
        style={{ ...mediaStyle, ...parallaxStyle }}
        onLoadedData={onReady}
        onError={onError}
      />
    );
  }

  if (parallaxStyle) {
    return (
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        style={{ ...mediaStyle, ...parallaxStyle }}
        onLoad={onReady}
        onError={onError}
      />
    );
  }

  return (
    <ReactCompareSliderImage
      src={src}
      alt={alt}
      style={mediaStyle}
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
    <p className="mt-3 font-mono text-[10px] text-amber-200/80">
      ancient-reconstruction.mp4
    </p>
    <p className="mt-1 font-mono text-[10px] text-stone-500">or ancient-reconstruction.jpg</p>
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

const BeforeAfterSlider = ({ modernImg, historicImg, depthMap, tiltEnabled = false }) => {
  const { x, y, isActive, recalibrate } = useDeviceTilt(tiltEnabled);
  const modernVideoRef = useRef(null);
  const ancientVideoRef = useRef(null);
  const ancientReady = useMediaProbe(historicImg);
  const modernIsVideo = isVideoUrl(modernImg);
  const ancientIsVideo = isVideoUrl(historicImg);

  useEffect(() => {
    if (tiltEnabled) recalibrate();
  }, [tiltEnabled, historicImg, recalibrate]);

  useEffect(() => {
    if (!modernIsVideo || !ancientIsVideo || !ancientReady) return undefined;

    const modernVideo = modernVideoRef.current;
    const ancientVideo = ancientVideoRef.current;
    if (!modernVideo || !ancientVideo) return undefined;

    const syncAncientToModern = () => {
      if (Math.abs(ancientVideo.currentTime - modernVideo.currentTime) > 0.25) {
        ancientVideo.currentTime = modernVideo.currentTime;
      }
    };

    modernVideo.addEventListener('timeupdate', syncAncientToModern);
    return () => modernVideo.removeEventListener('timeupdate', syncAncientToModern);
  }, [modernIsVideo, ancientIsVideo, ancientReady, modernImg, historicImg]);

  const depthBoost = depthMap ? 1.15 : 1;
  const offsetX = clamp(x * 2.1 * depthBoost, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const offsetY = clamp(y * 2.1 * depthBoost, -MAX_SHIFT_PX, MAX_SHIFT_PX);
  const rotateY = clamp(x * 0.75 * depthBoost, -9, 9);
  const rotateX = clamp(-y * 0.55 * depthBoost, -7, 7);

  const parallaxTransform = tiltEnabled
    ? `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${offsetX}px, ${offsetY}px, 0) scale(1.06)`
    : undefined;

  const modernLayer = (
    <div className="h-full w-full overflow-hidden bg-stone-900">
      <CompareMedia
        src={modernImg}
        alt="Modern Colosseum"
        videoRef={modernVideoRef}
      />
    </div>
  );

  const ancientLayer = ancientReady ? (
    <div
      className="relative h-full w-full overflow-hidden bg-stone-900"
      style={{ perspective: '900px' }}
    >
      <div
        className={parallaxTransform ? 'absolute h-[132%] w-[132%] -left-[16%] -top-[16%]' : 'h-full w-full'}
        style={
          parallaxTransform
            ? {
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
          parallaxStyle={parallaxTransform ? mediaStyle : undefined}
          videoRef={ancientVideoRef}
        />
      </div>
    </div>
  ) : (
    <AncientPlaceholder />
  );

  const usingVideo = modernIsVideo || ancientIsVideo;

  return (
    <div className="w-full overflow-hidden rounded-xl border-4 border-white shadow-lg">
      <div className="h-80 w-full">
        <ReactCompareSlider itemOne={modernLayer} itemTwo={ancientLayer} />
      </div>
      <p className="bg-stone-900 px-3 py-2 text-center text-xs leading-relaxed text-stone-400">
        {!ancientReady ? (
          'Modern view is playing — add the matched ancient video or image to complete the portal.'
        ) : usingVideo && tiltEnabled && isActive ? (
          <>
            Matched video takes — tilt gently on the ancient side for depth.
            <button
              type="button"
              onClick={recalibrate}
              className="ml-1 text-amber-400 underline underline-offset-2"
            >
              Reset center
            </button>
          </>
        ) : usingVideo ? (
          'Drag to compare the same viewpoint across two eras (video).'
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
