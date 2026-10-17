<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { createGameState } from '$lib/fractionstower2/game/GameState.svelte';
    import { CollisionEngine } from '$lib/fractionstower2/game/CollisionEngine';
    import { InteractionEngine } from '$lib/fractionstower2/game/InteractionEngine';
    import { FloorManager } from '$lib/fractionstower2/game/FloorManager';
    import ActivityModal from '$lib/fractionstower2/components/exercises/ActivityModal.svelte';
    import BossBattle from '$lib/fractionstower2/components/exercises/BossBattle.svelte';
    import BossFloor1 from '$lib/fractionstower2/components/exercises/BossFloor1.svelte';
    import CourseViewer from '$lib/fractionstower2/components/course/CourseViewer.svelte';
    import { languageState } from '$lib/fractionstower2/persistence/LanguageManager';
    import { SaveManager } from '$lib/fractionstower2/persistence/SaveManager';
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';
    import { ProgressManager } from '$lib/fractionstower2/persistence/ProgressManager';


    const game = createGameState();
    let floor = $derived(FloorManager.getFloor(game.player.currentFloorId));
    let activeActivityId = $state<string | null>(null);
    let activeBossFloorId = $state<string | null>(null);
    let activeCourseFloorId = $state<string | null>(null);
    let keys = new Set<string>();
    let isWalking = $state(false);

    // ==========================================
    // ⚙️ TAILLES DES ÉLÉMENTS DU JEU
    // ==========================================
    const heroSize = 100;          
    const defaultNpcSize = 75;   
    const topNpcSize = 75;       
    const floorTileSize = 100;     
    const wallTileSize = 50;      
    const stairsSize = 75;        
    const elevatorSize = 75;      
    // ==========================================

    let viewportContainer = $state<HTMLElement | null>(null);
    let mapScale = $state(1);

    function updateScale() {
        if (!viewportContainer || !floor) return;
        const availableWidth = viewportContainer.clientWidth;
        const availableHeight = viewportContainer.clientHeight;
        const scaleX = availableWidth / floor.width;
        const scaleY = availableHeight / floor.height;
        mapScale = Math.min(scaleX, scaleY);
    }

    let walkFrame = $state(0); 
    let animTimer = 0;

    const colMap: Record<string, number> = {
        'down': 0,
        'up': 1,
        'left': 2,
        'right': 3
    };

    let currentCol = $derived(colMap[game.player.direction] ?? 0);

    const npcImages: Record<string, string> = {
        'course-intro': `${base}/guide.png`,          
        'classic-course-intro': `${base}/guide_classic.png`, 
        'training-intro': `${base}/trainer.png`,      
        'boss-intro': `${base}/boss.png`              
    };

    function safePlayAudio(soundName: string) {
        if (typeof (AudioManager as any).play === 'function') {
            (AudioManager as any).play(soundName);
        } else if (typeof AudioManager.playClick === 'function') {
            AudioManager.playClick();
        }
    }

    function getNpcImage(action?: string): string {
        if (action && npcImages[action]) {
            return npcImages[action];
        }
        return `${base}/guide.png`;
    }

    function getNpcSize(yPosition: number): number {
        return yPosition < 200 ? topNpcSize : defaultNpcSize;
    }

    function changeLanguage() {
        safePlayAudio('click');
        languageState.current = languageState.current === 'fr-FR' ? 'ru-RU' : 'fr-FR';
    }

    function bindTouch(key: string) {
        return {
            onmousedown: (e: MouseEvent) => { e.preventDefault(); keys.add(key); },
            onmouseup: (e: MouseEvent) => { e.preventDefault(); keys.delete(key); },
            onmouseleave: (e: MouseEvent) => { keys.delete(key); },
            ontouchstart: (e: TouchEvent) => { e.preventDefault(); keys.add(key); },
            ontouchend: (e: TouchEvent) => { e.preventDefault(); keys.delete(key); },
            ontouchcancel: (e: TouchEvent) => { keys.delete(key); }
        };
    }

    onMount(() => {
        updateScale();
        window.addEventListener('resize', updateScale);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateScale, 200);
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                keys.clear();
                if (activeCourseFloorId) activeCourseFloorId = null;
                else if (activeBossFloorId) activeBossFloorId = null;
                else if (activeActivityId) activeActivityId = null;
                return;
            }
            if (activeActivityId || activeBossFloorId || activeCourseFloorId) return;
            keys.add(e.key);
            if (e.key.toLowerCase() === 'e') {
                handleInteraction();
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => keys.delete(e.key);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        function loop() {
            update();
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', updateScale);
            window.removeEventListener('orientationchange', () => {
                setTimeout(updateScale, 200);
            });
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    });

    function handleInteraction() {
        if (!floor) return;
        
        if (game.isTransitioning) {
            game.isTransitioning = false;
        }

        const interaction = InteractionEngine.checkInteraction(game.player.position, floor.interactions);

        if (interaction) {
            safePlayAudio('interact');
            if (interaction.type === 'pedagogical') {
                if (interaction.action === 'boss-intro') {
                    activeBossFloorId = game.player.currentFloorId;
                } else if (interaction.action === 'classic-course-intro') {
                    activeCourseFloorId = game.player.currentFloorId;
                } else if (interaction.action === 'course-intro') {
                    activeActivityId = `${game.player.currentFloorId}-course`;
                } else if (interaction.action === 'training-intro') {
                    activeActivityId = game.player.currentFloorId === 'floor-1'
                        ? 'floor-1-training'
                        : `${game.player.currentFloorId}-training`;
                } else {
                    activeActivityId = interaction.action || interaction.id;
                }
            } else if (interaction.type === 'stairs') {
                handleStairs(interaction);
            } else if (interaction.type === 'elevator') {
                handleElevator();
            } else if (interaction.destination) {
                game.changeFloor(interaction.destination);
            }
        }
    }

    function handleStairs(interaction: any) {
        if (!interaction.destination) return;
        const currentNum = parseInt(game.player.currentFloorId.split('-')[1]);
        const destNum = parseInt(interaction.destination.split('-')[1]);

        if (destNum > currentNum) {
            const hasDefeated = game.debugMode || 
                (game.defeatedBosses && (
                    typeof game.defeatedBosses.has === 'function' 
                        ? game.defeatedBosses.has(game.player.currentFloorId) 
                        : (game.defeatedBosses as any)[game.player.currentFloorId]
                ));

            if (hasDefeated) {
                safePlayAudio('stairs');
                game.changeFloor(interaction.destination);
            } else {
                safePlayAudio('click');
                alert(languageState.current === 'fr-FR' 
                    ? "L'escalier est bloqué ! Tu dois d'abord battre le Boss de cet étage pour monter." 
                    : "Лестница заблокирована! Сначала вы должны победить Босса этого этажа, чтобы подняться.");
            }
        } else {
            safePlayAudio('stairs');
            game.changeFloor(interaction.destination);
        }
    }

    function handleElevator() {
        const target = prompt(languageState.current === 'fr-FR' 
            ? "Vers quel étage souhaites-tu aller ? (1-8)" 
            : "На какой этаж вы хотите отправиться? (1-8)");
        if (!target) return;
        const floorNum = parseInt(target);
        if (isNaN(floorNum) || floorNum < 1 || floorNum > 8) {
            alert(languageState.current === 'fr-FR' ? "Numéro d'étage invalide." : "Неверный номер этажа.");
            return;
        }
        const floorId = `floor-${floorNum}`;
        const correctPassword = FloorManager.elevatorPasswords[floorId];
        if (!correctPassword) {
            alert("Erreur de configuration de l'ascenseur.");
            return;
        }
        const userPassword = prompt(languageState.current === 'fr-FR' 
            ? `Entre le code secret pour l'étage ${floorNum} :` 
            : `Введите секретный код для ${floorNum}-го этажа:`);
        if (userPassword && userPassword.toLowerCase() === correctPassword.toLowerCase()) {
            safePlayAudio('elevator');
            game.changeFloor(floorId);
        } else if (userPassword !== null) {
            safePlayAudio('click');
            alert(languageState.current === 'fr-FR' ? "Code incorrect !" : "Неверный код!");
        }
    }

    function saveGame() {
        const studentId = prompt(languageState.current === 'fr-FR' 
            ? "Entre ton nom ou ID pour sauvegarder :" 
            : "Введите ваше имя или ID для сохранения:");
        if (!studentId) return;
        SaveManager.exportSave(studentId, game.player, game.defeatedBosses, game.hasElevatorAccess);
        safePlayAudio('save');
    }

    function loadGame(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files) return;
        const files = Array.from(target.files);
        for (const file of files) {
            SaveManager.importSave(file).then(data => {
                if (data) {
                    game.loadSave(data.player, data.defeatedBosses, data.hasElevatorAccess);
                    safePlayAudio('load');
                    alert(languageState.current === 'fr-FR' ? "Sauvegarde chargée avec succès !" : "Сохранение успешно загружено!");
                }
            });
        }
    }

    function update() {
        if (!floor || activeActivityId || activeBossFloorId || activeCourseFloorId || game.isTransitioning) return;
        let dx = 0; let dy = 0;
        if (keys.has('ArrowUp') || keys.has('z') || keys.has('w')) {
            dy = -game.player.speed;
            game.setDirection('up');
        } else if (keys.has('ArrowDown') || keys.has('s')) {
            dy = game.player.speed;
            game.setDirection('down');
        }
        if (keys.has('ArrowLeft') || keys.has('q') || keys.has('a')) {
            dx = -game.player.speed;
            game.setDirection('left');
        } else if (keys.has('ArrowRight') || keys.has('d')) {
            dx = game.player.speed;
            game.setDirection('right');
        }

        isWalking = (dx !== 0 || dy !== 0);

        if (isWalking) {
            animTimer += 1;
            if (animTimer === 1) {
                safePlayAudio('step');
            }
            if (animTimer > 15) {
                animTimer = 0;
            }

            if (animTimer > 8) { 
                walkFrame = (walkFrame === 1) ? 3 : 1; 
            }
        } else {
            walkFrame = 0; 
            animTimer = 0;
        }

        if (dx !== 0) {
            const nextX = { x: game.player.position.x + dx, y: game.player.position.y };
            if (CollisionEngine.isPositionValid(nextX, floor.collisions, floor.width, floor.height)) {
                game.updatePosition(dx, 0);
            }
        }
        if (dy !== 0) {
            const nextY = { x: game.player.position.x, y: game.player.position.y + dy };
            if (CollisionEngine.isPositionValid(nextY, floor.collisions, floor.width, floor.height)) {
                game.updatePosition(0, dy);
            }
        }
    }
