import type { ActivityPayload, ActivitySubmission } from './contract';

/**
 * Envoie un bilan au backend actuellement disponible en développement local.
 * GitHub Pages ne publie pas cette route : l'échec réseau est retourné à
 * l'activité pour qu'il ne fasse pas planter le jeu.
 */
export async function submitActivityResult(payload: ActivityPayload): Promise<ActivitySubmission> {
  try {
    const response = await fetch('/api/activity-results', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        reason: 'rejected',
        message: message || 'Le rapport n’a pas été accepté.'
      };
    }

    return { ok: true, message: 'Rapport transmis au tableau enseignant.' };
  } catch {
    return {
      ok: false,
      reason: 'offline',
      message: 'Le rapport ne peut pas être transmis pour le moment.'
    };
  }
}

export type { ActivityPayload, ActivitySubmission } from './contract';
