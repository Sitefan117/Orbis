<script lang="ts">
  import ConversionPlacementTable from './ConversionPlacementTable.svelte';
  import {
    conversionFamilies, formatLocalizedNumber, getConversionFamily, parseLocalizedNumber, readPlacementCells, unitAnchor
  } from './conversion-table';

  export let onClose: () => void;

  let family = 'length';
  let from = '';
  let to = '';
  let boardCells: string[] = [];
  let boardComma: number | null = null;
  let boardVersion = 0;
  let showResult = false;
  let tutorialOpen = false;
  let tutorialStep = 0;

  $: selected = getConversionFamily(family);
  $: boardResult = to ? readPlacementCells(boardCells, selected, to) : '';
  $: displayedBoardResult = boardResult ? formatLocalizedNumber(parseLocalizedNumber(boardResult)) : '';
  $: hasDigits = boardCells.some((cell) => /\d/.test(cell));
  $: commaCorrect = Boolean(to) && boardComma === unitAnchor(selected, to);
  $: occupiedIndexes = boardCells.flatMap((cell, index) => /\d/.test(cell) ? [index] : []);
  $: targetAnchor = to ? unitAnchor(selected, to) : -1;
  $: boardComplete = targetAnchor >= 0 && occupiedIndexes.length > 0 && boardCells
    .slice(Math.min(targetAnchor, ...occupiedIndexes), Math.max(targetAnchor, ...occupiedIndexes) + 1)
    .every((cell) => /\d/.test(cell));
  $: lengthTutorial = [
    { title: '1. Je découvre l’ordre des unités', text: 'La plus grande unité est à gauche. Chaque unité vers la droite est 10 fois plus petite. Pour une même mesure, le nombre lu devient donc 10 fois plus grand.', value: '', from: '', to: '', stage: 1 },
    { title: '2. Je prépare 45 m → cm', text: 'Je repère m comme unité de départ et cm comme unité d’arrivée. Le chiffre des unités, 5, se place d’abord sous m.', value: '45', from: 'm', to: 'cm', stage: 2 },
    { title: '3. Je place 45 m', text: 'Le chiffre des unités est 5 : je le place sous m. Le 4 vient juste à gauche, sous dam.', value: '45', from: 'm', to: 'cm', stage: 3 },
    { title: '4. Je parcours les colonnes', text: 'De m à cm, je passe par dm puis cm. Les chiffres déjà placés ne changent pas de case.', value: '45', from: 'm', to: 'cm', stage: 4 },
    { title: '5. Je complète et je lis', text: 'J’ajoute 0 sous dm et 0 sous cm. La virgule finale se place après cm, l’unité d’arrivée : 45 m = 4 500 cm.', value: '45', from: 'm', to: 'cm', stage: 6 },
    { title: '6. Exemple inverse : 850 cm → m', text: 'Je place 0 sous cm, 5 sous dm et 8 sous m. La virgule finale se place après m : 8,50 m, donc 8,5 m.', value: '850', from: 'cm', to: 'm', stage: 6 },
    { title: '7. Exemple décimal : 2,7 m → cm', text: 'Je place 2 sous m et 7 sous dm. Il manque un chiffre sous cm : j’ajoute 0, puis je place la virgule finale après cm et je lis 270 cm.', value: '2,7', from: 'm', to: 'cm', stage: 6 },
    { title: '8. Des petites vers les grandes unités', text: 'Pour 35 cm → m, je place 5 sous cm et 3 sous dm. J’ajoute 0 sous m, puis je place la virgule finale après m et je lis 0,35 m.', value: '35', from: 'cm', to: 'm', stage: 6 }
  ];
  $: durationTutorial = [
    { title: '1. Les durées sont différentes', text: 'Les durées ne fonctionnent pas par paquets de 10. Elles utilisent 60, 24, 7 et le calendrier.', value: '', from: '', to: '', stage: 1 },
    { title: '2. Je choisis la bonne relation', text: '1 minute = 60 secondes ; 1 heure = 60 minutes ; 1 jour = 24 heures ; 1 semaine = 7 jours.', value: '2,5', from: 'h', to: 'min', stage: 3 },
    { title: '3. Exemple : 2,5 h → min', text: 'Je multiplie 2,5 par 60. Le résultat est 150 minutes.', value: '2,5', from: 'h', to: 'min', stage: 5 }
  ];
  $: genericTutorial = [
    { title: `1. Je découvre le tableau des ${selected.name.toLowerCase()}`, text: selected.note, value: '', from: '', to: '', stage: 1 },
    { title: '2. Je repère les unités', text: `Je pars de ${selected.example.from} et je veux lire la mesure en ${selected.example.to}.`, ...selected.example, stage: 2 },
    { title: '3. Je place les chiffres', text: 'Je place un chiffre par petite case, en commençant par le chiffre des unités dans la dernière case du groupe de départ.', ...selected.example, stage: 3 },
    { title: '4. Je complète les cases', text: 'Je complète uniquement les cases nécessaires avec des zéros, puis je place la virgule finale dans l’unité d’arrivée.', ...selected.example, stage: 6 }
  ];
  $: tutorialSteps = selected.id === 'duration' ? durationTutorial : selected.id === 'length' ? lengthTutorial : genericTutorial;
  $: currentSlide = tutorialSteps[tutorialStep] ?? tutorialSteps[0];

  function selectFamily(next: string) {
    const choice = getConversionFamily(next);
    family = choice.id;
    from = '';
    to = '';
    boardCells = [];
    boardComma = null;
    boardVersion += 1;
    showResult = false;
    tutorialOpen = false;
    tutorialStep = 0;
  }

  function chooseUnit(unit: string) {
    showResult = false;
    if (!from || to) {
      from = unit;
      to = '';
      boardCells = [];
      boardComma = null;
      boardVersion += 1;
      return;
    }
    if (unit === from) {
      from = '';
      boardCells = [];
      boardComma = null;
      boardVersion += 1;
      return;
    }
    to = unit;
  }

  function startTutorial() {
    tutorialStep = 0;
    tutorialOpen = true;
  }

  function updateBoard(state: { cells: string[]; commaAfter: number | null }) {
    boardCells = state.cells;
    boardComma = state.commaAfter;
    showResult = false;
  }
