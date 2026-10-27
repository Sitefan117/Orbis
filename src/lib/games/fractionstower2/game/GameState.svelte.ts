// -----------------------------------------------------------------------------
// GESTION DE L'ÉTAT DU JEU
// Centralise la position du joueur, l'étage actuel et les paramètres de jeu.
// Utilise les runes Svelte 5 pour une réactivité optimale.
// -----------------------------------------------------------------------------

import { type PlayerState, type Vector2 } from '$lib/games/fractionstower2/types/world';
import { FloorManager } from '$lib/games/fractionstower2/game/FloorManager';

export function createGameState() {
	// État réactif du joueur
	let player = $state<PlayerState>({
		position: { x: 470, y: 570 },
		direction: 'down',
		currentFloorId: 'floor-1',
		speed: 4
	});

	// Progression
	let defeatedBosses = $state(new Set<string>());
	let hasElevatorAccess = $state(false);

	let debugMode = $state(false);
	let currentFloorName = $state('');
	let isTransitioning = $state(false); // Pour les effets de transition d'étage

	// Initialisation du nom de l'étage
	const initialFloor = FloorManager.getFloor('floor-1');
	if (initialFloor) currentFloorName = initialFloor.name;

	return {
		get player() { return player; },
		set player(val) { player = val; },
		
		get debugMode() { return debugMode; },
		set debugMode(val) { debugMode = val; },

		get currentFloorName() { return currentFloorName; },
		set currentFloorName(val) { currentFloorName = val; },

		get defeatedBosses() { return defeatedBosses; },
		get hasElevatorAccess() { return hasElevatorAccess; },

		get isTransitioning() { return isTransitioning; },
		set isTransitioning(val) { isTransitioning = val; },

		markBossDefeated(floorId: string) {
			defeatedBosses.add(floorId);
		},

		grantElevatorAccess() {
			hasElevatorAccess = true;
		},

		// --- IMPORT / RESTAURATION ---
		loadSave(playerState: PlayerState, bosses: string[], elevator: boolean) {
			player = { ...playerState };
			defeatedBosses = new Set(bosses);
			hasElevatorAccess = elevator;
			
			const floor = FloorManager.getFloor(player.currentFloorId);
			if (floor) currentFloorName = floor.name;
		},

		// Mise à jour de la position
		updatePosition(dx: number, dy: number) {
			player.position.x += dx;
			player.position.y += dy;
		},

		setDirection(dir: PlayerState['direction']) {
			player.direction = dir;
		},

		// Changement d'étage avec transition
		async changeFloor(floorId: string) {
			isTransitioning = true;
			// Petit délai pour laisser l'animation de fondu s'opérer
			await new Promise(resolve => setTimeout(resolve, 500));
			
			const nextFloor = FloorManager.getFloor(floorId);
			if (nextFloor) {
				player.currentFloorId = floorId;
				player.position = { ...nextFloor.spawnPoint };
				currentFloorName = nextFloor.name;
			}
			
			isTransitioning = false;
		}
	};
}
