// -----------------------------------------------------------------------------
// MOTEUR DE COLLISION
// Gère la détection d'intersections entre le joueur et les obstacles du monde.
// -----------------------------------------------------------------------------

import { type Rect, type CollisionZone, type Vector2 } from '$lib/fractionstower2/types/world';

export class CollisionEngine {
    // Taille de la hitbox du joueur ajustée à la taille visuelle (100px)
    static PLAYER_WIDTH = 60;
    static PLAYER_HEIGHT = 50;

    /**
     * Vérifie si une position donnée pour le joueur est valide
     * (ne collisionne avec aucun obstacle et reste dans les limites).
     */
    static isPositionValid(
        pos: Vector2, 
        collisions: CollisionZone[], 
        worldWidth: number, 
        worldHeight: number
    ): boolean {
        // 1. Vérification des limites du monde
        if (pos.x < 0 || pos.x + this.PLAYER_WIDTH > worldWidth || 
            pos.y < 0 || pos.y + this.PLAYER_HEIGHT > worldHeight) {
            return false;
        }

        // 2. Vérification des zones de collision
        for (const zone of collisions) {
            if (this.checkOverlap(
                { x: pos.x, y: pos.y, width: this.PLAYER_WIDTH, height: this.PLAYER_HEIGHT },
                zone
            )) {
                return false;
            }
        }

        return true;
    }

    private static checkOverlap(rect1: Rect, rect2: Rect): boolean {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
}