/**
 * Vercel Edge Middleware
 * Intercepts requests at Vercel's Edge CDN level before serving static assets.
 * Restricts direct public access to certificate PNGs and data txt files.
 */

const SALT = 'tsec_flutter_workshop_2026_secure_salt';

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Intercept requests to sensitive directories
  if (
    path.startsWith('/assets/certificates/student/') ||
    path.startsWith('/data/')
  ) {
    const secret = url.searchParams.get('secret');

    // Reject access if the secret query parameter is missing or mismatching
    if (secret !== SALT) {
      return new Response('Forbidden', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
      });
    }
  }

  // Returning nothing allows the request to proceed as normal
}
