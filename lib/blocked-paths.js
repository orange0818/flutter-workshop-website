/**
 * Paths that must never be served as static files.
 * Certificate images and eligibility data are only available through authenticated API routes.
 */

export const BLOCKED_STATIC_PATHS = [
  /^\/assets\/certificates(?:\/|$)/i,
  /^\/data(?:\/|$)/i,
  // Legacy paths kept blocked after moving sensitive data out of assets/
  /^\/assets\/FLUTTER ELIGIBLE CANDIDATES\.txt$/i,
  /^\/assets\/candidateswhocompletedtheassignment\.txt$/i,
];

function normalizeRequestPath(requestPath) {
  const decoded = decodeURIComponent(String(requestPath || ''));
  const normalized = decoded.replace(/\\/g, '/').replace(/\/+/g, '/');
  if (normalized.includes('..')) {
    return null;
  }
  return normalized;
}

export function isBlockedStaticPath(requestPath) {
  const path = normalizeRequestPath(requestPath);
  if (!path) return true;
  return BLOCKED_STATIC_PATHS.some((pattern) => pattern.test(path));
}
