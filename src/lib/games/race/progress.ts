import type { FactStat } from './engine';

// Cette clé est conservée pour retrouver les statistiques déjà enregistrées.
const STORAGE_KEY = 'orbis:math-racer:fact-stats:v1';

function studentStorageKey(): string {
  const studentName = new URLSearchParams(window.location.search).get('eleve')?.trim().toLocaleLowerCase();
  const studentScope = studentName
    ? studentName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_-]/g, '_')
    : 'local';
  return `${STORAGE_KEY}:${studentScope || 'local'}`;
}

export function loadFactStats(): Record<string, FactStat> {
  try {
    const raw = localStorage.getItem(studentStorageKey());
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, FactStat>
      : {};
  } catch {
    return {};
  }
}

export function saveFactStats(stats: Record<string, FactStat>): void {
  try {
    localStorage.setItem(studentStorageKey(), JSON.stringify(stats));
  } catch (error) {
    console.warn('Le suivi local ne peut pas être enregistré :', error);
  }
}
