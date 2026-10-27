// -----------------------------------------------------------------------------
// TYPES DU MONDE
// Définition des structures de données pour la carte, le joueur,
// les collisions et les interactions.
// -----------------------------------------------------------------------------

export interface Vector2 {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type InteractionType = 'elevator' | 'stairs' | 'door' | 'npc' | 'object' | 'mission' | 'pedagogical';

export interface InteractionZone extends Rect {
    type: InteractionType;
    id: string;
    destination?: string; // ID de la pièce ou étage de destination
    action?: string;      // Nom de l'action ou de l'activité à déclencher
}

export interface CollisionZone extends Rect {
    id: string;
}

export interface FloorData {
    id: string;
    name: string;
    width: number;
    height: number;
    collisions: CollisionZone[];
    interactions: InteractionZone[];
    spawnPoint: Vector2;
    visuals: any[]; // À définir plus tard pour la couche graphisme
}

export interface PlayerState {
    position: Vector2;
    direction: 'up' | 'down' | 'left' | 'right';
    currentFloorId: string;
    speed: number;
}
