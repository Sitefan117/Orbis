<script lang="ts">
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import type { Level } from './types';

  export let studentName: string;
  export let level: Level;

  type Point = { x: number; y: number };
  const points: Point[] = Array.from({ length: 20 }, (_, index) => ({ x: index % 5, y: Math.floor(index / 5) }));
  let chosen: Point[] = [];
  let feedback = 'Choisis quatre sommets dans l’ordre, en faisant le tour du rectangle.';
  let completed = false;
  let attempts = 0;
  let reporting = false;
  let reportMessage = '';

  function samePoint(a: Point, b: Point): boolean {
    return a.x === b.x && a.y === b.y;
  }

  function isTargetRectangle(vertices: Point[]): boolean {
    if (vertices.length !== 4) return false;
    const xs = vertices.map((point) => point.x);
    const ys = vertices.map((point) => point.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    if (Math.max(...xs) - minX !== 3 || Math.max(...ys) - minY !== 2) return false;
    const corners = [{ x: minX, y: minY }, { x: minX + 3, y: minY }, { x: minX + 3, y: minY + 2 }, { x: minX, y: minY + 2 }];
    if (!vertices.every((point) => corners.some((corner) => samePoint(point, corner)))) return false;
    return vertices.every((point, index) => {
      const next = vertices[(index + 1) % 4];
      return (point.x === next.x) !== (point.y === next.y);
    });
  }

  async function selectPoint(point: Point): Promise<void> {
    if (completed || chosen.some((selected) => samePoint(selected, point))) return;
    chosen = [...chosen, point];
    if (chosen.length < 4) {
      feedback = `${chosen.length} sommet${chosen.length > 1 ? 's' : ''} placé${chosen.length > 1 ? 's' : ''}. Continue dans l’ordre du contour.`;
      return;
    }
    attempts += 1;
    if (!isTargetRectangle(chosen)) {
      feedback = 'Ce n’est pas encore le rectangle demandé. Vérifie les quatre angles droits, 3 carreaux de largeur et 2 de hauteur. Efface puis réessaie.';
      return;
    }
    completed = true;
    feedback = 'Bravo ! Les quatre angles sont droits. Les côtés opposés sont parallèles et de même longueur : 3 carreaux et 2 carreaux.';
    reporting = true;
    try {
      const result = await recordGameActivity({
        studentName, gameId: 'geometrie', activityId: `${level} construction rectangle`,
        skillId: 'geometrie.construction', correctCount: 1, questionCount: 1, errorCount: attempts - 1,
        errorFamilies: [],
        responseDetails: [{ questionIndex: 0, prompt: 'Construis un rectangle de 3 carreaux sur 2.', response: chosen.map((p) => `(${p.x},${p.y})`).join(' → '), expected: 'Quatre angles droits, côtés de 3 et 2 carreaux', correct: true, attempts, hintsUsed: 0 }],
        metadata: { level, attempts, activity: 'construction-rectangle' }
      });
      reportMessage = result.message;
    } catch {
      reportMessage = 'Construction réussie. Le suivi ORBIS est momentanément indisponible.';
    } finally {
      reporting = false;
    }
  }

  function reset(): void {
    chosen = [];
    completed = false;
    feedback = 'Choisis quatre sommets dans l’ordre, en faisant le tour du rectangle.';
  }
</script>

<section class="construction-lab" aria-labelledby="construction-title">
  <div>
    <p class="eyebrow">ATELIER DE CONSTRUCTION · {level}</p>
    <h3 id="construction-title">Dessine un rectangle</h3>
    <p>Place les quatre sommets d’un rectangle de <strong>3 carreaux de largeur</strong> et <strong>2 carreaux de hauteur</strong>. Suis le contour dans l’ordre.</p>
  </div>
  <div class="construction-board">
    <svg viewBox="0 0 240 192" aria-hidden="true">
      {#each [0, 1, 2, 3, 4] as x}<line x1={24 + x * 48} y1="24" x2={24 + x * 48} y2="168" />{/each}
      {#each [0, 1, 2, 3] as y}<line x1="24" y1={24 + y * 48} x2="216" y2={24 + y * 48} />{/each}
      {#if chosen.length > 1}<polyline points={chosen.map((p) => `${24 + p.x * 48},${24 + p.y * 48}`).join(' ')} />{/if}
      {#if completed}<line class="closing-line" x1={24 + chosen[3].x * 48} y1={24 + chosen[3].y * 48} x2={24 + chosen[0].x * 48} y2={24 + chosen[0].y * 48} />{/if}
    </svg>
    {#each points as point}
      <button class:selected={chosen.some((selected) => samePoint(selected, point))} style={`left:${(24 + point.x * 48) / 240 * 100}%;top:${(24 + point.y * 48) / 192 * 100}%`} type="button" aria-label={`Point colonne ${point.x + 1}, ligne ${point.y + 1}`} disabled={completed} on:click={() => selectPoint(point)}></button>
    {/each}
  </div>
  <p class:success={completed} aria-live="polite">{feedback}</p>
  {#if reporting || reportMessage}<p class="report" aria-live="polite">{reporting ? 'Enregistrement dans ORBIS…' : reportMessage}</p>{/if}
  <button class="reset" type="button" on:click={reset}>{completed ? 'Construire encore' : 'Effacer et recommencer'}</button>
</section>

<style>
  .construction-lab { margin-top: 1.5rem; border: 1px solid #39546a; border-radius: 1rem; padding: 1.2rem; background: #142334; color: #eaf2fb; }
  h3 { margin: .2rem 0 .5rem; font-size: 1.3rem; }
  p { line-height: 1.5; }
  .construction-board { position: relative; width: min(100%, 360px); aspect-ratio: 5 / 4; margin: .8rem auto; }
  svg { display: block; width: 100%; height: 100%; }
  line { stroke: #50718b; stroke-width: 1.5; }
  polyline, .closing-line { fill: none; stroke: #54d8d5; stroke-width: 4; stroke-linejoin: round; }
  .construction-board button { position: absolute; width: 25px; height: 25px; transform: translate(-50%, -50%); border: 2px solid #ddedf5; border-radius: 50%; background: #17324b; cursor: pointer; }
  .construction-board button:hover, .construction-board button:focus-visible, .construction-board button.selected { background: #54d8d5; border-color: #fff; }
  .construction-board button:focus-visible { outline: 3px solid #f3b64c; outline-offset: 3px; }
  .success { color: #8af0c0; font-weight: 700; }
  .report { font-size: .85rem; color: #b7c3d3; }
  .reset { border: 1px solid #54d8d5; border-radius: .6rem; padding: .55rem .8rem; background: transparent; color: #d7f8f7; cursor: pointer; }
</style>
