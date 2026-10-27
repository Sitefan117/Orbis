import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Mock only SvelteKit's browser constant; exercise the real helper implementation.
const source = readFileSync(new URL('../src/lib/orbis/identity/local-student.ts', import.meta.url), 'utf8');
let moduleNumber = 0;
async function loadHelper(browser = true) {
  const code = ts.transpileModule(source.replace("import { browser } from '$app/environment';", `const browser = ${browser};`), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}#${moduleNumber++}`);
}

const entries = new Map<string, string>([['nomEleve', 'Léa']]);
const blocked = { access: false, read: false, write: false, remove: false };
const storage = {
  getItem(key: string) { if (blocked.read) throw new Error('blocked read'); return entries.get(key) ?? null; },
  setItem(key: string, value: string) { if (blocked.write) throw new Error('blocked write'); entries.set(key, value); },
  removeItem(key: string) { if (blocked.remove) throw new Error('blocked remove'); entries.delete(key); }
};
const location = { search: '' };
Object.defineProperty(globalThis, 'window', { configurable: true, value: {
  location,
  get sessionStorage() { if (blocked.access) throw new Error('blocked storage'); return storage; }
} });

const helper = await loadHelper();
assert.equal(helper.getStudentName(''), 'Léa');
location.search = '?eleve=No%C3%A9';
assert.equal(helper.getStudentName(''), 'Noé');
assert.equal(entries.get('nomEleve'), 'Noé');
location.search = '';
blocked.remove = true;
assert.doesNotThrow(() => helper.clearStudentName());
assert.equal(helper.getStudentName(''), '', 'A failed removal must not resurrect the old profile');

blocked.access = true;
const inaccessible = await loadHelper();
assert.equal(inaccessible.getStudentName(''), '');
assert.doesNotThrow(() => inaccessible.storeStudentName(' Sami '));
assert.equal(inaccessible.getStudentName(''), 'Sami');
inaccessible.clearStudentName();
assert.equal(inaccessible.getStudentName(''), '');

blocked.access = false;
blocked.read = true;
blocked.write = true;
const denied = await loadHelper();
assert.equal(denied.getStudentName('Voyageur'), 'Voyageur');
denied.storeStudentName('Ana');
assert.equal(denied.getStudentName(''), 'Ana');
denied.clearStudentName();
assert.equal(denied.getStudentName(''), '');

Reflect.deleteProperty(globalThis, 'window');
const server = await loadHelper(false);
assert.equal(server.getStudentName('Serveur'), 'Serveur');
assert.doesNotThrow(() => server.storeStudentName('Sami'));
assert.doesNotThrow(() => server.clearStudentName());
console.log('Orbis local profile: URL, session storage, denied storage, clear and SSR fallbacks verified.');
