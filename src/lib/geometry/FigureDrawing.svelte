<script lang="ts">
  import type { GeometryFigure } from './types';

  export let figure: GeometryFigure;
  export let large = false;
  /** Par défaut, le dessin n'annonce pas le nom de la figure : utile pendant une question. */
  export let showName = false;
</script>

<!-- Les fragments SVG sont statiques et proviennent exclusivement de figures.ts. -->
<svg
  viewBox="0 0 100 100"
  class:large
  role="img"
  aria-label={showName ? figure.name : 'Dessin géométrique'}
  focusable="false"
  xmlns="http://www.w3.org/2000/svg"
>
  <g stroke="currentColor" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" fill="none">
    {@html figure.svg}
  </g>
</svg>

<style>
  svg { display: block; width: 100%; height: 100%; overflow: visible; }
  svg.large { width: min(100%, 220px); height: 170px; }
</style>
