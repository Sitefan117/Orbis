<script lang="ts">
  import engine from './engine-v3-adapter';
  export let onClose: () => void;

  const families = [
    { id: 'length', name: 'Longueurs', units: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], example: { value: '2,4', from: 'm', to: 'cm' }, placeValue: true },
    { id: 'capacity', name: 'Capacités', units: ['L', 'dL', 'cL', 'mL'], example: { value: '1,5', from: 'L', to: 'mL' }, placeValue: true },
    { id: 'mass', name: 'Masses', units: ['t', 'kg', 'g', 'mg'], example: { value: '2', from: 'kg', to: 'g' }, placeValue: false },
    { id: 'area', name: 'Aires', units: ['km²', 'ha', 'm²', 'cm²', 'mm²'], example: { value: '2', from: 'ha', to: 'm²' }, placeValue: false },
    { id: 'volume', name: 'Volumes', units: ['m³', 'dm³', 'cm³', 'mm³'], example: { value: '1,5', from: 'm³', to: 'dm³' }, placeValue: false },
    { id: 'duration', name: 'Durées', units: ['sem', 'j', 'h', 'min', 's'], example: { value: '2', from: 'h', to: 'min' }, placeValue: false }
  ];
  let family = 'length';
  let value = '2,4';
  let from = 'm';
  let to = 'cm';
  let showSteps = false;
  let error = '';
  $: selected = families.find(item => item.id === family) ?? families[0];
  $: parsed = Number(value.replace(',', '.').replace(/\s/g, ''));
  $: valid = value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0;
  $: unitsValid = from in engine.FAMILIES[family].units && to in engine.FAMILIES[family].units;
  $: result = valid && unitsValid ? engine.convert(parsed, family, from, to) : null;
  $: fromIndex = selected.units.indexOf(from);
  $: toIndex = selected.units.indexOf(to);
  $: factor = unitsValid ? Number(engine.FAMILIES[family].units[from] / engine.FAMILIES[family].units[to]) : 1;
  $: direction = factor > 1 ? 'plus petite' : factor < 1 ? 'plus grande' : 'identique';
  $: digitRow = selected.placeValue && valid && fromIndex >= 0 ? placeDigits(value, selected.units.length, fromIndex) : [];

  function placeDigits(raw: string, length: number, sourceIndex: number): string[] {
    const [whole = '', decimal = ''] = raw.trim().replace(/\s/g, '').replace('.', ',').split(',');
    const cells = Array(length).fill('–');
    [...whole].reverse().forEach((digit, offset) => {
      const column = sourceIndex - offset;
      if (/\d/.test(digit) && column >= 0) cells[column] = digit;
    });
    [...decimal].forEach((digit, offset) => {
      const column = sourceIndex + offset + 1;
      if (/\d/.test(digit) && column < length) cells[column] = digit;
    });
    return cells;
  }

  function selectFamily(next: string) {
    const choice = families.find(item => item.id === next) ?? families[0];
    family = choice.id;
    ({ value, from, to } = choice.example);
    showSteps = false;
  }
  function loadExample() {
    const example = selected.example;
    ({ value, from, to } = example);
    error = '';
    showSteps = true;
  }
</script>

