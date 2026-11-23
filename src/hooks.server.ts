import { redirect, type Handle } from '@sveltejs/kit';

const legacyRoutes: Record<string, string> = {
  '/index.html': '/',
  '/livrets.html': '/livrets',
  '/geometrie.html': '/geometrie',
  '/calculs.html': '/calculs',
  '/numeria.html': '/numeria',
  '/pcp.html': '/pcp'
};

export const handle: Handle = async ({ event, resolve }) => {
  const target = legacyRoutes[event.url.pathname];
  if (target) {
    const destination = new URL(target, event.url);
    destination.search = event.url.search;
    throw redirect(308, destination.toString());
  }

  const response = await resolve(event);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
  }
  return response;
};
