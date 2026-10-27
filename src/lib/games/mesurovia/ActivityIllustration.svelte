<script lang="ts">
  /** Illustrations vectorielles décoratives des activités de Mesurovia. */
  type ActivityArtKind = 'practice' | 'battle' | 'memory' | 'race' | 'table' | 'detective' | 'clock' | 'builder' | 'crest';

  export let kind: ActivityArtKind;
  export let reduceMotion = false;
</script>

<svg class={`activity-illustration art-${kind}`} class:motion-reduced={reduceMotion} viewBox="0 0 240 110" aria-hidden="true" focusable="false">
  {#if kind === 'practice'}
    <rect x="22" y="78" width="196" height="11" rx="5" fill="#9e7048" />
    <path d="M42 89v12m156-12v12" stroke="#765237" stroke-width="6" stroke-linecap="round" />
    <path d="M54 65V35q30-14 58 0v31q-28-14-58-1Zm58 0V35q29-14 58 0v30q-29-14-58 0Z" fill="#fff8df" stroke="#98754d" stroke-width="3" stroke-linejoin="round" />
    <path d="M112 36v31m-47-20h37m-37 8h28m41-8h25m-25 8h30" stroke="#9bac83" stroke-width="2" stroke-linecap="round" />
    <g class="art-float"><path d="m77 26 57-8 3 9-58 9Z" fill="#e7bd58" stroke="#8c6c36" stroke-width="2"/><path d="m134 18 8-1-5 10Z" fill="#80563a"/><circle cx="91" cy="25" r="2" fill="#fff0bf"/></g>
    <path class="art-sparkle" d="m185 25 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#f0c75f" />
  {:else if kind === 'battle'}
    <path d="M25 82 40 33l25-17 26 18 13 48Z" fill="#89927d" stroke="#4d604e" stroke-width="4" stroke-linejoin="round" />
    <path d="M46 43q10-11 20 0m-13 12h3m15 0h3" fill="none" stroke="#f5e5bc" stroke-width="4" stroke-linecap="round" />
    <g class="art-float"><rect x="113" y="28" width="43" height="61" rx="6" fill="#fff7df" stroke="#a27c4b" stroke-width="3"/><path d="M134 42v25m-11-13h22m-11-12 4 8-4 4-4-4Z" fill="none" stroke="#c55e51" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="art-float art-late"><path d="M174 36 194 21l20 15v34q-20 20-40 0Z" fill="#eac662" stroke="#95723d" stroke-width="3"/><path d="m184 49 7 7 13-15" fill="none" stroke="#fff8dd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
    <path class="art-sparkle" d="m107 15 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ef9a65" />
  {:else if kind === 'memory'}
    <g class="art-float"><rect x="40" y="20" width="56" height="70" rx="8" fill="#fff7df" stroke="#8f9b76" stroke-width="4"/><path d="M52 42h31M52 52h24m-24 13h31" stroke="#c4ad6b" stroke-width="4" stroke-linecap="round"/><path d="M55 75h26" stroke="#6f9c73" stroke-width="5" stroke-linecap="round"/></g>
    <g class="art-float art-late"><rect x="145" y="20" width="56" height="70" rx="8" fill="#57805e" stroke="#355e45" stroke-width="4"/><path d="M157 34h32M157 43h32M157 52h32M157 61h32M157 70h32" stroke="#8fb684" stroke-width="3" stroke-linecap="round"/><path d="M162 27h22" stroke="#e5c869" stroke-width="4" stroke-linecap="round"/></g>
    <path class="art-sparkle" d="m120 18 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#e7bb59" />
  {:else if kind === 'race'}
    <path d="M17 86q38-42 77-5t73-4q21-23 55-6" fill="none" stroke="#c9ad75" stroke-width="24" stroke-linecap="round"/>
    <path d="M17 86q38-42 77-5t73-4q21-23 55-6" fill="none" stroke="#fff1c7" stroke-width="16" stroke-linecap="round" stroke-dasharray="5 10"/>
    <g class="art-float"><path d="M49 39q6-18 25-16 18 2 20 23l-8 16H58Z" fill="#d8844d" stroke="#754c37" stroke-width="3"/><path d="m54 28 4-14 14 11m10 0 11-11 2 20" fill="#d8844d" stroke="#754c37" stroke-width="3" stroke-linejoin="round"/><circle cx="69" cy="39" r="2.5" fill="#45392f"/><circle cx="82" cy="39" r="2.5" fill="#45392f"/><path d="M69 48q7 6 14 0" fill="none" stroke="#754c37" stroke-width="2" stroke-linecap="round"/></g>
    <g class="art-float art-late"><rect x="176" y="22" width="42" height="39" rx="7" fill="#b67b48" stroke="#754c37" stroke-width="4"/><path d="m171 28 26-18 26 18Z" fill="#e4bb58" stroke="#754c37" stroke-width="4" stroke-linejoin="round"/><path d="M191 40h12v21h-12Z" fill="#714d37"/></g>
  {:else if kind === 'table'}
    <rect x="22" y="18" width="126" height="74" rx="7" fill="#4f785b" stroke="#345a43" stroke-width="4"/>
    <path d="M34 36h102M34 52h102M34 68h102M34 84h102M59 28v58m26-58v58m26-58v58" stroke="#d6e5c2" stroke-width="2" opacity=".9"/>
    <rect x="85" y="53" width="25" height="17" rx="3" fill="#f1cb66" stroke="#fff3c9" stroke-width="2"/>
    <g class="art-float"><rect x="166" y="55" width="50" height="34" rx="7" fill="#b77945" stroke="#754c35" stroke-width="4"/><path d="m159 58 32-24 32 24Z" fill="#dcaa53" stroke="#754c35" stroke-width="4" stroke-linejoin="round"/><path d="M184 66h14v23h-14Z" fill="#704b34"/><circle cx="191" cy="73" r="2" fill="#f4cf70"/></g>
    <path class="art-sparkle" d="m165 25 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#f2cb64" />
  {:else if kind === 'detective'}
    <path d="M35 29q41-20 78 0v54H35Z" fill="#fff5d9" stroke="#a18459" stroke-width="4"/>
    <path d="M48 43h49m-49 12h37m-37 12h44" stroke="#8a9b7b" stroke-width="4" stroke-linecap="round"/>
    <g class="art-float"><circle cx="151" cy="49" r="27" fill="#a9d5d5" fill-opacity=".72" stroke="#496d63" stroke-width="7"/><path d="m171 69 30 25" stroke="#8e5d3f" stroke-width="11" stroke-linecap="round"/><path d="m140 49 8 8 15-17" fill="none" stroke="#fff8dc" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
    <path class="art-sparkle" d="m205 20 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#e9bd5a" />
  {:else if kind === 'clock'}
    <circle cx="118" cy="55" r="42" fill="#fff3d0" stroke="#8b6743" stroke-width="6"/>
    <circle cx="118" cy="55" r="31" fill="#e8efda" stroke="#a9b58c" stroke-width="3"/>
    <path d="M118 34v22l17 11" fill="none" stroke="#526c54" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <g class="art-float"><circle cx="54" cy="38" r="13" fill="#d5a94e" stroke="#8b6743" stroke-width="4"/><circle cx="54" cy="38" r="4" fill="#fff1c8"/><circle cx="184" cy="76" r="18" fill="#d5a94e" stroke="#8b6743" stroke-width="4"/><circle cx="184" cy="76" r="6" fill="#fff1c8"/><path d="M54 20v-9m0 45v-9M36 38h-9m45 0h-9m103 0v-9m0 54v-9m-18-18h-9m45 0h-9" stroke="#8b6743" stroke-width="4" stroke-linecap="round"/></g>
  {:else if kind === 'builder'}
    <path d="M40 83V48l54-31 53 31v35Z" fill="#e6c889" stroke="#76553a" stroke-width="4" stroke-linejoin="round"/>
    <path d="m31 50 63-38 62 38" fill="none" stroke="#b65f4d" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M82 83V58q12-13 25 0v25m20-26h13v16h-13Z" fill="#8fbdc5" stroke="#76553a" stroke-width="3"/>
    <g class="art-float"><path d="M181 18v58m-19-42h38m-32 0 21 20" fill="none" stroke="#6e805a" stroke-width="5" stroke-linecap="round"/><rect x="174" y="62" width="27" height="19" rx="3" fill="#c87452" stroke="#754d39" stroke-width="3"/><path d="M174 71h27m-14-9v9" stroke="#f4d59a" stroke-width="2"/></g>
    <path class="art-sparkle" d="m194 27 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#f0cb67" />
  {:else}
    <path d="m120 10 18 17 26 4 8 24-8 24-26 4-18 17-18-17-26-4-8-24 8-24 26-4Z" fill="#f3d274" stroke="#9b773d" stroke-width="5" stroke-linejoin="round"/>
    <path d="m120 28 8 17 19 3-14 13 4 19-17-9-17 9 4-19-14-13 19-3Z" fill="#fff5d6" stroke="#c29948" stroke-width="3" stroke-linejoin="round"/>
    <path d="M86 80v20l18-9m50-11v20l-18-9" fill="#c56c52" stroke="#8a4c3d" stroke-width="3" stroke-linejoin="round"/>
    <path class="art-sparkle" d="m184 25 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fff0b0" />
  {/if}
</svg>

<style>
  .activity-illustration { display: block; width: 100%; height: 100%; overflow: hidden; border-radius: inherit; }
  .art-practice { background: #dce9d4; }
  .art-battle { background: #e8e6d4; }
  .art-memory { background: #dcebdc; }
  .art-race { background: #e4eed7; }
  .art-table { background: #e5edd8; }
  .art-detective { background: #e8ebdc; }
  .art-clock { background: #f1e8c8; }
  .art-builder { background: #e9e3cb; }
  .art-crest { background: #f2e4ac; }
  .art-float { transform-box: fill-box; transform-origin: center; animation: art-bob 3.8s ease-in-out infinite; }
  .art-late { animation-delay: .6s; }
  .art-sparkle { transform-box: fill-box; transform-origin: center; animation: art-twinkle 2.5s ease-in-out infinite; }
  .activity-illustration.motion-reduced .art-float,
  .activity-illustration.motion-reduced .art-sparkle { animation: none; }
  @keyframes art-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes art-twinkle { 0%, 100% { opacity: .7; scale: 1; } 50% { opacity: 1; scale: 1.12; } }
</style>
