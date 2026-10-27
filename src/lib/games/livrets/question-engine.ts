export interface MultiplicationQuestion {
  factorA: number;
  factorB: number;
  expected: number;
}

/** Le tirage des livrets est isolé de l’écran et garde le même intervalle. */
export function generateMultiplicationQuestion(selectedTables: number[]): MultiplicationQuestion | null {
  if (selectedTables.length === 0) return null;
  const factorA = selectedTables[Math.floor(Math.random() * selectedTables.length)];
  const factorB = Math.floor(Math.random() * 10) + 1;
  return { factorA, factorB, expected: factorA * factorB };
}
