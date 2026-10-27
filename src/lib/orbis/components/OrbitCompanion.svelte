<script lang="ts">
  import { onMount } from 'svelte';

  /** Supprime les mouvements, notamment lorsque le confort de lecture est actif. */
  export let reducedMotion = false;
  /** Suspend la veille et le suivi sans retirer le bouton du parcours clavier. */
  export let paused = false;
  /** Identifiant facultatif du bouton racine. */
  export let id: string | undefined = undefined;

  let surface: HTMLButtonElement;
  let systemReducedMotion = false;
  let yaw = 0;
  let pitch = 0;
  let eyeX = 0;
  let eyeY = 0;
  let greeting = false;
  let announcement = '';
  let greetingTimer: ReturnType<typeof setTimeout> | undefined;

  $: motionAllowed = !reducedMotion && !paused && !systemReducedMotion;
  $: if (!motionAllowed) {
    resetPose();
    greeting = false;
  }

  const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

  function resetPose() {
    yaw = 0;
    pitch = 0;
    eyeX = 0;
    eyeY = 0;
  }

  function lookAt(clientX: number, clientY: number) {
    if (!motionAllowed || !surface) return;
    const bounds = surface.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;
    const x = clamp((clientX - bounds.left - bounds.width / 2) / (bounds.width * 0.85), 1);
    const y = clamp((clientY - bounds.top - bounds.height * 0.43) / bounds.height, 1);
    yaw = x * 18;
    pitch = -y * 12;
    eyeX = x * 5;
    eyeY = y * 4;
  }

  function followMouse(event: PointerEvent) {
    if (event.pointerType === 'mouse') lookAt(event.clientX, event.clientY);
  }

  function followTouch(event: PointerEvent) {
    if (event.pointerType !== 'mouse') lookAt(event.clientX, event.clientY);
  }

  function releaseTouch(event: PointerEvent) {
    if (event.pointerType !== 'mouse') resetPose();
  }

  function greet() {
    if (greetingTimer !== undefined) clearTimeout(greetingTimer);
    announcement = 'Salut ! Prêt à explorer ?';
    greeting = motionAllowed;
    greetingTimer = setTimeout(() => {
      greeting = false;
      announcement = '';
      greetingTimer = undefined;
    }, 1250);
  }

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => { systemReducedMotion = preference.matches; };
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => {
      preference.removeEventListener('change', updatePreference);
      if (greetingTimer !== undefined) clearTimeout(greetingTimer);
    };
  });
</script>

<svelte:window on:pointermove={followMouse} on:blur={resetPose} />

<button
  {id}
  bind:this={surface}
  type="button"
  class="orbit-companion"
  class:motion-allowed={motionAllowed}
  class:greeting
  aria-label="Robot orbital Orbis"
  on:pointermove={followTouch}
  on:pointerdown={followTouch}
  on:pointerup={releaseTouch}
  on:pointercancel={resetPose}
  on:pointerleave={releaseTouch}
  on:blur={resetPose}
  on:click={greet}
  style={`--head-yaw:${yaw}deg;--head-pitch:${pitch}deg;--eye-x:${eyeX}px;--eye-y:${eyeY}px;`}
