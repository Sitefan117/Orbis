import { redirect, type Handle } from '@sveltejs/kit';

// Anciennes adresses encore susceptibles d’être utilisées dans des favoris.
const legacyRoutes: Record<string, string> = {
  '/index.html': '/',
  '/livrets.html': '/livrets',
  '/geometrie.html': '/geometrie',
  '/calculs.html': '/calculs',
  '/numeria.html': '/numeria',
  '/pcp.html': '/pcp'
};

export const handle: Handle = async ({ event, resolve }) => {
  // Conserve les paramètres d’URL pendant la redirection vers la route moderne.
  const target = legacyRoutes[event.url.pathname];
  if (target) {
    const destination = new URL(target, event.url);
    destination.search = event.url.search;
    throw redirect(308, destination.toString());
  }

  return resolve(event);
};