</script>

<div class="guide-backdrop" role="presentation">
  <div class="guide" role="dialog" aria-modal="true" aria-label="Tableau de conversion">
    <header>
      <div><p class="eyebrow">AIDE TOUJOURS DISPONIBLE</p><h2>Construire une conversion</h2></div>
      <button class="close" aria-label="Fermer le tableau" onclick={onClose}>×</button>
    </header>
    <p class="intro">Le tableau sert à <strong>placer un chiffre par case</strong>. Le résultat complet se lit à la nouvelle virgule : il ne s’écrit jamais tout entier dans la colonne d’arrivée.</p>

    {#if tutorialOpen}
      <section class="tutorial tutorial-only" aria-live="polite">
        <div class="tutorial-progress"><span>ÉTAPE {tutorialStep + 1} / {tutorialSteps.length}</span><div><i style={`width:${((tutorialStep + 1) / tutorialSteps.length) * 100}%`}></i></div></div>
        {#key tutorialStep}
          <article class="tutorial-slide">
            <div class="tutorial-copy"><p class="eyebrow">EXPLICATION GUIDÉE</p><h3>{currentSlide.title}</h3><p>{currentSlide.text}</p></div>
            <ConversionPlacementTable {family} value={currentSlide.value} from={currentSlide.from} to={currentSlide.to} stage={currentSlide.stage} compact />
          </article>
        {/key}
        <div class="tutorial-actions">
          <button disabled={tutorialStep === 0} onclick={() => (tutorialStep -= 1)}>← Revenir</button>
          {#if tutorialStep + 1 < tutorialSteps.length}
            <button class="primary" onclick={() => (tutorialStep += 1)}>OK, j’ai compris →</button>
          {:else}
            <button class="primary" onclick={() => (tutorialOpen = false)}>Terminer l’explication ✓</button>
          {/if}
          <button class="quit-tutorial" onclick={() => (tutorialOpen = false)}>Quitter l’exemple</button>
        </div>
      </section>
    {:else}
      <div class="family-picker">
        <label>Grandeur étudiée
          <select bind:value={family} onchange={() => selectFamily(family)}>{#each conversionFamilies as item}<option value={item.id}>{item.name}</option>{/each}</select>
        </label>
        <p>{selected.id === 'duration' ? 'Les durées utilisent leurs propres relations : 60, 24, 7 et le calendrier.' : 'Touche une unité de départ, puis une unité d’arrivée. Remplis ensuite le tableau directement.'}</p>
      </div>
      <p class="family-note">{selected.note}</p>

      {#if selected.id === 'duration'}
        <section class="duration-tool">
          <h3>Les durées ne sont pas un tableau décimal</h3>
          <div class="duration-relations"><span>1 min = 60 s</span><span>1 h = 60 min</span><span>1 j = 24 h</span><span>1 sem = 7 j</span></div>
          <p>Les mois et les années dépendent du calendrier. Ils seront travaillés dans un outil séparé pour éviter de les mélanger aux conversions décimales.</p>
        </section>
      {:else}
        <div class="selection-status" aria-live="polite">
          <span class:done={from}>{from ? `1. Départ : ${from}` : '1. Touche l’unité de départ'}</span>
          <span class:done={to}>{to ? `2. Arrivée : ${to}` : '2. Touche l’unité d’arrivée'}</span>
          <span class:done={hasDigits}>3. Place les chiffres</span>
          <span class:done={commaCorrect}>4. Place la virgule après l’unité d’arrivée</span>
        </div>
        {#key boardVersion}<ConversionPlacementTable {family} value="" {from} {to} stage={1} interactive onUnitSelect={chooseUnit} onStateChange={updateBoard} />{/key}

        {#if showResult}
          <div class:valid-result={Boolean(boardResult) && commaCorrect && boardComplete} class="read-result" role="status">
            {#if !from || !to}<strong>Choisis d’abord l’unité de départ et l’unité d’arrivée.</strong>
            {:else if !hasDigits}<strong>Place au moins un chiffre dans le tableau.</strong>
            {:else if !commaCorrect}<strong>La virgule finale doit être placée juste après la dernière case de {to}, l’unité d’arrivée.</strong>
            {:else if !boardComplete}<strong>Complète avec des zéros toutes les cases vides jusqu’à {to}.</strong>
            {:else}<span>Je lis le tableau en <b>{to}</b></span><strong>{displayedBoardResult} {to}</strong>{/if}
          </div>
        {/if}
        <div class="guide-actions">
          <button class="primary" disabled={!to || !hasDigits} onclick={() => (showResult = true)}>Lire le résultat{to ? ` en ${to}` : ''}</button>
          <button onclick={startTutorial}>Voir l’exemple pas à pas</button>
        </div>
      {/if}
      {#if selected.id === 'duration'}<div class="guide-actions"><button class="primary" onclick={startTutorial}>Comprendre les durées</button></div>{/if}
    {/if}
  </div>
</div>

<style>
  .guide-backdrop { position:fixed; inset:0; z-index:100; display:grid; place-items:center; padding:10px; background:#183827c7; }
  .guide { box-sizing:border-box; width:min(1080px,100%); max-height:97dvh; overflow:auto; padding:clamp(13px,2.5vw,24px); border:3px solid #5b7857; border-radius:18px; background:#fffaf0; color:#294333; box-shadow:0 16px 50px #142b2399; }
  header { display:flex; justify-content:space-between; gap:10px; align-items:start; }
  h2 { margin:0 0 8px; font:700 clamp(1.55rem,3vw,2.25rem) Georgia,serif; }
  .eyebrow { margin:0 0 5px; font-size:.68rem; font-weight:950; letter-spacing:.1em; }
  .close { flex:0 0 auto; width:44px; height:44px; border:2px solid #6c835d; border-radius:50%; background:white; font-size:1.5rem; }
  .intro { max-width:850px; margin:5px 0 16px; line-height:1.55; }
  .family-picker { display:grid; grid-template-columns:minmax(180px,260px) 1fr; align-items:end; gap:12px; margin-bottom:12px; padding:10px; border:2px solid #c8d5b9; border-radius:10px; background:#edf2e4; }
  .family-picker p { margin:0; color:#4b624e; font-size:.88rem; line-height:1.45; }
  label { display:grid; gap:5px; font-size:.78rem; font-weight:900; }
  select { box-sizing:border-box; width:100%; min-width:0; min-height:44px; padding:9px; border:2px solid #9eb28a; border-radius:9px; background:white; color:#253e2c; font:inherit; font-size:1rem; }
  .family-note { margin:7px 0 12px; padding:8px 10px; border-left:5px solid #7c966d; background:#edf2e4; font-size:.86rem; }
  .selection-status { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; margin:10px 0; }
  .selection-status span { padding:8px; border:2px dashed #b4bd9f; border-radius:8px; background:#fffdf2; color:#687260; font-size:.76rem; font-weight:850; text-align:center; }
  .selection-status span.done { border-style:solid; border-color:#6f9364; background:#e4efd8; color:#31533a; }
  .guide-actions,.tutorial-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
  .guide-actions button,.tutorial-actions button { min-height:44px; padding:9px 13px; border:2px solid #4d7454; border-radius:9px; background:#edf3e4; color:#274a32; font-weight:900; }
  button.primary { background:#3f714d; color:white; border-color:#31583c; }
  button:disabled { opacity:.45; }
  .tutorial { padding:clamp(12px,2vw,20px); border:3px solid #d0ad5a; border-radius:15px; background:#fff8df; box-shadow:0 7px 0 #dfcb91; }
  .tutorial-only { margin-top:10px; }
  .tutorial-progress { display:grid; grid-template-columns:auto minmax(120px,1fr); align-items:center; gap:12px; margin-bottom:12px; font-size:.72rem; font-weight:950; }.tutorial-progress > div { height:9px; overflow:hidden; border-radius:999px; background:#e2d9bc; }.tutorial-progress i { display:block; height:100%; background:#4e8159; transition:width .25s ease; }
  .tutorial-slide { animation:slide-in .28s ease-out; }.tutorial-copy { margin-bottom:10px; }.tutorial-copy h3 { margin:3px 0 7px; font:700 clamp(1.3rem,2.5vw,1.8rem) Georgia,serif; }.tutorial-copy p:not(.eyebrow) { margin:0; max-width:850px; line-height:1.55; }
  .quit-tutorial { margin-left:auto; }
  .read-result { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:12px; padding:12px; border:2px solid #b86f42; border-radius:10px; background:#ffe8d6; color:#713d29; }
  .read-result.valid-result { border-color:#4f7c58; background:#e2f0d8; color:#285039; }.read-result > strong { font-size:1.25rem; }
  .duration-tool { padding:16px; border:2px solid #9aaa8a; border-radius:12px; background:#fffdf2; }.duration-tool h3 { margin:0 0 10px; font-family:Georgia,serif; }
  .duration-relations { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; }.duration-relations span { padding:10px 6px; border-radius:8px; background:#e5edda; font-weight:900; text-align:center; }
  @keyframes slide-in { from { opacity:0; transform:translateX(14px); } to { opacity:1; transform:none; } }
  @media(max-width:760px) { .family-picker { grid-template-columns:1fr; gap:7px; }.tutorial-progress { grid-template-columns:1fr; gap:5px; }.selection-status,.duration-relations { grid-template-columns:repeat(2,minmax(0,1fr)); }.read-result { align-items:flex-start; flex-direction:column; }.quit-tutorial { margin-left:0; } }
  @media(prefers-reduced-motion:reduce) { .tutorial-slide { animation:none; } }
</style>
