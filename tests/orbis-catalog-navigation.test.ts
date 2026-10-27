import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogHref, catalogReturnHref, matchesCatalogLocation, rememberCatalogLocation, savedCatalogLocation } from '../src/lib/orbis/navigation';

const origin = 'https://example.test';
const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); }
};
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { location: { origin, search: '?eleve=L%C3%A9a' }, sessionStorage: storage }
});

for (const base of ['', '/ma-classeV3']) {
  values.clear();
  assert.equal(catalogHref(base, 'jeux', 'Léa & Sami'), `${base}/?vue=jeux&eleve=L%C3%A9a+%26+Sami`);
  assert.equal(catalogReturnHref(base), `${base}/?vue=jeux&eleve=L%C3%A9a`);
  const catalog = new URL(`${base}/?vue=jeux&matiere=FRAN%C3%87AIS&statut=available`, origin);
  rememberCatalogLocation(catalog, 640);
  assert.equal(savedCatalogLocation(base, 'jeux')?.scrollY, 640);
  assert.equal(new URL(catalogReturnHref(base), origin).searchParams.get('matiere'), 'FRANÇAIS');
  assert(matchesCatalogLocation(new URL(catalogReturnHref(base), origin), savedCatalogLocation(base, 'jeux')!.href));
  assert(!matchesCatalogLocation(new URL(`${base}/?vue=jeux&matiere=MATHS`, origin), savedCatalogLocation(base, 'jeux')!.href));
  rememberCatalogLocation(new URL(`${base}/?vue=cours&matiere=Math%C3%A9matiques&domaine=Fractions`, origin), 320);
  assert.equal(savedCatalogLocation(base, 'cours')?.scrollY, 320);
  assert.equal(savedCatalogLocation(base, 'jeux')?.scrollY, 640);
  for (const href of ['https://untrusted.test/?vue=jeux', `${base}/race?vue=jeux`, `${base}/?vue=cours`]) {
    values.set('orbis-catalog-jeux', JSON.stringify({ href, scrollY: 500 }));
    assert.equal(savedCatalogLocation(base, 'jeux'), null);
  }
  values.set('orbis-catalog-jeux', 'broken JSON');
  assert.equal(savedCatalogLocation(base, 'jeux'), null);
}
Object.defineProperty(globalThis, 'window', { configurable: true, value: {
  location: { origin, search: '' }, sessionStorage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }
} });
assert.equal(catalogReturnHref('/ma-classeV3'), '/ma-classeV3/?vue=jeux');
assert.doesNotThrow(() => rememberCatalogLocation(new URL('/?vue=jeux', origin), 10));
Reflect.deleteProperty(globalThis, 'window');
assert.equal(catalogReturnHref('/ma-classeV3'), '/ma-classeV3/?vue=jeux');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function checkDocuments(directory: string): number {
  let count = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) { count += checkDocuments(path); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = readFileSync(path, 'utf8');
    if (/http-equiv=["']refresh/i.test(html)) continue;
    const href = html.match(/<a[^>]*href="([^"]+)"[^>]*data-orbis-catalog-return/);
    assert(href, `Missing explicit return in ${path}`);
    assert.equal(new URL(href[1], `${origin}/ma-classeV3/${path.slice(resolve(root, 'static').length + 1)}`).pathname, '/ma-classeV3/');
    const script = html.match(/<script src="([^"]*catalog-return\.js)"/);
    assert(script, `Missing course return helper in ${path}`);
    assert.equal(resolve(dirname(path), script[1]), resolve(root, 'static/orbis/catalog-return.js'));
    count++;
  }
  return count;
}
assert.equal(checkDocuments(resolve(root, 'static')), 22);
console.log('Orbis catalogue navigation: URLs, filters, scroll snapshots, base path, storage fallback and 22 course returns verified.');
