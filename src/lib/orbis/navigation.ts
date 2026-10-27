/** Catalogue URLs also work on the static GitHub Pages deployment. */
export type CatalogView = 'jeux' | 'cours';
type CatalogLocation = { href: string; scrollY: number };

export function matchesCatalogLocation(url: URL, href: string): boolean {
  const saved = new URL(href, url);
  const currentParams = new URLSearchParams(url.search);
  const savedParams = new URLSearchParams(saved.search);
  // The student may be carried back from a direct game link into a previously anonymous catalogue URL.
  currentParams.delete('eleve');
  savedParams.delete('eleve');
  currentParams.sort();
  savedParams.sort();
  return url.origin === saved.origin && url.pathname === saved.pathname && `${currentParams}` === `${savedParams}`;
}

export function catalogHref(base: string, view: CatalogView, studentName = ''): string {
  const params = new URLSearchParams({ vue: view });
  if (studentName) params.set('eleve', studentName);
  return `${base}/?${params}`;
}

export function rememberCatalogLocation(url: URL, scrollY: number): void {
  const view = url.searchParams.get('vue');
  if (typeof window === 'undefined' || (view !== 'jeux' && view !== 'cours')) return;
  try {
    window.sessionStorage.setItem(`orbis-catalog-${view}`, JSON.stringify({
      href: `${url.pathname}${url.search}`, scrollY: Math.max(0, scrollY)
    }));
  } catch { /* Navigation remains usable when browser storage is unavailable. */ }
}

export function savedCatalogLocation(base: string, view: CatalogView): CatalogLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(`orbis-catalog-${view}`) || 'null');
    if (!saved || typeof saved.href !== 'string') return null;
    const url = new URL(saved.href, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== `${base}/` || url.searchParams.get('vue') !== view) return null;
    return { href: `${url.pathname}${url.search}`, scrollY: Number.isFinite(saved.scrollY) ? Math.max(0, saved.scrollY) : 0 };
  } catch { return null; }
}

export function catalogReturnHref(base: string, view: CatalogView = 'jeux', studentName = ''): string {
  const href = savedCatalogLocation(base, view)?.href || catalogHref(base, view);
  const name = studentName || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('eleve') || '' : '');
  if (!name) return href;
  const [pathname, search = ''] = href.split('?');
  const params = new URLSearchParams(search);
  params.set('eleve', name);
  return `${pathname}?${params}`;
}

/** Svelte action: update only after hydration, keeping native links and their page styles. */
export function restoreCatalogReturn(node: HTMLAnchorElement, base: string): void {
  const initial = new URL(node.href);
  const view = initial.searchParams.get('vue') === 'cours' ? 'cours' : 'jeux';
  node.href = catalogReturnHref(base, view, initial.searchParams.get('eleve') || '');
  // An explicit exit replaces the game entry; Previous never bounces back into it.
  node.setAttribute('data-sveltekit-replacestate', '');
}
