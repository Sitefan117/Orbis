<script lang="ts">
  /** Petits dessins vectoriels des objets que l’on retrouve pendant les mini-jeux. */
  type GameObjectKind = 'guardian' | 'fox' | 'chest' | 'detective' | 'clock' | 'brick';

  export let kind: GameObjectKind;
  export let reduceMotion = false;
  export let open = false;
  export let completed = false;
</script>

<svg class={`game-object-art object-${kind}`} class:motion-reduced={reduceMotion} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  {#if kind === 'guardian'}
    <!-- Gardien de pierre, avec casque et bouclier du village. -->
    <path d="M19 80 24 45q4-26 27-29 26 1 30 30l5 34Z" fill="#8b927b" stroke="#4c604f" stroke-width="5" stroke-linejoin="round" />
    <path d="M20 47q30-20 60 0l-5-22q-25-20-50 0Z" fill="#b3a46f" stroke="#4c604f" stroke-width="5" stroke-linejoin="round" />
    <path d="M36 53h4m20 0h4" stroke="#344738" stroke-width="5" stroke-linecap="round" />
    <path d="M42 66q8 7 16 0" fill="none" stroke="#344738" stroke-width="4" stroke-linecap="round" />
    <path d="M8 56 18 48l10 8v20q-10 10-20 0Z" fill="#dfbd61" stroke="#795e3e" stroke-width="4" stroke-linejoin="round" />
    <path d="m18 57 3 6-3 6-3-6Z" fill="#fff3c5" />
  {:else if kind === 'fox'}
    <!-- Renard rival, dessiné comme un petit personnage qui court. -->
    <g class="object-bob">
      <path d="M30 58q-22-3-18-25 5 10 17 8 13 1 19 15Z" fill="#c85f42" stroke="#754936" stroke-width="4" stroke-linejoin="round" />
      <path d="M20 39q-10-6-8-18l16 8 12-12 8 19q21-9 33 7l-6 23q-14 18-39 8L23 80l-5-5 12-7q-8-9-10-19Z" fill="#dd824c" stroke="#754936" stroke-width="4" stroke-linejoin="round" />
      <path d="m29 26 2-17 15 15m14 4 14-13 1 23" fill="#dd824c" stroke="#754936" stroke-width="4" stroke-linejoin="round" />
      <path d="M62 47q13-5 21 4-6 11-20 8Z" fill="#fff1d7" />
      <circle cx="55" cy="42" r="3" fill="#3b322c" /><circle cx="72" cy="48" r="2.5" fill="#3b322c" />
      <path d="m79 50 8 3-8 4" fill="#593b30" />
      <path d="m34 73-6 11m36-9 5 10" stroke="#754936" stroke-width="5" stroke-linecap="round" />
    </g>
  {:else if kind === 'chest'}
    <!-- Coffre dont le couvercle se soulève quand la bonne réponse est trouvée. -->
    {#if open}<path class="chest-glow" d="m17 32 8-14 10 9 15-15 15 15 11-9 8 14" fill="none" stroke="#efc85c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />{/if}
    <path d="M17 45h66v36H17Z" fill="#a96c3e" stroke="#67462f" stroke-width="5" stroke-linejoin="round" />
    <path d="M12 43q4-19 20-20h36q16 1 20 20v8H12Z" class:lid-open={open} fill="#d49a4d" stroke="#67462f" stroke-width="5" stroke-linejoin="round" />
    <path d="M21 56h58M25 70h50" stroke="#754c33" stroke-width="5" stroke-linecap="round" />
    <path d="M43 54h14v18H43Z" fill="#efce67" stroke="#785832" stroke-width="3" />
    <circle cx="50" cy="62" r="2.5" fill="#715238" />
  {:else if kind === 'detective'}
    <!-- Jeune enquêtrice avec loupe pour examiner les unités. -->
    <g class="object-bob">
      <path d="M25 83q3-27 25-30 24 3 27 30Z" fill="#5c7b67" stroke="#405c4b" stroke-width="5" stroke-linejoin="round" />
      <path d="M28 49q2-24 23-25 22 2 23 26l-6 13H34Z" fill="#f1cba1" stroke="#704c3b" stroke-width="4" stroke-linejoin="round" />
      <path d="M25 39q6-21 28-21 20 0 25 20l-13 4-10-8-13 8Z" fill="#a66e4a" stroke="#704c3b" stroke-width="4" stroke-linejoin="round" />
      <circle cx="43" cy="48" r="2.5" fill="#49372f" /><circle cx="59" cy="48" r="2.5" fill="#49372f" />
      <path d="M45 57q7 5 13 0" fill="none" stroke="#9f5d4c" stroke-width="3" stroke-linecap="round" />
    </g>
    <circle cx="76" cy="69" r="15" fill="#c9e8e4" fill-opacity=".8" stroke="#496d63" stroke-width="5" />
    <path d="m87 81 8 9" stroke="#80543c" stroke-width="7" stroke-linecap="round" />
  {:else if kind === 'clock'}
    <!-- Horloge en bois et engrenage du moulin. -->
    <path d="M19 87V28L50 12l31 16v59Z" fill="#c79254" stroke="#704d36" stroke-width="5" stroke-linejoin="round" />
    <path d="M12 31 50 8l38 23" fill="none" stroke="#704d36" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="50" cy="51" r="23" fill="#fff4d5" stroke="#795b3d" stroke-width="5" />
    <path d="M50 36v16l12 8" fill="none" stroke="#536b52" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <g class="object-gear"><circle cx="75" cy="77" r="12" fill="#e2bb5f" stroke="#715438" stroke-width="4" /><circle cx="75" cy="77" r="4" fill="#fff2c6" />{#each [0, 60, 120] as angle}<path transform={`rotate(${angle} 75 77)`} d="M73 60h4v6h-4Z" fill="#715438" />{/each}</g>
  {:else}
    <!-- Brique de chantier, pleine une fois le défi résolu. -->
    <g class:brick-complete={completed} class="brick-shape">
      <path d="M13 28q0-8 8-8h58q8 0 8 8v45q0 8-8 8H21q-8 0-8-8Z" fill="#c97655" stroke="#784b3a" stroke-width="5" />
      <path d="M17 46h66m-45-25v24m28 1v19M28 66h55" fill="none" stroke="#f1cba0" stroke-width="4" stroke-linecap="round" />
      <path d="m37 36 12-7m16 27 13-7" stroke="#e5a07b" stroke-width="3" stroke-linecap="round" />
    </g>
  {/if}
</svg>

<style>
  .game-object-art { display: block; width: 100%; height: 100%; overflow: visible; }
  .object-bob { transform-box: fill-box; transform-origin: center bottom; animation: object-bob 3.6s ease-in-out infinite; }
  .object-gear { transform-box: fill-box; transform-origin: center; animation: object-turn 12s linear infinite; }
  .chest-glow { animation: chest-glow 1.4s ease-in-out infinite alternate; }
  .lid-open { transform: translateY(-7px) rotate(-8deg); transform-origin: 18px 49px; }
  .brick-shape { opacity: .42; }
  .brick-complete { opacity: 1; }
  .motion-reduced .object-bob, .motion-reduced .object-gear, .motion-reduced .chest-glow { animation: none; }
  @keyframes object-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
  @keyframes object-turn { to { transform: rotate(360deg); } }
  @keyframes chest-glow { from { opacity: .55; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .object-bob, .object-gear, .chest-glow { animation: none; }
  }
</style>
