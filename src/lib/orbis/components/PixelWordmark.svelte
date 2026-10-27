<script lang="ts">
  const glyphs = [
    ['0111110','1100011','1100011','1100011','1100011','1100011','1100011','1100011','0111110'],
    ['1111110','1100011','1100011','1111110','1111000','1101100','1100110','1100011','1100011'],
    ['1111110','1100011','1100011','1111110','1100011','1100011','1100011','1100011','1111110'],
    ['1111111','0011100','0011100','0011100','0011100','0011100','0011100','0011100','1111111'],
    ['0111111','1100000','1100000','0111110','0000011','0000011','1100011','1100011','0111110']
  ];
  const pixels = glyphs.flatMap((glyph, letter) => glyph.flatMap((row, y) => Array.from(row).flatMap((value, x) => value === '1' ? [{ x: letter * 90 + x * 10, y: y * 10 }] : [])));
</script>

<svg class="pixel-wordmark" viewBox="0 0 430 90" preserveAspectRatio="none" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
  {#each pixels as pixel}<rect x={pixel.x} y={pixel.y} width="10" height="10" fill="currentColor" />{/each}
</svg>

<style>
  .pixel-wordmark { display: block; width: 100%; height: auto; max-height: 220px; }
</style>
