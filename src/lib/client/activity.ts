import { browser } from '$app/environment';
import { base } from '$app/paths';
import type { WorldId } from '$lib/worlds';

const STUDENT_STORAGE_KEY = 'nomEleve';

export type ActivityPayload = {
  studentName: string;
  world: WorldId;
  mission: string;
  score: number;
  total: number;
  scoreBasis?: 'last' | 'best';
  errorCount?: number;
  errorFamilies?: unknown;
  metadata?: unknown;
  missionId?: string;
};

export function getStudentName(fallback = 'Explorateur'): string {
  if (!browser) return fallback;

  const fromUrl = new URLSearchParams(window.location.search).get('eleve');
  const fromStorage = sessionStorage.getItem(STUDENT_STORAGE_KEY);
  const studentName = (fromUrl || fromStorage || fallback).trim();

  if (studentName) sessionStorage.setItem(STUDENT_STORAGE_KEY, studentName);
  return studentName || fallback;
}

export function storeStudentName(studentName: string): void {
  if (!browser) return;
  sessionStorage.setItem(STUDENT_STORAGE_KEY, studentName.trim());
}

export function clearStudentName(): void {
  if (!browser) return;
  sessionStorage.removeItem(STUDENT_STORAGE_KEY);
}

export async function submitActivityResult(payload: ActivityPayload): Promise<{ ok: boolean; message: string }> {
  const response = await fetch(`${base}/api/activity-results`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    return { ok: false, message: message || 'Transmission impossible.' };
  }

  return { ok: true, message: 'Rapport transmis au tableau enseignant.' };
}
