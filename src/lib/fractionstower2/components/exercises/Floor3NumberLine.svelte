<script lang="ts">
    let { denominator = 4, selectedNumerator = null, onSelect } = $props<{ denominator: number; selectedNumerator: number | null; onSelect: (numerator: number) => void }>();
    const ticks = $derived(Array.from({ length: denominator + 1 }, (_, i) => i));
</script>
<div class="interactive-line" role="group" aria-label={`Droite de 0 à 1 partagée en ${denominator} intervalles. Choisis une graduation.`}>
    <div class="track"></div>
    {#each ticks as tick}
        <button type="button" class:selected={selectedNumerator === tick} class="tick-button" style={`left:${tick / denominator * 100}%`} onclick={() => onSelect(tick)} aria-label={tick === 0 ? 'Choisir zéro' : tick === denominator ? 'Choisir un, fin de l’unité' : `Choisir ${tick} sur ${denominator}`}>
            <span class="tick"></span>
            {#if tick === 0}<span class="label">0</span>{:else if tick === denominator}<span class="label">1</span>{/if}
        </button>
    {/each}
</div>
<p class="hint">Clique sur le trait où tu placerais la fraction.</p>
<style>
.interactive-line{position:relative;height:76px;margin:18px 14px 0}.track{position:absolute;left:0;right:0;top:20px;height:3px;background:#334155}.tick-button{position:absolute;top:8px;transform:translateX(-50%);width:28px;height:42px;border:0;background:transparent;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center}.tick{width:2px;height:25px;background:#334155;flex-shrink:0}.tick-button.selected .tick{width:5px;background:#dc2626}.tick-button.selected::after{content:'●';position:absolute;top:-7px;color:#dc2626;font-size:18px}.label{position:absolute;top:34px;color:#172033;font-size:13px;font-weight:700}.hint{text-align:center;color:#475569;font-size:.9rem;margin:.25rem 0 0}.tick-button:focus-visible{outline:3px solid #f59e0b;outline-offset:2px;border-radius:5px}
</style>