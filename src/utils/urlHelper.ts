/**
 * URL Referral Sanitizer & Session Shield
 * Cleans referral query parameters (?r=, ?ref=, ?referral=, ?invite=, ?code=)
 * and hash fragments immediately and silently to eliminate browser refresh loop holes.
 */

export function purgeReferralQueriesFromUrl(): void {
  if (typeof window === 'undefined') return;

  try {
    let modified = false;
    const url = new URL(window.location.href);

    // 1. Remove all referral search query parameters
    const refParamKeys = ['r', 'ref', 'referral', 'invite', 'code', 'inviter'];
    for (const key of refParamKeys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        modified = true;
      }
    }

    // 2. Clean hash if it contains referral information
    if (url.hash && (url.hash.includes('r=') || url.hash.includes('ref=') || url.hash.includes('/r/'))) {
      url.hash = '';
      modified = true;
    }

    // 3. Clean pathname if it matches /r/CODE
    if (url.pathname.includes('/r/')) {
      url.pathname = '/';
      modified = true;
    }

    // Build the clean canonical URL
    const searchString = url.searchParams.toString();
    const cleanUrl = (searchString ? `${url.pathname}?${searchString}` : url.pathname) || '/';

    // Apply replaceState silently without page reload
    if (window.history && window.history.replaceState) {
      window.history.replaceState({ cleanSession: true }, document.title, cleanUrl);
    }
  } catch (err) {
    // Fallback: minimal clean replace
    try {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({ cleanSession: true }, document.title, window.location.pathname || '/');
      }
    } catch {}
  }
}

export function hasReferralParamInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hasQuery = urlParams.has('r') || urlParams.has('ref') || urlParams.has('referral') || urlParams.has('invite') || urlParams.has('code');
    const hash = window.location.hash || '';
    const hasHash = hash.includes('r=') || hash.includes('ref=') || hash.includes('/r/');
    const hasPath = window.location.pathname.includes('/r/');
    return Boolean(hasQuery || hasHash || hasPath);
  } catch {
    return false;
  }
}

export function getReferralCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('r') || urlParams.get('ref') || urlParams.get('referral') || urlParams.get('invite') || urlParams.get('code');
    if (code && code.trim()) return code.trim().toUpperCase();

    // Check hash e.g. #/r/885101 or #r=885101
    const hash = window.location.hash || '';
    if (hash.includes('r=')) {
      const parts = hash.split('r=');
      if (parts[1]) {
        const c = parts[1].split('&')[0].replace(/[^a-zA-Z0-9]/g, '');
        if (c) return c.toUpperCase();
      }
    }
    if (hash.includes('/r/')) {
      const parts = hash.split('/r/');
      if (parts[1]) {
        const c = parts[1].split('/')[0].split('?')[0].replace(/[^a-zA-Z0-9]/g, '');
        if (c) return c.toUpperCase();
      }
    }

    // Check pathname /r/885101
    if (window.location.pathname.includes('/r/')) {
      const parts = window.location.pathname.split('/r/');
      if (parts[1]) {
        const c = parts[1].split('/')[0].split('?')[0].replace(/[^a-zA-Z0-9]/g, '');
        if (c) return c.toUpperCase();
      }
    }
  } catch {}
  return null;
}
