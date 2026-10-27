export type MathHuntDifficulty = 'FACILE' | 'ACCRUE';

export interface MathHuntQuestion {
  factorA: number;
  factorB: number;
  correctAnswer: number;
  choices: number[];
}

/** Génère une question de multiplication sans dépendre de l'interface Canvas. */
export function generateQuestion(
  tables: number[] | undefined,
  selectedDifficulty: MathHuntDifficulty
): MathHuntQuestion {
  const availableTables = tables?.length ? tables : Array.from({ length: 12 }, (_, index) => index + 1);
  const table = availableTables[Math.floor(Math.random() * availableTables.length)];
  const multiplier = Math.floor(Math.random() * 12) + 1;
  const swap = Math.random() < 0.5;
  const factorA = swap ? multiplier : table;
  const factorB = swap ? table : multiplier;
  const correctAnswer = factorA * factorB;
  const wrongAnswers = new Set<number>();

  if (selectedDifficulty === 'FACILE') {
    while (wrongAnswers.size < 3) {
      const delta = (Math.floor(Math.random() * 20) + 1) * (Math.random() < 0.5 ? 1 : -1);
      const candidate = Math.max(1, correctAnswer + delta);
      if (candidate !== correctAnswer) wrongAnswers.add(candidate);
    }
  } else {
    const candidates = [
      correctAnswer + 1, correctAnswer - 1,
      correctAnswer + 2, correctAnswer - 2,
      (factorA + 1) * factorB, (factorA - 1) * factorB,
      factorA * (factorB + 1), factorA * (factorB - 1),
      correctAnswer + factorA, correctAnswer - factorB
    ].sort(() => Math.random() - 0.5);

    for (const candidate of candidates) {
      if (candidate > 0 && candidate !== correctAnswer) wrongAnswers.add(candidate);
      if (wrongAnswers.size === 3) break;
    }
    while (wrongAnswers.size < 3) {
      const candidate = Math.max(1, correctAnswer + Math.floor(Math.random() * 10) - 5);
      if (candidate !== correctAnswer) wrongAnswers.add(candidate);
    }
  }

  const choices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  return { factorA, factorB, correctAnswer, choices };
}