>
  <span class="companion-stage" aria-hidden="true">
    <svg class="workshop-grid" viewBox="0 0 280 260" fill="none">
      <path d="M28 42h224M28 218h224M52 20v220M228 20v220" />
      <path class="registration" d="M24 42h8m-4-4v8m220-4h8m-4-4v8M24 218h8m-4-4v8m220-4h8m-4-4v8" />
      <ellipse class="floor-shadow" cx="143" cy="222" rx="68" ry="7" />
      <path class="floor-line" d="M93 231h100" />
    </svg>

    <span class="robot-assembly">
      <svg class="robot-underlay" viewBox="0 0 280 260" fill="none">
        <ellipse class="orbit-back" cx="140" cy="131" rx="106" ry="32" transform="rotate(-17 140 131)" />
        <path class="body-side" d="m126 166 26-3 13 12-25 5-14-6z" />
        <path class="body-light" d="M126 168h29v15h-29z" />
        <path class="body-side" d="m155 168 8-5v14l-8 6z" />
        <path class="body-top" d="m105 183 47-7 24 14-47 9z" />
        <path class="body-light" d="m105 183 24 16v15l-24-16z" />
        <path class="body-side" d="m129 199 47-9v15l-47 9z" />
        <path class="body-seam" d="m134 203 33-6m-33 10 33-6" />
        <path class="accent-solid" d="m112 190 8 5v4l-8-5z" />
        <path class="body-foot" d="m116 207 12 8 30-6 9 5-39 9-19-12z" />
      </svg>

      <span class="robot-head-position">
        <span class="robot-head-greeting">
          <span class="robot-head">
            <svg class="head-shell" viewBox="0 0 176 156" fill="none">
              <path class="head-top" d="M24 16 132 4l28 18-110 14z" />
              <path class="head-side" d="m141 32 19-10v101l-19 16z" />
              <path class="head-front" d="M24 16h99l18 16v107H40l-16-15z" />
              <path class="head-bevel" d="M31 22h91l12 12v97H42l-11-11z" />
              <path class="head-screen-border" d="M43 43h71l14 12v54H55L43 98z" />
              <path class="head-screen" d="M48 49h63l11 9v45H57l-9-8z" />
              <path class="screen-reflection" d="M52 53h56l8 7" />
              <g class="robot-eyes">
                <path class="eye eye-left" d="M64 67h10v17H64z" />
                <path class="eye eye-right" d="M94 67h10v17H94z" />
                <path class="eye-glint" d="M64 67h10v3H64zm30 0h10v3H94z" />
              </g>
              <path class="mouth-line" d="M79 92h10" />
              <path class="head-detail" d="M49 119h35m-35 4h23m37-3h13" />
              <path class="accent-solid" d="M111 118h10v5h-10z" />
              <path class="head-fastener" d="m35 34 3 3m-3 0 3-3m87 88 3 3m-3 0 3-3" />
              <path class="side-vents" d="m147 48 6-3m-6 10 6-3m-6 10 6-3m-6 10 6-3" />
              <path class="head-hinge" d="M20 65h5v25h-5z" />
            </svg>
          </span>
        </span>
      </span>

      <svg class="robot-overlay" viewBox="0 0 280 260" fill="none">
        <path class="orbit-front" d="M41.2 158.7c11.7 16.6 66.2 16.7 121.8.1 55.5-16.5 91.1-43.3 79.4-59.8" />
        <g class="orbit-satellite">
          <path class="satellite-panel" d="m226 96 12-4 8 7-12 4z" />
          <path class="satellite-side" d="m234 103 12-4v6l-12 4z" />
          <path class="satellite-face" d="m226 96 8 7v6l-8-7z" />
          <path class="satellite-signal" d="m232 96 4-1" />
        </g>
      </svg>
    </span>

    <span class="companion-caption"><span class="status-square"></span>OR / 01<span class="caption-line"></span><span class="caption-action">Saluer ↗</span></span>
  </span>
  <span class="companion-announcement" aria-live="polite">{announcement}</span>
</button>

