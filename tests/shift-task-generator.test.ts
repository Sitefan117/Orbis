import assert from 'node:assert/strict';
import { DIFFICULTIES, MISSIONS } from '../src/lib/games/shift/config';
import { createShiftTask } from '../src/lib/games/shift/task-generator';

// La génération doit rester indépendante de la page et produire une tâche
// exploitable pour chaque mission et chaque niveau.
for (const difficulty of DIFFICULTIES) {
  for (const mission of MISSIONS) {
    for (let sample = 0; sample < 100; sample += 1) {
      const task = createShiftTask(mission.id, difficulty.id, difficulty.maxInteger);
      assert.ok(task, `${mission.id}/${difficulty.id}: tâche absente`);
      assert.equal(task.type, mission.id, `${mission.id}/${difficulty.id}: type inattendu`);
      assert.ok(task.prompt, `${mission.id}/${difficulty.id}: consigne absente`);
      if (task.type === 'measure') {
        assert.ok(typeof task.expected === 'number' && Number.isFinite(task.expected) && task.expected > 0, 'conversion invalide');
      }
      if (task.type === 'sort') {
        assert.equal(new Set(task.values).size, 4, 'les quatre nombres doivent être distincts');
      }
    }
  }
}

console.log('Shift : tâches générées pour 8 missions × 4 niveaux × 100 essais.');
