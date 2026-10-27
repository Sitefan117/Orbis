// -----------------------------------------------------------------------------
// MOTEUR D'INTERACTION
// Gère la détection et le déclenchement des zones interactives.
// -----------------------------------------------------------------------------

import { type Rect, type InteractionZone, type Vector2 } from '$lib/games/fractionstower2/types/world';

export class InteractionEngine {
    // Taille de la zone d'interaction du joueur ajustée à la taille visuelle (100px)
    static PLAYER_WIDTH = 60;
    static PLAYER_HEIGHT = 50;

    /**
     * Vérifie si le joueur se trouve dans une zone interactive.
     * Retourne la zone trouvée ou null.
     */
    static checkInteraction(
        pos: Vector2, 
        interactions: InteractionZone[]
    ): InteractionZone | null {
        const playerRect = { x: pos.x, y: pos.y, width: this.PLAYER_WIDTH, height: this.PLAYER_HEIGHT };

        for (const zone of interactions) {
            if (this.checkOverlap(playerRect, zone)) {
                return zone;
            }
        }
        return null;
    }

    private static checkOverlap(rect1: Rect, rect2: Rect): boolean {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}