<div class="guide-backdrop" role="presentation">
  <div class="guide" role="dialog" aria-modal="true" aria-label="Tableau de conversion">
    <header><div><p class="eyebrow">AIDE TOUJOURS DISPONIBLE</p><h2>Tableau de conversion</h2></div><button class="close" aria-label="Fermer le tableau" onclick={onClose}>×</button></header>
    <p>La plus grande unité est à gauche, la plus petite à droite. La mesure reste la même quand on change son écriture.</p>
    <div class="guide-controls">
      <label>Grandeur<select bind:value={family} onchange={() => selectFamily(family)}>{#each families as item}<option value={item.id}>{item.name}</option>{/each}</select></label>
      <label>Nombre de départ<input inputmode="decimal" bind:value={value} aria-invalid={!valid} /></label>
      <label>Unité de départ<select bind:value={from}>{#each selected.units as unit}<option value={unit}>{unit}</option>{/each}</select></label>
      <label>Unité d’arrivée<select bind:value={to}>{#each selected.units as unit}<option value={unit}>{unit}</option>{/each}</select></label>
    </div>
    <div class="guide-actions"><button onclick={loadExample}>Voir un exemple pas à pas</button><button onclick={() => { showSteps = true; error = valid ? '' : 'Écris un nombre positif pour commencer.'; }}>Montre-moi comment faire</button></div>
    {#if error}<p role="alert">{error}</p>{/if}
    <div class="table-wrap"><table><caption>{selected.name} · grandes unités à gauche, petites unités à droite</caption><thead><tr>{#each selected.units as unit}<th class:source={unit === from} class:target={unit === to}>{unit}</th>{/each}</tr></thead><tbody>{#if selected.placeValue}<tr>{#each selected.units as unit, i}<td class:source={unit === from} class:target={unit === to}>{digitRow[i] ?? '–'}</td>{/each}</tr>{:else}<tr>{#each selected.units as unit}<td class:source={unit === from} class:target={unit === to}>{valid && unitsValid ? engine.fmt(engine.convert(parsed, family, from, unit)) : '–'}</td>{/each}</tr>{/if}</tbody></table></div>
    <p class="table-hint">{#if selected.placeValue}Chaque chiffre occupe sa colonne : le chiffre des unités de départ va sous {from}. Complète les cases nécessaires avec des zéros pour lire le résultat en {to}.{:else}Chaque case exprime la même mesure dans une autre unité. Les facteurs changent selon la grandeur : 1 000 pour certains sauts de masse ou de volume, 100 pour certains sauts d’aire et 60 pour le temps.{/if} Le tiret marque une case vide. Les mois et les années seront traités séparément, car leur durée dépend du calendrier.</p>
    {#if showSteps && valid && result !== null}
      <ol class="steps">
        <li>Place ou repère <strong>{engine.fmt(parsed)} {from}</strong> dans la colonne <strong>{from}</strong>. {#if selected.placeValue}Place les autres chiffres dans les colonnes voisines.{:else}Utilise le rapport propre à cette famille de mesures.{/if}</li>
        <li>Va vers <strong>{to}</strong>, une unité {direction}. {#if factor >= 1}Multiplie par {engine.fmt(factor)}.{:else}Divise par {engine.fmt(1 / factor)}.{/if}</li>
        <li>Lis le résultat : <strong>{engine.fmt(parsed)} {from} = {engine.fmt(result)} {to}</strong>.</li>
        <li>Vérifie : vers une unité plus petite, le nombre augmente ; vers une plus grande, il diminue.</li>
      </ol>
    {/if}
  </div>
</div>

<style>
  .guide-backdrop { position:fixed; inset:0; z-index:100; display:grid; place-items:center; padding:12px; background:#183827bb; }
  .guide { box-sizing:border-box; width:min(850px,100%); max-height:96dvh; overflow:auto; padding:20px; border:3px solid #5b7857; border-radius:16px; background:#fffaf0; color:#294333; box-shadow:0 16px 50px #142b2399; }
  header { display:flex; justify-content:space-between; gap:10px; align-items:start; }
  h2 { margin:0 0 8px; font:700 clamp(1.5rem,3vw,2rem) Georgia,serif; }
  .eyebrow { font-size:.7rem; font-weight:900; letter-spacing:.1em; margin:0 0 5px; }
  .close { width:42px; height:42px; border-radius:50%; border:2px solid #6c835d; background:white; font-size:1.5rem; }
  .guide-controls { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:9px; }
  label { display:grid; gap:5px; font-weight:800; font-size:.8rem; }
  input,select { min-width:0; width:100%; box-sizing:border-box; padding:10px; border:2px solid #9eb28a; border-radius:8px; background:white; font:inherit; }
  .guide-actions { display:flex; flex-wrap:wrap; gap:8px; margin:14px 0; }
  .guide-actions button { min-height:44px; padding:8px 12px; border:2px solid #2d6545; border-radius:9px; background:#e5f0dc; color:#264f36; font-weight:850; }
  .table-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; table-layout:fixed; text-align:center; }
  caption { text-align:left; font-size:.8rem; font-weight:800; margin-bottom:7px; }
  th,td { border:2px solid #a9b793; padding:9px 2px; overflow-wrap:anywhere; }
  th { background:#e9efdc; } td { background:white; font-weight:800; font-size:clamp(.65rem,1.7vw,.95rem); }
  .source { background:#dce9c8; } .target { background:#ffe3a0; }
  .table-hint { font-size:.8rem; margin:8px 0; }
  .steps { padding-left:22px; line-height:1.55; } .steps li { margin:6px 0; }
  @media(max-width:650px) { .guide-controls { grid-template-columns:repeat(2,minmax(0,1fr)); } .guide { padding:12px; } }
</style>
