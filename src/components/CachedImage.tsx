import React, { useState, useEffect, useRef } from 'react';
import { imageCache } from '../utils/imageCache';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  placeholderClassName?: string;
  fallbackSrc?: string;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt = '',
  className = '',
  placeholderClassName = '',
  fallbackSrc,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    setIsLoaded(false);
    setHasError(false);

    if (!src) return;

    let isSubscribed = true;

    // Retrieve cached URL or direct URL
    imageCache.getOrFetchImage(src).then((resolvedUrl) => {
      if (isSubscribed && mountedRef.current) {
        setCurrentSrc(resolvedUrl || src);
      }
    }).catch(() => {
      if (isSubscribed && mountedRef.current) {
        setCurrentSrc(src);
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [src]);

  const handleLoad = () => {
    if (mountedRef.current) {
      setIsLoaded(true);
    }
  };

  const handleError = () => {
    if (mountedRef.current) {
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      } else {
        setHasError(true);
      }
      setIsLoaded(true);
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Sleek dark shimmer placeholder to eliminate black screen during initial decode */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 animate-pulse pointer-events-none z-10 ${placeholderClassName}`}
        />
      )}

      <img
        src={hasError && fallbackSrc ? fallbackSrc : currentSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
