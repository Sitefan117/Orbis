<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</svelte:head>

<script lang="ts">
    // Relie l’état de Fraction Tower aux commandes, au décor et aux activités pédagogiques.
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
    import { createGameState } from '$lib/games/fractionstower2/game/GameState.svelte';
    import { CollisionEngine } from '$lib/games/fractionstower2/game/CollisionEngine';
    import { InteractionEngine } from '$lib/games/fractionstower2/game/InteractionEngine';
    import { FloorManager } from '$lib/games/fractionstower2/game/FloorManager';
    import ActivityModal from '$lib/games/fractionstower2/components/exercises/ActivityModal.svelte';
    import BossBattle from '$lib/games/fractionstower2/components/exercises/BossBattle.svelte';
    import BossFloor1 from '$lib/games/fractionstower2/components/exercises/BossFloor1.svelte';
    import CourseViewer from '$lib/games/fractionstower2/components/course/CourseViewer.svelte';
    import { languageState } from '$lib/games/fractionstower2/persistence/LanguageManager';
    import { SaveManager } from '$lib/games/fractionstower2/persistence/SaveManager';
    import { AudioManager } from '$lib/games/fractionstower2/audio/AudioManager';
    import { ProgressManager } from '$lib/games/fractionstower2/persistence/ProgressManager';


    const game = createGameState();
    let floor = $derived(FloorManager.getFloor(game.player.currentFloorId));
    let activeActivityId = $state<string | null>(null);
    let activeBossFloorId = $state<string | null>(null);
    let activeCourseFloorId = $state<string | null>(null);
    let keys = new Set<string>();
    let isWalking = $state(false);
    let walkFrame = $state(false);
    let guardMessage = $state<string | null>(null);
    let guardMessageTimer: ReturnType<typeof setTimeout> | undefined;

    // ==========================================
    // ⚙️ TAILLES DES ÉLÉMENTS DU JEU
    // ==========================================
    const heroWidth = 88;
    const heroHeight = 116;
    // ==========================================

    let viewportContainer = $state<HTMLElement | null>(null);
    let mapScale = $state(1);

    // Adapte le monde à la taille de l’écran sans modifier les coordonnées de jeu.
    function updateScale() {
        if (!viewportContainer || !floor) return;
        const availableWidth = viewportContainer.clientWidth;
        const availableHeight = viewportContainer.clientHeight;
        const scaleX = availableWidth / floor.width;
        const scaleY = availableHeight / floor.height;
        mapScale = Math.min(scaleX, scaleY);
    }

    let animTimer = 0;
    let movementStep = 1;

    const npcArtwork: Record<string, { src: string; alt: string; width: number; height: number }> = {
        'course-intro': {
            src: `${base}/fractionstower2/characters/guide-owl.png`,
            alt: 'Astre, la chouette professeure', width: 94, height: 108
        },
        'classic-course-intro': {
            src: `${base}/fractionstower2/characters/guide-classic.png`,
            alt: 'La guide des cours classiques', width: 88, height: 116
        },
        'training-intro': {
            src: `${base}/fractionstower2/characters/trainer-fox.png`,
            alt: 'Renard, le coach d’entraînement', width: 100, height: 108
        },
        'boss-intro': {
            src: `${base}/fractionstower2/characters/boss-dragon.png`,
            alt: 'Le dragon gardien du défi', width: 112, height: 108
        }
    };

    // Un décor local par compétence ; les coordonnées, collisions et interactions restent celles du moteur.
    const floorArtwork: Record<string, string> = {
        'floor-1': `${base}/fractionstower2/floors/01-partage.jpg`,
        'floor-2': `${base}/fractionstower2/floors/02-representations.jpg`,
        'floor-3': `${base}/fractionstower2/floors/03-droite-graduee.jpg`,
        'floor-4': `${base}/fractionstower2/floors/04-equivalences.jpg`,
        'floor-5': `${base}/fractionstower2/floors/05-comparer.jpg`,
        'floor-6': `${base}/fractionstower2/floors/06-decimaux.jpg`,
        'floor-7': `${base}/fractionstower2/floors/07-addition.jpg`,
        'floor-8': `${base}/fractionstower2/floors/08-denominateurs.jpg`,
        'floor-9': `${base}/fractionstower2/floors/09-multiplication.jpg`
    };

    function safePlayAudio(soundName: string) {
        if (typeof (AudioManager as any).play === 'function') {
            (AudioManager as any).play(soundName);
        } else if (typeof AudioManager.playClick === 'function') {
            AudioManager.playClick();
        }
    }

    function getNpcArtwork(action?: string) {
        return npcArtwork[action ?? ''] ?? npcArtwork['course-intro'];
    }

    function getPortalLabel(type: 'stairs' | 'elevator', direction?: 'up' | 'down'): string {
        if (languageState.current !== 'fr-FR') {
            return type === 'elevator' ? 'Коды' : direction === 'up' ? 'Вверх' : 'Вниз';
        }
        return type === 'elevator' ? 'Codes des étages' : direction === 'up' ? 'Monter' : 'Descendre';
    }

    function getSectorInfo(action?: string) {
        const isFrench = languageState.current === 'fr-FR';
        const sectors: Record<string, { title: string; icon: string; theme: string }> = {
            'course-intro': { title: isFrench ? 'THÉORIE' : 'ТЕОРИЯ', icon: '✦', theme: 'theory' },
            'training-intro': { title: isFrench ? 'ENTRAÎNEMENT' : 'ТРЕНИРОВКА', icon: '◈', theme: 'training' },
            'boss-intro': { title: isFrench ? 'DÉFI DU BOSS' : 'БОСС', icon: '♜', theme: 'boss' },
            'classic-course-intro': { title: isFrench ? 'COURS PAPIER' : 'УЧЕБНИК', icon: '▤', theme: 'paper' }
        };
        return sectors[action ?? ''] ?? sectors['course-intro'];
    }

    function showGuardMessage(kind: 'locked' | 'top' | 'bottom' | 'ready' = 'locked') {
        const messages = languageState.current === 'fr-FR'
            ? {
                locked: 'Halte ! Bats le boss de cet étage pour monter.',
                top: 'Tu es au sommet de la tour : il n’y a pas d’étage au-dessus.',
                bottom: 'Tu es au premier étage : il n’y a pas de niveau plus bas.',
                ready: 'Le passage est ouvert. Tu peux monter.'
            }
            : {
                locked: 'Стой! Победи босса этого этажа, чтобы подняться.',
                top: 'Ты на вершине башни: выше этажей нет.',
                bottom: 'Это первый этаж: этажей ниже нет.',
                ready: 'Путь открыт. Можешь подняться.'
            };
        guardMessage = messages[kind];
        if (guardMessageTimer) clearTimeout(guardMessageTimer);
        guardMessageTimer = setTimeout(() => guardMessage = null, 3600);
    }

    function hasDefeatedCurrentBoss() {
        const defeated = game.defeatedBosses;
        return game.debugMode || Boolean(defeated && (
            typeof defeated.has === 'function'
                ? defeated.has(game.player.currentFloorId)
                : (defeated as any)[game.player.currentFloorId]
        ));
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
        const onOrientationChange = () => window.setTimeout(updateScale, 200);
        window.addEventListener('orientationchange', onOrientationChange);
        const touchDevice = window.matchMedia('(pointer: coarse)').matches;
        movementStep = touchDevice ? 2 : 1;
        let frameId = 0;
        let lastUpdate = 0;

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

        function loop(time: number) {
            if (time - lastUpdate >= (touchDevice ? 30 : 15)) {
                update();
                lastUpdate = time;
            }
            frameId = requestAnimationFrame(loop);
        }
        frameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', updateScale);
            window.removeEventListener('orientationchange', onOrientationChange);
            cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (guardMessageTimer) clearTimeout(guardMessageTimer);
        };
    });

    // Les interactions ouvrent les escaliers, l’ascenseur ou l’activité sélectionnée.
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
            } else if (interaction.type === 'object' && interaction.action === 'stair-guard') {
                const currentNum = Number(game.player.currentFloorId.split('-')[1]);
                showGuardMessage(
                    !FloorManager.getFloor(`floor-${currentNum + 1}`) ? 'top' :
                    hasDefeatedCurrentBoss() ? 'ready' : 'locked'
                );
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
            if (!FloorManager.getFloor(interaction.destination)) {
                safePlayAudio('click');
                showGuardMessage('top');
                return;
            }
            if (hasDefeatedCurrentBoss()) {
                safePlayAudio('stairs');
                game.changeFloor(interaction.destination);
            } else {
                safePlayAudio('click');
                showGuardMessage('locked');
            }
        } else if (currentNum === 1) {
            safePlayAudio('click');
            showGuardMessage('bottom');
        } else {
            safePlayAudio('stairs');
            game.changeFloor(interaction.destination);
        }
    }

    function handleElevator() {
        const target = prompt(languageState.current === 'fr-FR' 
            ? "Vers quel étage souhaites-tu aller ? (1-9)"
            : "На какой этаж вы хотите отправиться? (1-9)");
        if (!target) return;
        const floorNum = parseInt(target);
        if (isNaN(floorNum) || floorNum < 1 || floorNum > 9) {
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

    // La sauvegarde et le chargement délèguent au gestionnaire commun du jeu.
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
            dy = -game.player.speed * movementStep;
            if (game.player.direction !== 'up') game.setDirection('up');
        } else if (keys.has('ArrowDown') || keys.has('s')) {
            dy = game.player.speed * movementStep;
            if (game.player.direction !== 'down') game.setDirection('down');
        }
        if (keys.has('ArrowLeft') || keys.has('q') || keys.has('a')) {
            dx = -game.player.speed * movementStep;
            if (game.player.direction !== 'left') game.setDirection('left');
        } else if (keys.has('ArrowRight') || keys.has('d')) {
            dx = game.player.speed * movementStep;
            if (game.player.direction !== 'right') game.setDirection('right');
        }

        isWalking = (dx !== 0 || dy !== 0);

        if (isWalking) {
            animTimer += 1;
            if (animTimer >= (movementStep === 2 ? 4 : 7)) {
                walkFrame = !walkFrame;
                animTimer = 0;
            }
        } else {
            animTimer = 0;
            walkFrame = false;
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

<!-- Superpose les activités au jeu et dessine le monde courant avec ses zones interactives. -->
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
                <a class="tool-btn orbis-home-btn" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base} aria-label="Retour aux jeux">↩ Orbis</a>
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
            {@const floorBackground = floorArtwork[floor.id]}
            <div 
                class="world"
                style="
                    width: {floor.width}px; 
                    height: {floor.height}px; 
                    transform: scale({mapScale});
                    transform-origin: center center;
                    background-image: url('{floorBackground}');
                    background-repeat: no-repeat;
                    background-position: center center;
                    background-size: cover;
                "
            >
                <!-- Les repères suivent les escaliers et le parchemin dessinés dans le décor. -->
                {#each floor.interactions as inter}
                    {#if inter.type === 'stairs'}
                        {@const isAscending = Boolean(inter.destination && parseInt(inter.destination.split('-')[1]) > parseInt(game.player.currentFloorId.split('-')[1]))}
                        {@const portalLabel = getPortalLabel('stairs', isAscending ? 'up' : 'down')}
                        <div class="portal-marker stairs-marker" style="left: {inter.x}px; top: {isAscending ? inter.y + inter.height - 25 : inter.y + 4}px; width: {inter.width}px;" role="img" aria-label={portalLabel}>
                            <span class="portal-symbol" aria-hidden="true">{isAscending ? '↑' : '↓'}</span>
                            <span class="portal-label">{portalLabel}</span>
                        </div>
                    {:else if inter.type === 'elevator'}
                        {@const portalLabel = getPortalLabel('elevator')}
                        <div class="portal-marker scroll-marker" style="left: {inter.x - 16}px; top: {inter.y + inter.height - 24}px; width: {inter.width + 32}px;" role="img" aria-label={portalLabel}>
                            <span class="portal-symbol" aria-hidden="true">✦</span>
                            <span class="portal-label">{portalLabel}</span>
                        </div>
                    {/if}

                    {#if inter.type === 'pedagogical'}
                        {@const npc = getNpcArtwork(inter.action)}
                        {@const sector = getSectorInfo(inter.action)}
                        <div class="npc-sector sector-{sector.theme}" style="left: {inter.x - 25}px; top: {inter.y - 34}px;">
                            <span class="sector-name"><span aria-hidden="true">{sector.icon}</span>{sector.title}</span>
                            <span class="sector-ground" aria-hidden="true"></span>
                            <img
                                class="character-art npc-art"
                                src={npc.src}
                                alt={npc.alt}
                                draggable="false"
                                style="left: {25 + (inter.width - npc.width) / 2}px; top: 38px; width: {npc.width}px; height: {npc.height}px;"
                            />
                        </div>
                    {:else if inter.type === 'object' && inter.action === 'stair-guard'}
                        <div class="guard-zone" style="left: {inter.x - 30}px; top: {inter.y - 20}px;">
                            {#if guardMessage}
                                <div class="guard-message" role="status">{guardMessage}</div>
                            {/if}
                            <img
                                class="character-art guard-art"
                                src={`${base}/fractionstower2/characters/stair-guardian.png`}
                                alt="Gardien de l’escalier nord"
                                draggable="false"
                                style="left: 28px; top: 20px; width: 86px; height: 91px;"
                            />
                            <span class="guard-name">GARDIEN</span>
                        </div>
                    {/if}
                {/each}

                <!-- PERSONNAGE PRINCIPAL -->
                <img
                    class="character-art player-art"
                    class:walking={isWalking}
                    src={`${base}/fractionstower2/characters/${isWalking && walkFrame ? 'hero-step' : 'hero'}.png`}
                    alt="Héros de Fraction Tower"
                    draggable="false"
                    style="left: {game.player.position.x + 30 - heroWidth / 2}px; top: {game.player.position.y + 50 - heroHeight}px; --facing: {game.player.direction === 'left' ? -1 : 1}; width: {heroWidth}px; height: {heroHeight}px;"
                />

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
	/* Styles du plateau de jeu et de ses commandes tactiles. */
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
    .orbis-home-btn { text-decoration: none; }
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
        overflow: hidden;
        box-shadow: 0 0 25px rgba(0, 0, 0, 0.8);
        transition: transform 0.1s ease-out;
    }

    .character-art {
        position: absolute;
        display: block;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
        transform-origin: center bottom;
        transform: scaleX(var(--facing, 1));
        filter: drop-shadow(0 4px 5px rgba(22, 16, 11, 0.38));
    }
    .npc-art {
        z-index: 8;
    }
    .player-art {
        z-index: 10;
    }
    .player-art.walking {
        animation: hero-walk-bob 230ms ease-in-out infinite alternate;
    }
    @keyframes hero-walk-bob { from { transform: translateY(0) scaleX(var(--facing, 1)); } to { transform: translateY(-4px) scaleX(var(--facing, 1)); } }
    .npc-sector {
        position: absolute;
        z-index: 7;
        width: 125px;
        height: 155px;
        border: 1px solid color-mix(in srgb, var(--sector-tone) 46%, transparent);
        border-radius: 64px 64px 20px 20px;
        background: linear-gradient(180deg, color-mix(in srgb, var(--sector-tone) 11%, transparent), transparent 78%);
        pointer-events: none;
    }
    .sector-theory { --sector-tone: #497d96; }
    .sector-training { --sector-tone: #55865d; }
    .sector-boss { --sector-tone: #aa6550; }
    .sector-paper { --sector-tone: #a17c43; }
    .sector-name {
        position: absolute;
        z-index: 2;
        top: 7px;
        left: 50%;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 8px;
        transform: translateX(-50%);
        border: 1px solid color-mix(in srgb, var(--sector-tone) 45%, #fff8e8);
        border-radius: 999px;
        color: #392f26;
        background: rgba(255, 249, 232, 0.94);
        box-shadow: 0 2px 5px rgba(43, 31, 20, 0.2);
        font-size: 0.57rem;
        font-weight: 900;
        letter-spacing: 0.045em;
        white-space: nowrap;
    }
    .sector-name span {
        color: var(--sector-tone);
        font-size: 0.75rem;
    }
    .sector-ground {
        position: absolute;
        left: 50%;
        bottom: 9px;
        width: 92px;
        height: 24px;
        transform: translateX(-50%);
        border: 1px solid color-mix(in srgb, var(--sector-tone) 52%, transparent);
        border-radius: 50%;
        background: color-mix(in srgb, var(--sector-tone) 20%, rgba(255, 250, 232, 0.5));
        box-shadow: inset 0 2px 5px rgba(255, 255, 255, 0.22), 0 2px 5px rgba(40, 30, 20, 0.14);
    }
    .guard-zone {
        position: absolute;
        z-index: 9;
        width: 145px;
        height: 135px;
        pointer-events: none;
    }
    .guard-art { z-index: 9; }
    .guard-name {
        position: absolute;
        left: 31px;
        bottom: 0;
        padding: 3px 7px;
        border: 1px solid rgba(217, 174, 89, 0.7);
        border-radius: 999px;
        color: #fff5d9;
        background: rgba(42, 51, 47, 0.9);
        font-size: 0.53rem;
        font-weight: 900;
        letter-spacing: 0.06em;
    }
    .guard-message {
        position: absolute;
        z-index: 20;
        top: -22px;
        left: -64px;
        width: 245px;
        box-sizing: border-box;
        padding: 9px 12px;
        border: 1px solid #e4c47b;
        border-radius: 14px;
        color: #392f26;
        background: #fff7e5;
        box-shadow: 0 6px 18px rgba(32, 24, 17, 0.3);
        font-size: 0.76rem;
        font-weight: 750;
        line-height: 1.3;
        text-align: center;
    }
    .portal-marker {
        position: absolute;
        z-index: 5;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        box-sizing: border-box;
        color: #fff8e9;
        pointer-events: none;
        text-align: center;
    }
    .stairs-marker {
        flex-direction: row;
        justify-content: center;
        height: 24px;
        border: 0;
        border-radius: 999px;
        background: rgba(42, 47, 41, 0.76);
        box-shadow: 0 2px 6px rgba(32, 24, 17, 0.26);
    }
    .scroll-marker {
        flex-direction: row;
        justify-content: center;
        height: 24px;
        border: 0;
        border-radius: 999px;
        background: rgba(42, 47, 41, 0.74);
        box-shadow: 0 2px 6px rgba(32, 24, 17, 0.25);
    }
    .portal-symbol {
        color: #ffd477;
        font-size: 0.7rem;
        font-weight: 800;
        line-height: 1;
        text-shadow: 0 1px 3px rgba(255, 188, 61, 0.45);
    }
    .portal-label {
        font-size: 0.57rem;
        font-weight: 800;
        line-height: 1;
        white-space: nowrap;
    }
    @media (prefers-reduced-motion: reduce) {
        .player-art.walking { animation: none; }
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
