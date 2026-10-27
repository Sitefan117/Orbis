// -----------------------------------------------------------------------------
// GESTION DES ÉTAGES
// Fournit les données de configuration pour chaque niveau de la tour.
// -----------------------------------------------------------------------------

import { type FloorData } from '$lib/games/fractionstower2/types/world';
import { ACTIVE_FLOOR_CURRICULUM } from '$lib/games/fractionstower2/data/curriculum';

export class FloorManager {
    private static floors: Record<string, FloorData> = {};

    // Les neuf salles partagent un plan fixe : chaque activité garde son alcôve.
    private static readonly npcPositions = {
        course: { x: 105, y: 125 },
        training: { x: 785, y: 125 },
        boss: { x: 785, y: 465 },
        classic: { x: 105, y: 465 }
    };

    // Le parchemin propose un code pour chacun des étages actuellement accessibles.
    static readonly elevatorPasswords: Record<string, string> = {
        'floor-1': 'Arcanin',
        'floor-2': 'Bulbizarre',
        'floor-3': 'Carapuce',
        'floor-4': 'Dracaufeu',
        'floor-5': 'Ectoplasma',
        'floor-6': 'Flagadoss',
        'floor-7': 'Grotadmorv',
        'floor-8': 'Ho-Oh',
        'floor-9': 'Mewtwo'
    };

    // Les escaliers sont au nord et au sud ; le parchemin et son gardien veillent au nord.
    private static createFloorTemplate(id: string, name: string, floorNum: number): FloorData {
        const npcPositions = this.npcPositions;
        return {
            id,
            name,
            width: 1000,
            height: 800,
            spawnPoint: { x: 470, y: 570 },
            collisions: [
                { id: 'wall-top', x: 0, y: 0, width: 1000, height: 20 },
                { id: 'wall-bottom', x: 0, y: 780, width: 1000, height: 20 },
                { id: 'wall-left', x: 0, y: 0, width: 20, height: 800 },
                { id: 'wall-right', x: 980, y: 0, width: 20, height: 800 }
            ],
            interactions: [
                // Le parchemin apparaît sur le piédestal dessiné dans les neuf décors.
                { 
                    id: `elevator-${floorNum}`, 
                    type: 'elevator', 
                    x: 590, y: 70, width: 80, height: 100, 
                    destination: 'floor-select' 
                },
                { 
                    id: `stairs-down-${floorNum}`, 
                    type: 'stairs', 
                    x: 450, y: 695, width: 100, height: 80, 
                    destination: `floor-${floorNum - 1}` 
                },
                { 
                    id: `stairs-up-${floorNum}`, 
                    type: 'stairs', 
                    x: 395, y: 30, width: 100, height: 120, 
                    destination: `floor-${floorNum + 1}` 
                },
                {
                    id: `stair-guard-${floorNum}`,
                    type: 'object',
                    x: 300, y: 45, width: 90, height: 115,
                    action: 'stair-guard'
                },
                // Les zones d'interaction restent stables ; seul leur placement suit chaque décor.
                {
                    id: `mission-course-${floorNum}`,
                    type: 'pedagogical',
                    ...npcPositions.course, width: 75, height: 75,
                    action: 'course-intro'
                },
                {
                    id: `mission-training-${floorNum}`,
                    type: 'pedagogical',
                    ...npcPositions.training, width: 75, height: 75,
                    action: 'training-intro'
                },
                {
                    id: `mission-boss-${floorNum}`,
                    type: 'pedagogical',
                    ...npcPositions.boss, width: 75, height: 75,
                    action: 'boss-intro'
                },
                {
                    id: `mission-classic-course-${floorNum}`,
                    type: 'pedagogical',
                    ...npcPositions.classic, width: 75, height: 75,
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