</script>

{#if activeActivityId}
    <ActivityModal activityId={activeActivityId} onClose={() => activeActivityId = null} />
{/if}
{#if activeBossFloorId === 'floor-1'}
  <BossFloor1 game={game} onComplete={() => activeBossFloorId = null} onClose={() => activeBossFloorId = null} />
{:else if activeBossFloorId}
  <BossBattle
    floorId={activeBossFloorId}
    game={game}
    onComplete={(score = 0) => {
      ProgressManager.recordFloorCompletion(activeBossFloorId!, score, 18);
      activeBossFloorId = null;
    }}
    onClose={() => activeBossFloorId = null}
  />
{/if}
{#if activeCourseFloorId}
    <CourseViewer floorId={activeCourseFloorId} onClose={() => activeCourseFloorId = null} />
{/if}

{#if game.isTransitioning}
    <div class="transition-overlay"></div>
{/if}

<div class="game-layout">
    
    <!-- BANDEAU SUPÉRIEUR GARANTI -->
    <header class="top-bar">
        <div class="hud-left">
            <span class="floor-title">{game.currentFloorName}</span>
            <span class="hud-stats">Pos: {Math.round(game.player.position.x)}, {Math.round(game.player.position.y)}</span>
        </div>
        <div class="hud-right">
            <div class="tools-row">
                <button class="tool-btn lang-btn" onclick={changeLanguage}>
                    {languageState.current === 'fr-FR' ? '🇷🇺 RU' : '🇫🇷 FR'}
                </button>
                <button class="tool-btn save-btn" onclick={saveGame} title="Sauvegarder">
                    💾 {languageState.current === 'fr-FR' ? 'Sauver' : 'Сохр'}
                </button>
                <label class="tool-btn load-label" title="Charger">
                    📂 {languageState.current === 'fr-FR' ? 'Charger' : 'Загр'}
                    <input type="file" accept=".fracsave" onchange={loadGame} />
                </label>
            </div>
            {#if game.debugMode}
                <span class="debug-badge">DEBUG</span>
            {/if}
        </div>
    </header>

    <!-- CANEVAS DE JEU PLEIN ÉCRAN -->
    <main class="game-viewport" bind:this={viewportContainer}>
        {#if floor}
            <div 
                class="world pixelated" 
                style="
                    width: {floor.width}px; 
                    height: {floor.height}px; 
                    transform: scale({mapScale});
                    transform-origin: center center;
                    background-image: url('{base}/sol.png'); 
                    background-repeat: repeat;
                    background-size: {floorTileSize}px {floorTileSize}px;
                "
            >
                <!-- MURS -->
                {#each floor.collisions as col}
                    {@const isHorizontal = col.width > col.height}
                    <div 
                        class="wall-tile pixelated" 
                        style="
                            left: {col.x}px; 
                            top: {col.y}px; 
                            width: {col.width}px; 
                            height: {col.height}px;
                            background-image: url('{base}/{isHorizontal ? 'murs_h.png' : 'murs_v.png'}');
                            background-repeat: repeat;
                            background-size: {wallTileSize}px {wallTileSize}px;
                            position: absolute;
                            z-index: 2;
                        "
                    ></div>
                {/each}

                <!-- ESCALIERS ET ASCENSEUR SANS TEXTES S, A, P -->
                {#each floor.interactions as inter}
                    {#if inter.type === 'stairs'}
                        {@const isAscending = inter.destination && parseInt(inter.destination.split('-')[1]) > parseInt(game.player.currentFloorId.split('-')[1])}
                        <div 
                            class="pixelated" 
                            style="
                                left: {inter.x}px; 
                                top: {inter.y}px; 
                                width: {stairsSize}px; 
                                height: {stairsSize}px; 
                                position: absolute; 
                                z-index: 5; 
                                background-image: url('{base}/{isAscending ? 'escalier_m.png' : 'escalier_d.png'}'); 
                                background-size: 100% 100%;
                                background-repeat: no-repeat;
                            "
                        ></div>
                    {:else if inter.type === 'elevator'}
                        <div 
                            class="pixelated" 
                            style="
                                left: {inter.x}px; 
                                top: {inter.y}px; 
                                width: {elevatorSize}px; 
                                height: {elevatorSize}px; 
                                position: absolute; 
                                z-index: 5; 
                                background-image: url('{base}/ascenseur.png'); 
                                background-size: 100% 100%;
                                background-repeat: no-repeat;
                            "
                        ></div>
                    {/if}

                    {#if inter.type === 'pedagogical'}
                        {@const currentNpcSize = getNpcSize(inter.y)}
                        <div class="npc" style="left: {inter.x}px; top: {inter.y}px; width: {currentNpcSize}px; height: {currentNpcSize}px; position: absolute; z-index: 8;">
                            <div 
                                class="pixelated"
                                style="
                                    width: {currentNpcSize}px;
                                    height: {currentNpcSize}px;
                                    background-image: url('{getNpcImage(inter.action)}');
                                    background-size: 400% 400%;
                                    background-position: 0% 0%;
                                "
                            ></div>
                        </div>
                    {/if}
                {/each}

                <!-- PERSONNAGE PRINCIPAL -->
                <div class="player" style="left: {game.player.position.x}px; top: {game.player.position.y}px; width: {heroSize}px; height: {heroSize}px; position: absolute; z-index: 10;">
                    <div 
                        class="pixelated"
                        style="
                            width: {heroSize}px;
                            height: {heroSize}px;
                            background-image: url('{base}/Walk.png');
                            background-size: 400% 400%;
                            background-position: {(currentCol / 3) * 100}% {(walkFrame / 3) * 100}%;
                        "
                    ></div>
                </div>

                {#if game.debugMode}
                    {#each floor.collisions as col}
                        <div class="debug-collision" style="left: {col.x}px; top: {col.y}px; width: {col.width}px; height: {col.height}px;">{col.id}</div>
                    {/each}
                    {#each floor.interactions as inter}
                        <div class="debug-interaction" style="left: {inter.x}px; top: {inter.y}px; width: {inter.width}px; height: {inter.height}px;">{inter.type}</div>
                    {/each}
                {/if}
            </div>
        {:else}
            <div class="error">Étage non trouvé : {game.player.currentFloorId}</div>
        {/if}

        <!-- BOUTONS TACTILES FLOTTANTS EN BAS À GAUCHE ET À DROITE (FLUIDES ET COMPATIBLES) -->
        <div class="floating-controls-left">
            <div class="dpad-container">
                <button class="dpad-btn up" {...bindTouch('ArrowUp')} aria-label="Haut">
                    <span>▲</span>
                </button>
                <div class="dpad-middle-row">
                    <button class="dpad-btn left" {...bindTouch('ArrowLeft')} aria-label="Gauche">
                        <span>◀</span>
                    </button>
                    <div class="dpad-center-core"></div>
                    <button class="dpad-btn right" {...bindTouch('ArrowRight')} aria-label="Droite">
                        <span>▶</span>
                    </button>
                </div>
                <button class="dpad-btn down" {...bindTouch('ArrowDown')} aria-label="Bas">
                    <span>▼</span>
                </button>
            </div>
        </div>

        <div class="floating-controls-right">
            <button 
                class="action-btn-arcade" 
                onclick={handleInteraction}
                ontouchstart={(e) => { e.preventDefault(); handleInteraction(); }}
            >
                <div class="action-btn-inner">
                    <span class="action-hint">[ E ]</span>
                    <span class="action-text">{languageState.current === 'fr-FR' ? 'INTERAGIR' : 'ДЕЙСТВИE'}</span>
                </div>
            </button>
        </div>
    </main>

</div>

<style>
    .game-layout {
        display: flex;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
        background-color: #0f172a;
        color: #ffffff;
        overflow: hidden;
        user-select: none;
        -webkit-user-select: none;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .top-bar {
        height: 48px;
        background-color: #0f172a;
        border-bottom: 2px solid #334155;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px;
        z-index: 100;
        flex-shrink: 0;
    }
    .hud-left, .hud-right {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .floor-title {
        font-weight: bold;
        color: #f59e0b;
        font-size: 1rem;
    }
    .hud-stats {
        font-size: 0.85rem;
        color: #94a3b8;
    }
    .debug-badge {
        background: #7f1d1d;
        color: #fca5a5;
        font-size: 0.7rem;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #991b1b;
    }

    .tools-row {
        display: flex;
        gap: 8px;
    }
    .tool-btn {
        background-color: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .tool-btn:hover { background-color: #334155; }
    .load-label input { display: none; }

    .game-viewport {
        flex: 1;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #000000;
        overflow: hidden;
    }

    .world {
        position: relative;
        box-shadow: 0 0 25px rgba(0, 0, 0, 0.8);
        transition: transform 0.1s ease-out;
    }

    .pixelated {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }

    .error {
        color: #f87171;
        font-size: 1.5rem;
    }

    .transition-overlay {
        position: fixed;
        inset: 0;
        background: black;
        z-index: 2000;
        pointer-events: none;
        animation: fade-out 0.5s forwards;
    }

    @keyframes fade-out {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* COMMANDES TACTILES FLOTTANTES EN BAS À GAUCHE ET DROITE */
    .floating-controls-left {
        position: absolute;
        bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        left: 12px;
        z-index: 150;
        pointer-events: auto;
    }
    .floating-controls-right {
        position: absolute;
        bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        right: 12px;
        z-index: 150;
        pointer-events: auto;
    }

    /* D-PAD TACTILE ERGONOMIQUE */
    .dpad-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        user-select: none;
        touch-action: none;
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.7));
    }
    .dpad-middle-row {
        display: flex;
        align-items: center;
    }
    .dpad-center-core {
        width: 44px;
        height: 44px;
        background-color: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(51, 65, 85, 0.8);
    }
    .dpad-btn {
        width: 48px;
        height: 48px;
        background: linear-gradient(180deg, rgba(51, 65, 85, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%);
        color: #f8fafc;
        border: 2px solid rgba(71, 85, 105, 0.9);
        font-size: 1.3rem;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        touch-action: none;
        backdrop-filter: blur(4px);
    }
    .dpad-btn.up { border-radius: 10px 10px 2px 2px; border-bottom: none; }
    .dpad-btn.down { border-radius: 2px 2px 10px 10px; border-top: none; }
    .dpad-btn.left { border-radius: 10px 2px 2px 10px; border-right: none; }
    .dpad-btn.right { border-radius: 2px 10px 10px 2px; border-left: none; }
    .dpad-btn:active {
        background: #f59e0b;
        color: #0f172a;
    }

    /* BOUTON D'ACTION TYPE ARCADE FLOTTANT */
    .action-btn-arcade {
        width: 95px;
        height: 95px;
        border-radius: 50%;
        background: linear-gradient(145deg, rgba(251, 191, 36, 0.9), rgba(217, 119, 6, 0.9));
        padding: 5px;
        border: 3px solid #f59e0b;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
        cursor: pointer;
        touch-action: manipulation;
        backdrop-filter: blur(4px);
    }
    .action-btn-inner {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(180deg, #f59e0b 0%, #b45309 100%);
        border: 2px solid #fef3c7;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #ffffff;
    }
    .action-hint {
        font-size: 0.7rem;
        font-weight: 900;
    }
    .action-text {
        font-size: 0.8rem;
        font-weight: 900;
    }
</style>