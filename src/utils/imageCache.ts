// VIP Ads - High Performance Static Image Cache Engine
// Implements persistent CacheStorage & In-Memory ObjectURL caching
// Prevents network re-fetching on long-polling cycles and eliminates black screens & memory leaks

const CACHE_NAME = 'vipads-static-images-v1';
const inMemoryBlobCache = new Map<string, string>();
const pendingFetches = new Map<string, Promise<string>>();

export const imageCache = {
  // Check if CacheStorage is supported in current environment
  isCacheSupported(): boolean {
    return typeof window !== 'undefined' && 'caches' in window;
  },

  // Get image from in-memory cache or CacheStorage
  async getOrFetchImage(url: string): Promise<string> {
    if (!url || typeof window === 'undefined') return url;

    // Fast path: In-memory blob already created
    if (inMemoryBlobCache.has(url)) {
      return inMemoryBlobCache.get(url)!;
    }

    // Fast path: Fetch already in progress
    if (pendingFetches.has(url)) {
      return pendingFetches.get(url)!;
    }

    const fetchPromise = (async () => {
      try {
        if (imageCache.isCacheSupported()) {
          const cache = await window.caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(url);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            inMemoryBlobCache.set(url, objectUrl);
            return objectUrl;
          }

          // Fetch with no-cors or standard fetch
          const networkResponse = await fetch(url, {
            mode: 'cors',
            credentials: 'omit',
            cache: 'force-cache',
          });

          if (networkResponse.ok) {
            // Clone into CacheStorage
            await cache.put(url, networkResponse.clone());
            const blob = await networkResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            inMemoryBlobCache.set(url, objectUrl);
            return objectUrl;
          }
        }
      } catch (e) {
        // Fallback gracefully to direct URL if cross-origin or storage fails
      }

      // If caching failed or cross-origin restricted, return original url
      return url;
    })();

    pendingFetches.set(url, fetchPromise);
    const result = await fetchPromise;
    pendingFetches.delete(url);
    return result;
  },

  // Pre-cache list of static images in the background without blocking UI
  preloadStaticImages(urls: string[]): void {
    if (typeof window === 'undefined') return;

    const runPreload = () => {
      urls.forEach((url, idx) => {
        if (!url || inMemoryBlobCache.has(url)) return;
        // Stagger requests slightly to keep CPU at 0%
        setTimeout(() => {
          imageCache.getOrFetchImage(url).catch(() => {});
        }, idx * 100);
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(runPreload, { timeout: 2000 });
    } else {
      setTimeout(runPreload, 500);
    }
  },

  // Clean memory leaks when user navigates away or closes tab
  clearMemoryCache(): void {
    inMemoryBlobCache.forEach((objectUrl) => {
      if (objectUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }
    });
    inMemoryBlobCache.clear();
    pendingFetches.clear();
  },
};
