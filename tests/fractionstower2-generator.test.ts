import assert from 'node:assert/strict';
import { ExerciseGenerator } from '../src/lib/games/fractionstower2/engines/ExerciseGenerator';
import { ACTIVE_FLOOR_CURRICULUM } from '../src/lib/games/fractionstower2/data/curriculum';

function compare(a: number, b: number): string {
  return a < b ? '<' : a > b ? '>' : '=';
}

function parseFraction(value: string): [number, number] | null {
  const match = value.match(/^(\d+)\/(\d+)$/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

function assertCalculation(question: string, answer: string, floor: number) {
  const calculation = question.match(/(?:Calcule\s*:\s*|résultat de\s+)(\d+)\/(\d+)\s*([+−×÷])\s*(\d+)\/(\d+)/i);
  if (!calculation) return;
  const [, aText, bText, operation, cText, dText] = calculation;
  const a = Number(aText);
  const b = Number(bText);
  const c = Number(cText);
  const d = Number(dText);
  const result = parseFraction(answer);
  assert.ok(result, `floor ${floor}: calculation answer should be a fraction: ${answer}`);
  const [numerator, denominator] = result;
  const expected = operation === '+' ? a / b + c / d
    : operation === '−' ? a / b - c / d
      : operation === '×' ? (a * c) / (b * d)
        : (a * d) / (b * c);
  assert.ok(Math.abs(numerator / denominator - expected) < 1e-10, `floor ${floor}: answer should match ${question}`);
}

assert.equal(ACTIVE_FLOOR_CURRICULUM.length, 9, 'all nine floors should be active');
assert.equal(ACTIVE_FLOOR_CURRICULUM[8]?.id, 'floor-9', 'floor 9 should be the final active floor');

let visualQuestions = 0;
let thousandthQuestions = 0;

for (let floor = 1; floor <= 9; floor += 1) {
  for (let run = 0; run < 60; run += 1) {
    const session = ExerciseGenerator.generateSession(`floor-${floor}`, 10);
    assert.equal(session.length, 10, `floor ${floor}: every session should contain ten questions`);

    const prompts = session.map((exercise) => `${exercise.type}:${exercise.question.trim().replace(/\s+/g, ' ').toLocaleLowerCase()}`);
    assert.equal(new Set(prompts).size, prompts.length, `floor ${floor}: a session should not repeat a prompt`);
    assert.equal(new Set(session.map((exercise) => exercise.id)).size, session.length, `floor ${floor}: question ids should be unique`);

    for (const exercise of session) {
      if (exercise.type === 'qcm') {
        const options = exercise.options ?? [];
        assert.ok(options.includes(exercise.correctAnswer), `floor ${floor}: QCM must include its answer`);
        assert.equal(new Set(options).size, options.length, `floor ${floor}: QCM choices should be unique`);
      }
      if (exercise.type === 'comparison' && exercise.fractions?.length === 2) {
        const [left, right] = exercise.fractions;
        const expected = compare(left.numerator / left.denominator, right.numerator / right.denominator);
        assert.equal(exercise.correctAnswer, expected, `floor ${floor}: comparison answer must match the values`);
      }
      assertCalculation(exercise.question, exercise.correctAnswer, floor);

      if (exercise.type === 'visual_select') {
        visualQuestions += 1;
        const models = exercise.interactiveData?.visualOptions ?? [];
        const targetNumerator = exercise.interactiveData?.targetParts ?? 0;
        const targetDenominator = exercise.interactiveData?.totalParts ?? 0;
        const correctIndexes = exercise.correctAnswer.split(',').map(Number);
        assert.equal(models.length, 4, 'visual questions should show four models');
        assert.ok(correctIndexes.length >= 1 && correctIndexes.length <= 4, 'one to four images can be correct');
        assert.equal(new Set(correctIndexes).size, correctIndexes.length, 'correct visual indexes should be unique');
        const signatures = models.map((model) => `${model.shape}|${model.partWeights.join(',')}|${model.shadedParts.join(',')}`);
        assert.equal(new Set(signatures).size, 4, 'the four illustrations should be different');

        models.forEach((model, index) => {
          assert.ok(model.partWeights.length >= 2, 'a fraction picture must contain at least two parts');
          assert.ok(model.shadedParts.every((part) => part >= 0 && part < model.partWeights.length), 'shading indexes should be inside the diagram');
          const equalParts = model.partWeights.every((weight) => weight === model.partWeights[0]);
          const representsTarget = equalParts && model.shadedParts.length * targetDenominator === targetNumerator * model.partWeights.length;
          assert.equal(correctIndexes.includes(index), representsTarget, 'only equal partitions with the target amount should be marked correct');
        });
      }

      if (floor === 6 && /1\/1000|1 000/.test(`${exercise.question} ${exercise.correctAnswer}`)) {
        thousandthQuestions += 1;
      }

      const fractionConversion = exercise.question.match(/^Écris (\d+)\/(10|100|1000) sous forme de nombre décimal\.$/);
      if (fractionConversion) {
        const decimal = Number(exercise.correctAnswer.replace(',', '.'));
        assert.equal(decimal, Number(fractionConversion[1]) / Number(fractionConversion[2]), 'floor 6: fraction-to-decimal conversion should be exact');
      }
      const reverseConversion = exercise.question.match(/^Écris (0,\d+) sous forme de fraction décimale\.$/);
      if (reverseConversion) {
        const expected = Number(reverseConversion[1].replace(',', '.'));
        const answerParts = parseFraction(exercise.correctAnswer);
        assert.ok(answerParts, 'floor 6: decimal-to-fraction answer should be a fraction');
        assert.equal(answerParts[0] / answerParts[1], expected, 'floor 6: decimal-to-fraction conversion should be exact');
      }

      const ordering = exercise.question.includes('Range ces trois fractions');
      if (ordering) {
        const ordered = exercise.correctAnswer.split(' < ').map(parseFraction);
        assert.equal(ordered.length, 3, 'floor 5: ordering question should contain three fractions');
        assert.ok(ordered.every(Boolean), 'floor 5: ordering answers should be written as fractions');
        assert.ok(ordered[0]![0] / ordered[0]![1] < ordered[1]![0] / ordered[1]![1]);
        assert.ok(ordered[1]![0] / ordered[1]![1] < ordered[2]![0] / ordered[2]![1]);
      }
    }

    if (floor === 4 || floor === 5 || floor === 8) {
      const outcomes = session.filter((exercise) => exercise.type === 'comparison').map((exercise) => exercise.correctAnswer);
      assert.ok(outcomes.length >= 2, `floor ${floor}: session should include multiple comparisons`);
      assert.ok(new Set(outcomes).size > 1, `floor ${floor}: a comparison session should vary its answers`);
    }

    if (floor === 8) {
      for (const exercise of session.filter((item) => item.type === 'comparison' && item.correctAnswer === '=')) {
        const [left, right] = exercise.fractions ?? [];
        assert.ok(left && right, 'floor 8: equality questions should carry both fractions');
        assert.notEqual(
          `${left.numerator}/${left.denominator}`,
          `${right.numerator}/${right.denominator}`,
          'floor 8: equivalent fractions should use different written forms'
        );
      }
    }

    if (floor === 1 || floor === 2) {
      assert.ok(session.some((exercise) => exercise.type === 'visual_select'), `floor ${floor}: session should include the equal-parts image activity`);
    }
    if (floor === 3) {
      assert.ok(session.every((exercise) => exercise.type !== 'visual_select'), 'floor 3 should keep its visuals focused on the number line');
    }
  }
}

assert.ok(visualQuestions > 0, 'early floors should generate image-selection questions');
assert.ok(thousandthQuestions > 0, 'floor 6 should generate millièmes');

console.log('Fraction Tower generator: 540 sessions passed curriculum, prompt, answer, visual, and comparison checks.');
