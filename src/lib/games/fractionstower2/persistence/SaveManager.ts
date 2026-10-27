// -----------------------------------------------------------------------------
// GESTION DES SAUVEGARDES
// Permet l'exportation et l'importation de la progression de l'élève via des fichiers .fracsave
// -----------------------------------------------------------------------------

import { type PlayerState } from '$lib/games/fractionstower2/types/world';

export interface SaveData {
    version: string;
    studentId: string;
    player: PlayerState;
    defeatedBosses: string[];
    hasElevatorAccess: boolean;
    timestamp: number;
}

export class SaveManager {
    private static SAVE_VERSION = '1.0';

    /**
     * Exporte les données de jeu vers un fichier .fracsave (JSON)
     */
    static exportSave(studentId: string, player: PlayerState, defeatedBosses: Set<string>, hasElevatorAccess: boolean) {
        const data: SaveData = {
            version: this.SAVE_VERSION,
            studentId,
            player: { ...player },
            defeatedBosses: Array.from(defeatedBosses),
            hasElevatorAccess,
            timestamp: Date.now()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `save_${studentId}_${new Date().toISOString().slice(0,10)}.fracsave`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Importe les données depuis un fichier .fracsave
     */
    static async importSave(file: File): Promise<SaveData | null> {
        try {
            const text = await file.text();
            const data: SaveData = JSON.parse(text);

            if (data.version !== this.SAVE_VERSION) {
                throw new Error("Version de sauvegarde incompatible.");
            }

            return data;
        } catch (e) {
            console.error("Erreur lors de l'importation :", e);
            return null;
        }
    }
}
