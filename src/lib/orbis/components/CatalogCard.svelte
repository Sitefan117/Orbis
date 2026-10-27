<script lang="ts">
  export let title: string;
  export let description = '';
  export let subject: string;
  export let meta = '';
  export let status: string | undefined = undefined;
  /** Complete URL, including the deployment base when applicable. */
  export let image: string | undefined = undefined;
  export let href: string;
  export let actionLabel = 'Jouer';
  export let index = 0;
  export let reducedMotion = false;

  let imageFailed = false;
  $: if (image) imageFailed = false;
  $: statusLabel = status === 'prototype' ? 'Prototype'
    : status === 'development' ? 'En développement'
    : status === 'available' ? 'Disponible' : status;
  $: unfinished = status === 'prototype' || status === 'development'
    || statusLabel === 'Prototype' || statusLabel === 'En développement';
</script>

<article class="catalog-card" class:reduced-motion={reducedMotion}>
  <svg class="diagonals" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="M0 0 50 50 M100 0 50 50 M0 100 50 50 M100 100 50 50" />
  </svg>

  <div class="card-stage">
    <div class="card-core">
      <span class="subject-tab">{subject}</span>
      <div class="illustration" aria-hidden="true">
        {#if image && !imageFailed}
          <img src={image} alt="" loading="lazy" decoding="async" on:error={() => imageFailed = true} />
        {:else}
          <div class="placeholder">
            <svg viewBox="0 0 120 120" focusable="false">
              <rect x="31" y="31" width="58" height="58" />
              <circle cx="60" cy="60" r="16" />
              <path d="M17 60H103 M60 17V103" />
              <circle class="placeholder-dot" cx="89" cy="31" r="5" />
            </svg>
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
        {/if}
        <i class="screw top-left"></i>
        <i class="screw top-right"></i>
        <i class="screw bottom-left"></i>
        <i class="screw bottom-right"></i>
      </div>
      <div class="title-band">
        <h3 title={title}>{title}</h3>
        {#if description}<p title={description}>{description}</p>{/if}
      </div>
      <div class="card-footer">
        <div class="card-meta">
          {#if meta}<span class="notion">{meta}</span>{/if}
          {#if statusLabel}<span class="status" class:unfinished>{statusLabel}</span>{/if}
        </div>
        <a class="action-link" {href} aria-label={`${actionLabel} : ${title}`}>
          <span>{actionLabel}</span><span class="action-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </div>
</article>

<style>
  .catalog-card {
    --card-paper: var(--orbis-paper, #edefec);
    --card-ink: var(--orbis-ink, #20211f);
    --card-line: var(--orbis-line, #c5c9c2);
    --card-accent: var(--orbis-orange, #ee743c);
    --card-surface: var(--orbis-card-surface, #fff);
    --card-muted: var(--orbis-muted, #555a51);
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: max-content;
    width: 100%;
    height: 100%;
    aspect-ratio: .8;
    box-sizing: border-box;
    overflow: hidden;
    background: var(--card-paper);
    color: var(--card-ink);
  }

  .diagonals { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; pointer-events: none; }
  .diagonals path { fill: none; stroke: var(--card-line); stroke-width: 1; vector-effect: non-scaling-stroke; }
  .card-stage { display: grid; place-items: center; flex: 1; min-width: 0; padding: 2.1rem .75rem 2rem; }
  .card-core { position: relative; width: 82%; min-width: min(150px, 100%); max-width: 250px; background: transparent; transition: transform 180ms ease, box-shadow 180ms ease; }
  .subject-tab {
    position: absolute; right: 0; bottom: 100%; z-index: 2;
    max-width: 100%; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    padding: .32rem .55rem .28rem; border: 1px solid var(--card-line); border-bottom: 0;
    background: var(--card-paper); color: var(--card-ink); font-family: var(--orbis-label-font, ui-monospace, monospace); font-size: var(--orbis-card-meta-size, .75rem); line-height: 1.2; font-weight: 700;
  }
  .illustration { position: relative; aspect-ratio: 1; overflow: hidden; border: 1px solid var(--card-line); background: var(--card-surface); }
  .illustration img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .screw { position: absolute; display: block; width: 6px; height: 6px; border: 1px solid #6a6d66; border-radius: 50%; background: #f4f5f1; }
  .screw::after { position: absolute; content: ''; top: 2px; left: 1px; width: 4px; height: 1px; background: #73776e; transform: rotate(-35deg); }
  .top-left { top: 5px; left: 5px; }.top-right { top: 5px; right: 5px; }
  .bottom-left { bottom: 5px; left: 5px; }.bottom-right { bottom: 5px; right: 5px; }
  .placeholder { display: grid; position: absolute; inset: 0; place-items: center; background: var(--card-surface); }
  .placeholder svg { width: 65%; height: 65%; fill: none; stroke: var(--card-ink); stroke-width: 1; }
  .placeholder svg rect { fill: var(--card-paper); }
  .placeholder svg .placeholder-dot { fill: var(--card-accent); stroke: var(--card-ink); }
  .placeholder > span { position: absolute; bottom: 1rem; left: 1rem; font: 500 .8rem/1 ui-monospace, monospace; }
  .title-band { padding: .7rem .65rem .65rem; border: 1px solid var(--card-line); border-top: 0; background: var(--card-surface); }
  h3 { min-height: 2.7em; margin: 0; overflow-wrap: anywhere; font-family: var(--orbis-label-font, ui-monospace, monospace); font-size: var(--orbis-card-title-size, 1rem); font-weight: 700; line-height: 1.35; letter-spacing: -.015em; }
  .title-band p { margin: .35rem 0 0; overflow-wrap: anywhere; color: var(--card-muted); font-family: Arial, Helvetica, sans-serif; font-size: var(--orbis-card-body-size, .875rem); line-height: 1.5; }
  .card-footer { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: .6rem; min-width: 0; padding: .85rem 0 0; background: transparent; }
  .card-meta { display: flex; flex-direction: column; align-items: flex-start; gap: .35rem; min-width: 0; padding-bottom: .15rem; }
  .notion, .status { max-width: 100%; box-sizing: border-box; overflow-wrap: anywhere; padding: .23rem .4rem; border: 1px solid var(--card-line); background: var(--card-paper); font-family: var(--orbis-label-font, ui-monospace, monospace); font-size: var(--orbis-card-meta-size, .75rem); font-weight: 600; line-height: 1.35; }
  .status { color: var(--card-muted); }
  .status.unfinished { border-color: #976243; color: #6f4229; background: #f4e7dc; }
  .action-link {
    display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 1.1rem;
    min-height: 44px; min-width: 100px; box-sizing: border-box; padding: .65rem .8rem;
    border: 0; background: var(--card-ink); color: var(--orbis-action-text, #fff); text-decoration: none;
    clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
    font-family: var(--orbis-label-font, ui-monospace, monospace); font-size: .875rem; font-weight: 650; line-height: 1.3; transition: background-color 150ms ease;
  }
  .action-arrow { font-size: 1.1rem; line-height: 1; }
  .action-link:hover { background: color-mix(in srgb, var(--card-ink) 85%, var(--card-paper)); }
  .action-link:focus-visible { background: var(--card-accent); color: #191b17; outline: 3px solid var(--card-ink); outline-offset: -4px; }
  @media (hover: hover) {
    .catalog-card:hover .card-core { transform: translateY(-3px); box-shadow: 3px 4px 0 rgb(32 33 31 / 10%); }
  }
  .catalog-card:focus-within .card-core { box-shadow: 0 0 0 2px var(--card-accent); }
  .reduced-motion .card-core, .reduced-motion .action-link { transition: none; }
  .reduced-motion:hover .card-core { transform: none; }
  @media (prefers-reduced-motion: reduce) {
    .card-core, .action-link { transition: none; }
    .catalog-card:hover .card-core { transform: none; }
  }
  @media (max-width: 380px) {
    .card-stage { padding-inline: .55rem; }
    .action-link { min-width: 96px; gap: .65rem; }
  }
</style>
