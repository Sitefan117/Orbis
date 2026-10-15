// -----------------------------------------------------------------------------
// GESTION DES ÉTAGES
// Fournit les données de configuration pour chaque niveau de la tour.
// -----------------------------------------------------------------------------

import { type FloorData } from '$lib/fractionstower2/types/world';
import { ACTIVE_FLOOR_CURRICULUM } from '$lib/fractionstower2/data/curriculum';

export class FloorManager {
    private static floors: Record<string, FloorData> = {};

    // Mots de passe pour l'ascenseur (un par étage)
    static readonly elevatorPasswords: Record<string, string> = {
        'floor-1': 'Arcanin',
        'floor-2': 'Bulbizarre',
        'floor-3': 'Carapuce',
        'floor-4': 'Dracaufeu',
        'floor-5': 'Ectoplasma',
        'floor-6': 'Flagadoss',
        'floor-7': 'Grotadmorv',
        'floor-8': 'Ho-Oh'
    };

    // Générateur de template basé sur l'étage 1 (dimensions ajustées aux tailles 75px)
    private static createFloorTemplate(id: string, name: string, floorNum: number): FloorData {
        return {
            id,
            name,
            width: 1000,
            height: 800,
            spawnPoint: { x: 100, y: 100 },
            collisions: [
                { id: 'wall-top', x: 0, y: 0, width: 1000, height: 20 },
                { id: 'wall-bottom', x: 0, y: 780, width: 1000, height: 20 },
                { id: 'wall-left', x: 0, y: 0, width: 20, height: 800 },
                { id: 'wall-right', x: 980, y: 0, width: 20, height: 800 },
                { id: 'obs-1', x: 400, y: 300, width: 200, height: 200 },
            ],
            interactions: [
                // Ascenseur en bas à gauche (synchronisé à 75x75)
                { 
                    id: `elevator-${floorNum}`, 
                    type: 'elevator', 
                    x: 80, y: 670, width: 75, height: 75, 
                    destination: 'floor-select' 
                },
                // Escaliers bien espacés en bas à droite (synchronisés à 75x75)
                { 
                    id: `stairs-down-${floorNum}`, 
                    type: 'stairs', 
                    x: 770, y: 670, width: 75, height: 75, 
                    destination: `floor-${floorNum - 1}` 
                },
                { 
                    id: `stairs-up-${floorNum}`, 
                    type: 'stairs', 
                    x: 870, y: 670, width: 75, height: 75, 
                    destination: `floor-${floorNum + 1}` 
                },
                // PNJ et activités bien répartis sur la map (synchronisés à 75x75)
                {
                    id: `mission-course-${floorNum}`,
                    type: 'pedagogical',
                    x: 180, y: 250, width: 75, height: 75,
                    action: 'course-intro'
                },
                {
                    id: `mission-training-${floorNum}`,
                    type: 'pedagogical',
                    x: 580, y: 120, width: 75, height: 75,
                    action: 'training-intro'
                },
                {
                    id: `mission-boss-${floorNum}`,
                    type: 'pedagogical',
                    x: 780, y: 120, width: 75, height: 75,
                    action: 'boss-intro'
                },
                {
                    id: `mission-classic-course-${floorNum}`,
                    type: 'pedagogical',
                    x: 650, y: 550, width: 75, height: 75,
                    action: 'classic-course-intro'
                }
            ],
            visuals: []
        };
    }

    static {
        for (const floor of ACTIVE_FLOOR_CURRICULUM) {
            this.floors[floor.id] = this.createFloorTemplate(
                floor.id,
                `Étage ${floor.number} — ${floor.title}`,
                floor.number
            );
        }
    }

    static getFloor(id: string): FloorData | undefined {
        return this.floors[id];
    }

    static getAllFloors() {
        return Object.values(this.floors);
    }
}