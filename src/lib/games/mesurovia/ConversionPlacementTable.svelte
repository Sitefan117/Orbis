<script lang="ts">
  import {
    buildPlacement, canConvert, convertTableValue, durationRelation,
    formatLocalizedNumber, getConversionFamily, parseLocalizedNumber, readPlacementCells, unitAnchor
  } from './conversion-table';

  export let family = 'length';
  export let value = '2,4';
  export let from = 'm';
  export let to = 'cm';
  export let stage = 5;
  export let compact = false;
  export let interactive = false;
  export let lockUnits = false;
  export let onUnitSelect: (unit: string) => void = () => {};
  export let onStateChange: (state: { cells: string[]; commaAfter: number | null; result: string; commaCorrect: boolean; complete: boolean }) => void = () => {};
  let manualCells: string[] = [];
  let manualComma: number | null = null;
  let activeCell: number | null = null;
  let initializedFamily = '';
  let initializedFrom = '';

  $: selected = getConversionFamily(family);
  $: parsed = parseLocalizedNumber(value);
  $: valid = value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0;
  $: conversionAllowed = canConvert(selected, from, to);
  $: result = valid ? convertTableValue(parsed, selected, from, to) : null;
  $: placement = buildPlacement(value, selected, from, to, stage >= 5);
  $: sourceGroup = selected.units.findIndex((unit) => unit.key === from || unit.alias === from);
  $: targetGroup = selected.units.findIndex((unit) => unit.key === to || unit.alias === to);
  $: pathStart = Math.min(sourceGroup, targetGroup);
  $: pathEnd = Math.max(sourceGroup, targetGroup);
  $: if (interactive && (initializedFamily !== family || manualCells.length !== placement.cells.length)) {
    initializedFamily = family;
    manualCells = Array(placement.cells.length).fill('');
    manualComma = null;
    activeCell = null;
    initializedFrom = '';
  }
  $: if (interactive && from && from !== initializedFrom) {
    initializedFrom = from;
    activeCell = sourceEntryStart();
  }

  function sourceEntryStart() {
    const sourceAnchor = unitAnchor(selected, from);
    const wholeDigits = value.trim().replace(/\s/g, '').split(/[,.]/)[0].replace(/\D/g, '').length || 1;
    return Math.max(0, sourceAnchor - wholeDigits + 1);
  }

  function emitState() {
    const occupied = manualCells.map((digit, index) => digit ? index : -1).filter((index) => index >= 0);
    const sourceAnchor = unitAnchor(selected, from);
    const targetAnchor = unitAnchor(selected, to);
    const requiredStart = occupied.length ? Math.min(occupied[0], sourceAnchor, targetAnchor) : -1;
    const requiredEnd = occupied.length ? Math.max(occupied[occupied.length - 1], sourceAnchor, targetAnchor) : -1;
    const complete = requiredStart >= 0 && manualCells.slice(requiredStart, requiredEnd + 1).every(Boolean);
    onStateChange({
      cells: [...manualCells],
      commaAfter: manualComma,
      result: to ? readPlacementCells(manualCells, selected, to) : '',
      commaCorrect: Boolean(from) && (manualComma === sourceAnchor || (!/[,.]/.test(value) && manualComma === null)),
      complete
    });
  }

  function selectCell(index: number) {
    activeCell = index;
  }

  function enterDigit(digit: string) {
    if (activeCell === null) activeCell = sourceEntryStart();
    if (activeCell === null || activeCell < 0) return;
    manualCells[activeCell] = digit;
    manualCells = [...manualCells];
    if (activeCell < manualCells.length - 1) activeCell += 1;
    emitState();
  }

  function eraseDigit() {
    if (activeCell === null) return;
    if (manualCells[activeCell]) manualCells[activeCell] = '';
    else if (activeCell > 0) {
      activeCell -= 1;
      manualCells[activeCell] = '';
    }
    manualCells = [...manualCells];
    emitState();
  }

  function clearBoard() {
    manualCells = Array(placement.cells.length).fill('');
    manualComma = null;
    activeCell = from ? sourceEntryStart() : null;
    emitState();
  }

  function toggleComma(index: number) {
    manualComma = manualComma === index ? null : index;
    emitState();
  }
</script>

