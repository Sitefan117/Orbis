import { browser } from '$app/environment';

const STUDENT_STORAGE_KEY = 'nomEleve';
// Remains usable for this page session when the browser denies storage access.
let memoryStudentName: string | undefined;

/**
 * Portée locale temporaire par profil.
 * Un nom aide à séparer des sauvegardes sur un appareil partagé, mais ne prouve
 * pas l'identité de l'élève et ne remplace pas une connexion sécurisée.
 */
export function studentStorageScope(studentName: string): string {
  const normalized = studentName
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-CH')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'local';
}

export function getStudentName(fallback = 'Explorateur'): string {
  if (!browser) return fallback;

  const fromUrl = new URLSearchParams(window.location.search).get('eleve');
  let fromStorage = memoryStudentName;
  if (fromStorage === undefined) {
    try {
      fromStorage = window.sessionStorage.getItem(STUDENT_STORAGE_KEY) ?? undefined;
    } catch {
      // URL and in-memory names still work when storage is blocked.
    }
  }
  const studentName = (fromUrl || fromStorage || fallback).trim();

  if (studentName) storeStudentName(studentName);
  return studentName || fallback;
}

export function storeStudentName(studentName: string): void {
  if (!browser) return;
  memoryStudentName = studentName.trim();
  try {
    window.sessionStorage.setItem(STUDENT_STORAGE_KEY, memoryStudentName);
  } catch {
    // Keep the current profile in memory instead of blocking navigation.
  }
}

export function clearStudentName(): void {
  if (!browser) return;
  memoryStudentName = '';
  try {
    window.sessionStorage.removeItem(STUDENT_STORAGE_KEY);
  } catch {
    // The empty memory value prevents a stale name from reappearing.
  }
}