<style>
  .orbit-companion {
    --robot-paper: var(--orbis-paper, #ecece7);
    --robot-ink: var(--orbis-ink, #242620);
    --robot-muted: var(--orbis-muted, #61645b);
    --robot-line: var(--orbis-line, #c4c6bc);
    --robot-orange: var(--orbis-orange, #b83f1d);
    width: min(100%, 280px);
    aspect-ratio: 14 / 13;
    display: block;
    position: relative;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--robot-ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: rgb(184 63 29 / 12%);
  }

  .orbit-companion:focus-visible {
    outline: 2px solid var(--robot-orange);
    outline-offset: 5px;
  }

  .companion-stage,
  .robot-assembly,
  .robot-underlay,
  .robot-overlay,
  .workshop-grid {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .workshop-grid { stroke: var(--robot-line); stroke-width: .7; }
  .workshop-grid .registration { stroke: var(--robot-muted); stroke-width: .9; }
  .workshop-grid .floor-shadow { fill: var(--robot-ink); opacity: .075; stroke: none; }
  .workshop-grid .floor-line { opacity: .65; }

  .robot-assembly { transform: translateY(0); }
  .motion-allowed .robot-assembly { animation: orbital-wait 7s ease-in-out infinite; }

  .robot-underlay,
  .robot-overlay,
  .head-shell {
    overflow: visible;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .orbit-back,
  .orbit-front { stroke: var(--robot-orange); stroke-width: 1.5; }
  .orbit-back { opacity: .45; }
  .orbit-front { stroke-width: 1.8; }
  .body-top { fill: #f4f4ed; stroke: var(--robot-ink); stroke-width: 1.15; }
  .body-light { fill: #dddcd2; stroke: var(--robot-ink); stroke-width: 1.15; }
  .body-side { fill: #a8ab9e; stroke: var(--robot-ink); stroke-width: 1.15; }
  .body-seam { stroke: #6b7061; stroke-width: 1; }
  .body-foot { fill: var(--robot-ink); stroke: var(--robot-ink); }
  .accent-solid { fill: var(--robot-orange); stroke: none; }

  .robot-head-position {
    position: absolute;
    display: block;
    width: 62.857%;
    height: 60%;
    top: 14.615%;
    left: 20%;
    perspective: 650px;
  }

  .robot-head-greeting,
  .robot-head {
    width: 100%;
    height: 100%;
    display: block;
    transform-origin: 50% 78%;
  }

  .robot-head {
    transform: rotateY(var(--head-yaw)) rotateX(var(--head-pitch));
    transition: transform 250ms cubic-bezier(.2, .65, .3, 1);
  }

  .head-shell { width: 100%; height: 100%; display: block; }
  .head-top { fill: #fafaf5; stroke: var(--robot-ink); stroke-width: 1.25; }
  .head-side { fill: #adafa2; stroke: var(--robot-ink); stroke-width: 1.25; }
  .head-front { fill: #eeeee5; stroke: var(--robot-ink); stroke-width: 1.25; }
  .head-bevel { fill: #f7f7f0; stroke: #d2d4c8; stroke-width: 1; }
  .head-screen-border { fill: #4c5147; stroke: var(--robot-ink); stroke-width: 1; }
  .head-screen { fill: #202820; stroke: #161d17; stroke-width: 1; }
  .screen-reflection { stroke: #77856f; stroke-width: 1; opacity: .45; }
  .robot-eyes { transform: translate(var(--eye-x), var(--eye-y)); transition: transform 180ms ease-out; }
  .eye { fill: #eef2cd; }
  .eye-glint { fill: #fffdee; opacity: .7; }
  .mouth-line { stroke: #a0ae85; stroke-width: 1.3; }
  .head-detail { stroke: #919787; stroke-width: 1; }
  .head-fastener { stroke: #888f7f; stroke-width: .9; }
  .side-vents { stroke: #66705e; stroke-width: 1.2; }
  .head-hinge { fill: #737e69; stroke: var(--robot-ink); stroke-width: 1; }

  .satellite-panel { fill: var(--robot-paper); stroke: var(--robot-ink); stroke-width: 1; }
  .satellite-side { fill: var(--robot-orange); stroke: var(--robot-ink); stroke-width: 1; }
  .satellite-face { fill: #aeb3a1; stroke: var(--robot-ink); stroke-width: 1; }
  .satellite-signal { stroke: var(--robot-orange); stroke-width: 1.2; }

  .companion-caption {
    position: absolute;
    left: 14%;
    right: 10%;
    bottom: 1%;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    line-height: 1.4;
    letter-spacing: .5px;
    color: var(--robot-muted);
    white-space: nowrap;
  }

  .status-square { width: 5px; height: 5px; background: var(--robot-orange); }
  .caption-line { height: 1px; flex: 1; background: var(--robot-line); }
  .caption-action { letter-spacing: 0; }
  .greeting .robot-head-greeting { animation: orbital-greeting 1.15s ease-in-out 1; }
  .greeting .eye-right { animation: orbital-wink 1.15s ease-in-out 1; transform-origin: 99px 75px; }
  .greeting .status-square { background: var(--robot-ink); }

  .companion-announcement {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @keyframes orbital-wait {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  @keyframes orbital-greeting {
    0%, 100% { transform: rotate(0); }
    26% { transform: rotate(-7deg) translateY(-2px); }
    54% { transform: rotate(5deg); }
    75% { transform: rotate(-2deg); }
  }

  @keyframes orbital-wink {
    0%, 24%, 60%, 100% { transform: scaleY(1); }
    35%, 47% { transform: scaleY(.12); }
  }

  @media (prefers-reduced-motion: reduce) {
    .motion-allowed .robot-assembly,
    .greeting .robot-head-greeting,
    .greeting .eye-right { animation: none; }
    .robot-head,
    .robot-eyes { transition: none; transform: none; }
  }

  .orbit-companion:not(.motion-allowed) .robot-head,
  .orbit-companion:not(.motion-allowed) .robot-eyes { transition: none; }
</style>