{#if selected.id === 'duration'}
  <div class:compact class="duration-board">
    <div class="duration-columns" style={`--columns:${selected.units.length}`}>
      {#each selected.units as unit, index}
        <div class:source={unit.key === from} class:target={unit.key === to} class:on-path={stage >= 3 && index >= pathStart && index <= pathEnd} class="duration-column">
          <strong>{unit.label}</strong>
          <span>{stage >= 2 && unit.key === from ? value : '–'}</span>
        </div>
      {/each}
    </div>
    {#if stage >= 3}<p class="relation">{durationRelation(from, to)}</p>{/if}
    {#if !conversionAllowed}<p class="calendar-warning">Pour passer entre mois et jours, utilise les vraies dates du calendrier : tous les mois n’ont pas la même durée.</p>{/if}
    {#if stage >= 5 && result !== null}<p class="result-line"><span>Résultat lu hors du tableau</span><strong>{formatLocalizedNumber(result)} {to}</strong></p>{/if}
  </div>
{:else}
  <div class:compact class="placement-board">
    <div class="table-scroll">
      <table style={`--cell-count:${selected.units.length * selected.power}`} aria-label={`Tableau de conversion des ${selected.name.toLowerCase()}`}>
        <thead>
          <tr>
            {#each selected.units as unit, groupIndex}
              <th colspan={selected.power} class:source={(interactive || stage >= 2) && groupIndex === sourceGroup} class:target={(interactive || stage >= 2) && groupIndex === targetGroup} class:on-path={stage >= 4 && groupIndex >= pathStart && groupIndex <= pathEnd}>
                {#if interactive && !lockUnits}
                  <button type="button" class="unit-button" onclick={() => onUnitSelect(unit.key)}><span>{unit.label}</span>{#if unit.alias}<small>{unit.alias}</small>{/if}</button>
                {:else}<span>{unit.label}</span>{#if unit.alias}<small>{unit.alias}</small>{/if}{/if}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          <tr class="digit-row">
            {#each placement.cells as cell}
              <td class:group-start={cell.subIndex === 0} class:source-zone={cell.groupIndex === sourceGroup} class:target-zone={cell.groupIndex === targetGroup} class:travel-zone={stage >= 4 && cell.groupIndex >= pathStart && cell.groupIndex <= pathEnd} class:added-zero={stage >= 5 && cell.addedZero}>
                {#if interactive}<button type="button" class:active-cell={activeCell === cell.index} class="cell-button" aria-label={`Case ${cell.index + 1}${manualCells[cell.index] ? `, chiffre ${manualCells[cell.index]}` : ', vide'}`} onclick={() => selectCell(cell.index)}>{manualCells[cell.index] || ''}</button>
                {:else if cell.original && (stage >= 3 || (stage >= 2 && cell.index === placement.sourceAnchor))}<b>{cell.value}</b>{:else if stage >= 5 && cell.addedZero}<b>{cell.value}</b>{:else}<span>–</span>{/if}
                {#if !interactive && stage >= 2 && (stage < 6 || placement.targetAnchor === placement.sourceAnchor) && cell.index === placement.sourceAnchor}<i class="comma source-comma" title="Virgule de départ">,</i>{/if}
                {#if !interactive && stage >= 6 && cell.index === placement.targetAnchor && placement.targetAnchor !== placement.sourceAnchor}<i class="comma target-comma" title="Nouvelle place de la virgule">,</i>{/if}
              </td>
            {/each}
          </tr>
          {#if interactive}
            <tr class="comma-row" aria-label="Emplacements de virgule">
              {#each placement.cells as cell}
                <td>
                  {#if cell.index < placement.cells.length - 1}
                    <button type="button" class:comma-active={manualComma === cell.index} class="comma-slot" aria-label={`Placer la virgule après la case ${cell.index + 1}`} aria-pressed={manualComma === cell.index} onclick={() => toggleComma(cell.index)}>{manualComma === cell.index ? ',' : ''}</button>
                  {/if}
                </td>
              {/each}
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    {#if interactive}
      <div class="number-pad" aria-label="Pavé numérique">
        {#each ['1','2','3','4','5','6','7','8','9','0'] as digit}<button type="button" onclick={() => enterDigit(digit)}>{digit}</button>{/each}
        <button type="button" class="pad-utility" onclick={eraseDigit}>⌫</button>
        <button type="button" class="pad-utility clear-pad" onclick={clearBoard}>Effacer</button>
      </div>
    {:else if from || to}
      <div class="legend">
        <span class="source-key">Départ : {from}</span>
        <span class="target-key">Arrivée : {to}</span>
        {#if stage >= 5}<span class="zero-key">Zéro ajouté</span>{/if}
      </div>
    {/if}
    {#if !interactive && valid && (placement.overflowLeft || placement.overflowRight)}<p class="overflow-warning">Ce nombre dépasse le tableau affiché. Choisis une unité plus proche ou un nombre plus court.</p>{/if}
    {#if !interactive && valid && stage >= 6 && result !== null}<p class="result-line"><span>Je lis les chiffres jusqu’à la nouvelle virgule</span><strong>{formatLocalizedNumber(result)} {to}</strong></p>{/if}
  </div>
{/if}

<style>
  .table-scroll { overflow-x:auto; padding:4px 2px 28px; }
  table { width:100%; min-width:max(100%,calc(var(--cell-count) * 32px)); border-collapse:collapse; table-layout:fixed; text-align:center; }
  th { height:48px; border:2px solid #9aaa8a; background:#e7edda; color:#294333; }
  th span,th small { display:block; } th small { margin-top:2px; color:#6b714b; font-size:.7rem; }
  td { position:relative; height:46px; min-width:32px; border:2px solid #b4bd9f; background:#fffdf2; color:#26432e; font-size:1.2rem; }
  .unit-button,.cell-button { width:100%; height:100%; border:0; padding:0; background:transparent; color:inherit; font:inherit; cursor:pointer; }
  .unit-button { min-height:44px; font-weight:950; }.unit-button span,.unit-button small { display:block; }
  .cell-button { min-height:46px; font-size:1.3rem; font-weight:950; }
  .cell-button.active-cell { background:#e7f5d9; box-shadow:inset 0 0 0 3px #4e8159; }
  td.group-start { border-left-width:4px; }
  th.source,.source-zone { background:#dcebc8; border-color:#66865a; }
  th.target,.target-zone { background:#ffe5a2; border-color:#b27d2f; }
  th.on-path,.travel-zone { box-shadow:inset 0 -4px #7b9b6a; }
  td.added-zero { background:#fff1c9; color:#9a651b; }
  td > span { color:#b6b9a9; }
  .comma { position:absolute; z-index:2; right:-8px; bottom:-25px; font:950 1.7rem Georgia,serif; }
  .source-comma { color:#35704b; }.target-comma { color:#b56e18; transform:scale(1.2); }
  .comma-row td { height:30px; border:0; background:transparent; overflow:visible; }
  .comma-slot { position:absolute; z-index:3; top:1px; right:-13px; width:26px; height:25px; padding:0; border:2px solid #9eb28a; border-radius:6px; background:#fffdf2; color:#87927b; font:bold 1rem Georgia,serif; cursor:pointer; }
  .comma-slot.comma-active { border-color:#b27d2f; background:#ffe5a2; color:#744d16; }
  .number-pad { display:grid; grid-template-columns:repeat(6,minmax(44px,1fr)); gap:6px; margin-top:10px; }
  .number-pad button { min-height:44px; border:2px solid #9aaa8a; border-radius:8px; background:#fffdf2; color:#28442e; font-size:1rem; font-weight:950; cursor:pointer; }
  .number-pad button:active { transform:translateY(1px); background:#e7f5d9; }
  .number-pad .pad-utility { background:#e5edda; }.number-pad .clear-pad { grid-column:span 2; }
  .legend { display:flex; flex-wrap:wrap; gap:7px; margin-top:5px; font-size:.75rem; font-weight:900; }
  .legend span { padding:5px 8px; border-radius:999px; }.source-key { background:#dcebc8; }.target-key { background:#ffe5a2; }.zero-key { background:#fff1c9; color:#875b1f; }
  .result-line { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:12px 0 0; padding:10px 12px; border:2px solid #b27d2f; border-radius:10px; background:#fff5d6; }
  .result-line span { color:#5c654f; font-size:.83rem; }.result-line strong { color:#744d16; font-size:1.25rem; }
  .overflow-warning,.calendar-warning { padding:8px 10px; border-radius:8px; background:#ffe8d6; color:#7c3e26; font-weight:800; }
  .duration-columns { display:grid; grid-template-columns:repeat(var(--columns),minmax(66px,1fr)); gap:4px; overflow-x:auto; }
  .duration-column { display:grid; min-height:76px; border:2px solid #b4bd9f; border-radius:8px; background:#fffdf2; text-align:center; }
  .duration-column strong { padding:6px 4px; background:#e7edda; font-size:.75rem; }.duration-column span { padding:10px 3px; font-weight:950; }
  .duration-column.source { border-color:#66865a; background:#dcebc8; }.duration-column.target { border-color:#b27d2f; background:#ffe5a2; }
  .duration-column.on-path { box-shadow:inset 0 -5px #7b9b6a; }.relation { margin:10px 0; text-align:center; font-weight:900; color:#365c41; }
  .compact table { min-width:max(100%,calc(var(--cell-count) * 30px)); }.compact td { height:38px;font-size:1rem; }.compact .result-line { margin-top:8px; }
  @media(max-width:650px) { .result-line { align-items:flex-start; flex-direction:column; gap:3px; }.number-pad { grid-template-columns:repeat(4,1fr); } }
</style>
