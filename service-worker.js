/**
 * Service Worker for Certificate Portal
 * Intercepts all certificate requests and enforces security validations
 * 
 * This layer provides:
 * 1. Request validation before sending to server
 * 2. Cache control (prevents browser caching of sensitive files)
 * 3. Audit logging of certificate access
 * 4. Prevention of direct file access circumvention
 */

const CACHE_NAME = 'certificate-portal-v1';
const CERTIFICATE_API = '/api/verify-certificate';

// Don't cache sensitive certificate files
const NO_CACHE_PATTERNS = [
  /^.*\/assets\/certificates\//,
  /^.*\/data\//,
  /^.*\/assets\/FLUTTER ELIGIBLE CANDIDATES\.txt$/,
  /^.*\/assets\/candidateswhocompletedtheassignment\.txt$/,
  /^.*\/api\/verify-certificate/,
  /^.*\/api\/certificate-preview/,
  /^.*\/api\/certificate-lookup/,
  /^.*\/api\/certificate-status/,
  /^.*\/api\/certificate-names/
];

function shouldNotCache(url) {
  return NO_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Log access attempts for security audit
function logAccess(request, status) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] SW: ${request.method} ${request.url} - ${status}`;
  console.log(message);
  
  // Send to server for audit trail via standard fetch
  fetch('/api/audit-log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timestamp,
      method: request.method,
      url: request.url,
      status,
      userAgent: navigator.userAgent
    }),
    keepalive: true
  }).catch(err => {
    console.warn('Failed to send audit log from SW:', err);
  });
}

// Intercept fetch requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Block direct access to certificate files and eligibility data
  if (
    url.pathname.includes('/assets/certificates/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname.endsWith('/assets/FLUTTER ELIGIBLE CANDIDATES.txt') ||
    url.pathname.endsWith('/assets/candidateswhocompletedtheassignment.txt')
  ) {
    logAccess(request, 'BLOCKED - direct_file_access');
    event.respondWith(
      new Response('Certificate access requires verification', {
        status: 403,
        statusText: 'Forbidden',
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        }
      })
    );
    return;
  }

  // For certificate API requests, validate inputs and prevent caching
  if (
    url.pathname === CERTIFICATE_API ||
    url.pathname.includes('verify-certificate') ||
    url.pathname.includes('certificate-preview') ||
    url.pathname.includes('certificate-lookup') ||
    url.pathname.includes('certificate-status') ||
    url.pathname.includes('certificate-names')
  ) {
    const params = new URL(request.url).searchParams;
    const name = params.get('name');
    const code = params.get('code');
    const query = params.get('q');
    let invalid = false;

    if (url.pathname.includes('certificate-names')) {
      invalid = !query || query.length < 2 || query.length > 100;
    } else if (url.pathname.includes('certificate-status')) {
      invalid = !name || name.length > 100;
    } else if (url.pathname.includes('certificate-lookup')) {
      invalid = !code || code.length > 50;
    } else if (url.pathname.includes('certificate-preview')) {
      invalid = !name || name.length > 100 || (code && code.length > 50);
    } else {
      invalid = !name || !code || name.length > 100 || code.length > 50;
    }

    if (invalid) {
      logAccess(request, 'BLOCKED - invalid_params');
      event.respondWith(
        new Response(JSON.stringify({ error: 'Invalid parameters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      return;
    }

    // Don't cache sensitive responses
    event.respondWith(
      fetch(request).then(response => {
        // Only cache successful non-certificate responses
        if (response.status === 200) {
          const clone = response.clone();
          const headers = new Headers(clone.headers);
          headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
          
          logAccess(request, 'ALLOWED - verified_download');
          
          return new Response(clone.body, {
            status: clone.status,
            statusText: clone.statusText,
            headers: headers
          });
        }
        
        logAccess(request, `DENIED - status_${response.status}`);
        return response;
      }).catch(error => {
        logAccess(request, 'ERROR - ' + error.message);
        throw error;
      })
    );
    return;
  }

  // Standard caching for other resources
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }
      return fetch(request).then(response => {
        if (!shouldNotCache(request.url) && response && response.status === 200) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      });
    })
  );
});

// Force immediate activation on install
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Clean up old caches and claim clients on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});
