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
  /^.*\/api\/verify-certificate/
];

function shouldNotCache(url) {
  return NO_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Log access attempts for security audit
function logAccess(request, status) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] SW: ${request.method} ${request.url} - ${status}`;
  console.log(message);
  
  // Send to server for audit trail
  navigator.sendBeacon('/api/audit-log', JSON.stringify({
    timestamp,
    method: request.method,
    url: request.url,
    status,
    userAgent: navigator.userAgent
  }));
}

// Intercept fetch requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Block direct access to certificate files
  if (url.pathname.includes('/assets/certificates/')) {
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
  if (url.pathname === CERTIFICATE_API || url.pathname.includes('verify-certificate')) {
    const params = new URL(request.url).searchParams;
    const name = params.get('name');
    const code = params.get('code');

    // Validate parameters exist and have reasonable length
    if (!name || !code || name.length > 100 || code.length > 50) {
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

// Clean up old caches on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
