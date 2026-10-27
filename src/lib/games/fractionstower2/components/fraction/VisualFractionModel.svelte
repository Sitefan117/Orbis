<script lang="ts">
  import type { VisualFractionOption } from '$lib/games/fractionstower2/engines/ExerciseGenerator';

  let { model }: { model: VisualFractionOption } = $props();

  const totalWeight = $derived(model.partWeights.reduce((sum, weight) => sum + weight, 0));

  function wedgePath(index: number): string {
    const startWeight = model.partWeights.slice(0, index).reduce((sum, weight) => sum + weight, 0);
    const endWeight = startWeight + model.partWeights[index];
    const startAngle = -Math.PI / 2 + (startWeight / totalWeight) * Math.PI * 2;
    const endAngle = -Math.PI / 2 + (endWeight / totalWeight) * Math.PI * 2;
    const center = 60;
    const radius = 48;
    const startX = center + radius * Math.cos(startAngle);
    const startY = center + radius * Math.sin(startAngle);
    const endX = center + radius * Math.cos(endAngle);
    const endY = center + radius * Math.sin(endAngle);
    const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;
    return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }
</script>

{#if model.shape === 'bar'}
  <div class="fraction-bar" role="img" aria-label={model.description}>
    {#each model.partWeights as weight, index}
      <span
        class="fraction-part"
        class:shaded={model.shadedParts.includes(index)}
        style={`flex-grow: ${weight}`}
      ></span>
    {/each}
  </div>
{:else}
  <svg class="fraction-circle" viewBox="0 0 120 120" role="img" aria-label={model.description}>
    {#each model.partWeights as _, index}
      <path d={wedgePath(index)} class:shaded={model.shadedParts.includes(index)} />
    {/each}
  </svg>
{/if}

<style>
  .fraction-bar {
    display: flex;
    width: 100%;
    height: 74px;
    overflow: hidden;
    border: 2px solid #887348;
    border-radius: 8px;
    background: #fffdf6;
  }

  .fraction-part {
    flex: 1 1 0;
    min-width: 0;
    border-right: 2px solid #fffdf6;
    background: #e6ddc9;
  }

  .fraction-part:last-child { border-right: 0; }
  .fraction-part.shaded { background: #5d8b75; }

  .fraction-circle {
    display: block;
    width: min(100%, 150px);
    margin: 0 auto;
  }

  .fraction-circle path {
    fill: #e6ddc9;
    stroke: #fffdf6;
    stroke-width: 1.5;
  }

  .fraction-circle path.shaded { fill: #5d8b75; }
</style>
