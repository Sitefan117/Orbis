<script lang="ts">
    /**
     * ============================================================================
     * [WORLD] GameEnvironment.svelte
     * ============================================================================
     * Utilisation directe de ton image fixe située dans static/heros.png
     * ============================================================================
     */
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';

    const worldWidth = 600;
    const worldHeight = 400;
    const playerSize = 48; // Taille de l'image à l'écran

    // Position initiale au centre de la pièce
    let playerX = $state(worldWidth / 2);
    let playerY = $state(worldHeight / 2);
    
    // Orientation du personnage ('right' ou 'left')
    let facing = $state<'right' | 'left'>('right');
    
    let moveTimer: ReturnType<typeof setTimeout>;

    function handleKeyDown(e: KeyboardEvent) {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(e.key)) return;
        e.preventDefault();

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
                playerY -= playerSize;
                break;
            case 'ArrowDown':
            case 's':
                playerY += playerSize;
                break;
            case 'ArrowLeft':
            case 'a':
                playerX -= playerSize;
                facing = 'left'; // Retourne l'image horizontalement
                break;
            case 'ArrowRight':
            case 'd':
                playerX += playerSize;
                facing = 'right';
                break;
        }

        // --- COLLISIONS AVEC LES MURS ---
        if (playerX < playerSize / 2) playerX = playerSize / 2;
        if (playerX > worldWidth - playerSize / 2) playerX = worldWidth - playerSize / 2;
        if (playerY < playerSize / 2) playerY = playerSize / 2;
        if (playerY > worldHeight - playerSize / 2) playerY = worldHeight - playerSize / 2;

        clearTimeout(moveTimer);
        moveTimer = setTimeout(() => {
            AudioManager.playClick();
        }, 50);
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    });
</script>

<div class="flex flex-col items-center gap-6 p-8 bg-slate-950">
    <div class="text-center text-slate-400 font-mono text-sm max-w-sm">
        Utilise les <b>flèches directionnelles</b> ou <b>ZQSD</b> pour déplacer ton personnage.
    </div>

    <!-- Le monde de jeu (pièce fermée) -->
    <div class="relative overflow-hidden border-4 border-slate-700 rounded-3xl shadow-xl bg-slate-900" 
         style="width: {worldWidth}px; height: {worldHeight}px;">
        
        <!-- Sol carrelé -->
        <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px]"></div>

        <!-- Murs -->
        <div class="absolute top-0 left-0 h-4 bg-slate-700 w-full rounded-t-lg"></div>
        <div class="absolute bottom-0 left-0 h-4 bg-slate-700 w-full rounded-b-lg"></div>
        <div class="absolute top-0 left-0 w-4 bg-slate-700 h-full rounded-l-lg"></div>
        <div class="absolute top-0 right-0 w-4 bg-slate-700 h-full rounded-r-lg"></div>

        <!-- PERSONNAGE : Utilisation stricte de heros.png -->
        <div class="absolute z-10 transition-transform duration-75 {facing === 'left' ? 'scale-x-[-1]' : ''}" 
             style="width: {playerSize}px; height: {playerSize}px; 
                    transform: translate(-50%, -50%) translate({playerX}px, {playerY}px);">
            
            <img 
                src="{base}/heros.png" 
                alt="Héros" 
                class="w-full h-full object-contain select-none drop-shadow-md"
            />
        </div>
    </div>
</div>