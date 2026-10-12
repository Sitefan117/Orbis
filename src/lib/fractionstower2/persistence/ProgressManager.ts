/**
 * [Persistance] ProgressManager.ts
 * Gère la sauvegarde de la progression des élèves (étoiles, scores par étage, étages déverrouillés)
 * dans le localStorage du navigateur.
 */

export interface FloorProgress {
    floorId: string;
    unlocked: boolean;
    stars: number; // de 0 à 3 étoiles
    bestScore: number;
    completed: boolean;
}

export interface GameProgress {
    currentFloor: string;
    floors: Record<string, FloorProgress>;
    bossUnlocked: {
        floor5: boolean;
        final: boolean;
    };
}

const STORAGE_KEY = 'fraction_tower_2_progress';

export class ProgressManager {
    /**
     * Récupère la progression globale de l'élève.
     * Si aucune sauvegarde n'existe, initialise la tour (Étage 1 déverrouillé par défaut).
     */
    public static getProgress(): GameProgress {
        if (typeof window === 'undefined') {
            return this.getDefaultProgress();
        }

        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                const defaultProgress = this.getDefaultProgress();
                this.saveProgress(defaultProgress);
                return defaultProgress;
            }
            return JSON.parse(data);
        } catch (e) {
            console.error("Erreur lors de la lecture de la progression :", e);
            return this.getDefaultProgress();
        }
    }

    /**
     * Sauvegarde l'état global de la progression.
     */
    public static saveProgress(progress: GameProgress): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (e) {
            console.error("Erreur lors de la sauvegarde de la progression :", e);
        }
    }

    /**
     * Enregistre le score d'un étage après une session réussie.
     * Calcule automatiquement les étoiles (1 à 3) et déverrouille l'étage suivant.
     */
    public static recordFloorCompletion(floorId: string, score: number, total: number = 10): void {
        const progress = this.getProgress();
        const percentage = score / total;

        // Calcul des étoiles selon le pourcentage de réussite
        let earnedStars = 1;
        if (percentage >= 0.8) earnedStars = 3;
        else if (percentage >= 0.5) earnedStars = 2;

        // Mise à jour de l'étage actuel
        if (!progress.floors[floorId]) {
            progress.floors[floorId] = { floorId, unlocked: true, stars: 0, bestScore: 0, completed: false };
        }

        const floorData = progress.floors[floorId];
        floorData.completed = true;
        floorData.stars = Math.max(floorData.stars, earnedStars);
        floorData.bestScore = Math.max(floorData.bestScore, score);

        // Déverrouillage automatique de l'étage suivant (ex: floor-1 -> floor-2)
        const floorNum = parseInt(floorId.replace('floor-', ''), 10);
        if (!isNaN(floorNum) && floorNum < 9) {
            const nextFloorId = `floor-${floorNum + 1}`;
            if (!progress.floors[nextFloorId]) {
                progress.floors[nextFloorId] = { floorId: nextFloorId, unlocked: true, stars: 0, bestScore: 0, completed: false };
            } else {
                progress.floors[nextFloorId].unlocked = true;
            }
        }

        // Déverrouillage des boss spécifiques
        if (floorNum === 5) {
            progress.bossUnlocked.floor5 = true;
        }
        if (floorNum === 8) {
            progress.bossUnlocked.final = true;
        }

        this.saveProgress(progress);
    }

    /**
     * Réinitialise totalement la progression (utile pour un nouveau joueur ou réinitialisation prof).
     */
    public static resetProgress(): GameProgress {
        const defaultProgress = this.getDefaultProgress();
        this.saveProgress(defaultProgress);
        return defaultProgress;
    }

    private static getDefaultProgress(): GameProgress {
        const floors: Record<string, FloorProgress> = {};
        
        // Seul l'étage 1 est ouvert au départ
        for (let i = 1; i <= 9; i++) {
            floors[`floor-${i}`] = {
                floorId: `floor-${i}`,
                unlocked: i === 1, // Étage 1 déverrouillé, les autres verrouillés
                stars: 0,
                bestScore: 0,
                completed: false
            };
        }

        return {
            currentFloor: 'floor-1',
            floors,
            bossUnlocked: {
                floor5: false,
                final: false
            }
        };
    }
}