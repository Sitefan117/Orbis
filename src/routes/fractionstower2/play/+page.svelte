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

    const game = createGameState();
    let floor = $derived(FloorManager.getFloor(game.player.currentFloorId));
    let activeActivityId = $state<string | null>(null);
    let activeBossFloorId = $state<string | null>(null);
    let activeCourseFloorId = $state<string | null>(null);
    let keys = new Set<string>();
    let isWalking = $state(false);

    // ==========================================
    // ⚙️ TAILLES INDÉPENDANTES DE CHAQUE ÉLÉMENT
    // ==========================================
    const heroSize = 96;       // Taille du héros
    const npcSize = 96;        // Taille des PNJ
    const floorTileSize = 96;  // Taille des motifs du sol
    const wallTileSize = 96;   // Taille des motifs des murs
    const stairsSize = 48;     // Taille des escaliers
    const elevatorSize = 48;   // Taille de l'ascenseur
    // ==========================================

    let walkFrame = $state(0); 
    let animTimer = 0;

    const colMap: Record<string, number> = {
        'down': 0,
        'up': 1,
        'left': 2,
        'right': 3
    };

    let currentCol = $derived(colMap[game.player.direction] ?? 0);

    const interactionLabels: Record<string, string> = {
        'stairs': 'S',
        'elevator': 'A',
        'door': 'P',
        'npc': 'P',
        'course-intro': 'T',
        'classic-course-intro': 'C',
        'training-intro': 'E',
        'boss-intro': 'B'
    };

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

    function getLabel(interaction: any): string {
        if (interaction.action && interactionLabels[interaction.action]) {
            return interactionLabels[interaction.action];
        }
        return interactionLabels[interaction.type] || '?';
    }

    function changeLanguage() {
        safePlayAudio('click');
        languageState.current = languageState.current === 'fr-FR' ? 'ru-RU' : 'fr-FR';
    }

    function handleTouchStart(key: string) {
        keys.add(key);
    }

    function handleTouchEnd(key: string) {
        keys.delete(key);
    }

    onMount(() => {
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
                    // CORRECTION ICI : On transmet proprement l'étage courant pour tous les niveaux
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
    <BossBattle floorId={activeBossFloorId} onComplete={() => activeBossFloorId = null} />
{/if}
{#if activeCourseFloorId}
    <CourseViewer floorId={activeCourseFloorId} onClose={() => activeCourseFloorId = null} />
{/if}

{#if game.isTransitioning}
    <div class="transition-overlay"></div>
{/if}

<div class="game-layout">
    
    <!-- ================= 1. BANDEAU SUPÉRIEUR (HUD ÉPURÉ) ================= -->
    <header class="top-bar">
        <div class="hud-left">
            <span class="floor-title">{game.currentFloorName}</span>
            <span class="hud-stats">Pos: {Math.round(game.player.position.x)}, {Math.round(game.player.position.y)}</span>
        </div>
        <div class="hud-right">
            {#if game.debugMode}
                <span class="debug-badge">DEBUG</span>
            {/if}
        </div>
    </header>

    <!-- ================= 2. CANEVAS / ZONE DE JEU CENTRALE ================= -->
    <main class="game-viewport">
        {#if floor}
            <div 
                class="world pixelated" 
                style="
                    width: {floor.width}px; 
                    height: {floor.height}px; 
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

                <!-- ESCALIERS ET ASCENSEUR -->
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
                        <div class="npc" style="left: {inter.x}px; top: {inter.y}px; width: {npcSize}px; height: {npcSize}px; position: absolute; z-index: 8;">
                            <div 
                                class="pixelated"
                                style="
                                    width: {npcSize}px;
                                    height: {npcSize}px;
                                    background-image: url('{getNpcImage(inter.action)}');
                                    background-size: 400% 400%;
                                    background-position: 0% 0%;
                                "
                            ></div>
                            <div class="npc-label">{getLabel(inter)}</div>
                        </div>
                    {/if}
                    <div class="interaction-label" style="left: {inter.x + inter.width/2}px; top: {inter.y + inter.height/2}px;">
                        {getLabel(inter)}
                    </div>
                {/each}

                <!-- PERSONNAGE PRINCIPAL (Héros) -->
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
    </main>

    <!-- ================= 3. BARRE DE CONTRÔLE INFÉRIEURE FIXE ================= -->
    <footer class="bottom-controls">
        
        <!-- GAUCHE : D-Pad Tactile Ergonomique -->
        <div class="control-section left">
            <div class="dpad">
                <button 
                    class="dpad-btn up" 
                    onmousedown={() => handleTouchStart('ArrowUp')} 
                    onmouseup={() => handleTouchEnd('ArrowUp')} 
                    ontouchstart={() => handleTouchStart('ArrowUp')} 
                    ontouchend={() => handleTouchEnd('ArrowUp')}
                >▲</button>
                <div class="dpad-row">
                    <button 
                        class="dpad-btn left" 
                        onmousedown={() => handleTouchStart('ArrowLeft')} 
                        onmouseup={() => handleTouchEnd('ArrowLeft')} 
                        ontouchstart={() => handleTouchStart('ArrowLeft')} 
                        ontouchend={() => handleTouchEnd('ArrowLeft')}
                    >◀</button>
                    <div class="dpad-center"></div>
                    <button 
                        class="dpad-btn right" 
                        onmousedown={() => handleTouchStart('ArrowRight')} 
                        onmouseup={() => handleTouchEnd('ArrowRight')} 
                        ontouchstart={() => handleTouchStart('ArrowRight')} 
                        ontouchend={() => handleTouchEnd('ArrowRight')}
                    >▶</button>
                </div>
                <button 
                    class="dpad-btn down" 
                    onmousedown={() => handleTouchStart('ArrowDown')} 
                    onmouseup={() => handleTouchEnd('ArrowDown')} 
                    ontouchstart={() => handleTouchStart('ArrowDown')} 
                    ontouchend={() => handleTouchEnd('ArrowDown')}
                >▼</button>
            </div>
        </div>

        <!-- CENTRE : Outils (Langue, Sauvegardes, Debug) -->
        <div class="control-section center">
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
            <label class="debug-toggle">
                <input type="checkbox" bind:checked={game.debugMode} /> Debug
            </label>
        </div>

        <!-- DROITE : Grand bouton d'action Tactile -->
        <div class="control-section right">
            <button class="action-btn" onclick={handleInteraction}>
                <span class="action-hint">[ E ]</span>
                <span class="action-text">{languageState.current === 'fr-FR' ? 'INTERAGIR' : 'ДЕЙСТВИE'}</span>
            </button>
        </div>

    </footer>
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
        height: 40px;
        background-color: rgba(15, 23, 42, 0.95);
        border-bottom: 1px solid #334155;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px;
        z-index: 100;
        flex-shrink: 0;
    }
    .hud-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .floor-title {
        font-weight: bold;
        color: #f59e0b;
        font-size: 0.95rem;
    }
    .hud-stats {
        font-size: 0.8rem;
        color: #94a3b8;
    }
    .debug-badge {
        background: #7f1d1d;
        color: #fca5a5;
        font-size: 0.65rem;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #991b1b;
    }

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
    }

    .pixelated {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }

    .interaction-label {
        position: absolute;
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.8);
        color: #1e293b;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 11px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        border: 1px solid #0f172a;
        z-index: 5;
    }

    .npc-label {
        position: absolute;
        top: -18px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        font-weight: bold;
        color: #ffffff;
        text-shadow: 1px 1px 2px black;
        white-space: nowrap;
    }

    .debug-collision {
        position: absolute;
        background: rgba(239, 68, 68, 0.3);
        border: 1px solid #ef4444;
        color: #fca5a5;
        font-size: 9px;
        pointer-events: none;
        z-index: 20;
    }

    .debug-interaction {
        position: absolute;
        background: rgba(34, 197, 94, 0.3);
        border: 1px solid #22c55e;
        color: #86efac;
        font-size: 9px;
        pointer-events: none;
        z-index: 20;
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

    .bottom-controls {
        height: 120px;
        background-color: #0f172a;
        border-top: 1px solid #334155;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;
        padding: 0 16px;
        z-index: 100;
        flex-shrink: 0;
    }

    .control-section {
        display: flex;
        align-items: center;
    }
    .control-section.left { justify-content: flex-start; }
    .control-section.center { 
        justify-content: center; 
        flex-direction: column; 
        gap: 8px; 
    }
    .control-section.right { justify-content: flex-end; }

    .dpad {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .dpad-row {
        display: flex;
        align-items: center;
    }
    .dpad-center {
        width: 32px;
        height: 32px;
        background-color: #1e293b;
    }
    .dpad-btn {
        width: 34px;
        height: 34px;
        background-color: #334155;
        color: #f8fafc;
        border: 1px solid #475569;
        font-size: 0.9rem;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        touch-action: manipulation;
    }
    .dpad-btn.up { border-radius: 6px 6px 0 0; }
    .dpad-btn.down { border-radius: 0 0 6px 6px; }
    .dpad-btn.left { border-radius: 6px 0 0 6px; }
    .dpad-btn.right { border-radius: 0 6px 6px 0; }
    .dpad-btn:active {
        background-color: #f59e0b;
        color: #0f172a;
    }

    .tools-row {
        display: flex;
        gap: 6px;
    }
    .tool-btn {
        background-color: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .tool-btn:hover { background-color: #334155; }
    .load-label input { display: none; }

    .debug-toggle {
        font-size: 0.7rem;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
    }
    .debug-toggle input {
        accent-color: #f59e0b;
    }

    .action-btn {
        width: 90px;
        height: 70px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #0f172a;
        border: 2px solid #fbbf24;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        touch-action: manipulation;
        transition: transform 0.1s;
    }
    .action-btn:active {
        transform: scale(0.95);
        background: #d97706;
    }
    .action-hint {
        font-size: 0.65rem;
        font-weight: 900;
        opacity: 0.7;
    }
    .action-text {
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.5px;
    }
</style>