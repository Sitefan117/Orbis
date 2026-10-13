<script lang="ts">
    import { onMount } from 'svelte';
    import { languageState } from '$lib/fractionstower2/persistence/LanguageManager';

    let { floorId, onClose } = $props<{
        floorId: string, // Ex: "floor-1", "floor-2", etc.
        onClose: () => void
    }>();

    let htmlContent = $state('<p>Chargement du cours...</p>');
    let canvas: HTMLCanvasElement | undefined = $state();
    let ctx: CanvasRenderingContext2D | null = null;
    let drawing = $state(false);

    // Chargement dynamique du fichier HTML selon l'emplacement exact dans static/fractionstower2/courses/
    $effect(() => {
        loadFloorCourse(floorId);
    });

    async function loadFloorCourse(id: string) {
        try {
            const floorNum = id.replace('floor-', '');

            // 1. ACTUEL : Charge le fichier complet unique depuis le bon dossier
            const response = await fetch('/fractionstower2/courses/support_etage_complet.html');

            // 2. FUTUR (quand vous découperez par étage) : 
            // const response = await fetch(`/fractionstower2/courses/support_etage_${floorNum}.html`);

            if (response.ok) {
                htmlContent = await response.text();
            } else {
                htmlContent = `<div class="bloc-theorie"><p>Fichier introuvable dans /static/fractionstower2/courses/support_etage_complet.html</p></div>`;
            }
        } catch (e) {
            htmlContent = `<p style="color: red;">Erreur lors du chargement du fichier HTML.</p>`;
        }
    }

    function startDrawing(e: MouseEvent | TouchEvent) {
        if (!ctx) return;
        drawing = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function stopDrawing() {
        drawing = false;
    }

    function draw(e: MouseEvent | TouchEvent) {
        if (!drawing || !ctx) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function getPos(e: MouseEvent | TouchEvent) {
        const rect = canvas!.getBoundingClientRect();
        let clientX, clientY;
        if (e instanceof MouseEvent) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function clearCanvas() {
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    onMount(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);

        if (canvas) {
            ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#ffcc00';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
            }
        }
        return () => window.removeEventListener('keydown', handleEscape);
    });
</script>

<div class="course-overlay">
    <div class="course-window">
        <header>
            <h1>{languageState.current.startsWith('fr') ? 'Guide Académique (Cours Classique)' : 'Академический гид (Классический курс)'}</h1>
            <button class="close-btn" onclick={onClose}>✕</button>
        </header>

        <div class="main-layout">
            <div class="content-area">
                <div class="course-header">
                    <h2>Module : {floorId.toUpperCase()}</h2>
                </div>
                <!-- Le contenu HTML de votre fichier est injecté ici -->
                <div class="html-content">
                    {@html htmlContent}
                </div>
                <div class="input-zone">
                    <p>{languageState.current.startsWith('fr') ? 'Notes et réflexions personnelles :' : 'Личные заметки и размышления:'}</p>
                    <textarea placeholder="Écris tes notes ici..."></textarea>
                </div>
            </div>

            <div class="scribble-area">
                <div class="scribble-header">
                    <span>{languageState.current.startsWith('fr') ? 'Zone de brouillon' : 'Зона черновика'}</span>
                    <button class="clear-btn" onclick={clearCanvas}>🗑️</button>
                </div>
                <canvas 
                    bind:this={canvas} 
                    width="400" 
                    height="600" 
                    onmousedown={startDrawing} 
                    onmousemove={draw} 
                    onmouseup={stopDrawing}
                    ontouchstart={startDrawing} 
                    ontouchmove={draw} 
                    ontouchend={stopDrawing}
                ></canvas>
            </div>
        </div>
    </div>
</div>

<style>
    .course-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.8); z-index: 3000;
        display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px);
    }
    .course-window {
        background: #fdfdfd; color: #333; width: 90%; max-width: 1100px; height: 90vh;
        border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.5); overflow: hidden;
    }
    header { background: #1a237e; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    header h1 { margin: 0; font-size: 1.5rem; }
    .close-btn { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    .main-layout { display: flex; flex: 1; overflow: hidden; }
    .content-area { flex: 1; padding: 2rem; overflow-y: auto; background: white; }
    .course-header h2 { color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 10px; margin-bottom: 20px; }
    .html-content { line-height: 1.6; font-size: 1.05rem; }
    .input-zone { margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .input-zone textarea { width: 100%; height: 100px; margin-top: 10px; border: 1px solid #ccc; border-radius: 4px; padding: 10px; font-family: inherit; }
    .scribble-area { width: 420px; background: #eee; border-left: 2px solid #ccc; display: flex; flex-direction: column; align-items: center; padding: 10px; }
    .scribble-header { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-weight: bold; color: #666; }
    .clear-btn { background: white; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; padding: 2px 8px; }
    canvas { background: white; border: 1px solid #999; border-radius: 4px; cursor: crosshair; box-shadow: inset 0 0 10px rgba(0,0,0,0.1); }

    :global(.bloc-theorie) { background-color: #f1f8e9; border-left: 5px solid #2e7d32; padding: 15px; margin-bottom: 20px; border-radius: 6px; }
    :global(.bloc-exemple) { background-color: #e3f2fd; border-left: 5px solid #1976d2; padding: 15px; margin-bottom: 20px; border-radius: 6px; }
    :global(.fraction-display) { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; padding: 0 10px; margin: 10px 0; }
    :global(.fraction-display .line) { border-bottom: 2px solid #000; width: 100%; }
    :global(.consigne-ru) { font-style: italic; color: #555; }
    :global(.mot-cle-vert) { color: #2e7d32; font-weight: bold; }
    :global(.mot-cle-bleu) { color: #1976d2; font-weight: bold; }
</style>