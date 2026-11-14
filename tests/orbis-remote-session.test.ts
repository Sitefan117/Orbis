import assert from 'node:assert/strict';

class MemoryStorage implements Storage {
	#values = new Map<string, string>();

	get length(): number {
		return this.#values.size;
	}

	clear(): void {
		this.#values.clear();
	}

	getItem(key: string): string | null {
		return this.#values.get(key) ?? null;
	}

	key(index: number): string | null {
		return [...this.#values.keys()][index] ?? null;
	}

	removeItem(key: string): void {
		this.#values.delete(key);
	}

	setItem(key: string, value: string): void {
		this.#values.set(key, value);
	}
}

const local = new MemoryStorage();
const session = new MemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { value: local, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: session, configurable: true });

const { clearRemoteSession, getRemoteSession, storeRemoteSession } = await import(
	'../src/lib/orbis/persistence/remote-session'
);

storeRemoteSession({ accessToken: 'temporary', userId: 'student-1' });
assert.equal(local.length, 0, 'Une session temporaire ne doit pas être écrite dans localStorage.');
assert.equal(session.length, 1, 'Une session temporaire doit rester limitée à la session du navigateur.');
assert.equal(getRemoteSession()?.accessToken, 'temporary');

storeRemoteSession({ accessToken: 'persistent', userId: 'teacher-1', persistent: true });
assert.equal(session.length, 0, 'Activer la persistance doit retirer l’ancienne session temporaire.');
assert.equal(local.length, 1, 'Une session persistante doit être écrite dans localStorage.');
assert.equal(getRemoteSession()?.persistent, true);

clearRemoteSession();
assert.equal(local.length, 0);
assert.equal(session.length, 0);
assert.equal(getRemoteSession(), null);

console.log('✓ Sessions Orbis : temporaire par défaut, persistante sur choix explicite, déconnexion complète');
